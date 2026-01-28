import type { ReactNode } from 'react';

import type { MessageProps } from '@domain/transcript';

interface MessageItemProps {
  message: MessageProps;
  showTimestamp?: boolean;
}

const roleStyles: Record<string, { bg: string; text: string; label: string }> = {
  user: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-900 dark:text-blue-100',
    label: 'You',
  },
  assistant: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-900 dark:text-gray-100',
    label: 'Assistant',
  },
  system: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-900 dark:text-purple-100',
    label: 'System',
  },
  log: {
    bg: 'bg-gray-50 dark:bg-gray-900',
    text: 'text-gray-500 dark:text-gray-400',
    label: 'Log',
  },
  transcript: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-900 dark:text-green-100',
    label: 'Transcript',
  },
};

const defaultStyle = { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-500 dark:text-gray-400', label: 'Log' };

export function MessageItem({ message, showTimestamp = true }: MessageItemProps): ReactNode {
  const style = roleStyles[message.role] ?? defaultStyle;
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${style.bg}
          ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium ${style.text} opacity-70`}>
            {style.label}
          </span>
          {showTimestamp && (
            <span className="text-xs text-gray-400">
              {formatTimestamp(message.timestamp)}
            </span>
          )}
        </div>
        <p className={`text-sm ${style.text} whitespace-pre-wrap break-words`}>
          {message.content}
        </p>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
