import { useCallback } from 'react';

import { useContainer } from '../context';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTranscript() {
  const { sessionManager, useTranscriptState } = useContainer();

  // Get reactive state from port
  const transcriptState = useTranscriptState();

  const identifyUserSpeaker = useCallback((speakerId: number) => {
    transcriptState.setUserSpeaker(speakerId);
    sessionManager.identifySpeakerAsUser(speakerId);
  }, [transcriptState, sessionManager]);

  const clear = useCallback(() => {
    transcriptState.clearTranscript();
  }, [transcriptState]);

  return {
    // State (reactive values from port)
    messages: transcriptState.messages,
    segments: transcriptState.segments,
    speakers: transcriptState.speakers,
    interimTranscript: transcriptState.interimTranscript,
    userSpeakerId: transcriptState.userSpeakerId,
    userSpeaker: transcriptState.userSpeaker,
    otherSpeakers: transcriptState.otherSpeakers,
    recentMessages: transcriptState.recentMessages,
    recentSegments: transcriptState.recentSegments,
    speakerStats: transcriptState.speakerStats,

    // Actions
    identifyUserSpeaker,
    clear,
  };
}
