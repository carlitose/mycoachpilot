/**
 * Infrastructure Adapters
 * Implementations of application ports for external services
 */

// Realtime (OpenAI) — RFC-1: BrowserRealtimeConnectionFactory is the sole public entry point.
// OpenAIRealtimeProtocol and BrowserWebSocketTransportFactory are internal details.
export { BrowserRealtimeConnectionFactory } from './realtime';

// Audio Capture and Playback
export { AudioCaptureAdapter, AudioPlaybackAdapter } from './audio';

// TTS (Text-to-Speech)
export { OpenAITTSAdapter } from './tts';

// Persistence
export {
  LocalStorageSessionRepository,
  LocalStorageConfigRepository,
  STORAGE_KEYS,
  STORAGE_LIMITS,
} from './persistence';

// Suggestion Generator
export { OpenAISuggestionGenerator, createSuggestionGenerator } from './suggestion';
