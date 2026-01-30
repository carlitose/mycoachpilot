# Requisiti di Sistema - MyCoachPilot Free

## 1. Introduzione

MyCoachPilot Free è un'applicazione web per coaching conversazionale AI real-time tramite voice. Il sistema deve supportare tre modalità operative principali: conversazione bidirezionale, trascrizione pura, e coaching per riunioni con identificazione speaker.

Questo documento definisce i requisiti funzionali, non funzionali e i vincoli del sistema per una riprogettazione completa dell'architettura.

---

## 2. Requisiti Funzionali

### RF-1: Modalità Operative

#### RF-1.1: Conversation Mode
Il sistema deve permettere conversazioni vocali bidirezionali real-time con l'AI assistant:
- Input audio dall'utente tramite microfono
- Risposta vocale dall'AI in tempo reale
- Latenza ultra-bassa (sub-secondo)
- Supporto per interruzioni naturali durante la conversazione
- Possibilità di inviare messaggi testuali durante la sessione attiva

#### RF-1.2: Transcript Only Mode
Il sistema deve supportare modalità solo trascrizione:
- Trascrizione continua dell'audio utente senza risposte AI
- Utilizzo illimitato (modalità "free forever")
- Display in tempo reale del testo trascritto
- Conservazione del transcript nella history

#### RF-1.3: Meeting Coach Mode
Il sistema deve fornire coaching real-time per riunioni:
- Identificazione automatica degli speaker (speaker diarization)
- Trascrizione in tempo reale con timing preciso
- Generazione di suggerimenti AI contestuali basati sulla conversazione
- Visualizzazione simultanea di: speaker panel, transcript, e suggerimenti
- Possibilità di etichettare manualmente gli speaker identificati
- Tracking delle metriche per speaker (word count, segmenti, tempo di parola)

### RF-2: Gestione Sessioni

#### RF-2.1: Ciclo di Vita Sessione
Il sistema deve gestire il ciclo di vita completo delle sessioni:
- Avvio sessione con configurazione personalizzata
- Pausa e ripresa della sessione
- Terminazione manuale o automatica (timeout)
- Timeout per inattività configurabile (default: 30 minuti)
- Pulizia risorse alla chiusura

#### RF-2.2: Session History
Il sistema deve salvare automaticamente le sessioni completate:
- Salvataggio automatico al termine della sessione
- Visualizzazione lista sessioni storiche con metadata (data, durata, modalità)
- Ricerca e filtro sessioni per modalità e data
- Limite massimo di sessioni salvate (es: 20-50)
- Auto-cleanup sessioni più vecchie di N giorni

#### RF-2.3: Resume Conversations
Il sistema deve permettere di riprendere conversazioni precedenti:
- Caricamento messaggi da sessione storica
- Injection del contesto conversazionale nella nuova sessione
- Indicazione visuale che la sessione è ripresa
- Possibilità di continuare la conversazione con awareness del contesto precedente

### RF-3: Cattura Multimodale

#### RF-3.1: Screen Capture & Analysis
Il sistema deve supportare cattura e analisi di screenshot:
- Cattura desktop/finestra/tab via API browser
- Analisi visuale dello screenshot tramite AI
- Invio dello screenshot e risultati analisi al contesto conversazionale
- Supporto per screenshot multipli in una sessione

#### RF-3.2: File Upload
Il sistema deve accettare upload di file:
- Upload di immagini (JPG, PNG, etc.)
- Upload di documenti PDF
- Analisi contenuto tramite AI
- Integrazione file nel contesto conversazionale

#### RF-3.3: Tab Audio Capture
Il sistema deve catturare audio da tab browser:
- Cattura audio da tab specifico (escluso system audio)
- Mixing audio microfono + audio tab
- Supporto per browser compatibili (Chrome/Edge)
- Indicazione visuale stato cattura audio
- Guida per l'utente su come abilitare la funzionalità

### RF-4: Personalizzazione e Configurazione

#### RF-4.1: Template System
Il sistema deve supportare template di istruzioni AI:
- Template predefiniti per scenari comuni:
  - General Assistant
  - Interview Coach (STAR method)
  - Sales Coach (objection handling)
  - Presentation Coach (engagement e delivery)
  - Meeting Coach generico
- Creazione template personalizzati dall'utente
- Modifica e cancellazione template custom
- Selezione template attivo per nuova sessione

#### RF-4.2: Custom Instructions
Il sistema deve permettere istruzioni personalizzate:
- Campo di testo libero per istruzioni aggiuntive
- Append delle istruzioni custom al template selezionato
- Persistenza delle istruzioni tra sessioni

#### RF-4.3: Coaching Styles (Meeting Coach)
Il sistema deve supportare stili di coaching differenti:
- **Diplomatic**: Suggerimenti gentili e incoraggianti
- **Assertive**: Suggerimenti diretti e action-oriented
- **Analytical**: Suggerimenti data-driven con reasoning
- Modifica dello stile applicata al system prompt

#### RF-4.4: API Key Management
Il sistema deve gestire chiavi API esterne:
- Input e salvataggio API key OpenAI
- Input e salvataggio API key Deepgram (per Meeting Coach)
- Validazione API key prima dell'uso
- Storage sicuro delle chiavi

### RF-5: Export e Condivisione

#### RF-5.1: Export Conversazioni
Il sistema deve permettere export delle conversazioni:
- Export in formato JSON (completo)
- Export in formato TXT (human-readable)
- Download file locale
- Preservazione di metadata (timing, speaker, mode)

#### RF-5.2: Copy & Share
Il sistema deve permettere copia di contenuti:
- Copia singolo messaggio
- Copia transcript completo
- Copia suggerimenti AI (Meeting Coach)

### RF-6: User Experience

#### RF-6.1: Onboarding Tour
Il sistema deve fornire tour guidato per nuovi utenti:
- Tour interattivo in 6 step
- Highlight di feature chiave (Play, Settings, Templates, History)
- Possibilità di skippare il tour
- Tracking completamento onboarding

#### RF-6.2: Empty State
Il sistema deve mostrare stato iniziale informativo:
- Call-to-action chiaro per iniziare
- Quick tips sulle feature principali
- Link a documentazione/guida

#### RF-6.3: Picture-in-Picture
Il sistema deve supportare finestra floating per transcript:
- Apertura finestra PiP con transcript in tempo reale
- Aggiornamento automatico durante sessione
- Supporto browser con API PiP (Chrome 116+)

#### RF-6.4: Mobile Support
Il sistema deve funzionare su mobile:
- Responsive design per schermi piccoli
- Menu mobile con accesso a feature principali
- Adattamento UI per touch input

### RF-7: Gestione Messaggi

#### RF-7.1: Message Display
Il sistema deve visualizzare messaggi in formato conversazionale:
- Distinzione visuale per ruolo (user, assistant, system, log, transcript)
- Timestamp per ogni messaggio
- Scroll automatico ai nuovi messaggi
- Indicatori di stato (typing, processing)

#### RF-7.2: Message Actions
Il sistema deve permettere azioni sui messaggi:
- Copia messaggio singolo
- Cancellazione messaggio singolo
- Clear all messages
- Conteggio messaggi nella sessione

#### RF-7.3: Special Features
Il sistema deve supportare feature avanzate:
- "Think" process: AI analizza contesto conversazione e fornisce insights
- Confidence scores per transcript (Meeting Coach)
- Speaker attribution nei messaggi (Meeting Coach)

---

## 3. Requisiti Non Funzionali

### RNF-1: Performance

#### RNF-1.1: Latenza Voice
- Latenza end-to-end < 500ms per conversation mode
- Audio streaming real-time senza buffering percepibile
- Response time AI < 2 secondi dall'inizio input vocale

#### RNF-1.2: Transcript Real-time
- Transcript display con latency < 1 secondo
- Update UI smooth senza lag visibili
- Gestione flusso audio continuo senza drop

#### RNF-1.3: Scalabilità UI
- Gestione fino a 1000+ messaggi in una sessione senza degrado performance
- Scroll performante con liste lunghe
- Limite messaggi visualizzati (es: max 100) con paginazione o windowing

### RNF-2: Usabilità

#### RNF-2.1: Intuitività
- Interface self-explanatory senza necessità di manuale
- Feedback visuale immediato per tutte le azioni utente
- Error messages chiari e actionable

#### RNF-2.2: Accessibilità
- Supporto screen readers per utenti non vedenti
- Keyboard navigation completo
- ARIA labels appropriati
- Contrasto colori conforme WCAG 2.1 AA

#### RNF-2.3: Responsive Design
- Layout adattivo per desktop (1920x1080 → 1024x768)
- Layout mobile (375x667 → 428x926)
- Breakpoint intermedi per tablet

### RNF-3: Affidabilità

#### RNF-3.1: Error Handling
- Gestione graceful di errori di rete
- Retry automatico con exponential backoff
- Fallback quando feature non supportate (es: tab audio)
- Nessun crash dell'app per errori API

#### RNF-3.2: Data Persistence
- Auto-save sessioni senza intervento utente
- Persistenza configurazioni tra sessioni
- Recovery da unexpected logout

#### RNF-3.3: Browser Compatibility
- Supporto completo: Chrome 90+, Edge 90+
- Supporto parziale: Firefox 90+ (tab audio limitato)
- Safari supporto base (WebRTC compatibility)

### RNF-4: Sicurezza

#### RNF-4.1: API Key Security
- Storage sicuro delle API keys (encryption client-side)
- Nessun log delle API keys in console/network
- Token effimeri per comunicazione con OpenAI
- Nessuna trasmissione API key a backend (eccetto per token generation)

#### RNF-4.2: Data Privacy
- Nessun tracking utente senza consenso
- Nessuna condivisione dati con terze parti
- Storage locale dei dati conversazionali

### RNF-5: Manutenibilità

#### RNF-5.1: Code Quality
- Type safety con TypeScript
- Linting automatico (ESLint)
- Test coverage > 60% per logica business critical
- Documentazione inline per funzioni complesse

#### RNF-5.2: Modularità
- Separazione netta tra UI e logica business
- Hook riutilizzabili per feature comuni
- Componenti UI modulari e composibili

---

## 4. Vincoli

### V-1: Vincoli Tecnologici

#### V-1.1: Framework e Linguaggi
- **Framework**: Next.js 15+ con App Router
- **Linguaggio**: TypeScript 5+
- **Styling**: Tailwind CSS
- **Package Manager**: npm

#### V-1.2: Browser APIs Required
- WebRTC (RTCPeerConnection) per audio real-time
- WebSocket per comunicazione bidirezionale
- Web Audio API per audio processing
- Screen Capture API (getDisplayMedia)
- Media Devices API (getUserMedia)
- localStorage per persistenza client-side

#### V-1.3: Deployment
- Architettura standalone (no backend required oltre token endpoint)
- Docker-ready per self-hosting
- Hosting statico compatibile (Vercel, Netlify, etc.)

### V-2: Vincoli API Esterne

#### V-2.1: OpenAI Realtime API
- Modello: gpt-4o-realtime-preview o successivi
- Audio format: PCM16 @ 24kHz
- Token effimeri con TTL limitato
- Rate limits: secondo limiti account OpenAI

#### V-2.2: Deepgram API (Meeting Coach)
- WebSocket connection per streaming audio
- Audio format: PCM16 @ 16kHz
- Speaker diarization support
- Rate limits: secondo piano Deepgram

### V-3: Vincoli Storage

#### V-3.1: localStorage Limits
- Limite browser: ~5-10MB per domain
- Gestione quota exceeded con graceful degradation
- Auto-cleanup sessioni vecchie quando quota raggiunta

#### V-3.2: Session Limits
- Max 20-50 sessioni salvate (configurabile)
- Auto-cleanup sessioni > 90 giorni
- Priorità: sessioni più recenti

### V-4: Vincoli Business

#### V-4.1: Open Source
- Licenza Apache 2.0
- No paywall per feature base
- Transcript Only mode completamente free

#### V-4.2: API Keys
- Utente responsabile per own API keys
- Nessun rate limiting app-level (solo API limits)
- No backend tracking usage (open source version)

### V-5: Vincoli Browser

#### V-5.1: Feature Support
- Tab audio capture: Solo Chrome/Edge con flag abilitati
- Picture-in-Picture: Chrome 116+, Edge 116+
- WebRTC: Tutti i browser moderni
- Speaker diarization: Dipende da Deepgram, non browser

#### V-5.2: Permissions
- Microphone access richiesta per voice features
- Screen capture permission richiesta per screenshot
- Tab audio capture permission richiesta per tab audio

---

## 5. User Stories Principali

### US-1: Conversazione Voice Base
**Come** utente
**Voglio** avere una conversazione vocale con l'AI assistant
**In modo che** possa ricevere coaching real-time senza digitare

**Criteri di Accettazione:**
- Posso premere Play e iniziare a parlare
- L'AI mi risponde in < 2 secondi
- La conversazione è naturale con interruzioni supportate
- Posso fermare la sessione in qualsiasi momento

### US-2: Trascrizione Illimitata
**Come** utente free
**Voglio** trascrivere riunioni/conversazioni indefinitamente
**In modo che** possa usare il tool gratis senza limiti

**Criteri di Accettazione:**
- Posso attivare modalità Transcript Only
- Nessun limite di tempo o numero sessioni
- Transcript accurato in tempo reale
- Posso salvare ed esportare il transcript

### US-3: Coaching Riunioni
**Come** professionista in riunione
**Voglio** ricevere suggerimenti AI in tempo reale
**In modo che** possa migliorare la mia comunicazione durante la call

**Criteri di Accettazione:**
- Posso catturare audio della riunione
- Gli speaker sono identificati automaticamente
- Ricevo suggerimenti contestuali quando utili
- Posso vedere transcript e suggerimenti simultaneamente

### US-4: Resume Conversazione
**Come** utente che torna dopo giorni
**Voglio** riprendere una conversazione precedente
**In modo che** l'AI ricordi il contesto

**Criteri di Accettazione:**
- Vedo lista sessioni precedenti
- Posso selezionare una sessione e "Resume"
- La nuova sessione ha awareness del contesto precedente
- Vedo indicazione che sto continuando una vecchia chat

### US-5: Analisi Screenshot
**Come** utente che discute design/code
**Voglio** condividere screenshot con l'AI
**In modo che** possa ricevere feedback visuale

**Criteri di Accettazione:**
- Posso catturare screenshot durante sessione attiva
- L'AI analizza l'immagine e risponde
- Lo screenshot appare nel transcript
- Posso fare screenshot multipli

---

## 6. Priorità Feature (per Riprogettazione)

### P0 (Must Have - MVP)
- Conversation Mode base
- Transcript Only Mode
- Session lifecycle management
- Message display
- API key configuration
- Template system base (General Assistant)
- Session history (save/load)
- Export JSON/TXT

### P1 (Should Have - V1)
- Meeting Coach Mode
- Speaker identification
- AI suggestions real-time
- Screen capture & analysis
- File upload
- Resume conversations
- Custom templates CRUD
- Onboarding tour

### P2 (Nice to Have - V2)
- Tab audio capture
- Picture-in-Picture
- Mobile responsive
- Advanced search history
- Coaching style modifiers
- Analytics dashboard
- Multi-language transcript

### P3 (Future)
- Video analysis
- Real-time collaboration
- Cloud sync sessioni
- Advanced AI tools (code analysis, deep thinking)
- Integration con calendar
- Speaker voice profiles

---

## 7. Metriche di Successo

### Metriche Tecniche
- Latency voice < 500ms (95th percentile)
- Transcript accuracy > 95%
- Uptime > 99.5%
- Error rate < 1%

### Metriche Usabilità
- Onboarding completion rate > 70%
- Time to first session < 3 minutes
- Session resume rate > 30%
- Feature adoption (screenshot, file upload) > 40%

### Metriche Business (se applicabile)
- User retention D7 > 30%
- Average session duration > 10 minuti
- NPS > 40

---

## 8. Note per Implementazione Futura

Questo documento è volutamente agnostico rispetto all'implementazione. Durante la fase di design architetturale si dovranno prendere decisioni su:

1. **State Management**: Hook locali vs Zustand/Redux
2. **WebSocket Management**: SDK vendor vs custom implementation
3. **Audio Processing**: Web Audio API vs AudioWorklet
4. **Storage**: localStorage vs IndexedDB vs cloud sync
5. **Testing Strategy**: Unit + Integration + E2E coverage
6. **Performance Optimization**: Lazy loading, code splitting, memoization
7. **Error Boundaries**: Strategie di fallback e recovery
8. **Logging & Monitoring**: Sentry, LogRocket, custom analytics

---

**Documento redatto per**: Riprogettazione architettura MyCoachPilot Free
**Data**: 2026-01-27
**Versione**: 1.0
