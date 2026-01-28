import { BaseDomainEvent } from '@domain/shared';

import type { MessageRoleType } from '../valueObjects/MessageRole';

export interface MessageReceivedPayload {
  messageId: string;
  sessionId: string;
  role: MessageRoleType;
  content: string;
  speakerId: number | null;
  isInterim: boolean;
}

export class MessageReceived extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'MessageReceived';

  constructor(public readonly payload: MessageReceivedPayload) {
    super(MessageReceived.EVENT_TYPE, payload.sessionId);
  }

  get messageId(): string {
    return this.payload.messageId;
  }

  get sessionId(): string {
    return this.payload.sessionId;
  }

  get role(): MessageRoleType {
    return this.payload.role;
  }

  get content(): string {
    return this.payload.content;
  }
}
