/* eslint-disable max-lines */
// This adapter handles complex WebSocket communication with OpenAI Realtime API
// Splitting would reduce cohesion without meaningful benefit
import { ok, err, type Result } from '@domain/shared';

import type {
  RealtimeConnectionPort,
  RealtimeConnectionState,
  RealtimeConfig,
  RealtimeEvent,
  RealtimeEventHandler,
} from '@application/ports';

import type { ClientEvent, ServerEvent, SessionConfig } from './types';

const REALTIME_API_URL = 'wss://api.openai.com/v1/realtime';
const DEFAULT_MODEL = 'gpt-realtime';
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
const DEFAULT_VAD_THRESHOLD = 0.5;
const DEFAULT_VAD_SILENCE_DURATION_MS = 300; // Reduced from 500ms for faster segments

/**
 * OpenAI Realtime API Adapter
 * Handles WebSocket connection and audio streaming
 */
export class OpenAIRealtimeAdapter implements RealtimeConnectionPort {
  private ws: WebSocket | null = null;
  private state: RealtimeConnectionState = 'disconnected';
  private config: RealtimeConfig | null = null;
  private eventHandlers: Set<RealtimeEventHandler> = new Set();
  private responseText = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  getState(): RealtimeConnectionState {
    return this.state;
  }

  async connect(config: RealtimeConfig): Promise<Result<void, Error>> {
    if (this.ws && this.state === 'connected') {
      return ok(undefined);
    }

    this.config = config;
    this.state = 'connecting';
    this.emitEvent({ type: 'connection_state', state: 'connecting' });

    try {
      const model = config.model ?? DEFAULT_MODEL;
      const url = `${REALTIME_API_URL}?model=${model}`;

      this.ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${config.apiKey}`,
        'openai-beta.realtime-v1',
      ]);

      return await new Promise((resolve) => {
        if (!this.ws) {
          this.state = 'error';
          this.emitEvent({ type: 'connection_state', state: 'error' });
          resolve(err(new Error('WebSocket creation failed')));
          return;
        }

        this.ws.onopen = () => {
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.emitEvent({ type: 'connection_state', state: 'connected' });
          this.configureSession();
          resolve(ok(undefined));
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };

        this.ws.onerror = () => {
          if (this.state === 'connecting') {
            this.state = 'error';
            this.emitEvent({ type: 'connection_state', state: 'error' });
            this.emitEvent({
              type: 'error',
              code: 'connection_failed',
              message: 'Failed to connect to OpenAI Realtime API',
            });
            resolve(err(new Error('Failed to connect to OpenAI Realtime API')));
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      });
    } catch (error) {
      this.state = 'error';
      this.emitEvent({ type: 'connection_state', state: 'error' });
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
    this.emitEvent({ type: 'connection_state', state: 'disconnected' });
  }

  sendAudio(audio: Int16Array): void {
    if (!this.ws || this.state !== 'connected') return;

    // Convert Int16Array to base64
    const base64 = this.int16ToBase64(audio);

    this.send({
      type: 'input_audio_buffer.append',
      audio: base64,
    });
  }

  commitAudioBuffer(): void {
    if (!this.ws || this.state !== 'connected') return;
    this.send({ type: 'input_audio_buffer.commit' });
  }

  sendText(text: string): Promise<Result<void, Error>> {
    if (!this.ws || this.state !== 'connected') {
      return Promise.resolve(err(new Error('Not connected')));
    }

    // Create conversation item with text
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });

    // Trigger response
    this.send({ type: 'response.create' });

    return Promise.resolve(ok(undefined));
  }

  triggerResponse(): void {
    if (!this.ws || this.state !== 'connected') return;
    this.send({ type: 'response.create' });
  }

  cancelResponse(): void {
    if (!this.ws || this.state !== 'connected') return;
    this.send({ type: 'response.cancel' });
  }

  updateSession(config: Partial<RealtimeConfig>): Promise<Result<void, Error>> {
    if (!this.ws || this.state !== 'connected') {
      return Promise.resolve(err(new Error('Not connected')));
    }

    if (this.config) {
      this.config = { ...this.config, ...config };
    }
    this.configureSession();
    return Promise.resolve(ok(undefined));
  }

  onEvent(handler: RealtimeEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private configureSession(): void {
    if (!this.ws || !this.config) return;

    const sessionConfig: Partial<SessionConfig> = {
      modalities: this.config.transcriptOnly ? ['text'] : ['text', 'audio'],
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: this.config.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
      },
    };

    if (this.config.systemPrompt) {
      sessionConfig.instructions = this.config.systemPrompt;
    }

    if (this.config.voice) {
      sessionConfig.voice = this.config.voice;
    }

    if (this.config.temperature !== undefined) {
      sessionConfig.temperature = this.config.temperature;
    }

    if (this.config.maxResponseTokens !== undefined) {
      sessionConfig.max_response_output_tokens = this.config.maxResponseTokens;
    }

    // VAD configuration
    if (this.config.vadEnabled !== false) {
      sessionConfig.turn_detection = {
        type: 'server_vad',
        threshold: this.config.vadThreshold ?? DEFAULT_VAD_THRESHOLD,
        silence_duration_ms: this.config.vadSilenceDuration ?? DEFAULT_VAD_SILENCE_DURATION_MS,
        prefix_padding_ms: 300,
      };
    } else {
      sessionConfig.turn_detection = null;
    }

    this.send({
      type: 'session.update',
      session: sessionConfig,
    });
  }

  private send(event: ClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(event));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as ServerEvent;
      this.processServerEvent(data);
    } catch {
      // Ignore parse errors
    }
  }

  private processServerEvent(event: ServerEvent): void {
    switch (event.type) {
      case 'error':
        this.emitEvent({
          type: 'error',
          code: event.error.code ?? event.error.type,
          message: event.error.message,
        });
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User's speech transcription
        this.emitEvent({
          type: 'transcript',
          text: event.transcript,
          isFinal: true,
          role: 'user',
        });
        break;

      case 'response.audio_transcript.delta':
        // AI's response transcript (streaming)
        this.responseText += event.delta;
        this.emitEvent({
          type: 'response_text',
          text: this.responseText,
          isFinal: false,
        });
        break;

      case 'response.audio_transcript.done':
        // AI's response transcript complete
        this.emitEvent({
          type: 'response_text',
          text: event.transcript,
          isFinal: true,
        });
        this.emitEvent({
          type: 'transcript',
          text: event.transcript,
          isFinal: true,
          role: 'assistant',
        });
        this.responseText = '';
        break;

      case 'response.audio.delta': {
        // Audio response chunk
        const audioData = this.base64ToInt16(event.delta);
        this.emitEvent({
          type: 'audio_response',
          audio: audioData,
          sampleRate: 24000,
        });
        break;
      }

      case 'response.text.delta':
        // Text-only response (for transcript-only mode)
        this.responseText += event.delta;
        this.emitEvent({
          type: 'response_text',
          text: this.responseText,
          isFinal: false,
        });
        break;

      case 'response.text.done':
        this.emitEvent({
          type: 'response_text',
          text: event.text,
          isFinal: true,
        });
        this.emitEvent({
          type: 'transcript',
          text: event.text,
          isFinal: true,
          role: 'assistant',
        });
        this.responseText = '';
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking - VAD detected speech
        break;

      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        break;
    }
  }

  private handleClose(event: CloseEvent): void {
    const wasConnected = this.state === 'connected';
    this.ws = null;

    if (wasConnected && this.reconnectAttempts < this.maxReconnectAttempts && this.config) {
      this.reconnectAttempts++;
      this.state = 'reconnecting';
      this.emitEvent({ type: 'connection_state', state: 'reconnecting' });

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      setTimeout(() => {
        if (this.config) {
          void this.connect(this.config);
        }
      }, delay);
    } else {
      this.state = 'disconnected';
      this.emitEvent({ type: 'connection_state', state: 'disconnected' });

      if (event.code !== 1000) {
        this.emitEvent({
          type: 'error',
          code: `ws_close_${String(event.code)}`,
          message: event.reason || 'Connection closed unexpectedly',
        });
      }
    }
  }

  private emitEvent(event: RealtimeEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    });
  }

  private int16ToBase64(int16Array: Int16Array): string {
    const uint8 = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i] ?? 0);
    }
    return btoa(binary);
  }

  private base64ToInt16(base64: string): Int16Array {
    const binary = atob(base64);
    const uint8 = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8[i] = binary.charCodeAt(i);
    }
    return new Int16Array(uint8.buffer);
  }
}
