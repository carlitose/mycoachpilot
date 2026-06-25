/**
 * Browser WebSocket transport (RFC-1).
 *
 * Thin adapter — no protocol logic.  Auth is transmitted via the
 * `openai-insecure-api-key.<apiKey>` WebSocket subprotocol, matching the
 * original OpenAIRealtimeAdapter approach.
 */

import type {
  RealtimeTransport,
  RealtimeTransportFactory,
  RealtimeTransportHandlers,
  TransportState,
} from '@application/ports/RealtimeTransportPort';

class BrowserWebSocketTransport implements RealtimeTransport {
  private _state: TransportState = 'closed';

  get state(): TransportState {
    return this._state;
  }

  constructor(
    private readonly ws: WebSocket,
    handlers: RealtimeTransportHandlers,
  ) {
    ws.onopen = () => {
      this._state = 'open';
      handlers.onOpen();
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      handlers.onMessage(event.data);
    };

    ws.onclose = (event: CloseEvent) => {
      this._state = 'closed';
      handlers.onClose({ code: event.code, reason: event.reason });
    };

    ws.onerror = () => {
      handlers.onError();
    };
  }

  send(data: string): void {
    if (this._state === 'open') {
      this.ws.send(data);
    }
  }

  close(): void {
    if (this._state === 'open') {
      this._state = 'closing';
      this.ws.close();
    }
  }
}

export class BrowserWebSocketTransportFactory implements RealtimeTransportFactory {
  open(url: string, apiKey: string, handlers: RealtimeTransportHandlers): RealtimeTransport {
    const ws = new WebSocket(url, [
      'realtime',
      `openai-insecure-api-key.${apiKey}`,
      'openai-beta.realtime-v1',
    ]);
    return new BrowserWebSocketTransport(ws, handlers);
  }
}
