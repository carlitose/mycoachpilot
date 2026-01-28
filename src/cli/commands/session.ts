import chalk from 'chalk';

import type { SessionModeType } from '../../domain/session';
import type { CoachingStyleType } from '../../domain/settings/valueObjects/CoachingStyle';
import type { CLIContainer } from '../container';

export interface SessionStartOptions {
  mode: SessionModeType;
  deepgramKey?: string | undefined;
  openaiKey?: string | undefined;
  audioFile?: string | undefined;
  coachingStyle?: CoachingStyleType | undefined;
}

export async function startSession(
  container: CLIContainer,
  options: SessionStartOptions,
): Promise<void> {
  const { sessionManager, eventBus } = container;

  // Subscribe to domain events for CLI output
  eventBus.subscribe('SessionStarted', () => {
    process.stdout.write(chalk.green('Session started\n'));
  });

  eventBus.subscribe('SessionStopped', () => {
    process.stdout.write(chalk.yellow('Session stopped\n'));
  });

  eventBus.subscribe('SuggestionGenerated', (event) => {
    const payload = (event as { payload?: { content?: string; type?: string } }).payload;
    if (payload) {
      process.stdout.write(
        chalk.cyan(`\n💡 [${payload.type ?? 'suggestion'}] ${payload.content ?? ''}\n`),
      );
    }
  });

  // Subscribe to transcription events for real-time output
  container.transcription.onEvent((event) => {
    if (event.type === 'segment') {
      if (event.isFinal) {
        process.stdout.write(
          chalk.white(`[Speaker ${String(event.speakerId)}] ${event.text}\n`),
        );
      } else {
        process.stdout.write(
          chalk.gray(`  ... ${event.text}\r`),
        );
      }
    } else if (event.type === 'error') {
      process.stderr.write(chalk.red(`Transcription error: ${event.message}\n`));
    }
  });

  // Subscribe to realtime events for conversation/transcript modes
  container.realtimeConnection.onEvent((event) => {
    if (event.type === 'transcript' && event.isFinal) {
      const prefix = event.role === 'user' ? chalk.blue('You') : chalk.magenta('AI');
      process.stdout.write(`${prefix}: ${event.text}\n`);
    } else if (event.type === 'error') {
      process.stderr.write(chalk.red(`Realtime error: ${event.message}\n`));
    }
  });

  process.stdout.write(chalk.bold(`Starting ${options.mode} session...\n`));

  const startOptions: {
    deepgramApiKey?: string;
    openaiApiKey?: string;
    coachingStyle?: CoachingStyleType;
  } = {
    coachingStyle: options.coachingStyle ?? 'diplomatic',
  };
  if (options.deepgramKey) startOptions.deepgramApiKey = options.deepgramKey;
  if (options.openaiKey) startOptions.openaiApiKey = options.openaiKey;

  const result = await sessionManager.startSession(options.mode, startOptions);

  if (!result.isOk()) {
    process.stderr.write(chalk.red(`Failed to start session: ${result.unwrapErr().message}\n`));
    process.exit(1);
  }

  process.stdout.write(chalk.green('Session active. Press Ctrl+C to stop.\n\n'));

  // Handle graceful shutdown
  const shutdown = (): void => {
    process.stdout.write(chalk.yellow('\nStopping session...\n'));
    sessionManager.stopSession();

    // Print summary
    const segments = sessionManager.getSegments();
    const speakers = sessionManager.getSpeakers();
    process.stdout.write(chalk.bold(`\nSession Summary:\n`));
    process.stdout.write(`  Segments: ${String(segments.length)}\n`);
    process.stdout.write(`  Speakers: ${String(speakers.length)}\n`);

    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  await new Promise(() => {
    // Never resolves — keeps process running until signal
  });
}
