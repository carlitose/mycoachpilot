'use client';

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';
import {
  sessionHistoryStorage,
  generateSessionTitle,
  filterMessagesForHistory,
  calculateDuration,
} from '@/lib/sessionHistoryStorage';
import type { SessionHistory, SessionHistoryPreview, Message, SessionMode } from '@/types/ai-types/chat';

interface SaveSessionParams {
  sessionId: string;
  startedAt: string;
  mode: SessionMode;
  messages: Message[];
  templateId?: string;
}

interface UseSessionHistoryResult {
  sessions: SessionHistoryPreview[];
  loadSession: (sessionId: string) => SessionHistory | null;
  saveSession: (params: SaveSessionParams) => void;
  deleteSession: (sessionId: string) => void;
  clearAllHistory: () => void;
  exportSession: (sessionId: string) => void;
  storageInfo: { count: number; maxCount: number };
  refreshSessions: () => void;
}

export function useSessionHistory(): UseSessionHistoryResult {
  const [sessions, setSessions] = useState<SessionHistoryPreview[]>([]);
  const [storageInfo, setStorageInfo] = useState({ count: 0, maxCount: 20 });

  // Load sessions from localStorage on mount
  useEffect(() => {
    if (!sessionHistoryStorage.isAvailable()) {
      log.warn('localStorage not available for session history');
      return;
    }

    const previews = sessionHistoryStorage.getPreviews();
    setSessions(previews);
    setStorageInfo(sessionHistoryStorage.getStorageInfo());
  }, []);

  const refreshSessions = useCallback(() => {
    const previews = sessionHistoryStorage.getPreviews();
    setSessions(previews);
    setStorageInfo(sessionHistoryStorage.getStorageInfo());
  }, []);

  const loadSession = useCallback((sessionId: string): SessionHistory | null => {
    return sessionHistoryStorage.getById(sessionId);
  }, []);

  const saveSession = useCallback((params: SaveSessionParams) => {
    const { sessionId, startedAt, mode, messages, templateId } = params;

    if (!sessionHistoryStorage.isAvailable()) {
      toast.error('Cannot save session: localStorage not available');
      return;
    }

    // Filter out system markers
    const filteredMessages = filterMessagesForHistory(messages);

    // Don't save empty sessions
    if (filteredMessages.length === 0) {
      log.info('Session not saved: no content messages');
      return;
    }

    const endedAt = new Date().toISOString();
    const title = generateSessionTitle(filteredMessages);

    const session: SessionHistory = {
      sessionId,
      startedAt,
      endedAt,
      durationSeconds: calculateDuration(startedAt, endedAt),
      mode,
      messages: filteredMessages,
      messageCount: filteredMessages.length,
      title,
      templateId,
    };

    try {
      sessionHistoryStorage.save(session);
      refreshSessions();
      toast.success('Session saved to history');
      log.info('Session saved to history:', { sessionId, messageCount: filteredMessages.length });
    } catch (error) {
      log.error('Failed to save session:', { error });
      toast.error('Failed to save session');
    }
  }, [refreshSessions]);

  const deleteSession = useCallback((sessionId: string) => {
    const success = sessionHistoryStorage.delete(sessionId);

    if (success) {
      refreshSessions();
      toast.success('Session deleted');
    } else {
      toast.error('Failed to delete session');
    }
  }, [refreshSessions]);

  const clearAllHistory = useCallback(() => {
    sessionHistoryStorage.clear();
    refreshSessions();
    toast.success('All history cleared');
  }, [refreshSessions]);

  const exportSession = useCallback((sessionId: string) => {
    const session = sessionHistoryStorage.getById(sessionId);

    if (!session) {
      toast.error('Session not found');
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(session, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${session.sessionId.slice(0, 8)}-${new Date(session.startedAt).toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Session exported');
    } catch (error) {
      log.error('Error exporting session:', { error });
      toast.error('Failed to export session');
    }
  }, []);

  return {
    sessions,
    loadSession,
    saveSession,
    deleteSession,
    clearAllHistory,
    exportSession,
    storageInfo,
    refreshSessions,
  };
}
