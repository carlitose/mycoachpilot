import React, { useState } from 'react';
import { X, Download, MessageSquare, Users, Lightbulb } from 'lucide-react';
import type { MeetingHistoryItem } from '@/lib/meeting-coach/types';

interface MeetingHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  session: MeetingHistoryItem | null;
  onExport: (format: 'json' | 'txt') => void;
}

type Tab = 'transcript' | 'suggestions' | 'speakers';

export default function MeetingHistoryViewer({
  isOpen,
  onClose,
  session,
  onExport,
}: MeetingHistoryViewerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('transcript');

  if (!isOpen || !session) return null;

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-10 bg-slate-900 z-50 rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold truncate">{session.title}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
              <span>{new Date(session.date).toLocaleString()}</span>
              <span>{formatDuration(session.duration)}</span>
              <span>{session.totalSpeakers} speakers</span>
              <span>{session.totalWords} words</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport('json')}
              className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded transition flex items-center gap-1"
              title="Export as JSON"
            >
              <Download size={16} />
              JSON
            </button>
            <button
              onClick={() => onExport('txt')}
              className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded transition flex items-center gap-1"
              title="Export as TXT"
            >
              <Download size={16} />
              TXT
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-2 flex items-center gap-2 transition ${
              activeTab === 'transcript'
                ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            Transcript ({session.segments.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 flex items-center gap-2 transition ${
              activeTab === 'suggestions'
                ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb size={16} />
            Suggestions ({session.suggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('speakers')}
            className={`px-4 py-2 flex items-center gap-2 transition ${
              activeTab === 'speakers'
                ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            Speakers ({session.speakers.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'transcript' && (
            <TranscriptTab segments={session.segments} />
          )}
          {activeTab === 'suggestions' && (
            <SuggestionsTab suggestions={session.suggestions} />
          )}
          {activeTab === 'speakers' && (
            <SpeakersTab speakers={session.speakers} />
          )}
        </div>
      </div>
    </>
  );
}

function TranscriptTab({ segments }: { segments: any[] }) {
  if (segments.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p>No transcript segments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <div
          key={segment.id}
          className="bg-slate-800 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">{segment.speakerLabel}</span>
            <span className="text-xs text-slate-400">
              {new Date(segment.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{segment.text}</p>
        </div>
      ))}
    </div>
  );
}

function SuggestionsTab({ suggestions }: { suggestions: any[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
        <p>No suggestions generated</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="bg-primary/10 border border-primary/20 rounded-lg p-3"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-primary font-semibold uppercase">
              {suggestion.coachingStyle} Style
            </span>
            <span className="text-xs text-slate-400">
              {new Date(suggestion.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{suggestion.text}</p>
        </div>
      ))}
    </div>
  );
}

function SpeakersTab({ speakers }: { speakers: any[] }) {
  if (speakers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Users size={48} className="mx-auto mb-4 opacity-50" />
        <p>No speakers detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {speakers.map((speaker) => (
        <div
          key={speaker.id}
          className="bg-slate-800 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{speaker.label}</p>
              <p className="text-xs text-slate-400">{speaker.wordCount} words</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
