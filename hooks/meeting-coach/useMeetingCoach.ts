/**
 * useMeetingCoach Hook
 *
 * Main orchestrator hook for Meeting Coach Mode.
 * Composes all specialized hooks and manages session lifecycle:
 * - Audio capture (tab audio via getDisplayMedia)
 * - Deepgram WebSocket connection
 * - Real-time transcript processing
 * - Speaker identification
 * - AI suggestion generation
 * - Session history persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  MeetingCoachSession,
  TranscriptSegment,
  Speaker,
  SessionError,
  DeepgramStatus,
} from '@/lib/meeting-coach/types';
import { useDeepgram } from './useDeepgram';
import { useMeetingConfig } from './useMeetingConfig';
import { useAISuggestions } from './useAISuggestions';
import { useMeetingHistory } from './useMeetingHistory';
import { log } from '@/lib/logger';

export function useMeetingCoach() {
  // Session state
  const [session, setSession] = useState<MeetingCoachSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<SessionError | null>(null);

  // Audio stream
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Compose specialized hooks
  const deepgram = useDeepgram({
    onTranscript: handleTranscript,
    onError: handleDeepgramError,
    onConnectionChange: handleConnectionChange,
  });

  const config = useMeetingConfig();
  const suggestions = useAISuggestions({
    onSuggestion: handleSuggestion,
    onError: handleSuggestionError,
  });
  const history = useMeetingHistory();

  /**
   * Handle new transcript segment from Deepgram
   */
  function handleTranscript(segment: TranscriptSegment) {
    if (!session) return;

    setSession((prev) => {
      if (!prev) return null;

      // Add segment to transcript
      const updatedSegments = [...prev.segments, segment];

      // Update speaker tracking
      const speakers = updateSpeakers(prev.speakers, segment);

      // Update metrics
      const totalWords = updatedSegments.reduce((sum, seg) => sum + seg.words.length, 0);

      return {
        ...prev,
        segments: updatedSegments,
        speakers,
        totalWords,
        totalSpeakers: speakers.length,
      };
    });

    // Auto-trigger AI suggestion if conditions are met
    if (session.userSpeakerId !== undefined && config.config) {
      const shouldTriggerSuggestion = checkShouldTriggerSuggestion(segment);
      if (shouldTriggerSuggestion) {
        void suggestions.requestSuggestion(
          config.config.openaiApiKey,
          [...session.segments, segment],
          config.config.coachingStyle,
          config.config.selectedTemplateId,
          session.userSpeakerId
        );
      }
    }
  }

  /**
   * Handle new AI suggestion
   */
  function handleSuggestion() {
    // Suggestions are managed by useAISuggestions hook
    // This callback is just for notifications
    log.info( '[useMeetingCoach] New suggestion received');
  }

  /**
   * Handle Deepgram error
   */
  function handleDeepgramError(err: SessionError) {
    setError(err);
    setSession((prev) => (prev ? { ...prev, lastError: err, status: 'error' } : null));
  }

  /**
   * Handle AI suggestion error
   */
  function handleSuggestionError(err: SessionError) {
    // Log but don't terminate session
    log.error( '[useMeetingCoach] Suggestion error (non-fatal)', err);
  }

  /**
   * Handle Deepgram connection status change
   */
  function handleConnectionChange(status: DeepgramStatus) {
    setSession((prev) => (prev ? { ...prev, deepgramStatus: status } : null));
  }

  /**
   * Update speaker tracking with new segment
   */
  function updateSpeakers(currentSpeakers: Speaker[], segment: TranscriptSegment): Speaker[] {
    const speakerIndex = currentSpeakers.findIndex((s) => s.id === segment.speaker);

    if (speakerIndex >= 0) {
      // Update existing speaker
      return currentSpeakers.map((s, i) =>
        i === speakerIndex
          ? {
              ...s,
              wordCount: s.wordCount + segment.words.length,
              segments: [...s.segments, segment.id],
            }
          : s
      );
    } else {
      // Add new speaker
      return [
        ...currentSpeakers,
        {
          id: segment.speaker,
          label: `Speaker ${segment.speaker}`,
          isUser: false,
          wordCount: segment.words.length,
          segments: [segment.id],
        },
      ];
    }
  }

  /**
   * Check if we should trigger AI suggestion based on new segment
   */
  function checkShouldTriggerSuggestion(segment: TranscriptSegment): boolean {
    // Only for final transcripts
    if (!segment.isFinal) return false;

    // Only if segment has meaningful content (>10 chars)
    if (segment.text.trim().length < 10) return false;

    // Only if not in user's turn (suggestions for listening, not speaking)
    if (session && segment.speaker === session.userSpeakerId) return false;

    // Check throttling
    return suggestions.canRequestSuggestion();
  }

  /**
   * Capture tab audio via getDisplayMedia
   * IMPORTANT: Must include video: true for browser compatibility
   * Most browsers don't support audio-only getDisplayMedia
   * We stop video tracks immediately after capture since we only need audio
   */
  const captureTabAudio = useCallback(async (): Promise<void> => {
    try {
      log.info( '[useMeetingCoach] Requesting tab audio capture');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,   // Required for browser compatibility (Chrome, Edge, Firefox)
        audio: true,
      });

      // Stop all video tracks immediately (we only need audio)
      stream.getVideoTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });

      // Validate audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('NO_AUDIO_TRACK: No audio track found in stream. Make sure "Share audio" is enabled.');
      }

      setAudioStream(stream);
      log.info( '[useMeetingCoach] Tab audio captured (video tracks stopped)', {
        audioTracks: audioTracks.length
      });
    } catch (err) {
      log.error( '[useMeetingCoach] Failed to capture tab audio', err);

      const captureError: SessionError = {
        type: 'CLIENT_ERROR',
        code: (err as Error).name === 'NotAllowedError' ? 'PERMISSION_DENIED' :
              (err as Error).name === 'NotSupportedError' ? 'NOT_SUPPORTED' :
              'NO_AUDIO_TRACK',
        message: (err as Error).message,
        timestamp: new Date().toISOString(),
      };

      setError(captureError);
      throw captureError;
    }
  }, []);

  /**
   * Stop audio capture
   */
  const stopAudioCapture = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
      log.info( '[useMeetingCoach] Audio capture stopped');
    }
  }, [audioStream]);

  /**
   * Start meeting coach session
   */
  const startSession = useCallback(async () => {
    try {
      // Validate config
      if (!config.config || !config.isConfigValid()) {
        const errors = config.getValidationErrors();
        throw new Error(`Invalid config: ${errors.join(', ')}`);
      }

      // Validate audio stream
      if (!audioStream) {
        throw new Error('NO_AUDIO_STREAM: Audio not captured. Call captureTabAudio() first.');
      }

      setIsConnecting(true);
      setError(null);

      log.info( '[useMeetingCoach] Starting session');

      // Create new session
      const newSession: MeetingCoachSession = {
        id: `session-${Date.now()}`,
        startTime: new Date().toISOString(),
        status: 'connecting',
        templateId: config.config.selectedTemplateId,
        coachingStyle: config.config.coachingStyle,
        deepgramStatus: 'disconnected',
        audioStreamActive: true,
        segments: [],
        speakers: [],
        suggestions: [],
        totalWords: 0,
        totalSpeakers: 0,
      };

      setSession(newSession);
      sessionStartTimeRef.current = Date.now();

      // Connect to Deepgram
      await deepgram.connect(config.config.deepgramApiKey, audioStream);

      // Update session status
      setSession((prev) => (prev ? { ...prev, status: 'active' } : null));

      log.info( '[useMeetingCoach] Session started successfully', { id: newSession.id });
    } catch (err) {
      log.error( '[useMeetingCoach] Failed to start session', err);

      const startError: SessionError = {
        type: 'CLIENT_ERROR',
        code: 'SESSION_START_FAILED',
        message: (err as Error).message,
        timestamp: new Date().toISOString(),
      };

      setError(startError);
      setSession(null);

      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [config, audioStream, deepgram]);

  /**
   * Stop meeting coach session
   */
  const stopSession = useCallback(() => {
    if (!session) return;

    log.info( '[useMeetingCoach] Stopping session', { id: session.id });

    // Calculate duration
    const duration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);

    // Update session with final state
    const finalSession: MeetingCoachSession = {
      ...session,
      endTime: new Date().toISOString(),
      duration,
      status: 'ended',
      audioStreamActive: false,
      suggestions: suggestions.suggestions,
    };

    // Save to history
    history.saveSession(finalSession);

    // Cleanup
    deepgram.disconnect();
    stopAudioCapture();
    suggestions.clearSuggestions();

    // Clear session state
    setSession(null);
    sessionStartTimeRef.current = 0;

    log.info( '[useMeetingCoach] Session stopped and saved', {
      id: finalSession.id,
      duration,
      segments: finalSession.segments.length,
      suggestions: finalSession.suggestions.length,
    });
  }, [session, deepgram, stopAudioCapture, suggestions, history]);

  /**
   * Identify user speaker
   */
  const identifySpeaker = useCallback((speakerId: number) => {
    setSession((prev) => {
      if (!prev) return null;

      // Update speakers array
      const updatedSpeakers = prev.speakers.map((s) => ({
        ...s,
        isUser: s.id === speakerId,
        label: s.id === speakerId ? 'You' : `Speaker ${s.id}`,
      }));

      // Update all segments with new labels
      const updatedSegments = prev.segments.map((seg) => ({
        ...seg,
        speakerLabel: seg.speaker === speakerId ? 'You' : `Speaker ${seg.speaker}`,
      }));

      log.info( '[useMeetingCoach] User speaker identified', { speakerId });

      return {
        ...prev,
        userSpeakerId: speakerId,
        speakers: updatedSpeakers,
        segments: updatedSegments,
      };
    });
  }, []);

  /**
   * Request manual suggestion
   */
  const requestManualSuggestion = useCallback(async () => {
    if (!session || !config.config) return;

    await suggestions.requestSuggestion(
      config.config.openaiApiKey,
      session.segments,
      config.config.coachingStyle,
      config.config.selectedTemplateId,
      session.userSpeakerId,
      true // Force request, bypass throttling
    );
  }, [session, config, suggestions]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (session && session.status === 'active') {
        stopSession();
      }
    };
  }, [session, stopSession]);

  return {
    // Session state
    session,
    isConnecting,
    isActive: session?.status === 'active',
    error,

    // Actions
    startSession,
    stopSession,
    identifySpeaker,
    requestManualSuggestion,

    // Audio capture
    captureTabAudio,
    stopAudioCapture,
    audioStream,

    // Real-time data
    segments: session?.segments || [],
    speakers: session?.speakers || [],
    suggestions: suggestions.suggestions,

    // Status
    isConnected: deepgram.isConnected,
    deepgramStatus: session?.deepgramStatus || 'disconnected',
    isSuggestionGenerating: suggestions.isGenerating,

    // Composed hooks (for advanced usage)
    config,
    history,
    suggestionActions: {
      dismiss: suggestions.dismissSuggestion,
      copy: suggestions.copySuggestion,
      canRequest: suggestions.canRequestSuggestion,
      timeUntilNext: suggestions.getTimeUntilNextSuggestion,
    },
  };
}
