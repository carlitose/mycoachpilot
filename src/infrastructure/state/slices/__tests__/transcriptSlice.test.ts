import { describe, it, expect } from 'vitest';

import reducer, {
  addMessage,
  updateMessage,
  addSegment,
  updateSegment,
  addSpeaker,
  updateSpeaker,
  setUserSpeaker,
  setInterimTranscript,
  clearInterim,
  setMessages,
  setSegments,
  setSpeakers,
  clearTranscript,
  TranscriptSliceState,
} from '../transcriptSlice';

describe('transcriptSlice', () => {
  const initialState: TranscriptSliceState = {
    messages: [],
    segments: [],
    speakers: [],
    interimTranscript: null,
    userSpeakerId: null,
  };

  const mockMessage = {
    id: 'msg-1',
    role: 'user' as const,
    content: 'Hello',
    speakerId: null,
    timestamp: new Date(),
    isInterim: false,
  };

  const mockSegment = {
    id: 'seg-1',
    speakerId: 0,
    text: 'Hello there',
    startMs: 0,
    endMs: 1000,
    confidence: 0.95,
    words: [],
    isFinal: true,
  };

  const mockSpeaker = {
    id: 0,
    name: 'Speaker 0',
    isUser: false,
    wordCount: 10,
    segmentCount: 1,
    speakingTimeMs: 5000,
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('addMessage', () => {
    it('should add message to list', () => {
      const state = reducer(initialState, addMessage(mockMessage));

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(mockMessage);
    });

    it('should trim to MAX_MESSAGES (100)', () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        ...mockMessage,
        id: 'msg-' + String(i),
      }));
      const stateWith100: TranscriptSliceState = {
        ...initialState,
        messages,
      };

      const newMessage = { ...mockMessage, id: 'msg-new' };
      const state = reducer(stateWith100, addMessage(newMessage));

      expect(state.messages).toHaveLength(100);
      expect(state.messages[99]?.id).toBe('msg-new');
      expect(state.messages[0]?.id).toBe('msg-1');
    });
  });

  describe('updateMessage', () => {
    it('should update existing message', () => {
      const stateWithMessage: TranscriptSliceState = {
        ...initialState,
        messages: [mockMessage],
      };

      const state = reducer(
        stateWithMessage,
        updateMessage({ id: 'msg-1', content: 'Updated content', isInterim: false }),
      );

      expect(state.messages[0]?.content).toBe('Updated content');
    });

    it('should not throw when message not found', () => {
      const state = reducer(
        initialState,
        updateMessage({ id: 'non-existent', content: 'Test', isInterim: false }),
      );

      expect(state.messages).toHaveLength(0);
    });
  });

  describe('addSegment', () => {
    it('should add segment to list', () => {
      const state = reducer(initialState, addSegment(mockSegment));

      expect(state.segments).toHaveLength(1);
      expect(state.segments[0]).toEqual(mockSegment);
    });

    it('should update existing segment with same id', () => {
      const stateWithSegment: TranscriptSliceState = {
        ...initialState,
        segments: [mockSegment],
      };

      const updatedSegment = { ...mockSegment, text: 'Updated text', isFinal: true };
      const state = reducer(stateWithSegment, addSegment(updatedSegment));

      expect(state.segments).toHaveLength(1);
      expect(state.segments[0]?.text).toBe('Updated text');
    });

    it('should trim to MAX_SEGMENTS (500)', () => {
      const segments = Array.from({ length: 500 }, (_, i) => ({
        ...mockSegment,
        id: 'seg-' + String(i),
      }));
      const stateWith500: TranscriptSliceState = {
        ...initialState,
        segments,
      };

      const newSegment = { ...mockSegment, id: 'seg-new' };
      const state = reducer(stateWith500, addSegment(newSegment));

      expect(state.segments).toHaveLength(500);
      expect(state.segments[499]?.id).toBe('seg-new');
    });
  });

  describe('updateSegment', () => {
    it('should update existing segment', () => {
      const stateWithSegment: TranscriptSliceState = {
        ...initialState,
        segments: [mockSegment],
      };

      const updatedSegment = { ...mockSegment, confidence: 0.99 };
      const state = reducer(stateWithSegment, updateSegment(updatedSegment));

      expect(state.segments[0]?.confidence).toBe(0.99);
    });

    it('should not throw when segment not found', () => {
      const state = reducer(initialState, updateSegment({ ...mockSegment, id: 'non-existent' }));

      expect(state.segments).toHaveLength(0);
    });
  });

  describe('addSpeaker', () => {
    it('should add speaker to list', () => {
      const state = reducer(initialState, addSpeaker(mockSpeaker));

      expect(state.speakers).toHaveLength(1);
      expect(state.speakers[0]).toEqual(mockSpeaker);
    });

    it('should not add duplicate speaker', () => {
      const stateWithSpeaker: TranscriptSliceState = {
        ...initialState,
        speakers: [mockSpeaker],
      };

      const state = reducer(stateWithSpeaker, addSpeaker(mockSpeaker));

      expect(state.speakers).toHaveLength(1);
    });
  });

  describe('updateSpeaker', () => {
    it('should update existing speaker', () => {
      const stateWithSpeaker: TranscriptSliceState = {
        ...initialState,
        speakers: [mockSpeaker],
      };

      const updatedSpeaker = { ...mockSpeaker, name: 'John', wordCount: 50 };
      const state = reducer(stateWithSpeaker, updateSpeaker(updatedSpeaker));

      expect(state.speakers[0]?.name).toBe('John');
      expect(state.speakers[0]?.wordCount).toBe(50);
    });

    it('should not throw when speaker not found', () => {
      const state = reducer(initialState, updateSpeaker({ ...mockSpeaker, id: 999 }));

      expect(state.speakers).toHaveLength(0);
    });
  });

  describe('setUserSpeaker', () => {
    it('should set user speaker id', () => {
      const state = reducer(initialState, setUserSpeaker(1));

      expect(state.userSpeakerId).toBe(1);
    });

    it('should mark speaker as user', () => {
      const stateWithSpeaker: TranscriptSliceState = {
        ...initialState,
        speakers: [mockSpeaker],
      };

      const state = reducer(stateWithSpeaker, setUserSpeaker(0));

      expect(state.userSpeakerId).toBe(0);
      expect(state.speakers[0]?.isUser).toBe(true);
    });
  });

  describe('setInterimTranscript', () => {
    it('should set interim transcript', () => {
      const state = reducer(initialState, setInterimTranscript('Hello wor'));

      expect(state.interimTranscript).toBe('Hello wor');
    });

    it('should clear interim transcript with null', () => {
      const stateWithInterim: TranscriptSliceState = {
        ...initialState,
        interimTranscript: 'Hello',
      };

      const state = reducer(stateWithInterim, setInterimTranscript(null));

      expect(state.interimTranscript).toBeNull();
    });
  });

  describe('clearInterim', () => {
    it('should clear interim transcript', () => {
      const stateWithInterim: TranscriptSliceState = {
        ...initialState,
        interimTranscript: 'Hello',
      };

      const state = reducer(stateWithInterim, clearInterim());

      expect(state.interimTranscript).toBeNull();
    });
  });

  describe('setMessages', () => {
    it('should set messages', () => {
      const messages = [mockMessage, { ...mockMessage, id: 'msg-2' }];
      const state = reducer(initialState, setMessages(messages));

      expect(state.messages).toHaveLength(2);
    });

    it('should trim to MAX_MESSAGES', () => {
      const messages = Array.from({ length: 150 }, (_, i) => ({
        ...mockMessage,
        id: 'msg-' + String(i),
      }));

      const state = reducer(initialState, setMessages(messages));

      expect(state.messages).toHaveLength(100);
      expect(state.messages[0]?.id).toBe('msg-50');
    });
  });

  describe('setSegments', () => {
    it('should set segments', () => {
      const segments = [mockSegment, { ...mockSegment, id: 'seg-2' }];
      const state = reducer(initialState, setSegments(segments));

      expect(state.segments).toHaveLength(2);
    });

    it('should trim to MAX_SEGMENTS', () => {
      const segments = Array.from({ length: 600 }, (_, i) => ({
        ...mockSegment,
        id: 'seg-' + String(i),
      }));

      const state = reducer(initialState, setSegments(segments));

      expect(state.segments).toHaveLength(500);
      expect(state.segments[0]?.id).toBe('seg-100');
    });
  });

  describe('setSpeakers', () => {
    it('should set speakers', () => {
      const speakers = [mockSpeaker, { ...mockSpeaker, id: 1 }];
      const state = reducer(initialState, setSpeakers(speakers));

      expect(state.speakers).toHaveLength(2);
    });
  });

  describe('clearTranscript', () => {
    it('should reset to initial state', () => {
      const stateWithData: TranscriptSliceState = {
        messages: [mockMessage],
        segments: [mockSegment],
        speakers: [mockSpeaker],
        interimTranscript: 'Hello',
        userSpeakerId: 1,
      };

      const state = reducer(stateWithData, clearTranscript());

      expect(state).toEqual(initialState);
    });
  });
});
