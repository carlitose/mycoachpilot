import { Play, Square, Trash2, Save, Brain, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlBarProps {
  isSessionActive: boolean;
  isConnected: boolean;
  isStreamError: boolean;
  isCapturingScreen: boolean;
  isProcessingFile?: boolean;
  onToggleSession: () => void;
  onAnalyzeScreenshot: () => void;
  onUploadFile?: () => void;
  onThink: () => void;
  onSaveConversation: () => void;
  onClear: () => void;
}

export default function ControlBar({
  isSessionActive,
  isConnected,
  isStreamError,
  isCapturingScreen,
  isProcessingFile,
  onToggleSession,
  onAnalyzeScreenshot,
  onUploadFile,
  onThink,
  onSaveConversation,
  onClear
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {/* Session Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSession}
        title={isSessionActive ? "End session" : "Start session"}
        className="shrink-0 p-2"
      >
        {isSessionActive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </Button>

      {/* Screenshot */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAnalyzeScreenshot}
        disabled={!isSessionActive || isCapturingScreen}
        title="Capture and analyze screen"
        className="shrink-0 p-2"
      >
        <Camera className="w-5 h-5" />
        {isCapturingScreen && <span className="ml-2 hidden sm:inline text-xs">Capturing...</span>}
      </Button>

      {/* Upload File */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onUploadFile}
        disabled={!isSessionActive || isProcessingFile}
        title="Upload image or file"
        className="shrink-0 p-2"
      >
        <Upload className="w-5 h-5" />
        {isProcessingFile && <span className="ml-2 hidden sm:inline text-xs">Processing...</span>}
      </Button>

      {/* Think */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onThink}
        disabled={!isSessionActive}
        title="Think"
        className="shrink-0 p-2"
      >
        <Brain className="w-5 h-5" />
      </Button>

      {/* Save */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSaveConversation}
        title="Save conversation"
        disabled={!isSessionActive}
        className="shrink-0 p-2"
      >
        <Save className="w-5 h-5" />
      </Button>

      {/* Clear */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        title="Clear chat"
        className="shrink-0 p-2"
      >
        <Trash2 className="w-5 h-5" />
      </Button>

      {/* Connection Status - Text on desktop, small dot on mobile */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {/* Mobile: Small subtle dot */}
        <span
          className={`md:hidden w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500/70' : 'bg-red-500/70'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
        {/* Desktop: Full text */}
        <span className="hidden md:block text-xs text-slate-400">
          {isConnected ? 'Connected' : 'Disconnected'}
          {isStreamError && ' - Streaming error'}
        </span>
      </div>
    </div>
  );
} 