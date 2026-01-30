import { BaseDomainEvent } from '@domain/shared';

export interface SessionPausedPayload {
  sessionId: string;
  pausedAt: string;
}

export class SessionPaused extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'SessionPaused';

  constructor(public readonly payload: SessionPausedPayload) {
    super(SessionPaused.EVENT_TYPE, payload.sessionId);
  }

  get sessionId(): string {
    return this.payload.sessionId;
  }

  get pausedAt(): Date {
    return new Date(this.payload.pausedAt);
  }
}
