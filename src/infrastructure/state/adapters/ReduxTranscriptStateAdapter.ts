/**
 * Redux Transcript State Adapter
 * Implements TranscriptStatePort using Redux
 */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { TranscriptStatePort } from '@application/ports';

import {
  selectInterimTranscript,
  selectMessages,
  selectOtherSpeakers,
  selectRecentMessages,
  selectRecentSegments,
  selectSegments,
  selectSpeakerStats,
  selectSpeakers,
  selectUserSpeaker,
  selectUserSpeakerId,
} from '../selectors/transcriptSelectors';
import {
  addMessage,
  addSegment,
  addSpeaker,
  clearInterim,
  clearTranscript,
  setInterimTranscript,
  setMessages,
  setSegments,
  setSpeakers,
  setUserSpeaker,
  updateMessage,
  updateSegment,
  updateSpeaker,
} from '../slices/transcriptSlice';
import type { AppDispatch, RootState } from '../store';

/**
 * Hook that provides a TranscriptStatePort implementation backed by Redux.
 * Must be called within a React component inside a Redux Provider.
 */
export function useReduxTranscriptState(): TranscriptStatePort {
  const dispatch = useDispatch<AppDispatch>();

  // Reactive values - call all selectors at top level (proper hooks usage)
  const messages = useSelector((state: RootState) => selectMessages(state));
  const segments = useSelector((state: RootState) => selectSegments(state));
  const speakers = useSelector((state: RootState) => selectSpeakers(state));
  const interimTranscript = useSelector((state: RootState) => selectInterimTranscript(state));
  const userSpeakerId = useSelector((state: RootState) => selectUserSpeakerId(state));
  const userSpeaker = useSelector((state: RootState) => selectUserSpeaker(state));
  const otherSpeakers = useSelector((state: RootState) => selectOtherSpeakers(state));
  const recentMessages = useSelector((state: RootState) => selectRecentMessages(state));
  const recentSegments = useSelector((state: RootState) => selectRecentSegments(state));
  const speakerStats = useSelector((state: RootState) => selectSpeakerStats(state));

  // Memoize actions to maintain stable references
  const actions = useMemo(() => ({
    addMessage: (message: Parameters<TranscriptStatePort['addMessage']>[0]) => dispatch(addMessage(message)),
    updateMessage: (data: Parameters<TranscriptStatePort['updateMessage']>[0]) => dispatch(updateMessage(data)),
    addSegment: (segment: Parameters<TranscriptStatePort['addSegment']>[0]) => dispatch(addSegment(segment)),
    updateSegment: (segment: Parameters<TranscriptStatePort['updateSegment']>[0]) => dispatch(updateSegment(segment)),
    addSpeaker: (speaker: Parameters<TranscriptStatePort['addSpeaker']>[0]) => dispatch(addSpeaker(speaker)),
    updateSpeaker: (speaker: Parameters<TranscriptStatePort['updateSpeaker']>[0]) => dispatch(updateSpeaker(speaker)),
    setUserSpeaker: (speakerId: Parameters<TranscriptStatePort['setUserSpeaker']>[0]) => dispatch(setUserSpeaker(speakerId)),
    setInterimTranscript: (text: Parameters<TranscriptStatePort['setInterimTranscript']>[0]) => dispatch(setInterimTranscript(text)),
    clearInterim: () => dispatch(clearInterim()),
    setMessages: (msgs: Parameters<TranscriptStatePort['setMessages']>[0]) => dispatch(setMessages(msgs)),
    setSegments: (segs: Parameters<TranscriptStatePort['setSegments']>[0]) => dispatch(setSegments(segs)),
    setSpeakers: (spkrs: Parameters<TranscriptStatePort['setSpeakers']>[0]) => dispatch(setSpeakers(spkrs)),
    clearTranscript: () => dispatch(clearTranscript()),
  }), [dispatch]);

  return {
    // Reactive values
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
    ...actions,
  };
}
