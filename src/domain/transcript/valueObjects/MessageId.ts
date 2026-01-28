import { ValueObject } from '@domain/shared';

/**
 * Message identifier value object
 */
export class MessageId extends ValueObject<string> {
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

  static create(id?: string): MessageId {
    const value = id ?? crypto.randomUUID();
    return new MessageId(value);
  }

  static fromString(id: string): MessageId {
    if (!id || id.trim() === '') {
      throw new Error('MessageId cannot be empty');
    }
    return new MessageId(id);
  }
}
