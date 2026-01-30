import { describe, it, expect } from 'vitest';

import { Message } from '../entities/Message';

describe('Message', () => {
  describe('create', () => {
    it('should create message with role and content', () => {
      const message = Message.create('user', 'Hello world');

      expect(message.role.toString()).toBe('user');
      expect(message.content).toBe('Hello world');
      expect(message.isInterim).toBe(false);
      expect(message.speakerId).toBeNull();
    });

    it('should create message with speakerId', () => {
      const message = Message.create('transcript', 'Hello', { speakerId: 1 });

      expect(message.speakerId).toBe(1);
    });

    it('should create interim message', () => {
      const message = Message.create('user', 'Hello', { isInterim: true });

      expect(message.isInterim).toBe(true);
    });

    it('should set timestamp on creation', () => {
      const before = new Date();
      const message = Message.create('user', 'Hello');
      const after = new Date();

      expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(message.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('factory methods', () => {
    it('should create user message', () => {
      const message = Message.userMessage('Hello');

      expect(message.role.isUser()).toBe(true);
      expect(message.content).toBe('Hello');
    });

    it('should create user message with speakerId', () => {
      const message = Message.userMessage('Hello', 2);

      expect(message.speakerId).toBe(2);
    });

    it('should create assistant message', () => {
      const message = Message.assistantMessage('Hello');

      expect(message.role.isAssistant()).toBe(true);
      expect(message.content).toBe('Hello');
    });

    it('should create system message', () => {
      const message = Message.systemMessage('Session started');

      expect(message.role.isSystem()).toBe(true);
      expect(message.content).toBe('Session started');
    });

    it('should create log message', () => {
      const message = Message.logMessage('Debug info');

      expect(message.role.isLog()).toBe(true);
      expect(message.content).toBe('Debug info');
    });

    it('should create transcript message', () => {
      const message = Message.transcriptMessage('Hello world', 1, false);

      expect(message.role.isTranscript()).toBe(true);
      expect(message.speakerId).toBe(1);
      expect(message.isInterim).toBe(false);
    });

    it('should create interim transcript message', () => {
      const message = Message.transcriptMessage('Hello...', 0, true);

      expect(message.isInterim).toBe(true);
    });
  });

  describe('finalize', () => {
    it('should update content and mark as not interim', () => {
      const message = Message.create('user', 'Hell', { isInterim: true });

      message.finalize('Hello world');

      expect(message.content).toBe('Hello world');
      expect(message.isInterim).toBe(false);
    });
  });

  describe('appendContent', () => {
    it('should append text to content', () => {
      const message = Message.create('user', 'Hello');

      message.appendContent(' world');

      expect(message.content).toBe('Hello world');
    });
  });

  describe('toProps', () => {
    it('should serialize to props object', () => {
      const message = Message.create('user', 'Hello', { speakerId: 1 });
      const props = message.toProps();

      expect(props.role).toBe('user');
      expect(props.content).toBe('Hello');
      expect(props.speakerId).toBe(1);
      expect(props.isInterim).toBe(false);
      expect(props.id).toBeDefined();
      expect(props.timestamp).toBeDefined();
    });
  });

  describe('fromProps', () => {
    it('should restore message from props', () => {
      const original = Message.userMessage('Hello', 1);
      const props = original.toProps();

      const restored = Message.fromProps(props);

      expect(restored.role.toString()).toBe(original.role.toString());
      expect(restored.content).toBe(original.content);
      expect(restored.speakerId).toBe(original.speakerId);
    });

    it('should restore interim message from props', () => {
      const original = Message.create('transcript', 'Hello...', { speakerId: 0, isInterim: true });
      const props = original.toProps();

      const restored = Message.fromProps(props);

      expect(restored.isInterim).toBe(true);
    });
  });
});
