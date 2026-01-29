import 'dotenv/config';
import { Command } from 'commander';

import type { SessionModeType } from '../domain/session';
import type { CoachingStyleType } from '../domain/settings/valueObjects/CoachingStyle';

import { NodeMicrophoneAdapter } from './adapters/NodeMicrophoneAdapter';
import { setKey } from './commands/config';
import { startSession } from './commands/session';
import type { AudioSourceOption } from './container';
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
  .option('--openai-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env)')
  .option('--audio-file <path>', 'Audio file to process (WAV format)')
  .option('--audio-source <source>', 'Live audio source: microphone, system, mixed (default: microphone)')
  .option('--input-device <device>', 'Input device name or ID for microphone capture')
  .option('--system-device <device>', 'System audio device name or ID (e.g., "BlackHole 2ch") for mixed mode')
  .option('--list-devices', 'List available audio input devices and exit')
  .option('--coaching-style <style>', 'Coaching style: diplomatic, assertive, analytical, supportive', 'diplomatic')
  .action(async (opts: {
    mode: string;
    openaiKey?: string;
    audioFile?: string;
    audioSource?: string;
    inputDevice?: string;
    systemDevice?: string;
    listDevices?: boolean;
    coachingStyle?: string;
  }) => {
    // Handle --list-devices
    if (opts.listDevices) {
      const devices = NodeMicrophoneAdapter.listInputDevices();
      if (devices.length === 0) {
        process.stdout.write('No audio input devices found.\n');
      } else {
        process.stdout.write('Available audio input devices:\n\n');
        const blackHoleDevices = NodeMicrophoneAdapter.detectBlackHoleDevices();
        for (const device of devices) {
          const defaultMarker = device.isDefault ? ' (default)' : '';
          const blackHoleMarker = blackHoleDevices.some((bh) => bh.id === device.id) ? ' [BlackHole - virtual audio]' : '';
          process.stdout.write(`  ${device.name}${defaultMarker}${blackHoleMarker}\n`);
          process.stdout.write(`    ID: ${device.id}\n`);
          process.stdout.write(`    Sample Rate: ${String(device.sampleRate)} Hz\n`);
          process.stdout.write(`    Channels: ${String(device.channelCount)}\n\n`);
        }
        if (blackHoleDevices.length > 0) {
          process.stdout.write('💡 Tip: For dual input (mic + system audio), use:\n');
          process.stdout.write('   --audio-source mixed --system-device "BlackHole 2ch"\n');
          process.stdout.write('   (requires Multi-Output Device setup in Audio MIDI Setup)\n\n');
        } else {
          process.stdout.write('💡 Tip: Install BlackHole for system audio capture without TCC permissions:\n');
          process.stdout.write('   brew install blackhole-2ch\n\n');
        }
      }
      process.exit(0);
    }

    // Validate audio source option
    const validAudioSources = ['microphone', 'system', 'mixed'];
    if (opts.audioSource && !validAudioSources.includes(opts.audioSource)) {
      process.stderr.write(`Error: Invalid audio source "${opts.audioSource}". Valid options: ${validAudioSources.join(', ')}\n`);
      process.exit(1);
    }

    // Determine audio source: audioFile takes precedence
    const audioSource = opts.audioFile
      ? 'file' as AudioSourceOption
      : (opts.audioSource as AudioSourceOption | undefined) ?? 'microphone';

    const container = createCLIContainer({
      audioFilePath: opts.audioFile,
      audioSource,
      inputDevice: opts.inputDevice,
      systemDevice: opts.systemDevice,
    });

    await startSession(container, {
      mode: opts.mode as SessionModeType,
      openaiKey: opts.openaiKey ?? process.env['OPENAI_API_KEY'],
      coachingStyle: (opts.coachingStyle as CoachingStyleType | undefined) ?? 'diplomatic',
      audioSource,
    });
  });

program
  .command('config')
  .description('Manage configuration')
  .command('set-key')
  .description('Set an API key')
  .argument('<service>', 'Service name: openai')
  .argument('<key>', 'The API key value')
  .action(async (service: string, key: string) => {
    const container = createCLIContainer();
    await setKey(container, service, key);
  });

program.parse();
