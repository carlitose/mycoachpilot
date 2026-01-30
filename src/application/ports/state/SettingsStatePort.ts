/**
 * Settings State Port
 * Abstracts settings state access for Clean Architecture compliance
 */
import type { UserConfigProps, TemplateProps, CoachingStyleType, ReactivityConfigProps } from '@domain/settings';
import type { SessionModeType } from '@domain/shared';

/**
 * Port interface for accessing settings state.
 * Implementations (adapters) are React hooks that return this interface.
 * The values are reactive - components will re-render when they change.
 */
export interface SettingsStatePort {
  // Reactive values - automatically update when state changes
  config: UserConfigProps;
  reactivity: ReactivityConfigProps;
  templates: TemplateProps[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasOpenaiKey: boolean;
  defaultMode: SessionModeType;
  defaultTemplateId: string;
  defaultTemplate: TemplateProps | undefined;
  coachingStyle: CoachingStyleType;
  theme: 'light' | 'dark' | 'system';
  predefinedTemplates: TemplateProps[];
  customTemplates: TemplateProps[];
  canUseMeetingCoach: boolean;
  canUseConversation: boolean;
  vadThreshold: number;
  vadSilenceDuration: number;
  suggestionInterval: number;
  maxActiveSuggestions: number;
  suggestionModel: string;
  transcriptionModel: string;

  // Actions - imperatively update state
  setConfig(config: UserConfigProps): void;
  setReactivity(reactivity: ReactivityConfigProps): void;
  setOpenaiApiKey(key: string | null): void;
  setDefaultMode(mode: SessionModeType): void;
  setDefaultTemplate(templateId: string): void;
  setCoachingStyle(style: CoachingStyleType): void;
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  setLanguage(language: string): void;
  setTemplates(templates: TemplateProps[]): void;
  addTemplate(template: TemplateProps): void;
  updateTemplate(template: TemplateProps): void;
  removeTemplate(templateId: string): void;
  setLoading(isLoading: boolean): void;
  setSaving(isSaving: boolean): void;
  setError(error: string | null): void;
  setVadThreshold(value: number): void;
  setVadSilenceDuration(value: number): void;
  setSuggestionInterval(value: number): void;
  setMaxActiveSuggestions(value: number): void;
  setSuggestionModel(value: string): void;
  setTranscriptionModel(value: string): void;
  resetReactivity(): void;
  resetSettings(): void;
}
