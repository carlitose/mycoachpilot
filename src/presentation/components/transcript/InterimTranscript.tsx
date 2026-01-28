import type { ReactNode } from 'react';

interface InterimTranscriptProps {
  text: string;
}

export function InterimTranscript({ text }: InterimTranscriptProps): ReactNode {
  if (!text) return null;

  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-70">
            Speaking...
          </span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap break-words italic">
          {text}
        </p>
      </div>
    </div>
  );
}
