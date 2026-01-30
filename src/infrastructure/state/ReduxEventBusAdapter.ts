import type { SuggestionProps } from '@domain/coaching';
import type { SessionModeType } from '@domain/session';
import type { DomainEvent, EventHandler } from '@domain/shared';
import type { MessageProps, TranscriptSegmentProps, SpeakerProps } from '@domain/transcript';

import type { EventBusPort } from '@application/ports';

import { addSuggestion } from './slices/coachingSlice';
import {
  sessionStarted,
  sessionPaused,
  sessionResumed,
  sessionStopped,
} from './slices/sessionSlice';
import {
  addMessage,
  addSegment,
  addSpeaker,
  updateSpeaker,
} from './slices/transcriptSlice';
import type { AppDispatch } from './store';


type EventSubscribers = Map<string, Set<EventHandler<DomainEvent>>>;

/**
 * ReduxEventBusAdapter
 * Bridges domain events to Redux actions
 */
export class ReduxEventBusAdapter implements EventBusPort {
  private subscribers: EventSubscribers = new Map();

  constructor(private readonly dispatch: AppDispatch) {}

  publish(event: DomainEvent): void {
    // Dispatch to Redux based on event type
    this.dispatchToRedux(event);

    // Notify subscribers
    const handlers = this.subscribers.get(event.eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch {
          // Log error but don't throw to prevent breaking other handlers
          // In production, this would go to error tracking
        }
      });
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): () => void {
    let handlers = this.subscribers.get(eventType);
    if (!handlers) {
      handlers = new Set();
      this.subscribers.set(eventType, handlers);
    }

    handlers.add(handler as EventHandler<DomainEvent>);

    return () => {
      const currentHandlers = this.subscribers.get(eventType);
      if (currentHandlers) {
        currentHandlers.delete(handler as EventHandler<DomainEvent>);
        if (currentHandlers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  subscribeMany<T extends DomainEvent>(
    eventTypes: string[],
    handler: EventHandler<T>,
  ): () => void {
    const unsubscribers = eventTypes.map((type) => this.subscribe(type, handler));
    return () => { unsubscribers.forEach((unsub) => { unsub(); }); };
  }

  private dispatchToRedux(event: DomainEvent): void {
    const payload = (event as DomainEvent & { payload?: unknown }).payload;

    switch (event.eventType) {
      case 'SessionStarted':
        if (isSessionStartedPayload(payload)) {
          this.dispatch(sessionStarted(payload));
        }
        break;

      case 'SessionPaused':
        this.dispatch(sessionPaused());
        break;

      case 'SessionResumed':
        this.dispatch(sessionResumed());
        break;

      case 'SessionStopped':
        if (isSessionStoppedPayload(payload)) {
          this.dispatch(sessionStopped(payload));
        }
        break;

      case 'MessageReceived':
        if (isMessagePayload(payload)) {
          this.dispatch(addMessage(payload));
        }
        break;

      case 'SegmentReceived':
        if (isSegmentPayload(payload)) {
          this.dispatch(addSegment(payload));
        }
        break;

      case 'SpeakerIdentified':
        if (isSpeakerPayload(payload)) {
          if (payload.isNew) {
            this.dispatch(addSpeaker(payload.speaker));
          } else {
            this.dispatch(updateSpeaker(payload.speaker));
          }
        }
        break;

      case 'SuggestionGenerated':
        if (isSuggestionPayload(payload)) {
          this.dispatch(addSuggestion(payload));
        }
        break;
    }
  }
}

// Type guards
function isSessionStartedPayload(
  payload: unknown,
): payload is { sessionId: string; mode: SessionModeType; templateId: string | null; startedAt: string } {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sessionId' in payload &&
    'startedAt' in payload
  );
}

function isSessionStoppedPayload(payload: unknown): payload is { endedAt: string } {
  return typeof payload === 'object' && payload !== null && 'endedAt' in payload;
}

function isMessagePayload(payload: unknown): payload is MessageProps {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'id' in payload &&
    'content' in payload &&
    'role' in payload
  );
}

function isSegmentPayload(payload: unknown): payload is TranscriptSegmentProps {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'id' in payload &&
    'speakerId' in payload &&
    'text' in payload
  );
}

function isSpeakerPayload(payload: unknown): payload is {
  isNew: boolean;
  speaker: SpeakerProps;
} {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'speaker' in payload &&
    'isNew' in payload
  );
}

function isSuggestionPayload(payload: unknown): payload is SuggestionProps {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'id' in payload &&
    'content' in payload &&
    'type' in payload
  );
}
