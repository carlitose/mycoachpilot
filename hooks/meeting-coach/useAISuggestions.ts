/**
 * useAISuggestions Hook
 *
 * Manages AI coaching suggestions:
 * - Request suggestions from OpenAI API
 * - Throttle requests (max 1 per 30 seconds)
 * - Track suggestion history
 * - Handle errors and timeouts
 */

import { useState, useCallback, useRef } from 'react';
import type {
  CoachingSuggestion,
  TranscriptSegment,
  CoachingStyle,
  SessionError,
} from '@/lib/meeting-coach/types';
import { log } from '@/lib/logger';

interface UseAISuggestionsOptions {
  onSuggestion?: (suggestion: CoachingSuggestion) => void;
  onError?: (error: SessionError) => void;
}

// Throttle: max 1 suggestion every 30 seconds
const MIN_SUGGESTION_INTERVAL = 30000; // 30s

// Format last N segments for AI context
const CONTEXT_SEGMENT_COUNT = 10;

export function useAISuggestions(options: UseAISuggestionsOptions = {}) {
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastError, setLastError] = useState<SessionError | null>(null);

  const lastSuggestionTimeRef = useRef(0);
  const suggestionCounterRef = useRef(0);

  /**
   * Format transcript segments into context string for AI
   */
  const formatTranscriptContext = useCallback((
    segments: TranscriptSegment[],
    userSpeakerId?: number
  ): string => {
    // Get last N segments
    const recentSegments = segments.slice(-CONTEXT_SEGMENT_COUNT);

    return recentSegments
      .map((segment) => {
        const label = segment.speaker === userSpeakerId ? 'You' : `Speaker ${segment.speaker}`;
        return `${label}: ${segment.text}`;
      })
      .join('\n\n');
  }, []);

  /**
   * Check if we can request a suggestion (throttling)
   */
  const canRequestSuggestion = useCallback((forceRequest = false): boolean => {
    if (forceRequest) return true;

    const now = Date.now();
    const timeSinceLastSuggestion = now - lastSuggestionTimeRef.current;

    return timeSinceLastSuggestion >= MIN_SUGGESTION_INTERVAL;
  }, []);

  /**
   * Request AI suggestion
   */
  const requestSuggestion = useCallback(async (
    apiKey: string,
    segments: TranscriptSegment[],
    coachingStyle: CoachingStyle,
    templateId: string,
    userSpeakerId?: number,
    forceRequest = false
  ): Promise<CoachingSuggestion | null> => {
    // Check throttling
    if (!canRequestSuggestion(forceRequest)) {
      log.info( '[useAISuggestions] Throttled - too soon for next suggestion');
      return null;
    }

    // Check if user is identified
    if (userSpeakerId === undefined) {
      log.info( '[useAISuggestions] User not identified - skipping suggestion');
      return null;
    }

    // Check if we have enough context
    if (segments.length === 0) {
      log.info( '[useAISuggestions] No segments - skipping suggestion');
      return null;
    }

    setIsGenerating(true);
    setLastError(null);

    try {
      // Format transcript context
      const transcript = formatTranscriptContext(segments, userSpeakerId);

      log.info( '[useAISuggestions] Requesting suggestion', {
        segmentCount: segments.length,
        contextLength: transcript.length,
      });

      // Call API route
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('/api/coach-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          transcript,
          coachingStyle,
          templateId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();

      // Check if AI returned NO_SUGGESTION
      if (!data.suggestion) {
        log.info( '[useAISuggestions] AI returned NO_SUGGESTION');
        lastSuggestionTimeRef.current = Date.now();
        return null;
      }

      // Create suggestion object
      const suggestion: CoachingSuggestion = {
        id: `suggestion-${Date.now()}-${suggestionCounterRef.current++}`,
        text: data.suggestion,
        context: transcript,
        timestamp: new Date().toISOString(),
        templateId,
        coachingStyle,
        isDismissed: false,
        wasCopied: false,
        triggerSegmentId: segments[segments.length - 1]?.id || '',
      };

      // Update state
      setSuggestions((prev) => [...prev, suggestion]);
      lastSuggestionTimeRef.current = Date.now();

      // Notify callback
      options.onSuggestion?.(suggestion);

      log.info( '[useAISuggestions] Suggestion generated', {
        id: suggestion.id,
        length: suggestion.text.length,
      });

      return suggestion;
    } catch (error) {
      log.error( '[useAISuggestions] Error generating suggestion', error);

      const suggestionError: SessionError = {
        type: 'API_ERROR',
        code: (error as Error).name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'SERVER_ERROR',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      };

      setLastError(suggestionError);
      options.onError?.(suggestionError);

      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [canRequestSuggestion, formatTranscriptContext, options]);

  /**
   * Dismiss suggestion
   */
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, isDismissed: true } : s))
    );

    log.info( '[useAISuggestions] Suggestion dismissed', { suggestionId });
  }, []);

  /**
   * Mark suggestion as copied
   */
  const markAsCopied = useCallback((suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, wasCopied: true } : s))
    );

    log.info( '[useAISuggestions] Suggestion copied', { suggestionId });
  }, []);

  /**
   * Copy suggestion to clipboard
   */
  const copySuggestion = useCallback(async (suggestionId: string): Promise<boolean> => {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return false;

    try {
      await navigator.clipboard.writeText(suggestion.text);
      markAsCopied(suggestionId);
      log.info( '[useAISuggestions] Copied to clipboard', { suggestionId });
      return true;
    } catch (error) {
      log.error( '[useAISuggestions] Failed to copy to clipboard', error);
      return false;
    }
  }, [suggestions, markAsCopied]);

  /**
   * Get active (non-dismissed) suggestions
   */
  const getActiveSuggestions = useCallback((): CoachingSuggestion[] => {
    return suggestions.filter((s) => !s.isDismissed);
  }, [suggestions]);

  /**
   * Clear all suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    suggestionCounterRef.current = 0;
    log.info( '[useAISuggestions] All suggestions cleared');
  }, []);

  /**
   * Get time until next suggestion can be requested
   */
  const getTimeUntilNextSuggestion = useCallback((): number => {
    const now = Date.now();
    const timeSinceLastSuggestion = now - lastSuggestionTimeRef.current;
    const remaining = MIN_SUGGESTION_INTERVAL - timeSinceLastSuggestion;
    return Math.max(0, remaining);
  }, []);

  return {
    // State
    suggestions,
    isGenerating,
    lastError,

    // Actions
    requestSuggestion,
    dismissSuggestion,
    copySuggestion,
    clearSuggestions,

    // Queries
    getActiveSuggestions,
    canRequestSuggestion,
    getTimeUntilNextSuggestion,
  };
}
