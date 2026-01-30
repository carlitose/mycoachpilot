import { Mic2, RotateCcw, Settings2, Sparkles } from 'lucide-react';

import { Button } from '@presentation/components/ui/button';
import { Label } from '@presentation/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@presentation/components/ui/select';
import { Slider } from '@presentation/components/ui/slider';

interface AdvancedTabProps {
  vadThreshold: number;
  vadSilenceDuration: number;
  suggestionInterval: number;
  maxActiveSuggestions: number;
  suggestionModel: string;
  realtimeModel: string;
  transcriptionModel: string;
  onVadThresholdChange: (value: number) => void;
  onVadSilenceDurationChange: (value: number) => void;
  onSuggestionIntervalChange: (value: number) => void;
  onMaxActiveSuggestionsChange: (value: number) => void;
  onSuggestionModelChange: (value: string) => void;
  onRealtimeModelChange: (value: string) => void;
  onTranscriptionModelChange: (value: string) => void;
  onReset: () => void;
}

export function AdvancedTab({
  vadThreshold,
  vadSilenceDuration,
  suggestionInterval,
  maxActiveSuggestions,
  suggestionModel,
  realtimeModel,
  transcriptionModel,
  onVadThresholdChange,
  onVadSilenceDurationChange,
  onSuggestionIntervalChange,
  onMaxActiveSuggestionsChange,
  onSuggestionModelChange,
  onRealtimeModelChange,
  onTranscriptionModelChange,
  onReset,
}: AdvancedTabProps): React.JSX.Element {
  return (
    <div className="space-y-6">
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
              onValueChange={onVadThresholdChange}
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
              onValueChange={onVadSilenceDurationChange}
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
              onValueChange={onSuggestionIntervalChange}
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
              onValueChange={onMaxActiveSuggestionsChange}
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
            <Select value={suggestionModel} onValueChange={onSuggestionModelChange}>
              <SelectTrigger id="suggestionModel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-5.2">gpt-5.2 (Recommended)</SelectItem>
                <SelectItem value="gpt-5.2-pro">gpt-5.2-pro (Higher quality)</SelectItem>
                <SelectItem value="gpt-5-mini">gpt-5-mini (Fast)</SelectItem>
                <SelectItem value="gpt-5-nano">gpt-5-nano (Budget)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="realtimeModel" className="text-xs">Realtime Model</Label>
            <Select value={realtimeModel} onValueChange={onRealtimeModelChange}>
              <SelectTrigger id="realtimeModel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-realtime">gpt-realtime (Recommended)</SelectItem>
                <SelectItem value="gpt-realtime-mini">gpt-realtime-mini (Budget)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcriptionModel" className="text-xs">Transcription Model</Label>
            <Select value={transcriptionModel} onValueChange={onTranscriptionModelChange}>
              <SelectTrigger id="transcriptionModel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-transcribe">gpt-4o-transcribe (Recommended)</SelectItem>
                <SelectItem value="gpt-4o-mini-transcribe">gpt-4o-mini-transcribe (Budget)</SelectItem>
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
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
