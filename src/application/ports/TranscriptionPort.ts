import type { Result } from '@domain/shared';
import type { Word } from '@domain/transcript';

export type TranscriptionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface TranscriptionConfig {
  apiKey: string;
  language?: string;
  model?: string;
  punctuate?: boolean;
  diarize?: boolean;
  interimResults?: boolean;
  sampleRate?: number;
}

export interface TranscriptSegmentEvent {
  type: 'segment';
  speakerId: number;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  words: Word[];
  isFinal: boolean;
}

export interface TranscriptionErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export interface TranscriptionStateEvent {
  type: 'state';
  state: TranscriptionState;
}

export type TranscriptionEvent =
  | TranscriptSegmentEvent
  | TranscriptionErrorEvent
  | TranscriptionStateEvent;

export type TranscriptionEventHandler = (event: TranscriptionEvent) => void;

/**
 * Transcription port interface
 * Handles real-time speech-to-text transcription (e.g., Deepgram)
 */
export interface TranscriptionPort {
  /**
   * Get current connection state
   */
  getState(): TranscriptionState;

  /**
   * Connect to the transcription service
   */
  connect(config: TranscriptionConfig): Promise<Result<void, Error>>;

  /**
   * Disconnect from the transcription service
   */
  disconnect(): void;

  /**
   * Send audio data for transcription
   */
  sendAudio(audio: Int16Array): void;

  /**
   * Subscribe to transcription events
   * @returns Unsubscribe function
   */
  onEvent(handler: TranscriptionEventHandler): () => void;
}
