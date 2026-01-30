**MyCoachPilot Free**

Technical Design Document

Version 1.0

January 2026

*Architecture: Clean Architecture + Hexagonal + DDD*

**Table of Contents**

**1. Executive Summary**

MyCoachPilot Free is a real-time AI-powered meeting coach application
that provides live transcription, speaker identification, and contextual
coaching suggestions during meetings or conversations.

This document defines the technical architecture based on Clean
Architecture, Hexagonal Architecture (Ports & Adapters), and
Domain-Driven Design (DDD) principles. The architecture prioritizes
maintainability over performance and simplicity, enabling future
migrations (e.g., to Supabase) without touching business logic.

**1.1 Key Architectural Decisions**

|                  |                           |                                           |
|------------------|---------------------------|-------------------------------------------|
| **Aspect**       | **Decision**              | **Rationale**                             |
| Architecture     | Clean + Hexagonal + DDD   | Maximum maintainability, clear boundaries |
| State Management | Redux Toolkit             | Structured patterns, DevTools, ecosystem  |
| Side Effects     | Domain Service + EventBus | Pure domain logic, no framework coupling  |
| Storage          | Repository Pattern        | Easy migration from localStorage to cloud |
| Error Handling   | Result Type               | Explicit, type-safe error management      |
| Validation       | Zod schemas               | Runtime validation + TypeScript types     |
| WebSocket        | Event-Driven Ports        | Natural fit for streaming data            |
| TypeScript       | Strict mode               | Maximum type safety                       |

**2. Domain Model**

Following DDD principles, the application is divided into four Bounded
Contexts, each with clear responsibilities and boundaries.

**2.1 Bounded Contexts Overview**

|             |                                                |                      |
|-------------|------------------------------------------------|----------------------|
| **Context** | **Responsibility**                             | **Core Entities**    |
| Session     | Lifecycle of a coaching session (real-time)    | Session              |
| Transcript  | Real-time transcription and speaker management | Transcript, Speaker  |
| Coaching    | AI-powered suggestion generation (reactive)    | Suggestion, Template |
| Settings    | User configuration and API keys                | UserConfig           |

**2.2 Context Relationships**

The contexts interact through Domain Events following a unidirectional
flow:

> Session Context ──emits──▶ SessionStarted, SessionStopped
>
> │
>
> ▼ triggers
>
> Transcript Context ──emits──▶ SegmentReceived, SpeakerAssigned
>
> │
>
> ▼ triggers
>
> Coaching Context ──emits──▶ SuggestionGenerated
>
> Settings Context ──provides config to all contexts──▶

**2.3 Session Context**

**2.3.1 Entities**

Session (Aggregate Root): Represents a single coaching session with its
lifecycle state.

> Session {
>
> id: SessionId // Value Object
>
> mode: SessionMode // 'meeting_coach' \| 'practice'
>
> status: SessionStatus // 'idle' \| 'active' \| 'paused' \| 'stopped'
>
> audioConfig: AudioConfig
>
> startedAt?: Timestamp
>
> stoppedAt?: Timestamp
>
> }

**2.3.2 Value Objects (Zod Schemas)**

> const SessionIdSchema = z.string().uuid();
>
> type SessionId = z.infer\<typeof SessionIdSchema\>;
>
> const SessionModeSchema = z.enum(\['meeting_coach', 'practice'\]);
>
> type SessionMode = z.infer\<typeof SessionModeSchema\>;
>
> const SessionStatusSchema = z.enum(\['idle', 'active', 'paused',
> 'stopped'\]);
>
> type SessionStatus = z.infer\<typeof SessionStatusSchema\>;
>
> const AudioConfigSchema = z.object({
>
> microphoneEnabled: z.boolean(),
>
> tabAudioEnabled: z.boolean(),
>
> sampleRate: z.number().default(16000),
>
> });

**2.3.3 Domain Events**

> SessionStarted { sessionId, mode, audioConfig, timestamp }
>
> SessionPaused { sessionId, timestamp }
>
> SessionResumed { sessionId, timestamp }
>
> SessionStopped { sessionId, timestamp, duration }
>
> SessionError { sessionId, error, timestamp }

**2.4 Transcript Context**

**2.4.1 Entities**

Transcript (Aggregate Root): Collection of segments for a session.

Speaker (Entity): Identified speaker in the conversation.

> Transcript {
>
> sessionId: SessionId
>
> segments: TranscriptSegment\[\]
>
> speakers: Map\<SpeakerId, Speaker\>
>
> }
>
> Speaker {
>
> id: SpeakerId
>
> label: string // 'Speaker 1', 'Me', 'John'
>
> color: string // For UI differentiation
>
> }

**2.4.2 Value Objects**

> const TranscriptSegmentSchema = z.object({
>
> id: z.string().uuid(),
>
> text: z.string().min(1),
>
> speakerId: SpeakerIdSchema,
>
> timestamp: TimestampSchema,
>
> isFinal: z.boolean(),
>
> confidence: z.number().min(0).max(1).optional(),
>
> });
>
> const SpeakerIdSchema = z.string();
>
> const TimestampSchema = z.number().nonnegative();

**2.4.3 Domain Events**

> SegmentReceived { sessionId, segment }
>
> SegmentFinalized { sessionId, segmentId }
>
> SpeakerIdentified { sessionId, speakerId, label }
>
> SpeakerReassigned { sessionId, segmentId, oldSpeakerId, newSpeakerId }
>
> TranscriptEdited { sessionId, segmentId, oldText, newText }

**2.5 Coaching Context**

**2.5.1 Entities**

Suggestion (Aggregate Root): AI-generated coaching suggestion.

Template (Entity): Predefined coaching template/prompt.

> Suggestion {
>
> id: SuggestionId
>
> sessionId: SessionId
>
> type: SuggestionType
>
> content: string
>
> priority: Priority
>
> status: SuggestionStatus // 'pending' \| 'shown' \| 'applied' \|
> 'dismissed'
>
> context: CoachingContext
>
> createdAt: Timestamp
>
> }
>
> Template {
>
> id: TemplateId
>
> name: string
>
> description: string
>
> systemPrompt: string
>
> triggerConditions: TriggerCondition\[\]
>
> }

**2.5.2 Value Objects**

> const SuggestionTypeSchema = z.enum(\[
>
> 'question', // Question to ask
>
> 'clarification', // Ask for clarification
>
> 'summary', // Summarize current topic
>
> 'redirect', // Redirect conversation
>
> 'insight', // General insight
>
> \]);
>
> const PrioritySchema = z.enum(\['low', 'medium', 'high', 'urgent'\]);
>
> const CoachingContextSchema = z.object({
>
> recentTranscript: z.string(),
>
> conversationSummary: z.string().optional(),
>
> activeTemplate: TemplateIdSchema.optional(),
>
> });

**2.5.3 Domain Events**

> SuggestionGenerated { sessionId, suggestion }
>
> SuggestionShown { sessionId, suggestionId }
>
> SuggestionApplied { sessionId, suggestionId }
>
> SuggestionDismissed { sessionId, suggestionId, reason? }

**2.6 Settings Context**

**2.6.1 Entities**

> UserConfig {
>
> apiKeys: ApiKeys
>
> preferences: UserPreferences
>
> activeTemplateId?: TemplateId
>
> }
>
> const ApiKeysSchema = z.object({
>
> openai: z.string().optional(),
>
> deepgram: z.string().optional(),
>
> });
>
> const UserPreferencesSchema = z.object({
>
> theme: z.enum(\['light', 'dark', 'system'\]).default('system'),
>
> language: z.string().default('en'),
>
> suggestionFrequency: z.enum(\['low', 'medium',
> 'high'\]).default('medium'),
>
> autoStartTranscription: z.boolean().default(true),
>
> });

**3. Architecture Layers**

The application follows a strict layered architecture where dependencies
flow inward: Presentation → Application → Domain ← Infrastructure.

**3.1 Layer Overview**

> ┌─────────────────────────────────────────────────────────────┐
>
> │ │
>
> │ PRESENTATION React Components, Hooks │
>
> │ (UI only, no business logic) │
>
> │ │
>
> ├─────────────────────────────────────────────────────────────┤
>
> │ │
>
> │ APPLICATION Use Cases, Ports (interfaces), │
>
> │ Domain Services, EventBus │
>
> │ │
>
> ├─────────────────────────────────────────────────────────────┤
>
> │ │
>
> │ DOMAIN Entities, Value Objects, │
>
> │ Domain Events, Business Rules │
>
> │ │
>
> ├─────────────────────────────────────────────────────────────┤
>
> │ │
>
> │ INFRASTRUCTURE Redux Store, WebSocket Adapters, │
>
> │ LocalStorage, API Clients │
>
> │ │
>
> └─────────────────────────────────────────────────────────────┘

**3.2 Dependency Rule**

The fundamental rule: source code dependencies can only point inward.
Nothing in an inner circle can know anything about something in an outer
circle.

|                |                     |                              |
|----------------|---------------------|------------------------------|
| **Layer**      | **Can Depend On**   | **Cannot Depend On**         |
| Presentation   | Application, Domain | Infrastructure (directly)    |
| Application    | Domain              | Presentation, Infrastructure |
| Domain         | Nothing (pure)      | All other layers             |
| Infrastructure | Application, Domain | Presentation                 |

**4. Project Structure**

The project follows a feature-based organization within each
architectural layer.

> src/
>
> ├── domain/ \# Pure business logic
>
> │ ├── session/
>
> │ │ ├── entities/
>
> │ │ │ └── Session.ts
>
> │ │ ├── valueObjects/
>
> │ │ │ ├── SessionId.ts
>
> │ │ │ ├── SessionMode.ts
>
> │ │ │ ├── SessionStatus.ts
>
> │ │ │ └── AudioConfig.ts
>
> │ │ ├── events/
>
> │ │ │ ├── SessionStarted.ts
>
> │ │ │ ├── SessionStopped.ts
>
> │ │ │ └── index.ts
>
> │ │ └── index.ts
>
> │ │
>
> │ ├── transcript/
>
> │ │ ├── entities/
>
> │ │ │ ├── Transcript.ts
>
> │ │ │ └── Speaker.ts
>
> │ │ ├── valueObjects/
>
> │ │ │ ├── TranscriptSegment.ts
>
> │ │ │ ├── SpeakerId.ts
>
> │ │ │ └── Timestamp.ts
>
> │ │ ├── events/
>
> │ │ │ └── index.ts
>
> │ │ └── index.ts
>
> │ │
>
> │ ├── coaching/
>
> │ │ ├── entities/
>
> │ │ │ ├── Suggestion.ts
>
> │ │ │ └── Template.ts
>
> │ │ ├── valueObjects/
>
> │ │ │ └── index.ts
>
> │ │ ├── events/
>
> │ │ │ └── index.ts
>
> │ │ └── index.ts
>
> │ │
>
> │ ├── settings/
>
> │ │ ├── entities/
>
> │ │ │ └── UserConfig.ts
>
> │ │ ├── valueObjects/
>
> │ │ │ ├── ApiKeys.ts
>
> │ │ │ └── UserPreferences.ts
>
> │ │ └── index.ts
>
> │ │
>
> │ ├── shared/
>
> │ │ ├── Result.ts \# Result type implementation
>
> │ │ ├── DomainEvent.ts \# Base event interface
>
> │ │ └── Entity.ts \# Base entity class
>
> │ │
>
> │ └── index.ts
>
> ├── application/ \# Use cases and ports
>
> │ ├── ports/
>
> │ │ ├── input/ \# Driven ports (UI calls these)
>
> │ │ │ ├── SessionServicePort.ts
>
> │ │ │ ├── TranscriptServicePort.ts
>
> │ │ │ └── CoachingServicePort.ts
>
> │ │ │
>
> │ │ └── output/ \# Driving ports (domain calls out)
>
> │ │ ├── AudioCapturePort.ts
>
> │ │ ├── TranscriptionPort.ts
>
> │ │ ├── RealtimeConnectionPort.ts
>
> │ │ ├── SuggestionGeneratorPort.ts
>
> │ │ ├── SessionRepositoryPort.ts
>
> │ │ ├── ConfigRepositoryPort.ts
>
> │ │ └── EventBusPort.ts
>
> │ │
>
> │ ├── services/ \# Domain Services
>
> │ │ ├── SessionManager.ts
>
> │ │ ├── TranscriptionManager.ts
>
> │ │ └── CoachingEngine.ts
>
> │ │
>
> │ ├── useCases/
>
> │ │ ├── session/
>
> │ │ │ ├── StartSessionUseCase.ts
>
> │ │ │ ├── StopSessionUseCase.ts
>
> │ │ │ ├── PauseSessionUseCase.ts
>
> │ │ │ └── ResumeSessionUseCase.ts
>
> │ │ │
>
> │ │ ├── transcript/
>
> │ │ │ ├── ExportTranscriptUseCase.ts
>
> │ │ │ ├── AssignSpeakerUseCase.ts
>
> │ │ │ └── EditSegmentUseCase.ts
>
> │ │ │
>
> │ │ ├── coaching/
>
> │ │ │ ├── ApplySuggestionUseCase.ts
>
> │ │ │ ├── DismissSuggestionUseCase.ts
>
> │ │ │ └── RegenerateSuggestionUseCase.ts
>
> │ │ │
>
> │ │ └── settings/
>
> │ │ ├── SaveApiKeysUseCase.ts
>
> │ │ └── UpdatePreferencesUseCase.ts
>
> │ │
>
> │ └── index.ts
>
> ├── infrastructure/ \# External implementations
>
> │ ├── adapters/
>
> │ │ ├── audio/
>
> │ │ │ ├── MicrophoneAdapter.ts
>
> │ │ │ └── TabAudioAdapter.ts
>
> │ │ │
>
> │ │ ├── realtime/
>
> │ │ │ ├── OpenAIRealtimeAdapter.ts
>
> │ │ │ └── DeepgramAdapter.ts
>
> │ │ │
>
> │ │ ├── ai/
>
> │ │ │ └── OpenAISuggestionAdapter.ts
>
> │ │ │
>
> │ │ └── persistence/
>
> │ │ ├── LocalStorageSessionRepository.ts
>
> │ │ └── LocalStorageConfigRepository.ts
>
> │ │
>
> │ ├── state/ \# Redux
>
> │ │ ├── store.ts
>
> │ │ ├── ReduxEventBusAdapter.ts
>
> │ │ ├── slices/
>
> │ │ │ ├── sessionSlice.ts
>
> │ │ │ ├── transcriptSlice.ts
>
> │ │ │ ├── coachingSlice.ts
>
> │ │ │ └── settingsSlice.ts
>
> │ │ └── selectors/
>
> │ │ ├── sessionSelectors.ts
>
> │ │ ├── transcriptSelectors.ts
>
> │ │ └── coachingSelectors.ts
>
> │ │
>
> │ ├── di/ \# Dependency Injection
>
> │ │ ├── container.ts
>
> │ │ └── providers.tsx
>
> │ │
>
> │ └── index.ts
>
> ├── presentation/ \# React UI
>
> │ ├── components/
>
> │ │ ├── common/
>
> │ │ │ ├── Button.tsx
>
> │ │ │ ├── Card.tsx
>
> │ │ │ └── Toast.tsx
>
> │ │ │
>
> │ │ ├── session/
>
> │ │ │ ├── SessionControls.tsx
>
> │ │ │ ├── SessionStatus.tsx
>
> │ │ │ └── AudioVisualizer.tsx
>
> │ │ │
>
> │ │ ├── transcript/
>
> │ │ │ ├── TranscriptView.tsx
>
> │ │ │ ├── SegmentItem.tsx
>
> │ │ │ └── SpeakerBadge.tsx
>
> │ │ │
>
> │ │ ├── coaching/
>
> │ │ │ ├── SuggestionCard.tsx
>
> │ │ │ ├── SuggestionList.tsx
>
> │ │ │ └── TemplateSelector.tsx
>
> │ │ │
>
> │ │ └── settings/
>
> │ │ ├── ApiKeyInput.tsx
>
> │ │ ├── PreferencesForm.tsx
>
> │ │ └── SettingsPanel.tsx
>
> │ │
>
> │ ├── hooks/
>
> │ │ ├── useSession.ts
>
> │ │ ├── useTranscript.ts
>
> │ │ ├── useCoaching.ts
>
> │ │ ├── useSettings.ts
>
> │ │ └── useServices.ts \# Access to domain services
>
> │ │
>
> │ ├── pages/
>
> │ │ ├── HomePage.tsx
>
> │ │ ├── SessionPage.tsx
>
> │ │ ├── HistoryPage.tsx
>
> │ │ └── SettingsPage.tsx
>
> │ │
>
> │ ├── layouts/
>
> │ │ └── MainLayout.tsx
>
> │ │
>
> │ └── App.tsx
>
> │
>
> ├── main.tsx \# Entry point
>
> └── vite-env.d.ts

**5. Ports & Adapters (Hexagonal Architecture)**

Ports define the interfaces that the application uses to communicate
with the outside world. Adapters implement these interfaces for specific
technologies.

**5.1 Port Types**

|                  |               |                                     |                    |
|------------------|---------------|-------------------------------------|--------------------|
| **Type**         | **Direction** | **Purpose**                         | **Example**        |
| Input (Driven)   | Outside → In  | Services that UI calls              | SessionServicePort |
| Output (Driving) | Inside → Out  | Services domain needs from external | TranscriptionPort  |

**5.2 Output Ports (Driving)**

**5.2.1 EventBusPort**

Central event bus for publishing domain events. Infrastructure
implements it to dispatch Redux actions.

> interface EventBusPort {
>
> publish\<T extends DomainEvent\>(event: T): void;
>
> subscribe\<T extends DomainEvent\>(
>
> eventType: string,
>
> handler: (event: T) =\> void
>
> ): () =\> void; // Returns unsubscribe function
>
> }

**5.2.2 TranscriptionPort**

Event-driven port for real-time transcription services.

> interface TranscriptionPort {
>
> connect(config: TranscriptionConfig): Promise\<Result\<void,
> ConnectionError\>\>;
>
> disconnect(): Promise\<Result\<void, Error\>\>;
>
> sendAudio(chunk: AudioChunk): void;
>
> // Event handlers
>
> onTranscript(handler: (segment: TranscriptSegment) =\> void): void;
>
> onSpeakerChange(handler: (speakerId: SpeakerId) =\> void): void;
>
> onError(handler: (error: TranscriptionError) =\> void): void;
>
> onStateChange(handler: (state: ConnectionState) =\> void): void;
>
> }
>
> type TranscriptionConfig = {
>
> apiKey: string;
>
> language: string;
>
> model: string;
>
> sampleRate: number;
>
> };
>
> type ConnectionState = 'disconnected' \| 'connecting' \| 'connected'
> \| 'error';

**5.2.3 RealtimeConnectionPort**

Generic WebSocket connection for OpenAI Realtime API.

> interface RealtimeConnectionPort {
>
> connect(config: RealtimeConfig): Promise\<Result\<void,
> ConnectionError\>\>;
>
> disconnect(): Promise\<Result\<void, Error\>\>;
>
> send(message: OutboundMessage): Result\<void, Error\>;
>
> onMessage(handler: (message: InboundMessage) =\> void): void;
>
> onError(handler: (error: Error) =\> void): void;
>
> onStateChange(handler: (state: ConnectionState) =\> void): void;
>
> }

**5.2.4 AudioCapturePort**

Abstracts audio capture from different sources.

> interface AudioCapturePort {
>
> start(config: AudioConfig): Promise\<Result\<AudioStream,
> CaptureError\>\>;
>
> stop(): Promise\<Result\<void, Error\>\>;
>
> pause(): void;
>
> resume(): void;
>
> onAudioData(handler: (chunk: AudioChunk) =\> void): void;
>
> onError(handler: (error: CaptureError) =\> void): void;
>
> }
>
> type AudioStream = {
>
> sampleRate: number;
>
> channelCount: number;
>
> source: 'microphone' \| 'tab' \| 'both';
>
> };

**5.2.5 SuggestionGeneratorPort**

> interface SuggestionGeneratorPort {
>
> generate(
>
> context: CoachingContext,
>
> template: Template
>
> ): Promise\<Result\<Suggestion, GenerationError\>\>;
>
> // Streaming generation
>
> generateStream(
>
> context: CoachingContext,
>
> template: Template
>
> ): AsyncIterable\<Result\<SuggestionChunk, GenerationError\>\>;
>
> }

**5.2.6 Repository Ports**

> interface SessionRepositoryPort {
>
> save(session: Session): Promise\<Result\<void, PersistenceError\>\>;
>
> findById(id: SessionId): Promise\<Result\<Session \| null,
> PersistenceError\>\>;
>
> findAll(): Promise\<Result\<Session\[\], PersistenceError\>\>;
>
> delete(id: SessionId): Promise\<Result\<void, PersistenceError\>\>;
>
> }
>
> interface ConfigRepositoryPort {
>
> save(config: UserConfig): Promise\<Result\<void, PersistenceError\>\>;
>
> load(): Promise\<Result\<UserConfig \| null, PersistenceError\>\>;
>
> }

**6. Domain Services**

Domain Services orchestrate complex operations that span multiple
entities and coordinate with external systems through ports.

**6.1 SessionManager**

Orchestrates the entire session lifecycle, coordinating audio capture,
transcription, and coaching.

> class SessionManager implements SessionServicePort {
>
> constructor(
>
> private audioCapture: AudioCapturePort,
>
> private transcription: TranscriptionPort,
>
> private sessionRepo: SessionRepositoryPort,
>
> private eventBus: EventBusPort
>
> ) {}
>
> async startSession(
>
> config: SessionConfig
>
> ): Promise\<Result\<SessionId, SessionError\>\> {
>
> // 1. Create session entity
>
> const sessionResult = Session.create(config);
>
> if (sessionResult.isErr()) {
>
> return Result.err(sessionResult.error);
>
> }
>
> const session = sessionResult.value;
>
> // 2. Setup audio capture
>
> const audioResult = await this.audioCapture.start(config.audio);
>
> if (audioResult.isErr()) {
>
> return Result.err(new SessionError('AudioCaptureFailed',
> audioResult.error));
>
> }
>
> // 3. Connect transcription
>
> const transcriptionResult = await this.transcription.connect({
>
> apiKey: config.apiKeys.deepgram,
>
> language: config.language,
>
> // ...
>
> });
>
> if (transcriptionResult.isErr()) {
>
> await this.audioCapture.stop();
>
> return Result.err(
>
> new SessionError('TranscriptionFailed', transcriptionResult.error)
>
> );
>
> }
>
> // 4. Wire up audio -\> transcription
>
> this.audioCapture.onAudioData(chunk =\> {
>
> this.transcription.sendAudio(chunk);
>
> });
>
> // 5. Wire up transcription -\> events
>
> this.transcription.onTranscript(segment =\> {
>
> this.eventBus.publish(new SegmentReceived(session.id, segment));
>
> });
>
> // 6. Save and publish
>
> await this.sessionRepo.save(session);
>
> this.eventBus.publish(new SessionStarted(session.id, config));
>
> return Result.ok(session.id);
>
> }
>
> async stopSession(): Promise\<Result\<void, SessionError\>\> {
>
> await this.transcription.disconnect();
>
> await this.audioCapture.stop();
>
> this.eventBus.publish(new SessionStopped(this.currentSessionId));
>
> return Result.ok();
>
> }
>
> }

**6.2 CoachingEngine**

Reacts to transcript events and generates contextual suggestions.

> class CoachingEngine {
>
> private recentContext: TranscriptSegment\[\] = \[\];
>
> constructor(
>
> private suggestionGenerator: SuggestionGeneratorPort,
>
> private eventBus: EventBusPort
>
> ) {
>
> // Subscribe to transcript events
>
> this.eventBus.subscribe('SegmentReceived', this.onSegment.bind(this));
>
> }
>
> private async onSegment(event: SegmentReceived): Promise\<void\> {
>
> // 1. Update context window
>
> this.recentContext.push(event.segment);
>
> if (this.recentContext.length \> 50) {
>
> this.recentContext.shift();
>
> }
>
> // 2. Check if we should generate (debounce, conditions, etc.)
>
> if (!this.shouldGenerate()) return;
>
> // 3. Build coaching context
>
> const context: CoachingContext = {
>
> recentTranscript: this.formatTranscript(),
>
> conversationSummary: this.currentSummary,
>
> };
>
> // 4. Generate suggestion
>
> const result = await this.suggestionGenerator.generate(
>
> context,
>
> this.activeTemplate
>
> );
>
> if (result.isOk()) {
>
> this.eventBus.publish(
>
> new SuggestionGenerated(event.sessionId, result.value)
>
> );
>
> }
>
> }
>
> }

**7. State Management (Redux)**

Redux is placed in the infrastructure layer. The EventBusPort
implementation translates Domain Events to Redux actions.

**7.1 EventBus to Redux Bridge**

> // infrastructure/state/ReduxEventBusAdapter.ts
>
> class ReduxEventBusAdapter implements EventBusPort {
>
> constructor(private store: Store) {}
>
> publish\<T extends DomainEvent\>(event: T): void {
>
> const action = this.mapEventToAction(event);
>
> if (action) {
>
> this.store.dispatch(action);
>
> }
>
> }
>
> subscribe\<T extends DomainEvent\>(
>
> eventType: string,
>
> handler: (event: T) =\> void
>
> ): () =\> void {
>
> // Optional: for domain service subscriptions
>
> // Can use Redux middleware or custom event emitter
>
> }
>
> private mapEventToAction(event: DomainEvent): Action \| null {
>
> switch (event.type) {
>
> case 'SessionStarted':
>
> return sessionActions.started(event.payload);
>
> case 'SessionStopped':
>
> return sessionActions.stopped(event.payload);
>
> case 'SegmentReceived':
>
> return transcriptActions.segmentReceived(event.payload);
>
> case 'SuggestionGenerated':
>
> return coachingActions.suggestionGenerated(event.payload);
>
> default:
>
> return null;
>
> }
>
> }
>
> }

**7.2 Redux Slices (Per Domain)**

**7.2.1 Session Slice**

> // infrastructure/state/slices/sessionSlice.ts
>
> interface SessionState {
>
> currentSession: Session \| null;
>
> status: SessionStatus;
>
> audioConfig: AudioConfig \| null;
>
> connectionStates: {
>
> audio: ConnectionState;
>
> transcription: ConnectionState;
>
> };
>
> error: SessionError \| null;
>
> }
>
> const initialState: SessionState = {
>
> currentSession: null,
>
> status: 'idle',
>
> audioConfig: null,
>
> connectionStates: {
>
> audio: 'disconnected',
>
> transcription: 'disconnected',
>
> },
>
> error: null,
>
> };
>
> const sessionSlice = createSlice({
>
> name: 'session',
>
> initialState,
>
> reducers: {
>
> started: (state, action: PayloadAction\<SessionStartedPayload\>) =\> {
>
> state.currentSession = action.payload.session;
>
> state.status = 'active';
>
> state.error = null;
>
> },
>
> stopped: (state) =\> {
>
> state.status = 'stopped';
>
> },
>
> paused: (state) =\> {
>
> state.status = 'paused';
>
> },
>
> resumed: (state) =\> {
>
> state.status = 'active';
>
> },
>
> errorOccurred: (state, action: PayloadAction\<SessionError\>) =\> {
>
> state.error = action.payload;
>
> },
>
> connectionStateChanged: (state, action) =\> {
>
> state.connectionStates\[action.payload.type\] = action.payload.state;
>
> },
>
> },
>
> });

**7.2.2 Transcript Slice**

> interface TranscriptState {
>
> segments: TranscriptSegment\[\];
>
> speakers: Record\<SpeakerId, Speaker\>;
>
> currentSpeaker: SpeakerId \| null;
>
> }
>
> const transcriptSlice = createSlice({
>
> name: 'transcript',
>
> initialState: {
>
> segments: \[\],
>
> speakers: {},
>
> currentSpeaker: null,
>
> } as TranscriptState,
>
> reducers: {
>
> segmentReceived: (state, action: PayloadAction\<TranscriptSegment\>)
> =\> {
>
> const segment = action.payload;
>
> if (segment.isFinal) {
>
> state.segments.push(segment);
>
> } else {
>
> // Update interim segment
>
> const idx = state.segments.findIndex(s =\> s.id === segment.id);
>
> if (idx \>= 0) {
>
> state.segments\[idx\] = segment;
>
> } else {
>
> state.segments.push(segment);
>
> }
>
> }
>
> },
>
> speakerIdentified: (state, action) =\> {
>
> const { speakerId, label, color } = action.payload;
>
> state.speakers\[speakerId\] = { id: speakerId, label, color };
>
> },
>
> cleared: (state) =\> {
>
> state.segments = \[\];
>
> },
>
> },
>
> });

**7.2.3 Coaching Slice**

> interface CoachingState {
>
> suggestions: Suggestion\[\];
>
> activeTemplate: Template \| null;
>
> isGenerating: boolean;
>
> }
>
> const coachingSlice = createSlice({
>
> name: 'coaching',
>
> initialState: {
>
> suggestions: \[\],
>
> activeTemplate: null,
>
> isGenerating: false,
>
> } as CoachingState,
>
> reducers: {
>
> suggestionGenerated: (state, action: PayloadAction\<Suggestion\>) =\>
> {
>
> state.suggestions.unshift(action.payload);
>
> state.isGenerating = false;
>
> },
>
> suggestionDismissed: (state, action: PayloadAction\<SuggestionId\>)
> =\> {
>
> const suggestion = state.suggestions.find(
>
> s =\> s.id === action.payload
>
> );
>
> if (suggestion) {
>
> suggestion.status = 'dismissed';
>
> }
>
> },
>
> templateSelected: (state, action: PayloadAction\<Template\>) =\> {
>
> state.activeTemplate = action.payload;
>
> },
>
> },
>
> });

**8. Error Handling**

All operations that can fail return a Result type, making error handling
explicit and type-safe.

**8.1 Result Type Implementation**

> // domain/shared/Result.ts
>
> type Result\<T, E\> = Ok\<T\> \| Err\<E\>;
>
> class Ok\<T\> {
>
> readonly \_tag = 'Ok' as const;
>
> constructor(readonly value: T) {}
>
> isOk(): this is Ok\<T\> { return true; }
>
> isErr(): this is Err\<never\> { return false; }
>
> map\<U\>(fn: (value: T) =\> U): Result\<U, never\> {
>
> return Result.ok(fn(this.value));
>
> }
>
> flatMap\<U, E2\>(fn: (value: T) =\> Result\<U, E2\>): Result\<U, E2\>
> {
>
> return fn(this.value);
>
> }
>
> }
>
> class Err\<E\> {
>
> readonly \_tag = 'Err' as const;
>
> constructor(readonly error: E) {}
>
> isOk(): this is Ok\<never\> { return false; }
>
> isErr(): this is Err\<E\> { return true; }
>
> map\<U\>(\_fn: (value: never) =\> U): Result\<U, E\> {
>
> return this as unknown as Result\<U, E\>;
>
> }
>
> flatMap\<U, E2\>(\_fn: (value: never) =\> Result\<U, E2\>):
> Result\<never, E\> {
>
> return this as unknown as Result\<never, E\>;
>
> }
>
> }
>
> const Result = {
>
> ok: \<T\>(value: T): Result\<T, never\> =\> new Ok(value),
>
> err: \<E\>(error: E): Result\<never, E\> =\> new Err(error),
>
> };

**8.2 Domain Error Types**

> // Base error type
>
> abstract class DomainError extends Error {
>
> abstract readonly code: string;
>
> abstract readonly context?: Record\<string, unknown\>;
>
> }
>
> // Session errors
>
> class SessionError extends DomainError {
>
> constructor(
>
> readonly code: SessionErrorCode,
>
> readonly cause?: Error
>
> ) {
>
> super(\`Session error: \${code}\`);
>
> }
>
> }
>
> type SessionErrorCode =
>
> \| 'AudioCaptureFailed'
>
> \| 'TranscriptionFailed'
>
> \| 'InvalidConfiguration'
>
> \| 'SessionNotFound'
>
> \| 'SessionAlreadyActive';
>
> // Connection errors
>
> class ConnectionError extends DomainError {
>
> constructor(
>
> readonly code: ConnectionErrorCode,
>
> readonly service: 'deepgram' \| 'openai',
>
> readonly cause?: Error
>
> ) {
>
> super(\`Connection error \[\${service}\]: \${code}\`);
>
> }
>
> }
>
> type ConnectionErrorCode =
>
> \| 'Timeout'
>
> \| 'Unauthorized'
>
> \| 'RateLimited'
>
> \| 'NetworkError'
>
> \| 'ServerError';

**8.3 Error Handling in Presentation**

> // presentation/hooks/useSession.ts
>
> function useSession() {
>
> const services = useServices();
>
> const dispatch = useAppDispatch();
>
> const \[error, setError\] = useState\<SessionError \| null\>(null);
>
> const startSession = useCallback(async (config: SessionConfig) =\> {
>
> setError(null);
>
> const result = await services.sessionManager.startSession(config);
>
> if (result.isErr()) {
>
> setError(result.error);
>
> // Show user-friendly message
>
> toast.error(getErrorMessage(result.error));
>
> return;
>
> }
>
> // Success - state updates via EventBus -\> Redux
>
> }, \[services\]);
>
> return { startSession, error };
>
> }
>
> function getErrorMessage(error: SessionError): string {
>
> switch (error.code) {
>
> case 'AudioCaptureFailed':
>
> return 'Could not access microphone. Check permissions.';
>
> case 'TranscriptionFailed':
>
> return 'Could not connect to transcription. Check API key.';
>
> default:
>
> return 'An unexpected error occurred.';
>
> }
>
> }

**9. Dependency Injection**

Dependencies are injected at the composition root, allowing easy testing
and swapping implementations.

**9.1 Container Setup**

> // infrastructure/di/container.ts
>
> interface Container {
>
> // Ports
>
> audioCapture: AudioCapturePort;
>
> transcription: TranscriptionPort;
>
> realtimeConnection: RealtimeConnectionPort;
>
> suggestionGenerator: SuggestionGeneratorPort;
>
> sessionRepository: SessionRepositoryPort;
>
> configRepository: ConfigRepositoryPort;
>
> eventBus: EventBusPort;
>
> // Domain Services
>
> sessionManager: SessionManager;
>
> coachingEngine: CoachingEngine;
>
> }
>
> function createContainer(store: Store): Container {
>
> // Adapters
>
> const eventBus = new ReduxEventBusAdapter(store);
>
> const audioCapture = new MicrophoneAdapter();
>
> const transcription = new DeepgramAdapter();
>
> const realtimeConnection = new OpenAIRealtimeAdapter();
>
> const suggestionGenerator = new
> OpenAISuggestionAdapter(realtimeConnection);
>
> const sessionRepository = new LocalStorageSessionRepository();
>
> const configRepository = new LocalStorageConfigRepository();
>
> // Domain Services
>
> const sessionManager = new SessionManager(
>
> audioCapture,
>
> transcription,
>
> sessionRepository,
>
> eventBus
>
> );
>
> const coachingEngine = new CoachingEngine(
>
> suggestionGenerator,
>
> eventBus
>
> );
>
> return {
>
> audioCapture,
>
> transcription,
>
> realtimeConnection,
>
> suggestionGenerator,
>
> sessionRepository,
>
> configRepository,
>
> eventBus,
>
> sessionManager,
>
> coachingEngine,
>
> };
>
> }

**9.2 React Provider**

> // infrastructure/di/providers.tsx
>
> const ContainerContext = createContext\<Container \| null\>(null);
>
> export function ContainerProvider({ children }: { children: ReactNode
> }) {
>
> const store = useStore();
>
> const container = useMemo(() =\> createContainer(store), \[store\]);
>
> return (
>
> \<ContainerContext.Provider value={container}\>
>
> {children}
>
> \</ContainerContext.Provider\>
>
> );
>
> }
>
> export function useServices(): Container {
>
> const container = useContext(ContainerContext);
>
> if (!container) {
>
> throw new Error('useServices must be used within ContainerProvider');
>
> }
>
> return container;
>
> }
>
> // Usage in component
>
> function SessionControls() {
>
> const { sessionManager } = useServices();
>
> const handleStart = () =\> {
>
> sessionManager.startSession(config);
>
> };
>
> return \<button onClick={handleStart}\>Start Session\</button\>;
>
> }

**10. Testing Strategy**

The architecture enables comprehensive testing at each layer with
minimal mocking.

**10.1 Test Pyramid**

|             |                                        |            |              |
|-------------|----------------------------------------|------------|--------------|
| **Level**   | **Focus**                              | **Tools**  | **Priority** |
| Unit        | Domain logic, Value Objects, Use Cases | Vitest     | High (NOW)   |
| Integration | Domain Services with mocked ports      | Vitest     | Medium       |
| E2E         | Full user flows                        | Playwright | Later        |

**10.2 Unit Test Examples**

**10.2.1 Value Object Test**

> // domain/session/valueObjects/SessionId.test.ts
>
> describe('SessionId', () =\> {
>
> it('should create valid session id', () =\> {
>
> const result = SessionIdSchema.safeParse(crypto.randomUUID());
>
> expect(result.success).toBe(true);
>
> });
>
> it('should reject invalid uuid', () =\> {
>
> const result = SessionIdSchema.safeParse('not-a-uuid');
>
> expect(result.success).toBe(false);
>
> });
>
> });

**10.2.2 Use Case Test**

> // application/useCases/session/StartSessionUseCase.test.ts
>
> describe('StartSessionUseCase', () =\> {
>
> let mockAudioCapture: MockAudioCapturePort;
>
> let mockTranscription: MockTranscriptionPort;
>
> let mockSessionRepo: MockSessionRepository;
>
> let mockEventBus: MockEventBus;
>
> let sessionManager: SessionManager;
>
> beforeEach(() =\> {
>
> mockAudioCapture = createMockAudioCapture();
>
> mockTranscription = createMockTranscription();
>
> mockSessionRepo = createMockSessionRepo();
>
> mockEventBus = createMockEventBus();
>
> sessionManager = new SessionManager(
>
> mockAudioCapture,
>
> mockTranscription,
>
> mockSessionRepo,
>
> mockEventBus
>
> );
>
> });
>
> it('should start session successfully', async () =\> {
>
> mockAudioCapture.start.mockResolvedValue(Result.ok(mockStream));
>
> mockTranscription.connect.mockResolvedValue(Result.ok());
>
> const result = await sessionManager.startSession(validConfig);
>
> expect(result.isOk()).toBe(true);
>
> expect(mockEventBus.publish).toHaveBeenCalledWith(
>
> expect.objectContaining({ type: 'SessionStarted' })
>
> );
>
> });
>
> it('should fail if audio capture fails', async () =\> {
>
> mockAudioCapture.start.mockResolvedValue(
>
> Result.err(new CaptureError('PermissionDenied'))
>
> );
>
> const result = await sessionManager.startSession(validConfig);
>
> expect(result.isErr()).toBe(true);
>
> expect(result.error.code).toBe('AudioCaptureFailed');
>
> });
>
> });

**10.3 Mock Factories**

> // tests/mocks/ports.ts
>
> function createMockTranscription(): MockTranscriptionPort {
>
> return {
>
> connect: vi.fn(),
>
> disconnect: vi.fn(),
>
> sendAudio: vi.fn(),
>
> onTranscript: vi.fn(),
>
> onSpeakerChange: vi.fn(),
>
> onError: vi.fn(),
>
> onStateChange: vi.fn(),
>
> };
>
> }
>
> function createMockEventBus(): MockEventBus {
>
> const handlers = new Map\<string, Function\[\]\>();
>
> return {
>
> publish: vi.fn((event) =\> {
>
> const eventHandlers = handlers.get(event.type) \|\| \[\];
>
> eventHandlers.forEach(h =\> h(event));
>
> }),
>
> subscribe: vi.fn((type, handler) =\> {
>
> const existing = handlers.get(type) \|\| \[\];
>
> handlers.set(type, \[...existing, handler\]);
>
> return () =\> {
>
> handlers.set(type, existing.filter(h =\> h !== handler));
>
> };
>
> }),
>
> };
>
> }

**11. Implementation Roadmap**

**11.1 Phase 1: Foundation (Week 1-2)**

|               |                                                  |
|---------------|--------------------------------------------------|
| **Task**      | **Deliverable**                                  |
| Project setup | Vite + React + TypeScript + Redux Toolkit        |
| Domain layer  | All entities, value objects (Zod), domain events |
| Result type   | Shared Result implementation                     |
| Basic ports   | EventBusPort, Repository ports                   |
| Redux setup   | Store, slices (empty), ReduxEventBusAdapter      |

**11.2 Phase 2: Settings & Config (Week 2-3)**

|                       |                                 |
|-----------------------|---------------------------------|
| **Task**              | **Deliverable**                 |
| Settings UI           | API key input, preferences form |
| LocalStorage adapters | ConfigRepository implementation |
| Settings context      | Full working settings flow      |

**11.3 Phase 3: Audio & Transcription (Week 3-4)**

|                      |                                     |
|----------------------|-------------------------------------|
| **Task**             | **Deliverable**                     |
| Audio capture        | MicrophoneAdapter, TabAudioAdapter  |
| Deepgram integration | DeepgramAdapter with event handling |
| Transcript UI        | Real-time transcript display        |
| Session basic        | Start/stop flow (no coaching)       |

**11.4 Phase 4: Coaching (Week 5-6)**

|                    |                                          |
|--------------------|------------------------------------------|
| **Task**           | **Deliverable**                          |
| OpenAI integration | OpenAIRealtimeAdapter, SuggestionAdapter |
| CoachingEngine     | Event-driven suggestion generation       |
| Coaching UI        | Suggestion cards, template selector      |
| Full integration   | Complete Meeting Coach flow              |

**11.5 Phase 5: Polish & Testing (Week 7-8)**

|                 |                                       |
|-----------------|---------------------------------------|
| **Task**        | **Deliverable**                       |
| Unit tests      | Domain and application layers covered |
| Error handling  | User-friendly error messages          |
| History feature | Session list, replay                  |
| Responsive UI   | Mobile-friendly design                |
| Documentation   | README, deployment guide              |

**12. Appendix**

**12.1 Technology Stack**

|              |                |             |
|--------------|----------------|-------------|
| **Category** | **Technology** | **Version** |
| Runtime      | Node.js        | 20+         |
| Framework    | React          | 18+         |
| Build        | Vite           | 5+          |
| Language     | TypeScript     | 5.3+        |
| State        | Redux Toolkit  | 2+          |
| Validation   | Zod            | 3+          |
| Styling      | TailwindCSS    | 3+          |
| Testing      | Vitest         | 1+          |
| E2E Testing  | Playwright     | 1+          |

**12.2 External APIs**

|                     |                         |                         |
|---------------------|-------------------------|-------------------------|
| **Service**         | **Purpose**             | **Authentication**      |
| Deepgram            | Real-time transcription | API Key (user provided) |
| OpenAI Realtime API | Coaching suggestions    | API Key (user provided) |

**12.3 Key Principles Recap**

1\. Dependency Rule: Dependencies point inward. Domain knows nothing
about infrastructure.

2\. Ports & Adapters: All external communication through interfaces
defined in application layer.

3\. Domain Events: Cross-boundary communication via events, not direct
calls.

4\. Result Type: All fallible operations return Result\<T, E\>, never
throw.

5\. Zod Everywhere: Runtime validation at boundaries, types derived from
schemas.

6\. Test First: Domain and application layers must be testable without
infrastructure.
