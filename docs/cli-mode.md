# CLI Mode per MyCoachPilot

## Panoramica

Il CLI mode aggiunge un entry point Node.js che riusa la stessa business logic (domain + application layer) senza browser. Questo abilita:

- **Integration test** senza dipendenze browser
- **Uso da terminale** per sessioni di coaching
- **Automazione** e scripting

L'architettura hexagonal con ports & adapters rende questo possibile: domain e application layer restano invariati. Servono solo nuovi adapter per Node.js e un nuovo DI container.

---

## Utilizzo

### Comandi disponibili

```bash
# Avviare una sessione meeting coach
npm run cli -- session start --mode meeting_coach --deepgram-key <KEY>

# Avviare con file audio (WAV)
npm run cli -- session start --mode meeting_coach --deepgram-key <KEY> --audio-file test.wav

# Sessione conversazione con OpenAI
npm run cli -- session start --mode conversation --openai-key <KEY>

# Transcript only
npm run cli -- session start --mode transcript_only --openai-key <KEY>

# Impostare coaching style
npm run cli -- session start --mode meeting_coach --deepgram-key <KEY> --coaching-style assertive

# Configurare API key
npm run cli -- config set-key openai sk-xxx
npm run cli -- config set-key deepgram dg-xxx

# Help
npm run cli -- --help
npm run cli -- session start --help
```

### Variabili d'ambiente

In alternativa ai flag, le API key possono essere impostate via `.env`:

```env
DEEPGRAM_API_KEY=your-deepgram-key
OPENAI_API_KEY=your-openai-key
```

### Opzioni del comando `session start`

| Flag | Descrizione | Default |
|------|-------------|---------|
| `-m, --mode` | Modalita: `meeting_coach`, `conversation`, `transcript_only` | `meeting_coach` |
| `--deepgram-key` | API key Deepgram | `$DEEPGRAM_API_KEY` |
| `--openai-key` | API key OpenAI | `$OPENAI_API_KEY` |
| `--audio-file` | File WAV da processare | - |
| `--coaching-style` | Stile: `diplomatic`, `assertive`, `analytical`, `supportive` | `diplomatic` |

---

## Architettura

### Adapter CLI vs Browser

| Porta | Adapter Browser | Adapter CLI |
|-------|----------------|-------------|
| `EventBusPort` | `ReduxEventBusAdapter` | `InMemoryEventBusAdapter` |
| `AudioCapturePort` | `AudioCaptureAdapter` (Web Audio API) | `FileAudioCaptureAdapter` |
| `TranscriptionPort` | `DeepgramAdapter` (browser WebSocket) | `NodeDeepgramAdapter` (`ws` package) |
| `RealtimeConnectionPort` | `OpenAIRealtimeAdapter` (browser WebSocket) | `NodeOpenAIRealtimeAdapter` (`ws` package) |
| `SessionRepositoryPort` | `LocalStorageSessionRepository` | `InMemorySessionRepository` |
| `ConfigRepositoryPort` | `LocalStorageConfigRepository` | `InMemoryConfigRepository` |

### Struttura file

```
src/cli/
├── adapters/
│   ├── InMemoryEventBusAdapter.ts
│   ├── InMemorySessionRepository.ts
│   ├── InMemoryConfigRepository.ts
│   ├── FileAudioCaptureAdapter.ts
│   ├── NodeDeepgramAdapter.ts
│   ├── NodeOpenAIRealtimeAdapter.ts
│   └── index.ts
├── commands/
│   ├── session.ts
│   └── config.ts
├── container.ts
├── main.ts
└── __tests__/
    └── integration/
        ├── meeting-coach.test.ts
        └── fixtures/
```

### DI Container

Il file `container.ts` wira tutti gli adapter CLI e crea le istanze dei servizi applicativi:

```
InMemoryEventBusAdapter ──┐
FileAudioCaptureAdapter ──┤
NodeDeepgramAdapter ──────┼── SessionManager
NodeOpenAIRealtimeAdapter ┤
CoachingEngine ───────────┘
```

---

## Test

### Eseguire i test di integrazione

```bash
npm run test:integration
```

### Copertura dei test (12 test)

- **Container**: creazione corretta di tutti gli adapter
- **EventBus**: publish, subscribe, unsubscribe, subscribeMany
- **SessionRepository**: save, getById, count
- **ConfigRepository**: templates predefiniti, save/get config
- **FileAudioCapture**: start/stop, emissione chunk audio iniettati
- **Session lifecycle**: validazione API key mancanti per meeting_coach e conversation

---

## Dipendenze aggiunte

| Package | Tipo | Scopo |
|---------|------|-------|
| `commander` | runtime | Framework CLI |
| `ws` | runtime | WebSocket per Node.js |
| `chalk` | runtime | Output colorato terminale |
| `dotenv` | runtime | Caricamento `.env` |
| `@types/ws` | dev | Tipi TypeScript per ws |
| `tsx` | dev | Esecuzione TypeScript in Node.js |

---

## Note tecniche

- Gli adapter Node (`NodeDeepgramAdapter`, `NodeOpenAIRealtimeAdapter`) sono copie separate degli adapter browser, modificate per usare il package `ws` invece del WebSocket nativo del browser. Questo evita qualsiasi rischio di rompere l'app browser.
- `FileAudioCaptureAdapter` supporta sia lettura da file WAV che iniezione diretta di dati audio (utile per test).
- Il `tsconfig.cli.json` include i tipi Node (`@types/node`) necessari per il contesto CLI.
- L'app browser resta completamente invariata: `npm run build` e `npm run dev` funzionano come prima.
