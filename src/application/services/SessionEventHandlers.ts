import { Message, TranscriptSegment, Speaker } from '@domain/transcript';
import type { Word } from '@domain/transcript';

import type { RealtimeEvent } from '../ports';

export interface TranscriptionSegmentEvent {
  type: 'segment';
  speakerId: number;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  words: Word[];
  isFinal: boolean;
}

export interface TranscriptionErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type TranscriptionEvent = TranscriptionSegmentEvent | TranscriptionErrorEvent;

export interface SessionEventState {
  messages: Message[];
  segments: TranscriptSegment[];
  speakers: Map<number, Speaker>;
  interimTranscript: string | null;
}

export function handleRealtimeEvent(
  event: RealtimeEvent,
  state: SessionEventState,
): void {
  switch (event.type) {
    case 'transcript':
      if (event.isFinal) {
        const message = event.role === 'user'
          ? Message.userMessage(event.text)
          : Message.assistantMessage(event.text);
        state.messages.push(message);
        state.interimTranscript = null;
      } else {
        state.interimTranscript = event.text;
      }
      break;

    case 'response_text':
      if (event.isFinal && event.text) {
        const message = Message.assistantMessage(event.text);
        state.messages.push(message);
      }
      break;

    case 'error': {
      const errorMessage = Message.systemMessage(`Error: ${event.message}`);
      state.messages.push(errorMessage);
      break;
    }
  }
}

export function handleTranscriptionEvent(
  event: TranscriptionEvent,
  state: SessionEventState,
): void {
  switch (event.type) {
    case 'segment': {
      if (!state.speakers.has(event.speakerId)) {
        const newSpeaker = Speaker.create(event.speakerId);
        state.speakers.set(event.speakerId, newSpeaker);
      }

      const existingSpeaker = state.speakers.get(event.speakerId);
      if (existingSpeaker) {
        const durationMs = event.endMs - event.startMs;
        existingSpeaker.addSegment(event.words.length, durationMs);
      }

      if (event.isFinal) {
        const segment = TranscriptSegment.create(
          event.speakerId,
          event.text,
          event.startMs,
          event.endMs,
          {
            confidence: event.confidence,
            words: event.words,
            isFinal: true,
          },
        );
        state.segments.push(segment);
        state.interimTranscript = null;
      } else {
        state.interimTranscript = event.text;
      }
      break;
    }

    case 'error': {
      const errorMessage = Message.systemMessage(`Transcription Error: ${event.message}`);
      state.messages.push(errorMessage);
      break;
    }
  }
}

export function float32ToPCM16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = float32Array[i] ?? 0;
    const s = Math.max(-1, Math.min(1, sample));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}
