import { cn } from '@presentation/lib/utils';

interface AudioVisualizerProps {
  level: number;
  isActive: boolean;
  className?: string;
}

export function AudioVisualizer({ level, isActive, className }: AudioVisualizerProps): React.JSX.Element {
  const bars = 5;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const isBarActive = isActive && level >= threshold * 0.8;
        const height = isBarActive ? Math.max(4, level * 24) : 4;

        return (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full transition-all duration-75',
              isBarActive ? 'bg-primary' : 'bg-muted'
            )}
            style={{
              height: `${String(Math.min(height + i * 2, 24))}px`,
            }}
          />
        );
      })}
    </div>
  );
}
