import { describe, it, expect } from 'vitest';

import { CoachingStyle } from '../valueObjects/CoachingStyle';

describe('CoachingStyle', () => {
  describe('create', () => {
    it('should create diplomatic style', () => {
      const style = CoachingStyle.create('diplomatic');
      expect(style.toString()).toBe('diplomatic');
    });

    it('should create assertive style', () => {
      const style = CoachingStyle.create('assertive');
      expect(style.toString()).toBe('assertive');
    });

    it('should create analytical style', () => {
      const style = CoachingStyle.create('analytical');
      expect(style.toString()).toBe('analytical');
    });

    it('should create supportive style', () => {
      const style = CoachingStyle.create('supportive');
      expect(style.toString()).toBe('supportive');
    });

    it('should throw on invalid style', () => {
      // @ts-expect-error Testing invalid input
      expect(() => CoachingStyle.create('invalid')).toThrow('Invalid coaching style');
    });
  });

  describe('factory methods', () => {
    it('should create diplomatic via factory', () => {
      const style = CoachingStyle.diplomatic();
      expect(style.toString()).toBe('diplomatic');
    });

    it('should create assertive via factory', () => {
      const style = CoachingStyle.assertive();
      expect(style.toString()).toBe('assertive');
    });

    it('should create analytical via factory', () => {
      const style = CoachingStyle.analytical();
      expect(style.toString()).toBe('analytical');
    });

    it('should create supportive via factory', () => {
      const style = CoachingStyle.supportive();
      expect(style.toString()).toBe('supportive');
    });

    it('should create diplomatic as default', () => {
      const style = CoachingStyle.default();
      expect(style.toString()).toBe('diplomatic');
    });
  });

  describe('displayName', () => {
    it('should capitalize first letter', () => {
      expect(CoachingStyle.diplomatic().displayName).toBe('Diplomatic');
      expect(CoachingStyle.assertive().displayName).toBe('Assertive');
      expect(CoachingStyle.analytical().displayName).toBe('Analytical');
      expect(CoachingStyle.supportive().displayName).toBe('Supportive');
    });
  });

  describe('description', () => {
    it('should return description for diplomatic', () => {
      const style = CoachingStyle.diplomatic();
      expect(style.description).toContain('Tactful');
    });

    it('should return description for assertive', () => {
      const style = CoachingStyle.assertive();
      expect(style.description).toContain('Direct');
    });

    it('should return description for analytical', () => {
      const style = CoachingStyle.analytical();
      expect(style.description).toContain('Data-driven');
    });

    it('should return description for supportive', () => {
      const style = CoachingStyle.supportive();
      expect(style.description).toContain('Empathetic');
    });
  });

  describe('allStyles', () => {
    it('should return all valid styles', () => {
      const styles = CoachingStyle.allStyles();

      expect(styles).toContain('diplomatic');
      expect(styles).toContain('assertive');
      expect(styles).toContain('analytical');
      expect(styles).toContain('supportive');
      expect(styles).toHaveLength(4);
    });

    it('should return a copy of the array', () => {
      const styles1 = CoachingStyle.allStyles();
      const styles2 = CoachingStyle.allStyles();

      expect(styles1).not.toBe(styles2);
      expect(styles1).toEqual(styles2);
    });
  });

  describe('equals', () => {
    it('should return true for same style', () => {
      const style1 = CoachingStyle.diplomatic();
      const style2 = CoachingStyle.diplomatic();

      expect(style1.equals(style2)).toBe(true);
    });

    it('should return false for different styles', () => {
      const style1 = CoachingStyle.diplomatic();
      const style2 = CoachingStyle.assertive();

      expect(style1.equals(style2)).toBe(false);
    });
  });
});
