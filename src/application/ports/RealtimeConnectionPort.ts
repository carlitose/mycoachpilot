import type { Result } from '@domain/shared';

export type RealtimeConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'reconnecting';

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
  temperature?: number;
  maxResponseTokens?: number | 'inf';
  vadEnabled?: boolean;
  vadThreshold?: number;
  vadSilenceDuration?: number;
  transcriptOnly?: boolean;
}

export interface TranscriptEvent {
  type: 'transcript';
  text: string;
  isFinal: boolean;
  role: 'user' | 'assistant';
}

export interface AudioResponseEvent {
  type: 'audio_response';
  audio: Int16Array;
  sampleRate: number;
}

export interface ResponseTextEvent {
  type: 'response_text';
  text: string;
  isFinal: boolean;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export interface ConnectionStateEvent {
  type: 'connection_state';
  state: RealtimeConnectionState;
}

export type RealtimeEvent =
  | TranscriptEvent
  | AudioResponseEvent
  | ResponseTextEvent
  | ErrorEvent
  | ConnectionStateEvent;

export type RealtimeEventHandler = (event: RealtimeEvent) => void;

/**
 * RealtimeConnection port interface
 * Handles WebSocket connection to OpenAI Realtime API
 */
export interface RealtimeConnectionPort {
  /**
   * Get current connection state
   */
  getState(): RealtimeConnectionState;

  /**
   * Connect to the realtime API
   */
  connect(config: RealtimeConfig): Promise<Result<void, Error>>;

  /**
   * Disconnect from the realtime API
   */
  disconnect(): void;

  /**
   * Send audio data to the API
   */
  sendAudio(audio: Int16Array): void;

  /**
   * Commit the audio buffer to trigger transcription
   * Call this when audio input is complete (e.g., file ended)
   */
  commitAudioBuffer(): void;

  /**
   * Send a text message to the API
   */
  sendText(text: string): Promise<Result<void, Error>>;

  /**
   * Manually trigger response generation (for VAD-disabled mode)
   */
  triggerResponse(): void;

  /**
   * Cancel the current response
   */
  cancelResponse(): void;

  /**
   * Update the session configuration
   */
  updateSession(config: Partial<RealtimeConfig>): Promise<Result<void, Error>>;

  /**
   * Subscribe to realtime events
   * @returns Unsubscribe function
   */
  onEvent(handler: RealtimeEventHandler): () => void;
}
