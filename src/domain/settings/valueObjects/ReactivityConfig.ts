/**
 * ReactivityConfig Value Object
 * Configures VAD, coaching, and model settings for improved responsiveness
 */

export interface ReactivityConfigProps {
  // VAD Settings
  vadThreshold: number; // 0.1-1.0, default 0.5
  vadSilenceDurationMs: number; // 100-1000, default 300 (reduced from 500)

  // Coaching Settings
  suggestionIntervalMs: number; // 3000-30000, default 8000 (reduced from 15000)
  maxActiveSuggestions: number; // 1-10, default 5

  // Model Settings
  suggestionModel: string; // default: 'gpt-5.2'
  realtimeModel: string; // default: 'gpt-realtime'
  transcriptionModel: string; // default: 'gpt-4o-transcribe'
}

/**
 * Default values optimized for better reactivity
 */
export const REACTIVITY_DEFAULTS: Readonly<ReactivityConfigProps> = {
  vadThreshold: 0.5,
  vadSilenceDurationMs: 300, // Reduced from 500ms for faster transcript segments
  suggestionIntervalMs: 8000, // Reduced from 15000ms for more frequent suggestions
  maxActiveSuggestions: 5,
  suggestionModel: 'gpt-5.2',
  realtimeModel: 'gpt-realtime',
  transcriptionModel: 'gpt-4o-transcribe',
} as const;

/**
 * Validation constraints for ReactivityConfig
 */
const CONSTRAINTS = {
  vadThreshold: { min: 0.1, max: 1.0 },
  vadSilenceDurationMs: { min: 100, max: 1000 },
  suggestionIntervalMs: { min: 3000, max: 30000 },
  maxActiveSuggestions: { min: 1, max: 10 },
} as const;

/**
 * ReactivityConfig value object for controlling responsiveness settings
 */
export class ReactivityConfig {
  private readonly props: ReactivityConfigProps;

  private constructor(props: ReactivityConfigProps) {
    this.props = props;
  }

  /**
   * Create a ReactivityConfig with defaults
   */
  static createDefault(): ReactivityConfig {
    return new ReactivityConfig({ ...REACTIVITY_DEFAULTS });
  }

  /**
   * Create a ReactivityConfig from partial props, merging with defaults
   */
  static create(props: Partial<ReactivityConfigProps>): ReactivityConfig {
    const validated = ReactivityConfig.validate(props);
    return new ReactivityConfig(validated);
  }

  /**
   * Validate and merge partial props with defaults
   */
  static validate(props: Partial<ReactivityConfigProps>): ReactivityConfigProps {
    const result: ReactivityConfigProps = { ...REACTIVITY_DEFAULTS };

    if (props.vadThreshold !== undefined) {
      result.vadThreshold = ReactivityConfig.clamp(
        props.vadThreshold,
        CONSTRAINTS.vadThreshold.min,
        CONSTRAINTS.vadThreshold.max,
      );
    }

    if (props.vadSilenceDurationMs !== undefined) {
      result.vadSilenceDurationMs = ReactivityConfig.clamp(
        Math.round(props.vadSilenceDurationMs),
        CONSTRAINTS.vadSilenceDurationMs.min,
        CONSTRAINTS.vadSilenceDurationMs.max,
      );
    }

    if (props.suggestionIntervalMs !== undefined) {
      result.suggestionIntervalMs = ReactivityConfig.clamp(
        Math.round(props.suggestionIntervalMs),
        CONSTRAINTS.suggestionIntervalMs.min,
        CONSTRAINTS.suggestionIntervalMs.max,
      );
    }

    if (props.maxActiveSuggestions !== undefined) {
      result.maxActiveSuggestions = ReactivityConfig.clamp(
        Math.round(props.maxActiveSuggestions),
        CONSTRAINTS.maxActiveSuggestions.min,
        CONSTRAINTS.maxActiveSuggestions.max,
      );
    }

    if (props.suggestionModel !== undefined && props.suggestionModel.trim()) {
      result.suggestionModel = props.suggestionModel.trim();
    }

    if (props.realtimeModel !== undefined && props.realtimeModel.trim()) {
      result.realtimeModel = props.realtimeModel.trim();
    }

    if (props.transcriptionModel !== undefined && props.transcriptionModel.trim()) {
      result.transcriptionModel = props.transcriptionModel.trim();
    }

    return result;
  }

  /**
   * Clamp a value between min and max
   */
  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get all props
   */
  toProps(): ReactivityConfigProps {
    return { ...this.props };
  }

  /**
   * VAD Settings
   */
  get vadThreshold(): number {
    return this.props.vadThreshold;
  }

  get vadSilenceDurationMs(): number {
    return this.props.vadSilenceDurationMs;
  }

  /**
   * Coaching Settings
   */
  get suggestionIntervalMs(): number {
    return this.props.suggestionIntervalMs;
  }

  get maxActiveSuggestions(): number {
    return this.props.maxActiveSuggestions;
  }

  /**
   * Model Settings
   */
  get suggestionModel(): string {
    return this.props.suggestionModel;
  }

  get realtimeModel(): string {
    return this.props.realtimeModel;
  }

  get transcriptionModel(): string {
    return this.props.transcriptionModel;
  }

  /**
   * Check if using custom (non-default) values
   */
  isCustom(): boolean {
    return (
      this.props.vadThreshold !== REACTIVITY_DEFAULTS.vadThreshold ||
      this.props.vadSilenceDurationMs !== REACTIVITY_DEFAULTS.vadSilenceDurationMs ||
      this.props.suggestionIntervalMs !== REACTIVITY_DEFAULTS.suggestionIntervalMs ||
      this.props.maxActiveSuggestions !== REACTIVITY_DEFAULTS.maxActiveSuggestions ||
      this.props.suggestionModel !== REACTIVITY_DEFAULTS.suggestionModel ||
      this.props.realtimeModel !== REACTIVITY_DEFAULTS.realtimeModel ||
      this.props.transcriptionModel !== REACTIVITY_DEFAULTS.transcriptionModel
    );
  }
}
