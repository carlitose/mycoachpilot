import { useCallback, useRef } from 'react';
import { log } from '@/lib/logger';

interface UseSessionTrackingProps {
  isSessionActive: boolean;
  onSessionEnd: () => Promise<void>;
  templateId?: string | null;
  isCustomTemplate?: boolean;
}

interface UseSessionTrackingResult {
  startTracking: () => Promise<{ sessionId: string; availableMinutes: number; isNewTrialActivated: boolean } | null>;
  stopTracking: () => Promise<void>;
  updateTracking: () => Promise<void>;
}

/**
 * Session tracking hook - DISABLED for open source version
 *
 * This hook previously tracked usage minutes via Supabase Edge Functions.
 * For the open source version, tracking is disabled and all functions
 * return mock values to maintain API compatibility.
 */
export function useSessionTracking({ isSessionActive, onSessionEnd, templateId, isCustomTemplate }: UseSessionTrackingProps): UseSessionTrackingResult {
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // Start tracking session - returns mock data (no API call)
  const startTracking = useCallback(async (): Promise<{ sessionId: string; availableMinutes: number; isNewTrialActivated: boolean } | null> => {
    const mockSessionId = `local-${Date.now()}`;
    sessionIdRef.current = mockSessionId;
    sessionStartTimeRef.current = new Date();

    log.info('Session tracking (local mode):', {
      sessionId: mockSessionId,
      templateId,
      isCustomTemplate,
    });

    // Return unlimited minutes for open source version
    return {
      sessionId: mockSessionId,
      availableMinutes: 999999, // Unlimited
      isNewTrialActivated: false,
    };
  }, [templateId, isCustomTemplate]);

  // Stop tracking session - just clears local state
  const stopTracking = useCallback(async () => {
    if (sessionIdRef.current && sessionStartTimeRef.current) {
      const durationMs = new Date().getTime() - sessionStartTimeRef.current.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);

      log.info('Session ended (local mode):', {
        sessionId: sessionIdRef.current,
        durationMinutes,
      });
    }

    sessionIdRef.current = null;
    sessionStartTimeRef.current = null;
  }, []);

  // Update tracking - no-op in open source version
  const updateTracking = useCallback(async () => {
    // No tracking updates needed in open source version
    log.debug('Session tracking update (local mode) - no-op');
  }, []);

  return {
    startTracking,
    stopTracking,
    updateTracking,
  };
}
