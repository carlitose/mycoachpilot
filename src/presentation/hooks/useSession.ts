import { useCallback, useEffect } from 'react';

import type { SessionModeType, AudioConfigProps } from '@domain/session';
import { REACTIVITY_DEFAULTS } from '@domain/settings';

import type { SessionHistoryEntry } from '@application/ports';

import { useContainer } from '../context';

import { useSettings } from './useSettings';

export interface UseSessionOptions {
  mode: SessionModeType;
  name?: string;
  templateId?: string;
  audioConfig?: Partial<AudioConfigProps>;
  systemPrompt?: string;
}

// Module-level variable to store session name between start and stop
// Safe because only one session is active at a time
let currentSessionName: string | undefined;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSession() {
  const { sessionManager, configRepository, sessionRepository, audioPlayback, useSessionState, useTranscriptState, useCoachingState } = useContainer();
  const { ttsEnabled, ttsVolume } = useSettings();

  // Get reactive state from ports
  const sessionState = useSessionState();
  const transcriptState = useTranscriptState();
  const coachingState = useCoachingState();

  // Sync TTS settings with audio playback adapter
  useEffect(() => {
    audioPlayback.setEnabled(ttsEnabled);
  }, [audioPlayback, ttsEnabled]);

  useEffect(() => {
    audioPlayback.setVolume(ttsVolume);
  }, [audioPlayback, ttsVolume]);

  const startSession = useCallback(async (options: UseSessionOptions) => {
    // Store the session name for later persistence (module-level variable)
    currentSessionName = options.name;
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

  const stopSession = useCallback(async () => {
    // Save session to history before stopping
    const currentSession = sessionState.currentSession;
    if (currentSession) {
      // Set endedAt manually before saving since sessionManager.stopSession() hasn't run yet
      const endedAt = new Date().toISOString();
      const entry: SessionHistoryEntry = {
        session: {
          ...currentSession,
          endedAt: new Date(endedAt),
          status: 'stopped',
        },
        ...(currentSessionName !== undefined ? { name: currentSessionName } : {}),
        messages: transcriptState.messages,
        segments: transcriptState.segments,
        speakers: transcriptState.speakers,
        suggestions: coachingState.suggestions,
        savedAt: endedAt,
      };
      await sessionRepository.save(entry);
    }

    // Clear the session name
    currentSessionName = undefined;

    const result = sessionManager.stopSession();
    if (result.isOk()) {
      sessionState.setConnectionState('disconnected');
    }
    return result.isOk();
  }, [sessionManager, sessionState, transcriptState, coachingState, sessionRepository]);

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
