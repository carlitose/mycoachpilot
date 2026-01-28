import { Clock, Trash2, Calendar, MessageSquare, Sparkles } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@presentation/components/ui/alert-dialog';
import { Button } from '@presentation/components/ui/button';
import { ScrollArea } from '@presentation/components/ui/scroll-area';

interface SessionHistoryEntry {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  transcriptCount: number;
  suggestionsCount: number;
}

interface SessionHistoryProps {
  sessions: SessionHistoryEntry[];
  onDeleteSession: (id: string) => void;
  onLoadSession: (id: string) => void;
}

export function SessionHistory({ sessions, onDeleteSession, onLoadSession }: SessionHistoryProps): React.JSX.Element {
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${String(hours)}h ${String(minutes % 60)}m`;
    }
    return `${String(minutes)}m ${String(seconds % 60)}s`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Session History</h2>
        {sessions.length > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-medium text-foreground">No Sessions Yet</h3>
            <p className="max-w-[280px] text-sm text-muted-foreground">
              Your completed coaching sessions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="group rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => { onLoadSession(session.id); }}
                  >
                    <h3 className="font-medium text-foreground">{session.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(session.startTime)}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Delete session</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{session.name}&quot;? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => { onDeleteSession(session.id); }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatDuration(session.duration)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    {session.transcriptCount} entries
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    {session.suggestionsCount} tips
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
