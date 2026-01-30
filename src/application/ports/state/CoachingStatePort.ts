/**
 * Coaching State Port
 * Abstracts coaching state access for Clean Architecture compliance
 */
import type { SuggestionProps } from '@domain/coaching';

/**
 * Port interface for accessing coaching state.
 * Implementations (adapters) are React hooks that return this interface.
 * The values are reactive - components will re-render when they change.
 */
export interface CoachingStatePort {
  // Reactive values - automatically update when state changes
  suggestions: SuggestionProps[];
  isGenerating: boolean;
  lastGeneratedAt: string | null;
  activeSuggestions: SuggestionProps[];
  usedSuggestions: SuggestionProps[];
  dismissedSuggestions: SuggestionProps[];
  activeSuggestionCount: number;
  latestSuggestion: SuggestionProps | null;

  // Actions - imperatively update state
  addSuggestion(suggestion: SuggestionProps): void;
  markSuggestionUsed(suggestionId: string): void;
  dismissSuggestion(suggestionId: string): void;
  setGenerating(isGenerating: boolean): void;
  setSuggestions(suggestions: SuggestionProps[]): void;
  clearSuggestions(): void;
}
