import type { ReactNode } from 'react';

import type { SpeakerProps } from '@domain/transcript';

import { useTranscript } from '@presentation/hooks';

interface SpeakerPanelProps {
  onSelectUser?: (speakerId: number) => void;
  userSpeakerId?: number | null;
}

const speakerColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
];

export function SpeakerPanel({ onSelectUser, userSpeakerId }: SpeakerPanelProps): ReactNode {
  const { speakers, speakerStats } = useTranscript();

  if (speakers.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No speakers detected yet</p>
        <p className="text-xs mt-1">Start speaking to detect participants</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Participants ({speakers.length})
      </h3>
      {speakers.map((speaker, index) => {
        const stats = speakerStats.find(s => s.id === speaker.id);
        return (
          <SpeakerItem
            key={speaker.id}
            speaker={speaker}
            stats={stats ? { wordCount: stats.wordCount, segmentCount: stats.segmentCount, talkTimePercent: stats.timePercentage } : undefined}
            colorClass={speakerColors[index % speakerColors.length] ?? 'bg-gray-500'}
            isUser={userSpeakerId === speaker.id}
            onSelectAsUser={onSelectUser ? () => { onSelectUser(speaker.id); } : undefined}
          />
        );
      })}
    </div>
  );
}

interface SpeakerItemProps {
  speaker: SpeakerProps;
  stats?: { wordCount: number; segmentCount: number; talkTimePercent: number } | undefined;
  colorClass: string;
  isUser: boolean;
  onSelectAsUser?: (() => void) | undefined;
}

function SpeakerItem({ speaker, stats, colorClass, isUser, onSelectAsUser }: SpeakerItemProps): ReactNode {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg
        ${isUser ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : 'bg-gray-50 dark:bg-gray-800'}
      `}
    >
      <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white font-medium text-sm`}>
        {speaker.name?.charAt(0) ?? `S${String(speaker.id)}`}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {speaker.name ?? `Speaker ${String(speaker.id)}`}
          </span>
          {isUser && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
              You
            </span>
          )}
        </div>
        {stats && (
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{stats.wordCount} words</span>
            <span>{stats.segmentCount} segments</span>
            <span>{stats.talkTimePercent.toFixed(0)}% talk time</span>
          </div>
        )}
      </div>
      {onSelectAsUser && !isUser && (
        <button
          onClick={onSelectAsUser}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap"
        >
          This is me
        </button>
      )}
    </div>
  );
}
