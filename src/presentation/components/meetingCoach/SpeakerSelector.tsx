import { useState, type ReactNode } from 'react';

import { useTranscript } from '@presentation/hooks';

import { Button, Modal, ModalFooter } from '../common';

interface SpeakerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (speakerId: number) => void;
}

const speakerColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
];

export function SpeakerSelector({ isOpen, onClose, onSelect }: SpeakerSelectorProps): ReactNode {
  const { speakers } = useTranscript();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleConfirm = (): void => {
    if (selectedId !== null) {
      onSelect(selectedId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Which speaker is you?"
      size="md"
    >
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select yourself to get personalized coaching suggestions
        </p>

        {speakers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">No speakers detected yet</p>
            <p className="text-xs mt-1">Start speaking to detect participants</p>
          </div>
        ) : (
          <div className="space-y-2">
            {speakers.map((speaker, index) => (
              <button
                key={speaker.id}
                onClick={() => { setSelectedId(speaker.id); }}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                  ${selectedId === speaker.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div
                  className={`w-10 h-10 rounded-full ${speakerColors[index % speakerColors.length] ?? 'bg-gray-500'} flex items-center justify-center text-white font-medium`}
                >
                  {speaker.name !== null && speaker.name.length > 0 ? speaker.name.charAt(0) : `S${String(speaker.id)}`}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {speaker.name ?? `Speaker ${String(speaker.id)}`}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {speaker.wordCount} words • {speaker.segmentCount} segments
                  </div>
                </div>
                {selectedId === speaker.id && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Skip for now
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={selectedId === null}
        >
          Confirm
        </Button>
      </ModalFooter>
    </Modal>
  );
}
