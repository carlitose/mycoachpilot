# Speaker Diarization Research - Problemi e Limitazioni

## Data: 2026-01-29

## Problema Riscontrato

La speaker identification nel `meeting_coach` mode non funziona correttamente. Quasi tutti i segmenti audio vengono attribuiti a "Speaker 0" anche quando ci sono chiaramente 2+ speaker diversi.

**Output attuale:**
```
[Speaker 0] My name Noel Miller, and I'm here with    <- Intervistatore
[Speaker 0] I'm Moss in.                              <- Intervistato (SBAGLIATO!)
[Speaker 0] How has your student involvement...       <- Intervistatore
[Speaker 0] has helped with, like, myself...          <- Intervistato (SBAGLIATO!)
[Speaker 1] stuff and having my priority straight.    <- Solo 1 corretto su ~8
```

---

## Ricerca Effettuata

### 1. Deepgram - Problemi Noti con Streaming Diarization

**Fonti:**
- [GitHub Discussion #108](https://github.com/orgs/deepgram/discussions/108) - "Diarization always returns speaker 0"
- [GitHub Discussion #1127](https://github.com/orgs/deepgram/discussions/1127) - "Speaker labels inaccurate in streaming"
- [GitHub Discussion #584](https://github.com/orgs/deepgram/discussions/584) - Multipli utenti confermano il problema

**Risposta ufficiale Deepgram:**
> "Our product team has been discussing improving it in 2025, but I don't have an ETA yet"

**Workaround suggeriti dalla community:**
- Usare modello `nova-2-meeting` invece di `nova-2` generico
- Usare audio multichannel (1 canale per speaker)
- Usare pre-recorded API invece di streaming (53% più accurata)

### 2. Pre-recorded API vs Streaming

| Caratteristica | Streaming | Pre-recorded |
|----------------|-----------|--------------|
| Diarization accuracy | Bassa | Alta (53% migliore) |
| Real-time feedback | Si | No |
| Speaker confidence | No | Si |
| Max speakers | Limitato | 16+ testati |

### 3. AssemblyAI - Stessa Limitazione

AssemblyAI ha lo stesso problema per lo streaming:

> "Streaming diarization can be accomplished by using **multichannel audio** (i.e., an audio stream for each speaker)"

**Fonte:** [AssemblyAI Docs - Multichannel Streams](https://www.assemblyai.com/docs/universal-streaming/multichannel-streams)

---

## Conclusione: Limitazione Fondamentale

**Il problema NON è nel nostro codice** - è una limitazione fondamentale della tecnologia:

1. **Streaming + Audio Mono** = Diarization scarsa (tutti i provider)
2. **Streaming + Audio Multichannel** = Diarization funziona (serve 1 mic per speaker)
3. **Pre-recorded + Audio Mono** = Diarization accurata (ma non real-time)

---

## Opzioni Disponibili

### Opzione A: Quick Fix - Prova `nova-2-meeting`
- **Effort**: Basso (cambio 1 parametro)
- **Risultato atteso**: Potrebbe migliorare, non garantito
- **File da modificare**: `src/cli/adapters/NodeDeepgramAdapter.ts`

```typescript
model: 'nova-2-meeting',  // invece di default
```

### Opzione B: Setup Multichannel
- **Effort**: Medio (richiede hardware + code changes)
- **Risultato atteso**: Funzionerebbe bene
- **Requisiti**: 2 microfoni separati, audio stereo
- **Limitazione**: Non sempre pratico in scenari reali

### Opzione C: Hybrid (File = Pre-recorded, Live = Streaming)
- **Effort**: Alto (nuovo adapter per pre-recorded API)
- **Risultato atteso**: File con diarization accurata, live con limitazioni
- **Note**: Utile solo per testing/debugging con file

### Opzione D: Accettare il Limite
- **Effort**: Zero
- **Risultato**: Coaching basato solo sul contenuto, senza distinguere speaker
- **Note**: Il coaching può comunque funzionare analizzando il contenuto

---

## Configurazione Attuale Deepgram

```typescript
// src/cli/adapters/NodeDeepgramAdapter.ts
const params = new URLSearchParams({
  encoding: 'linear16',
  sample_rate: '16000',
  channels: '1',
  punctuate: 'true',
  diarize: 'true',           // Abilitato
  interim_results: 'true',
  endpointing: '300',        // Raccomandato (300-500ms)
  utterance_end_ms: '1000',  // Minimo consentito
});
// NOTA: Nessun modello specificato = usa default
```

---

## Raccomandazione

Data la natura del problema (limitazione di tutti i provider), suggeriamo:

1. **Breve termine**: Provare `nova-2-meeting` come quick fix
2. **Medio termine**: Valutare se il coaching può funzionare senza speaker identification
3. **Lungo termine**: Monitorare aggiornamenti da Deepgram/AssemblyAI nel 2025-2026

---

## Link Utili

- [Deepgram Diarization Docs](https://developers.deepgram.com/docs/diarization)
- [Deepgram Improved Diarization Changelog](https://deepgram.com/changelog/improved-speaker-diarization)
- [AssemblyAI Speaker Diarization](https://www.assemblyai.com/docs/speech-to-text/speaker-diarization)
- [AssemblyAI vs Deepgram Comparison](https://www.assemblyai.com/blog/deepgram-alternatives)
