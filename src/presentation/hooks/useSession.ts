import { useCallback } from 'react';

import type { SessionModeType, AudioConfigProps } from '@domain/session';

import { useContainer } from '@infrastructure/di';
import {
  selectCurrentSession,
  selectConnectionState,
  selectSessionError,
  selectAudioLevel,
  selectIsMuted,
  selectIsSessionActive,
  selectIsSessionPaused,
  selectSessionMode,
  selectIsConnected,
  selectIsConnecting,
  setSession,
  setConnectionState,
  setSessionError,
  setAudioLevel,
  setMuted,
  resetSession,
  clearTranscript,
  clearSuggestions,
} from '@infrastructure/state';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';


export interface UseSessionOptions {
  mode: SessionModeType;
  templateId?: string;
  audioConfig?: Partial<AudioConfigProps>;
  systemPrompt?: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSession() {
  const dispatch = useAppDispatch();
  const { sessionManager, configRepository } = useContainer();

  const currentSession = useAppSelector(selectCurrentSession);
  const connectionState = useAppSelector(selectConnectionState);
  const error = useAppSelector(selectSessionError);
  const audioLevel = useAppSelector(selectAudioLevel);
  const isMuted = useAppSelector(selectIsMuted);
  const isActive = useAppSelector(selectIsSessionActive);
  const isPaused = useAppSelector(selectIsSessionPaused);
  const mode = useAppSelector(selectSessionMode);
  const isConnected = useAppSelector(selectIsConnected);
  const isConnecting = useAppSelector(selectIsConnecting);

  const startSession = useCallback(async (options: UseSessionOptions) => {
    // Clear previous session state
    dispatch(resetSession());
    dispatch(clearTranscript());
    dispatch(clearSuggestions());

    // Get API keys from config
    const configResult = await configRepository.getConfig();
    const config = configResult.isOk() ? configResult.unwrap() : null;

    dispatch(setConnectionState('connecting'));

    const result = await sessionManager.startSession(options.mode, {
      ...(options.templateId !== undefined ? { templateId: options.templateId } : {}),
      ...(options.audioConfig !== undefined ? { audioConfig: options.audioConfig } : {}),
      ...(config?.openaiApiKey ? { openaiApiKey: config.openaiApiKey } : {}),
      ...(config?.deepgramApiKey ? { deepgramApiKey: config.deepgramApiKey } : {}),
      ...(options.systemPrompt !== undefined ? { systemPrompt: options.systemPrompt } : {}),
    });

    if (result.isOk()) {
      const session = result.unwrap();
      dispatch(setSession(session.toProps()));
      dispatch(setConnectionState('connected'));
      return { success: true, session };
    } else {
      dispatch(setConnectionState('error'));
      dispatch(setSessionError({ code: 'start_failed', message: result.unwrapErr().message }));
      return { success: false, error: result.unwrapErr().message };
    }
  }, [dispatch, sessionManager, configRepository]);

  const stopSession = useCallback(() => {
    const result = sessionManager.stopSession();
    if (result.isOk()) {
      dispatch(setConnectionState('disconnected'));
    }
    return result.isOk();
  }, [dispatch, sessionManager]);

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
    dispatch(setMuted(muted));
    // TODO: Actually mute the audio capture
  }, [dispatch]);

  const updateAudioLevel = useCallback((level: number) => {
    dispatch(setAudioLevel(level));
  }, [dispatch]);

  return {
    // State
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
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    sendTextMessage,
    setMuted: setMutedState,
    updateAudioLevel,
  };
}
