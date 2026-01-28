import { ok, err, type Result } from '@domain/shared';
import type { Word } from '@domain/transcript';

import type {
  TranscriptionPort,
  TranscriptionState,
  TranscriptionConfig,
  TranscriptionEvent,
  TranscriptionEventHandler,
} from '@application/ports';

import type { DeepgramMessage, DeepgramWord } from './types';

const DEEPGRAM_API_URL = 'wss://api.deepgram.com/v1/listen';

/**
 * Deepgram Transcription Adapter
 * Handles real-time speech-to-text with speaker diarization
 */
export class DeepgramAdapter implements TranscriptionPort {
  private ws: WebSocket | null = null;
  private state: TranscriptionState = 'disconnected';
  private eventHandlers: Set<TranscriptionEventHandler> = new Set();
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

      if (config.language) {
        params.set('language', config.language);
      }

      if (config.model) {
        params.set('model', config.model);
      }

      const url = `${DEEPGRAM_API_URL}?${params.toString()}`;

      this.ws = new WebSocket(url, ['token', config.apiKey]);

      return await new Promise((resolve) => {
        if (!this.ws) {
          this.state = 'error';
          this.emitEvent({ type: 'state', state: 'error' });
          resolve(err(new Error('WebSocket creation failed')));
          return;
        }

        this.ws.onopen = () => {
          this.state = 'connected';
          this.emitEvent({ type: 'state', state: 'connected' });
          resolve(ok(undefined));
        };

        this.ws.onclose = () => {
          this.state = 'disconnected';
          this.emitEvent({ type: 'state', state: 'disconnected' });
        };

        this.ws.onerror = () => {
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
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      });
    } catch (error) {
      this.state = 'error';
      this.emitEvent({ type: 'state', state: 'error' });
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  disconnect(): void {
    if (this.ws) {
      // Send close stream message
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

    // Send raw PCM16 audio bytes
    this.ws.send(audio.buffer);
  }

  onEvent(handler: TranscriptionEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as DeepgramMessage;
      this.processDeepgramMessage(data);
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

    // Get speaker from words (most frequent speaker in segment)
    const speakerId = this.getSpeakerFromWords(alternative.words);

    // Convert words to our format
    const words: Word[] = alternative.words.map((w) => ({
      text: w.punctuated_word ?? w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      confidence: w.confidence,
    }));

    const startMs = Math.round(message.start * 1000);
    const endMs = startMs + Math.round(message.duration * 1000);

    // Generate segment ID for interim results
    if (message.is_final) {
      this._segmentId++;
    }

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

    // Count speaker occurrences
    const speakerCounts = new Map<number, number>();
    for (const word of words) {
      const speaker = word.speaker ?? 0;
      speakerCounts.set(speaker, (speakerCounts.get(speaker) ?? 0) + 1);
    }

    // Return most frequent speaker
    let maxCount = 0;
    let maxSpeaker = 0;
    for (const [speaker, count] of speakerCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxSpeaker = speaker;
      }
    }

    return maxSpeaker;
  }

  private emitEvent(event: TranscriptionEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    });
  }
}
