import type { SessionModeType } from '@domain/session';
import { AggregateRoot } from '@domain/shared';

import { ApiKey, ApiKeyProps, ApiKeyService } from '../valueObjects/ApiKey';
import { CoachingStyle, CoachingStyleType } from '../valueObjects/CoachingStyle';

export interface UserConfigProps {
  id: string;
  openaiApiKey: string | null;
  deepgramApiKey: string | null;
  defaultMode: SessionModeType;
  defaultTemplateId: string;
  coachingStyle: CoachingStyleType;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

/**
 * UserConfig aggregate root
 * Stores user preferences and API keys
 */
export class UserConfig extends AggregateRoot<string> {
  private _openaiApiKey: ApiKey | null;
  private _deepgramApiKey: ApiKey | null;
  private _defaultMode: SessionModeType;
  private _defaultTemplateId: string;
  private _coachingStyle: CoachingStyle;
  private _theme: 'light' | 'dark' | 'system';
  private _language: string;

  private constructor(
    id: string,
    openaiApiKey: ApiKey | null,
    deepgramApiKey: ApiKey | null,
    defaultMode: SessionModeType,
    defaultTemplateId: string,
    coachingStyle: CoachingStyle,
    theme: 'light' | 'dark' | 'system',
    language: string,
  ) {
    super(id);
    this._openaiApiKey = openaiApiKey;
    this._deepgramApiKey = deepgramApiKey;
    this._defaultMode = defaultMode;
    this._defaultTemplateId = defaultTemplateId;
    this._coachingStyle = coachingStyle;
    this._theme = theme;
    this._language = language;
  }

  get openaiApiKey(): string | null {
    return this._openaiApiKey?.key ?? null;
  }

  get deepgramApiKey(): string | null {
    return this._deepgramApiKey?.key ?? null;
  }

  get maskedOpenaiKey(): string | null {
    return this._openaiApiKey?.maskedKey ?? null;
  }

  get maskedDeepgramKey(): string | null {
    return this._deepgramApiKey?.maskedKey ?? null;
  }

  get defaultMode(): SessionModeType {
    return this._defaultMode;
  }

  get defaultTemplateId(): string {
    return this._defaultTemplateId;
  }

  get coachingStyle(): CoachingStyle {
    return this._coachingStyle;
  }

  get theme(): 'light' | 'dark' | 'system' {
    return this._theme;
  }

  get language(): string {
    return this._language;
  }

  get hasOpenaiKey(): boolean {
    return this._openaiApiKey !== null && this._openaiApiKey.isValid;
  }

  get hasDeepgramKey(): boolean {
    return this._deepgramApiKey !== null && this._deepgramApiKey.isValid;
  }

  canUseMeetingCoach(): boolean {
    return this.hasDeepgramKey;
  }

  canUseConversation(): boolean {
    return this.hasOpenaiKey;
  }

  setOpenaiApiKey(key: string | null): void {
    this._openaiApiKey = key ? ApiKey.openai(key) : null;
    this.addDomainEvent('ConfigUpdated', {
      configId: this._id,
      field: 'openaiApiKey',
      hasValue: key !== null,
    });
  }

  setDeepgramApiKey(key: string | null): void {
    this._deepgramApiKey = key ? ApiKey.deepgram(key) : null;
    this.addDomainEvent('ConfigUpdated', {
      configId: this._id,
      field: 'deepgramApiKey',
      hasValue: key !== null,
    });
  }

  setDefaultMode(mode: SessionModeType): void {
    this._defaultMode = mode;
  }

  setDefaultTemplate(templateId: string): void {
    this._defaultTemplateId = templateId;
  }

  setCoachingStyle(style: CoachingStyleType): void {
    this._coachingStyle = CoachingStyle.create(style);
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this._theme = theme;
  }

  setLanguage(language: string): void {
    this._language = language;
  }

  getApiKey(service: ApiKeyService): ApiKeyProps | null {
    switch (service) {
      case 'openai':
        return this._openaiApiKey?.toJSON() ?? null;
      case 'deepgram':
        return this._deepgramApiKey?.toJSON() ?? null;
    }
  }

  toProps(): UserConfigProps {
    return {
      id: this._id,
      openaiApiKey: this._openaiApiKey?.key ?? null,
      deepgramApiKey: this._deepgramApiKey?.key ?? null,
      defaultMode: this._defaultMode,
      defaultTemplateId: this._defaultTemplateId,
      coachingStyle: this._coachingStyle.toString(),
      theme: this._theme,
      language: this._language,
    };
  }

  static create(id?: string): UserConfig {
    return new UserConfig(
      id ?? 'default',
      null,
      null,
      'conversation',
      'general',
      CoachingStyle.default(),
      'system',
      'en',
    );
  }

  static fromProps(props: UserConfigProps): UserConfig {
    return new UserConfig(
      props.id,
      props.openaiApiKey ? ApiKey.openai(props.openaiApiKey) : null,
      props.deepgramApiKey ? ApiKey.deepgram(props.deepgramApiKey) : null,
      props.defaultMode,
      props.defaultTemplateId,
      CoachingStyle.create(props.coachingStyle),
      props.theme,
      props.language,
    );
  }
}
