import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import reducer, {
  addSuggestion,
  markSuggestionUsed,
  dismissSuggestion,
  setGenerating,
  setSuggestions,
  clearSuggestions,
  CoachingSliceState,
} from '../coachingSlice';

describe('coachingSlice', () => {
  const initialState: CoachingSliceState = {
    suggestions: [],
    isGenerating: false,
    lastGeneratedAt: null,
  };

  const mockSuggestion = {
    id: 'sugg-1',
    sessionId: 'session-1',
    type: 'question' as const,
    content: 'Ask about their goals',
    context: 'Customer mentioned success',
    confidence: 0.85,
    timestamp: new Date().toISOString(),
    used: false,
    dismissed: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('addSuggestion', () => {
    it('should add suggestion to list', () => {
      const state = reducer(initialState, addSuggestion(mockSuggestion));

      expect(state.suggestions).toHaveLength(1);
      expect(state.suggestions[0]).toEqual(mockSuggestion);
    });

    it('should update lastGeneratedAt', () => {
      const state = reducer(initialState, addSuggestion(mockSuggestion));

      expect(state.lastGeneratedAt).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should trim to MAX_SUGGESTIONS (20)', () => {
      const suggestions = Array.from({ length: 20 }, (_, i) => ({
        ...mockSuggestion,
        id: 'sugg-' + String(i),
      }));
      const stateWith20: CoachingSliceState = {
        ...initialState,
        suggestions,
      };

      const newSuggestion = { ...mockSuggestion, id: 'sugg-new' };
      const state = reducer(stateWith20, addSuggestion(newSuggestion));

      expect(state.suggestions).toHaveLength(20);
      expect(state.suggestions[19]?.id).toBe('sugg-new');
      expect(state.suggestions[0]?.id).toBe('sugg-1');
    });
  });

  describe('markSuggestionUsed', () => {
    it('should mark suggestion as used', () => {
      const stateWithSuggestion: CoachingSliceState = {
        ...initialState,
        suggestions: [mockSuggestion],
      };

      const state = reducer(stateWithSuggestion, markSuggestionUsed('sugg-1'));

      expect(state.suggestions[0]?.used).toBe(true);
    });

    it('should not throw when suggestion not found', () => {
      const state = reducer(initialState, markSuggestionUsed('non-existent'));

      expect(state.suggestions).toHaveLength(0);
    });
  });

  describe('dismissSuggestion', () => {
    it('should mark suggestion as dismissed', () => {
      const stateWithSuggestion: CoachingSliceState = {
        ...initialState,
        suggestions: [mockSuggestion],
      };

      const state = reducer(stateWithSuggestion, dismissSuggestion('sugg-1'));

      expect(state.suggestions[0]?.dismissed).toBe(true);
    });

    it('should not throw when suggestion not found', () => {
      const state = reducer(initialState, dismissSuggestion('non-existent'));

      expect(state.suggestions).toHaveLength(0);
    });
  });

  describe('setGenerating', () => {
    it('should set generating to true', () => {
      const state = reducer(initialState, setGenerating(true));

      expect(state.isGenerating).toBe(true);
    });

    it('should set generating to false', () => {
      const generatingState: CoachingSliceState = { ...initialState, isGenerating: true };
      const state = reducer(generatingState, setGenerating(false));

      expect(state.isGenerating).toBe(false);
    });
  });

  describe('setSuggestions', () => {
    it('should set suggestions', () => {
      const suggestions = [mockSuggestion, { ...mockSuggestion, id: 'sugg-2' }];
      const state = reducer(initialState, setSuggestions(suggestions));

      expect(state.suggestions).toHaveLength(2);
    });

    it('should trim to MAX_SUGGESTIONS', () => {
      const suggestions = Array.from({ length: 30 }, (_, i) => ({
        ...mockSuggestion,
        id: 'sugg-' + String(i),
      }));

      const state = reducer(initialState, setSuggestions(suggestions));

      expect(state.suggestions).toHaveLength(20);
      expect(state.suggestions[0]?.id).toBe('sugg-10');
    });
  });

  describe('clearSuggestions', () => {
    it('should reset to initial state', () => {
      const stateWithData: CoachingSliceState = {
        suggestions: [mockSuggestion],
        isGenerating: true,
        lastGeneratedAt: '2024-01-15T10:00:00Z',
      };

      const state = reducer(stateWithData, clearSuggestions());

      expect(state).toEqual(initialState);
    });
  });
});
