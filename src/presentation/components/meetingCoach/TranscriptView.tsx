import { useEffect, useRef, type ReactNode } from 'react';

import type { TranscriptSegmentProps } from '@domain/transcript';

import { useTranscript } from '@presentation/hooks';

interface TranscriptViewProps {
  autoScroll?: boolean;
}

const speakerColors = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700' },
];

export function TranscriptView({ autoScroll = true }: TranscriptViewProps): ReactNode {
  const { segments, speakers, interimTranscript, userSpeakerId } = useTranscript();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (autoScroll && shouldScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [segments, interimTranscript, autoScroll]);

  const handleScroll = (): void => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  const getSpeakerLabel = (speakerId: number | undefined): string => {
    if (speakerId === undefined) return 'Unknown';
    const speaker = speakers.find(s => s.id === speakerId);
    if (speakerId === userSpeakerId) return 'You';
    return speaker?.name ?? `Speaker ${String(speakerId)}`;
  };

  const getSpeakerColor = (speakerId: number | undefined): { bg: string; text: string; border: string } => {
    const defaultColor = speakerColors[0] ?? { bg: '', text: '', border: '' };
    if (speakerId === undefined) return defaultColor;
    const index = speakers.findIndex(s => s.id === speakerId);
    return speakerColors[index % speakerColors.length] ?? defaultColor;
  };

  if (segments.length === 0 && !interimTranscript) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p>Waiting for speech...</p>
          <p className="text-sm mt-1">Audio will be transcribed here</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-2"
    >
      {segments.map((segment) => (
        <SegmentItem
          key={segment.id}
          segment={segment}
          speakerLabel={getSpeakerLabel(segment.speakerId)}
          colors={getSpeakerColor(segment.speakerId)}
          isUser={segment.speakerId === userSpeakerId}
        />
      ))}
      {interimTranscript && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            {interimTranscript}
          </p>
        </div>
      )}
    </div>
  );
}

interface SegmentItemProps {
  segment: TranscriptSegmentProps;
  speakerLabel: string;
  colors: { bg: string; text: string; border: string };
  isUser: boolean;
}

function SegmentItem({ segment, speakerLabel, colors, isUser }: SegmentItemProps): ReactNode {
  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-medium ${colors.text}`}>
          {speakerLabel}
        </span>
        {isUser && (
          <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
            You
          </span>
        )}
        <span className="text-xs text-gray-400">
          {formatTimestamp(segment.startMs / 1000)}
        </span>
        {segment.confidence < 0.8 && (
          <span className="text-xs text-amber-500" title="Low confidence">
            ⚠
          </span>
        )}
      </div>
      <p className="text-sm text-gray-900 dark:text-gray-100">
        {segment.text}
      </p>
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
}
