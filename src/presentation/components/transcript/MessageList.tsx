import { useEffect, useRef, type ReactNode } from 'react';

import { useTranscript } from '@presentation/hooks';

import { InterimTranscript } from './InterimTranscript';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  autoScroll?: boolean;
  showTimestamps?: boolean;
}

export function MessageList({ autoScroll = true, showTimestamps = true }: MessageListProps): ReactNode {
  const { messages, interimTranscript } = useTranscript();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && shouldScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, interimTranscript, autoScroll]);

  // Track if user has scrolled up
  const handleScroll = (): void => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    shouldScrollRef.current = isAtBottom;
  };

  if (messages.length === 0 && !interimTranscript) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No messages yet</p>
          <p className="text-sm mt-1">Start a session to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1"
    >
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          showTimestamp={showTimestamps}
        />
      ))}
      {interimTranscript && <InterimTranscript text={interimTranscript} />}
    </div>
  );
}
