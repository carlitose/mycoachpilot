'use client';

import React, { useEffect } from 'react';
import { X, History, Trash2, MessageSquare, Mic, Clock, ChevronRight } from 'lucide-react';
import type { SessionHistoryPreview } from '@/types/ai-types/chat';
import { formatDuration } from '@/lib/sessionHistoryStorage';

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionHistoryPreview[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  storageInfo: { count: number; maxCount: number };
}

export default function SessionHistoryDrawer({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  storageInfo,
}: SessionHistoryDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Delete this session from history?')) {
      onDeleteSession(sessionId);
    }
  };

  const handleClearAll = () => {
    if (confirm('Delete all session history? This cannot be undone.')) {
      onClearAll();
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Slide-in Drawer */}
      <div
        className={`
          fixed top-0 left-0 h-full w-[320px] max-w-[85vw] bg-slate-900 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          border-r border-slate-800
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold">Session History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-md transition"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Storage Info */}
        <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-800">
          {storageInfo.count} of {storageInfo.maxCount} sessions stored
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-4">
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => onSelectSession(session.sessionId)}
                  className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 cursor-pointer transition group"
                >
                  {/* Title and Mode Icon */}
                  <div className="flex items-start gap-2 mb-2">
                    {session.mode === 'conversation' ? (
                      <MessageSquare size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Mic size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm line-clamp-2 flex-1">
                      {session.title || 'Untitled Session'}
                    </span>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 transition flex-shrink-0" />
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-400 mb-2">
                    {formatDate(session.startedAt)}
                  </div>

                  {/* Stats and Delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(session.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        {session.messageCount} msg
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, session.sessionId)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-600 rounded transition opacity-0 group-hover:opacity-100"
                      aria-label="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <History size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No session history yet</p>
              <p className="text-xs mt-1">Sessions will appear here after you end them</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {sessions.length > 0 && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition"
            >
              <Trash2 size={16} />
              Clear All History
            </button>
          </div>
        )}
      </div>
    </>
  );
}
