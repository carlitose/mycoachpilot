/**
 * Deepgram WebSocket Client
 *
 * Handles WebSocket connection to Deepgram Live Transcription API.
 * Features:
 * - Real-time audio streaming
 * - Speaker diarization
 * - Connection timeout (10s)
 * - Auto-reconnect (max 1 attempt)
 * - Error categorization
 */

import { log } from '@/lib/logger';
import type {
  DeepgramEvent,
  SessionError,
  TranscriptWord,
  DeepgramTranscriptResult,
} from './types';

export interface DeepgramConfig {
  apiKey: string;
  model?: string;
  encoding?: string;
  sampleRate?: number;
  channels?: number;
  diarize?: boolean;
  punctuate?: boolean;
  interimResults?: boolean;
  smartFormat?: boolean;
}

type MessageHandler = (event: DeepgramEvent) => void;

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private config: DeepgramConfig;
  private messageHandler: MessageHandler | null = null;
  private reconnectAttempted = false;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;

  constructor(config: DeepgramConfig) {
    this.config = {
      model: 'nova-2',
      encoding: 'linear16',
      sampleRate: 16000,
      channels: 1,
      diarize: true,
      punctuate: true,
      interimResults: true,
      smartFormat: true,
      ...config,
    };
  }

  /**
   * Connect to Deepgram WebSocket
   * @throws {Error} If connection fails or times out
   */
  async connect(): Promise<void> {
    if (this.ws) {
      log.warn('[DeepgramClient] Already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    this.reconnectAttempted = false;

    const url = this.buildWebSocketUrl();
    log.info(`[DeepgramClient] Connecting to ${url.split('?')[0]}`);

    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket with authentication via Sec-WebSocket-Protocol
        this.ws = new WebSocket(url, ['token', this.config.apiKey]);

        // Setup connection timeout (10 seconds)
        this.connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            log.error('[DeepgramClient] Connection timeout');
            this.cleanup();
            reject(this.createError('CONNECTION_TIMEOUT', 'Connection timeout. Check your internet connection and API key.'));
          }
        }, 10000);

        this.ws.onopen = () => {
          log.info('[DeepgramClient] Connected');
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (event) => {
          log.error('[DeepgramClient] WebSocket error', event);
          // Note: onerror provides limited info, actual error details come from onclose
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };
      } catch (err) {
        log.error('[DeepgramClient] Failed to create WebSocket', err);
        reject(this.createError('CONNECTION_FAILED', 'Failed to create WebSocket connection'));
      }
    });
  }

  /**
   * Send audio data to Deepgram
   * @param audioData Int16Array PCM audio data
   */
  sendAudio(audioData: Int16Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      log.warn('[DeepgramClient] Cannot send audio - not connected');
      return;
    }

    try {
      this.ws.send(audioData.buffer);
    } catch (err) {
      log.error('[DeepgramClient] Failed to send audio', err);
    }
  }

  /**
   * Register message handler for transcript events
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Close WebSocket connection
   */
  close(): void {
    if (!this.ws) return;

    log.info('[DeepgramClient] Closing connection');
    this.isIntentionallyClosed = true;

    try {
      // Send CloseStream message before closing
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'CloseStream' }));
      }
    } catch (err) {
      log.error('[DeepgramClient] Error sending CloseStream', err);
    }

    this.cleanup();
  }

  /**
   * Build WebSocket URL with query parameters
   */
  private buildWebSocketUrl(): string {
    const params = new URLSearchParams({
      model: this.config.model!,
      encoding: this.config.encoding!,
      sample_rate: this.config.sampleRate!.toString(),
      channels: this.config.channels!.toString(),
      diarize: this.config.diarize!.toString(),
      punctuate: this.config.punctuate!.toString(),
      interim_results: this.config.interimResults!.toString(),
      smart_format: this.config.smartFormat!.toString(),
    });

    return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'Metadata') {
        log.info('[DeepgramClient] Received Metadata', data);
        this.emitEvent({ type: 'metadata', data });
      } else if (data.type === 'Results') {
        this.handleTranscript(data);
      } else if (data.type === 'UtteranceEnd') {
        log.debug('[DeepgramClient] UtteranceEnd', data);
        this.emitEvent({
          type: 'utteranceEnd',
          lastWordEnd: data.last_word_end,
        });
      }
    } catch (err) {
      log.error('[DeepgramClient] Failed to parse message', err);
      // Don't terminate session on malformed message - just skip it
    }
  }

  /**
   * Handle transcript results from Deepgram
   */
  private handleTranscript(data: any): void {
    const channel = data.channel;
    if (!channel || !channel.alternatives || channel.alternatives.length === 0) {
      return;
    }

    const alternative = channel.alternatives[0];
    const words: TranscriptWord[] = alternative.words || [];

    const result: DeepgramTranscriptResult = {
      transcript: alternative.transcript,
      confidence: alternative.confidence,
      isFinal: data.is_final || false,
      speechFinal: data.speech_final || false,
      startTime: data.start || 0,
      duration: data.duration || 0,
      words,
      channelIndex: data.channel_index || [0],
    };

    log.debug(`[DeepgramClient] Transcript (final=${result.isFinal}): ${result.transcript}`);

    this.emitEvent({ type: 'transcript', data: result });
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    log.info(`[DeepgramClient] Connection closed - Code: ${event.code}, Reason: ${event.reason}`);

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // If intentionally closed, don't emit error or reconnect
    if (this.isIntentionallyClosed) {
      this.emitEvent({
        type: 'close',
        code: event.code,
        reason: event.reason || 'Connection closed by client',
      });
      this.cleanup();
      return;
    }

    // Categorize error based on close code
    const error = this.categorizeCloseCode(event.code, event.reason);

    // Attempt auto-reconnect once on abnormal closure
    if (event.code === 1006 && !this.reconnectAttempted) {
      log.info('[DeepgramClient] Attempting auto-reconnect in 2s');
      this.reconnectAttempted = true;

      setTimeout(async () => {
        try {
          await this.connect();
          log.info('[DeepgramClient] Reconnected successfully');
        } catch (reconnectErr) {
          log.error('[DeepgramClient] Reconnect failed', reconnectErr);
          this.emitEvent({ type: 'error', error });
        }
      }, 2000);
    } else {
      // Emit error and close
      this.emitEvent({ type: 'error', error });
      this.emitEvent({
        type: 'close',
        code: event.code,
        reason: event.reason || 'Connection closed',
      });
      this.cleanup();
    }
  }

  /**
   * Categorize WebSocket close code into SessionError
   */
  private categorizeCloseCode(code: number, reason: string): SessionError {
    switch (code) {
      case 1000:
        return this.createError('NORMAL_CLOSURE', 'Connection closed normally');
      case 1006:
        return this.createError('CONNECTION_LOST', 'Connection lost. Check your internet connection or API key.');
      case 1008:
        return this.createError('RATE_LIMIT', 'Rate limit exceeded. Please wait a few minutes.');
      case 4001:
        return this.createError('BAD_REQUEST', 'Invalid configuration parameters.');
      case 4008:
        return this.createError('INVALID_API_KEY', 'Invalid or expired API key.');
      default:
        return this.createError('UNKNOWN_ERROR', `Connection closed with code ${code}: ${reason}`);
    }
  }

  /**
   * Create SessionError object
   */
  private createError(code: string, message: string): SessionError {
    return {
      type: 'NETWORK_ERROR',
      code,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Emit event to message handler
   */
  private emitEvent(event: DeepgramEvent): void {
    if (this.messageHandler) {
      this.messageHandler(event);
    }
  }

  /**
   * Cleanup WebSocket and timers
   */
  private cleanup(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }

      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
