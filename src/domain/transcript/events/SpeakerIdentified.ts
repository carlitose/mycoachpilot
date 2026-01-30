import { BaseDomainEvent } from '@domain/shared';

export interface SpeakerIdentifiedPayload {
  speakerId: number;
  sessionId: string;
  isUser: boolean;
  name: string | null;
}

export class SpeakerIdentified extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'SpeakerIdentified';

  constructor(public readonly payload: SpeakerIdentifiedPayload) {
    super(SpeakerIdentified.EVENT_TYPE, payload.sessionId);
  }

  get speakerId(): number {
    return this.payload.speakerId;
  }

  get sessionId(): string {
    return this.payload.sessionId;
  }

  get isUser(): boolean {
    return this.payload.isUser;
  }

  get name(): string | null {
    return this.payload.name;
  }
}
