/**
 * Infrastructure Adapters
 * Implementations of application ports for external services
 */

// Realtime (OpenAI)
export { OpenAIRealtimeAdapter, BrowserRealtimeConnectionFactory } from './realtime';

// Audio Capture and Playback
export { AudioCaptureAdapter, AudioPlaybackAdapter } from './audio';

// Persistence
export {
  LocalStorageSessionRepository,
  LocalStorageConfigRepository,
  STORAGE_KEYS,
  STORAGE_LIMITS,
} from './persistence';

// Suggestion Generator
export { OpenAISuggestionGenerator, createSuggestionGenerator } from './suggestion';
