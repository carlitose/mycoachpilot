/* eslint-disable max-lines */
// This file exceeds the max-lines limit (300 code lines) even after the audio
// codec was extracted to codec.ts.  The remaining content — connect/disconnect,
// reconnect state machine, session configuration builders, and the full server
// event switch — is the tightly coupled protocol state machine that RFC-1
// explicitly requires to live together.  Splitting it would reintroduce the
// cohesion problem the RFC was created to fix.

import { ok, err } from '@domain/shared';
import type { Result } from '@domain/shared';

import type {
  RealtimeConnectionPort,
  RealtimeConnectionState,
  RealtimeConfig,
  RealtimeEvent,
  RealtimeEventHandler,
} from '@application/ports/RealtimeConnectionPort';
import type { RealtimeTransportFactory, RealtimeTransport } from '@application/ports/RealtimeTransportPort';

import { int16ToBase64, base64ToInt16 } from './codec';
import type { ServerEvent, SessionConfig } from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

const REALTIME_API_URL = 'wss://api.openai.com/v1/realtime';
const TRANSCRIPTION_API_URL = 'wss://api.openai.com/v1/realtime?intent=transcription';
const DEFAULT_MODEL = 'gpt-realtime';
/**
 * Default transcription model.
 * Always read config.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL.
 * Never hardcode the model string at call sites (fixes NodeOpenAIRealtimeAdapter:175 bug).
 */
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
const DEFAULT_VAD_THRESHOLD = 0.5;
const DEFAULT_VAD_SILENCE_DURATION_MS = 300;
const MAX_RECONNECT_ATTEMPTS = 3;
const CLEAN_CLOSE_CODE = 1000;

// ─── OpenAIRealtimeProtocol ──────────────────────────────────────────────────

/**
 * Transport-agnostic OpenAI Realtime protocol core (RFC-1).
 *
 * Owns: full WebSocket state machine, reconnect + exponential backoff,
 * session-config builders, processServerEvent switch, audio codec.
 *
 * Does NOT own: transport choice, auth strategy — those live in the injected
 * RealtimeTransportFactory (BrowserWebSocketTransportFactory or NodeWsTransportFactory).
 *
 * Imports: only ports + ./types + domain Result — never `ws`, `WebSocket`, `Buffer`.
 */
export class OpenAIRealtimeProtocol implements RealtimeConnectionPort {
  private transport: RealtimeTransport | null = null;
  private state: RealtimeConnectionState = 'disconnected';
  private config: RealtimeConfig | null = null;
  private eventHandlers: Set<RealtimeEventHandler> = new Set();
  private responseText = '';
  private reconnectAttempts = 0;

  constructor(private readonly transportFactory: RealtimeTransportFactory) {}

  // ── RealtimeConnectionPort ────────────────────────────────────────────────

  getState(): RealtimeConnectionState {
    return this.state;
  }

  async connect(config: RealtimeConfig): Promise<Result<void, Error>> {
    // Already connected — idempotent guard (resolves without opening a new transport)
    if (this.state === 'connected') {
      return ok(undefined);
    }

    this.config = config;
    this.state = 'connecting';
    this.emitEvent({ type: 'connection_state', state: 'connecting' });

    const url = this.buildUrl(config);

    return new Promise<Result<void, Error>>((resolve) => {
      let resolved = false;

      const resolveOnce = (result: Result<void, Error>): void => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      this.transport = this.transportFactory.open(url, config.apiKey, {
        onOpen: () => {
          this.state = 'connected';
          // Reset the reconnect budget on each successful connection so that
          // the MAX_RECONNECT_ATTEMPTS cap applies PER OUTAGE, not per
          // instance lifetime.  Without the reset, three lifetime drops would
          // permanently disable reconnects for the rest of the session.
          this.reconnectAttempts = 0;
          this.emitEvent({ type: 'connection_state', state: 'connected' });
          this.configureSession();
          resolveOnce(ok(undefined));
        },

        onMessage: (raw: string) => {
          this.handleRawMessage(raw);
        },

        onClose: (info) => {
          this.handleClose(info.code, info.reason);
        },

        onError: () => {
          if (this.state === 'connecting') {
            this.state = 'error';
            this.emitEvent({ type: 'connection_state', state: 'error' });
            this.emitEvent({
              type: 'error',
              code: 'connection_failed',
              message: 'Failed to connect to OpenAI Realtime API',
            });
            resolveOnce(err(new Error('Failed to connect to OpenAI Realtime API')));
          }
        },
      });
    });
  }

  disconnect(): void {
    // Mark as intentional clean close before calling transport.close() so the
    // onClose handler (which fires synchronously in the fake and async in real
    // transports) does not trigger reconnect logic.
    this.state = 'disconnected';
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }
    this.emitEvent({ type: 'connection_state', state: 'disconnected' });
  }

  sendAudio(audio: Int16Array): void {
    if (!this.transport || this.state !== 'connected') return;

    const base64 = int16ToBase64(audio);
    this.sendFrame({
      type: 'input_audio_buffer.append',
      audio: base64,
    });
  }

  commitAudioBuffer(): void {
    if (!this.transport || this.state !== 'connected') return;
    this.sendFrame({ type: 'input_audio_buffer.commit' });
  }

  sendText(text: string): Promise<Result<void, Error>> {
    if (!this.transport || this.state !== 'connected') {
      return Promise.resolve(err(new Error('Not connected')));
    }

    this.sendFrame({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    this.sendFrame({ type: 'response.create' });
    return Promise.resolve(ok(undefined));
  }

  triggerResponse(): void {
    if (!this.transport || this.state !== 'connected') return;
    this.sendFrame({ type: 'response.create' });
  }

  cancelResponse(): void {
    if (!this.transport || this.state !== 'connected') return;
    this.sendFrame({ type: 'response.cancel' });
  }

  updateSession(config: Partial<RealtimeConfig>): Promise<Result<void, Error>> {
    if (!this.transport || this.state !== 'connected') {
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
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  // ── URL construction ──────────────────────────────────────────────────────

  private buildUrl(config: RealtimeConfig): string {
    if (config.transcriptOnly) {
      return TRANSCRIPTION_API_URL;
    }
    const model = config.model ?? DEFAULT_MODEL;
    return `${REALTIME_API_URL}?model=${model}`;
  }

  // ── Session configuration ─────────────────────────────────────────────────

  private configureSession(): void {
    if (!this.config) return;

    if (this.config.transcriptOnly) {
      this.configureTranscriptionSession();
      return;
    }

    this.configureConversationSession();
  }

  private configureConversationSession(): void {
    if (!this.config) return;

    const sessionConfig: Partial<SessionConfig> = {
      modalities: ['text', 'audio'],
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      // BUG FIX (RFC-1): always read config.transcriptionModel ?? DEFAULT.
      // NodeOpenAIRealtimeAdapter:175 hardcoded 'gpt-4o-transcribe' and ignored
      // the config value, making --transcription-model a silent no-op in CLI
      // conversation mode. This is now fixed for both runtimes.
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

    this.sendFrame({
      type: 'session.update',
      session: sessionConfig,
    });
  }

  /**
   * Configure transcription-only session for the intent=transcription endpoint.
   *
   * Noise-reduction unification (RFC-1): the Node adapter sent
   * `input_audio_noise_reduction: { type: 'near_field' }` but the browser
   * adapter did not.  We keep the Node superset for both runtimes — this is
   * the intended unification documented in the RFC.  The transcription endpoint
   * accepts and benefits from this field; the conversation endpoint does not
   * use it.
   */
  private configureTranscriptionSession(): void {
    if (!this.config) return;

    // Note: transcription_session.update is NOT in the typed ClientEvent union
    // (it has a different schema than session.update), so we send raw JSON here.
    const transcriptionConfig: Record<string, unknown> = {
      type: 'transcription_session.update',
      session: {
        input_audio_format: 'pcm16',
        // BUG FIX (RFC-1): always use config.transcriptionModel ?? DEFAULT.
        input_audio_transcription: {
          model: this.config.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
        },
        turn_detection: {
          type: 'server_vad',
          threshold: this.config.vadThreshold ?? DEFAULT_VAD_THRESHOLD,
          prefix_padding_ms: 300,
          silence_duration_ms: this.config.vadSilenceDuration ?? DEFAULT_VAD_SILENCE_DURATION_MS,
        },
        // Unified noise-reduction: keep near_field for all runtimes (Node superset).
        input_audio_noise_reduction: {
          type: 'near_field',
        },
      },
    };

    // Route through sendFrame so the open-state guard is applied consistently
    // (avoids duplicating the transport.state === 'open' check inline).
    this.sendFrame(transcriptionConfig);
  }

  // ── Raw frame sending ─────────────────────────────────────────────────────

  private sendFrame(event: Record<string, unknown>): void {
    if (!this.transport || this.transport.state !== 'open') return;
    this.transport.send(JSON.stringify(event));
  }

  // ── Inbound message handling ──────────────────────────────────────────────

  private handleRawMessage(raw: string): void {
    let parsed: ServerEvent;
    try {
      parsed = JSON.parse(raw) as ServerEvent;
    } catch {
      // BUG FIX (RFC-1): surface parse failures as error events instead of
      // silently swallowing them (was an empty catch in both old adapters).
      this.emitEvent({
        type: 'error',
        code: 'invalid_server_message',
        message: `Failed to parse server message: ${raw.slice(0, 120)}`,
      });
      return;
    }
    this.processServerEvent(parsed);
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
        this.emitEvent({
          type: 'transcript',
          text: event.transcript,
          isFinal: true,
          role: 'user',
        });
        break;

      case 'transcription_session.created':
      case 'transcription_session.updated':
        // Session is ready; no further action needed.
        break;

      case 'response.audio_transcript.delta':
        this.responseText += event.delta;
        this.emitEvent({
          type: 'response_text',
          text: this.responseText,
          isFinal: false,
        });
        break;

      case 'response.audio_transcript.done':
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
        const audioData = base64ToInt16(event.delta);
        this.emitEvent({
          type: 'audio_response',
          audio: audioData,
          sampleRate: 24000,
        });
        break;
      }

      case 'response.text.delta':
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
      case 'input_audio_buffer.speech_stopped':
        // VAD events — no action required at this layer.
        break;

      default:
        // Unknown server event types are silently ignored.
        break;
    }
  }

  // ── Reconnect / close handling ────────────────────────────────────────────

  private handleClose(code: number, reason: string): void {
    // If disconnect() was already called, state is already 'disconnected' —
    // do nothing (avoids spurious reconnects or double events).
    if (this.state === 'disconnected') {
      return;
    }

    const wasConnected = this.state === 'connected' || this.state === 'reconnecting';
    this.transport = null;

    // Clean close (1000) or exhausted attempts → just disconnect
    if (
      code === CLEAN_CLOSE_CODE ||
      !wasConnected ||
      this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS ||
      !this.config
    ) {
      this.state = 'disconnected';
      this.emitEvent({ type: 'connection_state', state: 'disconnected' });

      if (code !== CLEAN_CLOSE_CODE && wasConnected) {
        this.emitEvent({
          type: 'error',
          code: `ws_close_${String(code)}`,
          message: reason || 'Connection closed unexpectedly',
        });
      }
      return;
    }

    // Unexpected close — schedule reconnect with exponential backoff
    this.reconnectAttempts++;
    this.state = 'reconnecting';
    this.emitEvent({ type: 'connection_state', state: 'reconnecting' });

    // Backoff: 1 000, 2 000, 4 000 ms … capped at 10 000 ms
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    setTimeout(() => {
      if (this.config && this.state === 'reconnecting') {
        void this.connect(this.config);
      }
    }, delay);
  }

  // ── Event emission ────────────────────────────────────────────────────────

  private emitEvent(event: RealtimeEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch {
        // Handler errors must not crash the protocol core.
      }
    });
  }
}
