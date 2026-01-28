import { ValueObject } from '@domain/shared';

export type SuggestionTypeValue =
  | 'response_suggestion'    // Suggested response for user
  | 'talking_point'          // Key point to mention
  | 'question'               // Question to ask
  | 'objection_handling'     // How to handle objection
  | 'closing'                // Closing technique
  | 'rapport_building'       // Build rapport suggestion
  | 'clarification'          // Ask for clarification
  | 'summary'                // Summarize discussion
  | 'general';               // General coaching tip

const VALID_TYPES: SuggestionTypeValue[] = [
  'response_suggestion',
  'talking_point',
  'question',
  'objection_handling',
  'closing',
  'rapport_building',
  'clarification',
  'summary',
  'general',
];

/**
 * Suggestion type value object
 */
export class SuggestionType extends ValueObject<SuggestionTypeValue> {
  private readonly _value: SuggestionTypeValue;

  private constructor(value: SuggestionTypeValue) {
    super();
    this._value = value;
  }

  protected get value(): SuggestionTypeValue {
    return this._value;
  }

  toString(): SuggestionTypeValue {
    return this._value;
  }

  get displayName(): string {
    switch (this._value) {
      case 'response_suggestion':
        return 'Suggested Response';
      case 'talking_point':
        return 'Talking Point';
      case 'question':
        return 'Question to Ask';
      case 'objection_handling':
        return 'Handling Objection';
      case 'closing':
        return 'Closing Technique';
      case 'rapport_building':
        return 'Build Rapport';
      case 'clarification':
        return 'Clarification';
      case 'summary':
        return 'Summary';
      case 'general':
        return 'Tip';
    }
  }

  get icon(): string {
    switch (this._value) {
      case 'response_suggestion':
        return '💬';
      case 'talking_point':
        return '📌';
      case 'question':
        return '❓';
      case 'objection_handling':
        return '🛡️';
      case 'closing':
        return '🎯';
      case 'rapport_building':
        return '🤝';
      case 'clarification':
        return '🔍';
      case 'summary':
        return '📋';
      case 'general':
        return '💡';
    }
  }

  static create(type: SuggestionTypeValue): SuggestionType {
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`Invalid suggestion type: ${type}`);
    }
    return new SuggestionType(type);
  }

  static responseSuggestion(): SuggestionType {
    return new SuggestionType('response_suggestion');
  }

  static talkingPoint(): SuggestionType {
    return new SuggestionType('talking_point');
  }

  static question(): SuggestionType {
    return new SuggestionType('question');
  }

  static general(): SuggestionType {
    return new SuggestionType('general');
  }
}
