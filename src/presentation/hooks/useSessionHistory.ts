import { useState, useCallback, useEffect } from 'react';

import type { SessionHistoryEntry } from '@application/ports';

import { useContainer } from '../context';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSessionHistory() {
  const { sessionRepository } = useContainer();
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await sessionRepository.getAll();
    if (result.isOk()) {
      setHistory(result.unwrap());
    } else {
      setError(result.unwrapErr().message);
    }

    setIsLoading(false);
  }, [sessionRepository]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const result = await sessionRepository.delete(sessionId);
    if (result.isOk()) {
      setHistory((prev) => prev.filter((h) => h.session.id !== sessionId));
      return true;
    }
    return false;
  }, [sessionRepository]);

  const clearAll = useCallback(async () => {
    const result = await sessionRepository.clearAll();
    if (result.isOk()) {
      setHistory([]);
      return true;
    }
    return false;
  }, [sessionRepository]);

  const exportSession = useCallback(async (sessionId: string, format: 'json' | 'txt') => {
    const result = format === 'json'
      ? await sessionRepository.exportAsJson(sessionId)
      : await sessionRepository.exportAsText(sessionId);

    if (result.isOk()) {
      const content = result.unwrap();
      const mimeType = format === 'json' ? 'application/json' : 'text/plain';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  }, [sessionRepository]);

  // Load on mount
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    loadHistory,
    deleteSession,
    clearAll,
    exportSession,
  };
}
