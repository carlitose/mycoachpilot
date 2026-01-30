import { Globe, Key, Mic2, Sparkles } from 'lucide-react';

import type { CoachingPromptConfigProps } from '@domain/settings';

import { Button } from '@presentation/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@presentation/components/ui/dialog';
import { Input } from '@presentation/components/ui/input';
import { Label } from '@presentation/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@presentation/components/ui/select';
import { Switch } from '@presentation/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@presentation/components/ui/tabs';
import { useSettings } from '@presentation/hooks';

import { AdvancedTab } from './AdvancedTab';
import { PromptsTab } from './PromptsTab';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps): React.JSX.Element {
  const {
    config,
    saveOpenaiKey,
    // Reactivity config
    vadThreshold,
    vadSilenceDuration,
    suggestionInterval,
    maxActiveSuggestions,
    suggestionModel,
    realtimeModel,
    transcriptionModel,
    // Reactivity actions
    saveVadThreshold,
    saveVadSilenceDuration,
    saveSuggestionInterval,
    saveMaxActiveSuggestions,
    saveSuggestionModel,
    saveRealtimeModel,
    saveTranscriptionModel,
    resetReactivityToDefaults,
    // Coaching Prompt Config
    coachingPromptConfig,
    saveCoachingPromptConfig,
    resetCoachingPromptsToDefaults,
  } = useSettings();

  const handleOpenaiKeyChange = (value: string): void => {
    void saveOpenaiKey(value || null);
  };

  const handlePromptConfigChange = (updates: Partial<CoachingPromptConfigProps>): void => {
    void saveCoachingPromptConfig({ ...coachingPromptConfig, ...updates });
  };

  const handleStyleDescriptionChange = (
    style: keyof CoachingPromptConfigProps['styleDescriptions'],
    value: string,
  ): void => {
    void saveCoachingPromptConfig({
      ...coachingPromptConfig,
      styleDescriptions: {
        ...coachingPromptConfig.styleDescriptions,
        [style]: value,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="api" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="coach">Coach</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai" className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                OpenAI API Key
              </Label>
              <Input
                id="openai"
                type="password"
                placeholder="Enter your OpenAI API key"
                value={config.openaiApiKey ?? ''}
                onChange={(e) => { handleOpenaiKeyChange(e.target.value); }}
              />
              <p className="text-xs text-muted-foreground">
                Required for transcription and AI coaching suggestions
              </p>
            </div>
          </TabsContent>

          <TabsContent value="audio" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Language
              </Label>
              <Select defaultValue="it">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Espa&ntilde;ol</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="fr">Fran&ccedil;ais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Mic2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Speaker Labels</p>
                  <p className="text-xs text-muted-foreground">
                    Identify different speakers in the conversation
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </TabsContent>

          <TabsContent value="coach" className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Auto Suggestions</p>
                  <p className="text-xs text-muted-foreground">
                    Receive coaching tips during the meeting
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">Suggestion Frequency</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Only important insights</SelectItem>
                  <SelectItem value="medium">Medium - Balanced feedback</SelectItem>
                  <SelectItem value="high">High - Continuous coaching</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="mt-4">
            <PromptsTab
              coachingPromptConfig={coachingPromptConfig}
              onConfigChange={handlePromptConfigChange}
              onStyleDescriptionChange={handleStyleDescriptionChange}
              onReset={() => { void resetCoachingPromptsToDefaults(); }}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <AdvancedTab
              vadThreshold={vadThreshold}
              vadSilenceDuration={vadSilenceDuration}
              suggestionInterval={suggestionInterval}
              maxActiveSuggestions={maxActiveSuggestions}
              suggestionModel={suggestionModel}
              realtimeModel={realtimeModel}
              transcriptionModel={transcriptionModel}
              onVadThresholdChange={(value) => { void saveVadThreshold(value); }}
              onVadSilenceDurationChange={(value) => { void saveVadSilenceDuration(value); }}
              onSuggestionIntervalChange={(value) => { void saveSuggestionInterval(value); }}
              onMaxActiveSuggestionsChange={(value) => { void saveMaxActiveSuggestions(value); }}
              onSuggestionModelChange={(value) => { void saveSuggestionModel(value); }}
              onRealtimeModelChange={(value) => { void saveRealtimeModel(value); }}
              onTranscriptionModelChange={(value) => { void saveTranscriptionModel(value); }}
              onReset={() => { void resetReactivityToDefaults(); }}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button onClick={() => { onOpenChange(false); }}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
