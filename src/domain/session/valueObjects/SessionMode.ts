import { ValueObject } from '@domain/shared';
import type { SessionModeType } from '@domain/shared';

// Re-export from shared for backwards compatibility
export type { SessionModeType } from '@domain/shared';

const VALID_MODES: SessionModeType[] = ['conversation', 'transcript_only', 'meeting_coach'];

/**
 * Session mode value object
 * - conversation: Bidirectional voice conversation with AI (OpenAI Realtime)
 * - transcript_only: Transcription only, no AI responses
 * - meeting_coach: Transcription with speaker diarization + AI coaching suggestions
 */
export class SessionMode extends ValueObject<SessionModeType> {
  private readonly _value: SessionModeType;

  private constructor(value: SessionModeType) {
    super();
    this._value = value;
  }

  protected get value(): SessionModeType {
    return this._value;
  }

  toString(): SessionModeType {
    return this._value;
  }

  isConversation(): boolean {
    return this._value === 'conversation';
  }

  isTranscriptOnly(): boolean {
    return this._value === 'transcript_only';
  }

  isMeetingCoach(): boolean {
    return this._value === 'meeting_coach';
  }

  requiresOpenAI(): boolean {
    // All modes now require OpenAI
    return true;
  }

  static create(mode: SessionModeType): SessionMode {
    if (!VALID_MODES.includes(mode)) {
      throw new Error(`Invalid session mode: ${mode}`);
    }
    return new SessionMode(mode);
  }

  static conversation(): SessionMode {
    return new SessionMode('conversation');
  }

  static transcriptOnly(): SessionMode {
    return new SessionMode('transcript_only');
  }

  static meetingCoach(): SessionMode {
    return new SessionMode('meeting_coach');
  }
}
