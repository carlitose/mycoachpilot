import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { MessageProps, TranscriptSegmentProps, SpeakerProps } from '@domain/transcript';

const MAX_MESSAGES = 100;
const MAX_SEGMENTS = 500;

export interface TranscriptSliceState {
  messages: MessageProps[];
  segments: TranscriptSegmentProps[];
  speakers: SpeakerProps[];
  interimTranscript: string | null;
  userSpeakerId: number | null;
}

const initialState: TranscriptSliceState = {
  messages: [],
  segments: [],
  speakers: [],
  interimTranscript: null,
  userSpeakerId: null,
};

export const transcriptSlice = createSlice({
  name: 'transcript',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<MessageProps>) => {
      state.messages.push(action.payload);
      // Trim to max
      if (state.messages.length > MAX_MESSAGES) {
        state.messages = state.messages.slice(-MAX_MESSAGES);
      }
    },

    updateMessage: (state, action: PayloadAction<{ id: string; content: string; isInterim: boolean }>) => {
      const message = state.messages.find((m) => m.id === action.payload.id);
      if (message) {
        message.content = action.payload.content;
        message.isInterim = action.payload.isInterim;
      }
    },

    addSegment: (state, action: PayloadAction<TranscriptSegmentProps>) => {
      // Check if segment already exists (for updating interim)
      const existingIndex = state.segments.findIndex((s) => s.id === action.payload.id);
      if (existingIndex >= 0) {
        state.segments[existingIndex] = action.payload;
      } else {
        state.segments.push(action.payload);
      }
      // Trim to max
      if (state.segments.length > MAX_SEGMENTS) {
        state.segments = state.segments.slice(-MAX_SEGMENTS);
      }
    },

    updateSegment: (state, action: PayloadAction<TranscriptSegmentProps>) => {
      const index = state.segments.findIndex((s) => s.id === action.payload.id);
      if (index >= 0) {
        state.segments[index] = action.payload;
      }
    },

    addSpeaker: (state, action: PayloadAction<SpeakerProps>) => {
      const existing = state.speakers.find((s) => s.id === action.payload.id);
      if (!existing) {
        state.speakers.push(action.payload);
      }
    },

    updateSpeaker: (state, action: PayloadAction<SpeakerProps>) => {
      const index = state.speakers.findIndex((s) => s.id === action.payload.id);
      if (index >= 0) {
        state.speakers[index] = action.payload;
      }
    },

    setUserSpeaker: (state, action: PayloadAction<number>) => {
      state.userSpeakerId = action.payload;
      // Update speaker to mark as user
      const speaker = state.speakers.find((s) => s.id === action.payload);
      if (speaker) {
        speaker.isUser = true;
      }
    },

    setInterimTranscript: (state, action: PayloadAction<string | null>) => {
      state.interimTranscript = action.payload;
    },

    clearInterim: (state) => {
      state.interimTranscript = null;
    },

    setMessages: (state, action: PayloadAction<MessageProps[]>) => {
      state.messages = action.payload.slice(-MAX_MESSAGES);
    },

    setSegments: (state, action: PayloadAction<TranscriptSegmentProps[]>) => {
      state.segments = action.payload.slice(-MAX_SEGMENTS);
    },

    setSpeakers: (state, action: PayloadAction<SpeakerProps[]>) => {
      state.speakers = action.payload;
    },

    clearTranscript: () => initialState,
  },
});

export const {
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
} = transcriptSlice.actions;

export default transcriptSlice.reducer;
