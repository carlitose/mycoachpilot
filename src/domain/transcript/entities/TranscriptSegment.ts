import { Entity } from '@domain/shared';

import { MessageId } from '../valueObjects/MessageId';
import { Timestamp } from '../valueObjects/Timestamp';

export interface Word {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface TranscriptSegmentProps {
  id: string;
  speakerId: number;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  words: Word[];
  isFinal: boolean;
}

/**
 * TranscriptSegment entity
 * Represents a segment of transcribed speech with timing and speaker info
 */
export class TranscriptSegment extends Entity<MessageId> {
  private readonly _speakerId: number;
  private _text: string;
  private readonly _startTime: Timestamp;
  private _endTime: Timestamp;
  private _confidence: number;
  private _words: Word[];
  private _isFinal: boolean;

  private constructor(
    id: MessageId,
    speakerId: number,
    text: string,
    startTime: Timestamp,
    endTime: Timestamp,
    confidence: number,
    words: Word[],
    isFinal: boolean,
  ) {
    super(id);
    this._speakerId = speakerId;
    this._text = text;
    this._startTime = startTime;
    this._endTime = endTime;
    this._confidence = confidence;
    this._words = words;
    this._isFinal = isFinal;
  }

  get speakerId(): number {
    return this._speakerId;
  }

  get text(): string {
    return this._text;
  }

  get startTime(): Timestamp {
    return this._startTime;
  }

  get endTime(): Timestamp {
    return this._endTime;
  }

  get confidence(): number {
    return this._confidence;
  }

  get words(): Word[] {
    return [...this._words];
  }

  get isFinal(): boolean {
    return this._isFinal;
  }

  get durationMs(): number {
    return this._endTime.milliseconds - this._startTime.milliseconds;
  }

  get wordCount(): number {
    return this._words.length;
  }

  get formattedStartTime(): string {
    return this._startTime.format();
  }

  get formattedEndTime(): string {
    return this._endTime.format();
  }

  update(text: string, endMs: number, confidence: number, words: Word[]): void {
    this._text = text;
    this._endTime = Timestamp.fromMilliseconds(endMs);
    this._confidence = confidence;
    this._words = words;
  }

  finalize(): void {
    this._isFinal = true;
  }

  toProps(): TranscriptSegmentProps {
    return {
      id: this._id.toString(),
      speakerId: this._speakerId,
      text: this._text,
      startMs: this._startTime.milliseconds,
      endMs: this._endTime.milliseconds,
      confidence: this._confidence,
      words: [...this._words],
      isFinal: this._isFinal,
    };
  }

  static create(
    speakerId: number,
    text: string,
    startMs: number,
    endMs: number,
    options?: {
      confidence?: number;
      words?: Word[];
      isFinal?: boolean;
    },
  ): TranscriptSegment {
    return new TranscriptSegment(
      MessageId.create(),
      speakerId,
      text,
      Timestamp.fromMilliseconds(startMs),
      Timestamp.fromMilliseconds(endMs),
      options?.confidence ?? 0,
      options?.words ?? [],
      options?.isFinal ?? false,
    );
  }

  static fromProps(props: TranscriptSegmentProps): TranscriptSegment {
    return new TranscriptSegment(
      MessageId.fromString(props.id),
      props.speakerId,
      props.text,
      Timestamp.fromMilliseconds(props.startMs),
      Timestamp.fromMilliseconds(props.endMs),
      props.confidence,
      props.words,
      props.isFinal,
    );
  }
}
