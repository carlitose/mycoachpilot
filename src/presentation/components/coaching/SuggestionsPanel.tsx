import { Lightbulb, MessageSquare, HelpCircle, Shield, Target, X, Sparkles, Handshake, Search, FileText, VolumeX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { SuggestionTypeValue } from '@domain/coaching';

import { Button } from '@presentation/components/ui/button';
import { ScrollArea } from '@presentation/components/ui/scroll-area';
import { useContainer } from '@presentation/context';
import { useCoaching, useSession, useSuggestionTTS } from '@presentation/hooks';
import { cn } from '@presentation/lib/utils';

const suggestionIcons: Record<SuggestionTypeValue, LucideIcon> = {
  response_suggestion: MessageSquare,
  talking_point: Lightbulb,
  question: HelpCircle,
  objection_handling: Shield,
  closing: Target,
  rapport_building: Handshake,
  clarification: Search,
  summary: FileText,
  general: Lightbulb,
};

const suggestionColors: Record<SuggestionTypeValue, string> = {
  response_suggestion: 'bg-primary/10 text-primary border-primary/20',
  talking_point: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  question: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  objection_handling: 'bg-warning/10 text-warning-foreground border-warning/20',
  closing: 'bg-success/10 text-success border-success/20',
  rapport_building: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  clarification: 'bg-muted text-muted-foreground border-muted',
  summary: 'bg-secondary text-secondary-foreground border-secondary',
  general: 'bg-accent/10 text-accent border-accent/20',
};

const suggestionLabels: Record<SuggestionTypeValue, string> = {
  response_suggestion: 'Response',
  talking_point: 'Talking Point',
  question: 'Question',
  objection_handling: 'Objection',
  closing: 'Closing',
  rapport_building: 'Rapport',
  clarification: 'Clarification',
  summary: 'Summary',
  general: 'Tip',
};

export function SuggestionsPanel(): React.JSX.Element {
  const { activeSuggestions, dismissSuggestion } = useCoaching();
  const { isActive, isPaused } = useSession();
  const { tts } = useContainer();
  const { isPlaying, stop } = useSuggestionTTS({ ttsAdapter: tts });

  const sessionStatus = isActive ? (isPaused ? 'paused' : 'recording') : 'idle';

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">AI Coach</h2>
        <div className="ml-auto flex items-center gap-2">
          {isPlaying && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <VolumeX className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}
          {activeSuggestions.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {activeSuggestions.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {activeSuggestions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-medium text-foreground">
                {sessionStatus === 'idle' ? 'Ready to Coach' : 'Analyzing...'}
              </h3>
              <p className="max-w-[280px] text-sm text-muted-foreground">
                {sessionStatus === 'idle'
                  ? 'Start a session to receive real-time coaching suggestions'
                  : 'Listening to the conversation and preparing insights...'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSuggestions.map((suggestion) => {
                const suggestionType = suggestion.type;
                const Icon = suggestionIcons[suggestionType];
                const colorClass = suggestionColors[suggestionType];

                return (
                  <div
                    key={suggestion.id}
                    className={cn(
                      'group relative animate-in fade-in slide-in-from-right-2 rounded-xl border p-4 duration-300',
                      colorClass
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => { dismissSuggestion(suggestion.id); }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/50">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {suggestionLabels[suggestionType]}
                          </span>
                        </div>
                        <p className="text-sm opacity-90">{suggestion.content}</p>
                        <p className="text-xs opacity-60">
                          {formatTime(suggestion.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
