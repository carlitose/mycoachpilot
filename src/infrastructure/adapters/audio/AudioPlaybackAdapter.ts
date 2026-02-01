/**
 * Audio Playback Adapter
 * Plays AI voice responses using Web Audio API
 */
import type { AudioPlaybackPort } from '@application/ports';

export class AudioPlaybackAdapter implements AudioPlaybackPort {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private audioQueue: { buffer: AudioBuffer; sampleRate: number }[] = [];
  private isPlayingAudio = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private volume = 0.8;
  private enabled = true;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  queueAudio(audio: Int16Array, sampleRate: number): void {
    if (!this.enabled) return;

    const ctx = this.getAudioContext();

    // Convert PCM16 (Int16Array) to Float32Array for Web Audio API
    const float32 = this.pcm16ToFloat32(audio);

    // Create AudioBuffer
    const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    // Add to queue
    this.audioQueue.push({ buffer: audioBuffer, sampleRate });

    // Start playback if not already playing
    if (!this.isPlayingAudio) {
      void this.playNextInQueue();
    }
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

  stop(): void {
    this.clearQueue();
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Source may already be stopped
      }
      this.currentSource = null;
    }
    this.isPlayingAudio = false;
  }

  clearQueue(): void {
    this.audioQueue = [];
  }

  isPlaying(): boolean {
    return this.isPlayingAudio;
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

  private async playNextInQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const queueItem = this.audioQueue.shift();
    if (!queueItem) {
      this.isPlayingAudio = false;
      return;
    }
    const { buffer } = queueItem;

    const ctx = this.getAudioContext();

    // Resume audio context if suspended (required by browser autoplay policies)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // gainNode is guaranteed to exist after getAudioContext() is called
    if (!this.gainNode) {
      this.isPlayingAudio = false;
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

  /**
   * Convert PCM16 (Int16Array) to Float32Array
   * PCM16 range: -32768 to 32767
   * Float32 range: -1.0 to 1.0
   */
  private pcm16ToFloat32(pcm16: Int16Array): Float32Array {
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      // Normalize to -1.0 to 1.0 range
      const sample = pcm16[i];
      if (sample !== undefined) {
        float32[i] = sample / 32768;
      }
    }
    return float32;
  }
}
