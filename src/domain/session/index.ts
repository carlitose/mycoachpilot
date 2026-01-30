/**
 * Session bounded context
 * Manages coaching session lifecycle
 */

// Value Objects
export {
  SessionId,
  SessionMode,
  SessionStatus,
  AudioConfig,
} from './valueObjects';
export type {
  SessionModeType,
  SessionStatusType,
  AudioConfigProps,
} from './valueObjects';

// Entities
export { Session } from './entities';
export type { SessionProps } from './entities';

// Events
export { SessionStarted, SessionStopped, SessionPaused } from './events';
export type {
  SessionStartedPayload,
  SessionStoppedPayload,
  SessionPausedPayload,
} from './events';
