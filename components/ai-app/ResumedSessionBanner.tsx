'use client';

import { RotateCcw, X } from 'lucide-react';
import type { ResumedSessionInfo } from '@/types/ai-types/chat';

interface ResumedSessionBannerProps {
  sessionInfo: ResumedSessionInfo;
  onClear: () => void;
}

export default function ResumedSessionBanner({
  sessionInfo,
  onClear,
}: ResumedSessionBannerProps) {
  return (
    <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-amber-200">
        <RotateCcw size={14} className="flex-shrink-0" />
        <span>
          Resumed: <strong className="font-medium">{sessionInfo.originalTitle || 'Previous session'}</strong>
          <span className="text-amber-400/70 ml-2">({sessionInfo.messageCount} messages)</span>
        </span>
      </div>
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded hover:bg-amber-800/30 transition"
        title="Clear resumed session"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  );
}
