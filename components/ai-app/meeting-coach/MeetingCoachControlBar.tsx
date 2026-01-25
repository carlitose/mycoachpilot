import React from 'react';
import { Play, Square, Mic } from 'lucide-react';

interface MeetingCoachControlBarProps {
  isActive: boolean;
  isConnecting: boolean;
  hasAudioStream: boolean;
  onStart: () => void;
  onStop: () => void;
  onCaptureAudio: () => void;
}

export default function MeetingCoachControlBar({
  isActive,
  isConnecting,
  hasAudioStream,
  onStart,
  onStop,
  onCaptureAudio,
}: MeetingCoachControlBarProps) {
  return (
    <div className="border-t border-slate-800 bg-slate-900">
      <div className="px-4 pt-3 pb-4 space-y-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-center gap-3">
          {!isActive && !isConnecting && (
            <>
              {!hasAudioStream && (
                <button
                  onClick={onCaptureAudio}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition flex items-center gap-2"
                >
                  <Mic size={18} />
                  Capture Tab Audio
                </button>
              )}
              <button
                onClick={onStart}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center gap-2"
                disabled={!hasAudioStream}
              >
                <Play size={18} />
                Start Session
              </button>
            </>
          )}

          {(isActive || isConnecting) && (
            <button
              onClick={onStop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition flex items-center gap-2"
            >
              <Square size={18} />
              Stop Session
            </button>
          )}
        </div>

        {hasAudioStream && !isActive && (
          <div className="text-xs text-center text-slate-400">
            ✓ Audio captured. Click &quot;Start Session&quot; to begin.
          </div>
        )}

        {isActive && (
          <div className="text-xs text-center text-slate-400">
            🎤 Recording meeting audio and generating real-time suggestions
          </div>
        )}
      </div>
    </div>
  );
}
