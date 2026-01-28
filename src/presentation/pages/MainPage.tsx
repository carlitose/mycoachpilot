import { useState, useCallback, useEffect, type ReactNode } from 'react';

import type { SessionModeType } from '@domain/session';

import { Card } from '../components/common';
import { SpeakerPanel, TranscriptView, SuggestionList, SpeakerSelector } from '../components/meetingCoach';
import { SessionControls, SessionStatus, ModeSelector, AudioVisualizer } from '../components/session';
import { MessageList, TextInput } from '../components/transcript';
import { useSession, useTranscript, useSettings } from '../hooks';

export function MainPage(): ReactNode {
  const { defaultMode, defaultTemplate, templates } = useSettings();
  const { isActive, mode, audioLevel } = useSession();
  const { speakers, userSpeakerId, identifyUserSpeaker } = useTranscript();

  const [selectedMode, setSelectedMode] = useState<SessionModeType>(defaultMode);
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplate);
  const [showSpeakerSelector, setShowSpeakerSelector] = useState(false);

  // Update when defaults change
  useEffect(() => {
    if (!isActive) {
      setSelectedMode(defaultMode);
      setSelectedTemplateId(defaultTemplate);
    }
  }, [defaultMode, defaultTemplate, isActive]);

  // Show speaker selector when speakers are detected and user hasn't identified themselves
  useEffect(() => {
    if (isActive && mode === 'meeting_coach' && speakers.length >= 2 && userSpeakerId === null) {
      setShowSpeakerSelector(true);
    }
  }, [isActive, mode, speakers.length, userSpeakerId]);

  const handleSpeakerSelect = useCallback((speakerId: number) => {
    identifyUserSpeaker(speakerId);
    setShowSpeakerSelector(false);
  }, [identifyUserSpeaker]);

  const activeMode = isActive ? mode : selectedMode;
  const isMeetingCoach = activeMode === 'meeting_coach';
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <SessionStatus />
          <AudioVisualizer audioLevel={audioLevel} isActive={isActive} type="bar" />
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left panel - Configuration (when not active) or Speakers (meeting coach) */}
        {!isActive && (
          <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="p-4 space-y-6">
              <ModeSelector
                value={selectedMode}
                onChange={setSelectedMode}
              />

              {selectedMode !== 'meeting_coach' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Template
                  </label>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => { setSelectedTemplateId(template.id); }}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                          ${selectedTemplateId === template.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <span className="text-xl">{template.icon}</span>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {template.name}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMode === 'meeting_coach' && (
                <Card>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Meeting Coach Mode</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Real-time speaker diarization</li>
                      <li>• Contextual coaching suggestions</li>
                      <li>• Capture tab audio for virtual meetings</li>
                    </ul>
                  </div>
                </Card>
              )}
            </div>
          </aside>
        )}

        {/* Meeting Coach sidebar when active */}
        {isActive && isMeetingCoach && (
          <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <SpeakerPanel
                userSpeakerId={userSpeakerId}
                onSelectUser={handleSpeakerSelect}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <SuggestionList />
            </div>
          </aside>
        )}

        {/* Center - Transcript/Messages */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
          {isMeetingCoach ? (
            <TranscriptView autoScroll />
          ) : (
            <>
              <MessageList autoScroll />
              {selectedMode === 'conversation' && <TextInput />}
            </>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <footer className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-center">
          <SessionControls
            mode={selectedMode}
            templateId={selectedTemplateId}
            systemPrompt={selectedTemplate?.systemPrompt}
            captureTabAudio={selectedMode === 'meeting_coach'}
          />
        </div>
      </footer>

      {/* Speaker selector modal */}
      <SpeakerSelector
        isOpen={showSpeakerSelector}
        onClose={() => { setShowSpeakerSelector(false); }}
        onSelect={handleSpeakerSelect}
      />
    </div>
  );
}
