import { describe, it, expect } from 'vitest';

import { SuggestionType } from '../valueObjects/SuggestionType';

describe('SuggestionType', () => {
  describe('create', () => {
    const validTypes = [
      'response_suggestion',
      'talking_point',
      'question',
      'objection_handling',
      'closing',
      'rapport_building',
      'clarification',
      'summary',
      'general',
    ] as const;

    it.each(validTypes)('should create %s type', (type) => {
      const suggestionType = SuggestionType.create(type);
      expect(suggestionType.toString()).toBe(type);
    });

    it('should throw on invalid type', () => {
      // @ts-expect-error Testing invalid input
      expect(() => SuggestionType.create('invalid')).toThrow('Invalid suggestion type');
    });
  });

  describe('factory methods', () => {
    it('should create response_suggestion via factory', () => {
      const type = SuggestionType.responseSuggestion();
      expect(type.toString()).toBe('response_suggestion');
    });

    it('should create talking_point via factory', () => {
      const type = SuggestionType.talkingPoint();
      expect(type.toString()).toBe('talking_point');
    });

    it('should create question via factory', () => {
      const type = SuggestionType.question();
      expect(type.toString()).toBe('question');
    });

    it('should create general via factory', () => {
      const type = SuggestionType.general();
      expect(type.toString()).toBe('general');
    });
  });

  describe('displayName', () => {
    it('should return human readable name for response_suggestion', () => {
      const type = SuggestionType.responseSuggestion();
      expect(type.displayName).toBe('Suggested Response');
    });

    it('should return human readable name for talking_point', () => {
      const type = SuggestionType.talkingPoint();
      expect(type.displayName).toBe('Talking Point');
    });

    it('should return human readable name for question', () => {
      const type = SuggestionType.question();
      expect(type.displayName).toBe('Question to Ask');
    });

    it('should return human readable name for general', () => {
      const type = SuggestionType.general();
      expect(type.displayName).toBe('Tip');
    });
  });

  describe('icon', () => {
    it('should return emoji for response_suggestion', () => {
      const type = SuggestionType.responseSuggestion();
      expect(type.icon).toBe('💬');
    });

    it('should return emoji for talking_point', () => {
      const type = SuggestionType.talkingPoint();
      expect(type.icon).toBe('📌');
    });

    it('should return emoji for question', () => {
      const type = SuggestionType.question();
      expect(type.icon).toBe('❓');
    });

    it('should return emoji for objection_handling', () => {
      const type = SuggestionType.create('objection_handling');
      expect(type.icon).toBe('🛡️');
    });

    it('should return emoji for closing', () => {
      const type = SuggestionType.create('closing');
      expect(type.icon).toBe('🎯');
    });

    it('should return emoji for rapport_building', () => {
      const type = SuggestionType.create('rapport_building');
      expect(type.icon).toBe('🤝');
    });

    it('should return emoji for clarification', () => {
      const type = SuggestionType.create('clarification');
      expect(type.icon).toBe('🔍');
    });

    it('should return emoji for summary', () => {
      const type = SuggestionType.create('summary');
      expect(type.icon).toBe('📋');
    });

    it('should return emoji for general', () => {
      const type = SuggestionType.general();
      expect(type.icon).toBe('💡');
    });
  })

  describe('displayName (all types)', () => {
    it('should return correct display name for objection_handling', () => {
      const type = SuggestionType.create('objection_handling');
      expect(type.displayName).toBe('Handling Objection');
    });

    it('should return correct display name for closing', () => {
      const type = SuggestionType.create('closing');
      expect(type.displayName).toBe('Closing Technique');
    });

    it('should return correct display name for rapport_building', () => {
      const type = SuggestionType.create('rapport_building');
      expect(type.displayName).toBe('Build Rapport');
    });

    it('should return correct display name for clarification', () => {
      const type = SuggestionType.create('clarification');
      expect(type.displayName).toBe('Clarification');
    });

    it('should return correct display name for summary', () => {
      const type = SuggestionType.create('summary');
      expect(type.displayName).toBe('Summary');
    });
  });

  describe('equals', () => {
    it('should return true for same type', () => {
      const type1 = SuggestionType.question();
      const type2 = SuggestionType.question();

      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const type1 = SuggestionType.question();
      const type2 = SuggestionType.general();

      expect(type1.equals(type2)).toBe(false);
    });
  });
});
