/**
 * useMeetingHistory Hook
 *
 * Manages meeting session history stored in localStorage:
 * - Save completed sessions
 * - Load and search history
 * - Export sessions (JSON/TXT)
 * - Auto-cleanup old sessions
 * - Handle storage quota errors
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  MeetingHistoryItem,
  MeetingHistory,
  MeetingCoachSession,
  Speaker,
  TranscriptSegment,
  CoachingSuggestion,
} from '@/lib/meeting-coach/types';
import { STORAGE_KEYS } from '@/lib/meeting-coach/types';
import { log } from '@/lib/logger';

// Max sessions to keep in history
const MAX_HISTORY_ITEMS = 50;

// Auto-delete sessions older than 90 days
const MAX_SESSION_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export function useMeetingHistory() {
  const [history, setHistory] = useState<MeetingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load history from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored) as MeetingHistory;
        setHistory(parsed.sessions || []);
        log.info( '[useMeetingHistory] Loaded history', { count: parsed.sessions?.length || 0 });
      } else {
        setHistory([]);
        log.info( '[useMeetingHistory] No history found');
      }
    } catch (error) {
      log.error( '[useMeetingHistory] Error loading history', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save history to localStorage
   */
  const saveHistory = useCallback((sessions: MeetingHistoryItem[]) => {
    try {
      const historyData: MeetingHistory = { sessions };
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyData));
      log.info( '[useMeetingHistory] History saved', { count: sessions.length });
    } catch (error) {
      // Handle quota exceeded error
      if ((error as DOMException).name === 'QuotaExceededError') {
        log.error( '[useMeetingHistory] Storage quota exceeded');
        throw new Error('STORAGE_QUOTA_EXCEEDED');
      }
      log.error( '[useMeetingHistory] Error saving history', error);
      throw error;
    }
  }, []);

  /**
   * Generate title for session (auto or user-provided)
   */
  const generateSessionTitle = useCallback((session: MeetingCoachSession): string => {
    const date = new Date(session.startTime);
    const dateStr = date.toLocaleDateString('it-IT', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Try to extract topic from first few segments
    const firstUserSegment = session.segments.find(
      (s) => s.speaker === session.userSpeakerId && s.text.length > 20
    );

    if (firstUserSegment) {
      const topic = firstUserSegment.text.slice(0, 30);
      return `${dateStr} - ${topic}...`;
    }

    return `Meeting ${dateStr}`;
  }, []);

  /**
   * Save session to history
   */
  const saveSession = useCallback((session: MeetingCoachSession) => {
    // Create history item
    const historyItem: MeetingHistoryItem = {
      id: session.id,
      title: generateSessionTitle(session),
      date: session.startTime,
      duration: session.duration || 0,
      speakers: session.speakers,
      segments: session.segments,
      suggestions: session.suggestions,
      templateId: session.templateId,
      coachingStyle: session.coachingStyle,
      totalWords: session.totalWords,
      totalSpeakers: session.totalSpeakers,
    };

    setHistory((prev) => {
      // Add new session at the beginning (most recent first)
      const updated = [historyItem, ...prev];

      // Limit to MAX_HISTORY_ITEMS
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      saveHistory(limited);

      return limited;
    });

    log.info( '[useMeetingHistory] Session saved to history', {
      id: session.id,
      segmentCount: session.segments.length,
    });
  }, [generateSessionTitle, saveHistory]);

  /**
   * Get session by ID
   */
  const getSession = useCallback((sessionId: string): MeetingHistoryItem | undefined => {
    return history.find((item) => item.id === sessionId);
  }, [history]);

  /**
   * Delete session from history
   */
  const deleteSession = useCallback((sessionId: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== sessionId);
      saveHistory(filtered);
      return filtered;
    });

    log.info( '[useMeetingHistory] Session deleted', { sessionId });
  }, [saveHistory]);

  /**
   * Search sessions by query (searches in title, segments, suggestions)
   */
  const searchSessions = useCallback((query: string): MeetingHistoryItem[] => {
    if (!query.trim()) return history;

    const lowerQuery = query.toLowerCase();

    return history.filter((item) => {
      // Search in title
      if (item.title.toLowerCase().includes(lowerQuery)) return true;

      // Search in transcript
      const transcriptMatch = item.segments.some((seg) =>
        seg.text.toLowerCase().includes(lowerQuery)
      );
      if (transcriptMatch) return true;

      // Search in suggestions
      const suggestionMatch = item.suggestions.some((sug) =>
        sug.text.toLowerCase().includes(lowerQuery)
      );
      if (suggestionMatch) return true;

      return false;
    });
  }, [history]);

  /**
   * Export session to JSON
   */
  const exportSessionJSON = useCallback((sessionId: string): string | null => {
    const session = getSession(sessionId);
    if (!session) return null;

    try {
      const json = JSON.stringify(session, null, 2);
      log.info( '[useMeetingHistory] Session exported to JSON', { sessionId });
      return json;
    } catch (error) {
      log.error( '[useMeetingHistory] Error exporting to JSON', error);
      return null;
    }
  }, [getSession]);

  /**
   * Export session to plain text
   */
  const exportSessionText = useCallback((sessionId: string): string | null => {
    const session = getSession(sessionId);
    if (!session) return null;

    try {
      let text = `${session.title}\n`;
      text += `Date: ${new Date(session.date).toLocaleString()}\n`;
      text += `Duration: ${Math.floor(session.duration / 60)}m ${session.duration % 60}s\n`;
      text += `Speakers: ${session.totalSpeakers}\n`;
      text += `Words: ${session.totalWords}\n\n`;

      text += '--- TRANSCRIPT ---\n\n';
      for (const segment of session.segments) {
        text += `${segment.speakerLabel}: ${segment.text}\n\n`;
      }

      if (session.suggestions.length > 0) {
        text += '--- SUGGESTIONS ---\n\n';
        for (const suggestion of session.suggestions) {
          text += `[${new Date(suggestion.timestamp).toLocaleTimeString()}] ${suggestion.text}\n\n`;
        }
      }

      log.info( '[useMeetingHistory] Session exported to text', { sessionId });
      return text;
    } catch (error) {
      log.error( '[useMeetingHistory] Error exporting to text', error);
      return null;
    }
  }, [getSession]);

  /**
   * Download session as file
   */
  const downloadSession = useCallback((sessionId: string, format: 'json' | 'txt') => {
    const content = format === 'json'
      ? exportSessionJSON(sessionId)
      : exportSessionText(sessionId);

    if (!content) return;

    const session = getSession(sessionId);
    if (!session) return;

    // Create blob and download
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${session.id}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark as exported
    setHistory((prev) =>
      prev.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              exported: {
                format,
                timestamp: new Date().toISOString(),
              },
            }
          : item
      )
    );

    log.info( '[useMeetingHistory] Session downloaded', { sessionId, format });
  }, [exportSessionJSON, exportSessionText, getSession]);

  /**
   * Auto-cleanup old sessions (>90 days)
   */
  const cleanupOldSessions = useCallback(() => {
    const now = Date.now();
    const cutoffTime = now - MAX_SESSION_AGE_MS;

    setHistory((prev) => {
      const filtered = prev.filter((item) => {
        const sessionTime = new Date(item.date).getTime();
        return sessionTime >= cutoffTime;
      });

      if (filtered.length < prev.length) {
        saveHistory(filtered);
        log.info( '[useMeetingHistory] Old sessions cleaned up', {
          removed: prev.length - filtered.length,
        });
      }

      return filtered;
    });
  }, [saveHistory]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
    log.info( '[useMeetingHistory] All history cleared');
  }, [saveHistory]);

  /**
   * Get storage usage info
   */
  const getStorageInfo = useCallback(() => {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY) || '';
      const sizeBytes = new Blob([historyStr]).size;
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

      return {
        itemCount: history.length,
        sizeBytes,
        sizeMB,
      };
    } catch (error) {
      log.error( '[useMeetingHistory] Error getting storage info', error);
      return { itemCount: 0, sizeBytes: 0, sizeMB: '0' };
    }
  }, [history]);

  return {
    // State
    history,
    isLoading,

    // Actions
    saveSession,
    deleteSession,
    clearHistory,
    cleanupOldSessions,

    // Queries
    getSession,
    searchSessions,

    // Export
    exportSessionJSON,
    exportSessionText,
    downloadSession,

    // Storage info
    getStorageInfo,
  };
}
