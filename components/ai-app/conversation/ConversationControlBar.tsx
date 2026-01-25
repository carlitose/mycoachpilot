import React from 'react';
import ControlBar from '@/components/ai-app/ControlBar';
import MessageInput from '@/components/ai-app/MessageInput';

interface ConversationControlBarProps {
  isSessionActive: boolean;
  isConnected: boolean;
  isStreamError: boolean;
  isCapturingScreen: boolean;
  isProcessingFile: boolean;
  isPiPOpen: boolean;
  isPiPSupported: boolean;
  onToggleSession: () => void;
  onAnalyzeScreenshot: () => void;
  onUploadFile: () => void;
  onThink: () => void;
  onSaveConversation: () => void;
  onClear: () => void;
  onTogglePiP: () => void;
  onSendMessage: (message: string) => void;
}

export default function ConversationControlBar({
  isSessionActive,
  isConnected,
  isStreamError,
  isCapturingScreen,
  isProcessingFile,
  isPiPOpen,
  isPiPSupported,
  onToggleSession,
  onAnalyzeScreenshot,
  onUploadFile,
  onThink,
  onSaveConversation,
  onClear,
  onTogglePiP,
  onSendMessage,
}: ConversationControlBarProps) {
  return (
    <div className="border-t border-slate-800 bg-slate-900">
      <div className="px-4 pt-3 pb-4 space-y-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <ControlBar
          isSessionActive={isSessionActive}
          isConnected={isConnected}
          isStreamError={isStreamError}
          isCapturingScreen={isCapturingScreen}
          isProcessingFile={isProcessingFile}
          isPiPOpen={isPiPOpen}
          isPiPSupported={isPiPSupported}
          onToggleSession={onToggleSession}
          onAnalyzeScreenshot={onAnalyzeScreenshot}
          onUploadFile={onUploadFile}
          onThink={onThink}
          onSaveConversation={onSaveConversation}
          onClear={onClear}
          onTogglePiP={onTogglePiP}
        />

        <MessageInput
          isSessionActive={isSessionActive}
          onSendMessage={onSendMessage}
        />

        {isSessionActive && (
          <div className="text-xs text-center text-slate-500">
            🎤 Using WebRTC for ultra-low latency voice streaming
          </div>
        )}
      </div>
    </div>
  );
}
