import { describe, it, expect } from 'vitest';

import { SessionId } from '../valueObjects/SessionId';

describe('SessionId', () => {
  describe('create', () => {
    it('should create a unique ID when no argument provided', () => {
      const id1 = SessionId.create();
      const id2 = SessionId.create();

      expect(id1.toString()).not.toBe(id2.toString());
    });

    it('should create with provided ID', () => {
      const id = SessionId.create('test-session-123');

      expect(id.toString()).toBe('test-session-123');
    });

    it('should generate UUID format', () => {
      const id = SessionId.create();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(id.toString()).toMatch(uuidRegex);
    });
  });

  describe('fromString', () => {
    it('should restore ID from string', () => {
      const original = SessionId.create();
      const restored = SessionId.fromString(original.toString());

      expect(restored.equals(original)).toBe(true);
    });

    it('should throw on empty string', () => {
      expect(() => SessionId.fromString('')).toThrow('SessionId cannot be empty');
    });

    it('should throw on whitespace-only string', () => {
      expect(() => SessionId.fromString('   ')).toThrow('SessionId cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for same ID', () => {
      const id1 = SessionId.create('same-id');
      const id2 = SessionId.fromString('same-id');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const id1 = SessionId.create();
      const id2 = SessionId.create();

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
