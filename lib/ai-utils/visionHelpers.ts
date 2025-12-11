// Shared utilities for vision service operations
import React from 'react';
import { Message } from '@/types/ai-types/chat';
import { log } from '@/lib/logger';

/**
 * Update message status in the messages array
 */
function updateMessageStatus(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  messageId: string,
  newContent: string,
  newRole?: 'assistant' | 'log'
): void {
  setMessages(prev => prev.map(msg => 
    // @ts-ignore - Using temporary id for tracking
    msg.id === messageId ? 
    { ...msg, content: newContent, ...(newRole && { role: newRole }) } : 
    msg
  ));
}

/**
 * Add a processing message and return its ID
 */
export function addProcessingMessage(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  content: string
): string {
  const messageId = `processing-${Date.now()}`;
  // @ts-ignore - Adding temporary id for tracking this message
  setMessages(prev => [...prev, { 
    role: 'log', 
    content,
    id: messageId 
  }]);
  return messageId;
}

/**
 * Process vision analysis for non-Realtime mode via API
 */
export async function processVisionAnalysis(
  base64Data: string,
  messageId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  itemName?: string
): Promise<void> {
  // Update status message
  updateMessageStatus(
    setMessages,
    messageId,
    itemName ? `Analyzing ${itemName} with AI...` : 'Analyzing with AI...'
  );

  try {
    // Call vision analysis API
    const response = await fetch('/api/vision-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: base64Data, // base64 data URL
        prompt: 'Analyze this image in detail.'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze image');
    }

    const data = await response.json();

    if (data.analysis) {
      // Replace the waiting message with the analysis
      updateMessageStatus(setMessages, messageId, data.analysis, 'assistant');
    } else {
      throw new Error('No analysis generated');
    }
  } catch (error) {
    log.error('Error in vision analysis:', { error });
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze');
  }
}