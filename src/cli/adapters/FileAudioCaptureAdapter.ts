import { readFileSync } from 'node:fs';

import type {
  AudioCapturePort,
  AudioCaptureState,
  AudioEvent,
  AudioEventHandler,
} from '../../application/ports/AudioCapturePort';
import type { AudioConfigProps } from '../../domain/session/valueObjects/AudioConfig';
import { ok, err } from '../../domain/shared/Result';
import type { Result } from '../../domain/shared/Result';

/**
 * Reads audio from a WAV file and emits chunks at regular intervals.
 * For testing and CLI use.
 */
export class FileAudioCaptureAdapter implements AudioCapturePort {
  private _state: AudioCaptureState = {
    isCapturing: false,
    source: null,
    sampleRate: 16000,
    channelCount: 1,
    error: null,
  };
  private handlers = new Set<AudioEventHandler>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private audioData: Float32Array | null = null;
  private offset = 0;
  private chunkSize = 4800; // 300ms at 16kHz

  constructor(private readonly filePath?: string) {}

  getState(): AudioCaptureState {
    return this._state;
  }

  async startMicrophone(_config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    return this.startFromFile(_config);
  }

  async startTabAudio(_config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    return this.startFromFile(_config);
  }

  async startMixed(_config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    return this.startFromFile(_config);
  }

  private startFromFile(_config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    if (!this.filePath && !this.audioData) {
      // No file and no injected data — emit silence (useful for tests)
      this._state = { ...this._state, isCapturing: true, source: 'microphone' };
      return Promise.resolve(ok(undefined));
    }

    // If audio was injected directly, just start emitting
    if (!this.filePath && this.audioData) {
      this._state = { ...this._state, isCapturing: true, source: 'microphone' };
      this.offset = 0;
      this.timer = setInterval(() => { this.emitNextChunk(); }, 300);
      return Promise.resolve(ok(undefined));
    }

    try {
      const filePath = this.filePath as string;
      const buffer = readFileSync(filePath);
      // Skip WAV header (44 bytes) and convert to Float32
      const pcm16 = new Int16Array(buffer.buffer, 44);
      this.audioData = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        const sample = pcm16[i] ?? 0;
        this.audioData[i] = sample / (sample < 0 ? 0x8000 : 0x7fff);
      }
      this.offset = 0;

      this._state = { ...this._state, isCapturing: true, source: 'microphone' };

      // Emit chunks on an interval
      this.timer = setInterval(() => {
        this.emitNextChunk();
      }, 300);

      return Promise.resolve(ok(undefined));
    } catch (e) {
      return Promise.resolve(err(e instanceof Error ? e : new Error(String(e))));
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this._state = { ...this._state, isCapturing: false, source: null };
  }

  pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resume(): void {
    if (this.audioData && !this.timer) {
      this.timer = setInterval(() => {
        this.emitNextChunk();
      }, 300);
    }
  }

  onAudioEvent(handler: AudioEventHandler): () => void {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }

  getPCM16Data(): Int16Array | null {
    return null;
  }

  /**
   * Inject audio data directly (for testing without files)
   */
  injectAudio(data: Float32Array): void {
    this.audioData = data;
    this.offset = 0;
  }

  private emitNextChunk(): void {
    if (!this.audioData) return;
    if (this.offset >= this.audioData.length) {
      this.stop();
      return;
    }

    const end = Math.min(this.offset + this.chunkSize, this.audioData.length);
    const chunk = this.audioData.slice(this.offset, end);
    this.offset = end;

    const event: AudioEvent = {
      type: 'audio',
      data: chunk,
      sampleRate: this._state.sampleRate,
      timestamp: Date.now(),
    };

    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch {
        // Ignore
      }
    }
  }
}
