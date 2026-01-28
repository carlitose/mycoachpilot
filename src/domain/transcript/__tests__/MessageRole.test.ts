import { describe, it, expect } from 'vitest';

import { MessageRole } from '../valueObjects/MessageRole';

describe('MessageRole', () => {
  describe('create', () => {
    it('should create user role', () => {
      const role = MessageRole.create('user');
      expect(role.toString()).toBe('user');
    });

    it('should create assistant role', () => {
      const role = MessageRole.create('assistant');
      expect(role.toString()).toBe('assistant');
    });

    it('should create system role', () => {
      const role = MessageRole.create('system');
      expect(role.toString()).toBe('system');
    });

    it('should create log role', () => {
      const role = MessageRole.create('log');
      expect(role.toString()).toBe('log');
    });

    it('should create transcript role', () => {
      const role = MessageRole.create('transcript');
      expect(role.toString()).toBe('transcript');
    });

    it('should throw on invalid role', () => {
      // @ts-expect-error Testing invalid input
      expect(() => MessageRole.create('invalid')).toThrow('Invalid message role');
    });
  });

  describe('factory methods', () => {
    it('should create user role via factory', () => {
      const role = MessageRole.user();
      expect(role.isUser()).toBe(true);
    });

    it('should create assistant role via factory', () => {
      const role = MessageRole.assistant();
      expect(role.isAssistant()).toBe(true);
    });

    it('should create system role via factory', () => {
      const role = MessageRole.system();
      expect(role.isSystem()).toBe(true);
    });

    it('should create log role via factory', () => {
      const role = MessageRole.log();
      expect(role.isLog()).toBe(true);
    });

    it('should create transcript role via factory', () => {
      const role = MessageRole.transcript();
      expect(role.isTranscript()).toBe(true);
    });
  });

  describe('type checks', () => {
    it('isUser returns true only for user', () => {
      expect(MessageRole.user().isUser()).toBe(true);
      expect(MessageRole.assistant().isUser()).toBe(false);
      expect(MessageRole.system().isUser()).toBe(false);
      expect(MessageRole.log().isUser()).toBe(false);
      expect(MessageRole.transcript().isUser()).toBe(false);
    });

    it('isAssistant returns true only for assistant', () => {
      expect(MessageRole.user().isAssistant()).toBe(false);
      expect(MessageRole.assistant().isAssistant()).toBe(true);
      expect(MessageRole.system().isAssistant()).toBe(false);
      expect(MessageRole.log().isAssistant()).toBe(false);
      expect(MessageRole.transcript().isAssistant()).toBe(false);
    });

    it('isSystem returns true only for system', () => {
      expect(MessageRole.user().isSystem()).toBe(false);
      expect(MessageRole.assistant().isSystem()).toBe(false);
      expect(MessageRole.system().isSystem()).toBe(true);
      expect(MessageRole.log().isSystem()).toBe(false);
      expect(MessageRole.transcript().isSystem()).toBe(false);
    });

    it('isLog returns true only for log', () => {
      expect(MessageRole.user().isLog()).toBe(false);
      expect(MessageRole.assistant().isLog()).toBe(false);
      expect(MessageRole.system().isLog()).toBe(false);
      expect(MessageRole.log().isLog()).toBe(true);
      expect(MessageRole.transcript().isLog()).toBe(false);
    });

    it('isTranscript returns true only for transcript', () => {
      expect(MessageRole.user().isTranscript()).toBe(false);
      expect(MessageRole.assistant().isTranscript()).toBe(false);
      expect(MessageRole.system().isTranscript()).toBe(false);
      expect(MessageRole.log().isTranscript()).toBe(false);
      expect(MessageRole.transcript().isTranscript()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for same role', () => {
      const role1 = MessageRole.user();
      const role2 = MessageRole.user();

      expect(role1.equals(role2)).toBe(true);
    });

    it('should return false for different roles', () => {
      const role1 = MessageRole.user();
      const role2 = MessageRole.assistant();

      expect(role1.equals(role2)).toBe(false);
    });
  });
});
