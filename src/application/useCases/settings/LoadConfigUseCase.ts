import type { UserConfigProps, TemplateProps } from '@domain/settings';
import { PREDEFINED_TEMPLATES } from '@domain/settings';
import { ok, err, type Result } from '@domain/shared';

import type { ConfigRepositoryPort } from '../../ports';

export interface LoadConfigOutput {
  config: UserConfigProps;
  templates: TemplateProps[];
}

/**
 * Load Config Use Case
 * Loads user configuration and available templates
 */
export class LoadConfigUseCase {
  constructor(private readonly configRepository: ConfigRepositoryPort) {}

  async execute(): Promise<Result<LoadConfigOutput, Error>> {
    // Get config
    const configResult = await this.configRepository.getConfig();
    if (!configResult.isOk()) {
      return err(configResult.unwrapErr());
    }

    // Use default if not found
    const config: UserConfigProps = configResult.unwrap() ?? {
      id: 'default',
      openaiApiKey: null,
      deepgramApiKey: null,
      defaultMode: 'conversation',
      defaultTemplateId: 'general',
      coachingStyle: 'diplomatic',
      theme: 'system',
      language: 'en',
    };

    // Get templates
    const templatesResult = await this.configRepository.getTemplates();
    if (!templatesResult.isOk()) {
      // Return predefined templates if loading fails
      return ok({
        config,
        templates: PREDEFINED_TEMPLATES,
      });
    }

    // Merge predefined with custom templates
    const customTemplates = templatesResult.unwrap().filter((t: TemplateProps) => !t.isPredefined);
    const templates = [...PREDEFINED_TEMPLATES, ...customTemplates];

    return ok({ config, templates });
  }
}
