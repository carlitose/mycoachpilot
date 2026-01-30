import { describe, it, expect } from 'vitest';

import { ApiKey } from '../valueObjects/ApiKey';

describe('ApiKey', () => {
  describe('create', () => {
    it('should create OpenAI API key', () => {
      const key = ApiKey.create('sk-test-key-12345', 'openai');

      expect(key.key).toBe('sk-test-key-12345');
      expect(key.service).toBe('openai');
    });

    it('should trim whitespace from key', () => {
      const key = ApiKey.create('  sk-test-key  ', 'openai');

      expect(key.key).toBe('sk-test-key');
    });
  });

  describe('factory methods', () => {
    it('should create OpenAI key via factory', () => {
      const key = ApiKey.openai('sk-my-key');

      expect(key.service).toBe('openai');
      expect(key.key).toBe('sk-my-key');
    });
  });

  describe('maskedKey', () => {
    it('should mask long keys showing first and last 4 chars', () => {
      const key = ApiKey.openai('sk-1234567890abcdef');

      expect(key.maskedKey).toBe('sk-1••••••••cdef');
    });

    it('should return all dots for short keys', () => {
      const key = ApiKey.openai('sk-1234');

      expect(key.maskedKey).toBe('••••••••');
    });

    it('should handle keys at boundary length', () => {
      const key = ApiKey.openai('12345678'); // exactly 8 chars

      expect(key.maskedKey).toBe('••••••••');
    });
  });

  describe('isValid', () => {
    it('should return true for valid OpenAI key', () => {
      const key = ApiKey.openai('sk-1234567890abcdef');

      expect(key.isValid).toBe(true);
    });

    it('should return false for OpenAI key not starting with sk-', () => {
      const key = ApiKey.openai('pk-1234567890abcdef');

      expect(key.isValid).toBe(false);
    });

    it('should return false for empty key', () => {
      const key = ApiKey.openai('');

      expect(key.isValid).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON object', () => {
      const key = ApiKey.openai('sk-test-key');
      const json = key.toJSON();

      expect(json).toEqual({
        key: 'sk-test-key',
        service: 'openai',
      });
    });
  });

  describe('fromJSON', () => {
    it('should restore from JSON object', () => {
      const original = ApiKey.openai('sk-my-openai-key');
      const json = original.toJSON();

      const restored = ApiKey.fromJSON(json);

      expect(restored.key).toBe(original.key);
      expect(restored.service).toBe(original.service);
    });
  });

  describe('equals', () => {
    it('should return true for same key and service', () => {
      const key1 = ApiKey.openai('sk-same-key');
      const key2 = ApiKey.openai('sk-same-key');

      expect(key1.equals(key2)).toBe(true);
    });

    it('should return false for different keys', () => {
      const key1 = ApiKey.openai('sk-key-1');
      const key2 = ApiKey.openai('sk-key-2');

      expect(key1.equals(key2)).toBe(false);
    });
  });
});
