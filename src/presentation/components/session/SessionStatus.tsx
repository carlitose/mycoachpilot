import { useState, useEffect, type ReactNode } from 'react';

import { useSession } from '@presentation/hooks';


export function SessionStatus(): ReactNode {
  const { connectionState, isActive, isPaused, error, currentSession } = useSession();

  const statusConfig = {
    disconnected: { color: 'bg-gray-400', text: 'Ready', pulse: false },
    connecting: { color: 'bg-yellow-400', text: 'Connecting...', pulse: true },
    connected: { color: 'bg-green-500', text: isPaused ? 'Paused' : 'Live', pulse: !isPaused },
    reconnecting: { color: 'bg-yellow-400', text: 'Reconnecting...', pulse: true },
    error: { color: 'bg-red-500', text: 'Error', pulse: false },
  };

  const status = statusConfig[connectionState];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span
            className={`${status.pulse ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${status.color} opacity-75`}
          />
          <span className={`relative inline-flex rounded-full h-3 w-3 ${status.color}`} />
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status.text}
        </span>
      </div>

      {currentSession && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="capitalize">{currentSession.mode.replace('_', ' ')}</span>
          {currentSession.startedAt && (
            <>
              <span>•</span>
              <SessionTimer startedAt={new Date(currentSession.startedAt)} isRunning={isActive && !isPaused} />
            </>
          )}
        </div>
      )}

      {error && (
        <span className="text-sm text-red-500">
          {error.message}
        </span>
      )}
    </div>
  );
}

interface SessionTimerProps {
  startedAt: Date;
  isRunning: boolean;
}

function SessionTimer({ startedAt, isRunning }: SessionTimerProps): ReactNode {
  const elapsed = useElapsedTime(startedAt, isRunning);
  return <span>{formatDuration(elapsed)}</span>;
}

function useElapsedTime(startedAt: Date, isRunning: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const update = (): void => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    };

    update();
    const interval = setInterval(update, 1000);

    return () => { clearInterval(interval); };
  }, [startedAt, isRunning]);

  return elapsed;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(hours)}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${String(minutes)}:${secs.toString().padStart(2, '0')}`;
}
