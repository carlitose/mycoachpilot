# Sessione 28 Gennaio 2026 - Fix CLI Transcript Output

## Obiettivo

Correggere il comando CLI che non mostrava output transcript:
```bash
npm run cli -- session start --mode transcript_only --audio-file src/cli/__tests__/integration/fixtures/test-speech.wav
```

---

## Problema Originale

Il comando avviava la sessione correttamente ma **non mostrava mai il transcript** dell'audio.

### Sintomo
```
Starting transcript_only session...
Session started
Session active. Press Ctrl+C to stop.
```
Nessun output "You: ..." nonostante il file audio contenesse parlato.

---

## Root Cause Analysis

### Problema 1: Sample Rate Mismatch
- **OpenAI Realtime API** richiede audio **PCM16 a 24kHz**
- Il file WAV di test era a **16kHz**
- `FileAudioCaptureAdapter` ignorava il sample rate dal config e usava 16kHz hardcoded

### Problema 2: Audio Buffer Non Committato
- Anche con sample rate corretto, OpenAI **non restituiva transcript**
- **Causa**: VAD (Voice Activity Detection) di OpenAI non rilevava fine parlato da file
- **Soluzione**: Serve chiamare `input_audio_buffer.commit` esplicitamente quando il file termina

---

## Cosa è stato fatto

### Fase 1: Resampling Audio (16kHz → 24kHz)

Modificato `FileAudioCaptureAdapter.ts`:

1. Aggiunta funzione `resample()` con interpolazione lineare:
```typescript
private resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.ceil(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
    const t = srcIndex - srcIndexFloor;
    output[i] = (input[srcIndexFloor] ?? 0) * (1 - t) + (input[srcIndexCeil] ?? 0) * t;
  }
  return output;
}
```

2. Lettura sample rate dal WAV header (bytes 24-27):
```typescript
const fileSampleRate = buffer.readUInt32LE(24);
```

3. Resampling automatico se necessario:
```typescript
this.audioData = fileSampleRate !== targetSampleRate
  ? this.resample(sourceAudio, fileSampleRate, targetSampleRate)
  : sourceAudio;
```

### Fase 2: Commit Audio Buffer

1. **Aggiunto evento `AudioEndedEvent`** in `AudioCapturePort.ts`:
```typescript
export interface AudioEndedEvent {
  type: 'ended';
  timestamp: number;
}
```

2. **Aggiunto metodo `commitAudioBuffer()`** all'interfaccia `RealtimeConnectionPort`:
```typescript
commitAudioBuffer(): void;
```

3. **Implementato in entrambi gli adapter** (Node e Browser):
```typescript
commitAudioBuffer(): void {
  if (!this.ws || this.state !== 'connected') return;
  this.send({ type: 'input_audio_buffer.commit' });
}
```

4. **Emesso evento 'ended'** quando il file audio termina:
```typescript
// In FileAudioCaptureAdapter.emitNextChunk()
if (this.offset >= this.audioData.length) {
  for (const handler of this.handlers) {
    handler({ type: 'ended', timestamp: Date.now() });
  }
  this.stop();
  return;
}
```

5. **Chiamato commit** nel comando session:
```typescript
container.audioCapture.onAudioEvent((event) => {
  if (event.type === 'ended') {
    container.realtimeConnection.commitAudioBuffer();
  }
});
```

---

## File Modificati

| File | Modifica |
|------|----------|
| `src/cli/adapters/FileAudioCaptureAdapter.ts` | Resampling 16kHz→24kHz + evento `ended` |
| `src/application/ports/AudioCapturePort.ts` | Aggiunto tipo `AudioEndedEvent` |
| `src/application/ports/RealtimeConnectionPort.ts` | Aggiunto metodo `commitAudioBuffer()` |
| `src/cli/adapters/NodeOpenAIRealtimeAdapter.ts` | Implementato `commitAudioBuffer()` |
| `src/infrastructure/adapters/realtime/OpenAIRealtimeAdapter.ts` | Implementato `commitAudioBuffer()` |
| `src/cli/commands/session.ts` | Chiama `commitAudioBuffer()` su evento `ended` |
| `src/application/services/__tests__/SessionManager.test.ts` | Aggiunto mock per nuovo metodo |

---

## Verifica

### Test Manuale
```bash
npm run cli -- session start --mode transcript_only \
  --audio-file src/cli/__tests__/integration/fixtures/test-speech.wav
```

### Output Atteso
```
Starting transcript_only session...
Session started
Session active. Press Ctrl+C to stop.

You: Questo è un testo del sistema di recognizione del parole...
```

### Quality Checks
- **Lint**: 0 errori (4 warning pre-esistenti)
- **Typecheck**: passa senza errori

---

## Dettagli Tecnici

### WAV Header Format
Il sample rate si trova ai bytes 24-27 del file WAV (little-endian uint32):
```
Offset  Size  Description
0       4     "RIFF"
4       4     File size - 8
8       4     "WAVE"
12      4     "fmt "
16      4     Subchunk size (16 for PCM)
20      2     Audio format (1 = PCM)
22      2     Num channels
24      4     Sample rate  <-- QUI
28      4     Byte rate
32      2     Block align
34      2     Bits per sample
36      4     "data"
40      4     Data size
44      ...   Audio data
```

### OpenAI Realtime API Requirements
- **Format**: PCM16 (16-bit signed integer)
- **Sample Rate**: 24000 Hz (obbligatorio)
- **Channels**: Mono
- **Byte Order**: Little-endian

### Interpolazione Lineare (Resampling)
Formula per upsampling da 16kHz a 24kHz:
```
ratio = 16000 / 24000 = 0.667
Per ogni sample di output i:
  srcIndex = i * ratio
  output[i] = lerp(input[floor(srcIndex)], input[ceil(srcIndex)], frac(srcIndex))
```

---

## Lezioni Apprese

1. **VAD non è affidabile per file audio**: OpenAI VAD è ottimizzato per stream live con pause naturali, non per file pre-registrati che terminano bruscamente.

2. **Commit esplicito necessario**: Per file audio, bisogna sempre chiamare `input_audio_buffer.commit` quando l'input termina.

3. **Sample rate critico**: OpenAI Realtime API è **molto specifico** sui 24kHz - non fa resampling automatico.

---

## Fix Aggiuntivo: Double Output in Conversation Mode

### Problema

In modalità `conversation`, la risposta AI veniva stampata **due volte**:

```
  ... Got it! Your test...  (interim)
Got it! Your test message was received...  (final response_text)
AI: Got it! Your test message was received... (final transcript)  ← DUPLICATO
```

### Root Cause

In `src/cli/commands/session.ts`, il codice gestiva due eventi separati che stampavano la stessa risposta:

```typescript
container.realtimeConnection.onEvent((event) => {
  // Evento 1: transcript con role='assistant' → stampa "AI: <text>"
  if (event.type === 'transcript' && event.isFinal) {
    const prefix = event.role === 'user' ? chalk.blue('You') : chalk.magenta('AI');
    process.stdout.write(`${prefix}: ${event.text}\n`);
  }
  // Evento 2: response_text con isFinal=true → stampa testo raw
  else if (event.type === 'response_text') {
    if (event.isFinal) {
      process.stdout.write(chalk.white(`${event.text}\n`));  // ← DUPLICATO!
    } else {
      process.stdout.write(chalk.gray(`  ... ${event.text}\r`));
    }
  }
});
```

In `NodeOpenAIRealtimeAdapter.ts`, l'adapter emetteva ENTRAMBI gli eventi per la stessa risposta:

```typescript
case 'response.audio_transcript.done':
  this.emitEvent({ type: 'response_text', text: event.transcript, isFinal: true });
  this.emitEvent({ type: 'transcript', text: event.transcript, isFinal: true, role: 'assistant' });
  break;
```

### Soluzione

Modificato il handler `response_text` per stampare solo i risultati interim (feedback streaming), non il testo finale:

```typescript
} else if (event.type === 'response_text') {
  // Only show interim results for streaming feedback
  // Final text is shown via 'transcript' event with AI: prefix
  if (!event.isFinal) {
    process.stdout.write(chalk.gray(`  ... ${event.text}\r`));
  }
}
```

### File Modificato

| File | Modifica |
|------|----------|
| `src/cli/commands/session.ts` | Rimosso print di `response_text` finale (già mostrato via `transcript`) |

### Output Atteso (dopo il fix)

```
Starting conversation session...
Session started
Session active. Press Ctrl+C to stop.

  ... Got it! Your test...  (interim updates, sovrascrivono la stessa riga)
You: This is a test of the speech system...
AI: Got it! Your test message was received loud and clear...
```

### Verifica

```bash
npm run typecheck  # passa
npm run lint       # 0 errori
npm test           # 491 test passano
```
