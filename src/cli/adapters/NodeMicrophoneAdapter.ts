import {
  MicrophoneRecorder,
  SystemAudioRecorder,
  ensureMicrophonePermission,
  ensureSystemAudioPermission,
} from 'coreaudio-node';

import type {
  AudioCapturePort,
  AudioCaptureState,
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
} from './audioUtils';

export type { AudioDeviceInfo };

export type LiveAudioSourceType = 'microphone' | 'system' | 'mixed';

/**
 * Native macOS audio capture adapter using coreaudio-node.
 * Supports microphone, system audio, and mixed (both) capture modes.
 * Requires macOS 14.4+ for system audio capture.
 */
export class NodeMicrophoneAdapter implements AudioCapturePort {
  private _state: AudioCaptureState = { isCapturing: false, source: null, sampleRate: 24000, channelCount: 1, error: null };
  private handlers = new Set<AudioEventHandler>();
  private micRecorder: MicrophoneRecorder | null = null;
  private systemRecorder: SystemAudioRecorder | null = null;
  private isPaused = false;
  private lastPcm16Data: Int16Array | null = null;

  static listInputDevices = listInputDevices;
  static getDefaultInputDeviceId = getDefaultInputDeviceId;

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
    let systemAudioFailed = false;

    debug(`Starting capture with source: ${source}, sampleRate: ${String(targetSampleRate)}`);

    try {
      // Request permissions based on source
      if (source === 'microphone' || source === 'mixed') {
        debug('Requesting microphone permission...');
        try {
          await withTimeout(
            ensureMicrophonePermission(),
            PERMISSION_TIMEOUT_MS,
            'Microphone permission request',
          );
          debug('Microphone permission granted');
        } catch (permError) {
          const errorMsg = permError instanceof Error ? permError.message : String(permError);
          debug(`Microphone permission failed: ${errorMsg}`);
          return err(new Error('Microphone permission denied. Please grant access in System Settings > Privacy & Security > Microphone'));
        }
      }

      if (source === 'system' || source === 'mixed') {
        debug('Requesting system audio permission...');
        try {
          await withTimeout(
            ensureSystemAudioPermission(),
            PERMISSION_TIMEOUT_MS,
            'System audio permission request',
          );
          debug('System audio permission granted');
        } catch (permError) {
          const errorMsg = permError instanceof Error ? permError.message : String(permError);
          debug(`System audio permission failed: ${errorMsg}`);

          if (source === 'mixed') {
            // For mixed mode, warn but continue with microphone only
            process.stderr.write(
              '\n⚠️  System audio permission denied. Falling back to microphone only.\n' +
              '   To enable system audio, grant permission in System Settings > Privacy & Security > Screen & System Audio Recording.\n' +
              '   Note: Requires macOS 14.4+\n\n',
            );
            systemAudioFailed = true;
          } else {
            // For system-only mode, this is a fatal error
            return err(new Error(
              'System audio permission denied. Please enable "System Audio Recording Only" in System Settings > Privacy & Security > Screen & System Audio Recording. Requires macOS 14.4+',
            ));
          }
        }
      }

      // Create recorders based on source type
      if (source === 'microphone' || source === 'mixed') {
        debug('Creating MicrophoneRecorder...');
        this.micRecorder = new MicrophoneRecorder({
          sampleRate: targetSampleRate,
          chunkDurationMs,
          stereo: false,
          gain: 1.0,
        });
        debug('MicrophoneRecorder created');

        this.micRecorder.on('data', (chunk) => {
          if (!this.isPaused) {
            this.handleAudioData(chunk.data, targetSampleRate);
          }
        });

        this.micRecorder.on('error', (error) => {
          debug(`MicrophoneRecorder error: ${error.message}`);
          this._state = { ...this._state, error: error.message };
        });
      }

      if ((source === 'system' || source === 'mixed') && !systemAudioFailed) {
        debug('Creating SystemAudioRecorder...');
        try {
          this.systemRecorder = new SystemAudioRecorder({
            sampleRate: targetSampleRate,
            chunkDurationMs,
            stereo: false,
            mute: false, // Don't mute system audio
          });
          debug('SystemAudioRecorder created');

          this.systemRecorder.on('data', (chunk) => {
            if (!this.isPaused) {
              this.handleAudioData(chunk.data, targetSampleRate);
            }
          });

          this.systemRecorder.on('error', (error) => {
            debug(`SystemAudioRecorder error: ${error.message}`);
            this._state = { ...this._state, error: error.message };
          });
        } catch (createError) {
          const errorMsg = createError instanceof Error ? createError.message : String(createError);
          debug(`Failed to create SystemAudioRecorder: ${errorMsg}`);

          if (source === 'mixed') {
            process.stderr.write(
              `\n⚠️  Failed to initialize system audio capture: ${errorMsg}\n` +
              '   Falling back to microphone only.\n\n',
            );
            this.systemRecorder = null;
          } else {
            return err(new Error(`Failed to initialize system audio capture: ${errorMsg}`));
          }
        }
      }

      // Start recorders
      if (this.micRecorder) {
        debug('Starting MicrophoneRecorder...');
        try {
          await withTimeout(
            this.micRecorder.start(),
            RECORDER_START_TIMEOUT_MS,
            'MicrophoneRecorder.start',
          );
          debug('MicrophoneRecorder started successfully');
        } catch (startError) {
          const errorMsg = startError instanceof Error ? startError.message : String(startError);
          debug(`MicrophoneRecorder start failed: ${errorMsg}`);
          this.micRecorder = null;
          return err(new Error(`Failed to start microphone capture: ${errorMsg}`));
        }
      }

      if (this.systemRecorder) {
        debug('Starting SystemAudioRecorder...');
        try {
          await withTimeout(
            this.systemRecorder.start(),
            RECORDER_START_TIMEOUT_MS,
            'SystemAudioRecorder.start',
          );
          debug('SystemAudioRecorder started successfully');
        } catch (startError) {
          const errorMsg = startError instanceof Error ? startError.message : String(startError);
          debug(`SystemAudioRecorder start failed: ${errorMsg}`);

          if (source === 'mixed' && this.micRecorder) {
            // For mixed mode, warn but continue with microphone only
            process.stderr.write(
              `\n⚠️  Failed to start system audio capture: ${errorMsg}\n` +
              '   Continuing with microphone only.\n\n',
            );
            this.systemRecorder = null;
          } else if (source === 'system') {
            return err(new Error(`Failed to start system audio capture: ${errorMsg}`));
          }
        }
      }

      // Verify we have at least one working recorder
      if (!this.micRecorder && !this.systemRecorder) {
        debug('No working recorders available');
        return err(new Error('No audio capture available. Both microphone and system audio failed to initialize.'));
      }

      // Map source type to AudioSourceType
      // If we fell back to microphone only, update the source accordingly
      let audioSource: AudioSourceType;
      if (source === 'system') {
        audioSource = 'tab';
      } else if (source === 'mixed' && !this.systemRecorder) {
        audioSource = 'microphone'; // Fell back to microphone only
      } else {
        audioSource = source;
      }

      this._state = {
        isCapturing: true,
        source: audioSource,
        sampleRate: targetSampleRate,
        channelCount: 1,
        error: null,
      };
      this.isPaused = false;

      debug(`Capture started successfully with source: ${audioSource}`);
      return ok(undefined);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      debug(`Unexpected error during capture start: ${errorMsg}`);
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Handle incoming audio data from recorders. */
  private handleAudioData(data: Buffer, sampleRate: number): void {
    const { int16Array, event } = convertPcmToAudioEvent(data, sampleRate);
    this.lastPcm16Data = int16Array;
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
    this.micRecorder?.stop().catch(() => { /* ignore */ });
    this.micRecorder = null;
    this.systemRecorder?.stop().catch(() => { /* ignore */ });
    this.systemRecorder = null;
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
