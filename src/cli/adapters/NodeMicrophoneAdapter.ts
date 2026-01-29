import {
  MicrophoneRecorder,
  SystemAudioRecorder,
  listAudioDevices,
  getDefaultInputDevice,
  ensureMicrophonePermission,
  ensureSystemAudioPermission,
} from 'coreaudio-node';

import type {
  AudioCapturePort,
  AudioCaptureState,
  AudioDataEvent,
  AudioEvent,
  AudioEventHandler,
  AudioSourceType,
} from '../../application/ports/AudioCapturePort';
import type { AudioConfigProps } from '../../domain/session/valueObjects/AudioConfig';
import { ok, err } from '../../domain/shared/Result';
import type { Result } from '../../domain/shared/Result';

export interface AudioDeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
  isInput: boolean;
  isOutput: boolean;
  sampleRate: number;
  channelCount: number;
}

export type LiveAudioSourceType = 'microphone' | 'system' | 'mixed';

/**
 * Native macOS audio capture adapter using coreaudio-node.
 * Supports microphone, system audio, and mixed (both) capture modes.
 * Requires macOS 14.4+ for system audio capture.
 */
export class NodeMicrophoneAdapter implements AudioCapturePort {
  private _state: AudioCaptureState = {
    isCapturing: false,
    source: null,
    sampleRate: 24000, // Default to 24kHz (OpenAI Realtime API requirement)
    channelCount: 1,
    error: null,
  };

  private handlers = new Set<AudioEventHandler>();
  private micRecorder: MicrophoneRecorder | null = null;
  private systemRecorder: SystemAudioRecorder | null = null;
  private isPaused = false;
  private lastPcm16Data: Int16Array | null = null;

  /**
   * List available audio input devices.
   */
  static listInputDevices(): AudioDeviceInfo[] {
    const devices = listAudioDevices();
    return devices.filter((d) => d.isInput).map((d) => ({
      id: d.id,
      name: d.name,
      isDefault: d.isDefault,
      isInput: d.isInput,
      isOutput: d.isOutput,
      sampleRate: d.sampleRate,
      channelCount: d.channelCount,
    }));
  }

  /**
   * Get the default input device ID.
   */
  static getDefaultInputDeviceId(): string | null {
    return getDefaultInputDevice() ?? null;
  }

  getState(): AudioCaptureState {
    return this._state;
  }

  async startMicrophone(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    return this.startCapture('microphone', config);
  }

  async startTabAudio(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    return this.startCapture('system', config);
  }

  async startMixed(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    return this.startCapture('mixed', config);
  }

  private async startCapture(
    source: LiveAudioSourceType,
    config?: Partial<AudioConfigProps>,
  ): Promise<Result<void, Error>> {
    const targetSampleRate = config?.sampleRate ?? 24000;
    const chunkDurationMs = 100; // 100ms chunks for low latency

    try {
      // Request permissions based on source
      if (source === 'microphone' || source === 'mixed') {
        try {
          await ensureMicrophonePermission();
        } catch {
          return err(new Error('Microphone permission denied. Please grant access in System Settings > Privacy & Security > Microphone'));
        }
      }

      if (source === 'system' || source === 'mixed') {
        try {
          await ensureSystemAudioPermission();
        } catch {
          return err(new Error(
            'System audio permission denied. Please enable "System Audio Recording Only" in System Settings > Privacy & Security > Screen & System Audio Recording. Requires macOS 14.4+',
          ));
        }
      }

      // Create recorders based on source type
      if (source === 'microphone' || source === 'mixed') {
        this.micRecorder = new MicrophoneRecorder({
          sampleRate: targetSampleRate,
          chunkDurationMs,
          stereo: false,
          gain: 1.0,
        });

        this.micRecorder.on('data', (chunk) => {
          if (!this.isPaused) {
            this.handleAudioData(chunk.data, targetSampleRate, 'microphone');
          }
        });

        this.micRecorder.on('error', (error) => {
          this._state = { ...this._state, error: error.message };
        });
      }

      if (source === 'system' || source === 'mixed') {
        this.systemRecorder = new SystemAudioRecorder({
          sampleRate: targetSampleRate,
          chunkDurationMs,
          stereo: false,
          mute: false, // Don't mute system audio
        });

        this.systemRecorder.on('data', (chunk) => {
          if (!this.isPaused) {
            this.handleAudioData(chunk.data, targetSampleRate, 'system');
          }
        });

        this.systemRecorder.on('error', (error) => {
          this._state = { ...this._state, error: error.message };
        });
      }

      // Start recorders
      if (this.micRecorder) {
        await this.micRecorder.start();
      }
      if (this.systemRecorder) {
        await this.systemRecorder.start();
      }

      // Map source type to AudioSourceType
      const audioSource: AudioSourceType = source === 'system' ? 'tab' : source;

      this._state = {
        isCapturing: true,
        source: audioSource,
        sampleRate: targetSampleRate,
        channelCount: 1,
        error: null,
      };
      this.isPaused = false;

      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Handle incoming audio data from recorders.
   * Converts Int16 PCM to Float32Array for compatibility with the pipeline.
   */
  private handleAudioData(
    data: Buffer,
    sampleRate: number,
    _source: 'microphone' | 'system',
  ): void {
    // coreaudio-node outputs Int16 PCM when sampleRate is specified
    const int16Array = new Int16Array(
      data.buffer,
      data.byteOffset,
      data.length / 2,
    );

    // Store raw PCM16 data
    this.lastPcm16Data = int16Array;

    // Convert Int16 to Float32 for compatibility with existing pipeline
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      const sample = int16Array[i] ?? 0;
      // Normalize to -1.0 to 1.0 range
      float32Array[i] = sample / (sample < 0 ? 0x8000 : 0x7fff);
    }

    const event: AudioDataEvent = {
      type: 'audio',
      data: float32Array,
      sampleRate,
      timestamp: Date.now(),
    };

    this.emit(event);
  }

  private emit(event: AudioEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }

  stop(): void {
    if (this.micRecorder) {
      this.micRecorder.stop().catch(() => {
        // Ignore stop errors
      });
      this.micRecorder = null;
    }

    if (this.systemRecorder) {
      this.systemRecorder.stop().catch(() => {
        // Ignore stop errors
      });
      this.systemRecorder = null;
    }

    // Emit ended event
    this.emit({ type: 'ended', timestamp: Date.now() });

    this._state = {
      ...this._state,
      isCapturing: false,
      source: null,
    };
    this.isPaused = false;
    this.lastPcm16Data = null;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  onAudioEvent(handler: AudioEventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  getPCM16Data(): Int16Array | null {
    return this.lastPcm16Data;
  }
}
