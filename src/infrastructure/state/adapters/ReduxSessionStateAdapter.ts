/**
 * Redux Session State Adapter
 * Implements SessionStatePort using Redux
 */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { SessionStatePort } from '@application/ports';

import {
  selectAudioLevel,
  selectConnectionState,
  selectCurrentSession,
  selectIsConnected,
  selectIsConnecting,
  selectIsMuted,
  selectIsSessionActive,
  selectIsSessionPaused,
  selectSessionError,
  selectSessionMode,
} from '../selectors/sessionSelectors';
import {
  resetSession,
  sessionPaused,
  sessionResumed,
  sessionStarted,
  sessionStopped,
  setAudioLevel,
  setConnectionState,
  setError,
  setMuted,
  setSession,
  updateSessionStatus,
} from '../slices/sessionSlice';
import type { AppDispatch, RootState } from '../store';

/**
 * Hook that provides a SessionStatePort implementation backed by Redux.
 * Must be called within a React component inside a Redux Provider.
 */
export function useReduxSessionState(): SessionStatePort {
  const dispatch = useDispatch<AppDispatch>();

  // Reactive values - call all selectors at top level (proper hooks usage)
  const currentSession = useSelector((state: RootState) => selectCurrentSession(state));
  const connectionState = useSelector((state: RootState) => selectConnectionState(state));
  const error = useSelector((state: RootState) => selectSessionError(state));
  const audioLevel = useSelector((state: RootState) => selectAudioLevel(state));
  const isMuted = useSelector((state: RootState) => selectIsMuted(state));
  const isActive = useSelector((state: RootState) => selectIsSessionActive(state));
  const isPaused = useSelector((state: RootState) => selectIsSessionPaused(state));
  const mode = useSelector((state: RootState) => selectSessionMode(state));
  const isConnected = useSelector((state: RootState) => selectIsConnected(state));
  const isConnecting = useSelector((state: RootState) => selectIsConnecting(state));

  // Memoize actions to maintain stable references
  const actions = useMemo(() => ({
    setSession: (session: Parameters<SessionStatePort['setSession']>[0]) => dispatch(setSession(session)),
    updateSessionStatus: (status: Parameters<SessionStatePort['updateSessionStatus']>[0]) => dispatch(updateSessionStatus(status)),
    setConnectionState: (state: Parameters<SessionStatePort['setConnectionState']>[0]) => dispatch(setConnectionState(state)),
    setError: (err: Parameters<SessionStatePort['setError']>[0]) => dispatch(setError(err)),
    setAudioLevel: (level: Parameters<SessionStatePort['setAudioLevel']>[0]) => dispatch(setAudioLevel(level)),
    setMuted: (muted: Parameters<SessionStatePort['setMuted']>[0]) => dispatch(setMuted(muted)),
    sessionStarted: (data: Parameters<SessionStatePort['sessionStarted']>[0]) => dispatch(sessionStarted(data)),
    sessionPaused: () => dispatch(sessionPaused()),
    sessionResumed: () => dispatch(sessionResumed()),
    sessionStopped: (data: Parameters<SessionStatePort['sessionStopped']>[0]) => dispatch(sessionStopped(data)),
    resetSession: () => dispatch(resetSession()),
  }), [dispatch]);

  return {
    // Reactive values
    currentSession,
    connectionState,
    error,
    audioLevel,
    isMuted,
    isActive,
    isPaused,
    mode,
    isConnected,
    isConnecting,
    // Actions
    ...actions,
  };
}
