# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyCoachPilot Free is a real-time AI-powered meeting coach application providing live transcription, speaker identification, and contextual coaching suggestions. Built with Next.js, React, and TypeScript.

## Development Commands

```bash
npm run dev          # Start dev server on port 13000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run typecheck    # TypeScript type checking
```

## Architecture

The codebase follows **Clean Architecture + Hexagonal + DDD** principles.

### Bounded Contexts

| Context | Responsibility | Core Entities |
|---------|---------------|---------------|
| **Session** | Coaching session lifecycle | Session, SessionId |
| **Transcript** | Real-time transcription + speaker management | Transcript, Speaker, TranscriptSegment |
| **Coaching** | AI-powered suggestion generation | Suggestion, Template |
| **Settings** | User configuration + API keys | UserConfig, ApiKeys |

### Layer Structure

```
src/
├── domain/           # Pure business logic (entities, value objects, domain events)
├── application/      # Use cases, ports (interfaces), domain services
├── infrastructure/   # Redux store, adapters, localStorage repositories
└── presentation/     # React components and hooks
```

**Dependency Rule**: Dependencies flow inward only. Domain layer has zero external dependencies.

### Key Architectural Patterns

- **Ports & Adapters**: External services accessed via port interfaces (TranscriptionPort, AudioCapturePort, SuggestionGeneratorPort)
- **Result Type**: All fallible operations return `Result<T, E>`, never throw exceptions
- **Domain Events**: Cross-context communication via EventBus (SessionStarted, SegmentReceived, SuggestionGenerated)
- **Zod Validation**: Runtime validation at boundaries with derived TypeScript types
- **Repository Pattern**: Data access abstraction for easy migration (localStorage → cloud)

### Domain Services

- **SessionManager**: Orchestrates session lifecycle, coordinates audio capture and transcription
- **CoachingEngine**: Reacts to transcript events and generates contextual suggestions

## External Services

| Service | Purpose | Authentication |
|---------|---------|----------------|
| **Deepgram** | Real-time transcription + speaker diarization | API Key (user provided) |
| **OpenAI Realtime API** | Voice conversations + coaching suggestions | API Key (user provided) |

## State Management

- **Redux Toolkit**: Application state with slices per domain (sessionSlice, transcriptSlice, coachingSlice, settingsSlice)
- **ReduxEventBusAdapter**: Bridges domain events to Redux actions
- **localStorage**: Session history, user config, custom templates

## Error Handling

All domain errors extend `DomainError` with explicit error codes:
- `SessionError`: AudioCaptureFailed, TranscriptionFailed, InvalidConfiguration
- `ConnectionError`: Timeout, Unauthorized, RateLimited, NetworkError

## Code Quality

- ESLint: `no-console: error`, `no-unused-vars: error`
- JSCPD: Code duplication detection (threshold: 2, min 5 lines)
- Knip: Unused imports/dependencies detection
- TypeScript strict mode available
