import { Key, Globe, Mic2, Sparkles, Settings2, RotateCcw } from 'lucide-react';

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
import { Slider } from '@presentation/components/ui/slider';
import { Switch } from '@presentation/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@presentation/components/ui/tabs';
import { useSettings } from '@presentation/hooks';

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
    transcriptionModel,
    // Reactivity actions
    saveVadThreshold,
    saveVadSilenceDuration,
    saveSuggestionInterval,
    saveMaxActiveSuggestions,
    saveSuggestionModel,
    saveTranscriptionModel,
    resetReactivityToDefaults,
  } = useSettings();

  const handleOpenaiKeyChange = (value: string): void => {
    void saveOpenaiKey(value || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="api" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="coach">AI Coach</TabsTrigger>
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

          <TabsContent value="advanced" className="mt-4 space-y-6">
            {/* Voice Detection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Voice Detection</h3>
              </div>

              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="vadThreshold" className="text-xs">VAD Threshold</Label>
                    <span className="text-xs text-muted-foreground">{vadThreshold.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="vadThreshold"
                    value={vadThreshold}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    onValueChange={(value) => { void saveVadThreshold(value); }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher = less sensitive, fewer false triggers
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="vadSilence" className="text-xs">Silence Duration</Label>
                    <span className="text-xs text-muted-foreground">{vadSilenceDuration}ms</span>
                  </div>
                  <Slider
                    id="vadSilence"
                    value={vadSilenceDuration}
                    min={100}
                    max={1000}
                    step={50}
                    onValueChange={(value) => { void saveVadSilenceDuration(value); }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Silence needed before ending a speech segment
                  </p>
                </div>
              </div>
            </div>

            {/* Coaching Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Coaching</h3>
              </div>

              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="suggestionInterval" className="text-xs">Suggestion Interval</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(suggestionInterval / 1000)}s</span>
                  </div>
                  <Slider
                    id="suggestionInterval"
                    value={suggestionInterval}
                    min={3000}
                    max={30000}
                    step={1000}
                    onValueChange={(value) => { void saveSuggestionInterval(value); }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Time between coaching suggestions (3-30 seconds)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="maxSuggestions" className="text-xs">Max Active Suggestions</Label>
                    <span className="text-xs text-muted-foreground">{maxActiveSuggestions}</span>
                  </div>
                  <Slider
                    id="maxSuggestions"
                    value={maxActiveSuggestions}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => { void saveMaxActiveSuggestions(value); }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum suggestions shown at once
                  </p>
                </div>
              </div>
            </div>

            {/* Models Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Models</h3>
              </div>

              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="suggestionModel" className="text-xs">Suggestion Model</Label>
                  <Select value={suggestionModel} onValueChange={(value) => { void saveSuggestionModel(value); }}>
                    <SelectTrigger id="suggestionModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">gpt-4o-mini (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o">gpt-4o (Higher quality)</SelectItem>
                      <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transcriptionModel" className="text-xs">Transcription Model</Label>
                  <Select value={transcriptionModel} onValueChange={(value) => { void saveTranscriptionModel(value); }}>
                    <SelectTrigger id="transcriptionModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini-transcribe">gpt-4o-mini-transcribe (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o-transcribe">gpt-4o-transcribe (Higher quality)</SelectItem>
                      <SelectItem value="whisper-1">whisper-1 (Legacy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { void resetReactivityToDefaults(); }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button onClick={() => { onOpenChange(false); }}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
