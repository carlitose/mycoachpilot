import type { AudioCapturePort } from '../application/ports/AudioCapturePort';
import { CoachingEngine } from '../application/services/CoachingEngine';
import { SessionManager } from '../application/services/SessionManager';
import { REACTIVITY_DEFAULTS } from '../domain/settings';
import type { ReactivityConfigProps } from '../domain/settings';

import {
  InMemoryEventBusAdapter,
  InMemorySessionRepository,
  InMemoryConfigRepository,
  FileAudioCaptureAdapter,
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
  /**
   * Input device ID or name for microphone capture.
   * Useful for specifying virtual audio devices like BlackHole.
   * Can be a device ID or a partial name match (e.g., "BlackHole 2ch").
   */
  inputDevice?: string | undefined;
  /**
   * System device ID or name for capturing system audio (e.g., "BlackHole 2ch").
   * Used in 'mixed' mode to capture system audio separately from the microphone.
   * If specified, uses this device for system audio instead of native SystemAudioRecorder.
   */
  systemDevice?: string | undefined;
  /**
   * Reactivity configuration for VAD, coaching, and model settings.
   * Controls how responsive transcription and suggestions are.
   */
  reactivity?: ReactivityConfigProps;
}

export interface CLIContainer {
  eventBus: InMemoryEventBusAdapter;
  audioCapture: AudioCapturePort;
  realtimeConnection: NodeOpenAIRealtimeAdapter;
  sessionRepository: InMemorySessionRepository;
  configRepository: InMemoryConfigRepository;
  coachingEngine: CoachingEngine;
  sessionManager: SessionManager;
  reactivity: ReactivityConfigProps;
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
  // Pass inputDevice option if specified (for microphone)
  // Pass systemDevice option if specified (for system audio via BlackHole)
  return new NodeMicrophoneAdapter({
    inputDevice: options.inputDevice,
    systemDevice: options.systemDevice,
  });
}

export function createCLIContainer(options: CLIContainerOptions = {}): CLIContainer {
  const eventBus = new InMemoryEventBusAdapter();
  const audioCapture = createAudioCapture(options);
  const realtimeConnection = new NodeOpenAIRealtimeAdapter();
  const sessionRepository = new InMemorySessionRepository();
  const configRepository = new InMemoryConfigRepository();

  // Merge reactivity options with defaults
  const reactivity: ReactivityConfigProps = {
    ...REACTIVITY_DEFAULTS,
    ...(options.reactivity ?? {}),
  };

  const coachingEngine = new CoachingEngine(eventBus, {
    sessionId: '',
    coachingStyle: 'diplomatic',
    templateSystemPrompt: 'You are a helpful meeting coach.',
    userSpeakerId: null,
    suggestionIntervalMs: reactivity.suggestionIntervalMs,
    maxActiveSuggestions: reactivity.maxActiveSuggestions,
  });

  const sessionManager = new SessionManager({
    eventBus,
    audioCapture,
    realtimeConnection,
    coachingEngine,
  });

  return {
    eventBus,
    audioCapture,
    realtimeConnection,
    sessionRepository,
    configRepository,
    coachingEngine,
    sessionManager,
    reactivity,
  };
}
