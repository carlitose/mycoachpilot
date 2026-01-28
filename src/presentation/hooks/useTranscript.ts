import { useCallback } from 'react';

import { useContainer } from '@infrastructure/di';
import {
  selectMessages,
  selectSegments,
  selectSpeakers,
  selectInterimTranscript,
  selectUserSpeakerId,
  selectUserSpeaker,
  selectOtherSpeakers,
  selectRecentMessages,
  selectRecentSegments,
  selectSpeakerStats,
  setUserSpeaker,
  clearTranscript,
} from '@infrastructure/state';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTranscript() {
  const dispatch = useAppDispatch();
  const { sessionManager } = useContainer();

  const messages = useAppSelector(selectMessages);
  const segments = useAppSelector(selectSegments);
  const speakers = useAppSelector(selectSpeakers);
  const interimTranscript = useAppSelector(selectInterimTranscript);
  const userSpeakerId = useAppSelector(selectUserSpeakerId);
  const userSpeaker = useAppSelector(selectUserSpeaker);
  const otherSpeakers = useAppSelector(selectOtherSpeakers);
  const recentMessages = useAppSelector(selectRecentMessages);
  const recentSegments = useAppSelector(selectRecentSegments);
  const speakerStats = useAppSelector(selectSpeakerStats);

  const identifyUserSpeaker = useCallback((speakerId: number) => {
    dispatch(setUserSpeaker(speakerId));
    sessionManager.identifySpeakerAsUser(speakerId);
  }, [dispatch, sessionManager]);

  const clear = useCallback(() => {
    dispatch(clearTranscript());
  }, [dispatch]);

  return {
    // State
    messages,
    segments,
    speakers,
    interimTranscript,
    userSpeakerId,
    userSpeaker,
    otherSpeakers,
    recentMessages,
    recentSegments,
    speakerStats,

    // Actions
    identifyUserSpeaker,
    clear,
  };
}
