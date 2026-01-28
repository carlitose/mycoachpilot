import { useCallback } from 'react';

import type { SuggestionProps } from '@domain/coaching';

import {
  selectSuggestions,
  selectIsGenerating,
  selectActiveSuggestions,
  selectLatestSuggestion,
  selectActiveSuggestionCount,
  markSuggestionUsed,
  dismissSuggestion,
  clearSuggestions,
} from '@infrastructure/state';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

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
  const dispatch = useAppDispatch();

  const suggestions = useAppSelector(selectSuggestions);
  const isGenerating = useAppSelector(selectIsGenerating);
  const activeSuggestions = useAppSelector(selectActiveSuggestions);
  const latestSuggestion = useAppSelector(selectLatestSuggestion);
  const activeSuggestionCount = useAppSelector(selectActiveSuggestionCount);

  const markSuggestionUsedAction = useCallback((suggestionId: string) => {
    dispatch(markSuggestionUsed(suggestionId));
  }, [dispatch]);

  const dismissSuggestionAction = useCallback((suggestionId: string) => {
    dispatch(dismissSuggestion(suggestionId));
  }, [dispatch]);

  const clear = useCallback(() => {
    dispatch(clearSuggestions());
  }, [dispatch]);

  return {
    // State
    suggestions,
    isGenerating,
    activeSuggestions,
    latestSuggestion,
    activeSuggestionCount,

    // Actions
    markSuggestionUsed: markSuggestionUsedAction,
    dismissSuggestion: dismissSuggestionAction,
    clear,
  };
}
