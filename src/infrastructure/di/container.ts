import type { EventBusPort, AudioCapturePort, RealtimeConnectionPort, TranscriptionPort, SessionRepositoryPort, ConfigRepositoryPort } from '@application/ports';
import { SessionManager } from '@application/services';

import {
  OpenAIRealtimeAdapter,
  DeepgramAdapter,
  AudioCaptureAdapter,
  LocalStorageSessionRepository,
  LocalStorageConfigRepository,
} from '@infrastructure/adapters';
import { store, ReduxEventBusAdapter } from '@infrastructure/state';

/**
 * Dependency Injection Container
 * Provides singleton instances of services and adapters
 */

let eventBus: EventBusPort | null = null;
let audioCapture: AudioCapturePort | null = null;
let realtimeConnection: RealtimeConnectionPort | null = null;
let transcription: TranscriptionPort | null = null;
let sessionRepository: SessionRepositoryPort | null = null;
let configRepository: ConfigRepositoryPort | null = null;
let sessionManager: SessionManager | null = null;

export function getEventBus(): EventBusPort {
  if (!eventBus) {
    eventBus = new ReduxEventBusAdapter(store.dispatch);
  }
  return eventBus;
}

export function getAudioCapture(): AudioCapturePort {
  if (!audioCapture) {
    audioCapture = new AudioCaptureAdapter();
  }
  return audioCapture;
}

export function getRealtimeConnection(): RealtimeConnectionPort {
  if (!realtimeConnection) {
    realtimeConnection = new OpenAIRealtimeAdapter();
  }
  return realtimeConnection;
}

export function getTranscription(): TranscriptionPort {
  if (!transcription) {
    transcription = new DeepgramAdapter();
  }
  return transcription;
}

export function getSessionRepository(): SessionRepositoryPort {
  if (!sessionRepository) {
    sessionRepository = new LocalStorageSessionRepository();
  }
  return sessionRepository;
}

export function getConfigRepository(): ConfigRepositoryPort {
  if (!configRepository) {
    configRepository = new LocalStorageConfigRepository();
  }
  return configRepository;
}

export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager({
      eventBus: getEventBus(),
      audioCapture: getAudioCapture(),
      realtimeConnection: getRealtimeConnection(),
      transcription: getTranscription(),
    });
  }
  return sessionManager;
}

// Reset container (useful for testing)
export function resetContainer(): void {
  eventBus = null;
  audioCapture = null;
  realtimeConnection = null;
  transcription = null;
  sessionRepository = null;
  configRepository = null;
  sessionManager = null;
}
