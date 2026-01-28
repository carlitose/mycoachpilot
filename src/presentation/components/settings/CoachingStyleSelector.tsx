import type { ReactNode } from 'react';

import type { CoachingStyleType } from '@domain/settings';

interface CoachingStyleSelectorProps {
  value: CoachingStyleType;
  onChange: (style: CoachingStyleType) => void;
  disabled?: boolean;
}

const styles: { value: CoachingStyleType; label: string; description: string; icon: string }[] = [
  {
    value: 'diplomatic',
    label: 'Diplomatic',
    description: 'Gentle, supportive suggestions that maintain relationships',
    icon: '🤝',
  },
  {
    value: 'assertive',
    label: 'Assertive',
    description: 'Direct, confident suggestions for decisive communication',
    icon: '💪',
  },
  {
    value: 'analytical',
    label: 'Analytical',
    description: 'Data-driven, logical suggestions based on facts',
    icon: '🔬',
  },
];

export function CoachingStyleSelector({ value, onChange, disabled }: CoachingStyleSelectorProps): ReactNode {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Coaching Style
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {styles.map((style) => {
          const isSelected = value === style.value;

          return (
            <button
              key={style.value}
              type="button"
              onClick={() => { if (!disabled) onChange(style.value); }}
              disabled={disabled}
              className={`
                relative flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{style.icon}</span>
                <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {style.label}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {style.description}
              </span>
              {isSelected && (
                <span className="absolute top-2 right-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Affects the tone and approach of coaching suggestions
      </p>
    </div>
  );
}
