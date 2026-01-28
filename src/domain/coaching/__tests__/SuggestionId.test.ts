import { describe, it, expect } from 'vitest';

import { SuggestionId } from '../valueObjects/SuggestionId';

describe('SuggestionId', () => {
  describe('create', () => {
    it('should create a unique ID when no argument provided', () => {
      const id1 = SuggestionId.create();
      const id2 = SuggestionId.create();

      expect(id1.toString()).not.toBe(id2.toString());
    });

    it('should create with provided ID', () => {
      const id = SuggestionId.create('test-suggestion-123');

      expect(id.toString()).toBe('test-suggestion-123');
    });

    it('should generate UUID format', () => {
      const id = SuggestionId.create();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(id.toString()).toMatch(uuidRegex);
    });
  });

  describe('fromString', () => {
    it('should restore ID from string', () => {
      const original = SuggestionId.create();
      const restored = SuggestionId.fromString(original.toString());

      expect(restored.equals(original)).toBe(true);
    });

    it('should throw on empty string', () => {
      expect(() => SuggestionId.fromString('')).toThrow('SuggestionId cannot be empty');
    });

    it('should throw on whitespace-only string', () => {
      expect(() => SuggestionId.fromString('   ')).toThrow('SuggestionId cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for same ID', () => {
      const id1 = SuggestionId.create('same-id');
      const id2 = SuggestionId.fromString('same-id');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const id1 = SuggestionId.create();
      const id2 = SuggestionId.create();

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
