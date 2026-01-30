import type { SuggestionProps, SuggestionTypeValue } from '@domain/coaching';
import { COACHING_PROMPT_DEFAULTS } from '@domain/settings';

import type { CoachingContext, CoachingEngineConfig } from '@application/services';

/**
 * OpenAI Chat Completion response types
 */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface SuggestionResponse {
  type: SuggestionTypeValue;
  content: string;
  context?: string;
}

/**
 * OpenAI-based suggestion generator
 * Makes direct API calls to OpenAI Chat Completions
 */
export class OpenAISuggestionGenerator {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, options?: { model?: string; baseUrl?: string }) {
    this.apiKey = apiKey;
    this.model = options?.model ?? 'gpt-5.2';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
  }

  /**
   * Create a suggestion generator function for the CoachingEngine
   */
  createGenerator(config: Omit<CoachingEngineConfig, 'sessionId'>): (context: CoachingContext) => Promise<SuggestionProps | null> {
    return async (context: CoachingContext): Promise<SuggestionProps | null> => {
      try {
        const suggestion = await this.generateSuggestion(context, config);
        return suggestion;
      } catch {
        return null;
      }
    };
  }

  /**
   * Generate a coaching suggestion based on context
   */
  async generateSuggestion(
    context: CoachingContext,
    config: Omit<CoachingEngineConfig, 'sessionId'>,
  ): Promise<SuggestionProps | null> {
    const systemPrompt = this.buildSystemPrompt(config);
    const userPrompt = this.buildUserPrompt(context);

    const response = await this.callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    if (!response) {
      return null;
    }

    try {
      const parsed = JSON.parse(response) as SuggestionResponse;
      return {
        id: crypto.randomUUID(),
        sessionId: '', // Will be set by CoachingEngine
        type: parsed.type,
        content: parsed.content,
        context: parsed.context ?? null,
        confidence: 0.8,
        timestamp: new Date().toISOString(),
        used: false,
        dismissed: false,
      };
    } catch {
      // If response isn't valid JSON, create a generic suggestion
      return {
        id: crypto.randomUUID(),
        sessionId: '',
        type: 'general',
        content: response,
        context: null,
        confidence: 0.7,
        timestamp: new Date().toISOString(),
        used: false,
        dismissed: false,
      };
    }
  }

  private buildSystemPrompt(config: Omit<CoachingEngineConfig, 'sessionId'>): string {
    const promptConfig = config.promptConfig ?? COACHING_PROMPT_DEFAULTS;

    // Get style description from config
    const styleKey = config.coachingStyle as keyof typeof promptConfig.styleDescriptions;
    const styleDescription = promptConfig.styleDescriptions[styleKey];

    return `${config.templateSystemPrompt}

${promptConfig.baseInstructions}

Coaching Style: ${config.coachingStyle}
${styleDescription}

${promptConfig.formatInstructions}`;
  }

  private buildUserPrompt(context: CoachingContext): string {
    if (context.recentSegments.length === 0) {
      return 'No recent conversation to analyze.';
    }

    const transcript = context.recentSegments
      .map((segment) => {
        const speaker = context.speakers.find((s) => s.id === segment.speakerId);
        const label = speaker?.name ?? `Speaker ${String(segment.speakerId)}`;
        return `${label}: ${segment.text}`;
      })
      .join('\n');

    const toneContext = context.conversationTone !== 'unknown'
      ? `\nCurrent conversation tone: ${context.conversationTone}`
      : '';

    return `Recent conversation:
${transcript}
${toneContext}

Based on this conversation, provide ONE helpful coaching suggestion for the user.`;
  }

  private async callOpenAI(messages: ChatMessage[]): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_completion_tokens: 500,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as ChatCompletionResponse;
      return data.choices[0]?.message.content ?? null;
    } catch {
      return null;
    }
  }
}

/**
 * Create a suggestion generator with the given API key
 */
export function createSuggestionGenerator(
  apiKey: string,
  config: Omit<CoachingEngineConfig, 'sessionId'>,
  options?: { model: string },
): (context: CoachingContext) => Promise<SuggestionProps | null> {
  const generatorOptions = options?.model ? { model: options.model } : undefined;
  const generator = new OpenAISuggestionGenerator(apiKey, generatorOptions);
  return generator.createGenerator(config);
}
