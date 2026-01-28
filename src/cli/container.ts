import { CoachingEngine } from '../application/services/CoachingEngine';
import { SessionManager } from '../application/services/SessionManager';

import {
  InMemoryEventBusAdapter,
  InMemorySessionRepository,
  InMemoryConfigRepository,
  FileAudioCaptureAdapter,
  NodeDeepgramAdapter,
  NodeOpenAIRealtimeAdapter,
} from './adapters';

export interface CLIContainerOptions {
  audioFilePath?: string | undefined;
}

export interface CLIContainer {
  eventBus: InMemoryEventBusAdapter;
  audioCapture: FileAudioCaptureAdapter;
  transcription: NodeDeepgramAdapter;
  realtimeConnection: NodeOpenAIRealtimeAdapter;
  sessionRepository: InMemorySessionRepository;
  configRepository: InMemoryConfigRepository;
  coachingEngine: CoachingEngine;
  sessionManager: SessionManager;
}

export function createCLIContainer(options: CLIContainerOptions = {}): CLIContainer {
  const eventBus = new InMemoryEventBusAdapter();
  const audioCapture = new FileAudioCaptureAdapter(options.audioFilePath);
  const transcription = new NodeDeepgramAdapter();
  const realtimeConnection = new NodeOpenAIRealtimeAdapter();
  const sessionRepository = new InMemorySessionRepository();
  const configRepository = new InMemoryConfigRepository();

  const coachingEngine = new CoachingEngine(eventBus, {
    sessionId: '',
    coachingStyle: 'diplomatic',
    templateSystemPrompt: 'You are a helpful meeting coach.',
    userSpeakerId: null,
  });

  const sessionManager = new SessionManager({
    eventBus,
    audioCapture,
    realtimeConnection,
    transcription,
    coachingEngine,
  });

  return {
    eventBus,
    audioCapture,
    transcription,
    realtimeConnection,
    sessionRepository,
    configRepository,
    coachingEngine,
    sessionManager,
  };
}
