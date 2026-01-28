import { describe, it, expect } from 'vitest';

import { ApiKey } from '../valueObjects/ApiKey';

describe('ApiKey', () => {
  describe('create', () => {
    it('should create OpenAI API key', () => {
      const key = ApiKey.create('sk-test-key-12345', 'openai');

      expect(key.key).toBe('sk-test-key-12345');
      expect(key.service).toBe('openai');
    });

    it('should create Deepgram API key', () => {
      const key = ApiKey.create('abcdef1234567890abcdef1234567890', 'deepgram');

      expect(key.key).toBe('abcdef1234567890abcdef1234567890');
      expect(key.service).toBe('deepgram');
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

    it('should create Deepgram key via factory', () => {
      const key = ApiKey.deepgram('my-deepgram-key-that-is-32-chars-');

      expect(key.service).toBe('deepgram');
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

    it('should return true for valid Deepgram key (32+ chars)', () => {
      const key = ApiKey.deepgram('abcdef1234567890abcdef1234567890');

      expect(key.isValid).toBe(true);
    });

    it('should return false for short Deepgram key', () => {
      const key = ApiKey.deepgram('short-key');

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
      const original = ApiKey.deepgram('my-deepgram-key-that-is-at-least-32-chars');
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

    it('should return false for same key but different service', () => {
      const key1 = ApiKey.create('same-key-value-32-chars-long!!!!', 'openai');
      const key2 = ApiKey.create('same-key-value-32-chars-long!!!!', 'deepgram');

      expect(key1.equals(key2)).toBe(false);
    });
  });
});
