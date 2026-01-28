import { useEffect, useRef, type ReactNode } from 'react';

interface AudioVisualizerProps {
  audioLevel: number; // 0-1
  isActive: boolean;
  type?: 'bar' | 'wave' | 'circle';
  className?: string;
}

export function AudioVisualizer({ audioLevel, isActive, type = 'bar', className = '' }: AudioVisualizerProps): ReactNode {
  if (type === 'circle') {
    return <CircleVisualizer audioLevel={audioLevel} isActive={isActive} className={className} />;
  }

  if (type === 'wave') {
    return <WaveVisualizer audioLevel={audioLevel} isActive={isActive} className={className} />;
  }

  return <BarVisualizer audioLevel={audioLevel} isActive={isActive} className={className} />;
}

function BarVisualizer({ audioLevel, isActive, className }: AudioVisualizerProps): ReactNode {
  const barCount = 5;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const threshold = (i + 1) / barCount;
    const isActive = audioLevel >= threshold * 0.8;
    return isActive;
  });

  return (
    <div className={`flex items-end gap-1 h-6 ${className ?? ''}`}>
      {bars.map((active, i) => (
        <div
          key={i}
          className={`
            w-1.5 rounded-full transition-all duration-75
            ${active && isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
          `}
          style={{
            height: `${String(((i + 1) / barCount) * 100)}%`,
          }}
        />
      ))}
    </div>
  );
}

function WaveVisualizer({ audioLevel, isActive, className }: AudioVisualizerProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (): void => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      const amplitude = audioLevel * (height / 2) * 0.8;
      const frequency = 0.02;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency + phaseRef.current) * amplitude;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2;
      ctx.stroke();

      phaseRef.current += 0.1;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioLevel, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={32}
      className={className ?? ''}
    />
  );
}

function CircleVisualizer({ audioLevel, isActive, className }: AudioVisualizerProps): ReactNode {
  const scale = isActive ? 1 + audioLevel * 0.3 : 1;

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        className={`
          w-12 h-12 rounded-full transition-all duration-75
          ${isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
        `}
        style={{
          transform: `scale(${String(scale)})`,
        }}
      >
        {isActive && (
          <div
            className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25"
            style={{
              animationDuration: `${String(1.5 - audioLevel)}s`,
            }}
          />
        )}
      </div>
    </div>
  );
}
