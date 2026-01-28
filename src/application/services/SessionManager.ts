import { Session, SessionModeType, AudioConfigProps } from '@domain/session';
import { Result, ok, err, SessionError, DomainEvent } from '@domain/shared';
import { Message, TranscriptSegment, Speaker, MessageProps, TranscriptSegmentProps, SpeakerProps } from '@domain/transcript';

import type { EventBusPort, AudioCapturePort, RealtimeConnectionPort, TranscriptionPort, RealtimeConfig, TranscriptionConfig } from '../ports';

import { handleRealtimeEvent, handleTranscriptionEvent, float32ToPCM16 } from './SessionEventHandlers';

export interface SessionManagerDependencies {
  eventBus: EventBusPort;
  audioCapture: AudioCapturePort;
  realtimeConnection: RealtimeConnectionPort;
  transcription: TranscriptionPort;
}

export interface SessionState {
  session: Session | null;
  messages: Message[];
  segments: TranscriptSegment[];
  speakers: Map<number, Speaker>;
  interimTranscript: string | null;
}

/**
 * SessionManager service
 * Orchestrates session lifecycle, coordinates audio capture and transcription
 */
export class SessionManager {
  private _state: SessionState = {
    session: null,
    messages: [],
    segments: [],
    speakers: new Map(),
    interimTranscript: null,
  };

  private _unsubscribers: Array<() => void> = [];
  private _audioUnsubscriber: (() => void) | null = null;

  constructor(private readonly deps: SessionManagerDependencies) {}

  get state(): SessionState {
    return this._state;
  }

  get currentSession(): Session | null {
    return this._state.session;
  }

  get isActive(): boolean {
    return this._state.session?.status.isActive() ?? false;
  }

  get isPaused(): boolean {
    return this._state.session?.status.isPaused() ?? false;
  }

  async startSession(
    mode: SessionModeType,
    options: {
      templateId?: string;
      audioConfig?: Partial<AudioConfigProps>;
      openaiApiKey?: string;
      deepgramApiKey?: string;
      systemPrompt?: string;
    } = {},
  ): Promise<Result<Session, Error>> {
    if (this._state.session?.status.isActive()) {
      return err(SessionError.sessionAlreadyRunning());
    }

    // Create new session
    const session = Session.create(mode, options.templateId);

    // Update audio config if provided
    if (options.audioConfig) {
      session.updateAudioConfig(options.audioConfig);
    }

    // Reset state
    this._state = {
      session,
      messages: [],
      segments: [],
      speakers: new Map(),
      interimTranscript: null,
    };

    // Setup based on mode
    if (mode === 'meeting_coach') {
      const result = await this.setupMeetingCoachMode(session, options);
      if (!result.isOk()) return err(result.unwrapErr());
    } else if (mode === 'conversation') {
      const result = await this.setupConversationMode(session, options);
      if (!result.isOk()) return err(result.unwrapErr());
    } else {
      // transcript_only mode - just audio capture + realtime transcription
      const result = await this.setupTranscriptOnlyMode(session, options);
      if (!result.isOk()) return err(result.unwrapErr());
    }

    // Start session
    session.start();

    // Publish domain events
    const events = session.pullDomainEvents();
    events.forEach((event) => {
      this.deps.eventBus.publish(event as unknown as DomainEvent);
    });

    return ok(session);
  }

  private async setupConversationMode(
    _session: Session,
    options: { openaiApiKey?: string; systemPrompt?: string },
  ): Promise<Result<void, Error>> {
    if (!options.openaiApiKey) {
      return err(SessionError.invalidConfiguration('OpenAI API key is required for conversation mode'));
    }

    // Start audio capture
    const audioResult = await this.deps.audioCapture.startMicrophone({
      sampleRate: 24000, // OpenAI requires 24kHz
      micEnabled: true,
    });
    if (!audioResult.isOk()) return err(audioResult.unwrapErr());

    // Setup audio streaming to realtime API
    this._audioUnsubscriber = this.deps.audioCapture.onAudioEvent((event) => {
      if (event.type === 'audio' && this.isActive) {
        const pcm16 = float32ToPCM16(event.data);
        this.deps.realtimeConnection.sendAudio(pcm16);
      }
    });

    // Connect to OpenAI Realtime
    const realtimeConfig: RealtimeConfig = {
      apiKey: options.openaiApiKey,
      ...(options.systemPrompt ? { systemPrompt: options.systemPrompt } : {}),
      vadEnabled: true,
    };
    const connectResult = await this.deps.realtimeConnection.connect(realtimeConfig);
    if (!connectResult.isOk()) {
      this.deps.audioCapture.stop();
      return err(connectResult.unwrapErr());
    }

    // Subscribe to realtime events
    this._unsubscribers.push(
      this.deps.realtimeConnection.onEvent((event) => {
        handleRealtimeEvent(event, this._state);
      }),
    );

    return ok(undefined);
  }

  private async setupTranscriptOnlyMode(
    _session: Session,
    options: { openaiApiKey?: string; systemPrompt?: string },
  ): Promise<Result<void, Error>> {
    if (!options.openaiApiKey) {
      return err(SessionError.invalidConfiguration('OpenAI API key is required for transcript mode'));
    }

    // Start audio capture
    const audioResult = await this.deps.audioCapture.startMicrophone({
      sampleRate: 24000,
      micEnabled: true,
    });
    if (!audioResult.isOk()) return err(audioResult.unwrapErr());

    // Setup audio streaming
    this._audioUnsubscriber = this.deps.audioCapture.onAudioEvent((event) => {
      if (event.type === 'audio' && this.isActive) {
        const pcm16 = float32ToPCM16(event.data);
        this.deps.realtimeConnection.sendAudio(pcm16);
      }
    });

    // Connect to OpenAI Realtime in transcript-only mode
    const realtimeConfig: RealtimeConfig = {
      apiKey: options.openaiApiKey,
      ...(options.systemPrompt ? { systemPrompt: options.systemPrompt } : {}),
      vadEnabled: true,
      transcriptOnly: true,
    };
    const connectResult = await this.deps.realtimeConnection.connect(realtimeConfig);
    if (!connectResult.isOk()) {
      this.deps.audioCapture.stop();
      return err(connectResult.unwrapErr());
    }

    // Subscribe to realtime events
    this._unsubscribers.push(
      this.deps.realtimeConnection.onEvent((event) => {
        handleRealtimeEvent(event, this._state);
      }),
    );

    return ok(undefined);
  }

  private async setupMeetingCoachMode(
    _session: Session,
    options: { deepgramApiKey?: string; audioConfig?: Partial<AudioConfigProps> },
  ): Promise<Result<void, Error>> {
    if (!options.deepgramApiKey) {
      return err(SessionError.invalidConfiguration('Deepgram API key is required for meeting coach mode'));
    }

    // Start audio capture (mic + tab)
    const audioResult = options.audioConfig?.tabAudioEnabled
      ? await this.deps.audioCapture.startMixed({
          sampleRate: 16000, // Deepgram prefers 16kHz
          micEnabled: true,
          tabAudioEnabled: true,
        })
      : await this.deps.audioCapture.startMicrophone({
          sampleRate: 16000,
          micEnabled: true,
        });

    if (!audioResult.isOk()) return err(audioResult.unwrapErr());

    // Setup audio streaming to Deepgram
    this._audioUnsubscriber = this.deps.audioCapture.onAudioEvent((event) => {
      if (event.type === 'audio' && this.isActive) {
        const pcm16 = float32ToPCM16(event.data);
        this.deps.transcription.sendAudio(pcm16);
      }
    });

    // Connect to Deepgram
    const transcriptionConfig: TranscriptionConfig = {
      apiKey: options.deepgramApiKey,
      diarize: true,
      punctuate: true,
      interimResults: true,
      sampleRate: 16000,
    };
    const connectResult = await this.deps.transcription.connect(transcriptionConfig);
    if (!connectResult.isOk()) {
      this.deps.audioCapture.stop();
      return err(connectResult.unwrapErr());
    }

    // Subscribe to transcription events
    this._unsubscribers.push(
      this.deps.transcription.onEvent((event) => {
        handleTranscriptionEvent(event, this._state);
      }),
    );

    return ok(undefined);
  }

  pauseSession(): Result<void, Error> {
    if (!this._state.session) {
      return err(SessionError.sessionNotFound());
    }

    try {
      this._state.session.pause();
      this.deps.audioCapture.pause();

      const events = this._state.session.pullDomainEvents();
      events.forEach((event) => {
        this.deps.eventBus.publish(event as unknown as DomainEvent);
      });

      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  resumeSession(): Result<void, Error> {
    if (!this._state.session) {
      return err(SessionError.sessionNotFound());
    }

    try {
      this._state.session.resume();
      this.deps.audioCapture.resume();

      const events = this._state.session.pullDomainEvents();
      events.forEach((event) => {
        this.deps.eventBus.publish(event as unknown as DomainEvent);
      });

      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  stopSession(): Result<void, Error> {
    if (!this._state.session) {
      return err(SessionError.sessionNotFound());
    }

    try {
      this._state.session.stop();

      // Cleanup
      this.deps.audioCapture.stop();
      this.deps.realtimeConnection.disconnect();
      this.deps.transcription.disconnect();

      // Unsubscribe from events
      this._unsubscribers.forEach((unsub) => { unsub(); });
      this._unsubscribers = [];
      if (this._audioUnsubscriber) {
        this._audioUnsubscriber();
        this._audioUnsubscriber = null;
      }

      const events = this._state.session.pullDomainEvents();
      events.forEach((event) => {
        this.deps.eventBus.publish(event as unknown as DomainEvent);
      });

      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async sendTextMessage(text: string): Promise<Result<void, Error>> {
    if (!this._state.session?.status.isActive()) {
      return err(SessionError.invalidConfiguration('Session is not active'));
    }

    if (this._state.session.mode.isConversation()) {
      // Add user message
      const userMessage = Message.userMessage(text);
      this._state.messages.push(userMessage);

      // Send to OpenAI
      return this.deps.realtimeConnection.sendText(text);
    }

    return err(SessionError.invalidConfiguration('Text messages are only supported in conversation mode'));
  }

  identifySpeakerAsUser(speakerId: number | undefined): void {
    if (speakerId === undefined) return;
    const speaker = this._state.speakers.get(speakerId);
    if (speaker) {
      speaker.markAsUser();
    }
  }

  getMessages(): MessageProps[] {
    return this._state.messages.map((m) => m.toProps());
  }

  getSegments(): TranscriptSegmentProps[] {
    return this._state.segments.map((s) => s.toProps());
  }

  getSpeakers(): SpeakerProps[] {
    return Array.from(this._state.speakers.values()).map((s) => s.toProps());
  }

  dispose(): void {
    this.stopSession();
  }
}
