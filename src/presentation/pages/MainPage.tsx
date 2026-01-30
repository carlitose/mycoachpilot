import { useState, useCallback, type ReactNode } from 'react';

import { SuggestionsPanel } from '@presentation/components/coaching/SuggestionsPanel';
import { SessionHistory } from '@presentation/components/history/SessionHistory';
import { Header } from '@presentation/components/layout/Header';
import { SessionControls } from '@presentation/components/session/SessionControls';
import { SettingsDialog } from '@presentation/components/settings/SettingsDialog';
import { TranscriptPanel } from '@presentation/components/transcript/TranscriptPanel';
import { useSessionHistory } from '@presentation/hooks/useSessionHistory';

export function MainPage(): ReactNode {
  const [showSettings, setShowSettings] = useState(false);
  const { history, deleteSession } = useSessionHistory();

  // Transform history entries to format expected by SessionHistory component
  const sessions = history.map((entry) => ({
    id: entry.session.id,
    name: `Session ${entry.session.mode}`,
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
    // TODO: Implement load session functionality - restore transcript and suggestions
    void id;
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
    </div>
  );
}
