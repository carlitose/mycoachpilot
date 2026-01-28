import { useCallback, type ReactNode } from 'react';

import type { SessionModeType } from '@domain/session';
import type { CoachingStyleType } from '@domain/settings';

import { useSettings } from '@presentation/hooks';

import { Card, CardHeader, CardTitle, CardContent } from '../common';
import { ModeSelector } from '../session/ModeSelector';

import { ApiKeyInput } from './ApiKeyInput';
import { CoachingStyleSelector } from './CoachingStyleSelector';
import { TemplateSelector } from './TemplateSelector';

export function SettingsPanel(): ReactNode {
  const {
    config,
    isLoading,
    isSaving,
    defaultMode,
    defaultTemplate,
    coachingStyle,
    saveOpenaiKey,
    saveDeepgramKey,
    saveDefaultMode,
    saveDefaultTemplate,
    saveCoachingStyle,
  } = useSettings();

  const handleOpenaiKeyChange = useCallback((key: string | null) => {
    void saveOpenaiKey(key);
  }, [saveOpenaiKey]);

  const handleDeepgramKeyChange = useCallback((key: string | null) => {
    void saveDeepgramKey(key);
  }, [saveDeepgramKey]);

  const handleModeChange = useCallback((mode: SessionModeType) => {
    void saveDefaultMode(mode);
  }, [saveDefaultMode]);

  const handleTemplateChange = useCallback((templateId: string) => {
    void saveDefaultTemplate(templateId);
  }, [saveDefaultTemplate]);

  const handleStyleChange = useCallback((style: CoachingStyleType) => {
    void saveCoachingStyle(style);
  }, [saveCoachingStyle]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ApiKeyInput
            label="OpenAI API Key"
            value={config.openaiApiKey}
            onChange={handleOpenaiKeyChange}
            placeholder="sk-..."
            validationPrefix="sk-"
            helperText="Required for Conversation mode and AI coaching suggestions"
            disabled={isSaving}
          />
          <ApiKeyInput
            label="Deepgram API Key"
            value={config.deepgramApiKey}
            onChange={handleDeepgramKeyChange}
            helperText="Required for Meeting Coach mode with speaker diarization"
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Session Defaults */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>Session Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ModeSelector
            value={defaultMode}
            onChange={handleModeChange}
            disabled={isSaving}
          />
          <TemplateSelector
            value={defaultTemplate}
            onChange={handleTemplateChange}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Coaching Settings */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>Coaching Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <CoachingStyleSelector
            value={coachingStyle}
            onChange={handleStyleChange}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>MyCoachPilot Free</strong> v1.0.0</p>
            <p>Real-time AI-powered meeting coach with live transcription and contextual suggestions.</p>
            <p className="text-xs mt-4">
              Your API keys are stored locally and never sent to our servers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
