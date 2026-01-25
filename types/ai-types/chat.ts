// Types for chat messages
type MessageRole = 'user' | 'assistant' | 'system' | 'log' | 'transcript';

export interface Message {
  role: MessageRole;
  content: string;
  id?: string; // Optional id for tracking specific messages
}

// Types for EventSource updates
interface TranscriptionUpdate {
  type: 'transcription';
  text: string;
  session_id: string;
}

interface ResponseUpdate {
  type: 'response';
  text: string;
  session_id: string;
  final: boolean;
}

interface ErrorUpdate {
  type: 'error';
  message: string;
  session_id: string;
}

interface ConnectionUpdate {
  type: 'connection';
  connected: boolean;
}

interface LogUpdate {
  type: 'log';
  text: string;
}

interface HeartbeatUpdate {
  type: 'heartbeat';
  timestamp: string;
}

type EventUpdate = 
  | TranscriptionUpdate 
  | ResponseUpdate 
  | ErrorUpdate 
  | ConnectionUpdate 
  | LogUpdate 
  | HeartbeatUpdate;

// Screen capture types
interface ScreenInfo {
  id: string;
  name: string;
}

// Session history types
export type SessionMode = 'conversation' | 'transcript_only' | 'meeting_coach';

export interface SessionHistory {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  mode: SessionMode;
  messages: Message[];
  messageCount: number;
  title?: string;
  templateId?: string;
}

export interface SessionHistoryPreview {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  mode: SessionMode;
  messageCount: number;
  title?: string;
}

export interface ResumedSessionInfo {
  originalSessionId: string;
  originalTitle?: string;
  resumedAt: string;
  messageCount: number;
} 