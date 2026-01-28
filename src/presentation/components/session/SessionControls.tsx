import { useCallback, type ReactNode } from 'react';

import type { SessionModeType } from '@domain/session';

import { useSession, useSettings } from '@presentation/hooks';

import { Button } from '../common';

interface SessionControlsProps {
  mode: SessionModeType;
  templateId?: string | undefined;
  systemPrompt?: string | undefined;
  captureTabAudio?: boolean | undefined;
}

export function SessionControls({ mode, templateId, systemPrompt, captureTabAudio = false }: SessionControlsProps): ReactNode {
  const {
    isActive,
    isPaused,
    isConnecting,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    isMuted,
    setMuted,
  } = useSession();

  const { hasOpenaiKey, hasDeepgramKey } = useSettings();

  const canStart = mode === 'meeting_coach'
    ? hasDeepgramKey
    : mode === 'conversation'
      ? hasOpenaiKey
      : hasOpenaiKey || hasDeepgramKey;

  const handleStart = useCallback(async () => {
    await startSession({
      mode,
      ...(templateId !== undefined ? { templateId } : {}),
      ...(systemPrompt !== undefined ? { systemPrompt } : {}),
      audioConfig: {
        micEnabled: true,
        tabAudioEnabled: captureTabAudio,
        sampleRate: mode === 'meeting_coach' ? 16000 : 24000,
      },
    });
  }, [mode, templateId, systemPrompt, captureTabAudio, startSession]);

  const handleStop = useCallback(() => {
    stopSession();
  }, [stopSession]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  }, [isPaused, pauseSession, resumeSession]);

  const handleMuteToggle = useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  if (!isActive) {
    return (
      <div className="flex items-center gap-3">
        <Button
          onClick={() => { void handleStart(); }}
          disabled={!canStart || isConnecting}
          isLoading={isConnecting}
          size="lg"
          className="gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Start Session
        </Button>
        {!canStart && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            Please configure API keys in Settings
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleStop}
        variant="danger"
        size="lg"
        className="gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
        Stop
      </Button>

      <Button
        onClick={handlePauseResume}
        variant="secondary"
        size="lg"
        className="gap-2"
      >
        {isPaused ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Resume
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Pause
          </>
        )}
      </Button>

      <Button
        onClick={handleMuteToggle}
        variant="ghost"
        size="lg"
        className={isMuted ? 'text-red-500' : ''}
      >
        {isMuted ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </Button>
    </div>
  );
}
