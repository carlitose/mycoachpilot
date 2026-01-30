# Specifiche Tecniche - MyCoachPilot Free

Questo documento contiene le specifiche tecniche complete per l'implementazione di MyCoachPilot Free.

## Indice

1. [User Stories Dettagliate](./user-stories.md)
   - Conversation Mode (US-001 a US-003)
   - Transcript Only Mode (US-004)
   - Meeting Coach Mode (US-005 a US-006)
   - Session History Management (US-007 a US-009)
   - Multimodal Capture Features (US-010 a US-012)
   - Configuration & Customization (US-013 a US-014)
   - Error Handling & Recovery (US-015)

2. [API Contracts & Interfaces](./api-contracts.md)
   - REST API Endpoints
     - POST /api/realtime/token
     - POST /api/deepgram/token
     - POST /api/coach-suggestion
   - React Hooks APIs
     - useSession
     - useTabAudioCapture
     - useSessionHistory
   - WebSocket Protocols
   - localStorage Schema
   - Event Emitters & Listeners

3. [Data Models](./data-models.md)
   - Core Message Types
   - Session Models
   - Configuration Models
   - Meeting Coach Models
   - Error Models
   - Enums & Constants

4. [Edge Cases & Error Handling](./edge-cases.md)
   - Network & Connectivity (EC-001 a EC-003)
   - Browser Compatibility & Permissions (EC-004 a EC-006)
   - Data Validation & Limits (EC-007 a EC-009)
   - Resource Management (EC-010 a EC-011)
   - Concurrent Operations (EC-012 a EC-013)
   - API-Specific Edge Cases (EC-014 a EC-015)

5. [Quality Requirements](./quality-requirements.md)
   - Testing (Unit, Integration, E2E)
   - Performance (Latency, Memory, CPU, Network)
   - Security (API Key Storage, HTTPS, XSS Prevention)
   - Accessibility (WCAG 2.1 AA, Screen Readers, Color Contrast)
   - Browser Support (Chrome, Firefox, Safari)

---

## Critical Files per Implementation

Based on this technical specification, here are the critical files per implementing features:

1. **[hooks/ai-hooks/useSession.ts](../hooks/ai-hooks/useSession.ts)** - Core session lifecycle management, handles all real-time connections, message state, and cleanup.

2. **[lib/simpleRealtime.ts](../lib/simpleRealtime.ts)** - Creates and configures realtime sessions, switches between SDK agent and native WebSocket based on mode.

3. **[types/ai-types/chat.ts](../types/ai-types/chat.ts)** - All type definitions per messages, sessions, and history. Any new data models must be added here first.

4. **[lib/sessionHistoryStorage.ts](../lib/sessionHistoryStorage.ts)** - localStorage abstraction per session history con validation, filtering, and limits.

5. **[components/ai-app/ChatGPTInterface.tsx](../components/ai-app/ChatGPTInterface.tsx)** - Main orchestration component tying together all hooks and features.

---

## Implementazione Raccomandata

### Fase 1: Foundation (P0 - MVP)
1. Ristrutturare `useSession` hook per gestire correttamente il lifecycle
2. Implementare session history storage con limiti e validation
3. Refactoring template system con separation of concerns
4. Migliorare error handling e recovery patterns

### Fase 2: Core Features (P1)
1. Implementare Meeting Coach mode con Deepgram integration
2. Aggiungere resume conversation functionality
3. Implementare screen capture e file upload
4. Migliorare UI/UX con onboarding tour

### Fase 3: Advanced Features (P2)
1. Ottimizzare tab audio capture con audio mixing
2. Implementare Picture-in-Picture mode
3. Aggiungere advanced search e filters per history
4. Implementare coaching style modifiers

### Fase 4: Future Enhancements (P3)
1. Video analysis integration
2. Real-time collaboration features
3. Cloud sync per sessions
4. Advanced AI tools (code analysis, deep thinking)

---

## Design Principles

1. **Separation of Concerns**
   - Logic business separata da UI components
   - Hooks specializzati per feature specifiche
   - Utility functions riutilizzabili

2. **Error Resilience**
   - Graceful degradation quando feature non disponibili
   - Retry logic con exponential backoff
   - Comprehensive error logging e monitoring

3. **Performance First**
   - Lazy loading per components pesanti
   - Message windowing per liste lunghe
   - Audio processing efficiente con AudioWorklet

4. **User-Centric Design**
   - Feedback immediato per ogni azione
   - Progressive disclosure per feature avanzate
   - Accessibility as first-class concern

---

## Testing Strategy

### Unit Tests (80% coverage target)
- Core business logic in hooks
- Utility functions
- Data transformation functions
- Validation logic

### Integration Tests
- Session lifecycle flows
- History management
- API integration
- WebSocket communication

### E2E Tests (Playwright)
- Complete user flows
- Error scenarios
- Cross-browser compatibility
- Performance benchmarks

---

## Deployment Considerations

### Environment Variables
```bash
NEXT_PUBLIC_OPENAI_API_URL=https://api.openai.com/v1
NEXT_PUBLIC_DEEPGRAM_API_URL=wss://api.deepgram.com/v1
```

### Build Optimization
- Code splitting per routes
- Tree shaking per unused code
- Image optimization
- Bundle analysis

### Monitoring
- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- Usage analytics (privacy-conscious)
- API rate limit monitoring

---

## Appendice: Glossario Tecnico

- **Session**: Istanza di conversazione con inizio e fine definiti
- **Mode**: Modalità operativa (conversation, transcript_only, meeting_coach)
- **Template**: Set di istruzioni predefinite per l'AI
- **Speaker Diarization**: Identificazione automatica di chi parla in una conversazione multi-speaker
- **Ephemeral Token**: Token temporaneo con TTL limitato per auth API
- **Tab Audio Capture**: Cattura audio da tab browser specifico
- **PiP**: Picture-in-Picture, finestra floating
- **WebRTC**: Web Real-Time Communication protocol
- **PCM16**: Pulse-Code Modulation 16-bit audio format
- **VAD**: Voice Activity Detection

---

## Riferimenti

- [Requisiti di Sistema](./requisiti.md)
- [User Stories Dettagliate](./user-stories.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Edge Cases](./edge-cases.md)
- [Quality Requirements](./quality-requirements.md)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Deepgram API](https://developers.deepgram.com/)
- [WebRTC Spec](https://www.w3.org/TR/webrtc/)
- [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API)

---

**Documento redatto per**: Riprogettazione architettura MyCoachPilot Free
**Data**: 2026-01-27
**Versione**: 1.0
