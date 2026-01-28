import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { SessionProps, SessionModeType, SessionStatusType } from '@domain/session';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export interface SessionSliceState {
  currentSession: SessionProps | null;
  connectionState: ConnectionState;
  error: { code: string; message: string } | null;
  audioLevel: number; // 0-1
  isMuted: boolean;
}

const initialState: SessionSliceState = {
  currentSession: null,
  connectionState: 'disconnected',
  error: null,
  audioLevel: 0,
  isMuted: false,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<SessionProps | null>) => {
      state.currentSession = action.payload;
      if (action.payload === null) {
        state.connectionState = 'disconnected';
        state.error = null;
      }
    },

    updateSessionStatus: (state, action: PayloadAction<SessionStatusType>) => {
      if (state.currentSession) {
        state.currentSession.status = action.payload;
      }
    },

    setConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.connectionState = action.payload;
      if (action.payload === 'connected') {
        state.error = null;
      }
    },

    setError: (state, action: PayloadAction<{ code: string; message: string } | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.connectionState = 'error';
      }
    },

    setAudioLevel: (state, action: PayloadAction<number>) => {
      state.audioLevel = Math.max(0, Math.min(1, action.payload));
    },

    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },

    sessionStarted: (state, action: PayloadAction<{ sessionId: string; mode: SessionModeType; templateId: string | null; startedAt: string }>) => {
      if (state.currentSession) {
        state.currentSession.status = 'active';
        state.currentSession.startedAt = new Date(action.payload.startedAt);
      }
    },

    sessionPaused: (state) => {
      if (state.currentSession) {
        state.currentSession.status = 'paused';
      }
    },

    sessionResumed: (state) => {
      if (state.currentSession) {
        state.currentSession.status = 'active';
      }
    },

    sessionStopped: (state, action: PayloadAction<{ endedAt: string }>) => {
      if (state.currentSession) {
        state.currentSession.status = 'stopped';
        state.currentSession.endedAt = new Date(action.payload.endedAt);
      }
      state.connectionState = 'disconnected';
    },

    resetSession: () => initialState,
  },
});

export const {
  setSession,
  updateSessionStatus,
  setConnectionState,
  setError,
  setAudioLevel,
  setMuted,
  sessionStarted,
  sessionPaused,
  sessionResumed,
  sessionStopped,
  resetSession,
} = sessionSlice.actions;

export default sessionSlice.reducer;
