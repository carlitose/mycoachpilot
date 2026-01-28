import { MessageSquare, User, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { ScrollArea } from '@presentation/components/ui/scroll-area';
import { useTranscript, useSession } from '@presentation/hooks';
import { cn } from '@presentation/lib/utils';

export function TranscriptPanel(): React.JSX.Element {
  const { segments, speakers } = useTranscript();
  const { isActive, isPaused, isConnected } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionStatus = isActive ? (isPaused ? 'paused' : 'recording') : 'idle';
  const isTranscribing = isConnected && sessionStatus === 'recording';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments]);

  const formatTime = (ms: number): string => {
    const date = new Date(ms);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getSpeakerColor = (speakerId: number): string => {
    const colors = [
      'bg-primary/10 text-primary border-primary/20',
      'bg-chart-2/10 text-chart-2 border-chart-2/20',
      'bg-chart-4/10 text-chart-4 border-chart-4/20',
      'bg-chart-5/10 text-chart-5 border-chart-5/20',
    ];
    const index = speakerId % colors.length;
    return colors[index] ?? colors[0] ?? '';
  };

  const getSpeakerName = (speakerId: number): string => {
    const speaker = speakers.find(s => s.id === speakerId);
    return speaker?.name ?? `Speaker ${String(speakerId)}`;
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Live Transcript</h2>
        {isTranscribing && (
          <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            Listening...
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {segments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-medium text-foreground">No Transcript Yet</h3>
            <p className="max-w-[280px] text-sm text-muted-foreground">
              {sessionStatus === 'idle'
                ? 'Start a session to begin capturing the conversation'
                : 'Waiting for speech to be detected...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {segments.map((entry) => (
              <div
                key={entry.id}
                className="group animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                      getSpeakerColor(entry.speakerId)
                    )}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {getSpeakerName(entry.speakerId)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(entry.startMs)}
                      </span>
                      {entry.confidence < 0.8 && (
                        <span className="rounded bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                          Low confidence
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {entry.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
