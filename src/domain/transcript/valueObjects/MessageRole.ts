import { ValueObject } from '@domain/shared';

export type MessageRoleType = 'user' | 'assistant' | 'system' | 'log' | 'transcript';

const VALID_ROLES: MessageRoleType[] = ['user', 'assistant', 'system', 'log', 'transcript'];

/**
 * Message role value object
 * - user: User's spoken or typed message
 * - assistant: AI assistant response
 * - system: System message or notification
 * - log: Log/debug message
 * - transcript: Pure transcription (meeting coach mode)
 */
export class MessageRole extends ValueObject<MessageRoleType> {
  private readonly _value: MessageRoleType;

  private constructor(value: MessageRoleType) {
    super();
    this._value = value;
  }

  protected get value(): MessageRoleType {
    return this._value;
  }

  toString(): MessageRoleType {
    return this._value;
  }

  isUser(): boolean {
    return this._value === 'user';
  }

  isAssistant(): boolean {
    return this._value === 'assistant';
  }

  isSystem(): boolean {
    return this._value === 'system';
  }

  isLog(): boolean {
    return this._value === 'log';
  }

  isTranscript(): boolean {
    return this._value === 'transcript';
  }

  static create(role: MessageRoleType): MessageRole {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid message role: ${role}`);
    }
    return new MessageRole(role);
  }

  static user(): MessageRole {
    return new MessageRole('user');
  }

  static assistant(): MessageRole {
    return new MessageRole('assistant');
  }

  static system(): MessageRole {
    return new MessageRole('system');
  }

  static log(): MessageRole {
    return new MessageRole('log');
  }

  static transcript(): MessageRole {
    return new MessageRole('transcript');
  }
}
