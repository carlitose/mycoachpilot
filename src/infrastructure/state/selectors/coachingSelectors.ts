import { createSelector } from '@reduxjs/toolkit';

import type { CoachingSliceState } from '../slices/coachingSlice';
import type { RootState } from '../store';

export const selectCoaching = (state: RootState): CoachingSliceState => state.coaching;

export const selectSuggestions = createSelector(
  selectCoaching,
  (coaching) => coaching.suggestions,
);

export const selectIsGenerating = createSelector(
  selectCoaching,
  (coaching) => coaching.isGenerating,
);

export const selectLastGeneratedAt = createSelector(
  selectCoaching,
  (coaching) => coaching.lastGeneratedAt,
);

export const selectActiveSuggestions = createSelector(
  selectSuggestions,
  (suggestions) => suggestions.filter((s) => !s.used && !s.dismissed),
);

export const selectUsedSuggestions = createSelector(
  selectSuggestions,
  (suggestions) => suggestions.filter((s) => s.used),
);

export const selectDismissedSuggestions = createSelector(
  selectSuggestions,
  (suggestions) => suggestions.filter((s) => s.dismissed),
);

export const selectActiveSuggestionCount = createSelector(
  selectActiveSuggestions,
  (suggestions) => suggestions.length,
);

export const selectLatestSuggestion = createSelector(
  selectActiveSuggestions,
  (suggestions) => suggestions[suggestions.length - 1] ?? null,
);
