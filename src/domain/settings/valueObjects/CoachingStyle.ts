import { ValueObject } from '@domain/shared';

export type CoachingStyleType = 'diplomatic' | 'assertive' | 'analytical' | 'supportive';

const VALID_STYLES: CoachingStyleType[] = ['diplomatic', 'assertive', 'analytical', 'supportive'];

/**
 * Coaching style value object
 * Determines the tone and approach of AI coaching suggestions
 */
export class CoachingStyle extends ValueObject<CoachingStyleType> {
  private readonly _value: CoachingStyleType;

  private constructor(value: CoachingStyleType) {
    super();
    this._value = value;
  }

  protected get value(): CoachingStyleType {
    return this._value;
  }

  toString(): CoachingStyleType {
    return this._value;
  }

  get description(): string {
    switch (this._value) {
      case 'diplomatic':
        return 'Tactful and balanced suggestions that consider multiple perspectives';
      case 'assertive':
        return 'Direct and confident suggestions for clear communication';
      case 'analytical':
        return 'Data-driven suggestions focused on facts and logic';
      case 'supportive':
        return 'Empathetic suggestions that prioritize rapport building';
    }
  }

  get displayName(): string {
    return this._value.charAt(0).toUpperCase() + this._value.slice(1);
  }

  static create(style: CoachingStyleType): CoachingStyle {
    if (!VALID_STYLES.includes(style)) {
      throw new Error(`Invalid coaching style: ${style}`);
    }
    return new CoachingStyle(style);
  }

  static diplomatic(): CoachingStyle {
    return new CoachingStyle('diplomatic');
  }

  static assertive(): CoachingStyle {
    return new CoachingStyle('assertive');
  }

  static analytical(): CoachingStyle {
    return new CoachingStyle('analytical');
  }

  static supportive(): CoachingStyle {
    return new CoachingStyle('supportive');
  }

  static default(): CoachingStyle {
    return CoachingStyle.diplomatic();
  }

  static allStyles(): CoachingStyleType[] {
    return [...VALID_STYLES];
  }
}
