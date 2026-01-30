/* eslint-disable max-lines */
/**
 * OpenAI Realtime API Types
 * Contains comprehensive type definitions for the OpenAI Realtime API
 */

export interface SessionConfig {
  modalities: ('text' | 'audio')[];
  instructions?: string;
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
  input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  input_audio_transcription?: {
    model: string;
  };
  turn_detection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  } | null;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
  temperature?: number;
  max_response_output_tokens?: number | 'inf';
}

export interface Tool {
  type: 'function';
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Client events
export interface SessionUpdateEvent {
  type: 'session.update';
  session: Partial<SessionConfig>;
}

export interface InputAudioBufferAppendEvent {
  type: 'input_audio_buffer.append';
  audio: string; // base64 encoded
}

export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit';
}

export interface InputAudioBufferClearEvent {
  type: 'input_audio_buffer.clear';
}

export interface ConversationItemCreateEvent {
  type: 'conversation.item.create';
  item: {
    type: 'message';
    role: 'user' | 'assistant' | 'system';
    content: Array<{
      type: 'input_text' | 'text';
      text: string;
    }>;
  };
}

export interface ResponseCreateEvent {
  type: 'response.create';
  response?: {
    modalities?: ('text' | 'audio')[];
    instructions?: string;
    voice?: string;
    output_audio_format?: string;
    tools?: Tool[];
    tool_choice?: string;
    temperature?: number;
    max_output_tokens?: number | 'inf';
  };
}

export interface ResponseCancelEvent {
  type: 'response.cancel';
}

// Transcription-only session configuration (intent=transcription)
export interface TranscriptionSessionUpdateEvent {
  type: 'transcription_session.update';
  input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  input_audio_transcription?: {
    model: string;
    prompt?: string;
    language?: string;
  };
  turn_detection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  } | null;
  input_audio_noise_reduction?: {
    type: 'near_field' | 'far_field';
  };
  include?: string[];
}

export type ClientEvent =
  | SessionUpdateEvent
  | TranscriptionSessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ConversationItemCreateEvent
  | ResponseCreateEvent
  | ResponseCancelEvent;

// Server events
export interface ErrorServerEvent {
  type: 'error';
  error: {
    type: string;
    code?: string;
    message: string;
    param?: string;
    event_id?: string;
  };
}

export interface SessionCreatedEvent {
  type: 'session.created';
  session: SessionConfig & { id: string };
}

export interface SessionUpdatedEvent {
  type: 'session.updated';
  session: SessionConfig & { id: string };
}

export interface ConversationCreatedEvent {
  type: 'conversation.created';
  conversation: { id: string };
}

export interface InputAudioBufferCommittedEvent {
  type: 'input_audio_buffer.committed';
  previous_item_id?: string;
  item_id: string;
}

export interface InputAudioBufferClearedEvent {
  type: 'input_audio_buffer.cleared';
}

export interface InputAudioBufferSpeechStartedEvent {
  type: 'input_audio_buffer.speech_started';
  audio_start_ms: number;
  item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent {
  type: 'input_audio_buffer.speech_stopped';
  audio_end_ms: number;
  item_id: string;
}

export interface ConversationItemCreatedEvent {
  type: 'conversation.item.created';
  previous_item_id?: string;
  item: {
    id: string;
    type: 'message' | 'function_call' | 'function_call_output';
    role?: 'user' | 'assistant' | 'system';
    content?: Array<{
      type: string;
      text?: string;
      transcript?: string;
      audio?: string;
    }>;
  };
}

export interface ConversationItemInputAudioTranscriptionCompletedEvent {
  type: 'conversation.item.input_audio_transcription.completed';
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface ConversationItemInputAudioTranscriptionFailedEvent {
  type: 'conversation.item.input_audio_transcription.failed';
  item_id: string;
  content_index: number;
  error: {
    type: string;
    code?: string;
    message: string;
    param?: string;
  };
}

export interface ResponseCreatedEvent {
  type: 'response.created';
  response: {
    id: string;
    status: 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'incomplete';
    output: unknown[];
  };
}

export interface ResponseDoneEvent {
  type: 'response.done';
  response: {
    id: string;
    status: 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'incomplete';
    output: Array<{
      id: string;
      type: string;
      role?: string;
      content?: Array<{
        type: string;
        text?: string;
        transcript?: string;
      }>;
    }>;
  };
}

export interface ResponseOutputItemAddedEvent {
  type: 'response.output_item.added';
  response_id: string;
  output_index: number;
  item: {
    id: string;
    type: string;
    role?: string;
  };
}

export interface ResponseOutputItemDoneEvent {
  type: 'response.output_item.done';
  response_id: string;
  output_index: number;
  item: {
    id: string;
    type: string;
    role?: string;
    content?: Array<{
      type: string;
      text?: string;
      transcript?: string;
    }>;
  };
}

export interface ResponseContentPartAddedEvent {
  type: 'response.content_part.added';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  part: {
    type: string;
    text?: string;
    transcript?: string;
  };
}

export interface ResponseContentPartDoneEvent {
  type: 'response.content_part.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  part: {
    type: string;
    text?: string;
    transcript?: string;
  };
}

export interface ResponseTextDeltaEvent {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseTextDoneEvent {
  type: 'response.text.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
}

export interface ResponseAudioTranscriptDeltaEvent {
  type: 'response.audio_transcript.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseAudioTranscriptDoneEvent {
  type: 'response.audio_transcript.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

export interface ResponseAudioDeltaEvent {
  type: 'response.audio.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // base64 encoded audio
}

export interface ResponseAudioDoneEvent {
  type: 'response.audio.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

export interface RateLimitsUpdatedEvent {
  type: 'rate_limits.updated';
  rate_limits: Array<{
    name: string;
    limit: number;
    remaining: number;
    reset_seconds: number;
  }>;
}

// Transcription-only session events (intent=transcription)
export interface TranscriptionSessionCreatedEvent {
  type: 'transcription_session.created';
  session: {
    id: string;
    input_audio_format: string;
    input_audio_transcription: {
      model: string;
      prompt?: string;
      language?: string;
    };
    turn_detection?: {
      type: 'server_vad';
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    } | null;
    input_audio_noise_reduction?: {
      type: 'near_field' | 'far_field';
    };
  };
}

export interface TranscriptionSessionUpdatedEvent {
  type: 'transcription_session.updated';
  session: {
    id: string;
    input_audio_format: string;
    input_audio_transcription: {
      model: string;
      prompt?: string;
      language?: string;
    };
    turn_detection?: {
      type: 'server_vad';
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    } | null;
    input_audio_noise_reduction?: {
      type: 'near_field' | 'far_field';
    };
  };
}

export type ServerEvent =
  | ErrorServerEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | TranscriptionSessionCreatedEvent
  | TranscriptionSessionUpdatedEvent
  | ConversationCreatedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ConversationItemCreatedEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent
  | ConversationItemInputAudioTranscriptionFailedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseOutputItemAddedEvent
  | ResponseOutputItemDoneEvent
  | ResponseContentPartAddedEvent
  | ResponseContentPartDoneEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | RateLimitsUpdatedEvent;
