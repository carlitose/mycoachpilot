/**
 * Transcript State Port
 * Abstracts transcript state access for Clean Architecture compliance
 */
import type { MessageProps, TranscriptSegmentProps, SpeakerProps } from '@domain/transcript';

export interface SpeakerStatsProps extends SpeakerProps {
  wordPercentage: number;
  timePercentage: number;
}

/**
 * Port interface for accessing transcript state.
 * Implementations (adapters) are React hooks that return this interface.
 * The values are reactive - components will re-render when they change.
 */
export interface TranscriptStatePort {
  // Reactive values - automatically update when state changes
  messages: MessageProps[];
  segments: TranscriptSegmentProps[];
  speakers: SpeakerProps[];
  interimTranscript: string | null;
  userSpeakerId: number | null;
  userSpeaker: SpeakerProps | null;
  otherSpeakers: SpeakerProps[];
  recentMessages: MessageProps[];
  recentSegments: TranscriptSegmentProps[];
  speakerStats: SpeakerStatsProps[];

  // Actions - imperatively update state
  addMessage(message: MessageProps): void;
  updateMessage(data: { id: string; content: string; isInterim: boolean }): void;
  addSegment(segment: TranscriptSegmentProps): void;
  updateSegment(segment: TranscriptSegmentProps): void;
  addSpeaker(speaker: SpeakerProps): void;
  updateSpeaker(speaker: SpeakerProps): void;
  setUserSpeaker(speakerId: number): void;
  setInterimTranscript(text: string | null): void;
  clearInterim(): void;
  setMessages(messages: MessageProps[]): void;
  setSegments(segments: TranscriptSegmentProps[]): void;
  setSpeakers(speakers: SpeakerProps[]): void;
  clearTranscript(): void;
}
