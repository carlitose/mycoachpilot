import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Message } from '@/types/ai-types/chat';
import { formatMarkdown } from '@/lib/ai-utils/formatMessage';

interface FloatingTranscriptPiPProps {
  messages: Message[];
  isSessionActive: boolean;
  pipWindow: Window | null;
  onClose: () => void;
}

interface PiPContentProps {
  messages: Message[];
  isSessionActive: boolean;
  onClose: () => void;
}

function PiPMessage({ message }: { message: Message }) {
  if (message.role === 'transcript') {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-full w-full bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border-l-4 border-green-500 font-mono text-xs">
          <span className="text-green-400 font-semibold mr-2">mic</span>
          <span dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
        </div>
      </div>
    );
  }

  const roleStyles: Record<string, string> = {
    user: 'bg-blue-900 ml-auto max-w-[85%]',
    assistant: 'bg-slate-800 max-w-[85%]',
    system: 'bg-slate-700 mx-auto text-center text-xs font-semibold max-w-[90%]',
    log: 'bg-slate-600 border border-slate-500 italic max-w-[85%]',
  };

  return (
    <div className={`p-2 rounded-lg text-xs ${roleStyles[message.role] || 'bg-slate-800'}`}>
      <span dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
    </div>
  );
}

function PiPContent({ messages, isSessionActive, onClose }: PiPContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter out system messages for cleaner view
  const visibleMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800 shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">Transcript</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title="Close popup"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Session status indicator */}
      {!isSessionActive && visibleMessages.length > 0 && (
        <div className="px-3 py-1.5 bg-yellow-900/30 text-yellow-400 text-xs text-center shrink-0">
          Session ended - Viewing history
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {visibleMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No messages yet
          </div>
        ) : (
          visibleMessages.map((message, index) => (
            <PiPMessage key={index} message={message} />
          ))
        )}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}

export default function FloatingTranscriptPiP({
  messages,
  isSessionActive,
  pipWindow,
  onClose,
}: FloatingTranscriptPiPProps) {
  // Get the container element from the PiP window
  const pipContainer = pipWindow?.document?.getElementById('pip-root');

  // If no PiP window or container, don't render anything
  if (!pipWindow || !pipContainer) {
    return null;
  }

  // Use React Portal to render into the PiP window
  return createPortal(
    <PiPContent
      messages={messages}
      isSessionActive={isSessionActive}
      onClose={onClose}
    />,
    pipContainer
  );
}
