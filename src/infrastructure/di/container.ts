import type { EventBusPort, AudioCapturePort, RealtimeConnectionPort, SessionRepositoryPort, ConfigRepositoryPort } from '@application/ports';
import { SessionManager, CoachingEngine } from '@application/services';

import {
  OpenAIRealtimeAdapter,
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
let sessionRepository: SessionRepositoryPort | null = null;
let configRepository: ConfigRepositoryPort | null = null;
let sessionManager: SessionManager | null = null;
let coachingEngine: CoachingEngine | null = null;

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

export function getCoachingEngine(): CoachingEngine {
  if (!coachingEngine) {
    coachingEngine = new CoachingEngine(getEventBus(), {
      sessionId: '',
      coachingStyle: 'diplomatic',
      templateSystemPrompt: 'You are a helpful meeting coach.',
      userSpeakerId: null,
    });
  }
  return coachingEngine;
}

export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager({
      eventBus: getEventBus(),
      audioCapture: getAudioCapture(),
      realtimeConnection: getRealtimeConnection(),
      coachingEngine: getCoachingEngine(),
    });
  }
  return sessionManager;
}

// Reset container (useful for testing)
export function resetContainer(): void {
  eventBus = null;
  audioCapture = null;
  realtimeConnection = null;
  sessionRepository = null;
  configRepository = null;
  sessionManager = null;
  coachingEngine = null;
}
