import { BaseDomainEvent } from '@domain/shared';

import type { Word } from '../entities/TranscriptSegment';

export interface SegmentReceivedPayload {
  segmentId: string;
  sessionId: string;
  speakerId: number;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  words: Word[];
  isFinal: boolean;
}

export class SegmentReceived extends BaseDomainEvent {
  static readonly EVENT_TYPE = 'SegmentReceived';

  constructor(public readonly payload: SegmentReceivedPayload) {
    super(SegmentReceived.EVENT_TYPE, payload.sessionId);
  }

  get segmentId(): string {
    return this.payload.segmentId;
  }

  get sessionId(): string {
    return this.payload.sessionId;
  }

  get speakerId(): number {
    return this.payload.speakerId;
  }

  get text(): string {
    return this.payload.text;
  }

  get isFinal(): boolean {
    return this.payload.isFinal;
  }
}
