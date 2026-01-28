import { ValueObject } from '@domain/shared';

/**
 * Timestamp value object for transcript timing
 * Stores time in milliseconds for precision
 */
export class Timestamp extends ValueObject<number> {
  private readonly _value: number;

  private constructor(value: number) {
    super();
    this._value = value;
  }

  protected get value(): number {
    return this._value;
  }

  get milliseconds(): number {
    return this._value;
  }

  get seconds(): number {
    return this._value / 1000;
  }

  format(): string {
    const totalSeconds = Math.floor(this._value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  add(other: Timestamp): Timestamp {
    return new Timestamp(this._value + other._value);
  }

  subtract(other: Timestamp): Timestamp {
    return new Timestamp(Math.max(0, this._value - other._value));
  }

  isBefore(other: Timestamp): boolean {
    return this._value < other._value;
  }

  isAfter(other: Timestamp): boolean {
    return this._value > other._value;
  }

  static fromMilliseconds(ms: number): Timestamp {
    if (ms < 0) {
      throw new Error('Timestamp cannot be negative');
    }
    return new Timestamp(ms);
  }

  static fromSeconds(seconds: number): Timestamp {
    if (seconds < 0) {
      throw new Error('Timestamp cannot be negative');
    }
    return new Timestamp(seconds * 1000);
  }

  static zero(): Timestamp {
    return new Timestamp(0);
  }

  static now(): Timestamp {
    return new Timestamp(Date.now());
  }
}
