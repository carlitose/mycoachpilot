import type { SuggestionProps } from '@domain/coaching';
import type { CoachingStyleType } from '@domain/settings';
import type { TranscriptSegment, Speaker } from '@domain/transcript';

import type { CoachingEngine, CoachingContext } from './CoachingEngine';
import { handleTranscriptionEvent, SessionEventState, TranscriptionEvent } from './SessionEventHandlers';

/**
 * Creates a suggestion generator function for the CoachingEngine
 * This is extracted to keep SessionManager focused on orchestration
 */
export function createSuggestionGeneratorFn(
  apiKey: string,
  config: { coachingStyle: CoachingStyleType; templateSystemPrompt: string; userSpeakerId: number | null },
): (context: CoachingContext) => Promise<SuggestionProps | null> {
  return async (context: CoachingContext) => {
    const { createSuggestionGenerator } = await import('@infrastructure/adapters');
    const generator = createSuggestionGenerator(apiKey, config);
    return generator(context);
  };
}

/**
 * Builds coaching context from session state
 */
export function buildCoachingContext(
  segments: TranscriptSegment[],
  speakers: Map<number, Speaker>,
): CoachingContext {
  const recentSegments = segments.slice(-10).map((s) => s.toProps());
  const speakerList = Array.from(speakers.values()).map((s) => s.toProps());
  const lastSegment = segments[segments.length - 1];
  const currentSpeaker = lastSegment?.speakerId ?? null;

  return {
    recentSegments,
    speakers: speakerList,
    currentSpeaker,
    conversationTone: 'unknown',
  };
}

/**
 * Handles transcription events and triggers coaching if configured
 */
export function handleTranscriptionWithCoaching(
  event: TranscriptionEvent,
  state: SessionEventState,
  coachingEngine: CoachingEngine | undefined,
): void {
  handleTranscriptionEvent(event, state);

  if (coachingEngine && event.type === 'segment' && event.isFinal) {
    const segment = state.segments[state.segments.length - 1];
    if (segment) {
      const context = buildCoachingContext(state.segments, state.speakers);
      void coachingEngine.processSegment(segment.toProps(), context);
    }
  }
}
