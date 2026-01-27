# User Stories Dettagliate - MyCoachPilot Free

## 1. Conversation Mode - Voice Session Management

### US-001: Start Real-Time Voice Session
**Come** utente
**Voglio** avviare una sessione vocale real-time con l'AI
**In modo che** possa ricevere coaching istantaneo tramite voice

**Pre-condizioni:**
- Valid OpenAI API key configurata in settings
- Template selezionato (system o custom)
- Browser supporta WebRTC (Chrome 90+, Edge 90+)
- Permesso microfono garantito

**Post-condizioni:**
- Connessione WebRTC stabilita a OpenAI Realtime API
- Session ID generato e salvato
- Audio microfono in streaming attivo
- UI mostra status "Connected" con timer sessione
- Timeout inattività (30 min) avviato

**Criteri di Accettazione:**
- AC1: Sessione avvia entro 3 secondi dal click
- AC2: Toast notification "Connected! Microphone active." visualizzato
- AC3: System message "--- Realtime session started ---" aggiunto alla chat
- AC4: Session ID format: `realtime-{timestamp}`
- AC5: Token effimero acquisito da `/api/realtime/token` con 60s expiry

**Edge Cases:**
- API key mancante → Errore "Please configure your OpenAI API Key in Settings"
- API key invalida → Errore "Failed to get session token"
- No permesso microfono → Browser native permission prompt
- Doppio click start → Ignorato con `isStarting` guard flag

**Priority:** P0

---

### US-002: Stop Active Voice Session
**Come** utente
**Voglio** fermare la sessione vocale attiva
**In modo che** possa terminare la conversazione e salvare risorse

**Pre-condizioni:**
- Sessione attiva running (`isSessionActive === true`)
- Oggetto session valido esistente

**Post-condizioni:**
- Tutti i WebRTC tracks fermati
- Connessioni WebSocket chiuse
- Audio mixer pulito (se tab audio attivo)
- Sessione auto-salvata in history (se messaggi > 0)
- UI mostra marker "Session ended"

**Criteri di Accettazione:**
- AC1: Sessione ferma entro 1 secondo
- AC2: Tutti media tracks propriamente disposed (no memory leaks)
- AC3: System message "--- Session ended ---" appended
- AC4: Sessione auto-saved a localStorage history
- AC5: Timeout inattività cleared

**Edge Cases:**
- Sessione già fermata → No-op, nessun errore
- Errore cleanup durante stop → Logged, session comunque marked inactive
- Browser chiuso mid-session → Next visit mostra session come ended

**Priority:** P0

---

### US-003: Send Text Message Durante Voice Session
**Come** utente
**Voglio** inviare messaggi testuali durante conversazione vocale
**In modo che** possa fornire input scritto quando voice non è adatto

**Pre-condizioni:**
- Sessione attiva running
- `currentSession.session` disponibile con metodo `sendMessage`

**Post-condizioni:**
- User message aggiunto a UI immediatamente
- Message inviato a OpenAI via `session.sendMessage()`
- AI risponde via voice o text based on config
- Timer inattività resettato

**Criteri di Accettazione:**
- AC1: Messaggi empty/whitespace-only rigettati
- AC2: Message appare in UI entro 100ms
- AC3: Max 100 messages stored (older messages dropped)
- AC4: Message format: `{ role: 'user', content: string }`
- AC5: Failed send mostra toast error "Failed to send text message"

**Edge Cases:**
- Session not ready → Toast "Connection not ready"
- Message durante connection loss → Error toast, message queued
- Messaggio molto lungo (>5000 chars) → Troncato con warning

**Priority:** P1

---

## 2. Transcript Only Mode

### US-004: Enable Unlimited Transcription Mode
**Come** utente
**Voglio** usare modalità transcription-only senza risposte AI
**In modo che** possa prendere note durante meeting senza consumare conversation tokens

**Pre-condizioni:**
- OpenAI API key configurata
- Mode set a `transcript_only` in settings

**Post-condizioni:**
- Native WebSocket connection a `wss://api.openai.com/v1/realtime?intent=transcription`
- Audio streaming come PCM16 a 24kHz
- Transcripts appaiono in UI come messaggi `role: 'transcript'`
- Nessuna risposta AI generata

**Criteri di Accettazione:**
- AC1: Usa model `gpt-4o-mini-transcribe` (lower cost)
- AC2: Server VAD enabled (threshold: 0.5, silence: 500ms)
- AC3: Transcripts mostrano confidence scores
- AC4: Session configuration inviata: `{ type: 'transcription', audio: {...} }`
- AC5: Toast mostra "Microphone listening (Transcript Mode)"

**Edge Cases:**
- Transcript confidence < 0.3 → Comunque displayed ma marcato uncertain
- Silenzio lungo (>5s) → No action, waiting for speech
- WebSocket close (code 1000) → Clean shutdown, logged as info not error

**Priority:** P1

---

## 3. Meeting Coach Mode

### US-005: Start Meeting Coach Session con Tab Audio
**Come** utente
**Voglio** catturare e trascrivere audio da browser tab durante meetings
**In modo che** possa ricevere suggerimenti coaching real-time

**Pre-condizioni:**
- Deepgram API key configurata
- Meeting Coach mode selezionata
- Browser supporta `getDisplayMedia` con audio (Chrome 90+)

**Post-condizioni:**
- Tab audio stream catturato via `getDisplayMedia`
- Deepgram WebSocket connesso
- Trascrizione real-time attiva con speaker diarization
- Coaching suggestions generate basate su transcript context

**Criteri di Accettazione:**
- AC1: Browser mostra native "Share tab audio" dialog
- AC2: Audio tracks validated (length > 0)
- AC3: Deepgram features: `diarize=true, punctuate=true, interim_results=true`
- AC4: Sample rate: 16kHz mono per Deepgram
- AC5: Prima suggestion appare entro 15s di meaningful dialogue

**Edge Cases:**
- User unchecks "Share tab audio" → Error "No audio track captured"
- Permission denied → Toast "Permission denied. Please allow tab sharing."
- Tab chiuso durante session → `ended` event triggers cleanup
- Deepgram connection timeout → Error dopo 10s, mostra retry option

**Priority:** P1

---

### US-006: Identify User Speaker in Multi-Speaker Transcript
**Come** utente
**Voglio** identificare quale speaker sono io nel transcript
**In modo che** coaching suggestions siano contestuali al mio speaking

**Pre-condizioni:**
- Meeting Coach session attiva
- Multiple speakers detected (Deepgram diarization)
- Transcript segments showing different speaker IDs

**Post-condizioni:**
- Selected speaker marcato come `isUser: true` in speakers array
- Speaker label cambia a "Tu" (You)
- Future coaching suggestions focus su user's speech patterns

**Criteri di Accettazione:**
- AC1: Speaker identification UI mostra dopo 2+ speakers detected
- AC2: Selection persiste per session duration
- AC3: Speaker stats aggiornate (word count per speaker)
- AC4: Suggestion context include "You said: ..."
- AC5: Selection stored in session state

**Edge Cases:**
- Solo 1 speaker → Auto-identify come user
- User switches mid-session → Update tutti future segments
- Speaker re-identification → Previous segments non retroattivamente changed

**Priority:** P2

---

## 4. Session History Management

### US-007: Auto-Save Session a History on End
**Come** utente
**Voglio** che sessioni siano automaticamente salvate quando finiscono
**In modo che** possa revieware conversazioni passate senza azione manuale

**Pre-condizioni:**
- Session attiva con `sessionId`, `sessionStartTime`, e messages
- Session transitions da active a inactive
- localStorage available

**Post-condizioni:**
- Session salvata a localStorage sotto `session_history` key
- Session include: messages, duration, mode, title, timestamp
- Preview aggiunto a history drawer
- Max 20 sessions enforced (oldest deleted)

**Criteri di Accettazione:**
- AC1: System messages filtrati out ("--- Realtime session started ---")
- AC2: Empty sessions (0 content messages) non salvate
- AC3: Title auto-generated da primo user/transcript message (max 50 chars)
- AC4: Duration calcolata in secondi
- AC5: Toast "Session saved to history" displayed

**Edge Cases:**
- localStorage full (quota exceeded) → Error toast "Cannot save session"
- No messages → Skipped, logged "Session not saved: no content messages"
- Duplicate sessionId → Update existing entry invece di creating new

**Priority:** P1

---

### US-008: Resume Previous Session con Context
**Come** utente
**Voglio** riprendere conversazione precedente da history
**In modo che** possa continuare dove left off con context

**Pre-condizioni:**
- Session history esiste con saved sessions
- No active session running (`canResumeSession === true`)
- Valid session selected from history

**Post-condizioni:**
- Previous messages loaded into current chat
- Resume banner displayed con original session info
- Context summary injected in AI instructions (max 2000 chars)
- User può start new session to continue conversation

**Criteri di Accettazione:**
- AC1: Resume banner mostra: original title, date, message count
- AC2: Context include last 10 messages da original session
- AC3: System message "--- Resumed from previous session ---"
- AC4: Toast "Session resumed! Start a new session to continue."
- AC5: Resume context cleared after first new session starts

**Edge Cases:**
- Resume durante active session → Button disabled
- Context too large (>2000 chars) → Truncated to fit
- Original session deleted → Error "Session not found"

**Priority:** P2

---

### US-009: Export Session come JSON
**Come** utente
**Voglio** exportare session come JSON file
**In modo che** possa backup, share, o analyze conversations externally

**Pre-condizioni:**
- Valid session in history con messages
- Browser supports Blob download

**Post-condizioni:**
- JSON file downloaded: `session-{sessionId}-{date}.json`
- File contiene: sessionId, startedAt, endedAt, duration, mode, messages, title

**Criteri di Accettazione:**
- AC1: File size < 5MB for performance
- AC2: JSON formatted con 2-space indentation
- AC3: Filename format: `session-12345678-2026-01-27.json`
- AC4: Toast "Session exported" on success
- AC5: Tutti message roles preserved (user, assistant, transcript, system, log)

**Edge Cases:**
- Very large session (1000+ messages) → May take 2-3 seconds
- Export failure → Toast "Failed to export session"
- No session selected → No-op

**Priority:** P2

---

## 5. Multimodal Capture Features

### US-010: Capture e Analyze Screenshot
**Come** utente
**Voglio** prendere screenshot e avere AI analysis
**In modo che** possa ricevere visual feedback durante conversations

**Pre-condizioni:**
- Active session running
- `getDisplayMedia` supported

**Post-condizioni:**
- Screenshot captured come data URL (PNG)
- Image inviato ad AI con prompt "Analyze this screenshot"
- AI response appare in chat
- Capture indicator shown durante process

**Criteri di Accettazione:**
- AC1: Capture completes entro 2 seconds
- AC2: Image compressed a < 1MB before sending
- AC3: System message include thumbnail preview
- AC4: AI analyzes image content e provides insights
- AC5: Error handling for permission denied

**Edge Cases:**
- Permission denied → Toast "Permission denied"
- Capture timeout → Error dopo 10s
- Image too large → Compressed or rejected
- Realtime mode → Warning "Image uploads not supported in Realtime mode"

**Priority:** P2

---

### US-011: Upload Image o PDF per Analysis
**Come** utente
**Voglio** uploadare image o PDF file
**In modo che** possa ricevere AI analysis di documenti e images

**Pre-condizioni:**
- Active session running
- File < 10MB
- Supported format: image/* o .pdf

**Post-condizioni:**
- File convertito a base64 data URL
- Inviato ad AI con analysis prompt
- Processing indicator shown
- AI response in chat

**Criteri di Accettazione:**
- AC1: File input accepts `image/*,.pdf`
- AC2: Mobile camera capture enabled (`capture="environment"`)
- AC3: Processing message shown durante upload
- AC4: File validated for size and type
- AC5: Multiple files handled sequentially

**Edge Cases:**
- File too large (>10MB) → Error "File too large"
- Unsupported format → Error "Unsupported file type"
- Corrupted file → Error durante processing
- Realtime mode → Show warning, feature disabled

**Priority:** P2

---

### US-012: Capture Tab Audio con Microphone Mixing
**Come** utente
**Voglio** mixare browser tab audio con my microphone
**In modo che** possa avere AI process sia my voice che meeting audio

**Pre-condizioni:**
- Tab audio capture initiated
- Microphone permission granted
- Both streams have active audio tracks

**Post-condizioni:**
- AudioContext creates mixed stream
- Both audio sources processed simultaneously
- Mixed stream sent to OpenAI/Deepgram
- UI shows "with tab audio" indicator

**Criteri di Accettazione:**
- AC1: Mixed stream ha single audio track (mono)
- AC2: Sample rates synchronized (24kHz o 16kHz)
- AC3: Session message "Realtime session started (with tab audio)"
- AC4: Toast "Connected! Microphone + Tab audio active."
- AC5: Both sources cleanly disposed on session end

**Edge Cases:**
- Tab audio stops mid-session → Continue con mic only
- Mic access denied dopo tab audio → Error, cleanup tab stream
- Sample rate mismatch → Resampling applied
- Audio context suspended → Resume on user interaction

**Priority:** P2

---

## 6. Configuration & Customization

### US-013: Configure AI Assistant Settings
**Come** utente
**Voglio** configurare API keys, mode, e templates
**In modo che** possa customize AI behavior for my needs

**Pre-condizioni:**
- Settings page accessible
- localStorage available

**Post-condizioni:**
- Configuration saved a localStorage sotto `ai_config` key
- Settings immediately apply a new sessions
- Validation passed for required fields

**Criteri di Accettazione:**
- AC1: OpenAI API key masked come password field
- AC2: Conversation mode requires template selection
- AC3: Transcript mode bypasses template requirement
- AC4: Meeting Coach requires Deepgram key
- AC5: Toast "Configuration saved locally!" on success

**Edge Cases:**
- Invalid API key format → Caught on first session attempt
- Missing required field → Validation error before save
- localStorage full → Error "Cannot save configuration"
- Concurrent tab editing → Last save wins

**Priority:** P0

---

### US-014: Create e Manage Custom Templates
**Come** utente
**Voglio** creare custom instruction templates
**In modo che** possa avere specialized AI coaching for different scenarios

**Pre-condizioni:**
- Settings page open
- Template editor accessible

**Post-condizioni:**
- Custom template saved a localStorage sotto `custom_templates` key
- Template appare in template selector
- Template include: id, name, description, system_prompt, createdAt

**Criteri di Accettazione:**
- AC1: Template name required (max 100 chars)
- AC2: Description optional (max 500 chars)
- AC3: System prompt required (max 5000 chars)
- AC4: Template ID auto-generated (UUID format)
- AC5: Templates persisted across sessions

**Edge Cases:**
- Duplicate template name → Allowed (ID is unique)
- Very long system prompt → Truncated at 5000 chars
- Delete predefined template → Not allowed
- Export/import templates → JSON format

**Priority:** P2

---

## 7. Error Handling & Recovery

### US-015: Handle Network Disconnection Gracefully
**Come** utente
**Voglio** che app handle network failures gracefully
**In modo che** capisco cosa happened e posso recover

**Pre-condizioni:**
- Active session running
- Network connection lost

**Post-condizioni:**
- WebSocket close event detected
- Session marked come inactive
- Error message displayed to user
- Cleanup routines executed

**Criteri di Accettazione:**
- AC1: WebSocket close code logged (1000=clean, 1006=abnormal)
- AC2: Clean close → Info log, no error UI
- AC3: Abnormal close → Error toast con reconnect suggestion
- AC4: All resources cleaned up (no memory leaks)
- AC5: User può retry by clicking "Start Session" again

**Edge Cases:**
- Intermittent connection → Multiple reconnects handled gracefully
- Server rate limit (429) → Error "Rate limit exceeded, wait 60s"
- Invalid credentials (401) → Error "Invalid API key"
- Server error (500) → Error "OpenAI service unavailable"

**Priority:** P0

---

**Documento redatto per**: Riprogettazione architettura MyCoachPilot Free
**Data**: 2026-01-27
**Versione**: 1.0
