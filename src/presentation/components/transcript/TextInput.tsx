import { useState, useCallback, type KeyboardEvent, type ChangeEvent, type ReactNode } from 'react';

import { useSession } from '@presentation/hooks';

import { Button } from '../common';

interface TextInputProps {
  placeholder?: string;
  disabled?: boolean;
}

export function TextInput({ placeholder = 'Type a message...', disabled }: TextInputProps): ReactNode {
  const [text, setText] = useState('');
  const { sendTextMessage, isActive, isConnecting } = useSession();

  const isDisabled = disabled || !isActive || isConnecting;

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isDisabled) return;

    setText('');
    await sendTextMessage(trimmed);
  }, [text, isDisabled, sendTextMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }, [handleSubmit]);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={1}
        className="
          flex-1 resize-none px-4 py-2 rounded-lg border
          bg-gray-50 dark:bg-gray-900
          border-gray-200 dark:border-gray-600
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          max-h-32
        "
        style={{
          minHeight: '42px',
        }}
      />
      <Button
        onClick={() => { void handleSubmit(); }}
        disabled={isDisabled || !text.trim()}
        className="h-[42px]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </Button>
    </div>
  );
}
