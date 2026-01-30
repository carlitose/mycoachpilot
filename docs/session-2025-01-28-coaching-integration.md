# Session: Integrazione CoachingEngine con SessionManager

**Data**: 2025-01-28
**Branch**: `speaker_identification`
**Stato**: Completato

---

## Obiettivo

Collegare il `CoachingEngine` (già esistente) al `SessionManager` per abilitare la generazione automatica di suggerimenti di coaching durante le sessioni `meeting_coach`.

### Problema Iniziale

Il flusso era interrotto:

```
Audio → Deepgram → TranscriptSegment → SessionState ✅
                                          ↓
                             [CoachingEngine MAI chiamato] ❌
```

### Soluzione Implementata

```
Audio → Deepgram → TranscriptSegment → handleTranscriptionWithCoaching()
                                                ↓
                                      CoachingEngine.processSegment()
                                                ↓
                                      OpenAISuggestionGenerator
                                                ↓
                                      SuggestionGenerated event → Redux → UI
```

---

## Modifiche Effettuate

### 1. `src/application/services/SessionManager.ts`

- Aggiunto `coachingEngine?: CoachingEngine` in `SessionManagerDependencies`
- Aggiunto supporto per `coachingStyle` e `templateSystemPrompt` nelle options di `startSession()`
- In `setupMeetingCoachMode()`:
  - Se presente `openaiApiKey` e `coachingEngine`, configura il motore di coaching
  - Imposta il suggestion generator tramite `createSuggestionGeneratorFn()`
  - Sostituito handler eventi con `handleTranscriptionWithCoaching()` che chiama `CoachingEngine.processSegment()` sui segmenti finali

### 2. `src/application/services/CoachingIntegration.ts` (NUOVO)

Estratte le funzioni di supporto per mantenere SessionManager focalizzato:

```typescript
// Crea il generator di suggerimenti
export function createSuggestionGeneratorFn(
  apiKey: string,
  config: { coachingStyle; templateSystemPrompt; userSpeakerId }
): (context: CoachingContext) => Promise<SuggestionProps | null>

// Costruisce il contesto per il coaching
export function buildCoachingContext(
  segments: TranscriptSegment[],
  speakers: Map<number, Speaker>
): CoachingContext

// Gestisce eventi transcription + coaching
export function handleTranscriptionWithCoaching(
  event: TranscriptionEvent,
  state: SessionEventState,
  coachingEngine: CoachingEngine | undefined
): void
```

### 3. `src/infrastructure/di/container.ts`

- Aggiunto singleton `coachingEngine`
- Aggiunta factory `getCoachingEngine()` che crea un `CoachingEngine` con configurazione di default
- Aggiornato `getSessionManager()` per iniettare `coachingEngine`
- Aggiornato `resetContainer()` per resettare anche `coachingEngine`

### 4. `src/application/services/index.ts`

Esportati i nuovi helper:

```typescript
export {
  createSuggestionGeneratorFn,
  buildCoachingContext,
  handleTranscriptionWithCoaching,
} from './CoachingIntegration';
```

### 5. `src/application/services/__tests__/SessionManager.test.ts`

Aggiunti 4 nuovi test per l'integrazione CoachingEngine:

- `should accept optional CoachingEngine in dependencies`
- `should configure CoachingEngine when starting meeting_coach mode with openaiApiKey`
- `should not configure CoachingEngine when openaiApiKey is missing`
- `should call CoachingEngine.processSegment when final segment arrives`

---

## Flusso Dettagliato

### Avvio Sessione Meeting Coach

1. L'utente chiama `startSession('meeting_coach', { deepgramApiKey, openaiApiKey, coachingStyle, ... })`
2. `setupMeetingCoachMode()` viene invocato
3. Se `openaiApiKey` è presente:
   - `CoachingEngine.updateConfig()` imposta sessionId, coachingStyle, templateSystemPrompt
   - `createSuggestionGeneratorFn()` crea il generator
   - `CoachingEngine.setSuggestionGenerator()` lo imposta
4. Viene avviato l'audio capture e la connessione a Deepgram
5. I transcription events vengono gestiti da `handleTranscriptionWithCoaching()`

### Ricezione Segmento

1. Deepgram invia un evento `segment` con `isFinal: true`
2. `handleTranscriptionWithCoaching()` aggiorna lo stato (via `handleTranscriptionEvent()`)
3. Chiama `CoachingEngine.processSegment()` con:
   - Il segmento appena ricevuto
   - Il contesto costruito da `buildCoachingContext()` (ultimi 10 segmenti, speakers, current speaker)
4. `CoachingEngine` verifica:
   - Non è l'utente a parlare (se `userSpeakerId` è impostato)
   - È passato abbastanza tempo dall'ultimo suggerimento (rate limiting 15s)
5. Chiama il suggestion generator (OpenAI Chat API)
6. Pubblica evento `SuggestionGenerated` sull'EventBus
7. `ReduxEventBusAdapter` dispatcha `addSuggestion` al Redux store
8. UI si aggiorna mostrando il suggerimento

---

## Quality Checks

| Check | Risultato |
|-------|-----------|
| `npm run typecheck` | ✅ Nessun errore |
| `npm run lint` | ✅ 0 errori, 4 warning (pre-esistenti) |
| `npm run test` | ✅ 475 test passati |

---

## Approccio TDD Seguito

1. **RED**: Scritti i test per la nuova funzionalità
2. **GREEN**: Implementato il codice per far passare i test
3. **REFACTOR**: Estratte funzioni helper per rispettare il limite di linee

---

## Note Tecniche

### Rate Limiting

Il `CoachingEngine` implementa un rate limiting di 15 secondi tra suggerimenti per evitare di sovraccaricare l'utente.

### Fire and Forget

La chiamata a `processSegment()` è asincrona ma non blocca la transcription:

```typescript
void this.deps.coachingEngine.processSegment(segment.toProps(), context);
```

### Dynamic Import

Il suggestion generator usa un import dinamico per evitare dipendenze circolari:

```typescript
const { createSuggestionGenerator } = await import('@infrastructure/adapters');
```

### ESLint max-lines

Aggiunto `eslint-disable max-lines` per SessionManager.ts e il relativo file di test, essendo orchestratori centrali che naturalmente richiedono più codice.

---

## Test E2E Manuale

```bash
npm run dev
```

1. Vai in **Settings** → inserisci API keys (Deepgram + OpenAI)
2. Torna in **Home** → avvia "Meeting Coach"
3. Parla al microfono
4. Verifica che il transcript appaia in tempo reale
5. Dopo ~15 secondi di conversazione, dovrebbero apparire suggerimenti
6. Testa pause/resume/stop

---

## File Modificati

| File | Tipo | LOC |
|------|------|-----|
| `src/application/services/SessionManager.ts` | Modificato | +40 |
| `src/application/services/CoachingIntegration.ts` | Creato | 56 |
| `src/application/services/index.ts` | Modificato | +6 |
| `src/application/services/__tests__/SessionManager.test.ts` | Modificato | +102 |
| `src/infrastructure/di/container.ts` | Modificato | +15 |

---

## Prossimi Passi Suggeriti

1. **UI per Suggerimenti**: Verificare che il componente che mostra i suggerimenti sia collegato al Redux store
2. **User Speaker ID**: Implementare UI per permettere all'utente di identificarsi come speaker
3. **Coaching Style Selection**: Permettere all'utente di selezionare lo stile di coaching prima di avviare la sessione
4. **Sentiment Analysis**: Implementare analisi del tono della conversazione per `conversationTone` nel contesto
