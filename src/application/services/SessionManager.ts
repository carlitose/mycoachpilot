/* eslint-disable max-lines */
// SessionManager is a central orchestrator coordinating multiple services
import { Session, SessionModeType, AudioConfigProps } from '@domain/session';
import type { CoachingStyleType } from '@domain/settings';
import { Result, ok, err, SessionError, DomainEvent } from '@domain/shared';
import { Message, TranscriptSegment, Speaker, MessageProps, TranscriptSegmentProps, SpeakerProps } from '@domain/transcript';

import type { EventBusPort, AudioCapturePort, RealtimeConnectionPort, RealtimeConfig, AudioChannelType } from '../ports';

import type { CoachingEngine } from './CoachingEngine';
import { createSuggestionGeneratorFn } from './CoachingIntegration';
import { handleRealtimeEvent, float32ToPCM16 } from './SessionEventHandlers';

export interface SessionManagerDependencies {
  eventBus: EventBusPort;
  audioCapture: AudioCapturePort;
  realtimeConnection: RealtimeConnectionPort;
  coachingEngine?: CoachingEngine;
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
      systemPrompt?: string;
      coachingStyle?: CoachingStyleType;
      templateSystemPrompt?: string;
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
    options: { openaiApiKey?: string; systemPrompt?: string; audioConfig?: Partial<AudioConfigProps> },
  ): Promise<Result<void, Error>> {
    if (!options.openaiApiKey) {
      return err(SessionError.invalidConfiguration('OpenAI API key is required for conversation mode'));
    }

    // Start audio capture based on audioSourceType
    const audioSourceType = (options.audioConfig as { audioSourceType?: string } | undefined)?.audioSourceType ?? 'microphone';
    const sampleRate = 24000; // OpenAI requires 24kHz

    let audioResult: Result<void, Error>;
    if (audioSourceType === 'mixed') {
      audioResult = await this.deps.audioCapture.startMixed({
        sampleRate,
        micEnabled: true,
        tabAudioEnabled: true,
      });
    } else if (audioSourceType === 'system') {
      audioResult = await this.deps.audioCapture.startTabAudio({
        sampleRate,
        micEnabled: false,
        tabAudioEnabled: true,
      });
    } else {
      audioResult = await this.deps.audioCapture.startMicrophone({
        sampleRate,
        micEnabled: true,
      });
    }
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
    options: { openaiApiKey?: string; systemPrompt?: string; audioConfig?: Partial<AudioConfigProps> },
  ): Promise<Result<void, Error>> {
    if (!options.openaiApiKey) {
      return err(SessionError.invalidConfiguration('OpenAI API key is required for transcript mode'));
    }

    // Start audio capture based on audioSourceType
    const audioSourceType = (options.audioConfig as { audioSourceType?: string } | undefined)?.audioSourceType ?? 'microphone';
    const sampleRate = 24000; // OpenAI requires 24kHz

    let audioResult: Result<void, Error>;
    if (audioSourceType === 'mixed') {
      audioResult = await this.deps.audioCapture.startMixed({
        sampleRate,
        micEnabled: true,
        tabAudioEnabled: true,
      });
    } else if (audioSourceType === 'system') {
      audioResult = await this.deps.audioCapture.startTabAudio({
        sampleRate,
        micEnabled: false,
        tabAudioEnabled: true,
      });
    } else {
      audioResult = await this.deps.audioCapture.startMicrophone({
        sampleRate,
        micEnabled: true,
      });
    }
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
    session: Session,
    options: {
      audioConfig?: Partial<AudioConfigProps>;
      openaiApiKey?: string;
      coachingStyle?: CoachingStyleType;
      templateSystemPrompt?: string;
    },
  ): Promise<Result<void, Error>> {
    // Meeting coach now uses OpenAI Realtime for transcription (same as transcript_only)
    // with channel-based speaker identification (mic = You, system = Others)
    if (!options.openaiApiKey) {
      return err(SessionError.invalidConfiguration('OpenAI API key is required for meeting coach mode'));
    }

    // Initialize speakers: "You" (microphone) and "Others" (system audio)
    const youSpeaker = Speaker.create(0);
    youSpeaker.setName('You');
    youSpeaker.markAsUser();
    this._state.speakers.set(0, youSpeaker);

    const othersSpeaker = Speaker.create(1);
    othersSpeaker.setName('Others');
    this._state.speakers.set(1, othersSpeaker);

    // Configure CoachingEngine with userSpeakerId = 0 (You)
    if (this.deps.coachingEngine) {
      const coachingStyle = options.coachingStyle ?? 'diplomatic';
      const templateSystemPrompt = options.templateSystemPrompt ?? 'You are a helpful meeting coach.';

      this.deps.coachingEngine.updateConfig({
        sessionId: session.id.toString(),
        coachingStyle,
        templateSystemPrompt,
        userSpeakerId: 0, // "You" is speaker 0
      });

      // Create and set suggestion generator
      const generator = createSuggestionGeneratorFn(options.openaiApiKey, {
        coachingStyle,
        templateSystemPrompt,
        userSpeakerId: 0,
      });
      this.deps.coachingEngine.setSuggestionGenerator(generator);
    }

    // Track last active channel for speaker identification
    let lastActiveChannel: AudioChannelType | null = null;

    // Determine audio source
    const audioConfig = options.audioConfig as { audioSourceType?: string; tabAudioEnabled?: boolean } | undefined;
    let audioSourceType = audioConfig?.audioSourceType;
    if (!audioSourceType && audioConfig?.tabAudioEnabled) {
      audioSourceType = 'mixed'; // Legacy: tabAudioEnabled implies mixed mode
    }
    audioSourceType = audioSourceType ?? 'microphone';

    const sampleRate = 24000; // OpenAI requires 24kHz

    let audioResult: Result<void, Error>;
    if (audioSourceType === 'mixed') {
      audioResult = await this.deps.audioCapture.startMixed({
        sampleRate,
        micEnabled: true,
        tabAudioEnabled: true,
      });
    } else if (audioSourceType === 'system') {
      audioResult = await this.deps.audioCapture.startTabAudio({
        sampleRate,
        micEnabled: false,
        tabAudioEnabled: true,
      });
    } else {
      audioResult = await this.deps.audioCapture.startMicrophone({
        sampleRate,
        micEnabled: true,
      });
    }

    if (!audioResult.isOk()) return err(audioResult.unwrapErr());

    // Setup audio streaming to OpenAI Realtime with channel tracking
    this._audioUnsubscriber = this.deps.audioCapture.onAudioEvent((event) => {
      if (event.type === 'audio' && this.isActive) {
        // Track the last active channel for speaker identification
        if (event.channel) {
          lastActiveChannel = event.channel;
        }
        const pcm16 = float32ToPCM16(event.data);
        this.deps.realtimeConnection.sendAudio(pcm16);
      }
    });

    // Connect to OpenAI Realtime in transcript-only mode
    const realtimeConfig: RealtimeConfig = {
      apiKey: options.openaiApiKey,
      vadEnabled: true,
      transcriptOnly: true, // No AI responses, just transcription
    };
    const connectResult = await this.deps.realtimeConnection.connect(realtimeConfig);
    if (!connectResult.isOk()) {
      this.deps.audioCapture.stop();
      return err(connectResult.unwrapErr());
    }

    // Subscribe to realtime transcript events
    this._unsubscribers.push(
      this.deps.realtimeConnection.onEvent((event) => {
        if (event.type === 'transcript') {
          // Determine speaker from channel: mic = You (0), system = Others (1)
          const speakerId = lastActiveChannel === 'microphone' ? 0 : 1;

          if (event.isFinal) {
            // Create transcript segment with speaker info
            const segment = TranscriptSegment.create(
              speakerId,
              event.text,
              Date.now(), // startMs (approximate)
              Date.now(), // endMs (approximate)
              {
                confidence: 1.0,
                words: [],
                isFinal: true,
              },
            );
            this._state.segments.push(segment);
            this._state.interimTranscript = null;

            // Update speaker stats
            const speaker = this._state.speakers.get(speakerId);
            if (speaker) {
              const wordCount = event.text.split(/\s+/).length;
              speaker.addSegment(wordCount, 0);
            }

            // Emit SegmentReceived event for CLI output
            this.deps.eventBus.publish({
              eventType: 'SegmentReceived',
              occurredAt: new Date(),
              aggregateId: session.id.toString(),
              payload: {
                speakerId,
                speakerName: speaker?.displayName ?? `Speaker ${String(speakerId)}`,
                text: event.text,
                isFinal: true,
              },
            } as DomainEvent);

            // Trigger coaching on final segments from "Others" (speaker 1)
            if (this.deps.coachingEngine) {
              const context = {
                recentSegments: this._state.segments.slice(-10).map((s) => s.toProps()),
                speakers: Array.from(this._state.speakers.values()).map((s) => s.toProps()),
                currentSpeaker: speakerId,
                conversationTone: 'unknown' as const,
              };
              void this.deps.coachingEngine.processSegment(segment.toProps(), context);
            }
          } else {
            this._state.interimTranscript = event.text;

            // Emit interim segment for CLI output
            const speaker = this._state.speakers.get(speakerId);
            this.deps.eventBus.publish({
              eventType: 'SegmentReceived',
              occurredAt: new Date(),
              aggregateId: session.id.toString(),
              payload: {
                speakerId,
                speakerName: speaker?.displayName ?? `Speaker ${String(speakerId)}`,
                text: event.text,
                isFinal: false,
              },
            } as DomainEvent);
          }
        } else if (event.type === 'error') {
          const errorMessage = Message.systemMessage(`Error: ${event.message}`);
          this._state.messages.push(errorMessage);
        }
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
