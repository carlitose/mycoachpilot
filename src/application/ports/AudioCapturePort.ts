import type { AudioConfigProps } from '@domain/session';
import type { Result } from '@domain/shared';

export type AudioSourceType = 'microphone' | 'tab' | 'mixed';

export interface AudioCaptureState {
  isCapturing: boolean;
  source: AudioSourceType | null;
  sampleRate: number;
  channelCount: number;
  error: string | null;
}

export type AudioChannelType = 'microphone' | 'system';

export interface AudioDataEvent {
  type: 'audio';
  data: Float32Array;
  sampleRate: number;
  timestamp: number;
  channel?: AudioChannelType;
}

export interface AudioLevelEvent {
  type: 'level';
  level: number; // 0-1
  timestamp: number;
}

export interface AudioEndedEvent {
  type: 'ended';
  timestamp: number;
}

export type AudioEvent = AudioDataEvent | AudioLevelEvent | AudioEndedEvent;
export type AudioEventHandler = (event: AudioEvent) => void;

/**
 * AudioCapture port interface
 * Handles microphone and tab audio capture
 */
export interface AudioCapturePort {
  /**
   * Get current capture state
   */
  getState(): AudioCaptureState;

  /**
   * Start capturing audio from microphone
   */
  startMicrophone(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>>;

  /**
   * Start capturing audio from browser tab
   */
  startTabAudio(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>>;

  /**
   * Start capturing mixed audio (microphone + tab)
   */
  startMixed(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>>;

  /**
   * Stop all audio capture
   */
  stop(): void;

  /**
   * Pause audio capture
   */
  pause(): void;

  /**
   * Resume audio capture
   */
  resume(): void;

  /**
   * Subscribe to audio events
   * @returns Unsubscribe function
   */
  onAudioEvent(handler: AudioEventHandler): () => void;

  /**
   * Get raw PCM16 audio data for streaming
   */
  getPCM16Data(): Int16Array | null;
}
