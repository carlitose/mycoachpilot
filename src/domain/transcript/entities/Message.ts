import { Entity } from '@domain/shared';

import { MessageId } from '../valueObjects/MessageId';
import { MessageRole, MessageRoleType } from '../valueObjects/MessageRole';

export interface MessageProps {
  id: string;
  role: MessageRoleType;
  content: string;
  speakerId: number | null;
  timestamp: Date;
  isInterim: boolean;
}

/**
 * Message entity
 * Represents a single message in the transcript
 */
export class Message extends Entity<MessageId> {
  private readonly _role: MessageRole;
  private _content: string;
  private readonly _speakerId: number | null;
  private readonly _timestamp: Date;
  private _isInterim: boolean;

  private constructor(
    id: MessageId,
    role: MessageRole,
    content: string,
    speakerId: number | null,
    timestamp: Date,
    isInterim: boolean,
  ) {
    super(id);
    this._role = role;
    this._content = content;
    this._speakerId = speakerId;
    this._timestamp = timestamp;
    this._isInterim = isInterim;
  }

  get role(): MessageRole {
    return this._role;
  }

  get content(): string {
    return this._content;
  }

  get speakerId(): number | null {
    return this._speakerId;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get isInterim(): boolean {
    return this._isInterim;
  }

  finalize(content: string): void {
    this._content = content;
    this._isInterim = false;
  }

  appendContent(text: string): void {
    this._content += text;
  }

  toProps(): MessageProps {
    return {
      id: this._id.toString(),
      role: this._role.toString(),
      content: this._content,
      speakerId: this._speakerId,
      timestamp: this._timestamp,
      isInterim: this._isInterim,
    };
  }

  static create(
    role: MessageRoleType,
    content: string,
    options?: { speakerId?: number; isInterim?: boolean },
  ): Message {
    return new Message(
      MessageId.create(),
      MessageRole.create(role),
      content,
      options?.speakerId ?? null,
      new Date(),
      options?.isInterim ?? false,
    );
  }

  static fromProps(props: MessageProps): Message {
    return new Message(
      MessageId.fromString(props.id),
      MessageRole.create(props.role),
      props.content,
      props.speakerId,
      new Date(props.timestamp),
      props.isInterim,
    );
  }

  static userMessage(content: string, speakerId?: number): Message {
    return Message.create('user', content, speakerId !== undefined ? { speakerId } : undefined);
  }

  static assistantMessage(content: string): Message {
    return Message.create('assistant', content);
  }

  static systemMessage(content: string): Message {
    return Message.create('system', content);
  }

  static logMessage(content: string): Message {
    return Message.create('log', content);
  }

  static transcriptMessage(content: string, speakerId: number, isInterim = false): Message {
    return Message.create('transcript', content, { speakerId, isInterim });
  }
}
