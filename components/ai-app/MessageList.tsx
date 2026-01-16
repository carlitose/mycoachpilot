import { useRef, useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/ai-types/chat";
import { formatMarkdown } from "@/lib/ai-utils/formatMessage";

interface MessageListProps {
  messages: Message[];
  onDeleteMessage: (index: number) => void;
}

export default function MessageList({ messages, onDeleteMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Effect to automatically scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        message.role === 'transcript' ? (
          // Transcript messages: centered, with green accent and microphone icon
          <div key={index} className="flex justify-center my-2">
            <div className="group relative max-w-3xl w-full bg-slate-700 text-slate-200 px-4 py-3 rounded-lg border-l-4 border-green-500 font-mono text-sm">
              <span className="text-green-400 font-semibold mr-2">🎤</span>
              <span dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-slate-600 hover:bg-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={() => handleCopy(message.content, index)}
                title="Copy message"
              >
                {copiedIndex === index ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Copy size={12} className="text-slate-300" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] relative ${
              message.role === 'user'
                ? 'bg-blue-900 ml-auto'
                : message.role === 'assistant'
                  ? 'bg-slate-800 group'
                  : message.role === 'log'
                    ? 'bg-slate-600 border border-slate-500 italic'
                    : 'bg-slate-700 mx-auto text-center text-sm font-semibold'
            }`}
          >
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
            {message.role === 'assistant' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-1 right-5 h-5 w-5 p-0 rounded-full bg-slate-700 hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => handleCopy(message.content, index)}
                  title="Copy message"
                >
                  {copiedIndex === index ? (
                    <Check size={10} className="text-green-400" />
                  ) : (
                    <Copy size={10} className="text-slate-300" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-slate-700 hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => onDeleteMessage(index)}
                  title="Delete message"
                >
                  <X size={10} className="text-slate-300" />
                </Button>
              </>
            )}
          </div>
        )
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
} 