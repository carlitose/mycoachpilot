import chalk from 'chalk';

import type { SessionModeType } from '../../domain/session';
import type { ReactivityConfigProps, CoachingStyleType } from '../../domain/settings';
import type { AudioSourceOption, CLIContainer } from '../container';

export interface SessionStartOptions {
  mode: SessionModeType;
  openaiKey?: string | undefined;
  audioFile?: string | undefined;
  audioSource?: AudioSourceOption | undefined;
  coachingStyle?: CoachingStyleType | undefined;
  reactivity?: ReactivityConfigProps;
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

  // Subscribe to SegmentReceived events for meeting_coach mode speaker identification
  let lastSegmentInterimLength = 0;
  eventBus.subscribe('SegmentReceived', (event) => {
    const payload = (event as { payload?: { speakerName?: string; text?: string; isFinal?: boolean } }).payload;
    if (payload) {
      if (payload.isFinal) {
        // Clear any interim text before printing final
        if (lastSegmentInterimLength > 0) {
          process.stdout.write(`\r${' '.repeat(lastSegmentInterimLength)}\r`);
          lastSegmentInterimLength = 0;
        }
        // Use speaker name (You/Others) instead of speaker number
        const speakerLabel = payload.speakerName ?? 'Speaker';
        const speakerColor = speakerLabel === 'You' ? chalk.blue : chalk.magenta;
        process.stdout.write(
          speakerColor(`[${speakerLabel}] `) + chalk.white(`${payload.text ?? ''}\n`),
        );
      } else {
        // Show interim with proper line clearing
        const maxLen = 75;
        const displayText = (payload.text ?? '').length > maxLen
          ? `${(payload.text ?? '').slice(-maxLen)}...`
          : payload.text ?? '';
        const line = chalk.gray(`  ... ${displayText}`);
        if (lastSegmentInterimLength > 0) {
          process.stdout.write(`\r${' '.repeat(lastSegmentInterimLength)}\r`);
        }
        process.stdout.write(line);
        lastSegmentInterimLength = line.length;
      }
    }
  });

  // Finalize audio when file audio ends (for file-based input)
  container.audioCapture.onAudioEvent((event) => {
    if (event.type === 'ended') {
      // For conversation/transcript_only modes (OpenAI Realtime)
      container.realtimeConnection.commitAudioBuffer();
      // Trigger response for conversation mode (VAD may not detect end-of-speech from file)
      if (options.mode === 'conversation') {
        container.realtimeConnection.triggerResponse();
      }
    }
  });

  // Subscribe to realtime events for conversation/transcript_only modes
  // (meeting_coach uses SegmentReceived events for speaker identification)
  let lastInterimLength = 0;
  container.realtimeConnection.onEvent((event) => {
    // Skip transcript events for meeting_coach - handled by SegmentReceived
    if (options.mode === 'meeting_coach' && event.type === 'transcript') {
      return;
    }
    if (event.type === 'transcript' && event.isFinal) {
      // Clear any interim text before printing final
      if (lastInterimLength > 0) {
        process.stdout.write(`\r${' '.repeat(lastInterimLength)}\r`);
        lastInterimLength = 0;
      }
      const prefix = event.role === 'user' ? chalk.blue('You') : chalk.magenta('AI');
      process.stdout.write(`${prefix}: ${event.text}\n`);
    } else if (event.type === 'response_text') {
      // Show interim results with proper line clearing
      if (!event.isFinal) {
        // Truncate long interim text to terminal width (approx 80 chars)
        const maxLen = 75;
        const displayText = event.text.length > maxLen
          ? `${event.text.slice(-maxLen)}...`
          : event.text;
        const line = chalk.gray(`  ... ${displayText}`);
        // Clear previous interim and write new one
        if (lastInterimLength > 0) {
          process.stdout.write(`\r${' '.repeat(lastInterimLength)}\r`);
        }
        process.stdout.write(line);
        lastInterimLength = line.length;
      }
    } else if (event.type === 'error') {
      process.stderr.write(chalk.red(`Realtime error: ${event.message}\n`));
    }
  });

  const audioSourceLabel = options.audioSource === 'file'
    ? `file: ${options.audioFile ?? 'unknown'}`
    : options.audioSource ?? 'microphone';
  process.stdout.write(chalk.bold(`Starting ${options.mode} session (audio: ${audioSourceLabel})...\n`));

  // Map audioSource to audioConfig for SessionManager
  const audioSourceOption = options.audioSource ?? 'microphone';
  const audioConfig = {
    micEnabled: audioSourceOption === 'microphone' || audioSourceOption === 'mixed' || audioSourceOption === 'file',
    tabAudioEnabled: audioSourceOption === 'system' || audioSourceOption === 'mixed',
    audioSourceType: audioSourceOption as 'microphone' | 'system' | 'mixed' | 'file',
  };

  const startOptions: {
    openaiApiKey?: string;
    coachingStyle?: CoachingStyleType;
    audioConfig?: typeof audioConfig;
    reactivity?: ReactivityConfigProps;
  } = {
    coachingStyle: options.coachingStyle ?? 'diplomatic',
    audioConfig,
    reactivity: options.reactivity ?? container.reactivity,
  };
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
