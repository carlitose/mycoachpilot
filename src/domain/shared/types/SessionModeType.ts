/**
 * Session mode type - shared across bounded contexts
 * Used by both Session and Settings domains
 */
export type SessionModeType = 'conversation' | 'transcript_only' | 'meeting_coach';
