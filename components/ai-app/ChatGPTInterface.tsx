"use client"
import React from 'react';
import Link from "next/link";
import { useState, ChangeEvent } from 'react';

// Importing components
import MessageList from '@/components/ai-app/MessageList'
import MessageInput from '@/components/ai-app/MessageInput'
import ControlBar from '@/components/ai-app/ControlBar'
import TabAudioCaptureGuide from '@/components/ai-app/TabAudioCaptureGuide'
import MobileMenu from '@/components/ai-app/MobileMenu'
import EmptyState from '@/components/ai-app/EmptyState'
import OnboardingTour from '@/components/ai-app/OnboardingTour'

// Importing hooks
import { useSession } from '@/hooks/ai-hooks/useSession'
import { useScreenCapture } from '@/hooks/ai-hooks/useScreenCapture'
import { useFileUpload } from '@/hooks/ai-hooks/useFileUpload'
import { useTabAudioCapture } from '@/hooks/ai-hooks/useTabAudioCapture'


export default function ChatGPTInterface() {
  // State for tab capture guide modal
  const [showTabCaptureGuide, setShowTabCaptureGuide] = useState(false);

  // State for onboarding tour
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Use session hook
  const {
    sessionId,
    isSessionActive,
    messages,
    setMessages,
    toggleSession,
    sendTextMessage,
    startThinkProcess,
    saveConversation,
    clearMessages,
    deleteMessage,
    // currentMode - available but not used in this component yet
  } = useSession();

  // For Realtime mode, connection status is based on session status
  const isConnected = isSessionActive;
  const isStreamError = false;

  // Use screen capture hook
  const {
    isCapturingScreen,
    // availableScreens,
    // selectedScreen,
    // setSelectedScreen,
    handleAnalyzeScreenshot
  } = useScreenCapture({
    sessionId,
    isSessionActive,
    setMessages,
    sendTextMessage
  });

  // Use file upload hook
  const {
    isProcessingFile,
    handleFileUpload,
    triggerFileInput,
    fileInputRef
  } = useFileUpload({
    sessionId,
    isSessionActive,
    setMessages,
    sendTextMessage
  });

  // Use tab audio capture hook
  const {
    isCapturing: isCapturingTabAudio,
    startTabCapture,
    stopTabCapture,
    error: tabCaptureError
  } = useTabAudioCapture();

  // Handle tab capture start
  const handleStartTabCapture = async () => {
    setShowTabCaptureGuide(false);
    const stream = await startTabCapture();
    if (stream) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: '🎵 Tab audio capture started! The app can now hear audio from the selected tab.' 
      }]);
    } else if (tabCaptureError) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `❌ Tab capture failed: ${tabCaptureError}` 
      }]);
    }
  };

  // Check if user has completed onboarding
  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Check localStorage first for faster response
        const localOnboarding = localStorage.getItem('onboarding_completed');

        if (localOnboarding === 'true') {
          return;
        }
        
        // Show onboarding for new users
        setShowOnboarding(true);
      } catch (error) {
        // Show onboarding on error to be safe
        setShowOnboarding(true);
      }
    };

    checkOnboarding();
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);

    // Save to localStorage
    localStorage.setItem('onboarding_completed', 'true');
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  // No cleanup needed as it's handled in useSession hook

  // Handle file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50">
      {/* Header - Desktop & Mobile */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-lg md:text-xl font-bold truncate">My Coach Pilot</h1>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-3">
          {isCapturingTabAudio ? (
            <button
              onClick={stopTabCapture}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Stop Tab Audio
            </button>
          ) : (
            <button
              onClick={() => setShowTabCaptureGuide(true)}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-md transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Capture Tab Audio
            </button>
          )}
          <Link href="/app/settings/ai" className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded-md transition">
            AI Settings
          </Link>
        </div>

        {/* Mobile Menu - Visible only on Mobile */}
        <MobileMenu
          isCapturingTabAudio={isCapturingTabAudio}
          onStartTabCapture={handleStartTabCapture}
          onStopTabCapture={stopTabCapture}
        />
      </div>

      {/* Show EmptyState when no messages and session not active */}
      {messages.length === 0 && !isSessionActive ? (
        <EmptyState onStartSession={toggleSession} />
      ) : (
        <MessageList
          messages={messages}
          onDeleteMessage={deleteMessage}
        />
      )}
      
      <div className="border-t border-slate-800 bg-slate-900">
        <div className="px-4 pt-3 pb-4 space-y-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <ControlBar
            isSessionActive={isSessionActive}
            isConnected={isConnected}
            isStreamError={isStreamError}
            isCapturingScreen={isCapturingScreen}
            isProcessingFile={isProcessingFile}
            onToggleSession={toggleSession}
            onAnalyzeScreenshot={handleAnalyzeScreenshot}
            onUploadFile={triggerFileInput}
            onThink={startThinkProcess}
            onSaveConversation={saveConversation}
            onClear={clearMessages}
          />

          <MessageInput
            isSessionActive={isSessionActive}
            onSendMessage={sendTextMessage}
          />

          {isSessionActive && (
            <div className="text-xs text-center text-slate-500">
              🎤 Using WebRTC for ultra-low latency voice streaming
            </div>
          )}
        </div>
      </div>
      
      <TabAudioCaptureGuide
        isOpen={showTabCaptureGuide}
        onClose={() => setShowTabCaptureGuide(false)}
        onStartCapture={handleStartTabCapture}
      />

      {/* Onboarding Tour for new users */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Hidden file input for upload functionality */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  )
} 