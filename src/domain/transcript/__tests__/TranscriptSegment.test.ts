import { describe, it, expect } from 'vitest';

import { TranscriptSegment, type Word } from '../entities/TranscriptSegment';

describe('TranscriptSegment', () => {
  const sampleWords: Word[] = [
    { text: 'Hello', startMs: 0, endMs: 500, confidence: 0.95 },
    { text: 'world', startMs: 500, endMs: 1000, confidence: 0.92 },
  ];

  describe('create', () => {
    it('should create segment with required fields', () => {
      const segment = TranscriptSegment.create(1, 'Hello world', 0, 1000);

      expect(segment.speakerId).toBe(1);
      expect(segment.text).toBe('Hello world');
      expect(segment.startTime.milliseconds).toBe(0);
      expect(segment.endTime.milliseconds).toBe(1000);
      expect(segment.confidence).toBe(0);
      expect(segment.words).toEqual([]);
      expect(segment.isFinal).toBe(false);
    });

    it('should create segment with options', () => {
      const segment = TranscriptSegment.create(0, 'Hello', 100, 600, {
        confidence: 0.95,
        words: sampleWords,
        isFinal: true,
      });

      expect(segment.confidence).toBe(0.95);
      expect(segment.words).toEqual(sampleWords);
      expect(segment.isFinal).toBe(true);
    });
  });

  describe('computed properties', () => {
    it('should calculate duration', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 1000, 3500);

      expect(segment.durationMs).toBe(2500);
    });

    it('should calculate word count', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 0, 1000, { words: sampleWords });

      expect(segment.wordCount).toBe(2);
    });

    it('should format start time', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 65000, 70000);

      expect(segment.formattedStartTime).toBe('01:05');
    });

    it('should format end time', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 0, 125000);

      expect(segment.formattedEndTime).toBe('02:05');
    });
  });

  describe('words getter', () => {
    it('should return copy of words array', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 0, 1000, { words: sampleWords });

      const words = segment.words;
      words.push({ text: 'test', startMs: 1000, endMs: 1500, confidence: 0.9 });

      expect(segment.words).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update segment text and timing', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 0, 500);
      const newWords: Word[] = [
        { text: 'Hello', startMs: 0, endMs: 500, confidence: 0.95 },
        { text: 'there', startMs: 500, endMs: 900, confidence: 0.88 },
      ];

      segment.update('Hello there', 900, 0.91, newWords);

      expect(segment.text).toBe('Hello there');
      expect(segment.endTime.milliseconds).toBe(900);
      expect(segment.confidence).toBe(0.91);
      expect(segment.words).toHaveLength(2);
    });
  });

  describe('finalize', () => {
    it('should mark segment as final', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 0, 1000);

      segment.finalize();

      expect(segment.isFinal).toBe(true);
    });
  });

  describe('toProps', () => {
    it('should serialize to props object', () => {
      const segment = TranscriptSegment.create(2, 'Hello world', 1000, 3000, {
        confidence: 0.9,
        words: sampleWords,
        isFinal: true,
      });
      const props = segment.toProps();

      expect(props.speakerId).toBe(2);
      expect(props.text).toBe('Hello world');
      expect(props.startMs).toBe(1000);
      expect(props.endMs).toBe(3000);
      expect(props.confidence).toBe(0.9);
      expect(props.words).toEqual(sampleWords);
      expect(props.isFinal).toBe(true);
      expect(props.id).toBeDefined();
    });

    it('should return copy of words array', () => {
      const segment = TranscriptSegment.create(1, 'Hello', 0, 1000, { words: sampleWords });
      const props = segment.toProps();

      props.words.push({ text: 'test', startMs: 1000, endMs: 1500, confidence: 0.9 });

      expect(segment.words).toHaveLength(2);
    });
  });

  describe('fromProps', () => {
    it('should restore segment from props', () => {
      const original = TranscriptSegment.create(1, 'Test message', 5000, 8000, {
        confidence: 0.88,
        words: sampleWords,
        isFinal: true,
      });
      const props = original.toProps();

      const restored = TranscriptSegment.fromProps(props);

      expect(restored.speakerId).toBe(1);
      expect(restored.text).toBe('Test message');
      expect(restored.startTime.milliseconds).toBe(5000);
      expect(restored.endTime.milliseconds).toBe(8000);
      expect(restored.confidence).toBe(0.88);
      expect(restored.isFinal).toBe(true);
    });

    it('should restore interim segment from props', () => {
      const original = TranscriptSegment.create(0, 'In progress', 0, 500, { isFinal: false });
      const props = original.toProps();

      const restored = TranscriptSegment.fromProps(props);

      expect(restored.isFinal).toBe(false);
    });
  });
});
