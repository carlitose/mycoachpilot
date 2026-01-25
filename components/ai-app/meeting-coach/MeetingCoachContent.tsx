import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import SpeakerPanel from './SpeakerPanel';
import TranscriptView from './TranscriptView';
import SuggestionsPanel from './SuggestionsPanel';
import MeetingCoachControlBar from './MeetingCoachControlBar';
import { useMeetingCoach } from '@/hooks/meeting-coach/useMeetingCoach';
import type { SessionError } from '@/lib/meeting-coach/types';

interface MeetingCoachContentProps {
  onStateChange: (state: {
    isActive: boolean;
    isConnecting: boolean;
    isConnected: boolean;
    deepgramStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
    hasAudioStream: boolean;
    error: SessionError | undefined;
    history: any; // Meeting history object for history handlers in ChatGPTInterface
  }) => void;
}

export default function MeetingCoachContent({ onStateChange }: MeetingCoachContentProps) {
  // Hook called INTERNALLY - only when component is rendered (Meeting Coach Mode active)
  const meetingCoach = useMeetingCoach();

  // Notify parent when state changes (for SharedHeader badges and history handlers)
  useEffect(() => {
    onStateChange({
      isActive: meetingCoach.isActive,
      isConnecting: meetingCoach.isConnecting,
      isConnected: meetingCoach.isConnected,
      deepgramStatus: meetingCoach.deepgramStatus,
      hasAudioStream: !!meetingCoach.audioStream,
      error: meetingCoach.error,
      history: meetingCoach.history, // Pass history object for history handlers
    });
  }, [
    meetingCoach.isActive,
    meetingCoach.isConnecting,
    meetingCoach.isConnected,
    meetingCoach.deepgramStatus,
    meetingCoach.audioStream,
    meetingCoach.error,
    // NOTE: meetingCoach.history intentionally excluded from dependencies
    // History object is recreated on every render but content doesn't change
    // We pass it in the state object but don't trigger re-renders when it changes
    onStateChange,
  ]);

  // Control bar handlers
  const handleStart = async () => {
    try {
      // Check if config is valid before starting
      if (!meetingCoach.config.config || !meetingCoach.config.isConfigValid()) {
        const errors = meetingCoach.config.getValidationErrors();
        toast.error(`Configuration Error:\n\n${errors.join('\n')}\n\nPlease configure API keys in Settings.`);
        return;
      }

      // First capture audio if not already captured
      if (!meetingCoach.audioStream) {
        await meetingCoach.captureTabAudio();
      }

      // Then start session
      await meetingCoach.startSession();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to start session:\n\n${errorMessage}`);
    }
  };

  const handleStop = () => {
    meetingCoach.stopSession();
  };

  const handleCaptureAudio = async () => {
    try {
      await meetingCoach.captureTabAudio();
      toast.success('Tab audio captured! Click "Start Session" to begin.');
    } catch (error) {
      // Error already handled by useMeetingCoach hook (setError called)
      // Just show toast for user feedback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to capture audio:\n\n${errorMessage}`);
    }
  };

  return (
    <>
      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Speaker Panel */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <SpeakerPanel
            speakers={meetingCoach.speakers}
            userSpeakerId={meetingCoach.session?.userSpeakerId}
            onIdentifySpeaker={meetingCoach.identifySpeaker}
          />
        </div>

        {/* Center - Transcript View */}
        <div className="flex-1 overflow-y-auto p-4">
          <TranscriptView
            segments={meetingCoach.segments}
            userSpeakerId={meetingCoach.session?.userSpeakerId}
          />
        </div>

        {/* Right Sidebar - Suggestions Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <SuggestionsPanel
            suggestions={meetingCoach.suggestions}
            isGenerating={meetingCoach.isSuggestionGenerating}
            onDismiss={meetingCoach.suggestionActions.dismiss}
            onCopy={meetingCoach.suggestionActions.copy}
            onRequestManual={meetingCoach.requestManualSuggestion}
            canRequest={meetingCoach.suggestionActions.canRequest()}
          />
        </div>
      </div>

      {/* Control Bar */}
      <MeetingCoachControlBar
        isActive={meetingCoach.isActive}
        isConnecting={meetingCoach.isConnecting}
        hasAudioStream={!!meetingCoach.audioStream}
        onStart={handleStart}
        onStop={handleStop}
        onCaptureAudio={handleCaptureAudio}
      />
    </>
  );
}
