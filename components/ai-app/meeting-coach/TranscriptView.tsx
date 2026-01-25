import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { TranscriptSegment } from '@/lib/meeting-coach/types';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  userSpeakerId?: number;
}

export default function TranscriptView({ segments, userSpeakerId }: TranscriptViewProps) {
  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>Transcript will appear here once the meeting starts.</p>
          <p className="text-sm mt-2">Make sure to share tab audio when prompted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {segments.map((segment) => (
        <TranscriptSegmentCard
          key={segment.id}
          segment={segment}
          isUser={segment.speaker === userSpeakerId}
        />
      ))}
    </div>
  );
}

interface TranscriptSegmentCardProps {
  segment: TranscriptSegment;
  isUser: boolean;
}

function TranscriptSegmentCard({ segment, isUser }: TranscriptSegmentCardProps) {
  return (
    <div
      className={`p-4 rounded-lg ${
        isUser
          ? 'bg-primary/10 border-l-4 border-primary'
          : 'bg-white dark:bg-gray-800 border-l-4 border-gray-300 dark:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">
          {segment.speakerLabel}
          {isUser && <span className="ml-2 badge badge-primary badge-xs">You</span>}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(segment.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-base leading-relaxed">{segment.text}</p>
      {!segment.isFinal && (
        <span className="text-xs text-gray-400 italic">Transcribing...</span>
      )}
    </div>
  );
}
