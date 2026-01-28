import { ValueObject } from '@domain/shared';

/**
 * Session identifier value object
 * Generates UUID if not provided
 */
export class SessionId extends ValueObject<string> {
  private readonly _value: string;

  private constructor(value: string) {
    super();
    this._value = value;
  }

  protected get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  static create(id?: string): SessionId {
    const value = id ?? crypto.randomUUID();
    return new SessionId(value);
  }

  static fromString(id: string): SessionId {
    if (!id || id.trim() === '') {
      throw new Error('SessionId cannot be empty');
    }
    return new SessionId(id);
  }
}
