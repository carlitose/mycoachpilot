/**
 * Infrastructure Adapters
 * Implementations of application ports for external services
 */

// Realtime (OpenAI)
export { OpenAIRealtimeAdapter } from './realtime';

// Transcription (Deepgram)
export { DeepgramAdapter } from './deepgram';

// Audio Capture
export { AudioCaptureAdapter } from './audio';

// Persistence
export {
  LocalStorageSessionRepository,
  LocalStorageConfigRepository,
  STORAGE_KEYS,
  STORAGE_LIMITS,
} from './persistence';

// Suggestion Generator
export { OpenAISuggestionGenerator, createSuggestionGenerator } from './suggestion';
