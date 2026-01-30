import { ValueObject } from '@domain/shared';

export type PredefinedTemplateId = 'general' | 'interview' | 'sales' | 'presentation';

/**
 * Template identifier value object
 */
export class TemplateId extends ValueObject<string> {
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

  isPredefined(): boolean {
    const predefined: PredefinedTemplateId[] = ['general', 'interview', 'sales', 'presentation'];
    return predefined.includes(this._value as PredefinedTemplateId);
  }

  static create(id?: string): TemplateId {
    const value = id ?? crypto.randomUUID();
    return new TemplateId(value);
  }

  static fromString(id: string): TemplateId {
    if (!id || id.trim() === '') {
      throw new Error('TemplateId cannot be empty');
    }
    return new TemplateId(id);
  }

  static general(): TemplateId {
    return new TemplateId('general');
  }

  static interview(): TemplateId {
    return new TemplateId('interview');
  }

  static sales(): TemplateId {
    return new TemplateId('sales');
  }

  static presentation(): TemplateId {
    return new TemplateId('presentation');
  }
}
