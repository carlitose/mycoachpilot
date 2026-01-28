import { describe, it, expect } from 'vitest';

import { SpeakerId } from '../valueObjects/SpeakerId';

describe('SpeakerId', () => {
  describe('create', () => {
    it('should create with valid id', () => {
      const id = SpeakerId.create(0);
      expect(id.toNumber()).toBe(0);
    });

    it('should create with positive id', () => {
      const id = SpeakerId.create(5);
      expect(id.toNumber()).toBe(5);
    });

    it('should throw on negative id', () => {
      expect(() => SpeakerId.create(-1)).toThrow('SpeakerId must be non-negative');
    });
  });

  describe('fromNumber', () => {
    it('should create from number', () => {
      const id = SpeakerId.fromNumber(3);
      expect(id.toNumber()).toBe(3);
    });

    it('should throw on negative number', () => {
      expect(() => SpeakerId.fromNumber(-5)).toThrow('SpeakerId must be non-negative');
    });
  });

  describe('toString', () => {
    it('should format as "Speaker X"', () => {
      const id = SpeakerId.create(1);
      expect(id.toString()).toBe('Speaker 1');
    });

    it('should format speaker 0', () => {
      const id = SpeakerId.create(0);
      expect(id.toString()).toBe('Speaker 0');
    });
  });

  describe('toNumber', () => {
    it('should return numeric value', () => {
      const id = SpeakerId.create(42);
      expect(id.toNumber()).toBe(42);
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const id1 = SpeakerId.create(1);
      const id2 = SpeakerId.create(1);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ids', () => {
      const id1 = SpeakerId.create(1);
      const id2 = SpeakerId.create(2);

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
