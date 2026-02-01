/**
 * TTS (Text-to-Speech) Configuration Value Object
 * Controls AI voice responses in conversation mode and coach suggestions
 */

/**
 * Available TTS voices from OpenAI API (gpt-4o-mini-tts)
 */
export const TTS_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
] as const;

export type TTSVoice = (typeof TTS_VOICES)[number];

export interface TTSConfigProps {
  // Conversation mode TTS
  enabled: boolean;
  volume: number; // 0.0 - 1.0

  // Coach suggestions TTS
  coachTTSEnabled: boolean;
  coachTTSVoice: TTSVoice;
  coachTTSSpeed: number; // 0.25 - 4.0
  coachTTSVolume: number; // 0.0 - 1.0
}

export const TTS_DEFAULTS: TTSConfigProps = {
  enabled: true,
  volume: 0.8,
  coachTTSEnabled: false,
  coachTTSVoice: 'coral',
  coachTTSSpeed: 1.0,
  coachTTSVolume: 0.8,
};

/**
 * TTSConfig value object with validation
 */
export class TTSConfig {
  private readonly _enabled: boolean;
  private readonly _volume: number;
  private readonly _coachTTSEnabled: boolean;
  private readonly _coachTTSVoice: TTSVoice;
  private readonly _coachTTSSpeed: number;
  private readonly _coachTTSVolume: number;

  private constructor(
    enabled: boolean,
    volume: number,
    coachTTSEnabled: boolean,
    coachTTSVoice: TTSVoice,
    coachTTSSpeed: number,
    coachTTSVolume: number,
  ) {
    this._enabled = enabled;
    this._volume = Math.max(0, Math.min(1, volume));
    this._coachTTSEnabled = coachTTSEnabled;
    this._coachTTSVoice = coachTTSVoice;
    this._coachTTSSpeed = Math.max(0.25, Math.min(4.0, coachTTSSpeed));
    this._coachTTSVolume = Math.max(0, Math.min(1, coachTTSVolume));
  }

  static create(props: Partial<TTSConfigProps> = {}): TTSConfig {
    return new TTSConfig(
      props.enabled ?? TTS_DEFAULTS.enabled,
      props.volume ?? TTS_DEFAULTS.volume,
      props.coachTTSEnabled ?? TTS_DEFAULTS.coachTTSEnabled,
      props.coachTTSVoice ?? TTS_DEFAULTS.coachTTSVoice,
      props.coachTTSSpeed ?? TTS_DEFAULTS.coachTTSSpeed,
      props.coachTTSVolume ?? TTS_DEFAULTS.coachTTSVolume,
    );
  }

  static fromProps(props: TTSConfigProps): TTSConfig {
    return new TTSConfig(
      props.enabled,
      props.volume,
      props.coachTTSEnabled,
      props.coachTTSVoice,
      props.coachTTSSpeed,
      props.coachTTSVolume,
    );
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get volume(): number {
    return this._volume;
  }

  get coachTTSEnabled(): boolean {
    return this._coachTTSEnabled;
  }

  get coachTTSVoice(): TTSVoice {
    return this._coachTTSVoice;
  }

  get coachTTSSpeed(): number {
    return this._coachTTSSpeed;
  }

  get coachTTSVolume(): number {
    return this._coachTTSVolume;
  }

  withEnabled(enabled: boolean): TTSConfig {
    return new TTSConfig(enabled, this._volume, this._coachTTSEnabled, this._coachTTSVoice, this._coachTTSSpeed, this._coachTTSVolume);
  }

  withVolume(volume: number): TTSConfig {
    return new TTSConfig(this._enabled, volume, this._coachTTSEnabled, this._coachTTSVoice, this._coachTTSSpeed, this._coachTTSVolume);
  }

  withCoachTTSEnabled(enabled: boolean): TTSConfig {
    return new TTSConfig(this._enabled, this._volume, enabled, this._coachTTSVoice, this._coachTTSSpeed, this._coachTTSVolume);
  }

  withCoachTTSVoice(voice: TTSVoice): TTSConfig {
    return new TTSConfig(this._enabled, this._volume, this._coachTTSEnabled, voice, this._coachTTSSpeed, this._coachTTSVolume);
  }

  withCoachTTSSpeed(speed: number): TTSConfig {
    return new TTSConfig(this._enabled, this._volume, this._coachTTSEnabled, this._coachTTSVoice, speed, this._coachTTSVolume);
  }

  withCoachTTSVolume(volume: number): TTSConfig {
    return new TTSConfig(this._enabled, this._volume, this._coachTTSEnabled, this._coachTTSVoice, this._coachTTSSpeed, volume);
  }

  toProps(): TTSConfigProps {
    return {
      enabled: this._enabled,
      volume: this._volume,
      coachTTSEnabled: this._coachTTSEnabled,
      coachTTSVoice: this._coachTTSVoice,
      coachTTSSpeed: this._coachTTSSpeed,
      coachTTSVolume: this._coachTTSVolume,
    };
  }
}
