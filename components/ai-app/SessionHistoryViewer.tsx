'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download, Clock, MessageSquare, Mic, Calendar, Copy, Check, RotateCcw } from 'lucide-react';
import type { SessionHistory } from '@/types/ai-types/chat';
import { formatDuration } from '@/lib/sessionHistoryStorage';
import { formatMarkdown } from '@/lib/ai-utils/formatMessage';

interface SessionHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionHistory | null;
  onExport: () => void;
  onResume: () => void;
  canResume: boolean;
}

export default function SessionHistoryViewer({
  isOpen,
  onClose,
  session,
  onExport,
  onResume,
  canResume,
}: SessionHistoryViewerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Prevent body scroll when modal is open
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

  // Scroll to top when session changes
  useEffect(() => {
    if (isOpen && session) {
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-slate-900 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-800">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              {session.mode === 'conversation' ? (
                <MessageSquare size={18} className="text-blue-400 flex-shrink-0" />
              ) : (
                <Mic size={18} className="text-green-400 flex-shrink-0" />
              )}
              <h2 className="text-lg font-semibold truncate">
                {session.title || 'Untitled Session'}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(session.startedAt)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
            aria-label="Close viewer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-4 py-2 bg-slate-800/50 text-sm text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            Duration: {formatDuration(session.durationSeconds)}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare size={14} />
            {session.messageCount} messages
          </span>
          <span className="capitalize">
            Mode: {session.mode.replace('_', ' ')}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {session.messages.map((message, index) => (
            message.role === 'transcript' ? (
              // Transcript messages: centered, green accent
              <div key={index} className="flex justify-center">
                <div className="group relative max-w-2xl w-full bg-slate-700 text-slate-200 px-4 py-3 rounded-lg border-l-4 border-green-500 font-mono text-sm">
                  <span className="text-green-400 font-semibold mr-2">🎤</span>
                  <span dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className="absolute top-1 right-1 h-6 w-6 p-0 flex items-center justify-center rounded-full bg-slate-600 hover:bg-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Copy message"
                  >
                    {copiedIndex === index ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <Copy size={12} className="text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={index}
                className={`p-3 rounded-lg max-w-[80%] relative ${
                  message.role === 'user'
                    ? 'bg-blue-900 ml-auto'
                    : message.role === 'assistant'
                      ? 'bg-slate-800 group'
                      : message.role === 'log'
                        ? 'bg-slate-600 border border-slate-500 italic'
                        : 'bg-slate-700 mx-auto text-center text-sm font-semibold'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Copy message"
                  >
                    {copiedIndex === index ? (
                      <Check size={10} className="text-green-400" />
                    ) : (
                      <Copy size={10} className="text-slate-300" />
                    )}
                  </button>
                )}
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            Session ID: {session.sessionId.slice(0, 20)}...
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onResume}
              disabled={!canResume}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${
                canResume
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
              title={canResume ? 'Resume this session' : 'Stop current session first'}
            >
              <RotateCcw size={16} />
              Resume
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <Download size={16} />
              Export JSON
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
