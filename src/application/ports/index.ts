/**
 * Application Ports
 * Interfaces for external service adapters (Hexagonal Architecture)
 */

export type { EventBusPort } from './EventBusPort';

export type {
  AudioCapturePort,
  AudioCaptureState,
  AudioSourceType,
  AudioChannelType,
  AudioDataEvent,
  AudioLevelEvent,
  AudioEvent,
  AudioEventHandler,
} from './AudioCapturePort';

export type {
  RealtimeConnectionPort,
  RealtimeConnectionState,
  RealtimeConfig,
  TranscriptEvent,
  AudioResponseEvent,
  ResponseTextEvent,
  ErrorEvent as RealtimeErrorEvent,
  ConnectionStateEvent,
  RealtimeEvent,
  RealtimeEventHandler,
} from './RealtimeConnectionPort';

export type {
  SessionRepositoryPort,
  SessionHistoryEntry,
} from './SessionRepositoryPort';

export type {
  ConfigRepositoryPort,
} from './ConfigRepositoryPort';
