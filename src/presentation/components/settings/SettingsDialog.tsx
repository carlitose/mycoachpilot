import { Key, Globe, Mic2, Sparkles } from 'lucide-react';

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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps): React.JSX.Element {
  const {
    config,
    saveOpenaiKey,
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="coach">AI Coach</TabsTrigger>
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
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button onClick={() => { onOpenChange(false); }}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
