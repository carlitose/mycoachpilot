import 'dotenv/config';
import { Command } from 'commander';

import type { SessionModeType } from '../domain/session';
import type { CoachingStyleType } from '../domain/settings/valueObjects/CoachingStyle';

import { setKey } from './commands/config';
import { startSession } from './commands/session';
import { createCLIContainer } from './container';

const program = new Command();

program
  .name('mycoachpilot')
  .description('Real-time AI-powered meeting coach CLI')
  .version('1.0.0');

program
  .command('session')
  .description('Manage coaching sessions')
  .command('start')
  .description('Start a new coaching session')
  .option('-m, --mode <mode>', 'Session mode: meeting_coach, conversation, transcript_only', 'meeting_coach')
  .option('--deepgram-key <key>', 'Deepgram API key (or set DEEPGRAM_API_KEY env)')
  .option('--openai-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env)')
  .option('--audio-file <path>', 'Audio file to process (WAV format)')
  .option('--coaching-style <style>', 'Coaching style: diplomatic, assertive, analytical, supportive', 'diplomatic')
  .action(async (opts: {
    mode: string;
    deepgramKey?: string;
    openaiKey?: string;
    audioFile?: string;
    coachingStyle?: string;
  }) => {
    const container = createCLIContainer(
      opts.audioFile ? { audioFilePath: opts.audioFile } : {},
    );

    await startSession(container, {
      mode: opts.mode as SessionModeType,
      deepgramKey: opts.deepgramKey ?? process.env['DEEPGRAM_API_KEY'],
      openaiKey: opts.openaiKey ?? process.env['OPENAI_API_KEY'],
      coachingStyle: (opts.coachingStyle as CoachingStyleType | undefined) ?? 'diplomatic',
    });
  });

program
  .command('config')
  .description('Manage configuration')
  .command('set-key')
  .description('Set an API key')
  .argument('<service>', 'Service name: openai or deepgram')
  .argument('<key>', 'The API key value')
  .action(async (service: string, key: string) => {
    const container = createCLIContainer();
    await setKey(container, service, key);
  });

program.parse();
