import type { ReactNode } from 'react';

import { useCoaching } from '@presentation/hooks';

import { SuggestionCard } from './SuggestionCard';

interface SuggestionListProps {
  maxItems?: number;
  showAll?: boolean;
}

export function SuggestionList({ maxItems = 5, showAll = false }: SuggestionListProps): ReactNode {
  const {
    activeSuggestions,
    suggestions,
    isGenerating,
    markSuggestionUsed,
    dismissSuggestion,
    activeSuggestionCount,
  } = useCoaching();

  const displaySuggestions = showAll
    ? suggestions
    : activeSuggestions.slice(0, maxItems);

  if (displaySuggestions.length === 0 && !isGenerating) {
    return (
      <div className="p-6 text-center text-gray-400 dark:text-gray-500">
        <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-sm">No suggestions yet</p>
        <p className="text-xs mt-1">Coaching tips will appear during the meeting</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Coaching Suggestions
          {activeSuggestionCount > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeSuggestionCount}
            </span>
          )}
        </h3>
        {isGenerating && (
          <span className="flex items-center gap-1 text-xs text-blue-500">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Thinking...
          </span>
        )}
      </div>

      <div className="space-y-3">
        {displaySuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onUse={() => { markSuggestionUsed(suggestion.id); }}
            onDismiss={() => { dismissSuggestion(suggestion.id); }}
          />
        ))}
      </div>

      {!showAll && activeSuggestionCount > maxItems && (
        <p className="text-xs text-center text-gray-400 mt-2">
          +{activeSuggestionCount - maxItems} more suggestions
        </p>
      )}
    </div>
  );
}
