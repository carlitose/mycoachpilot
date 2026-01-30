import * as React from 'react';

import { cn } from '@presentation/lib/utils';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min = 0, max = 100, step = 1, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      if (onValueChange) {
        onValueChange(Number(e.target.value));
      }
    };

    // Calculate percentage for the track fill
    const percentage = ((value ?? min) - min) / (max - min) * 100;

    return (
      <div className={cn('relative w-full', className)}>
        <input
          ref={ref}
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          className="w-full h-2 appearance-none cursor-pointer bg-transparent
            [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:-mt-[5px]
            [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-sm
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) ${String(percentage)}%, hsl(var(--muted)) ${String(percentage)}%)`,
          }}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
