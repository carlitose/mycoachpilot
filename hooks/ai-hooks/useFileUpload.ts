import React, { useState, useCallback, useRef } from 'react';
import { Message } from '@/types/ai-types/chat';
import { log } from '@/lib/logger';
import { convertToBase64, processImageForRealtime } from '@/lib/ai-utils/imageProcessing';
import { addProcessingMessage, processVisionAnalysis } from '@/lib/ai-utils/visionHelpers';

interface FileUploadHookProps {
  sessionId: string | null;
  isSessionActive: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendTextMessage?: (text: string) => Promise<void>;
}

interface FileUploadHookResult {
  isProcessingFile: boolean;
  handleFileUpload: (file: File) => Promise<void>;
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function useFileUpload({
  sessionId,
  isSessionActive,
  setMessages,
  sendTextMessage
}: FileUploadHookProps): FileUploadHookResult {
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!sessionId || !isSessionActive) return;
    
    try {
      setIsProcessingFile(true);
      
      // Add a waiting message with a unique identifier
      const messageId = addProcessingMessage(setMessages, `Processing ${file.name}...`);
      
      // Check if we're in Realtime mode
      if (sendTextMessage) {
        // In Realtime mode, process the file and send it for analysis
        try {
          await processImageForRealtime(file, 'file', sendTextMessage, file.name);
        } catch (sendError) {
          log.warn("[FileUpload] Could not process file:", { error: sendError });
          throw sendError;
        }
        return;
      }

      // Non-Realtime mode: analyze via API
      const base64Data = await convertToBase64(file);
      await processVisionAnalysis(base64Data, messageId, setMessages, file.name);
    } catch (error) {
      log.error("Error processing file:", { error });
      
      // Add an error message
      setMessages(prev => [
        ...prev,
        { role: 'log', content: `An error occurred while processing the file: ${error instanceof Error ? error.message : 'Unknown error'}` }
      ]);
    } finally {
      setIsProcessingFile(false);
    }
  }, [sessionId, isSessionActive, setMessages, sendTextMessage]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    isProcessingFile,
    handleFileUpload,
    triggerFileInput,
    fileInputRef
  };
}