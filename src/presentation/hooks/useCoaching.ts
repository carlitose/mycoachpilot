import { useCallback } from 'react';

import type { SuggestionProps } from '@domain/coaching';

import { useContainer } from '../context';

interface UseCoachingResult {
  suggestions: SuggestionProps[];
  isGenerating: boolean;
  activeSuggestions: SuggestionProps[];
  latestSuggestion: SuggestionProps | null;
  activeSuggestionCount: number;
  markSuggestionUsed: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  clear: () => void;
}

export function useCoaching(): UseCoachingResult {
  const { useCoachingState } = useContainer();

  // Get reactive state from port
  const coachingState = useCoachingState();

  const markSuggestionUsedAction = useCallback((suggestionId: string) => {
    coachingState.markSuggestionUsed(suggestionId);
  }, [coachingState]);

  const dismissSuggestionAction = useCallback((suggestionId: string) => {
    coachingState.dismissSuggestion(suggestionId);
  }, [coachingState]);

  const clear = useCallback(() => {
    coachingState.clearSuggestions();
  }, [coachingState]);

  return {
    // State (reactive values from port)
    suggestions: coachingState.suggestions,
    isGenerating: coachingState.isGenerating,
    activeSuggestions: coachingState.activeSuggestions,
    latestSuggestion: coachingState.latestSuggestion,
    activeSuggestionCount: coachingState.activeSuggestionCount,

    // Actions
    markSuggestionUsed: markSuggestionUsedAction,
    dismissSuggestion: dismissSuggestionAction,
    clear,
  };
}
