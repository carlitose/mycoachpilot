import React, { useState, useEffect, useCallback } from 'react';
import { getAvailableScreens, captureScreenshot, ScreenInfo } from '@/lib/ai-utils/screenCapture';
import { convertToBase64, processImageForRealtime } from '@/lib/ai-utils/imageProcessing';
import { addProcessingMessage, processVisionAnalysis } from '@/lib/ai-utils/visionHelpers';
import { Message } from '@/types/ai-types/chat';
import { log } from '@/lib/logger';

interface ScreenCaptureHookProps {
  sessionId: string | null;
  isSessionActive: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendTextMessage?: (text: string) => Promise<void>;
}

interface ScreenCaptureHookResult {
  isCapturingScreen: boolean;
  availableScreens: ScreenInfo[];
  selectedScreen: string;
  setSelectedScreen: React.Dispatch<React.SetStateAction<string>>;
  handleAnalyzeScreenshot: () => Promise<void>;
}

export function useScreenCapture({
  sessionId,
  isSessionActive,
  setMessages,
  sendTextMessage
}: ScreenCaptureHookProps): ScreenCaptureHookResult {
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState("screen1");
  const [availableScreens, setAvailableScreens] = useState<ScreenInfo[]>([]);

  // Load available screens when component mounts
  useEffect(() => {
    async function loadScreens() {
      const screens = await getAvailableScreens();
      setAvailableScreens(screens);
      
      if (screens.length > 0) {
        setSelectedScreen(screens[0].id);
      }
    }
    
    // Load screens only once on startup
    loadScreens();
  }, []);

  const handleAnalyzeScreenshot = useCallback(async () => {
    if (!sessionId || !isSessionActive) return;
    
    try {
      setIsCapturingScreen(true);
      
      // Add a waiting message with a unique identifier first
      const messageId = addProcessingMessage(setMessages, 'Capturing and analyzing the screen...');
      
      // Check if we're in Realtime mode
      if (sendTextMessage) {
        // In Realtime mode, capture the screenshot and send it for analysis
        try {
          const imageData = await captureScreenshot();
          if (imageData) {
            await processImageForRealtime(imageData, 'screenshot', sendTextMessage);
          }
        } catch (sendError) {
          log.warn("[Screenshot] Could not process screenshot:", { error: sendError });
        }
        return;
      }

      // Non-Realtime mode: capture and analyze via API
      const imageData = await captureScreenshot();

      if (imageData) {
        // Convert blob to base64 and process via API
        const base64Image = await convertToBase64(imageData);
        await processVisionAnalysis(base64Image, messageId, setMessages, 'screenshot');
      } else {
        throw new Error("Unable to capture screenshot");
      }
    } catch (error) {
      log.error("Error capturing screenshot:", { error });
      
      // Add an error message
      setMessages(prev => [
        ...prev,
        { role: 'log', content: `An error occurred while capturing the screenshot: ${error instanceof Error ? error.message : 'Unknown error'}` }
      ]);
    } finally {
      setIsCapturingScreen(false);
    }
  }, [sessionId, isSessionActive, setMessages, sendTextMessage]);

  return {
    isCapturingScreen,
    availableScreens,
    selectedScreen,
    setSelectedScreen,
    handleAnalyzeScreenshot
  };
} 