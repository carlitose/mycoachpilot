import { AggregateRoot, SessionError } from '@domain/shared';

import { AudioConfig, AudioConfigProps } from '../valueObjects/AudioConfig';
import { SessionId } from '../valueObjects/SessionId';
import { SessionMode, SessionModeType } from '../valueObjects/SessionMode';
import { SessionStatus, SessionStatusType } from '../valueObjects/SessionStatus';

export interface SessionProps {
  id: string;
  mode: SessionModeType;
  status: SessionStatusType;
  templateId: string | null;
  audioConfig: AudioConfigProps;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}

/**
 * Session aggregate root
 * Manages the lifecycle of a coaching session
 */
export class Session extends AggregateRoot<SessionId> {
  private _mode: SessionMode;
  private _status: SessionStatus;
  private _templateId: string | null;
  private _audioConfig: AudioConfig;
  private _startedAt: Date | null;
  private _endedAt: Date | null;
  private readonly _createdAt: Date;

  private constructor(
    id: SessionId,
    mode: SessionMode,
    status: SessionStatus,
    templateId: string | null,
    audioConfig: AudioConfig,
    startedAt: Date | null,
    endedAt: Date | null,
    createdAt: Date,
  ) {
    super(id);
    this._mode = mode;
    this._status = status;
    this._templateId = templateId;
    this._audioConfig = audioConfig;
    this._startedAt = startedAt;
    this._endedAt = endedAt;
    this._createdAt = createdAt;
  }

  get mode(): SessionMode {
    return this._mode;
  }

  get status(): SessionStatus {
    return this._status;
  }

  get templateId(): string | null {
    return this._templateId;
  }

  get audioConfig(): AudioConfig {
    return this._audioConfig;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get endedAt(): Date | null {
    return this._endedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get duration(): number | null {
    if (!this._startedAt) return null;
    const endTime = this._endedAt ?? new Date();
    return endTime.getTime() - this._startedAt.getTime();
  }

  start(): void {
    if (!this._status.canStart()) {
      throw SessionError.sessionAlreadyRunning();
    }
    this._status = SessionStatus.active();
    this._startedAt = new Date();
    this.addDomainEvent('SessionStarted', {
      sessionId: this._id.toString(),
      mode: this._mode.toString(),
      templateId: this._templateId,
      startedAt: this._startedAt.toISOString(),
    });
  }

  pause(): void {
    if (!this._status.canPause()) {
      throw SessionError.invalidConfiguration('Cannot pause session in current state');
    }
    this._status = SessionStatus.paused();
    this.addDomainEvent('SessionPaused', {
      sessionId: this._id.toString(),
      pausedAt: new Date().toISOString(),
    });
  }

  resume(): void {
    if (!this._status.canResume()) {
      throw SessionError.invalidConfiguration('Cannot resume session in current state');
    }
    this._status = SessionStatus.active();
    this.addDomainEvent('SessionResumed', {
      sessionId: this._id.toString(),
      resumedAt: new Date().toISOString(),
    });
  }

  stop(): void {
    if (!this._status.canStop()) {
      throw SessionError.invalidConfiguration('Cannot stop session in current state');
    }
    this._status = SessionStatus.stopped();
    this._endedAt = new Date();
    this.addDomainEvent('SessionStopped', {
      sessionId: this._id.toString(),
      endedAt: this._endedAt.toISOString(),
      duration: this.duration,
    });
  }

  updateAudioConfig(config: Partial<AudioConfigProps>): void {
    if (this._status.isActive()) {
      throw SessionError.invalidConfiguration('Cannot change audio config while session is active');
    }
    this._audioConfig = AudioConfig.create({ ...this._audioConfig.toJSON(), ...config });
  }

  setTemplate(templateId: string | null): void {
    this._templateId = templateId;
  }

  toProps(): SessionProps {
    return {
      id: this._id.toString(),
      mode: this._mode.toString(),
      status: this._status.toString(),
      templateId: this._templateId,
      audioConfig: this._audioConfig.toJSON(),
      startedAt: this._startedAt,
      endedAt: this._endedAt,
      createdAt: this._createdAt,
    };
  }

  static create(mode: SessionModeType, templateId?: string): Session {
    const id = SessionId.create();
    const sessionMode = SessionMode.create(mode);
    const audioConfig = mode === 'meeting_coach'
      ? AudioConfig.forDeepgram()
      : AudioConfig.forOpenAI();

    return new Session(
      id,
      sessionMode,
      SessionStatus.idle(),
      templateId ?? null,
      audioConfig,
      null,
      null,
      new Date(),
    );
  }

  static fromProps(props: SessionProps): Session {
    return new Session(
      SessionId.fromString(props.id),
      SessionMode.create(props.mode),
      SessionStatus.create(props.status),
      props.templateId,
      AudioConfig.create(props.audioConfig),
      props.startedAt ? new Date(props.startedAt) : null,
      props.endedAt ? new Date(props.endedAt) : null,
      new Date(props.createdAt),
    );
  }
}
