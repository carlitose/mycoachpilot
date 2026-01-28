import { describe, it, expect } from 'vitest';

import { Speaker } from '../entities/Speaker';

describe('Speaker', () => {
  describe('create', () => {
    it('should create speaker with id', () => {
      const speaker = Speaker.create(1);

      expect(speaker.name).toBeNull();
      expect(speaker.isUser).toBe(false);
      expect(speaker.wordCount).toBe(0);
      expect(speaker.segmentCount).toBe(0);
      expect(speaker.speakingTimeMs).toBe(0);
    });

    it('should create speaker with id 0', () => {
      const speaker = Speaker.create(0);

      expect(speaker.displayName).toBe('Speaker 0');
    });
  });

  describe('displayName', () => {
    it('should return name if set', () => {
      const speaker = Speaker.create(1);
      speaker.setName('John');

      expect(speaker.displayName).toBe('John');
    });

    it('should return "You" if marked as user', () => {
      const speaker = Speaker.create(1);
      speaker.markAsUser();

      expect(speaker.displayName).toBe('You');
    });

    it('should return "Speaker X" as default', () => {
      const speaker = Speaker.create(3);

      expect(speaker.displayName).toBe('Speaker 3');
    });

    it('should prefer name over "You"', () => {
      const speaker = Speaker.create(1);
      speaker.markAsUser();
      speaker.setName('Me');

      expect(speaker.displayName).toBe('Me');
    });
  });

  describe('setName', () => {
    it('should set speaker name', () => {
      const speaker = Speaker.create(1);

      speaker.setName('Alice');

      expect(speaker.name).toBe('Alice');
    });
  });

  describe('markAsUser', () => {
    it('should mark speaker as user', () => {
      const speaker = Speaker.create(1);

      speaker.markAsUser();

      expect(speaker.isUser).toBe(true);
    });
  });

  describe('addSegment', () => {
    it('should update stats when adding segment', () => {
      const speaker = Speaker.create(1);

      speaker.addSegment(10, 5000);

      expect(speaker.wordCount).toBe(10);
      expect(speaker.segmentCount).toBe(1);
      expect(speaker.speakingTimeMs).toBe(5000);
    });

    it('should accumulate stats across multiple segments', () => {
      const speaker = Speaker.create(1);

      speaker.addSegment(10, 5000);
      speaker.addSegment(5, 2500);

      expect(speaker.wordCount).toBe(15);
      expect(speaker.segmentCount).toBe(2);
      expect(speaker.speakingTimeMs).toBe(7500);
    });
  });

  describe('speakingTimeFormatted', () => {
    it('should format speaking time as mm:ss', () => {
      const speaker = Speaker.create(1);
      speaker.addSegment(10, 65000); // 65 seconds = 1:05

      expect(speaker.speakingTimeFormatted).toBe('1:05');
    });

    it('should handle zero time', () => {
      const speaker = Speaker.create(1);

      expect(speaker.speakingTimeFormatted).toBe('0:00');
    });

    it('should pad seconds', () => {
      const speaker = Speaker.create(1);
      speaker.addSegment(5, 3000);

      expect(speaker.speakingTimeFormatted).toBe('0:03');
    });
  });

  describe('toProps', () => {
    it('should serialize to props object', () => {
      const speaker = Speaker.create(1);
      speaker.setName('Bob');
      speaker.markAsUser();
      speaker.addSegment(20, 10000);

      const props = speaker.toProps();

      expect(props.id).toBe(1);
      expect(props.name).toBe('Bob');
      expect(props.isUser).toBe(true);
      expect(props.wordCount).toBe(20);
      expect(props.segmentCount).toBe(1);
      expect(props.speakingTimeMs).toBe(10000);
    });
  });

  describe('fromProps', () => {
    it('should restore speaker from props', () => {
      const original = Speaker.create(2);
      original.setName('Jane');
      original.addSegment(30, 15000);
      const props = original.toProps();

      const restored = Speaker.fromProps(props);

      expect(restored.name).toBe('Jane');
      expect(restored.wordCount).toBe(30);
      expect(restored.speakingTimeMs).toBe(15000);
    });

    it('should restore isUser flag', () => {
      const original = Speaker.create(1);
      original.markAsUser();
      const props = original.toProps();

      const restored = Speaker.fromProps(props);

      expect(restored.isUser).toBe(true);
    });
  });
});
