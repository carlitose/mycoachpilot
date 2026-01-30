import { createSelector } from '@reduxjs/toolkit';

import type { TranscriptSliceState } from '../slices/transcriptSlice';
import type { RootState } from '../store';

export const selectTranscript = (state: RootState): TranscriptSliceState => state.transcript;

export const selectMessages = createSelector(
  selectTranscript,
  (transcript) => transcript.messages,
);

export const selectSegments = createSelector(
  selectTranscript,
  (transcript) => transcript.segments,
);

export const selectSpeakers = createSelector(
  selectTranscript,
  (transcript) => transcript.speakers,
);

export const selectInterimTranscript = createSelector(
  selectTranscript,
  (transcript) => transcript.interimTranscript,
);

export const selectUserSpeakerId = createSelector(
  selectTranscript,
  (transcript) => transcript.userSpeakerId,
);

export const selectUserSpeaker = createSelector(
  selectSpeakers,
  selectUserSpeakerId,
  (speakers, userId) => speakers.find((s) => s.id === userId) ?? null,
);

export const selectOtherSpeakers = createSelector(
  selectSpeakers,
  selectUserSpeakerId,
  (speakers, userId) => speakers.filter((s) => s.id !== userId),
);

export const selectMessageCount = createSelector(
  selectMessages,
  (messages) => messages.length,
);

export const selectSegmentCount = createSelector(
  selectSegments,
  (segments) => segments.length,
);

export const selectRecentMessages = createSelector(
  selectMessages,
  (messages) => messages.slice(-10),
);

export const selectRecentSegments = createSelector(
  selectSegments,
  (segments) => segments.slice(-20),
);

export const selectFinalSegments = createSelector(
  selectSegments,
  (segments) => segments.filter((s) => s.isFinal),
);

export const selectSpeakerStats = createSelector(
  selectSpeakers,
  (speakers) => {
    const totalWords = speakers.reduce((sum, s) => sum + s.wordCount, 0);
    const totalTime = speakers.reduce((sum, s) => sum + s.speakingTimeMs, 0);

    return speakers.map((speaker) => ({
      ...speaker,
      wordPercentage: totalWords > 0 ? (speaker.wordCount / totalWords) * 100 : 0,
      timePercentage: totalTime > 0 ? (speaker.speakingTimeMs / totalTime) * 100 : 0,
    }));
  },
);
