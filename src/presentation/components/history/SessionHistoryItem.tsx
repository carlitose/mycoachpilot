import type { ReactNode } from 'react';

import type { SessionHistoryEntry } from '@application/ports';

import { Button } from '../common';

interface SessionHistoryItemProps {
  entry: SessionHistoryEntry;
  onExport: (format: 'json' | 'txt') => void;
  onDelete: () => void;
  onView?: () => void;
}

const modeLabels: Record<string, { label: string; icon: string }> = {
  conversation: { label: 'Conversation', icon: '💬' },
  transcript_only: { label: 'Transcript', icon: '📝' },
  meeting_coach: { label: 'Meeting Coach', icon: '🎯' },
};

export function SessionHistoryItem({ entry, onExport, onDelete, onView }: SessionHistoryItemProps): ReactNode {
  const { session, messages, segments, speakers } = entry;
  const modeInfo = modeLabels[session.mode] ?? { label: session.mode, icon: '📄' };
  const messageCount = messages.length + segments.length;
  const duration = session.endedAt && session.startedAt
    ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : undefined;

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
        {modeInfo.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {modeInfo.label} Session
          </h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {session.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span>{formatDate(session.startedAt)}</span>
          {duration && <span>{formatDuration(duration)}</span>}
          <span>{messageCount} messages</span>
          {speakers.length > 0 && (
            <span>{speakers.length} speaker{speakers.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onView && (
          <Button variant="ghost" size="sm" onClick={onView}>
            View
          </Button>
        )}
        <div className="relative group">
          <Button variant="secondary" size="sm" className="gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[100px]">
              <button
                onClick={() => { onExport('json'); }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                JSON
              </button>
              <button
                onClick={() => { onExport('txt'); }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Text
              </button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

function formatDate(dateStr: Date | null | undefined): string {
  if (!dateStr) return 'Unknown date';
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (days === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (days < 7) {
    return `${String(days)} days ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${String(hours)}h ${String(minutes)}m`;
  }
  return `${String(minutes)}m`;
}
