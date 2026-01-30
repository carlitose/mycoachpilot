import {
  MicrophoneRecorder,
  SystemAudioRecorder,
  ensureMicrophonePermission,
  ensureSystemAudioPermission,
} from 'coreaudio-node';

import type {
  AudioCapturePort,
  AudioCaptureState,
  AudioChannelType,
  AudioEvent,
  AudioEventHandler,
  AudioSourceType,
} from '../../application/ports/AudioCapturePort';
import type { AudioConfigProps } from '../../domain/session/valueObjects/AudioConfig';
import { ok, err } from '../../domain/shared/Result';
import type { Result } from '../../domain/shared/Result';

import {
  type AudioDeviceInfo,
  debugAudio as debug,
  withTimeout,
  PERMISSION_TIMEOUT_MS,
  RECORDER_START_TIMEOUT_MS,
  listInputDevices,
  getDefaultInputDeviceId,
  convertPcmToAudioEvent,
  findDeviceByName,
  detectBlackHoleDevices,
  getBlackHoleInstructions,
  int16ToFloat32,
} from './audioUtils';
import { FfmpegAudioAdapter } from './FfmpegAudioAdapter';

export type { AudioDeviceInfo };
export type LiveAudioSourceType = 'microphone' | 'system' | 'mixed';

export interface NodeMicrophoneAdapterOptions {
  /** Input device ID or name for microphone capture. */
  inputDevice?: string | undefined;
  /** System device ID or name for system audio (e.g., "BlackHole 2ch"). */
  systemDevice?: string | undefined;
}

/** Native macOS audio capture adapter using coreaudio-node and FFmpeg. */
export class NodeMicrophoneAdapter implements AudioCapturePort {
  private _state: AudioCaptureState = { isCapturing: false, source: null, sampleRate: 24000, channelCount: 1, error: null };
  private handlers = new Set<AudioEventHandler>();
  private micRecorder: MicrophoneRecorder | null = null;
  private systemRecorder: SystemAudioRecorder | null = null;
  private ffmpegAdapter: FfmpegAudioAdapter | null = null;
  private ffmpegUnsubscribe: (() => void) | null = null;
  private isPaused = false;
  private lastPcm16Data: Int16Array | null = null;
  private inputDeviceId: string | null = null;
  private systemDeviceId: string | null = null;
  private systemDeviceName: string | null = null;

  static listInputDevices = listInputDevices;
  static getDefaultInputDeviceId = getDefaultInputDeviceId;
  static detectBlackHoleDevices = detectBlackHoleDevices;
  static findDeviceByName = findDeviceByName;

  constructor(options?: NodeMicrophoneAdapterOptions) {
    this.inputDeviceId = this.resolveDevice(options?.inputDevice, 'Input');
    this.systemDeviceId = this.resolveDevice(options?.systemDevice, 'System');
    // Store original device name for FFmpeg (uses name, not ID)
    this.systemDeviceName = options?.systemDevice ?? null;
  }

  private resolveDevice(device: string | undefined, label: string): string | null {
    if (!device) return null;
    const found = findDeviceByName(device);
    if (found) {
      debug(`${label} device resolved: "${device}" → ID: ${found.id} (${found.name})`);
      return found.id;
    }
    debug(`${label} device set to ID: ${device}`);
    return device;
  }

  getState(): AudioCaptureState { return this._state; }
  async startMicrophone(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> { return this.startCapture('microphone', config); }
  async startTabAudio(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> { return this.startCapture('system', config); }
  async startMixed(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> { return this.startCapture('mixed', config); }

  private async startCapture(source: LiveAudioSourceType, config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    const targetSampleRate = config?.sampleRate ?? 48000; // Native 48kHz for quality
    const chunkDurationMs = 100;
    let systemAudioFailed = false;

    debug(`Starting capture with source: ${source}, sampleRate: ${String(targetSampleRate)}`);

    try {
      // Request permissions
      if (source === 'microphone' || source === 'mixed') {
        const permResult = await this.requestPermission(ensureMicrophonePermission, 'Microphone');
        if (!permResult.ok) return err(new Error('Microphone permission denied. Grant access in System Settings > Privacy & Security > Microphone'));
      }

      // Only request system audio permission if NOT using BlackHole (systemDeviceId)
      // BlackHole is a regular input device and doesn't need TCC permissions
      if ((source === 'system' || source === 'mixed') && !this.systemDeviceId) {
        const permResult = await this.requestPermission(ensureSystemAudioPermission, 'System audio');
        if (!permResult.ok) {
          if (source === 'mixed') {
            process.stderr.write('\n⚠️  System audio permission denied. Falling back to microphone only.\n\n' + getBlackHoleInstructions() + '\n\n');
            systemAudioFailed = true;
          } else {
            process.stderr.write('\n' + getBlackHoleInstructions() + '\n\n');
            return err(new Error('System audio permission denied. Use --system-device "BlackHole 2ch" as an alternative.'));
          }
        }
      }

      // Create recorders
      if (source === 'microphone' || source === 'mixed') {
        this.micRecorder = this.createMicRecorder(targetSampleRate, chunkDurationMs, this.inputDeviceId, 'microphone');
      }

      if ((source === 'system' || source === 'mixed') && !systemAudioFailed) {
        const sysResult = this.createSystemRecorder(source, targetSampleRate, chunkDurationMs);
        if (!sysResult.ok) return err(sysResult.error);
      }

      // Start recorders
      const startResult = await this.startRecorders(source);
      if (!startResult.ok) return err(startResult.error);

      // Determine final audio source
      const hasSystemAudio = this.systemRecorder !== null || this.ffmpegAdapter !== null;
      const audioSource: AudioSourceType = source === 'system' ? 'tab' : (source === 'mixed' && !hasSystemAudio ? 'microphone' : source);

      this._state = { isCapturing: true, source: audioSource, sampleRate: targetSampleRate, channelCount: 1, error: null };
      this.isPaused = false;
      debug(`Capture started successfully with source: ${audioSource}`);
      return ok(undefined);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      debug(`Unexpected error during capture start: ${errorMsg}`);
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private async requestPermission(permFn: () => Promise<void>, label: string): Promise<{ ok: boolean }> {
    debug(`Requesting ${label} permission...`);
    try {
      await withTimeout(permFn(), PERMISSION_TIMEOUT_MS, `${label} permission request`);
      debug(`${label} permission granted`);
      return { ok: true };
    } catch (e) {
      debug(`${label} permission failed: ${e instanceof Error ? e.message : String(e)}`);
      return { ok: false };
    }
  }

  private createMicRecorder(sampleRate: number, chunkMs: number, deviceId: string | null, channel: AudioChannelType): MicrophoneRecorder {
    debug('Creating MicrophoneRecorder...');
    const opts: { sampleRate: number; chunkDurationMs: number; stereo: boolean; gain: number; deviceId?: string } = {
      sampleRate, chunkDurationMs: chunkMs, stereo: false, gain: 1.0,
    };
    if (deviceId) { opts.deviceId = deviceId; debug(`Using input device ID: ${deviceId}`); }

    const recorder = new MicrophoneRecorder(opts);
    recorder.on('data', (chunk) => { if (!this.isPaused) this.handleAudioData(chunk.data, sampleRate, channel); });
    recorder.on('error', (error) => { debug(`MicrophoneRecorder error: ${error.message}`); this._state = { ...this._state, error: error.message }; });
    debug('MicrophoneRecorder created');
    return recorder;
  }

  private createSystemRecorder(source: LiveAudioSourceType, sampleRate: number, chunkMs: number): { ok: true } | { ok: false; error: Error } {
    if (this.systemDeviceId && this.systemDeviceName) {
      // Use FFmpeg for BlackHole/virtual audio devices
      // FFmpeg handles virtual audio devices more reliably than coreaudio-node
      debug(`Creating FFmpeg adapter for system audio with device: ${this.systemDeviceName}...`);
      try {
        this.ffmpegAdapter = new FfmpegAudioAdapter();
        // FFmpeg outputs at 24kHz directly (no resampling needed)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        debug(`Failed to create FFmpeg adapter: ${msg}`);
        if (source === 'mixed') { process.stderr.write(`\n⚠️  Failed to initialize FFmpeg for system audio via ${this.systemDeviceName}: ${msg}\n   Falling back to microphone only.\n\n`); }
        else return { ok: false, error: new Error(`Failed to initialize system audio capture: ${msg}`) };
      }
    } else if (this.systemDeviceId) {
      // Fallback: systemDeviceId set but no name - shouldn't happen normally
      debug(`Warning: systemDeviceId set but no systemDeviceName, skipping system audio`);
      if (source !== 'mixed') {
        return { ok: false, error: new Error('System device name required for system audio capture') };
      }
    } else {
      debug('Creating SystemAudioRecorder...');
      try {
        this.systemRecorder = new SystemAudioRecorder({ sampleRate, chunkDurationMs: chunkMs, stereo: false, mute: false });
        this.systemRecorder.on('data', (chunk) => { if (!this.isPaused) this.handleAudioData(chunk.data, sampleRate, 'system'); });
        this.systemRecorder.on('error', (error) => { debug(`SystemAudioRecorder error: ${error.message}`); this._state = { ...this._state, error: error.message }; });
        debug('SystemAudioRecorder created');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        debug(`Failed to create SystemAudioRecorder: ${msg}`);
        if (source === 'mixed') { process.stderr.write(`\n⚠️  Failed to initialize system audio capture: ${msg}\n   Falling back to microphone only.\n\n`); }
        else return { ok: false, error: new Error(`Failed to initialize system audio capture: ${msg}`) };
      }
    }
    return { ok: true };
  }

  private async startRecorders(source: LiveAudioSourceType): Promise<{ ok: true } | { ok: false; error: Error }> {
    if (this.micRecorder) {
      debug('Starting MicrophoneRecorder...');
      try {
        await withTimeout(this.micRecorder.start(), RECORDER_START_TIMEOUT_MS, 'MicrophoneRecorder.start');
        debug('MicrophoneRecorder started successfully');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        debug(`MicrophoneRecorder start failed: ${msg}`);
        this.micRecorder = null;
        return { ok: false, error: new Error(`Failed to start microphone capture: ${msg}`) };
      }
    }

    if (this.ffmpegAdapter && this.systemDeviceName) {
      const result = await this.startFfmpegAdapter(source);
      if (!result.ok) { if (source === 'system') return result; this.ffmpegAdapter = null; }
    }

    if (this.systemRecorder) {
      const result = await this.startSingleRecorder(this.systemRecorder, 'SystemAudioRecorder', source);
      if (!result.ok) { if (source === 'system') return result; this.systemRecorder = null; }
    }

    if (!this.micRecorder && !this.systemRecorder && !this.ffmpegAdapter) {
      debug('No working recorders available');
      return { ok: false, error: new Error('No audio capture available. Both microphone and system audio failed to initialize.') };
    }
    return { ok: true };
  }

  private async startFfmpegAdapter(source: LiveAudioSourceType): Promise<{ ok: true } | { ok: false; error: Error }> {
    if (!this.ffmpegAdapter || !this.systemDeviceName) {
      return { ok: false, error: new Error('FFmpeg adapter not initialized') };
    }

    debug(`Starting FFmpeg adapter for device: ${this.systemDeviceName}...`);
    try {
      await this.ffmpegAdapter.start(this.systemDeviceName);

      // Subscribe to FFmpeg audio output
      // FFmpeg outputs Int16 at 24kHz - convert to Float32 for compatibility
      this.ffmpegUnsubscribe = this.ffmpegAdapter.onAudio((int16) => {
        if (!this.isPaused) {
          const float32 = int16ToFloat32(int16);
          this.lastPcm16Data = int16;
          // Emit with sampleRate=24000 (FFmpeg already outputs at 24kHz)
          this.emit({
            type: 'audio',
            data: float32,
            sampleRate: 24000,
            timestamp: Date.now(),
            channel: 'system',
          });
        }
      });

      debug('FFmpeg adapter started successfully');
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      debug(`FFmpeg adapter start failed: ${msg}`);
      if (source === 'mixed' && this.micRecorder) {
        process.stderr.write(`\n⚠️  Failed to start FFmpeg for system audio: ${msg}\n   Continuing with microphone only.\n\n`);
      }
      return { ok: false, error: new Error(`Failed to start system audio capture via FFmpeg: ${msg}`) };
    }
  }

  private async startSingleRecorder(recorder: MicrophoneRecorder | SystemAudioRecorder, name: string, source: LiveAudioSourceType): Promise<{ ok: true } | { ok: false; error: Error }> {
    debug(`Starting ${name}...`);
    try {
      await withTimeout(recorder.start(), RECORDER_START_TIMEOUT_MS, `${name}.start`);
      debug(`${name} started successfully`);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      debug(`${name} start failed: ${msg}`);
      if (source === 'mixed' && this.micRecorder) {
        process.stderr.write(`\n⚠️  Failed to start system audio capture via ${name}: ${msg}\n   Continuing with microphone only.\n\n`);
      }
      return { ok: false, error: new Error(`Failed to start system audio capture: ${msg}`) };
    }
  }

  private handleAudioData(data: Buffer, sampleRate: number, channel?: AudioChannelType): void {
    const { int16Array, event } = convertPcmToAudioEvent(data, sampleRate);
    this.lastPcm16Data = int16Array;
    this.emit(channel ? { ...event, channel } : event);
  }

  private emit(event: AudioEvent): void {
    for (const handler of this.handlers) { try { handler(event); } catch { /* ignore */ } }
  }

  stop(): void {
    this.micRecorder?.stop().catch(() => { /* ignore */ });
    this.micRecorder = null;
    this.systemRecorder?.stop().catch(() => { /* ignore */ });
    this.systemRecorder = null;
    // Stop FFmpeg adapter for system audio
    if (this.ffmpegUnsubscribe) {
      this.ffmpegUnsubscribe();
      this.ffmpegUnsubscribe = null;
    }
    this.ffmpegAdapter?.stop();
    this.ffmpegAdapter = null;
    this.emit({ type: 'ended', timestamp: Date.now() });
    this._state = { ...this._state, isCapturing: false, source: null };
    this.isPaused = false;
    this.lastPcm16Data = null;
  }

  pause(): void { this.isPaused = true; }
  resume(): void { this.isPaused = false; }
  getPCM16Data(): Int16Array | null { return this.lastPcm16Data; }

  onAudioEvent(handler: AudioEventHandler): () => void {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }
}
