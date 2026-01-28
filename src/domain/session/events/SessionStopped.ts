import { BaseDomainEvent } from '@domain/shared';

export interface SessionStoppedPayload {
  sessionId: string;
  endedAt: string;
  duration: number | null;
}

export class SessionStopped extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'SessionStopped';

  constructor(public readonly payload: SessionStoppedPayload) {
    super(SessionStopped.EVENT_TYPE, payload.sessionId);
  }

  get sessionId(): string {
    return this.payload.sessionId;
  }

  get endedAt(): Date {
    return new Date(this.payload.endedAt);
  }

  get duration(): number | null {
    return this.payload.duration;
  }
}
