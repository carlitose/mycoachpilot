import chalk from 'chalk';

import type { CLIContainer } from '../container';

export async function setKey(
  container: CLIContainer,
  service: string,
  key: string,
): Promise<void> {
  const { configRepository } = container;

  const configResult = await configRepository.getConfig();
  const config = configResult.isOk() ? configResult.unwrap() : null;

  const updatedConfig = config ?? {
    id: 'default',
    openaiApiKey: null,
    deepgramApiKey: null,
    defaultMode: 'conversation' as const,
    defaultTemplateId: 'general',
    coachingStyle: 'diplomatic' as const,
    theme: 'system' as const,
    language: 'en',
  };

  switch (service) {
    case 'openai':
      updatedConfig.openaiApiKey = key;
      break;
    case 'deepgram':
      updatedConfig.deepgramApiKey = key;
      break;
    default:
      process.stderr.write(chalk.red(`Unknown service: ${service}. Use "openai" or "deepgram".\n`));
      process.exit(1);
  }

  await configRepository.saveConfig(updatedConfig);
  process.stdout.write(chalk.green(`${service} API key saved.\n`));
}
