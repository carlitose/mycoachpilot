/**
 * Transcript bounded context
 * Manages real-time transcription and speaker identification
 */

// Value Objects
export {
  MessageId,
  MessageRole,
  SpeakerId,
  Timestamp,
} from './valueObjects';
export type { MessageRoleType } from './valueObjects';

// Entities
export {
  Message,
  Speaker,
  TranscriptSegment,
} from './entities';
export type {
  MessageProps,
  SpeakerProps,
  TranscriptSegmentProps,
  Word,
} from './entities';

// Events
export {
  MessageReceived,
  SegmentReceived,
  SpeakerIdentified,
} from './events';
export type {
  MessageReceivedPayload,
  SegmentReceivedPayload,
  SpeakerIdentifiedPayload,
} from './events';
