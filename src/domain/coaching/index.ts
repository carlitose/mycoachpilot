/**
 * Coaching bounded context
 * Manages AI-powered coaching suggestions
 */

// Value Objects
export {
  SuggestionId,
  SuggestionType,
} from './valueObjects';
export type { SuggestionTypeValue } from './valueObjects';

// Entities
export { Suggestion } from './entities';
export type { SuggestionProps } from './entities';

// Events
export { SuggestionGenerated } from './events';
export type { SuggestionGeneratedPayload } from './events';
