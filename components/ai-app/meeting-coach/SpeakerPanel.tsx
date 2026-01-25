import React from 'react';
import { Users } from 'lucide-react';
import type { Speaker } from '@/lib/meeting-coach/types';

interface SpeakerPanelProps {
  speakers: Speaker[];
  userSpeakerId?: number;
  onIdentifySpeaker: (speakerId: number) => void;
}

export default function SpeakerPanel({ speakers, userSpeakerId, onIdentifySpeaker }: SpeakerPanelProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold">Speakers</h2>
      </div>

      {speakers.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No speakers detected yet. Start speaking in your meeting.
        </p>
      )}

      <div className="space-y-2">
        {speakers.map((speaker) => (
          <SpeakerCard
            key={speaker.id}
            speaker={speaker}
            isUser={speaker.id === userSpeakerId}
            onIdentify={() => onIdentifySpeaker(speaker.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SpeakerCardProps {
  speaker: Speaker;
  isUser: boolean;
  onIdentify: () => void;
}

function SpeakerCard({ speaker, isUser, onIdentify }: SpeakerCardProps) {
  return (
    <div
      className={`card bg-base-100 dark:bg-gray-700 shadow-sm p-3 ${
        isUser ? 'border-2 border-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">
            {speaker.label}
            {isUser && <span className="ml-2 badge badge-primary badge-sm">You</span>}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {speaker.wordCount} words
          </p>
        </div>

        {!isUser && (
          <button onClick={onIdentify} className="btn btn-xs btn-outline">
            I&apos;m this speaker
          </button>
        )}
      </div>
    </div>
  );
}
