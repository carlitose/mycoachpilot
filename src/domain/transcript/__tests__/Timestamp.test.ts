import { describe, it, expect } from 'vitest';

import { Timestamp } from '../valueObjects/Timestamp';

describe('Timestamp', () => {
  describe('fromMilliseconds', () => {
    it('should create timestamp from milliseconds', () => {
      const ts = Timestamp.fromMilliseconds(5000);
      expect(ts.milliseconds).toBe(5000);
    });

    it('should allow zero milliseconds', () => {
      const ts = Timestamp.fromMilliseconds(0);
      expect(ts.milliseconds).toBe(0);
    });

    it('should throw on negative milliseconds', () => {
      expect(() => Timestamp.fromMilliseconds(-1000)).toThrow('Timestamp cannot be negative');
    });
  });

  describe('fromSeconds', () => {
    it('should create timestamp from seconds', () => {
      const ts = Timestamp.fromSeconds(5);
      expect(ts.milliseconds).toBe(5000);
    });

    it('should handle fractional seconds', () => {
      const ts = Timestamp.fromSeconds(1.5);
      expect(ts.milliseconds).toBe(1500);
    });

    it('should throw on negative seconds', () => {
      expect(() => Timestamp.fromSeconds(-1)).toThrow('Timestamp cannot be negative');
    });
  });

  describe('zero', () => {
    it('should create zero timestamp', () => {
      const ts = Timestamp.zero();
      expect(ts.milliseconds).toBe(0);
    });
  });

  describe('now', () => {
    it('should create timestamp close to current time', () => {
      const before = Date.now();
      const ts = Timestamp.now();
      const after = Date.now();

      expect(ts.milliseconds).toBeGreaterThanOrEqual(before);
      expect(ts.milliseconds).toBeLessThanOrEqual(after);
    });
  });

  describe('seconds getter', () => {
    it('should convert milliseconds to seconds', () => {
      const ts = Timestamp.fromMilliseconds(2500);
      expect(ts.seconds).toBe(2.5);
    });
  });

  describe('format', () => {
    it('should format as mm:ss', () => {
      const ts = Timestamp.fromSeconds(65);
      expect(ts.format()).toBe('01:05');
    });

    it('should pad single digit minutes', () => {
      const ts = Timestamp.fromSeconds(30);
      expect(ts.format()).toBe('00:30');
    });

    it('should handle zero', () => {
      const ts = Timestamp.zero();
      expect(ts.format()).toBe('00:00');
    });

    it('should format large values', () => {
      const ts = Timestamp.fromSeconds(3661); // 61 minutes, 1 second
      expect(ts.format()).toBe('61:01');
    });
  });

  describe('add', () => {
    it('should add two timestamps', () => {
      const ts1 = Timestamp.fromMilliseconds(1000);
      const ts2 = Timestamp.fromMilliseconds(500);
      const result = ts1.add(ts2);

      expect(result.milliseconds).toBe(1500);
    });

    it('should not mutate original', () => {
      const ts1 = Timestamp.fromMilliseconds(1000);
      const ts2 = Timestamp.fromMilliseconds(500);
      ts1.add(ts2);

      expect(ts1.milliseconds).toBe(1000);
    });
  });

  describe('subtract', () => {
    it('should subtract timestamps', () => {
      const ts1 = Timestamp.fromMilliseconds(1000);
      const ts2 = Timestamp.fromMilliseconds(400);
      const result = ts1.subtract(ts2);

      expect(result.milliseconds).toBe(600);
    });

    it('should clamp to zero if result would be negative', () => {
      const ts1 = Timestamp.fromMilliseconds(100);
      const ts2 = Timestamp.fromMilliseconds(500);
      const result = ts1.subtract(ts2);

      expect(result.milliseconds).toBe(0);
    });

    it('should not mutate original', () => {
      const ts1 = Timestamp.fromMilliseconds(1000);
      const ts2 = Timestamp.fromMilliseconds(400);
      ts1.subtract(ts2);

      expect(ts1.milliseconds).toBe(1000);
    });
  });

  describe('isBefore', () => {
    it('should return true if before other timestamp', () => {
      const ts1 = Timestamp.fromMilliseconds(100);
      const ts2 = Timestamp.fromMilliseconds(200);

      expect(ts1.isBefore(ts2)).toBe(true);
    });

    it('should return false if after other timestamp', () => {
      const ts1 = Timestamp.fromMilliseconds(200);
      const ts2 = Timestamp.fromMilliseconds(100);

      expect(ts1.isBefore(ts2)).toBe(false);
    });

    it('should return false if equal', () => {
      const ts1 = Timestamp.fromMilliseconds(100);
      const ts2 = Timestamp.fromMilliseconds(100);

      expect(ts1.isBefore(ts2)).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should return true if after other timestamp', () => {
      const ts1 = Timestamp.fromMilliseconds(200);
      const ts2 = Timestamp.fromMilliseconds(100);

      expect(ts1.isAfter(ts2)).toBe(true);
    });

    it('should return false if before other timestamp', () => {
      const ts1 = Timestamp.fromMilliseconds(100);
      const ts2 = Timestamp.fromMilliseconds(200);

      expect(ts1.isAfter(ts2)).toBe(false);
    });

    it('should return false if equal', () => {
      const ts1 = Timestamp.fromMilliseconds(100);
      const ts2 = Timestamp.fromMilliseconds(100);

      expect(ts1.isAfter(ts2)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same timestamp', () => {
      const ts1 = Timestamp.fromMilliseconds(1000);
      const ts2 = Timestamp.fromMilliseconds(1000);

      expect(ts1.equals(ts2)).toBe(true);
    });

    it('should return false for different timestamps', () => {
      const ts1 = Timestamp.fromMilliseconds(1000);
      const ts2 = Timestamp.fromMilliseconds(2000);

      expect(ts1.equals(ts2)).toBe(false);
    });
  });
});
