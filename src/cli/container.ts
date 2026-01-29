import type { AudioCapturePort } from '../application/ports/AudioCapturePort';
import { CoachingEngine } from '../application/services/CoachingEngine';
import { SessionManager } from '../application/services/SessionManager';

import {
  InMemoryEventBusAdapter,
  InMemorySessionRepository,
  InMemoryConfigRepository,
  FileAudioCaptureAdapter,
  NodeDeepgramAdapter,
  NodeOpenAIRealtimeAdapter,
  NodeMicrophoneAdapter,
} from './adapters';

export type AudioSourceOption = 'file' | 'microphone' | 'system' | 'mixed';

export interface CLIContainerOptions {
  /**
   * Path to audio file (WAV format) for file-based capture.
   * If provided, audioSource is ignored.
   */
  audioFilePath?: string | undefined;
  /**
   * Live audio source type.
   * - 'microphone': Capture from microphone only
   * - 'system': Capture system audio only (browser, apps, etc.)
   * - 'mixed': Capture both microphone and system audio
   * - 'file': Use audioFilePath (default when audioFilePath is provided)
   * Default: 'microphone' when no audioFilePath is provided
   */
  audioSource?: AudioSourceOption;
}

export interface CLIContainer {
  eventBus: InMemoryEventBusAdapter;
  audioCapture: AudioCapturePort;
  transcription: NodeDeepgramAdapter;
  realtimeConnection: NodeOpenAIRealtimeAdapter;
  sessionRepository: InMemorySessionRepository;
  configRepository: InMemoryConfigRepository;
  coachingEngine: CoachingEngine;
  sessionManager: SessionManager;
}

/**
 * Create the appropriate audio capture adapter based on options.
 * Priority: audioFilePath > audioSource
 */
function createAudioCapture(options: CLIContainerOptions): AudioCapturePort {
  // If audioFilePath is provided, use file-based capture
  if (options.audioFilePath) {
    return new FileAudioCaptureAdapter(options.audioFilePath);
  }

  // Use live audio capture with NodeMicrophoneAdapter
  // Default to 'microphone' if no source specified
  return new NodeMicrophoneAdapter();
}

export function createCLIContainer(options: CLIContainerOptions = {}): CLIContainer {
  const eventBus = new InMemoryEventBusAdapter();
  const audioCapture = createAudioCapture(options);
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
