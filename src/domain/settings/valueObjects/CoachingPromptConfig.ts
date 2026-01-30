/**
 * CoachingPromptConfig Value Object
 * Configures customizable prompts for coaching suggestions
 */

export interface StyleDescriptions {
  diplomatic: string;
  assertive: string;
  analytical: string;
  supportive: string;
}

export interface CoachingPromptConfigProps {
  baseInstructions: string;
  styleDescriptions: StyleDescriptions;
  formatInstructions: string;
}

/**
 * Default values for coaching prompts
 */
export const COACHING_PROMPT_DEFAULTS: Readonly<CoachingPromptConfigProps> = {
  baseInstructions: `You are a real-time meeting coach. Your role is to analyze the ongoing conversation and provide helpful suggestions to the user.`,
  styleDescriptions: {
    diplomatic: 'Provide tactful, balanced suggestions that consider multiple perspectives and maintain professional relationships.',
    assertive: 'Provide direct, confident suggestions for clear and decisive communication.',
    analytical: 'Provide data-driven, logical suggestions focused on facts, evidence, and structured arguments.',
    supportive: 'Provide empathetic, encouraging suggestions that build confidence and rapport.',
  },
  formatInstructions: `IMPORTANT: Respond ONLY with a JSON object in this exact format:
{
  "type": "question" | "response_suggestion" | "talking_point" | "clarification" | "summary" | "objection_handling" | "closing" | "rapport_building" | "general",
  "content": "Your suggestion text here",
  "context": "Brief explanation of why this suggestion is relevant (optional)"
}

Types explained:
- question: A question to ask the other party
- response_suggestion: A suggested response to what was said
- talking_point: A key point to make
- clarification: A clarification to request
- summary: A summary of key points
- objection_handling: How to handle an objection
- closing: A closing technique
- rapport_building: Build rapport suggestion
- general: A general coaching tip

Keep suggestions concise (1-2 sentences) and immediately actionable.`,
} as const;

/**
 * Validation constraints for CoachingPromptConfig
 */
const CONSTRAINTS = {
  baseInstructions: { minLength: 10, maxLength: 2000 },
  styleDescription: { minLength: 10, maxLength: 1000 },
  formatInstructions: { minLength: 50, maxLength: 5000 },
} as const;

/**
 * CoachingPromptConfig value object for controlling coaching prompt customization
 */
export class CoachingPromptConfig {
  private readonly props: CoachingPromptConfigProps;

  private constructor(props: CoachingPromptConfigProps) {
    this.props = props;
  }

  /**
   * Create a CoachingPromptConfig with defaults
   */
  static createDefault(): CoachingPromptConfig {
    return new CoachingPromptConfig({ ...COACHING_PROMPT_DEFAULTS });
  }

  /**
   * Create a CoachingPromptConfig from partial props, merging with defaults
   */
  static create(props: Partial<CoachingPromptConfigProps>): CoachingPromptConfig {
    const validated = CoachingPromptConfig.validate(props);
    return new CoachingPromptConfig(validated);
  }

  /**
   * Validate and merge partial props with defaults
   */
  static validate(props: Partial<CoachingPromptConfigProps>): CoachingPromptConfigProps {
    const result: CoachingPromptConfigProps = {
      baseInstructions: COACHING_PROMPT_DEFAULTS.baseInstructions,
      styleDescriptions: { ...COACHING_PROMPT_DEFAULTS.styleDescriptions },
      formatInstructions: COACHING_PROMPT_DEFAULTS.formatInstructions,
    };

    if (props.baseInstructions !== undefined) {
      result.baseInstructions = CoachingPromptConfig.validateString(
        props.baseInstructions,
        CONSTRAINTS.baseInstructions.minLength,
        CONSTRAINTS.baseInstructions.maxLength,
        COACHING_PROMPT_DEFAULTS.baseInstructions,
      );
    }

    if (props.styleDescriptions !== undefined) {
      result.styleDescriptions = {
        diplomatic: CoachingPromptConfig.validateString(
          props.styleDescriptions.diplomatic,
          CONSTRAINTS.styleDescription.minLength,
          CONSTRAINTS.styleDescription.maxLength,
          COACHING_PROMPT_DEFAULTS.styleDescriptions.diplomatic,
        ),
        assertive: CoachingPromptConfig.validateString(
          props.styleDescriptions.assertive,
          CONSTRAINTS.styleDescription.minLength,
          CONSTRAINTS.styleDescription.maxLength,
          COACHING_PROMPT_DEFAULTS.styleDescriptions.assertive,
        ),
        analytical: CoachingPromptConfig.validateString(
          props.styleDescriptions.analytical,
          CONSTRAINTS.styleDescription.minLength,
          CONSTRAINTS.styleDescription.maxLength,
          COACHING_PROMPT_DEFAULTS.styleDescriptions.analytical,
        ),
        supportive: CoachingPromptConfig.validateString(
          props.styleDescriptions.supportive,
          CONSTRAINTS.styleDescription.minLength,
          CONSTRAINTS.styleDescription.maxLength,
          COACHING_PROMPT_DEFAULTS.styleDescriptions.supportive,
        ),
      };
    }

    if (props.formatInstructions !== undefined) {
      result.formatInstructions = CoachingPromptConfig.validateString(
        props.formatInstructions,
        CONSTRAINTS.formatInstructions.minLength,
        CONSTRAINTS.formatInstructions.maxLength,
        COACHING_PROMPT_DEFAULTS.formatInstructions,
      );
    }

    return result;
  }

  /**
   * Validate a string field with min/max length constraints
   */
  private static validateString(
    value: string | undefined,
    minLength: number,
    maxLength: number,
    defaultValue: string,
  ): string {
    if (value === undefined) return defaultValue;
    const trimmed = value.trim();
    if (trimmed.length < minLength || trimmed.length > maxLength) {
      return defaultValue;
    }
    return trimmed;
  }

  /**
   * Get all props
   */
  toProps(): CoachingPromptConfigProps {
    return {
      baseInstructions: this.props.baseInstructions,
      styleDescriptions: { ...this.props.styleDescriptions },
      formatInstructions: this.props.formatInstructions,
    };
  }

  /**
   * Getters
   */
  get baseInstructions(): string {
    return this.props.baseInstructions;
  }

  get styleDescriptions(): StyleDescriptions {
    return { ...this.props.styleDescriptions };
  }

  get formatInstructions(): string {
    return this.props.formatInstructions;
  }

  /**
   * Get style description for a specific style
   */
  getStyleDescription(style: keyof StyleDescriptions): string {
    return this.props.styleDescriptions[style];
  }

  /**
   * Check if using custom (non-default) values
   */
  isCustom(): boolean {
    return (
      this.props.baseInstructions !== COACHING_PROMPT_DEFAULTS.baseInstructions ||
      this.props.styleDescriptions.diplomatic !== COACHING_PROMPT_DEFAULTS.styleDescriptions.diplomatic ||
      this.props.styleDescriptions.assertive !== COACHING_PROMPT_DEFAULTS.styleDescriptions.assertive ||
      this.props.styleDescriptions.analytical !== COACHING_PROMPT_DEFAULTS.styleDescriptions.analytical ||
      this.props.styleDescriptions.supportive !== COACHING_PROMPT_DEFAULTS.styleDescriptions.supportive ||
      this.props.formatInstructions !== COACHING_PROMPT_DEFAULTS.formatInstructions
    );
  }
}
