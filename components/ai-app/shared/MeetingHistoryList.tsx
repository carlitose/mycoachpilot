'use client';

import React from 'react';
import { Clock, Users, MessageSquare, Download, Eye, Trash2 } from 'lucide-react';
import type { MeetingHistoryItem } from '@/lib/meeting-coach/types';

interface MeetingHistoryListProps {
  sessions: MeetingHistoryItem[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportSession: (sessionId: string, format: 'json' | 'txt') => void;
}

export default function MeetingHistoryList({
  sessions,
  onSelectSession,
  onDeleteSession,
  onExportSession,
}: MeetingHistoryListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No meeting sessions yet.</p>
        <p className="text-sm mt-1">Your meeting history will appear here.</p>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{session.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{formatDate(session.date)}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onSelectSession(session.id)}
                className="p-1.5 hover:bg-slate-700 rounded transition"
                title="View session"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExportSession(session.id, 'json')}
                className="p-1.5 hover:bg-slate-700 rounded transition"
                title="Export as JSON"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteSession(session.id)}
                className="p-1.5 hover:bg-red-600 rounded transition text-red-400"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(session.duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{session.totalSpeakers} speakers</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{session.totalWords} words</span>
            </div>
          </div>

          {session.suggestions.length > 0 && (
            <div className="mt-2 text-xs text-emerald-400">
              {session.suggestions.length} coaching suggestion{session.suggestions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
