import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { SuggestionProps } from '@domain/coaching';

const MAX_SUGGESTIONS = 20;

export interface CoachingSliceState {
  suggestions: SuggestionProps[];
  isGenerating: boolean;
  lastGeneratedAt: string | null;
}

const initialState: CoachingSliceState = {
  suggestions: [],
  isGenerating: false,
  lastGeneratedAt: null,
};

export const coachingSlice = createSlice({
  name: 'coaching',
  initialState,
  reducers: {
    addSuggestion: (state, action: PayloadAction<SuggestionProps>) => {
      state.suggestions.push(action.payload);
      state.lastGeneratedAt = new Date().toISOString();
      // Trim to max
      if (state.suggestions.length > MAX_SUGGESTIONS) {
        state.suggestions = state.suggestions.slice(-MAX_SUGGESTIONS);
      }
    },

    markSuggestionUsed: (state, action: PayloadAction<string>) => {
      const suggestion = state.suggestions.find((s) => s.id === action.payload);
      if (suggestion) {
        suggestion.used = true;
      }
    },

    dismissSuggestion: (state, action: PayloadAction<string>) => {
      const suggestion = state.suggestions.find((s) => s.id === action.payload);
      if (suggestion) {
        suggestion.dismissed = true;
      }
    },

    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },

    setSuggestions: (state, action: PayloadAction<SuggestionProps[]>) => {
      state.suggestions = action.payload.slice(-MAX_SUGGESTIONS);
    },

    clearSuggestions: () => initialState,
  },
});

export const {
  addSuggestion,
  markSuggestionUsed,
  dismissSuggestion,
  setGenerating,
  setSuggestions,
  clearSuggestions,
} = coachingSlice.actions;

export default coachingSlice.reducer;
