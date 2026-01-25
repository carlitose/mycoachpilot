/**
 * useDeepgram Hook
 *
 * React hook for managing Deepgram WebSocket connection and real-time transcription.
 * Wraps DeepgramClient and AudioProcessor in a clean React API.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { DeepgramClient } from '@/lib/meeting-coach/deepgramClient';
import { AudioProcessor, validateAudioStream, setupAudioTrackEndedListener } from '@/lib/meeting-coach/audioProcessor';
import type {
  DeepgramStatus,
  DeepgramEvent,
  TranscriptSegment,
  SessionError,
} from '@/lib/meeting-coach/types';
import { log } from '@/lib/logger';

interface UseDeepgramOptions {
  onTranscript?: (segment: TranscriptSegment) => void;
  onError?: (error: SessionError) => void;
  onConnectionChange?: (status: DeepgramStatus) => void;
}

export function useDeepgram(options: UseDeepgramOptions = {}) {
  const [status, setStatus] = useState<DeepgramStatus>('disconnected');
  const [error, setError] = useState<SessionError | null>(null);

  const clientRef = useRef<DeepgramClient | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const segmentCounterRef = useRef(0);

  // Store options in a ref to avoid dependency issues causing infinite loops
  const optionsRef = useRef(options);

  // Update ref on every render (no dependencies needed)
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /**
   * Update status and notify parent
   * Fixed: No dependency on options - use optionsRef instead
   */
  const updateStatus = useCallback((newStatus: DeepgramStatus) => {
    setStatus(newStatus);
    optionsRef.current.onConnectionChange?.(newStatus);
  }, []);

  /**
   * Handle Deepgram events
   * Fixed: Only depends on updateStatus (now stable)
   */
  const handleDeepgramEvent = useCallback((event: DeepgramEvent) => {
    if (event.type === 'metadata') {
      log.info( '[useDeepgram] Metadata received', event.data);
    } else if (event.type === 'transcript') {
      // Convert to TranscriptSegment
      const segment: TranscriptSegment = {
        id: `segment-${Date.now()}-${segmentCounterRef.current++}`,
        speaker: event.data.words[0]?.speaker ?? 0,
        speakerLabel: `Speaker ${event.data.words[0]?.speaker ?? 0}`,
        text: event.data.transcript,
        startTime: event.data.startTime,
        endTime: event.data.startTime + event.data.duration,
        confidence: event.data.confidence,
        isFinal: event.data.isFinal,
        words: event.data.words,
        timestamp: new Date().toISOString(),
      };

      // Only emit final transcripts to reduce noise
      if (segment.isFinal && segment.text.trim().length > 0) {
        optionsRef.current.onTranscript?.(segment);
      }
    } else if (event.type === 'error') {
      log.error( '[useDeepgram] Error event', event.error);
      setError(event.error);
      optionsRef.current.onError?.(event.error);
      updateStatus('error');
    } else if (event.type === 'close') {
      log.info( '[useDeepgram] Connection closed', event);
      updateStatus('disconnected');
    }
  }, [updateStatus]);

  /**
   * Connect to Deepgram and start streaming audio
   */
  const connect = useCallback(async (apiKey: string, audioStream: MediaStream) => {
    try {
      // Validate audio stream has audio tracks
      validateAudioStream(audioStream);

      updateStatus('connecting');
      setError(null);

      // Create Deepgram client
      clientRef.current = new DeepgramClient({ apiKey });
      clientRef.current.onMessage(handleDeepgramEvent);

      // Connect to Deepgram
      await clientRef.current.connect();

      log.info( '[useDeepgram] Connected to Deepgram');
      updateStatus('connected');

      // Setup audio processing
      audioProcessorRef.current = new AudioProcessor(16000, 1);

      await audioProcessorRef.current.initialize(audioStream, (audioData) => {
        // Stream audio to Deepgram
        if (clientRef.current?.isConnected()) {
          clientRef.current.sendAudio(audioData);
        }
      });

      log.info( '[useDeepgram] Audio streaming started');

      // Monitor audio track ended
      setupAudioTrackEndedListener(audioStream, () => {
        log.warn( '[useDeepgram] Audio track ended');
        const endedError: SessionError = {
          type: 'CLIENT_ERROR',
          code: 'AUDIO_TRACK_ENDED',
          message: 'Audio track ended. Tab may have been closed.',
          timestamp: new Date().toISOString(),
        };
        setError(endedError);
        optionsRef.current.onError?.(endedError);
      });
    } catch (err) {
      log.error( '[useDeepgram] Connection failed', err);

      const connectionError: SessionError = {
        type: 'NETWORK_ERROR',
        code: (err as Error).message.includes('NO_AUDIO_TRACK') ? 'NO_AUDIO_TRACK' : 'CONNECTION_FAILED',
        message: (err as Error).message,
        timestamp: new Date().toISOString(),
      };

      setError(connectionError);
      optionsRef.current.onError?.(connectionError);
      updateStatus('error');

      throw err;
    }
  }, [handleDeepgramEvent, updateStatus]);

  /**
   * Disconnect from Deepgram and stop audio processing
   */
  const disconnect = useCallback(() => {
    log.info( '[useDeepgram] Disconnecting');

    if (audioProcessorRef.current) {
      audioProcessorRef.current.stop();
      audioProcessorRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
    }

    updateStatus('disconnected');
    setError(null);
    segmentCounterRef.current = 0;
  }, [updateStatus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    connect,
    disconnect,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
  };
}
