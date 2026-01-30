import { describe, it, expect } from 'vitest';

import reducer, {
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
  SessionSliceState,
} from '../sessionSlice';

describe('sessionSlice', () => {
  const initialState: SessionSliceState = {
    currentSession: null,
    connectionState: 'disconnected',
    error: null,
    audioLevel: 0,
    isMuted: false,
  };

  const mockSession = {
    id: 'session-1',
    mode: 'conversation' as const,
    status: 'idle' as const,
    templateId: 'general',
    audioConfig: {
      micEnabled: true,
      tabAudioEnabled: false,
      sampleRate: 24000,
      channelCount: 1,
    },
    startedAt: null,
    endedAt: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setSession', () => {
    it('should set current session', () => {
      const state = reducer(initialState, setSession(mockSession));

      expect(state.currentSession).toEqual(mockSession);
    });

    it('should clear state when session is null', () => {
      const stateWithSession: SessionSliceState = {
        ...initialState,
        currentSession: mockSession,
        connectionState: 'connected',
        error: { code: 'TEST', message: 'Error' },
      };

      const state = reducer(stateWithSession, setSession(null));

      expect(state.currentSession).toBeNull();
      expect(state.connectionState).toBe('disconnected');
      expect(state.error).toBeNull();
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status', () => {
      const stateWithSession: SessionSliceState = {
        ...initialState,
        currentSession: mockSession,
      };

      const state = reducer(stateWithSession, updateSessionStatus('active'));

      expect(state.currentSession?.status).toBe('active');
    });

    it('should not throw when no session exists', () => {
      const state = reducer(initialState, updateSessionStatus('active'));

      expect(state.currentSession).toBeNull();
    });
  });

  describe('setConnectionState', () => {
    it('should set connection state', () => {
      const state = reducer(initialState, setConnectionState('connecting'));

      expect(state.connectionState).toBe('connecting');
    });

    it('should clear error when connected', () => {
      const stateWithError: SessionSliceState = {
        ...initialState,
        error: { code: 'TEST', message: 'Error' },
      };

      const state = reducer(stateWithError, setConnectionState('connected'));

      expect(state.connectionState).toBe('connected');
      expect(state.error).toBeNull();
    });

    it('should not clear error for other states', () => {
      const stateWithError: SessionSliceState = {
        ...initialState,
        error: { code: 'TEST', message: 'Error' },
      };

      const state = reducer(stateWithError, setConnectionState('reconnecting'));

      expect(state.error).not.toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error and update connection state', () => {
      const error = { code: 'CONNECTION_FAILED', message: 'Failed to connect' };
      const state = reducer(initialState, setError(error));

      expect(state.error).toEqual(error);
      expect(state.connectionState).toBe('error');
    });

    it('should clear error when null', () => {
      const stateWithError: SessionSliceState = {
        ...initialState,
        error: { code: 'TEST', message: 'Error' },
        connectionState: 'error',
      };

      const state = reducer(stateWithError, setError(null));

      expect(state.error).toBeNull();
      // Connection state should remain unchanged
      expect(state.connectionState).toBe('error');
    });
  });

  describe('setAudioLevel', () => {
    it('should set audio level', () => {
      const state = reducer(initialState, setAudioLevel(0.75));

      expect(state.audioLevel).toBe(0.75);
    });

    it('should clamp audio level to 0', () => {
      const state = reducer(initialState, setAudioLevel(-0.5));

      expect(state.audioLevel).toBe(0);
    });

    it('should clamp audio level to 1', () => {
      const state = reducer(initialState, setAudioLevel(1.5));

      expect(state.audioLevel).toBe(1);
    });
  });

  describe('setMuted', () => {
    it('should set muted to true', () => {
      const state = reducer(initialState, setMuted(true));

      expect(state.isMuted).toBe(true);
    });

    it('should set muted to false', () => {
      const mutedState: SessionSliceState = { ...initialState, isMuted: true };
      const state = reducer(mutedState, setMuted(false));

      expect(state.isMuted).toBe(false);
    });
  });

  describe('sessionStarted', () => {
    it('should update session to active with startedAt', () => {
      const stateWithSession: SessionSliceState = {
        ...initialState,
        currentSession: mockSession,
      };
      const startedAt = '2024-01-15T10:00:00Z';

      const state = reducer(
        stateWithSession,
        sessionStarted({
          sessionId: 'session-1',
          mode: 'conversation',
          templateId: 'general',
          startedAt,
        }),
      );

      expect(state.currentSession?.status).toBe('active');
      expect(state.currentSession?.startedAt).toEqual(new Date(startedAt));
    });

    it('should not throw when no session exists', () => {
      const state = reducer(
        initialState,
        sessionStarted({
          sessionId: 'session-1',
          mode: 'conversation',
          templateId: null,
          startedAt: new Date().toISOString(),
        }),
      );

      expect(state.currentSession).toBeNull();
    });
  });

  describe('sessionPaused', () => {
    it('should update session to paused', () => {
      const activeSession = { ...mockSession, status: 'active' as const };
      const stateWithSession: SessionSliceState = {
        ...initialState,
        currentSession: activeSession,
      };

      const state = reducer(stateWithSession, sessionPaused());

      expect(state.currentSession?.status).toBe('paused');
    });
  });

  describe('sessionResumed', () => {
    it('should update session to active', () => {
      const pausedSession = { ...mockSession, status: 'paused' as const };
      const stateWithSession: SessionSliceState = {
        ...initialState,
        currentSession: pausedSession,
      };

      const state = reducer(stateWithSession, sessionResumed());

      expect(state.currentSession?.status).toBe('active');
    });
  });

  describe('sessionStopped', () => {
    it('should update session to stopped with endedAt', () => {
      const activeSession = { ...mockSession, status: 'active' as const };
      const stateWithSession: SessionSliceState = {
        ...initialState,
        currentSession: activeSession,
        connectionState: 'connected',
      };
      const endedAt = '2024-01-15T11:00:00Z';

      const state = reducer(stateWithSession, sessionStopped({ endedAt }));

      expect(state.currentSession?.status).toBe('stopped');
      expect(state.currentSession?.endedAt).toEqual(new Date(endedAt));
      expect(state.connectionState).toBe('disconnected');
    });
  });

  describe('resetSession', () => {
    it('should reset to initial state', () => {
      const stateWithData: SessionSliceState = {
        currentSession: mockSession,
        connectionState: 'connected',
        error: { code: 'TEST', message: 'Error' },
        audioLevel: 0.5,
        isMuted: true,
      };

      const state = reducer(stateWithData, resetSession());

      expect(state).toEqual(initialState);
    });
  });
});
