/**
 * Container Port
 * Defines the interface for the dependency injection container.
 * The actual implementation lives in infrastructure, but this interface
 * is used by presentation to stay framework-agnostic at the type level.
 */
import type { SessionManager } from '@application/services';

import type {
  EventBusPort,
  AudioCapturePort,
  AudioPlaybackPort,
  RealtimeConnectionPort,
  SessionRepositoryPort,
  ConfigRepositoryPort,
  TTSPort,
  SessionStatePort,
  TranscriptStatePort,
  CoachingStatePort,
  SettingsStatePort,
} from './index';

/**
 * Service container interface.
 * Provides access to all application dependencies.
 */
export interface ServiceContainer {
  // Infrastructure services
  eventBus: EventBusPort;
  audioCapture: AudioCapturePort;
  audioPlayback: AudioPlaybackPort;
  realtimeConnection: RealtimeConnectionPort;
  sessionRepository: SessionRepositoryPort;
  configRepository: ConfigRepositoryPort;
  sessionManager: SessionManager;
  tts: TTSPort;

  // State hooks - call these to get reactive state
  // These are React hooks that return port implementations
  useSessionState: () => SessionStatePort;
  useTranscriptState: () => TranscriptStatePort;
  useCoachingState: () => CoachingStatePort;
  useSettingsState: () => SettingsStatePort;
}

/**
 * Type for the useContainer hook.
 * This hook is implemented in infrastructure but typed here for presentation.
 */
export type UseContainer = () => ServiceContainer;
