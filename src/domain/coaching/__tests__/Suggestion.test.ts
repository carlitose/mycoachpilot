import { describe, it, expect } from 'vitest';

import { Suggestion } from '../entities/Suggestion';

describe('Suggestion', () => {
  describe('create', () => {
    it('should create suggestion with required fields', () => {
      const suggestion = Suggestion.create('session-1', 'question', 'Ask about their needs');

      expect(suggestion.sessionId).toBe('session-1');
      expect(suggestion.type.toString()).toBe('question');
      expect(suggestion.content).toBe('Ask about their needs');
      expect(suggestion.used).toBe(false);
      expect(suggestion.dismissed).toBe(false);
      expect(suggestion.context).toBeNull();
      expect(suggestion.confidence).toBe(0.8); // default
    });

    it('should create suggestion with context', () => {
      const suggestion = Suggestion.create('session-1', 'response_suggestion', 'Try this', {
        context: 'Customer mentioned budget concerns',
      });

      expect(suggestion.context).toBe('Customer mentioned budget concerns');
    });

    it('should create suggestion with custom confidence', () => {
      const suggestion = Suggestion.create('session-1', 'talking_point', 'Key point', {
        confidence: 0.95,
      });

      expect(suggestion.confidence).toBe(0.95);
    });

    it('should set timestamp on creation', () => {
      const before = new Date();
      const suggestion = Suggestion.create('session-1', 'general', 'Tip');
      const after = new Date();

      expect(suggestion.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(suggestion.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('isActive', () => {
    it('should be active when not used and not dismissed', () => {
      const suggestion = Suggestion.create('session-1', 'question', 'Ask this');

      expect(suggestion.isActive).toBe(true);
    });

    it('should not be active when used', () => {
      const suggestion = Suggestion.create('session-1', 'question', 'Ask this');
      suggestion.markAsUsed();

      expect(suggestion.isActive).toBe(false);
    });

    it('should not be active when dismissed', () => {
      const suggestion = Suggestion.create('session-1', 'question', 'Ask this');
      suggestion.dismiss();

      expect(suggestion.isActive).toBe(false);
    });
  });

  describe('markAsUsed', () => {
    it('should mark suggestion as used', () => {
      const suggestion = Suggestion.create('session-1', 'response_suggestion', 'Say this');

      suggestion.markAsUsed();

      expect(suggestion.used).toBe(true);
    });
  });

  describe('dismiss', () => {
    it('should mark suggestion as dismissed', () => {
      const suggestion = Suggestion.create('session-1', 'talking_point', 'Mention this');

      suggestion.dismiss();

      expect(suggestion.dismissed).toBe(true);
    });
  });

  describe('toProps', () => {
    it('should serialize to props object', () => {
      const suggestion = Suggestion.create('session-123', 'objection_handling', 'Handle like this', {
        context: 'Price objection',
        confidence: 0.9,
      });
      const props = suggestion.toProps();

      expect(props.sessionId).toBe('session-123');
      expect(props.type).toBe('objection_handling');
      expect(props.content).toBe('Handle like this');
      expect(props.context).toBe('Price objection');
      expect(props.confidence).toBe(0.9);
      expect(props.used).toBe(false);
      expect(props.dismissed).toBe(false);
      expect(props.id).toBeDefined();
      expect(props.timestamp).toBeDefined();
    });
  });

  describe('fromProps', () => {
    it('should restore suggestion from props', () => {
      const original = Suggestion.create('session-1', 'closing', 'Close now', {
        context: 'Good moment',
        confidence: 0.85,
      });
      const props = original.toProps();

      const restored = Suggestion.fromProps(props);

      expect(restored.sessionId).toBe(original.sessionId);
      expect(restored.type.toString()).toBe(original.type.toString());
      expect(restored.content).toBe(original.content);
      expect(restored.context).toBe(original.context);
      expect(restored.confidence).toBe(original.confidence);
    });

    it('should restore used and dismissed state', () => {
      const original = Suggestion.create('session-1', 'question', 'Ask?');
      original.markAsUsed();
      original.dismiss();
      const props = original.toProps();

      const restored = Suggestion.fromProps(props);

      expect(restored.used).toBe(true);
      expect(restored.dismissed).toBe(true);
    });
  });
});
