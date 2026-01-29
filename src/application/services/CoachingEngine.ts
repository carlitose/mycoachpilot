import { Suggestion, SuggestionProps, SuggestionTypeValue } from '@domain/coaching';
import type { CoachingStyleType } from '@domain/settings';
import { DomainEvent } from '@domain/shared';
import { TranscriptSegmentProps, SpeakerProps } from '@domain/transcript';

import type { EventBusPort } from '../ports';

export interface CoachingEngineConfig {
  sessionId: string;
  coachingStyle: CoachingStyleType;
  templateSystemPrompt: string;
  userSpeakerId: number | null;
  suggestionIntervalMs?: number; // Min interval between suggestions (default 15000)
  maxActiveSuggestions?: number; // Max suggestions to keep active (default 5)
}

export interface CoachingContext {
  recentSegments: TranscriptSegmentProps[];
  speakers: SpeakerProps[];
  currentSpeaker: number | null;
  conversationTone: 'positive' | 'neutral' | 'negative' | 'unknown';
}

/**
 * CoachingEngine service
 * Analyzes conversation and generates contextual coaching suggestions
 */
export class CoachingEngine {
  private _suggestions: Suggestion[] = [];
  private _lastSuggestionTime = 0;
  private _config: CoachingEngineConfig;
  private _generateSuggestionFn: ((context: CoachingContext) => Promise<SuggestionProps | null>) | null = null;

  constructor(
    private readonly eventBus: EventBusPort,
    config: CoachingEngineConfig,
  ) {
    this._config = {
      suggestionIntervalMs: 15000,
      maxActiveSuggestions: 5,
      ...config,
    };
  }

  get suggestions(): SuggestionProps[] {
    return this._suggestions.map((s) => s.toProps());
  }

  get activeSuggestions(): SuggestionProps[] {
    return this._suggestions
      .filter((s) => s.isActive)
      .map((s) => s.toProps());
  }

  /**
   * Set the function that generates suggestions (injected from infrastructure)
   */
  setSuggestionGenerator(fn: (context: CoachingContext) => Promise<SuggestionProps | null>): void {
    this._generateSuggestionFn = fn;
  }

  /**
   * Process new transcript segment and potentially generate suggestion
   * Suggestions are generated for all speakers - the prompt decides what to suggest
   */
  async processSegment(
    _segment: TranscriptSegmentProps,
    context: CoachingContext,
  ): Promise<SuggestionProps | null> {
    // Rate limit suggestions
    const now = Date.now();
    if (now - this._lastSuggestionTime < (this._config.suggestionIntervalMs ?? 15000)) {
      return null;
    }

    // Check if we have a suggestion generator
    if (!this._generateSuggestionFn) {
      return null;
    }

    // Generate suggestion
    const suggestionProps = await this._generateSuggestionFn(context);
    if (!suggestionProps) {
      return null;
    }

    // Create suggestion entity
    const suggestion = Suggestion.fromProps({
      ...suggestionProps,
      sessionId: this._config.sessionId,
    });

    // Add to suggestions
    this._suggestions.push(suggestion);
    this._lastSuggestionTime = now;

    // Trim old suggestions
    this.trimSuggestions();

    // Publish event
    this.eventBus.publish({
      eventType: 'SuggestionGenerated',
      occurredAt: new Date(),
      aggregateId: this._config.sessionId,
      payload: suggestion.toProps(),
    } as DomainEvent);

    return suggestion.toProps();
  }

  /**
   * Mark a suggestion as used
   */
  useSuggestion(suggestionId: string): void {
    const suggestion = this._suggestions.find((s) => s.id.toString() === suggestionId);
    if (suggestion) {
      suggestion.markAsUsed();
    }
  }

  /**
   * Dismiss a suggestion
   */
  dismissSuggestion(suggestionId: string): void {
    const suggestion = this._suggestions.find((s) => s.id.toString() === suggestionId);
    if (suggestion) {
      suggestion.dismiss();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CoachingEngineConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * Set the user's speaker ID
   */
  setUserSpeakerId(speakerId: number): void {
    this._config.userSpeakerId = speakerId;
  }

  /**
   * Clear all suggestions
   */
  clear(): void {
    this._suggestions = [];
    this._lastSuggestionTime = 0;
  }

  private trimSuggestions(): void {
    const maxActive = this._config.maxActiveSuggestions ?? 5;
    const activeSuggestions = this._suggestions.filter((s) => s.isActive);

    if (activeSuggestions.length > maxActive) {
      // Dismiss oldest active suggestions
      const toRemove = activeSuggestions.slice(0, activeSuggestions.length - maxActive);
      toRemove.forEach((s) => { s.dismiss(); });
    }

    // Also remove very old dismissed/used suggestions
    const maxTotal = maxActive * 3;
    if (this._suggestions.length > maxTotal) {
      this._suggestions = this._suggestions.slice(-maxTotal);
    }
  }

  /**
   * Generate coaching prompt based on context
   */
  static generateCoachingPrompt(
    context: CoachingContext,
    style: CoachingStyleType,
    templatePrompt: string,
  ): string {
    const recentText = context.recentSegments
      .map((s) => {
        const speakerLabel = context.speakers.find((sp) => sp.id === s.speakerId)?.name
          ?? `Speaker ${String(s.speakerId)}`;
        return `${speakerLabel}: ${s.text}`;
      })
      .join('\n');

    const styleInstructions = {
      diplomatic: 'Provide tactful, balanced suggestions that consider multiple perspectives.',
      assertive: 'Provide direct, confident suggestions for clear communication.',
      analytical: 'Provide data-driven suggestions focused on facts and logic.',
      supportive: 'Provide empathetic suggestions that prioritize rapport building.',
    };

    return `${templatePrompt}

Coaching Style: ${style}
${styleInstructions[style]}

Recent conversation:
${recentText}

Based on this context, provide a single helpful coaching suggestion.
The suggestion should be:
- Actionable and specific
- Appropriate for the current moment in the conversation
- Aligned with the coaching style

Respond with JSON in this format:
{
  "type": "response_suggestion" | "talking_point" | "question" | "objection_handling" | "closing" | "rapport_building" | "clarification" | "summary" | "general",
  "content": "The suggestion text",
  "context": "Brief explanation of why this suggestion is relevant"
}`;
  }

  /**
   * Parse AI response to suggestion
   */
  static parseSuggestionResponse(
    response: string,
    sessionId: string,
  ): SuggestionProps | null {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as {
        type?: SuggestionTypeValue;
        content?: string;
        context?: string;
      };

      if (!parsed.type || !parsed.content) return null;

      return {
        id: crypto.randomUUID(),
        sessionId,
        type: parsed.type,
        content: parsed.content,
        context: parsed.context ?? null,
        confidence: 0.8,
        timestamp: new Date(),
        used: false,
        dismissed: false,
      };
    } catch {
      return null;
    }
  }
}
