import type { SuggestionProps, SuggestionTypeValue } from '@domain/coaching';

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
    this.model = options?.model ?? 'gpt-4o-mini';
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
        timestamp: new Date(),
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
        timestamp: new Date(),
        used: false,
        dismissed: false,
      };
    }
  }

  private buildSystemPrompt(config: Omit<CoachingEngineConfig, 'sessionId'>): string {
    const styleDescriptions: Record<string, string> = {
      diplomatic: 'Provide tactful, balanced suggestions that consider multiple perspectives and maintain professional relationships.',
      assertive: 'Provide direct, confident suggestions for clear and decisive communication.',
      analytical: 'Provide data-driven, logical suggestions focused on facts, evidence, and structured arguments.',
    };

    const styleInstruction = styleDescriptions[config.coachingStyle] ?? styleDescriptions['diplomatic'] ?? '';

    return `${config.templateSystemPrompt}

You are a real-time meeting coach. Your role is to analyze the ongoing conversation and provide helpful suggestions to the user.

Coaching Style: ${config.coachingStyle}
${styleInstruction}

IMPORTANT: Respond ONLY with a JSON object in this exact format:
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

Keep suggestions concise (1-2 sentences) and immediately actionable.`;
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
          max_tokens: 500,
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
): (context: CoachingContext) => Promise<SuggestionProps | null> {
  const generator = new OpenAISuggestionGenerator(apiKey);
  return generator.createGenerator(config);
}
