import { Entity } from '@domain/shared';

import { SuggestionId } from '../valueObjects/SuggestionId';
import { SuggestionType, SuggestionTypeValue } from '../valueObjects/SuggestionType';

export interface SuggestionProps {
  id: string;
  sessionId: string;
  type: SuggestionTypeValue;
  content: string;
  context: string | null;
  confidence: number;
  timestamp: Date;
  used: boolean;
  dismissed: boolean;
}

/**
 * Suggestion entity
 * Represents an AI-generated coaching suggestion
 */
export class Suggestion extends Entity<SuggestionId> {
  private readonly _sessionId: string;
  private readonly _type: SuggestionType;
  private readonly _content: string;
  private readonly _context: string | null;
  private readonly _confidence: number;
  private readonly _timestamp: Date;
  private _used: boolean;
  private _dismissed: boolean;

  private constructor(
    id: SuggestionId,
    sessionId: string,
    type: SuggestionType,
    content: string,
    context: string | null,
    confidence: number,
    timestamp: Date,
    used: boolean,
    dismissed: boolean,
  ) {
    super(id);
    this._sessionId = sessionId;
    this._type = type;
    this._content = content;
    this._context = context;
    this._confidence = confidence;
    this._timestamp = timestamp;
    this._used = used;
    this._dismissed = dismissed;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get type(): SuggestionType {
    return this._type;
  }

  get content(): string {
    return this._content;
  }

  get context(): string | null {
    return this._context;
  }

  get confidence(): number {
    return this._confidence;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get used(): boolean {
    return this._used;
  }

  get dismissed(): boolean {
    return this._dismissed;
  }

  get isActive(): boolean {
    return !this._used && !this._dismissed;
  }

  markAsUsed(): void {
    this._used = true;
  }

  dismiss(): void {
    this._dismissed = true;
  }

  toProps(): SuggestionProps {
    return {
      id: this._id.toString(),
      sessionId: this._sessionId,
      type: this._type.toString(),
      content: this._content,
      context: this._context,
      confidence: this._confidence,
      timestamp: this._timestamp,
      used: this._used,
      dismissed: this._dismissed,
    };
  }

  static create(
    sessionId: string,
    type: SuggestionTypeValue,
    content: string,
    options?: {
      context?: string;
      confidence?: number;
    },
  ): Suggestion {
    return new Suggestion(
      SuggestionId.create(),
      sessionId,
      SuggestionType.create(type),
      content,
      options?.context ?? null,
      options?.confidence ?? 0.8,
      new Date(),
      false,
      false,
    );
  }

  static fromProps(props: SuggestionProps): Suggestion {
    return new Suggestion(
      SuggestionId.fromString(props.id),
      props.sessionId,
      SuggestionType.create(props.type),
      props.content,
      props.context,
      props.confidence,
      new Date(props.timestamp),
      props.used,
      props.dismissed,
    );
  }
}
