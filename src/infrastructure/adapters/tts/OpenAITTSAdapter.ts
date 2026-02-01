/**
 * OpenAI TTS Adapter
 * Implements TTSPort using OpenAI's Text-to-Speech REST API
 *
 * Uses the gpt-4o-mini-tts model which supports:
 * - 13 voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar
 * - PCM output format (24kHz, 16-bit signed, little-endian)
 * - Instructions parameter for tone customization
 * - Speed control (0.25 - 4.0)
 */
import type { TTSVoice } from '@domain/settings';
import { ok, err, type Result } from '@domain/shared';

import type { TTSPort, TTSError, SpeakOptions } from '@application/ports';

const TTS_API_URL = 'https://api.openai.com/v1/audio/speech';
const TTS_MODEL = 'gpt-4o-mini-tts';
const TTS_SAMPLE_RATE = 24000; // OpenAI PCM output is 24kHz
const MAX_TEXT_LENGTH = 4096;

const DEFAULT_INSTRUCTIONS = 'Speak like a supportive meeting coach, calm and encouraging. Keep the tone professional but warm.';

export class OpenAITTSAdapter implements TTSPort {
  private enabled = false;
  private volume = 0.8;
  private voice: TTSVoice = 'coral';
  private speed = 1.0;
  private apiKey: string | null = null;
  private playing = false;

  // Audio playback
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioQueue: AudioBuffer[] = [];

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: TTS_SAMPLE_RATE });
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  async speak(text: string, options?: SpeakOptions): Promise<Result<void, TTSError>> {
    if (!this.enabled) {
      return ok(undefined);
    }

    if (!this.apiKey) {
      return err({
        code: 'UNAUTHORIZED',
        message: 'OpenAI API key not configured',
      });
    }

    if (!text || text.trim().length === 0) {
      return err({
        code: 'INVALID_INPUT',
        message: 'Text cannot be empty',
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return err({
        code: 'INVALID_INPUT',
        message: `Text exceeds maximum length of ${String(MAX_TEXT_LENGTH)} characters`,
      });
    }

    const voice = options?.voice ?? this.voice;
    const speed = options?.speed ?? this.speed;
    const instructions = options?.instructions ?? DEFAULT_INSTRUCTIONS;

    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: TTS_MODEL,
          input: text,
          voice,
          response_format: 'pcm',
          speed,
          instructions,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return err({
            code: 'UNAUTHORIZED',
            message: 'Invalid API key',
          });
        }
        if (response.status === 429) {
          return err({
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded',
          });
        }
        return err({
          code: 'API_ERROR',
          message: `API error: ${response.status.toString()} ${response.statusText}`,
        });
      }

      // Get the PCM audio data
      const arrayBuffer = await response.arrayBuffer();

      // Convert PCM16 to AudioBuffer
      const audioBuffer = this.pcm16ToAudioBuffer(arrayBuffer);
      if (!audioBuffer) {
        return err({
          code: 'PLAYBACK_ERROR',
          message: 'Failed to decode audio',
        });
      }

      // Queue and play
      this.queueAudio(audioBuffer, options?.volume);

      return ok(undefined);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return err({
          code: 'NETWORK_ERROR',
          message: 'Network error - check your connection',
        });
      }
      return err({
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private pcm16ToAudioBuffer(arrayBuffer: ArrayBuffer): AudioBuffer | null {
    try {
      const ctx = this.getAudioContext();

      // PCM16 is 16-bit signed little-endian
      const int16Array = new Int16Array(arrayBuffer);
      const float32Array = new Float32Array(int16Array.length);

      // Convert PCM16 to float32 (-1.0 to 1.0)
      for (let i = 0; i < int16Array.length; i++) {
        const sample = int16Array[i];
        if (sample !== undefined) {
          float32Array[i] = sample / 32768;
        }
      }

      // Create AudioBuffer (mono, 24kHz)
      const audioBuffer = ctx.createBuffer(1, float32Array.length, TTS_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32Array);

      return audioBuffer;
    } catch {
      return null;
    }
  }

  private queueAudio(buffer: AudioBuffer, volume?: number): void {
    // Apply volume override if provided
    if (volume !== undefined && this.gainNode) {
      this.gainNode.gain.value = volume;
    } else if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }

    this.audioQueue.push(buffer);

    if (!this.playing) {
      void this.playNextInQueue();
    }
  }

  private async playNextInQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.playing = false;
      return;
    }

    this.playing = true;
    const buffer = this.audioQueue.shift();
    if (!buffer) {
      this.playing = false;
      return;
    }

    const ctx = this.getAudioContext();

    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (!this.gainNode) {
      this.playing = false;
      return;
    }

    // Create and configure source
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    this.currentSource = source;

    // Set up completion handler
    source.onended = () => {
      this.currentSource = null;
      void this.playNextInQueue();
    };

    // Start playback
    source.start();
  }

  stop(): void {
    // Clear queue
    this.audioQueue = [];

    // Stop current audio
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Source may already be stopped
      }
      this.currentSource = null;
    }

    this.playing = false;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setVoice(voice: TTSVoice): void {
    this.voice = voice;
  }

  getVoice(): TTSVoice {
    return this.voice;
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0.25, Math.min(4.0, speed));
  }

  getSpeed(): number {
    return this.speed;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  setApiKey(apiKey: string | null): void {
    this.apiKey = apiKey;
  }
}
