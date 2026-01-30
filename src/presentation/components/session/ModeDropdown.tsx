import { ChevronDown, FileText, MessageCircle, Sparkles } from 'lucide-react';

import type { SessionModeType } from '@domain/shared';

import { Button } from '@presentation/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@presentation/components/ui/dropdown-menu';
import { cn } from '@presentation/lib/utils';

export const MODE_CONFIG: Record<SessionModeType, {
  icon: typeof FileText;
  label: string;
  description: string;
}> = {
  transcript_only: {
    icon: FileText,
    label: 'Transcript Only',
    description: 'Real-time transcription without AI suggestions',
  },
  meeting_coach: {
    icon: Sparkles,
    label: 'Meeting Coach',
    description: 'Transcription + passive AI tips and insights',
  },
  conversation: {
    icon: MessageCircle,
    label: 'Conversation Mode',
    description: 'Interactive AI coach you can talk to',
  },
};

interface ModeDropdownProps {
  selectedMode: SessionModeType;
  onModeChange: (mode: SessionModeType) => void;
  disabled?: boolean;
}

export function ModeDropdown({
  selectedMode,
  onModeChange,
  disabled = false,
}: ModeDropdownProps): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          disabled={disabled}
        >
          {(() => {
            const Icon = MODE_CONFIG[selectedMode].icon;
            return <Icon className="h-4 w-4" />;
          })()}
          <span className="hidden sm:inline">{MODE_CONFIG[selectedMode].label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {(Object.keys(MODE_CONFIG) as SessionModeType[]).map((mode) => {
          const config = MODE_CONFIG[mode];
          const Icon = config.icon;
          const isSelected = selectedMode === mode;

          return (
            <DropdownMenuItem
              key={mode}
              onClick={() => { onModeChange(mode); }}
              className={cn('flex items-center gap-3 p-3', isSelected && 'bg-primary/10')}
            >
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className={cn('text-sm font-medium', isSelected && 'text-primary')}>
                  {config.label}
                </p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
