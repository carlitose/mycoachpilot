import type { UserConfigProps } from '@domain/settings';
import { ok, err, type Result } from '@domain/shared';

import type { ConfigRepositoryPort } from '../../ports';

export interface SaveConfigInput {
  config: Partial<UserConfigProps>;
}

/**
 * Save Config Use Case
 * Updates and persists user configuration
 */
export class SaveConfigUseCase {
  constructor(private readonly configRepository: ConfigRepositoryPort) {}

  async execute(input: SaveConfigInput): Promise<Result<UserConfigProps, Error>> {
    // Get existing config
    const existingResult = await this.configRepository.getConfig();
    if (!existingResult.isOk()) {
      return err(existingResult.unwrapErr());
    }

    // Merge with existing or create new
    const existing = existingResult.unwrap() ?? {
      id: 'default',
      openaiApiKey: null,
      deepgramApiKey: null,
      defaultMode: 'conversation' as const,
      defaultTemplateId: 'general',
      coachingStyle: 'diplomatic' as const,
      theme: 'system' as const,
      language: 'en',
    };

    const updatedConfig: UserConfigProps = {
      ...existing,
      ...input.config,
    };

    // Save updated config
    const saveResult = await this.configRepository.saveConfig(updatedConfig);
    if (!saveResult.isOk()) {
      return err(saveResult.unwrapErr());
    }

    return ok(updatedConfig);
  }
}
