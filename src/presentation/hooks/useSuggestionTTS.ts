/**
 * useSuggestionTTS Hook
 * Listens for SuggestionGenerated events and plays TTS for coach suggestions
 */
import { useCallback, useEffect, useRef } from 'react';

import type { SuggestionProps } from '@domain/coaching';
import { SuggestionGenerated } from '@domain/coaching';
import type { DomainEvent } from '@domain/shared';

import type { TTSPort } from '@application/ports';

import { useContainer } from '../context';

import { useSettings } from './useSettings';

interface UseSuggestionTTSOptions {
  ttsAdapter: TTSPort;
}

interface UseSuggestionTTSReturn {
  isPlaying: boolean;
  stop: () => void;
}

/**
 * Event shape as published by CoachingEngine
 * (raw DomainEvent with payload, not the class instance)
 */
interface SuggestionGeneratedEvent extends DomainEvent {
  payload: SuggestionProps;
}

/**
 * Hook that automatically speaks new coach suggestions using TTS
 */
export function useSuggestionTTS({ ttsAdapter }: UseSuggestionTTSOptions): UseSuggestionTTSReturn {
  const { eventBus } = useContainer();
  const {
    config,
    coachTTSEnabled,
    coachTTSVoice,
    coachTTSSpeed,
    coachTTSVolume,
  } = useSettings();

  // Track current state in ref to avoid stale closures
  const stateRef = useRef({
    enabled: coachTTSEnabled,
    voice: coachTTSVoice,
    speed: coachTTSSpeed,
    volume: coachTTSVolume,
    apiKey: config.openaiApiKey,
  });

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = {
      enabled: coachTTSEnabled,
      voice: coachTTSVoice,
      speed: coachTTSSpeed,
      volume: coachTTSVolume,
      apiKey: config.openaiApiKey,
    };

    // Update TTS adapter settings
    ttsAdapter.setEnabled(coachTTSEnabled);
    ttsAdapter.setVoice(coachTTSVoice);
    ttsAdapter.setSpeed(coachTTSSpeed);
    ttsAdapter.setVolume(coachTTSVolume);
    ttsAdapter.setApiKey(config.openaiApiKey);
  }, [ttsAdapter, coachTTSEnabled, coachTTSVoice, coachTTSSpeed, coachTTSVolume, config.openaiApiKey]);

  // Handle suggestion generated event
  // Note: The event is a raw DomainEvent with payload, not a SuggestionGenerated class instance
  const handleSuggestionGenerated = useCallback((event: SuggestionGeneratedEvent) => {
    const state = stateRef.current;

    if (!state.enabled || !state.apiKey) {
      return;
    }

    // Extract content from the event payload
    const content = event.payload.content;
    if (!content) {
      return;
    }

    // Speak the suggestion content
    void ttsAdapter.speak(content, {
      voice: state.voice,
      speed: state.speed,
      volume: state.volume,
    });
  }, [ttsAdapter]);

  // Subscribe to SuggestionGenerated events
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(
      SuggestionGenerated.EVENT_TYPE,
      handleSuggestionGenerated,
    );

    return () => {
      unsubscribe();
    };
  }, [eventBus, handleSuggestionGenerated]);

  // Stop function
  const stop = useCallback(() => {
    ttsAdapter.stop();
  }, [ttsAdapter]);

  return {
    isPlaying: ttsAdapter.isPlaying(),
    stop,
  };
}
