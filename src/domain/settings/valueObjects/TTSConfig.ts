/**
 * TTS (Text-to-Speech) Configuration Value Object
 * Controls AI voice responses in conversation mode
 */

export interface TTSConfigProps {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
}

export const TTS_DEFAULTS: TTSConfigProps = {
  enabled: true,
  volume: 0.8,
};

/**
 * TTSConfig value object with validation
 */
export class TTSConfig {
  private readonly _enabled: boolean;
  private readonly _volume: number;

  private constructor(enabled: boolean, volume: number) {
    this._enabled = enabled;
    this._volume = Math.max(0, Math.min(1, volume));
  }

  static create(props: Partial<TTSConfigProps> = {}): TTSConfig {
    return new TTSConfig(
      props.enabled ?? TTS_DEFAULTS.enabled,
      props.volume ?? TTS_DEFAULTS.volume,
    );
  }

  static fromProps(props: TTSConfigProps): TTSConfig {
    return new TTSConfig(props.enabled, props.volume);
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get volume(): number {
    return this._volume;
  }

  withEnabled(enabled: boolean): TTSConfig {
    return new TTSConfig(enabled, this._volume);
  }

  withVolume(volume: number): TTSConfig {
    return new TTSConfig(this._enabled, volume);
  }

  toProps(): TTSConfigProps {
    return {
      enabled: this._enabled,
      volume: this._volume,
    };
  }
}
