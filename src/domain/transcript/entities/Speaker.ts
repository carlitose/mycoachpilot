import { Entity } from '@domain/shared';

import { SpeakerId } from '../valueObjects/SpeakerId';

export interface SpeakerProps {
  id: number;
  name: string | null;
  isUser: boolean;
  wordCount: number;
  segmentCount: number;
  speakingTimeMs: number;
}

/**
 * Speaker entity
 * Represents an identified speaker in Meeting Coach mode
 */
export class Speaker extends Entity<SpeakerId> {
  private _name: string | null;
  private _isUser: boolean;
  private _wordCount: number;
  private _segmentCount: number;
  private _speakingTimeMs: number;

  private constructor(
    id: SpeakerId,
    name: string | null,
    isUser: boolean,
    wordCount: number,
    segmentCount: number,
    speakingTimeMs: number,
  ) {
    super(id);
    this._name = name;
    this._isUser = isUser;
    this._wordCount = wordCount;
    this._segmentCount = segmentCount;
    this._speakingTimeMs = speakingTimeMs;
  }

  get name(): string | null {
    return this._name;
  }

  get displayName(): string {
    if (this._name) return this._name;
    if (this._isUser) return 'You';
    return `Speaker ${String(this._id.toNumber())}`;
  }

  get isUser(): boolean {
    return this._isUser;
  }

  get wordCount(): number {
    return this._wordCount;
  }

  get segmentCount(): number {
    return this._segmentCount;
  }

  get speakingTimeMs(): number {
    return this._speakingTimeMs;
  }

  get speakingTimeFormatted(): string {
    const seconds = Math.floor(this._speakingTimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes)}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  setName(name: string): void {
    this._name = name;
  }

  markAsUser(): void {
    this._isUser = true;
  }

  addSegment(wordCount: number, durationMs: number): void {
    this._wordCount += wordCount;
    this._segmentCount += 1;
    this._speakingTimeMs += durationMs;
  }

  toProps(): SpeakerProps {
    return {
      id: this._id.toNumber(),
      name: this._name,
      isUser: this._isUser,
      wordCount: this._wordCount,
      segmentCount: this._segmentCount,
      speakingTimeMs: this._speakingTimeMs,
    };
  }

  static create(id: number): Speaker {
    return new Speaker(
      SpeakerId.create(id),
      null,
      false,
      0,
      0,
      0,
    );
  }

  static fromProps(props: SpeakerProps): Speaker {
    return new Speaker(
      SpeakerId.create(props.id),
      props.name,
      props.isUser,
      props.wordCount,
      props.segmentCount,
      props.speakingTimeMs,
    );
  }
}
