import { describe, it, expect } from 'vitest';

import { TemplateId } from '../valueObjects/TemplateId';

describe('TemplateId', () => {
  describe('create', () => {
    it('should create a unique ID when no argument provided', () => {
      const id1 = TemplateId.create();
      const id2 = TemplateId.create();

      expect(id1.toString()).not.toBe(id2.toString());
    });

    it('should create with provided ID', () => {
      const id = TemplateId.create('custom-template');

      expect(id.toString()).toBe('custom-template');
    });

    it('should generate UUID format when no id provided', () => {
      const id = TemplateId.create();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(id.toString()).toMatch(uuidRegex);
    });
  });

  describe('fromString', () => {
    it('should restore ID from string', () => {
      const original = TemplateId.create('my-template');
      const restored = TemplateId.fromString(original.toString());

      expect(restored.equals(original)).toBe(true);
    });

    it('should throw on empty string', () => {
      expect(() => TemplateId.fromString('')).toThrow('TemplateId cannot be empty');
    });

    it('should throw on whitespace-only string', () => {
      expect(() => TemplateId.fromString('   ')).toThrow('TemplateId cannot be empty');
    });
  });

  describe('factory methods', () => {
    it('should create general template id', () => {
      const id = TemplateId.general();
      expect(id.toString()).toBe('general');
    });

    it('should create interview template id', () => {
      const id = TemplateId.interview();
      expect(id.toString()).toBe('interview');
    });

    it('should create sales template id', () => {
      const id = TemplateId.sales();
      expect(id.toString()).toBe('sales');
    });

    it('should create presentation template id', () => {
      const id = TemplateId.presentation();
      expect(id.toString()).toBe('presentation');
    });
  });

  describe('isPredefined', () => {
    it('should return true for predefined templates', () => {
      expect(TemplateId.general().isPredefined()).toBe(true);
      expect(TemplateId.interview().isPredefined()).toBe(true);
      expect(TemplateId.sales().isPredefined()).toBe(true);
      expect(TemplateId.presentation().isPredefined()).toBe(true);
    });

    it('should return false for custom templates', () => {
      const customId = TemplateId.create('my-custom-template');
      expect(customId.isPredefined()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same ID', () => {
      const id1 = TemplateId.general();
      const id2 = TemplateId.fromString('general');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const id1 = TemplateId.general();
      const id2 = TemplateId.interview();

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
