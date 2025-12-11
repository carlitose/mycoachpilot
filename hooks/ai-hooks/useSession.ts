import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from '@/types/ai-types/chat';
import { toast } from 'react-hot-toast';
import { startSimpleRealtimeSession } from '@/lib/simpleRealtime';
import { log } from '@/lib/logger';
import { useSessionTracking } from './useSessionTracking';

interface SessionHookResult {
  sessionId: string | null;
  isSessionActive: boolean;
  isStarting: boolean; // Loading state for session start
  audioStreamControl: null; // Kept for compatibility
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  toggleSession: () => Promise<void>;
  sendTextMessage: (text: string) => Promise<void>;
  sendImage: (imageData: string, prompt?: string) => Promise<void>;
  startThinkProcess: () => Promise<void>;
  saveConversation: () => Promise<void>;
  clearMessages: () => void;
  deleteMessage: (index: number) => void;
  currentMode: 'conversation' | 'transcript_only'; // Current session mode
}

export function useSession(): SessionHookResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false); // Loading state to prevent multiple clicks
  // Limit messages to prevent memory issues
  const MAX_MESSAGES = 100;
  const [messages, setMessages] = useState<Message[]>([]);
  const router = useRouter();
  // Supabase client removed
  // const supabase = createClient(); // Inizializza client Supabase

  // Store the current session
  const [currentSession, setCurrentSession] = useState<any>(null);
  const audioStreamControl = null; // Kept for compatibility

  // Template tracking
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isCustomTemplate, setIsCustomTemplate] = useState(false);

  // Mode tracking
  const [currentMode, setCurrentMode] = useState<'conversation' | 'transcript_only'>('conversation');

  // Inactivity timeout reference (60 minutes for trial, 120 minutes for paid users)
  const inactivityTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Session tracking for usage minutes
  const { startTracking, stopTracking } = useSessionTracking({
    isSessionActive,
    templateId,
    isCustomTemplate,
    onSessionEnd: async () => {
      // This will be called when minutes run out
      if (isSessionActive) {
        log.info('Session auto-ending due to no remaining minutes');
        await toggleSession();
      }
    }
  });
  
  // Helper function to properly cleanup session
  const cleanupSession = useCallback((session: any) => {
    try {
      // Remove all event listeners first
      if ('removeAllListeners' in session) {
        session.removeAllListeners();
      } else if ('off' in session) {
        // Remove specific listeners if stored
        if (session._historyHandler) {
          session.off('history_updated', session._historyHandler);
          delete session._historyHandler;
        }
      }
      
      // Clean up WebRTC transport
      if ('transport' in session && session.transport) {
        const transport = session.transport as any;
        
        // Stop all media tracks
        if (transport.pc && transport.pc.getSenders) {
          transport.pc.getSenders().forEach((sender: any) => {
            if (sender.track) {
              sender.track.stop();
            }
          });
        }
        
        if (transport.pc && transport.pc.getReceivers) {
          transport.pc.getReceivers().forEach((receiver: any) => {
            if (receiver.track) {
              receiver.track.stop();
            }
          });
        }
        
        // Close peer connection
        if (transport.pc && transport.pc.close) {
          transport.pc.close();
        }
        
        // Close WebSocket
        if (transport.ws && transport.ws.close) {
          transport.ws.close();
        }
        
        // Remove transport listeners
        if (transport.removeAllListeners) {
          transport.removeAllListeners();
        }
      }
      
      // Finally close the session
      if ('close' in session) {
        session.close();
      } else if ('disconnect' in session) {
        session.disconnect();
      }
      
      log.info('Session cleaned up successfully');
    } catch (error) {
      log.error('Error during session cleanup:', { error });
    }
  }, []);
  
  // Reset inactivity timer
  const resetInactivityTimer = useCallback(async (maxMinutes?: number) => {
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Determine timeout based on user's access level
    let timeoutMinutes = 30; // Default inactivity timeout

    if (maxMinutes !== undefined) {
      // Use provided max minutes for session timeout
      timeoutMinutes = maxMinutes;
    }

    // Set new timeout
    inactivityTimeoutRef.current = setTimeout(async () => {
      if (isSessionActive && currentSession) {
        log.info('Session timeout due to inactivity');
        toast('Session ended due to inactivity');

        // Stop usage tracking
        await stopTracking();

        // Cleanup and stop session
        cleanupSession(currentSession.session);
        setCurrentSession(null);
        setIsSessionActive(false);
        setMessages(prev => [...prev, {
          role: 'system' as const,
          content: '--- Session ended due to inactivity ---'
        }]);
      }
    }, timeoutMinutes * 60 * 1000);
  }, [isSessionActive, currentSession, cleanupSession, stopTracking]);
  
  // Cleanup on unmount with proper resource disposal
  useEffect(() => {
    return () => {
      // Clear inactivity timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      // Clear session timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      if (currentSession?.session) {
        cleanupSession(currentSession.session);
      }

      // Clear messages to free memory
      setMessages([]);
    };
  }, [currentSession, cleanupSession]);

  // Toggle session (start/stop)
  const toggleSession = useCallback(async () => {
    // Prevent multiple simultaneous calls (guard against rapid clicks)
    if (isStarting) {
      log.warn("Session start already in progress, ignoring duplicate request");
      return;
    }

    if (isSessionActive) {
      // Stop the session
      log.info("Stopping realtime session...");

      if (currentSession) {
        try {
          // Handle WebSocket (transcript mode)
          if ((currentSession as any).ws) {
            const ws = (currentSession as any).ws;
            log.info('Closing WebSocket connection...');

            // Call cleanup for audio resources if available
            if ((currentSession as any).cleanup) {
              (currentSession as any).cleanup();
            }

            ws.close();
          }

          // Handle Session (conversation mode)
          if (currentSession.session) {
            const session = currentSession.session;

            // Remove event listeners
            if ((session as any)._historyHandler) {
              session.off('history_updated', (session as any)._historyHandler);
              delete (session as any)._historyHandler;
            }

            // Clean up transport
            if ('transport' in session && session.transport) {
              const transport = session.transport as any;
              if ('removeAllListeners' in transport) {
                transport.removeAllListeners();
              }
              if ('close' in transport) {
                transport.close();
              }
            }

            // Close the session
            if ('close' in session) {
              await (session as any).close();
            } else if ('disconnect' in session) {
              await (session as any).disconnect();
            }
          }

          setCurrentSession(null);
        } catch (error) {
          log.error("Error disconnecting:", { error });
        }
      }

      setIsSessionActive(false);
      setMessages(prev => [...prev, {
        role: 'system',
        content: '--- Session ended ---'
      }]);
      
    } else {
      // Start a new session
      log.info("Starting realtime session...");

      // Set loading state to prevent duplicate requests
      setIsStarting(true);

      try {
        // Load config from localStorage
        const configStr = localStorage.getItem('ai_config');
        const config = configStr ? JSON.parse(configStr) : {};
        
        if (!config.openai_api_key) {
           toast.error("Please configure your OpenAI API Key in Settings");
           setIsStarting(false);
           return;
        }

        const mode = config.mode || 'conversation';
        const isTranscriptOnly = mode === 'transcript_only';
        setCurrentMode(mode);

        let instructions = '';
        if (!isTranscriptOnly) {
           // Resolve instructions based on selected template
           let selectedTemplate = null;
           
           if (config.selected_custom_template_id) {
              const customTemplatesStr = localStorage.getItem('custom_templates');
              const customTemplates = customTemplatesStr ? JSON.parse(customTemplatesStr) : [];
              selectedTemplate = customTemplates.find((t: any) => t.id === config.selected_custom_template_id);
              setIsCustomTemplate(true);
              setTemplateId(config.selected_custom_template_id);
           } else if (config.selected_template_id) {
               // Import system templates dynamically to avoid issues
               const module = await import('@/lib/templates');
               selectedTemplate = module.SYSTEM_TEMPLATES.find((t: any) => t.id === config.selected_template_id);
               setIsCustomTemplate(false);
               setTemplateId(config.selected_template_id);
           }

           if (selectedTemplate) {
               instructions = selectedTemplate.system_prompt;
           }

           // Append custom instructions if present
           if (config.custom_instructions) {
               instructions += `\n\nAdditional Instructions:\n${config.custom_instructions}`;
           }
        }
        
        const model = 'gpt-4o-realtime-preview-2024-12-17'; // Default model

        // Create new session ID (for compatibility with existing UI)
        const newSessionId = `realtime-${Date.now()}`;
        setSessionId(newSessionId);

        // Get ephemeral token from API route
        log.info('Requesting ephemeral token from API...', { mode, isTranscriptOnly });
        const tokenResponse = await fetch('/api/realtime/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.openai_api_key,
            instructions: instructions,
            isTranscriptOnly: isTranscriptOnly,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(errorData.error || 'Failed to get session token');
        }

        const { token } = await tokenResponse.json();
        log.info('Ephemeral token received successfully');

        // Callback for transcription mode to update UI
        const handleTranscript = (transcript: string) => {
          setMessages(prev => [...prev, {
            role: 'transcript' as const,
            content: transcript
          }]);
        };

        // Use simple realtime function with ephemeral token
        log.info('Starting simple realtime session...', { mode, model, isTranscriptOnly });
        const realtimeResult = await startSimpleRealtimeSession(
          token,
          model,
          isTranscriptOnly,
          instructions,
          isTranscriptOnly ? handleTranscript : undefined
        );

        // Handle different return types (WebSocket for transcript, Session for conversation)
        const realtimeSession = realtimeResult.session;
        const ws = (realtimeResult as any).ws;

        // Register handler to update UI messages from conversation mode
        if (realtimeSession) {
          realtimeSession.on('history_updated', (history: any) => {
            const uiMessages: Message[] = [{ role: 'system', content: '--- Realtime session started ---' }];

            history.forEach((item: any) => {
              if (item.type === 'message') {
                const content = Array.isArray(item.content) ? item.content[0] : item.content;
                const text = content?.transcript || content?.text || '';

                if (text) {
                  uiMessages.push({
                    role: item.role as 'user' | 'assistant',
                    content: text
                  });
                }
              }
            });

            setMessages(uiMessages);
          });
        }

        // Store session or WebSocket
        setCurrentSession(realtimeResult);

        // Set hard limit timeout for session duration (unlimited for own key, but safe default)
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }

        // Start inactivity timer
        resetInactivityTimer();

        setIsSessionActive(true);
        setIsStarting(false); // Clear loading state on success

        setMessages([{
          role: 'system' as const,
          content: '--- Realtime session started ---'
        }]);
        
        toast.success(isTranscriptOnly ? "Microphone listening (Transcript Mode)" : "Connected! Microphone active.");

      } catch (error) {
        log.error("Error starting realtime session:", { error });
        setIsStarting(false); // Clear loading state on error

        if (error instanceof Error && error.message.includes("Realtime API is only available")) {
          toast.error("Please switch to OpenAI provider in Settings to use real-time mode");
        } else {
          toast.error(error instanceof Error ? error.message : "Failed to start session");
        }
      }
    }
  }, [isSessionActive, isStarting, setMessages, router, resetInactivityTimer, cleanupSession, startTracking, stopTracking, currentSession, currentMode]);

  // Handle image upload - Note: Realtime API doesn't support direct image sending
  const sendImage = useCallback(async (imageData: string, prompt: string = "What's in this image?") => {
    if (!isSessionActive) return;
    
    try {
      log.warn("[REALTIME] Image upload requested, but not supported in Realtime mode");
      
      // Add notification to UI
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `⚠️ Image uploads are not supported in Realtime mode. Please use text mode for image analysis.` 
      }]);
      
      toast("Image uploads not supported in Realtime mode. Switch to text mode.");
    } catch (error) {
      log.error("[REALTIME] Error:", { error });
    }
  }, [isSessionActive]);

  // Send text message (compatibility method - Realtime uses voice)
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim() || !isSessionActive || !currentSession?.session) return;
    
    try {
      log.info("[REALTIME] Sending text message:", { text });
      
      // Reset inactivity timer on user interaction
      resetInactivityTimer();
      
      // Add user message to UI with limit
      setMessages(prev => {
        const updated = [...prev, { role: 'user' as const, content: text }];
        return updated.slice(-MAX_MESSAGES);
      });
      
      // Check if this is a special command
      const session = currentSession?.session;
      if (session && session.sendMessage) {
        log.info("[REALTIME] Using session.sendMessage");
        
        // Note: Tools will be triggered automatically based on the message content
        await session.sendMessage(text);
        log.info("[REALTIME] Message sent successfully");
      } else {
        log.error("[REALTIME] Session or sendMessage not available!");
        toast.error("Connection not ready");
      }
    } catch (error) {
      log.error("[REALTIME] Error sending text:", { error });
      toast.error("Failed to send text message");
    }
  }, [isSessionActive, currentSession, resetInactivityTimer]);

  // Start think process
  const startThinkProcess = useCallback(async () => {
    if (!isSessionActive) return;

    try {
      // Create a thinking message
      const thinkingMessageId = `thinking-${Date.now()}`;
      setMessages(prev => [...prev, {
        role: 'log',
        content: '🤔 Thinking about this conversation...',
        // @ts-ignore - Adding temporary id for tracking
        id: thinkingMessageId
      }]);

      // Get conversation context (last 10 messages)
      const conversationContext = messages
        .filter(msg => msg.role !== 'log')
        .slice(-10)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      // Call thinking analysis API
      const response = await fetch('/api/thinking-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate thoughts');
      }

      const data = await response.json();

      if (data.thoughts) {
        // Replace thinking message with the actual thoughts
        setMessages(prev => prev.map(msg =>
          // @ts-ignore - Using temporary id
          msg.id === thinkingMessageId ?
          { role: 'assistant', content: `💭 **My thoughts on this conversation:**\n\n${data.thoughts}`, id: thinkingMessageId } :
          msg
        ));

        toast.success("Thinking process completed!");
      } else {
        throw new Error("No thoughts generated");
      }
    } catch (error) {
      log.error("Error in thinking process:", { error });
      toast.error(error instanceof Error ? error.message : "Failed to start thinking process");

      // Add error message
      setMessages(prev => [...prev, {
        role: 'log',
        content: `Error during thinking: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    }
  }, [isSessionActive, messages]);

  // Save conversation
  const saveConversation = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      // Create conversation data from messages
      const conversationData = {
        sessionId,
        mode: 'realtime',
        messages: messages.filter(m => m.role !== 'system'),
        timestamp: new Date().toISOString(),
      };
      
      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(conversationData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `realtime-conversation-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Conversation saved!");
    } catch (error) {
      log.error("Error saving conversation:", { error });
      toast.error("Failed to save conversation");
    }
  }, [sessionId, messages]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Delete a specific message
  const deleteMessage = useCallback((indexToDelete: number) => {
    setMessages(prevMessages => prevMessages.filter((_, index) => index !== indexToDelete));
  }, []);

  return {
    sessionId,
    isSessionActive,
    isStarting,
    audioStreamControl,
    messages,
    setMessages,
    toggleSession,
    sendTextMessage,
    sendImage,
    startThinkProcess,
    saveConversation,
    clearMessages,
    deleteMessage,
    currentMode
  };
} 