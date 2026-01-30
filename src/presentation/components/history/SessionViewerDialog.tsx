import {
  Calendar,
  Clock,
  Download,
  FileJson,
  FileText,
  MessageSquare,
  Sparkles,
  User,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import type { SuggestionProps } from '@domain/coaching';
import type { SpeakerProps, TranscriptSegmentProps } from '@domain/transcript';

import type { SessionHistoryEntry } from '@application/ports';

import { Button } from '@presentation/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@presentation/components/ui/dialog';
import { ScrollArea } from '@presentation/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@presentation/components/ui/tabs';
import { useContainer } from '@presentation/context';
import { useSessionHistory } from '@presentation/hooks/useSessionHistory';

interface SessionViewerDialogProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionViewerDialog({
  sessionId,
  open,
  onOpenChange,
}: SessionViewerDialogProps): React.JSX.Element {
  const { sessionRepository } = useContainer();
  const { exportSession } = useSessionHistory();
  const [session, setSession] = useState<SessionHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load session data when dialog opens
  useEffect(() => {
    if (!open || !sessionId) {
      setSession(null);
      return;
    }

    const loadSession = async (): Promise<void> => {
      setIsLoading(true);
      const result = await sessionRepository.getById(sessionId);
      if (result.isOk()) {
        setSession(result.unwrap());
      }
      setIsLoading(false);
    };

    void loadSession();
  }, [sessionId, open, sessionRepository]);

  const handleExportJson = useCallback((): void => {
    if (sessionId) {
      void exportSession(sessionId, 'json');
    }
  }, [sessionId, exportSession]);

  const handleExportTxt = useCallback((): void => {
    if (sessionId) {
      void exportSession(sessionId, 'txt');
    }
  }, [sessionId, exportSession]);

  const formatDuration = (startedAt: Date | null, endedAt: Date | null): string => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const ms = end - start;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${String(hours)}h ${String(minutes % 60)}m`;
    }
    return `${String(minutes)}m ${String(seconds % 60)}s`;
  };

  const formatDate = (timestamp: Date | string | null): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSpeakerName = (speakerId: number, speakers: SpeakerProps[]): string => {
    const speaker = speakers.find(s => s.id === speakerId);
    if (speaker?.name) return speaker.name;
    if (speaker?.isUser) return 'You';
    return `Speaker ${String(speakerId)}`;
  };

  const formatTimestamp = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes)}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open) return <></>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : session ? (
          <>
            {/* Session Metadata */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">
                    {formatDate(session.session.startedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {formatDuration(session.session.startedAt, session.session.endedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Segments</p>
                  <p className="text-sm font-medium">{session.segments.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Suggestions</p>
                  <p className="text-sm font-medium">{session.suggestions.length}</p>
                </div>
              </div>
            </div>

            {/* Tabs for Transcript and Suggestions */}
            <Tabs defaultValue="transcript" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transcript" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Suggestions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transcript" className="flex-1 min-h-0 mt-4">
                <ScrollArea className="h-[300px] rounded-lg border border-border">
                  {session.segments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No transcript segments</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {session.segments.map((segment: TranscriptSegmentProps) => (
                        <div key={segment.id} className="flex gap-3">
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(segment.startMs)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-primary mb-1">
                              {getSpeakerName(segment.speakerId, session.speakers)}
                            </p>
                            <p className="text-sm text-foreground">{segment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="suggestions" className="flex-1 min-h-0 mt-4">
                <ScrollArea className="h-[300px] rounded-lg border border-border">
                  {session.suggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No suggestions generated</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {session.suggestions.map((suggestion: SuggestionProps) => (
                        <div
                          key={suggestion.id}
                          className="rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {suggestion.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(suggestion.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{suggestion.content}</p>
                          {suggestion.context && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Context: {suggestion.context}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Export Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={handleExportJson}>
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportTxt}>
                <FileText className="h-4 w-4 mr-2" />
                Export TXT
              </Button>
              <Button onClick={() => { onOpenChange(false); }}>
                <Download className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Session not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
