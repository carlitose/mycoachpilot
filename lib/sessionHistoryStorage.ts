import { log } from '@/lib/logger';
import type { SessionHistory, SessionHistoryPreview, Message } from '@/types/ai-types/chat';

const STORAGE_KEY = 'session_history';
const MAX_SESSIONS = 20;

/**
 * Utility functions for managing session history in localStorage
 */
export const sessionHistoryStorage = {
  /**
   * Get all stored sessions
   */
  getAll(): SessionHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as SessionHistory[];
    } catch (error) {
      log.error('Error reading session history:', { error });
      return [];
    }
  },

  /**
   * Get lightweight previews for UI display
   */
  getPreviews(): SessionHistoryPreview[] {
    const sessions = this.getAll();
    return sessions.map(({ sessionId, startedAt, endedAt, durationSeconds, mode, messageCount, title }) => ({
      sessionId,
      startedAt,
      endedAt,
      durationSeconds,
      mode,
      messageCount,
      title,
    }));
  },

  /**
   * Get a specific session by ID
   */
  getById(sessionId: string): SessionHistory | null {
    const sessions = this.getAll();
    return sessions.find(s => s.sessionId === sessionId) || null;
  },

  /**
   * Save a new session
   * Automatically removes oldest session if limit exceeded
   */
  save(session: SessionHistory): void {
    try {
      let sessions = this.getAll();

      // Check if session already exists (update case)
      const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId);
      if (existingIndex !== -1) {
        sessions[existingIndex] = session;
      } else {
        // Add new session at the beginning (most recent first)
        sessions.unshift(session);

        // Enforce max limit - remove oldest
        if (sessions.length > MAX_SESSIONS) {
          sessions = sessions.slice(0, MAX_SESSIONS);
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      log.error('Error saving session history:', { error });
      throw new Error('Failed to save session history');
    }
  },

  /**
   * Delete a session by ID
   */
  delete(sessionId: string): boolean {
    try {
      const sessions = this.getAll();
      const filtered = sessions.filter(s => s.sessionId !== sessionId);

      if (filtered.length === sessions.length) {
        return false; // Session not found
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      log.error('Error deleting session:', { error });
      return false;
    }
  },

  /**
   * Clear all session history
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      log.error('Error clearing session history:', { error });
    }
  },

  /**
   * Get storage info
   */
  getStorageInfo(): { count: number; maxCount: number } {
    const sessions = this.getAll();
    return {
      count: sessions.length,
      maxCount: MAX_SESSIONS,
    };
  },

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__session_history_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Generate a title from messages
 * Uses first user or transcript message, truncated to 50 chars
 */
export function generateSessionTitle(messages: Message[]): string {
  const firstContentMessage = messages.find(
    m => (m.role === 'user' || m.role === 'transcript' || m.role === 'assistant') && m.content.trim()
  );

  if (!firstContentMessage) {
    return 'Untitled Session';
  }

  const content = firstContentMessage.content.trim();
  if (content.length <= 50) {
    return content;
  }

  return content.substring(0, 47) + '...';
}

/**
 * Filter out system messages that shouldn't be saved
 */
export function filterMessagesForHistory(messages: Message[]): Message[] {
  return messages.filter(m => {
    // Keep all non-system messages
    if (m.role !== 'system') return true;

    // Filter out session start/end markers
    const systemMarkers = [
      '--- Realtime session started',
      '--- Session ended',
    ];

    return !systemMarkers.some(marker => m.content.includes(marker));
  });
}

/**
 * Calculate duration in seconds between two ISO timestamps
 */
export function calculateDuration(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.round((end - start) / 1000);
}

/**
 * Format duration for display (e.g., "5m 32s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
