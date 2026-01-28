import { BaseDomainEvent } from '@domain/shared';

import type { SessionModeType } from '../valueObjects/SessionMode';

export interface SessionStartedPayload {
  sessionId: string;
  mode: SessionModeType;
  templateId: string | null;
  startedAt: string;
}

export class SessionStarted extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'SessionStarted';

  constructor(public readonly payload: SessionStartedPayload) {
    super(SessionStarted.EVENT_TYPE, payload.sessionId);
  }

  get sessionId(): string {
    return this.payload.sessionId;
  }

  get mode(): SessionModeType {
    return this.payload.mode;
  }

  get templateId(): string | null {
    return this.payload.templateId;
  }

  get startedAt(): Date {
    return new Date(this.payload.startedAt);
  }
}
