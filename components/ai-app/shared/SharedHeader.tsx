/**
 * SharedHeader Component
 *
 * Unified header for both Conversation and Meeting Coach modes.
 * Provides common UI: title, Settings link, History button, status indicators.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, History } from 'lucide-react';

interface SharedHeaderProps {
  mode: 'conversation' | 'meeting_coach';
  isSessionActive: boolean;

  // Optional mode-specific elements
  audioStreamIndicator?: React.ReactNode;
  sessionTimer?: React.ReactNode;
  statusBadge?: React.ReactNode;

  // Actions
  onOpenHistory: () => void;

  // Optional mobile menu
  mobileMenu?: React.ReactNode;
}

export default function SharedHeader({
  mode,
  isSessionActive,
  audioStreamIndicator,
  sessionTimer,
  statusBadge,
  onOpenHistory,
  mobileMenu,
}: SharedHeaderProps) {
  const title = mode === 'meeting_coach' ? 'Meeting Coach' : 'My Coach Pilot';

  return (
    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
      {/* Left - Title and Status */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>

        {/* Status Badge (Meeting Coach only) */}
        {statusBadge}

        {/* Audio Stream Indicator */}
        {audioStreamIndicator}
      </div>

      {/* Center - Session Timer (Meeting Coach only) */}
      {sessionTimer && (
        <div className="flex items-center">
          {sessionTimer}
        </div>
      )}

      {/* Right - Controls */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onOpenHistory}
          className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded-md transition flex items-center gap-1"
          title="Session History"
        >
          <History className="w-4 h-4" />
          History
        </button>

        <Link
          href="/app/settings/ai"
          className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded-md transition flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>

      {/* Mobile Menu - Visible only on mobile */}
      {mobileMenu}
    </div>
  );
}
