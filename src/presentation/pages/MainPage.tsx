import { useState, useCallback, type ReactNode } from 'react';

import type { SessionHistoryEntry } from '@application/ports';

import { SuggestionsPanel } from '@presentation/components/coaching/SuggestionsPanel';
import { SessionHistory } from '@presentation/components/history/SessionHistory';
import { SessionViewerDialog } from '@presentation/components/history/SessionViewerDialog';
import { Header } from '@presentation/components/layout/Header';
import { SessionControls } from '@presentation/components/session/SessionControls';
import { SettingsDialog } from '@presentation/components/settings/SettingsDialog';
import { TranscriptPanel } from '@presentation/components/transcript/TranscriptPanel';
import { useSessionHistory } from '@presentation/hooks/useSessionHistory';

/**
 * Generate a meaningful session title based on available data
 */
function generateSessionTitle(entry: SessionHistoryEntry): string {
  // 1. User-entered session name (PRIORITY)
  if (entry.name) {
    return entry.name;
  }

  // 2. Custom speaker names (exclude default names)
  const customSpeakers = entry.speakers
    .filter(s => s.name && s.name !== 'You' && s.name !== 'Others' && !s.name.startsWith('Speaker '))
    .map(s => s.name as string);

  if (customSpeakers.length > 0) {
    const names = customSpeakers.slice(0, 2).join(', ');
    return `Call with ${names}${customSpeakers.length > 2 ? '...' : ''}`;
  }

  // 3. First transcript segment text
  const firstSegment = entry.segments[0];
  if (firstSegment) {
    const text = firstSegment.text.trim();
    if (text.length > 0) {
      return text.length > 30 ? text.substring(0, 30) + '...' : text;
    }
  }

  // 4. Timestamp-based with mode label
  const timestamp = entry.session.startedAt ?? entry.savedAt;
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const modeLabel = entry.session.mode === 'meeting_coach' ? 'Meeting' : 'Conversation';

  return `${modeLabel} ${time}`;
}

export function MainPage(): ReactNode {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { history, deleteSession } = useSessionHistory();

  // Transform history entries to format expected by SessionHistory component
  const sessions = history.map((entry) => ({
    id: entry.session.id,
    name: generateSessionTitle(entry),
    startTime: new Date(entry.session.startedAt ?? entry.savedAt).getTime(),
    duration: entry.session.endedAt && entry.session.startedAt
      ? new Date(entry.session.endedAt).getTime() - new Date(entry.session.startedAt).getTime()
      : 0,
    transcriptCount: entry.segments.length,
    suggestionsCount: entry.suggestions.length,
  }));

  const handleDeleteSession = useCallback((id: string): void => {
    void deleteSession(id);
  }, [deleteSession]);

  const handleLoadSession = useCallback((id: string): void => {
    setSelectedSessionId(id);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <Header onOpenSettings={() => { setShowSettings(true); }} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
          {/* Session Controls */}
          <SessionControls onOpenSettings={() => { setShowSettings(true); }} />

          {/* Content Grid */}
          <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-3">
            {/* Transcript Panel - 2 columns on large screens */}
            <div className="lg:col-span-2 overflow-hidden">
              <TranscriptPanel />
            </div>

            {/* Right Column - Suggestions and History */}
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <SuggestionsPanel />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <SessionHistory
                  sessions={sessions}
                  onDeleteSession={handleDeleteSession}
                  onLoadSession={handleLoadSession}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />

      {/* Session Viewer Dialog */}
      <SessionViewerDialog
        sessionId={selectedSessionId}
        open={selectedSessionId !== null}
        onOpenChange={(open) => { if (!open) setSelectedSessionId(null); }}
      />
    </div>
  );
}
