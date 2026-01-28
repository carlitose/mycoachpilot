import { ValueObject } from '@domain/shared';

/**
 * Speaker identifier value object
 * Used for speaker diarization in Meeting Coach mode
 */
export class SpeakerId extends ValueObject<number> {
  private readonly _value: number;

  private constructor(value: number) {
    super();
    this._value = value;
  }

  protected get value(): number {
    return this._value;
  }

  toNumber(): number {
    return this._value;
  }

  toString(): string {
    return `Speaker ${String(this._value)}`;
  }

  static create(id: number): SpeakerId {
    if (id < 0) {
      throw new Error('SpeakerId must be non-negative');
    }
    return new SpeakerId(id);
  }

  static fromNumber(id: number): SpeakerId {
    return SpeakerId.create(id);
  }
}
