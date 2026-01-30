/**
 * Redux Coaching State Adapter
 * Implements CoachingStatePort using Redux
 */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { CoachingStatePort } from '@application/ports';

import {
  selectActiveSuggestionCount,
  selectActiveSuggestions,
  selectDismissedSuggestions,
  selectIsGenerating,
  selectLastGeneratedAt,
  selectLatestSuggestion,
  selectSuggestions,
  selectUsedSuggestions,
} from '../selectors/coachingSelectors';
import {
  addSuggestion,
  clearSuggestions,
  dismissSuggestion,
  markSuggestionUsed,
  setGenerating,
  setSuggestions,
} from '../slices/coachingSlice';
import type { AppDispatch, RootState } from '../store';

/**
 * Hook that provides a CoachingStatePort implementation backed by Redux.
 * Must be called within a React component inside a Redux Provider.
 */
export function useReduxCoachingState(): CoachingStatePort {
  const dispatch = useDispatch<AppDispatch>();

  // Reactive values - call all selectors at top level (proper hooks usage)
  const suggestions = useSelector((state: RootState) => selectSuggestions(state));
  const isGenerating = useSelector((state: RootState) => selectIsGenerating(state));
  const lastGeneratedAt = useSelector((state: RootState) => selectLastGeneratedAt(state));
  const activeSuggestions = useSelector((state: RootState) => selectActiveSuggestions(state));
  const usedSuggestions = useSelector((state: RootState) => selectUsedSuggestions(state));
  const dismissedSuggestions = useSelector((state: RootState) => selectDismissedSuggestions(state));
  const activeSuggestionCount = useSelector((state: RootState) => selectActiveSuggestionCount(state));
  const latestSuggestion = useSelector((state: RootState) => selectLatestSuggestion(state));

  // Memoize actions to maintain stable references
  const actions = useMemo(() => ({
    addSuggestion: (suggestion: Parameters<CoachingStatePort['addSuggestion']>[0]) => dispatch(addSuggestion(suggestion)),
    markSuggestionUsed: (suggestionId: Parameters<CoachingStatePort['markSuggestionUsed']>[0]) => dispatch(markSuggestionUsed(suggestionId)),
    dismissSuggestion: (suggestionId: Parameters<CoachingStatePort['dismissSuggestion']>[0]) => dispatch(dismissSuggestion(suggestionId)),
    setGenerating: (generating: Parameters<CoachingStatePort['setGenerating']>[0]) => dispatch(setGenerating(generating)),
    setSuggestions: (suggs: Parameters<CoachingStatePort['setSuggestions']>[0]) => dispatch(setSuggestions(suggs)),
    clearSuggestions: () => dispatch(clearSuggestions()),
  }), [dispatch]);

  return {
    // Reactive values
    suggestions,
    isGenerating,
    lastGeneratedAt,
    activeSuggestions,
    usedSuggestions,
    dismissedSuggestions,
    activeSuggestionCount,
    latestSuggestion,
    // Actions
    ...actions,
  };
}
