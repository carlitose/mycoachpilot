/**
 * Deepgram API Types
 */

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

export interface DeepgramMetadata {
  request_id: string;
  model_info: {
    name: string;
    version: string;
    arch: string;
  };
  model_uuid: string;
}

export interface DeepgramTranscriptMessage {
  type: 'Results';
  channel_index: [number, number];
  duration: number;
  start: number;
  is_final: boolean;
  speech_final: boolean;
  channel: DeepgramChannel;
  metadata?: DeepgramMetadata;
}

export interface DeepgramMetadataMessage {
  type: 'Metadata';
  transaction_key: string;
  request_id: string;
  sha256: string;
  created: string;
  duration: number;
  channels: number;
  models: string[];
  model_info: Record<string, {
    name: string;
    version: string;
    arch: string;
  }>;
}

export interface DeepgramSpeechStartedMessage {
  type: 'SpeechStarted';
  channel: number[];
  timestamp: number;
}

export interface DeepgramUtteranceEndMessage {
  type: 'UtteranceEnd';
  channel: number[];
  last_word_end: number;
}

export interface DeepgramErrorMessage {
  type: 'Error';
  description: string;
  message: string;
  variant?: string;
}

export interface DeepgramCloseMessage {
  type: 'CloseStream';
}

export type DeepgramMessage =
  | DeepgramTranscriptMessage
  | DeepgramMetadataMessage
  | DeepgramSpeechStartedMessage
  | DeepgramUtteranceEndMessage
  | DeepgramErrorMessage
  | DeepgramCloseMessage;
