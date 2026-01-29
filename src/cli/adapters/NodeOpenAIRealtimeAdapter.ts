import WebSocket from 'ws';

import type {
  RealtimeConnectionPort,
  RealtimeConnectionState,
  RealtimeConfig,
  RealtimeEvent,
  RealtimeEventHandler,
} from '../../application/ports/RealtimeConnectionPort';
import { ok, err } from '../../domain/shared/Result';
import type { Result } from '../../domain/shared/Result';
import type { ClientEvent, ServerEvent, SessionConfig } from '../../infrastructure/adapters/realtime/types';

const REALTIME_API_URL = 'wss://api.openai.com/v1/realtime';
const TRANSCRIPTION_API_URL = 'wss://api.openai.com/v1/realtime?intent=transcription';
const DEFAULT_MODEL = 'gpt-4o-realtime-preview-2024-12-17';
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';

export class NodeOpenAIRealtimeAdapter implements RealtimeConnectionPort {
  private ws: WebSocket | null = null;
  private state: RealtimeConnectionState = 'disconnected';
  private config: RealtimeConfig | null = null;
  private eventHandlers = new Set<RealtimeEventHandler>();
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
      // Use transcription-specific endpoint for transcriptOnly mode
      const url = config.transcriptOnly
        ? TRANSCRIPTION_API_URL
        : `${REALTIME_API_URL}?model=${config.model ?? DEFAULT_MODEL}`;

      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      return await new Promise((resolve) => {
        if (!this.ws) {
          this.state = 'error';
          this.emitEvent({ type: 'connection_state', state: 'error' });
          resolve(err(new Error('WebSocket creation failed')));
          return;
        }

        this.ws.on('open', () => {
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.emitEvent({ type: 'connection_state', state: 'connected' });
          this.configureSession();
          resolve(ok(undefined));
        });

        this.ws.on('close', (code: number, reason: Buffer) => {
          this.handleClose(code, reason.toString());
        });

        this.ws.on('error', () => {
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
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data);
        });
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
    const base64 = this.int16ToBase64(audio);
    this.send({ type: 'input_audio_buffer.append', audio: base64 });
  }

  commitAudioBuffer(): void {
    if (!this.ws || this.state !== 'connected') return;
    this.send({ type: 'input_audio_buffer.commit' });
  }

  sendText(text: string): Promise<Result<void, Error>> {
    if (!this.ws || this.state !== 'connected') {
      return Promise.resolve(err(new Error('Not connected')));
    }
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
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
    return () => { this.eventHandlers.delete(handler); };
  }

  private configureSession(): void {
    if (!this.ws || !this.config) return;

    // Use different configuration for transcription-only mode
    if (this.config.transcriptOnly) {
      this.configureTranscriptionSession();
      return;
    }

    const sessionConfig: Partial<SessionConfig> = {
      modalities: ['text', 'audio'],
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: { model: 'whisper-1' },
    };

    if (this.config.systemPrompt) sessionConfig.instructions = this.config.systemPrompt;
    if (this.config.voice) sessionConfig.voice = this.config.voice;
    if (this.config.temperature !== undefined) sessionConfig.temperature = this.config.temperature;
    if (this.config.maxResponseTokens !== undefined) sessionConfig.max_response_output_tokens = this.config.maxResponseTokens;

    if (this.config.vadEnabled !== false) {
      sessionConfig.turn_detection = {
        type: 'server_vad',
        threshold: this.config.vadThreshold ?? 0.5,
        silence_duration_ms: this.config.vadSilenceDuration ?? 500,
        prefix_padding_ms: 300,
      };
    } else {
      sessionConfig.turn_detection = null;
    }

    this.send({ type: 'session.update', session: sessionConfig });
  }

  private configureTranscriptionSession(): void {
    // Transcription-specific session configuration for intent=transcription endpoint
    // Uses gpt-4o-mini-transcribe which is better than whisper-1
    const transcriptionConfig = {
      type: 'transcription_session.update',
      session: {
        input_audio_format: 'pcm16',
        input_audio_transcription: {
          model: DEFAULT_TRANSCRIPTION_MODEL,
        },
        turn_detection: {
          type: 'server_vad',
          threshold: this.config?.vadThreshold ?? 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: this.config?.vadSilenceDuration ?? 500,
        },
        input_audio_noise_reduction: {
          type: 'near_field',
        },
      },
    };

    // Send directly without going through typed ClientEvent
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(transcriptionConfig));
    }
  }

  private send(event: ClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(event));
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const text = Buffer.isBuffer(data) ? data.toString('utf8') : (data as string);
      const event = JSON.parse(text) as ServerEvent;
      this.processServerEvent(event);
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

      // === Transcription-only mode events (intent=transcription) ===
      case 'conversation.item.input_audio_transcription.completed':
        this.emitEvent({
          type: 'transcript',
          text: event.transcript,
          isFinal: true,
          role: 'user',
        });
        break;

      // Transcription session confirmed
      case 'transcription_session.created':
      case 'transcription_session.updated':
        // Session is ready, no action needed
        break;

      // === Conversation mode events ===
      case 'response.audio_transcript.delta':
        this.responseText += event.delta;
        this.emitEvent({ type: 'response_text', text: this.responseText, isFinal: false });
        break;

      case 'response.audio_transcript.done':
        this.emitEvent({ type: 'response_text', text: event.transcript, isFinal: true });
        this.emitEvent({ type: 'transcript', text: event.transcript, isFinal: true, role: 'assistant' });
        this.responseText = '';
        break;

      case 'response.audio.delta': {
        const audioData = this.base64ToInt16(event.delta);
        this.emitEvent({ type: 'audio_response', audio: audioData, sampleRate: 24000 });
        break;
      }

      case 'response.text.delta':
        this.responseText += event.delta;
        this.emitEvent({ type: 'response_text', text: this.responseText, isFinal: false });
        break;

      case 'response.text.done':
        this.emitEvent({ type: 'response_text', text: event.text, isFinal: true });
        this.emitEvent({ type: 'transcript', text: event.text, isFinal: true, role: 'assistant' });
        this.responseText = '';
        break;
    }
  }

  private handleClose(code: number, reason: string): void {
    const wasConnected = this.state === 'connected';
    this.ws = null;

    if (wasConnected && this.reconnectAttempts < this.maxReconnectAttempts && this.config) {
      this.reconnectAttempts++;
      this.state = 'reconnecting';
      this.emitEvent({ type: 'connection_state', state: 'reconnecting' });

      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      setTimeout(() => {
        if (this.config) void this.connect(this.config);
      }, delay);
    } else {
      this.state = 'disconnected';
      this.emitEvent({ type: 'connection_state', state: 'disconnected' });

      if (code !== 1000) {
        this.emitEvent({
          type: 'error',
          code: `ws_close_${String(code)}`,
          message: reason || 'Connection closed unexpectedly',
        });
      }
    }
  }

  private emitEvent(event: RealtimeEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }

  private int16ToBase64(int16Array: Int16Array): string {
    return Buffer.from(int16Array.buffer).toString('base64');
  }

  private base64ToInt16(base64: string): Int16Array {
    const buf = Buffer.from(base64, 'base64');
    return new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
  }
}
