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
 *
 * Supports resampling to target sample rate (default 24kHz for OpenAI Realtime API).
 */
export class FileAudioCaptureAdapter implements AudioCapturePort {
  private _state: AudioCaptureState = {
    isCapturing: false,
    source: null,
    sampleRate: 24000, // Default to 24kHz (OpenAI Realtime API requirement)
    channelCount: 1,
    error: null,
  };
  private handlers = new Set<AudioEventHandler>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private audioData: Float32Array | null = null;
  private offset = 0;
  private chunkSize = 7200; // 300ms at 24kHz

  constructor(private readonly filePath?: string) {}

  /**
   * Resample audio using linear interpolation.
   * Converts from source sample rate to target sample rate.
   */
  private resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return input;

    const ratio = fromRate / toRate;
    const outputLength = Math.ceil(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
      const t = srcIndex - srcIndexFloor;
      output[i] = (input[srcIndexFloor] ?? 0) * (1 - t) + (input[srcIndexCeil] ?? 0) * t;
    }

    return output;
  }

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

  private startFromFile(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    // Target sample rate: use config or default to 24kHz (OpenAI Realtime API requirement)
    const targetSampleRate = config?.sampleRate ?? 24000;

    if (!this.filePath && !this.audioData) {
      // No file and no injected data — emit silence (useful for tests)
      this._state = { ...this._state, isCapturing: true, source: 'microphone', sampleRate: targetSampleRate };
      this.chunkSize = Math.floor(targetSampleRate * 0.3); // 300ms chunks
      return Promise.resolve(ok(undefined));
    }

    // If audio was injected directly, just start emitting
    if (!this.filePath && this.audioData) {
      this._state = { ...this._state, isCapturing: true, source: 'microphone', sampleRate: targetSampleRate };
      this.chunkSize = Math.floor(targetSampleRate * 0.3); // 300ms chunks
      this.offset = 0;
      this.timer = setInterval(() => { this.emitNextChunk(); }, 300);
      return Promise.resolve(ok(undefined));
    }

    try {
      const filePath = this.filePath as string;
      const buffer = readFileSync(filePath);

      // Parse WAV header to get source sample rate
      // WAV format: bytes 24-27 contain sample rate (little-endian uint32)
      const fileSampleRate = buffer.readUInt32LE(24);

      // Skip WAV header (44 bytes) and convert to Float32
      const pcm16 = new Int16Array(buffer.buffer, buffer.byteOffset + 44, (buffer.length - 44) / 2);
      const sourceAudio = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        const sample = pcm16[i] ?? 0;
        sourceAudio[i] = sample / (sample < 0 ? 0x8000 : 0x7fff);
      }

      // Resample if source rate differs from target rate
      this.audioData = fileSampleRate !== targetSampleRate
        ? this.resample(sourceAudio, fileSampleRate, targetSampleRate)
        : sourceAudio;
      this.offset = 0;

      // Update state with target sample rate
      this._state = { ...this._state, isCapturing: true, source: 'microphone', sampleRate: targetSampleRate };
      this.chunkSize = Math.floor(targetSampleRate * 0.3); // 300ms chunks

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
      // Emit ended event before stopping
      for (const handler of this.handlers) {
        try {
          handler({ type: 'ended', timestamp: Date.now() });
        } catch {
          // Ignore
        }
      }
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
