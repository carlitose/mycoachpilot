import React from 'react';
import { MessageSquare, Loader2, Copy, X } from 'lucide-react';
import type { CoachingSuggestion } from '@/lib/meeting-coach/types';

interface SuggestionsPanelProps {
  suggestions: CoachingSuggestion[];
  isGenerating: boolean;
  onDismiss: (id: string) => void;
  onCopy: (id: string) => void;
  onRequestManual: () => void;
  canRequest: boolean;
}

export default function SuggestionsPanel({
  suggestions,
  isGenerating,
  onDismiss,
  onCopy,
  onRequestManual,
  canRequest,
}: SuggestionsPanelProps) {
  const activeSuggestions = suggestions.filter((s) => !s.isDismissed);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold">Suggestions</h2>
        </div>

        <button
          onClick={onRequestManual}
          disabled={!canRequest || isGenerating}
          className="btn btn-xs btn-outline"
        >
          {isGenerating ? 'Generating...' : 'Request'}
        </button>
      </div>

      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Loader2 size={16} className="animate-spin" />
          Analyzing conversation...
        </div>
      )}

      {activeSuggestions.length === 0 && !isGenerating && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Suggestions will appear here when relevant. You can also request one manually.
        </p>
      )}

      <div className="space-y-3">
        {activeSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={() => onDismiss(suggestion.id)}
            onCopy={() => onCopy(suggestion.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: CoachingSuggestion;
  onDismiss: () => void;
  onCopy: () => void;
}

function SuggestionCard({ suggestion, onDismiss, onCopy }: SuggestionCardProps) {
  return (
    <div className="card bg-primary/5 dark:bg-primary/10 border border-primary/20 shadow-sm p-3">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-primary font-semibold uppercase">
          {suggestion.coachingStyle} Style
        </span>
        <div className="flex gap-1">
          <button
            onClick={onCopy}
            className="btn btn-ghost btn-xs btn-circle"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDismiss}
            className="btn btn-ghost btn-xs btn-circle"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-2">{suggestion.text}</p>

      <span className="text-xs text-gray-500 dark:text-gray-400">
        {new Date(suggestion.timestamp).toLocaleTimeString()}
      </span>

      {suggestion.wasCopied && (
        <div className="text-xs text-success mt-1">✓ Copied to clipboard</div>
      )}
    </div>
  );
}
