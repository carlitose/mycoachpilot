import { BaseDomainEvent } from '@domain/shared';

import type { SuggestionTypeValue } from '../valueObjects/SuggestionType';

export interface SuggestionGeneratedPayload {
  suggestionId: string;
  sessionId: string;
  type: SuggestionTypeValue;
  content: string;
  context: string | null;
  confidence: number;
}

export class SuggestionGenerated extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'SuggestionGenerated';

  constructor(public readonly payload: SuggestionGeneratedPayload) {
    super(SuggestionGenerated.EVENT_TYPE, payload.sessionId);
  }

  get suggestionId(): string {
    return this.payload.suggestionId;
  }

  get sessionId(): string {
    return this.payload.sessionId;
  }

  get type(): SuggestionTypeValue {
    return this.payload.type;
  }

  get content(): string {
    return this.payload.content;
  }
}
