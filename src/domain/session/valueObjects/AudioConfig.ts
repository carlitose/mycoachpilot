import { ValueObject } from '@domain/shared';

export interface AudioConfigProps {
  micEnabled: boolean;
  tabAudioEnabled: boolean;
  sampleRate: number;
  channelCount: number;
}

const DEFAULT_CONFIG: AudioConfigProps = {
  micEnabled: true,
  tabAudioEnabled: false,
  sampleRate: 24000, // 24kHz for OpenAI Realtime
  channelCount: 1,
};

/**
 * Audio configuration value object
 */
export class AudioConfig extends ValueObject<AudioConfigProps> {
  private readonly _props: AudioConfigProps;

  private constructor(props: AudioConfigProps) {
    super();
    this._props = props;
  }

  protected get value(): AudioConfigProps {
    return this._props;
  }

  get micEnabled(): boolean {
    return this._props.micEnabled;
  }

  get tabAudioEnabled(): boolean {
    return this._props.tabAudioEnabled;
  }

  get sampleRate(): number {
    return this._props.sampleRate;
  }

  get channelCount(): number {
    return this._props.channelCount;
  }

  withMicEnabled(enabled: boolean): AudioConfig {
    return new AudioConfig({ ...this._props, micEnabled: enabled });
  }

  withTabAudioEnabled(enabled: boolean): AudioConfig {
    return new AudioConfig({ ...this._props, tabAudioEnabled: enabled });
  }

  withSampleRate(sampleRate: number): AudioConfig {
    if (sampleRate < 8000 || sampleRate > 48000) {
      throw new Error('Sample rate must be between 8000 and 48000 Hz');
    }
    return new AudioConfig({ ...this._props, sampleRate });
  }

  toJSON(): AudioConfigProps {
    return { ...this._props };
  }

  static create(props?: Partial<AudioConfigProps>): AudioConfig {
    return new AudioConfig({ ...DEFAULT_CONFIG, ...props });
  }

  static default(): AudioConfig {
    return new AudioConfig(DEFAULT_CONFIG);
  }

  static forDeepgram(): AudioConfig {
    return new AudioConfig({
      ...DEFAULT_CONFIG,
      sampleRate: 16000, // 16kHz for Deepgram
    });
  }

  static forOpenAI(): AudioConfig {
    return new AudioConfig({
      ...DEFAULT_CONFIG,
      sampleRate: 24000, // 24kHz for OpenAI
    });
  }
}
