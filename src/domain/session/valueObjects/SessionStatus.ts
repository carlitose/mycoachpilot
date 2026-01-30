import { ValueObject } from '@domain/shared';

export type SessionStatusType = 'idle' | 'active' | 'paused' | 'stopped';

const VALID_STATUSES: SessionStatusType[] = ['idle', 'active', 'paused', 'stopped'];

/**
 * Session status value object
 * Represents the lifecycle state of a session
 */
export class SessionStatus extends ValueObject<SessionStatusType> {
  private readonly _value: SessionStatusType;

  private constructor(value: SessionStatusType) {
    super();
    this._value = value;
  }

  protected get value(): SessionStatusType {
    return this._value;
  }

  toString(): SessionStatusType {
    return this._value;
  }

  isIdle(): boolean {
    return this._value === 'idle';
  }

  isActive(): boolean {
    return this._value === 'active';
  }

  isPaused(): boolean {
    return this._value === 'paused';
  }

  isStopped(): boolean {
    return this._value === 'stopped';
  }

  canStart(): boolean {
    return this._value === 'idle';
  }

  canPause(): boolean {
    return this._value === 'active';
  }

  canResume(): boolean {
    return this._value === 'paused';
  }

  canStop(): boolean {
    return this._value === 'active' || this._value === 'paused';
  }

  static create(status: SessionStatusType): SessionStatus {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid session status: ${status}`);
    }
    return new SessionStatus(status);
  }

  static idle(): SessionStatus {
    return new SessionStatus('idle');
  }

  static active(): SessionStatus {
    return new SessionStatus('active');
  }

  static paused(): SessionStatus {
    return new SessionStatus('paused');
  }

  static stopped(): SessionStatus {
    return new SessionStatus('stopped');
  }
}
