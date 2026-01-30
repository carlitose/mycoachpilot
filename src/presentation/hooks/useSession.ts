import { useCallback } from 'react';

import type { SessionModeType, AudioConfigProps } from '@domain/session';
import { REACTIVITY_DEFAULTS } from '@domain/settings';

import { useContainer } from '../context';

export interface UseSessionOptions {
  mode: SessionModeType;
  templateId?: string;
  audioConfig?: Partial<AudioConfigProps>;
  systemPrompt?: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSession() {
  const { sessionManager, configRepository, useSessionState, useTranscriptState, useCoachingState } = useContainer();

  // Get reactive state from ports
  const sessionState = useSessionState();
  const transcriptState = useTranscriptState();
  const coachingState = useCoachingState();

  const startSession = useCallback(async (options: UseSessionOptions) => {
    // Clear previous session state
    sessionState.resetSession();
    transcriptState.clearTranscript();
    coachingState.clearSuggestions();

    // Get API keys and config
    const configResult = await configRepository.getConfig();
    const config = configResult.isOk() ? configResult.unwrap() : null;

    // Get reactivity config
    const reactivityResult = await configRepository.getReactivityConfig();
    const reactivity = reactivityResult.isOk() ? reactivityResult.unwrap() : null;

    sessionState.setConnectionState('connecting');

    const result = await sessionManager.startSession(options.mode, {
      ...(options.templateId !== undefined ? { templateId: options.templateId } : {}),
      ...(options.audioConfig !== undefined ? { audioConfig: options.audioConfig } : {}),
      ...(config?.openaiApiKey ? { openaiApiKey: config.openaiApiKey } : {}),
      ...(options.systemPrompt !== undefined ? { systemPrompt: options.systemPrompt } : {}),
      reactivity: reactivity ?? { ...REACTIVITY_DEFAULTS },
    });

    if (result.isOk()) {
      const session = result.unwrap();
      sessionState.setSession(session.toProps());
      sessionState.setConnectionState('connected');
      return { success: true, session };
    } else {
      sessionState.setConnectionState('error');
      sessionState.setError({ code: 'start_failed', message: result.unwrapErr().message });
      return { success: false, error: result.unwrapErr().message };
    }
  }, [sessionManager, configRepository, sessionState, transcriptState, coachingState]);

  const stopSession = useCallback(() => {
    const result = sessionManager.stopSession();
    if (result.isOk()) {
      sessionState.setConnectionState('disconnected');
    }
    return result.isOk();
  }, [sessionManager, sessionState]);

  const pauseSession = useCallback(() => {
    const result = sessionManager.pauseSession();
    return result.isOk();
  }, [sessionManager]);

  const resumeSession = useCallback(() => {
    const result = sessionManager.resumeSession();
    return result.isOk();
  }, [sessionManager]);

  const sendTextMessage = useCallback(async (text: string) => {
    const result = await sessionManager.sendTextMessage(text);
    return result.isOk();
  }, [sessionManager]);

  const setMutedState = useCallback((muted: boolean) => {
    sessionState.setMuted(muted);
    // TODO: Actually mute the audio capture
  }, [sessionState]);

  const updateAudioLevel = useCallback((level: number) => {
    sessionState.setAudioLevel(level);
  }, [sessionState]);

  const clearError = useCallback(() => {
    sessionState.setError(null);
  }, [sessionState]);

  return {
    // State (reactive values from port)
    currentSession: sessionState.currentSession,
    connectionState: sessionState.connectionState,
    error: sessionState.error,
    audioLevel: sessionState.audioLevel,
    isMuted: sessionState.isMuted,
    isActive: sessionState.isActive,
    isPaused: sessionState.isPaused,
    mode: sessionState.mode,
    isConnected: sessionState.isConnected,
    isConnecting: sessionState.isConnecting,

    // Actions
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    sendTextMessage,
    setMuted: setMutedState,
    updateAudioLevel,
    clearError,
  };
}
