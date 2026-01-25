"use client"
import React, { useEffect, useRef } from 'react';
import { useState, ChangeEvent } from 'react';

// Importing components
import MessageList from '@/components/ai-app/MessageList'
import TabAudioCaptureGuide from '@/components/ai-app/TabAudioCaptureGuide'
import MobileMenu from '@/components/ai-app/MobileMenu'
import EmptyState from '@/components/ai-app/EmptyState'
import OnboardingTour from '@/components/ai-app/OnboardingTour'
import FloatingTranscriptPiP from '@/components/ai-app/FloatingTranscriptPiP'
import SessionHistoryViewer from '@/components/ai-app/SessionHistoryViewer'
import ResumedSessionBanner from '@/components/ai-app/ResumedSessionBanner'

// Shared components
import SharedHeader from '@/components/ai-app/shared/SharedHeader'
import AudioStreamBadge from '@/components/ai-app/shared/AudioStreamBadge'
import UnifiedHistoryDrawer from '@/components/ai-app/shared/UnifiedHistoryDrawer'

// Conversation components
import ConversationControlBar from '@/components/ai-app/conversation/ConversationControlBar'

// Meeting Coach components
import MeetingCoachContent from '@/components/ai-app/meeting-coach/MeetingCoachContent'
import MeetingHistoryViewer from '@/components/ai-app/meeting-coach/MeetingHistoryViewer'
import StatusBadge from '@/components/ai-app/meeting-coach/StatusBadge'

// Importing hooks
import { useSession } from '@/hooks/ai-hooks/useSession'
import { useScreenCapture } from '@/hooks/ai-hooks/useScreenCapture'
import { useFileUpload } from '@/hooks/ai-hooks/useFileUpload'
import { useTabAudioCapture } from '@/hooks/ai-hooks/useTabAudioCapture'
import { usePictureInPicture } from '@/hooks/ai-hooks/usePictureInPicture'
import { useSessionHistory } from '@/hooks/ai-hooks/useSessionHistory'
import type { SessionHistory, ResumedSessionInfo } from '@/types/ai-types/chat'
import type { MeetingHistoryItem } from '@/lib/meeting-coach/types'
import { toast } from 'react-hot-toast'


export default function ChatGPTInterface() {
  // State for tab capture guide modal
  const [showTabCaptureGuide, setShowTabCaptureGuide] = useState(false);

  // State for onboarding tour
  const [showOnboarding, setShowOnboarding] = useState(false);

  // State for session history
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<SessionHistory | null>(null);
  const [selectedMeetingSession, setSelectedMeetingSession] = useState<MeetingHistoryItem | null>(null);

  // Ref to track previous session state for auto-save
  const prevSessionActiveRef = useRef(false);

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
    currentMode,
    sessionStartTime,
    templateId,
    // Resume support
    resumedFromSession,
    loadResumedMessages,
    clearResumeState,
  } = useSession();

  // Meeting Coach lifted state for SharedHeader and history handlers (hook now called in MeetingCoachContent)
  const [meetingCoachHeaderState, setMeetingCoachHeaderState] = useState({
    isActive: false,
    isConnecting: false,
    isConnected: false,
    deepgramStatus: 'disconnected' as 'connected' | 'connecting' | 'disconnected' | 'error',
    hasAudioStream: false,
    error: undefined as any,
    history: null as any, // History object from useMeetingCoach for history handlers
  });

  // Use session history hook
  const {
    sessions: historySessions,
    loadSession,
    saveSession: saveToHistory,
    deleteSession: deleteHistorySession,
    clearAllHistory,
    exportSession,
    storageInfo,
    getConversationSummary,
  } = useSessionHistory();

  // Auto-save session to history when session ends
  useEffect(() => {
    // Detect transition from active to inactive
    if (prevSessionActiveRef.current && !isSessionActive) {
      // Session just ended - save to history
      if (sessionId && sessionStartTime && messages.length > 0) {
        saveToHistory({
          sessionId,
          startedAt: sessionStartTime,
          mode: currentMode,
          messages,
          templateId: templateId || undefined,
        });
      }
    }
    prevSessionActiveRef.current = isSessionActive;
  }, [isSessionActive, sessionId, sessionStartTime, messages, currentMode, templateId, saveToHistory]);

  // Handle selecting a session from history
  const handleSelectHistorySession = (historySessionId: string) => {
    const session = loadSession(historySessionId);
    if (session) {
      setSelectedHistorySession(session);
      setIsHistoryDrawerOpen(false);
    }
  };

  // Handle export from viewer
  const handleExportSelectedSession = () => {
    if (selectedHistorySession) {
      exportSession(selectedHistorySession.sessionId);
    }
  };

  // Handle resume session from history
  const handleResumeSession = (historySessionId: string) => {
    const session = loadSession(historySessionId);
    if (!session) {
      toast.error('Session not found');
      return;
    }

    const resumeInfo: ResumedSessionInfo = {
      originalSessionId: session.sessionId,
      originalTitle: session.title,
      resumedAt: new Date().toISOString(),
      messageCount: session.messages.length,
    };

    const contextSummary = getConversationSummary(session);
    loadResumedMessages(session.messages, resumeInfo, contextSummary);

    setSelectedHistorySession(null);
    setIsHistoryDrawerOpen(false);
    toast.success('Session resumed! Start a new session to continue.');
  };

  // Determine if resume is allowed (not during active session)
  const canResumeSession = !isSessionActive;

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
    error: tabCaptureError,
    getTabAudioOnly
  } = useTabAudioCapture();

  // Use Picture-in-Picture hook for floating transcript
  const {
    isPiPSupported,
    isPiPOpen,
    pipWindow,
    openPiP,
    closePiP
  } = usePictureInPicture({ width: 400, height: 500 });

  // Handle PiP toggle
  const handleTogglePiP = async () => {
    if (isPiPOpen) {
      closePiP();
    } else {
      await openPiP();
    }
  };

  // Handle tab capture start
  const handleStartTabCapture = async () => {
    setShowTabCaptureGuide(false);
    const stream = await startTabCapture();

    if (stream) {
      // Check if audio tracks exist
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: "⚠️ No audio captured. Make sure to check 'Share tab audio' in the browser dialog."
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: 'system',
        content: '🎵 Tab audio capture started!'
      }]);

      // If session is already active, restart it with tab audio
      if (isSessionActive) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: '🔄 Restarting session to include tab audio...'
        }]);

        // Stop current session
        await toggleSession();

        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 500));

        // Restart with tab audio
        const tabAudioStream = getTabAudioOnly();
        await toggleSession(tabAudioStream);
      }
    } else if (tabCaptureError) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Tab capture failed: ${tabCaptureError}`
      }]);
    }
  };

  // Handle toggle session with optional tab audio
  const handleToggleSession = async () => {
    // If tab audio is being captured, pass it to the session
    const tabAudioStream = isCapturingTabAudio ? getTabAudioOnly() : null;
    await toggleSession(tabAudioStream);
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

  // Meeting Coach history handlers (control bar handlers moved to MeetingCoachContent)
  const handleSelectMeetingSession = (sessionId: string) => {
    if (!meetingCoachHeaderState.history) return;
    const session = meetingCoachHeaderState.history.getSession(sessionId);
    if (session) {
      setSelectedMeetingSession(session);
      setIsHistoryDrawerOpen(false);
    }
  };

  const handleExportMeetingSession = (sessionId: string, format: 'json' | 'txt') => {
    if (!meetingCoachHeaderState.history) return;
    meetingCoachHeaderState.history.downloadSession(sessionId, format);
  };

  const handleDeleteMeetingSession = (sessionId: string) => {
    if (!meetingCoachHeaderState.history) return;
    if (confirm('Delete this meeting session from history?')) {
      meetingCoachHeaderState.history.deleteSession(sessionId);
    }
  };

  const handleClearMeetingHistory = () => {
    if (!meetingCoachHeaderState.history) return;
    if (confirm('Delete all meeting history? This cannot be undone.')) {
      meetingCoachHeaderState.history.clearHistory();
    }
  };

  const handleExportSelectedMeeting = (format: 'json' | 'txt') => {
    if (!selectedMeetingSession) return;
    handleExportMeetingSession(selectedMeetingSession.id, format);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50">
      {/* Unified Header */}
      <SharedHeader
        mode={currentMode === 'meeting_coach' ? 'meeting_coach' : 'conversation'}
        isSessionActive={currentMode === 'meeting_coach' ? meetingCoachHeaderState.isActive : isSessionActive}
        audioStreamIndicator={
          currentMode === 'meeting_coach' ? (
            <AudioStreamBadge isCapturing={meetingCoachHeaderState.hasAudioStream} />
          ) : undefined
        }
        sessionTimer={
          // TODO: Re-enable SessionTimer by passing session startTime through onStateChange
          undefined
        }
        statusBadge={
          currentMode === 'meeting_coach' ? (
            <StatusBadge
              isActive={meetingCoachHeaderState.isActive}
              isConnecting={meetingCoachHeaderState.isConnecting}
              isConnected={meetingCoachHeaderState.isConnected}
              deepgramStatus={meetingCoachHeaderState.deepgramStatus}
              error={meetingCoachHeaderState.error}
            />
          ) : undefined
        }
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        mobileMenu={
          currentMode === 'conversation' ? (
            <MobileMenu
              isCapturingTabAudio={isCapturingTabAudio}
              onStartTabCapture={handleStartTabCapture}
              onStopTabCapture={stopTabCapture}
              onOpenHistory={() => setIsHistoryDrawerOpen(true)}
            />
          ) : undefined
        }
      />

      {/* Content Area - Conditional based on mode */}
      {currentMode === 'conversation' ? (
        <>
          {/* Resumed Session Banner */}
          {resumedFromSession && (
            <ResumedSessionBanner
              sessionInfo={resumedFromSession}
              onClear={clearResumeState}
            />
          )}

          {/* Show EmptyState when no messages and session not active */}
          {messages.length === 0 && !isSessionActive ? (
            <EmptyState onStartSession={handleToggleSession} />
          ) : (
            <MessageList
              messages={messages}
              onDeleteMessage={deleteMessage}
            />
          )}

          {/* Conversation Control Bar */}
          <ConversationControlBar
            isSessionActive={isSessionActive}
            isConnected={isConnected}
            isStreamError={isStreamError}
            isCapturingScreen={isCapturingScreen}
            isProcessingFile={isProcessingFile}
            isPiPOpen={isPiPOpen}
            isPiPSupported={isPiPSupported}
            onToggleSession={handleToggleSession}
            onAnalyzeScreenshot={handleAnalyzeScreenshot}
            onUploadFile={triggerFileInput}
            onThink={startThinkProcess}
            onSaveConversation={saveConversation}
            onClear={clearMessages}
            onTogglePiP={handleTogglePiP}
            onSendMessage={sendTextMessage}
          />
        </>
      ) : (
        <>
          {/* Meeting Coach Mode - self-contained with hook, 3-panel layout, and control bar */}
          <MeetingCoachContent onStateChange={setMeetingCoachHeaderState} />
        </>
      )}
      
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

      {/* Picture-in-Picture Transcript Popup */}
      <FloatingTranscriptPiP
        messages={messages}
        isSessionActive={isSessionActive}
        pipWindow={pipWindow}
        onClose={closePiP}
      />

      {/* Unified History Drawer */}
      {currentMode === 'conversation' ? (
        <UnifiedHistoryDrawer
          mode="conversation"
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          sessions={historySessions}
          onSelectSession={handleSelectHistorySession}
          onDeleteSession={deleteHistorySession}
          onClearAll={clearAllHistory}
          storageInfo={storageInfo}
          onResumeSession={handleResumeSession}
          canResume={canResumeSession}
        />
      ) : (
        <UnifiedHistoryDrawer
          mode="meeting_coach"
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          sessions={meetingCoachHeaderState.history?.history || []}
          onSelectSession={handleSelectMeetingSession}
          onDeleteSession={handleDeleteMeetingSession}
          onClearAll={handleClearMeetingHistory}
          storageInfo={{
            count: meetingCoachHeaderState.history?.history.length || 0,
            maxCount: 100,
          }}
          onExportSession={handleExportMeetingSession}
        />
      )}

      {/* Conversation History Viewer */}
      {currentMode === 'conversation' && (
        <SessionHistoryViewer
          isOpen={selectedHistorySession !== null}
          onClose={() => setSelectedHistorySession(null)}
          session={selectedHistorySession}
          onExport={handleExportSelectedSession}
          onResume={() => selectedHistorySession && handleResumeSession(selectedHistorySession.sessionId)}
          canResume={canResumeSession}
        />
      )}

      {/* Meeting History Viewer */}
      {currentMode === 'meeting_coach' && (
        <MeetingHistoryViewer
          isOpen={selectedMeetingSession !== null}
          onClose={() => setSelectedMeetingSession(null)}
          session={selectedMeetingSession}
          onExport={handleExportSelectedMeeting}
        />
      )}
    </div>
  )
} 