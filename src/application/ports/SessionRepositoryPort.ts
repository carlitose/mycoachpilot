import type { SuggestionProps } from '@domain/coaching';
import type { SessionProps } from '@domain/session';
import type { Result } from '@domain/shared';
import type { MessageProps, SpeakerProps, TranscriptSegmentProps } from '@domain/transcript';

/**
 * Complete session history entry for persistence
 */
export interface SessionHistoryEntry {
  session: SessionProps;
  messages: MessageProps[];
  segments: TranscriptSegmentProps[];
  speakers: SpeakerProps[];
  suggestions: SuggestionProps[];
  savedAt: string;
}

/**
 * SessionRepository port interface
 * Handles persistence of session data
 */
export interface SessionRepositoryPort {
  /**
   * Save a session to history
   */
  save(entry: SessionHistoryEntry): Promise<Result<void, Error>>;

  /**
   * Get a session by ID
   */
  getById(sessionId: string): Promise<Result<SessionHistoryEntry | null, Error>>;

  /**
   * Get all sessions, ordered by date (newest first)
   */
  getAll(): Promise<Result<SessionHistoryEntry[], Error>>;

  /**
   * Delete a session by ID
   */
  delete(sessionId: string): Promise<Result<void, Error>>;

  /**
   * Clear all sessions
   */
  clearAll(): Promise<Result<void, Error>>;

  /**
   * Get session count
   */
  count(): Promise<Result<number, Error>>;

  /**
   * Export session as JSON
   */
  exportAsJson(sessionId: string): Promise<Result<string, Error>>;

  /**
   * Export session as plain text
   */
  exportAsText(sessionId: string): Promise<Result<string, Error>>;
}
