import type { ReactNode } from 'react';

import type { SessionModeType } from '@domain/session';

import { useSettings } from '@presentation/hooks';

interface ModeSelectorProps {
  value: SessionModeType;
  onChange: (mode: SessionModeType) => void;
  disabled?: boolean;
}

const modes: { value: SessionModeType; label: string; description: string; icon: string }[] = [
  {
    value: 'conversation',
    label: 'Conversation',
    description: 'Voice chat with AI assistant',
    icon: '💬',
  },
  {
    value: 'transcript_only',
    label: 'Transcript Only',
    description: 'Speech-to-text without AI responses',
    icon: '📝',
  },
  {
    value: 'meeting_coach',
    label: 'Meeting Coach',
    description: 'Real-time coaching with speaker detection',
    icon: '🎯',
  },
];

export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps): ReactNode {
  const { canUseMeetingCoach, canUseConversation, hasOpenaiKey } = useSettings();

  const getModeAvailability = (mode: SessionModeType): { available: boolean; reason?: string } => {
    switch (mode) {
      case 'conversation':
        return canUseConversation
          ? { available: true }
          : { available: false, reason: 'Requires OpenAI API key' };
      case 'meeting_coach':
        return canUseMeetingCoach
          ? { available: true }
          : { available: false, reason: 'Requires OpenAI API key' };
      case 'transcript_only':
        return hasOpenaiKey
          ? { available: true }
          : { available: false, reason: 'Requires OpenAI API key' };
      default:
        return { available: true };
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Session Mode
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {modes.map((mode) => {
          const { available, reason } = getModeAvailability(mode.value);
          const isSelected = value === mode.value;
          const isDisabled = disabled || !available;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => { if (!isDisabled) onChange(mode.value); }}
              disabled={isDisabled}
              className={`
                relative flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-2xl mb-2">{mode.icon}</span>
              <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                {mode.label}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {mode.description}
              </span>
              {!available && reason && (
                <span className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  {reason}
                </span>
              )}
              {isSelected && (
                <span className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
