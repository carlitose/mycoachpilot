import type { UserConfigProps, TemplateProps, ReactivityConfigProps, CoachingPromptConfigProps } from '@domain/settings';
import type { Result } from '@domain/shared';

/**
 * ConfigRepository port interface
 * Handles persistence of user configuration and templates
 */
export interface ConfigRepositoryPort {
  /**
   * Get user configuration
   */
  getConfig(): Promise<Result<UserConfigProps | null, Error>>;

  /**
   * Save user configuration
   */
  saveConfig(config: UserConfigProps): Promise<Result<void, Error>>;

  /**
   * Get all templates (predefined + custom)
   */
  getTemplates(): Promise<Result<TemplateProps[], Error>>;

  /**
   * Get a template by ID
   */
  getTemplateById(templateId: string): Promise<Result<TemplateProps | null, Error>>;

  /**
   * Save a custom template
   */
  saveTemplate(template: TemplateProps): Promise<Result<void, Error>>;

  /**
   * Delete a custom template (cannot delete predefined)
   */
  deleteTemplate(templateId: string): Promise<Result<void, Error>>;

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): Promise<Result<void, Error>>;

  /**
   * Get reactivity configuration
   */
  getReactivityConfig(): Promise<Result<ReactivityConfigProps | null, Error>>;

  /**
   * Save reactivity configuration
   */
  saveReactivityConfig(config: ReactivityConfigProps): Promise<Result<void, Error>>;

  /**
   * Get coaching prompt configuration
   */
  getCoachingPromptConfig(): Promise<Result<CoachingPromptConfigProps | null, Error>>;

  /**
   * Save coaching prompt configuration
   */
  saveCoachingPromptConfig(config: CoachingPromptConfigProps): Promise<Result<void, Error>>;
}
