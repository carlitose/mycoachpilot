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

export type { RealtimeConnectionFactoryPort } from './RealtimeConnectionFactoryPort';

export type {
  SessionRepositoryPort,
  SessionHistoryEntry,
} from './SessionRepositoryPort';

export type {
  ConfigRepositoryPort,
} from './ConfigRepositoryPort';

// State Ports - framework-agnostic state management interfaces
export type {
  SessionStatePort,
  ConnectionState,
  SessionStateError,
} from './state';

export type {
  TranscriptStatePort,
  SpeakerStatsProps,
} from './state';

export type {
  CoachingStatePort,
} from './state';

export type {
  SettingsStatePort,
} from './state';

// Container Port - DI container interface
export type {
  ServiceContainer,
  UseContainer,
} from './ContainerPort';
