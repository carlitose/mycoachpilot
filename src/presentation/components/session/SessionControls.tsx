import { AlertCircle, Circle, Mic, MonitorSpeaker, Pause, Play, Square } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { SessionModeType } from '@domain/shared';

import { Alert, AlertDescription } from '@presentation/components/ui/alert';
import { Button } from '@presentation/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@presentation/components/ui/dialog';
import { Input } from '@presentation/components/ui/input';
import { Label } from '@presentation/components/ui/label';
import { Switch } from '@presentation/components/ui/switch';
import { useSession, useSettings } from '@presentation/hooks';
import { cn } from '@presentation/lib/utils';

import { AudioVisualizer } from './AudioVisualizer';
import { ModeDropdown } from './ModeDropdown';

interface SessionControlsProps {
  onOpenSettings: () => void;
}

export function SessionControls({ onOpenSettings }: SessionControlsProps): React.JSX.Element {
  const {
    isActive,
    isPaused,
    isConnecting,
    isConnected,
    audioLevel,
    currentSession,
    error,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    clearError,
  } = useSession();

  const { hasOpenaiKey, defaultMode, saveDefaultMode } = useSettings();
  const [selectedMode, setSelectedMode] = useState<SessionModeType>(defaultMode);

  const [showNameDialog, setShowNameDialog] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [includeTabAudio, setIncludeTabAudio] = useState(false);
  const [duration, setDuration] = useState(0);

  const sessionStatus = isActive ? (isPaused ? 'paused' : 'recording') : 'idle';

  const handleModeChange = useCallback((mode: SessionModeType) => {
    setSelectedMode(mode);
    void saveDefaultMode(mode);
  }, [saveDefaultMode]);

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (sessionStatus === 'recording' && currentSession) {
      const startTime = currentSession.startedAt ? new Date(currentSession.startedAt).getTime() : Date.now();
      interval = setInterval(() => {
        setDuration(Date.now() - startTime);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStatus, currentSession]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60)
      .toString()
      .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const handleStart = (): void => {
    clearError();
    if (!hasOpenaiKey) {
      onOpenSettings();
      return;
    }
    setShowNameDialog(true);
  };

  const handleConfirmStart = useCallback(async () => {
    if (!sessionName.trim()) return;

    await startSession({
      mode: selectedMode,
      audioConfig: {
        micEnabled: true,
        tabAudioEnabled: includeTabAudio,
        sampleRate: 16000,
      },
    });

    setShowNameDialog(false);
    setSessionName('');
    setDuration(0);
  }, [sessionName, includeTabAudio, startSession, selectedMode]);

  const handlePause = useCallback(() => { pauseSession(); }, [pauseSession]);
  const handleResume = useCallback(() => { resumeSession(); }, [resumeSession]);
  const handleStop = useCallback(() => { void stopSession(); setDuration(0); }, [stopSession]);

  const hasError = error?.message;

  return (
    <>
      <div className="flex flex-col gap-4">
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:gap-6">
          {/* Recording Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-3 w-3 rounded-full',
                sessionStatus === 'recording' && 'animate-pulse bg-destructive',
                sessionStatus === 'paused' && 'bg-warning',
                sessionStatus === 'idle' && 'bg-muted'
              )}
            />
            <span className="text-sm font-medium text-muted-foreground">
              {sessionStatus === 'recording' && 'Recording'}
              {sessionStatus === 'paused' && 'Paused'}
              {sessionStatus === 'idle' && 'Ready'}
            </span>
          </div>

          {/* Mode Selector */}
          {sessionStatus === 'idle' && (
            <ModeDropdown
              selectedMode={selectedMode}
              onModeChange={handleModeChange}
              disabled={isConnecting}
            />
          )}

          {/* Audio Level */}
          {sessionStatus === 'recording' && (
            <AudioVisualizer level={audioLevel} isActive={isConnected} />
          )}

          {/* Duration */}
          {currentSession && (
            <div className="font-mono text-2xl font-semibold text-foreground">
              {formatDuration(duration)}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {sessionStatus === 'idle' ? (
              <Button
                onClick={handleStart}
                disabled={isConnecting}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Circle className="h-4 w-4 fill-current" />
                Start Session
              </Button>
            ) : (
              <>
                {sessionStatus === 'recording' ? (
                  <Button variant="outline" size="icon" onClick={handlePause} className="h-10 w-10 bg-transparent">
                    <Pause className="h-5 w-5" />
                    <span className="sr-only">Pause</span>
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" onClick={handleResume} className="h-10 w-10 bg-transparent">
                    <Play className="h-5 w-5" />
                    <span className="sr-only">Resume</span>
                  </Button>
                )}
                <Button variant="destructive" size="icon" onClick={handleStop} className="h-10 w-10">
                  <Square className="h-4 w-4 fill-current" />
                  <span className="sr-only">Stop</span>
                </Button>
              </>
            )}
          </div>

          {/* Connection Status */}
          {sessionStatus !== 'idle' && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mic className={cn('h-4 w-4', isActive && 'text-primary')} />
                <span className="sr-only">Microphone</span>
              </div>
              {includeTabAudio && (
                <div className="flex items-center gap-1.5">
                  <MonitorSpeaker className="h-4 w-4 text-primary" />
                  <span className="sr-only">Tab Audio</span>
                </div>
              )}
              <div className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-success' : 'bg-warning')} />
            </div>
          )}

          {/* Session Name */}
          {currentSession && (
            <div className="ml-auto text-right">
              <p className="text-sm font-medium text-foreground">{sessionName || 'Coaching Session'}</p>
              <p className="text-xs text-muted-foreground">
                Started at{' '}
                {currentSession.startedAt
                  ? new Date(currentSession.startedAt).toLocaleTimeString()
                  : new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Coaching Session</DialogTitle>
            <DialogDescription>Give your session a name and configure audio sources</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                placeholder="e.g., Sales Call with Client X"
                value={sessionName}
                onChange={(e) => { setSessionName(e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleConfirmStart(); }}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <MonitorSpeaker className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Include Tab Audio</p>
                  <p className="text-xs text-muted-foreground">
                    Capture audio from your browser tab (e.g., Zoom, Meet)
                  </p>
                </div>
              </div>
              <Switch checked={includeTabAudio} onCheckedChange={setIncludeTabAudio} />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <Mic className="h-4 w-4 shrink-0" />
              <span>Your microphone will always be captured</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNameDialog(false); }}>Cancel</Button>
            <Button onClick={() => void handleConfirmStart()} disabled={!sessionName.trim()}>
              Start Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
