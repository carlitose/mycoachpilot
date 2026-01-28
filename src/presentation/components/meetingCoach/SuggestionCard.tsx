import type { ReactNode } from 'react';

import type { SuggestionProps } from '@domain/coaching';

import { Button } from '../common';

interface SuggestionCardProps {
  suggestion: SuggestionProps;
  onUse?: () => void;
  onDismiss?: () => void;
}

const typeStyles: Record<string, { icon: string; color: string; label: string }> = {
  question: {
    icon: '❓',
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    label: 'Question',
  },
  response_suggestion: {
    icon: '💬',
    color: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    label: 'Suggested Response',
  },
  talking_point: {
    icon: '📌',
    color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    label: 'Talking Point',
  },
  clarification: {
    icon: '🔍',
    color: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    label: 'Clarification',
  },
  summary: {
    icon: '📋',
    color: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
    label: 'Summary',
  },
  objection_handling: {
    icon: '🛡️',
    color: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    label: 'Handling Objection',
  },
  closing: {
    icon: '🎯',
    color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Closing Technique',
  },
  rapport_building: {
    icon: '🤝',
    color: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
    label: 'Build Rapport',
  },
  general: {
    icon: '💡',
    color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Tip',
  },
};

const defaultStyle = { icon: '💡', color: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20', label: 'Tip' };

export function SuggestionCard({ suggestion, onUse, onDismiss }: SuggestionCardProps): ReactNode {
  const style = typeStyles[suggestion.type] ?? defaultStyle;

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(suggestion.content);
      onUse?.();
    } catch {
      // Fallback if clipboard API not available
    }
  };

  return (
    <div
      className={`
        rounded-lg border-l-4 p-4 shadow-sm
        ${style.color}
        animate-slide-in
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {style.label}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(suggestion.timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {suggestion.content}
          </p>
          {suggestion.context && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
              Context: {suggestion.context}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { void copyToClipboard(); }}
          className="gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </Button>
      </div>
    </div>
  );
}

function formatTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
