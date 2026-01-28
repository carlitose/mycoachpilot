import { ValueObject } from '@domain/shared';

export type ApiKeyService = 'openai' | 'deepgram';

export interface ApiKeyProps {
  key: string;
  service: ApiKeyService;
}

/**
 * API Key value object
 * Validates and masks API keys for display
 */
export class ApiKey extends ValueObject<ApiKeyProps> {
  private readonly _key: string;
  private readonly _service: ApiKeyService;

  private constructor(key: string, service: ApiKeyService) {
    super();
    this._key = key;
    this._service = service;
  }

  protected get value(): ApiKeyProps {
    return { key: this._key, service: this._service };
  }

  get key(): string {
    return this._key;
  }

  get service(): ApiKeyService {
    return this._service;
  }

  get maskedKey(): string {
    if (this._key.length <= 8) {
      return '••••••••';
    }
    const start = this._key.slice(0, 4);
    const end = this._key.slice(-4);
    return `${start}••••••••${end}`;
  }

  get isValid(): boolean {
    return this._key.length > 0 && this.validateFormat();
  }

  private validateFormat(): boolean {
    switch (this._service) {
      case 'openai':
        return this._key.startsWith('sk-');
      case 'deepgram':
        return this._key.length >= 32;
      default:
        return true;
    }
  }

  toJSON(): ApiKeyProps {
    return { key: this._key, service: this._service };
  }

  static create(key: string, service: ApiKeyService): ApiKey {
    const trimmedKey = key.trim();
    return new ApiKey(trimmedKey, service);
  }

  static openai(key: string): ApiKey {
    return ApiKey.create(key, 'openai');
  }

  static deepgram(key: string): ApiKey {
    return ApiKey.create(key, 'deepgram');
  }

  static fromJSON(props: ApiKeyProps): ApiKey {
    return new ApiKey(props.key, props.service);
  }
}
