import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  isSessionActive: boolean;
  onSendMessage: (message: string) => void | Promise<void>;
}

export default function MessageInput({ isSessionActive, onSendMessage }: MessageInputProps) {
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isSessionActive) return;
    onSendMessage(inputMessage);
    setInputMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={!isSessionActive}
        className="bg-slate-800 border-slate-700 flex-1 min-w-0"
      />
      <Button
        onClick={handleSendMessage}
        disabled={!isSessionActive || !inputMessage.trim()}
        className="shrink-0 min-w-[60px] md:min-w-[80px]"
      >
        <span className="hidden sm:inline">Send</span>
        {/* Mobile: Show send icon (paper plane horizontal) */}
        <svg
          className="sm:hidden w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </Button>
    </div>
  );
} 