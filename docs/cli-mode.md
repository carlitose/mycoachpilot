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
# Avviare una sessione meeting coach (microfono default)
npm run cli -- session start --mode meeting_coach --deepgram-key <KEY>

# Avviare con file audio (WAV)
npm run cli -- session start --mode meeting_coach --deepgram-key <KEY> --audio-file test.wav

# Sessione conversazione con OpenAI
npm run cli -- session start --mode conversation --openai-key <KEY>

# Transcript only (solo trascrizione, nessuna risposta AI)
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

### Live Audio Capture (macOS)

La CLI supporta la cattura audio in tempo reale da diverse sorgenti:

```bash
# Lista dispositivi audio disponibili
npm run cli -- session start --list-devices

# Solo microfono (default)
npm run cli -- session start --mode transcript_only --audio-source microphone

# Solo audio di sistema (browser, Google Meet, YouTube, ecc.)
npm run cli -- session start --mode transcript_only --audio-source system

# Entrambi: microfono + audio di sistema
npm run cli -- session start --mode meeting_coach --audio-source mixed
```

| Sorgente | Descrizione | Requisiti |
|----------|-------------|-----------|
| `microphone` | Cattura dal microfono | macOS 14.2+ |
| `system` | Cattura audio di sistema (browser, app, ecc.) | macOS 14.4+ |
| `mixed` | Cattura entrambi contemporaneamente | macOS 14.4+ |

**Permessi macOS**: Al primo avvio, macOS chiederà il permesso per il microfono. Per l'audio di sistema, abilitare il terminale in **System Settings > Privacy & Security > Screen & System Audio Recording**.

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
| `--audio-source` | Sorgente audio live: `microphone`, `system`, `mixed` | `microphone` |
| `--list-devices` | Mostra dispositivi audio disponibili ed esce | - |
| `--coaching-style` | Stile: `diplomatic`, `assertive`, `analytical`, `supportive` | `diplomatic` |

### Modalità di sessione

| Modalità | Descrizione | API Key richiesta | Trascrizione |
|----------|-------------|-------------------|--------------|
| `meeting_coach` | Trascrizione + suggerimenti coaching | Deepgram + OpenAI | Deepgram (16kHz) |
| `conversation` | Conversazione bidirezionale con AI | OpenAI | OpenAI Realtime |
| `transcript_only` | Solo trascrizione, nessuna risposta AI | OpenAI | OpenAI Realtime (gpt-4o-mini-transcribe) |

---

## Architettura

### Adapter CLI vs Browser

| Porta | Adapter Browser | Adapter CLI |
|-------|----------------|-------------|
| `EventBusPort` | `ReduxEventBusAdapter` | `InMemoryEventBusAdapter` |
| `AudioCapturePort` | `AudioCaptureAdapter` (Web Audio API) | `NodeMicrophoneAdapter` / `FileAudioCaptureAdapter` |
| `TranscriptionPort` | `DeepgramAdapter` (browser WebSocket) | `NodeDeepgramAdapter` (`ws` package) |
| `RealtimeConnectionPort` | `OpenAIRealtimeAdapter` (browser WebSocket) | `NodeOpenAIRealtimeAdapter` (`ws` package) |
| `SessionRepositoryPort` | `LocalStorageSessionRepository` | `InMemorySessionRepository` |
| `ConfigRepositoryPort` | `LocalStorageConfigRepository` | `InMemoryConfigRepository` |

### Audio Capture Adapters

- **`NodeMicrophoneAdapter`**: Cattura audio live da microfono e/o audio di sistema usando `coreaudio-node`. Supporta tre modalità: `microphone`, `system`, `mixed`. Richiede macOS 14.2+ (14.4+ per system audio).

- **`FileAudioCaptureAdapter`**: Legge audio da file WAV. Usato quando si passa `--audio-file`.

### Struttura file

```
src/cli/
├── adapters/
│   ├── InMemoryEventBusAdapter.ts
│   ├── InMemorySessionRepository.ts
│   ├── InMemoryConfigRepository.ts
│   ├── FileAudioCaptureAdapter.ts
│   ├── NodeMicrophoneAdapter.ts      # Live audio capture (mic + system)
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
| `coreaudio-node` | runtime | Cattura audio nativa macOS (mic + system) |
| `@types/ws` | dev | Tipi TypeScript per ws |
| `tsx` | dev | Esecuzione TypeScript in Node.js |

---

## Note tecniche

- Gli adapter Node (`NodeDeepgramAdapter`, `NodeOpenAIRealtimeAdapter`) sono copie separate degli adapter browser, modificate per usare il package `ws` invece del WebSocket nativo del browser. Questo evita qualsiasi rischio di rompere l'app browser.
- `FileAudioCaptureAdapter` supporta sia lettura da file WAV che iniezione diretta di dati audio (utile per test).
- Il `tsconfig.cli.json` include i tipi Node (`@types/node`) necessari per il contesto CLI.
- L'app browser resta completamente invariata: `npm run build` e `npm run dev` funzionano come prima.

### OpenAI Realtime API: Conversation vs Transcription

`NodeOpenAIRealtimeAdapter` supporta due modalità di connessione:

| Modalità | Endpoint | Modello | Comportamento |
|----------|----------|---------|---------------|
| `conversation` | `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview` | whisper-1 | VAD attivo, AI risponde |
| `transcript_only` | `wss://api.openai.com/v1/realtime?intent=transcription` | gpt-4o-mini-transcribe | VAD attivo, solo trascrizione |

**Perché due endpoint?**
- L'endpoint standard (`?model=...`) usa `whisper-1` per la trascrizione e genera risposte AI automaticamente quando il VAD rileva fine del parlato.
- L'endpoint di trascrizione (`?intent=transcription`) usa `gpt-4o-mini-transcribe` che è più accurato e non genera risposte AI. Include anche noise reduction.

### coreaudio-node

`NodeMicrophoneAdapter` usa `coreaudio-node` per la cattura audio nativa su macOS:

- **MicrophoneRecorder**: Cattura dal microfono con resampling automatico
- **SystemAudioRecorder**: Cattura audio di sistema (richiede macOS 14.4+)
- Entrambi emettono chunk PCM16 a intervalli configurabili
- L'adapter converte PCM16 → Float32 per compatibilità con il pipeline esistente
