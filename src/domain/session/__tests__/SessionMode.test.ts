import { describe, it, expect } from 'vitest';

import { SessionMode } from '../valueObjects/SessionMode';

describe('SessionMode', () => {
  describe('create', () => {
    it('should create conversation mode', () => {
      const mode = SessionMode.create('conversation');
      expect(mode.toString()).toBe('conversation');
    });

    it('should create transcript_only mode', () => {
      const mode = SessionMode.create('transcript_only');
      expect(mode.toString()).toBe('transcript_only');
    });

    it('should create meeting_coach mode', () => {
      const mode = SessionMode.create('meeting_coach');
      expect(mode.toString()).toBe('meeting_coach');
    });

    it('should throw on invalid mode', () => {
      // @ts-expect-error Testing invalid input
      expect(() => SessionMode.create('invalid')).toThrow('Invalid session mode');
    });
  });

  describe('factory methods', () => {
    it('should create conversation mode via factory', () => {
      const mode = SessionMode.conversation();
      expect(mode.isConversation()).toBe(true);
    });

    it('should create transcriptOnly mode via factory', () => {
      const mode = SessionMode.transcriptOnly();
      expect(mode.isTranscriptOnly()).toBe(true);
    });

    it('should create meetingCoach mode via factory', () => {
      const mode = SessionMode.meetingCoach();
      expect(mode.isMeetingCoach()).toBe(true);
    });
  });

  describe('type checks', () => {
    it('isConversation returns true only for conversation', () => {
      expect(SessionMode.conversation().isConversation()).toBe(true);
      expect(SessionMode.transcriptOnly().isConversation()).toBe(false);
      expect(SessionMode.meetingCoach().isConversation()).toBe(false);
    });

    it('isTranscriptOnly returns true only for transcript_only', () => {
      expect(SessionMode.conversation().isTranscriptOnly()).toBe(false);
      expect(SessionMode.transcriptOnly().isTranscriptOnly()).toBe(true);
      expect(SessionMode.meetingCoach().isTranscriptOnly()).toBe(false);
    });

    it('isMeetingCoach returns true only for meeting_coach', () => {
      expect(SessionMode.conversation().isMeetingCoach()).toBe(false);
      expect(SessionMode.transcriptOnly().isMeetingCoach()).toBe(false);
      expect(SessionMode.meetingCoach().isMeetingCoach()).toBe(true);
    });
  });

  describe('service requirements', () => {
    it('requiresOpenAI returns true for all modes', () => {
      expect(SessionMode.conversation().requiresOpenAI()).toBe(true);
      expect(SessionMode.transcriptOnly().requiresOpenAI()).toBe(true);
      expect(SessionMode.meetingCoach().requiresOpenAI()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for same mode', () => {
      const mode1 = SessionMode.conversation();
      const mode2 = SessionMode.conversation();

      expect(mode1.equals(mode2)).toBe(true);
    });

    it('should return false for different modes', () => {
      const mode1 = SessionMode.conversation();
      const mode2 = SessionMode.meetingCoach();

      expect(mode1.equals(mode2)).toBe(false);
    });
  });
});
