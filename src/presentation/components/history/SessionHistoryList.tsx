import type { ReactNode } from 'react';
import { useCallback , useState } from 'react';

import { useSessionHistory } from '@presentation/hooks';

import { Button, Modal, ModalFooter } from '../common';

import { SessionHistoryItem } from './SessionHistoryItem';

export function SessionHistoryList(): ReactNode {
  const { history, isLoading, error, deleteSession, clearAll, exportSession, loadHistory } = useSessionHistory();
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleExport = useCallback((sessionId: string, format: 'json' | 'txt') => {
    void exportSession(sessionId, format);
  }, [exportSession]);

  const handleDelete = useCallback((sessionId: string) => {
    void deleteSession(sessionId);
  }, [deleteSession]);

  const handleClearAll = useCallback(() => {
    void clearAll();
    setConfirmClearAll(false);
  }, [clearAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-400 mb-3">{error}</p>
        <Button variant="secondary" size="sm" onClick={() => { void loadHistory(); }}>
          Try Again
        </Button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No session history</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Your completed sessions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Session History ({history.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setConfirmClearAll(true); }}
          className="text-red-500 hover:text-red-600"
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <SessionHistoryItem
            key={entry.session.id}
            entry={entry}
            onExport={(format) => { handleExport(entry.session.id, format); }}
            onDelete={() => { handleDelete(entry.session.id); }}
          />
        ))}
      </div>

      <Modal
        isOpen={confirmClearAll}
        onClose={() => { setConfirmClearAll(false); }}
        title="Clear All History"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete all session history? This action cannot be undone.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setConfirmClearAll(false); }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearAll}>
            Delete All
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
