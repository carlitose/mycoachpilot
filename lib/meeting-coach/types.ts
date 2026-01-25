/**
 * Meeting Coach Mode - TypeScript Type Definitions
 *
 * All interfaces and types for Meeting Coach functionality.
 * This file is completely isolated from existing Conversation Mode types.
 */

// ============================================================================
// Configuration & Settings
// ============================================================================

export type CoachingStyle = 'diplomatic' | 'assertive' | 'analytical';

export interface MeetingCoachConfig {
  deepgramApiKey: string;
  openaiApiKey: string;
  selectedTemplateId: string;
  coachingStyle: CoachingStyle;
  customTemplates: CoachingTemplate[];
}

export interface CoachingTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isPredefined: boolean;
  createdAt: string;
}

// ============================================================================
// Transcription Data
// ============================================================================

export interface TranscriptWord {
  word: string;
  start: number;        // Word start time (seconds)
  end: number;          // Word end time (seconds)
  confidence: number;   // Word confidence (0-1)
  speaker: number;      // Speaker index for this word
}

export interface TranscriptSegment {
  id: string;                    // Unique segment ID
  speaker: number;               // Speaker index (0, 1, 2, ...)
  speakerLabel: string;          // "Speaker 0", "Speaker 1", or "Tu" (user)
  text: string;                  // Transcript text
  startTime: number;             // Start timestamp (seconds)
  endTime: number;               // End timestamp (seconds)
  confidence: number;            // Confidence score (0-1)
  isFinal: boolean;              // Is final result (vs interim)
  words: TranscriptWord[];       // Word-level details
  timestamp: string;             // ISO timestamp when received
}

export interface Speaker {
  id: number;                    // Speaker index from Deepgram
  label: string;                 // "Speaker 0", "Speaker 1", etc.
  isUser: boolean;               // true if this is the user
  wordCount: number;             // Total words spoken
  segments: string[];            // Array of segment IDs for this speaker
}

// ============================================================================
// Coaching Suggestions
// ============================================================================

export interface CoachingSuggestion {
  id: string;                    // Unique suggestion ID
  text: string;                  // Suggestion content
  context: string;               // Transcript context that triggered suggestion
  timestamp: string;             // ISO timestamp when generated
  templateId: string;            // Template used
  coachingStyle: CoachingStyle;
  isDismissed: boolean;          // Has user dismissed this?
  wasCopied: boolean;            // Has user copied this?
  triggerSegmentId: string;      // Segment that triggered suggestion
}

// ============================================================================
// Session State
// ============================================================================

export type SessionStatus = 'connecting' | 'active' | 'ended' | 'error';
export type DeepgramStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MeetingCoachSession {
  id: string;                    // Unique session ID
  startTime: string;             // ISO timestamp
  endTime?: string;              // ISO timestamp (undefined if active)
  status: SessionStatus;

  // Configuration
  templateId: string;
  coachingStyle: CoachingStyle;

  // Deepgram connection
  deepgramConnectionId?: string;
  deepgramStatus: DeepgramStatus;

  // Audio capture
  audioStreamActive: boolean;
  tabTitle?: string;             // Title of captured tab

  // Transcript data
  segments: TranscriptSegment[];
  speakers: Speaker[];
  userSpeakerId?: number;        // Which speaker is the user

  // Suggestions
  suggestions: CoachingSuggestion[];

  // Metrics
  duration?: number;             // Session duration in seconds
  totalWords: number;            // Total words transcribed
  totalSpeakers: number;         // Number of unique speakers

  // Error handling
  lastError?: SessionError;
}

// ============================================================================
// Error Types
// ============================================================================

export type ErrorType = 'CLIENT_ERROR' | 'NETWORK_ERROR' | 'API_ERROR';

export interface SessionError {
  type: ErrorType;
  code: string;
  message: string;
  timestamp: string;
  details?: any;
}

export interface ClientError extends SessionError {
  type: 'CLIENT_ERROR';
  code:
    | 'NO_API_KEY'           // Missing API key in config
    | 'NO_AUDIO_TRACK'       // Tab audio not shared
    | 'BROWSER_NOT_SUPPORTED' // Browser doesn't support getDisplayMedia
    | 'PERMISSION_DENIED';   // User denied screen/audio permission
  userMessage: string;       // User-friendly message
}

export interface NetworkError extends SessionError {
  type: 'NETWORK_ERROR';
  code:
    | 'CONNECTION_TIMEOUT'   // Timeout connecting to Deepgram
    | 'CONNECTION_LOST'      // WebSocket disconnected
    | 'REQUEST_FAILED';      // HTTP request failed
  retryable: boolean;
}

export interface APIError extends SessionError {
  type: 'API_ERROR';
  provider: 'deepgram' | 'openai';
  code:
    | 'INVALID_API_KEY'      // 401/403
    | 'RATE_LIMIT'           // 429
    | 'SERVER_ERROR'         // 500
    | 'BAD_REQUEST';         // 400
  httpStatus?: number;
  retryAfter?: number;       // Seconds to wait (for rate limit)
}

// ============================================================================
// History
// ============================================================================

export interface MeetingHistory {
  sessions: MeetingHistoryItem[];
}

export interface MeetingHistoryItem {
  id: string;                    // Session ID
  title: string;                 // Auto-generated or user-provided
  date: string;                  // ISO timestamp
  duration: number;              // Seconds

  // Snapshot data
  speakers: Speaker[];
  segments: TranscriptSegment[];
  suggestions: CoachingSuggestion[];

  // Metadata
  templateId: string;
  coachingStyle: CoachingStyle;
  totalWords: number;
  totalSpeakers: number;

  // Export data
  exported?: {
    format: 'json' | 'txt';
    timestamp: string;
  };
}

// ============================================================================
// Deepgram API Types
// ============================================================================

export interface DeepgramTranscriptResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  speechFinal: boolean;
  startTime: number;
  duration: number;
  words: TranscriptWord[];
  channelIndex: number[];
}

export interface DeepgramMetadata {
  request_id: string;
  model_info: {
    name: string;
    version: string;
  };
  model_uuid: string;
}

export type DeepgramEvent =
  | { type: 'metadata'; data: DeepgramMetadata }
  | { type: 'transcript'; data: DeepgramTranscriptResult }
  | { type: 'utteranceEnd'; lastWordEnd: number }
  | { type: 'error'; error: SessionError }
  | { type: 'close'; code: number; reason: string };

// ============================================================================
// OpenAI API Types
// ============================================================================

export interface CoachSuggestionRequest {
  apiKey: string;
  transcript: string;          // Last N segments formatted
  coachingStyle: CoachingStyle;
  templateId?: string;
}

export interface CoachSuggestionResponse {
  suggestion: string | null;   // null = NO_SUGGESTION
}

export interface CoachSuggestionError {
  error: string;
  code?: 'INVALID_API_KEY' | 'RATE_LIMIT' | 'SERVER_ERROR' | 'BAD_REQUEST';
}

// ============================================================================
// React Hook Return Types
// ============================================================================

export interface UseMeetingCoachReturn {
  // Session state
  session: MeetingCoachSession | null;
  isConnecting: boolean;
  isActive: boolean;
  error: SessionError | null;

  // Actions
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  identifySpeaker: (speakerId: number) => void;
  dismissSuggestion: (suggestionId: string) => void;
  copySuggestion: (suggestionId: string) => Promise<void>;
  requestManualSuggestion: () => Promise<void>;

  // Real-time data
  segments: TranscriptSegment[];
  speakers: Speaker[];
  suggestions: CoachingSuggestion[];

  // Audio capture
  captureTabAudio: () => Promise<void>;
  stopAudioCapture: () => void;
  audioStream: MediaStream | null;
}

export interface UseMeetingCoachConfigReturn {
  config: MeetingCoachConfig | null;
  updateConfig: (config: Partial<MeetingCoachConfig>) => void;
  validateDeepgramKey: (apiKey: string) => Promise<boolean>;
  templates: CoachingTemplate[];
  addCustomTemplate: (template: Omit<CoachingTemplate, 'id' | 'createdAt'>) => void;
  removeCustomTemplate: (templateId: string) => void;
}

export interface UseMeetingHistoryReturn {
  history: MeetingHistoryItem[];
  getSession: (sessionId: string) => MeetingHistoryItem | undefined;
  deleteSession: (sessionId: string) => void;
  exportSession: (sessionId: string, format: 'json' | 'txt') => void;
  searchSessions: (query: string) => MeetingHistoryItem[];
}

// ============================================================================
// Audio Processing Types
// ============================================================================

export interface AudioProcessor {
  // Convert Float32Array from AudioContext to Int16Array for Deepgram
  convertToInt16: (float32Array: Float32Array) => Int16Array;

  // Resample audio if needed (e.g., 48kHz → 16kHz)
  resample: (
    audioData: Float32Array,
    sourceSampleRate: number,
    targetSampleRate: number
  ) => Float32Array;
}

export interface AudioCaptureConfig {
  sampleRate: number;            // Target sample rate (default: 16000)
  channelCount: number;          // Mono audio (default: 1)
  echoCancellation: boolean;     // Enable echo cancellation
  noiseSuppression: boolean;     // Enable noise suppression
  autoGainControl: boolean;      // Enable AGC
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

export const STORAGE_KEYS = {
  CONFIG: 'meeting_coach_config',
  HISTORY: 'meeting_coach_history',
  ACTIVE_SESSION: 'meeting_coach_active_session',
  ERROR_LOGS: 'meeting_coach_error_logs',
} as const;

// ============================================================================
// Error Log (for debugging)
// ============================================================================

export interface ErrorLog {
  timestamp: string;
  type: ErrorType;
  code: string;
  message: string;
  stack?: string;
  context?: {
    sessionId?: string;
    action?: string;
  };
}

// ============================================================================
// Session Metrics (for performance monitoring)
// ============================================================================

export interface SessionMetrics {
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;

  // Connection metrics
  connectionTime: number;        // Time to establish WebSocket
  reconnectCount: number;        // Number of reconnections

  // Transcript metrics
  totalSegments: number;
  totalWords: number;
  averageConfidence: number;

  // Suggestion metrics
  suggestionsGenerated: number;
  suggestionErrors: number;
  averageSuggestionLatency: number;

  // Error metrics
  errors: ErrorLog[];
}
