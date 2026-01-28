import { useState, type ReactNode } from 'react';

import { SuggestionsPanel } from '@presentation/components/coaching/SuggestionsPanel';
import { SessionHistory } from '@presentation/components/history/SessionHistory';
import { Header } from '@presentation/components/layout/Header';
import { SessionControls } from '@presentation/components/session/SessionControls';
import { SettingsDialog } from '@presentation/components/settings/SettingsDialog';
import { TranscriptPanel } from '@presentation/components/transcript/TranscriptPanel';

export function MainPage(): ReactNode {
  const [showSettings, setShowSettings] = useState(false);

  // Mock session history data - in real app this would come from a hook
  const sessions: { id: string; name: string; startTime: number; duration: number; transcriptCount: number; suggestionsCount: number }[] = [];

  const handleDeleteSession = (id: string): void => {
    // TODO: Implement delete functionality
    void id;
  };

  const handleLoadSession = (id: string): void => {
    // TODO: Implement load functionality
    void id;
  };

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
