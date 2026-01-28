import WebSocket from 'ws';

import type {
  TranscriptionPort,
  TranscriptionState,
  TranscriptionConfig,
  TranscriptionEvent,
  TranscriptionEventHandler,
} from '../../application/ports/TranscriptionPort';
import { ok, err } from '../../domain/shared/Result';
import type { Result } from '../../domain/shared/Result';
import type { Word } from '../../domain/transcript/entities/TranscriptSegment';
import type { DeepgramMessage, DeepgramWord } from '../../infrastructure/adapters/deepgram/types';

const DEEPGRAM_API_URL = 'wss://api.deepgram.com/v1/listen';

export class NodeDeepgramAdapter implements TranscriptionPort {
  private ws: WebSocket | null = null;
  private state: TranscriptionState = 'disconnected';
  private eventHandlers = new Set<TranscriptionEventHandler>();
  private _segmentId = 0;

  getState(): TranscriptionState {
    return this.state;
  }

  async connect(config: TranscriptionConfig): Promise<Result<void, Error>> {
    if (this.ws && this.state === 'connected') {
      return ok(undefined);
    }

    this.state = 'connecting';
    this.emitEvent({ type: 'state', state: 'connecting' });

    try {
      const params = new URLSearchParams({
        encoding: 'linear16',
        sample_rate: String(config.sampleRate ?? 16000),
        channels: '1',
        punctuate: String(config.punctuate ?? true),
        diarize: String(config.diarize ?? true),
        interim_results: String(config.interimResults ?? true),
        endpointing: '300',
        utterance_end_ms: '1000',
      });

      if (config.language) params.set('language', config.language);
      if (config.model) params.set('model', config.model);

      const url = `${DEEPGRAM_API_URL}?${params.toString()}`;

      this.ws = new WebSocket(url, {
        headers: { Authorization: `Token ${config.apiKey}` },
      });

      return await new Promise((resolve) => {
        if (!this.ws) {
          this.state = 'error';
          this.emitEvent({ type: 'state', state: 'error' });
          resolve(err(new Error('WebSocket creation failed')));
          return;
        }

        this.ws.on('open', () => {
          this.state = 'connected';
          this.emitEvent({ type: 'state', state: 'connected' });
          resolve(ok(undefined));
        });

        this.ws.on('close', () => {
          this.state = 'disconnected';
          this.emitEvent({ type: 'state', state: 'disconnected' });
        });

        this.ws.on('error', () => {
          if (this.state === 'connecting') {
            this.state = 'error';
            this.emitEvent({ type: 'state', state: 'error' });
            this.emitEvent({
              type: 'error',
              code: 'connection_failed',
              message: 'Failed to connect to Deepgram',
            });
            resolve(err(new Error('Failed to connect to Deepgram')));
          }
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data);
        });
      });
    } catch (error) {
      this.state = 'error';
      this.emitEvent({ type: 'state', state: 'error' });
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  disconnect(): void {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'CloseStream' }));
      }
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
    this.emitEvent({ type: 'state', state: 'disconnected' });
  }

  sendAudio(audio: Int16Array): void {
    if (!this.ws || this.state !== 'connected') return;
    this.ws.send(Buffer.from(audio.buffer));
  }

  finalize(): void {
    if (!this.ws || this.state !== 'connected') return;
    // Send CloseStream to get final transcription results
    this.ws.send(JSON.stringify({ type: 'CloseStream' }));
  }

  onEvent(handler: TranscriptionEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => { this.eventHandlers.delete(handler); };
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const text = Buffer.isBuffer(data) ? data.toString('utf8') : (data as string);
      const message = JSON.parse(text) as DeepgramMessage;
      this.processDeepgramMessage(message);
    } catch {
      // Ignore parse errors
    }
  }

  private processDeepgramMessage(message: DeepgramMessage): void {
    switch (message.type) {
      case 'Results':
        this.handleTranscriptResult(message);
        break;
      case 'Error':
        this.emitEvent({
          type: 'error',
          code: message.variant ?? 'unknown',
          message: message.message || message.description,
        });
        break;
    }
  }

  private handleTranscriptResult(message: {
    channel: { alternatives: Array<{ transcript: string; confidence: number; words: DeepgramWord[] }> };
    start: number;
    duration: number;
    is_final: boolean;
    speech_final: boolean;
  }): void {
    const alternative = message.channel.alternatives[0];
    if (!alternative || !alternative.transcript) return;

    const speakerId = this.getSpeakerFromWords(alternative.words);
    const words: Word[] = alternative.words.map((w) => ({
      text: w.punctuated_word ?? w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      confidence: w.confidence,
    }));

    const startMs = Math.round(message.start * 1000);
    const endMs = startMs + Math.round(message.duration * 1000);

    if (message.is_final) this._segmentId++;

    this.emitEvent({
      type: 'segment',
      speakerId,
      text: alternative.transcript,
      startMs,
      endMs,
      confidence: alternative.confidence,
      words,
      isFinal: message.is_final && message.speech_final,
    });
  }

  private getSpeakerFromWords(words: DeepgramWord[]): number {
    if (words.length === 0) return 0;
    const counts = new Map<number, number>();
    for (const word of words) {
      const speaker = word.speaker ?? 0;
      counts.set(speaker, (counts.get(speaker) ?? 0) + 1);
    }
    let maxCount = 0;
    let maxSpeaker = 0;
    for (const [speaker, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        maxSpeaker = speaker;
      }
    }
    return maxSpeaker;
  }

  private emitEvent(event: TranscriptionEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }
}
