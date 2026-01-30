/**
 * Session State Port
 * Abstracts session state access for Clean Architecture compliance
 */
import type { SessionProps, SessionModeType, SessionStatusType } from '@domain/session';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export interface SessionStateError {
  code: string;
  message: string;
}

/**
 * Port interface for accessing session state.
 * Implementations (adapters) are React hooks that return this interface.
 * The values are reactive - components will re-render when they change.
 */
export interface SessionStatePort {
  // Reactive values - automatically update when state changes
  currentSession: SessionProps | null;
  connectionState: ConnectionState;
  error: SessionStateError | null;
  audioLevel: number;
  isMuted: boolean;
  isActive: boolean;
  isPaused: boolean;
  mode: SessionModeType | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Actions - imperatively update state
  setSession(session: SessionProps | null): void;
  updateSessionStatus(status: SessionStatusType): void;
  setConnectionState(state: ConnectionState): void;
  setError(error: SessionStateError | null): void;
  setAudioLevel(level: number): void;
  setMuted(muted: boolean): void;
  sessionStarted(data: { sessionId: string; mode: SessionModeType; templateId: string | null; startedAt: string }): void;
  sessionPaused(): void;
  sessionResumed(): void;
  sessionStopped(data: { endedAt: string }): void;
  resetSession(): void;
}
