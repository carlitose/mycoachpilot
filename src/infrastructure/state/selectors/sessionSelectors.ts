import { createSelector } from '@reduxjs/toolkit';

import type { SessionSliceState } from '../slices/sessionSlice';
import type { RootState } from '../store';

export const selectSession = (state: RootState): SessionSliceState => state.session;

export const selectCurrentSession = createSelector(
  selectSession,
  (session) => session.currentSession,
);

export const selectConnectionState = createSelector(
  selectSession,
  (session) => session.connectionState,
);

export const selectSessionError = createSelector(
  selectSession,
  (session) => session.error,
);

export const selectAudioLevel = createSelector(
  selectSession,
  (session) => session.audioLevel,
);

export const selectIsMuted = createSelector(
  selectSession,
  (session) => session.isMuted,
);

export const selectIsSessionActive = createSelector(
  selectCurrentSession,
  (session) => session?.status === 'active',
);

export const selectIsSessionPaused = createSelector(
  selectCurrentSession,
  (session) => session?.status === 'paused',
);

export const selectSessionMode = createSelector(
  selectCurrentSession,
  (session) => session?.mode ?? null,
);

export const selectIsConnected = createSelector(
  selectConnectionState,
  (state) => state === 'connected',
);

export const selectIsConnecting = createSelector(
  selectConnectionState,
  (state) => state === 'connecting' || state === 'reconnecting',
);
