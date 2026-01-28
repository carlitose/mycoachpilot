import { ValueObject } from '@domain/shared';

/**
 * Suggestion identifier value object
 */
export class SuggestionId extends ValueObject<string> {
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

  static create(id?: string): SuggestionId {
    const value = id ?? crypto.randomUUID();
    return new SuggestionId(value);
  }

  static fromString(id: string): SuggestionId {
    if (!id || id.trim() === '') {
      throw new Error('SuggestionId cannot be empty');
    }
    return new SuggestionId(id);
  }
}
