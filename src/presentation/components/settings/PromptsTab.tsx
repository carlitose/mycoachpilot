import { ChevronDown, ChevronRight, MessageSquareText, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import type { CoachingPromptConfigProps } from '@domain/settings';

import { Button } from '@presentation/components/ui/button';
import { Label } from '@presentation/components/ui/label';
import { Textarea } from '@presentation/components/ui/textarea';

interface PromptsTabProps {
  coachingPromptConfig: CoachingPromptConfigProps;
  onConfigChange: (updates: Partial<CoachingPromptConfigProps>) => void;
  onStyleDescriptionChange: (style: keyof CoachingPromptConfigProps['styleDescriptions'], value: string) => void;
  onReset: () => void;
}

export function PromptsTab({
  coachingPromptConfig,
  onConfigChange,
  onStyleDescriptionChange,
  onReset,
}: PromptsTabProps): React.JSX.Element {
  const [showStyleDescriptions, setShowStyleDescriptions] = useState(false);
  const [showFormatInstructions, setShowFormatInstructions] = useState(false);

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {/* Base Instructions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="baseInstructions" className="text-sm font-medium">
            Base Instructions
          </Label>
        </div>
        <Textarea
          id="baseInstructions"
          placeholder="Base coaching instructions..."
          value={coachingPromptConfig.baseInstructions}
          onChange={(e) => { onConfigChange({ baseInstructions: e.target.value }); }}
          className="min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground">
          Core instructions that define the coaching assistant&apos;s behavior
        </p>
      </div>

      {/* Style Descriptions - Collapsible */}
      <div className="space-y-2">
        <button
          type="button"
          className="flex items-center gap-2 w-full text-left"
          onClick={() => { setShowStyleDescriptions(!showStyleDescriptions); }}
        >
          {showStyleDescriptions ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Style Descriptions</span>
        </button>

        {showStyleDescriptions && (
          <div className="space-y-3 pl-6">
            <div className="space-y-1">
              <Label htmlFor="styleDiplomatic" className="text-xs">Diplomatic</Label>
              <Textarea
                id="styleDiplomatic"
                value={coachingPromptConfig.styleDescriptions.diplomatic}
                onChange={(e) => { onStyleDescriptionChange('diplomatic', e.target.value); }}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="styleAssertive" className="text-xs">Assertive</Label>
              <Textarea
                id="styleAssertive"
                value={coachingPromptConfig.styleDescriptions.assertive}
                onChange={(e) => { onStyleDescriptionChange('assertive', e.target.value); }}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="styleAnalytical" className="text-xs">Analytical</Label>
              <Textarea
                id="styleAnalytical"
                value={coachingPromptConfig.styleDescriptions.analytical}
                onChange={(e) => { onStyleDescriptionChange('analytical', e.target.value); }}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="styleSupportive" className="text-xs">Supportive</Label>
              <Textarea
                id="styleSupportive"
                value={coachingPromptConfig.styleDescriptions.supportive}
                onChange={(e) => { onStyleDescriptionChange('supportive', e.target.value); }}
                className="min-h-[60px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Format Instructions - Collapsible */}
      <div className="space-y-2">
        <button
          type="button"
          className="flex items-center gap-2 w-full text-left"
          onClick={() => { setShowFormatInstructions(!showFormatInstructions); }}
        >
          {showFormatInstructions ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Format Instructions (Advanced)</span>
        </button>

        {showFormatInstructions && (
          <div className="pl-6 space-y-2">
            <Textarea
              id="formatInstructions"
              value={coachingPromptConfig.formatInstructions}
              onChange={(e) => { onConfigChange({ formatInstructions: e.target.value }); }}
              className="min-h-[200px] font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              JSON format instructions for AI responses. Modify with caution.
            </p>
          </div>
        )}
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
          Reset Prompts to Defaults
        </Button>
      </div>
    </div>
  );
}
