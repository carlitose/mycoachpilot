/**
 * Node.js `ws` transport (RFC-1).
 *
 * Thin adapter — no protocol logic.  Auth is transmitted via HTTP headers
 * (`Authorization: Bearer <apiKey>` + `OpenAI-Beta: realtime=v1`), matching
 * the original NodeOpenAIRealtimeAdapter approach.
 */

import WebSocket from 'ws';

import type {
  RealtimeTransport,
  RealtimeTransportFactory,
  RealtimeTransportHandlers,
  TransportState,
} from '../../application/ports/RealtimeTransportPort';

class NodeWsTransport implements RealtimeTransport {
  private _state: TransportState = 'closed';

  get state(): TransportState {
    return this._state;
  }

  constructor(
    private readonly ws: WebSocket,
    handlers: RealtimeTransportHandlers,
  ) {
    ws.on('open', () => {
      this._state = 'open';
      handlers.onOpen();
    });

    ws.on('message', (data: WebSocket.Data) => {
      // Convert Buffer / ArrayBuffer / Buffer[] to a UTF-8 string before
      // handing off to the protocol core, which owns JSON parsing.
      let raw: string;
      if (Buffer.isBuffer(data)) {
        raw = data.toString('utf8');
      } else if (Array.isArray(data)) {
        raw = Buffer.concat(data).toString('utf8');
      } else if (data instanceof ArrayBuffer) {
        raw = Buffer.from(data).toString('utf8');
      } else {
        raw = data;
      }
      handlers.onMessage(raw);
    });

    ws.on('close', (code: number, reasonBuf: Buffer) => {
      this._state = 'closed';
      // `ws` delivers the reason as a Buffer; normalise to a plain string.
      const reason = Buffer.isBuffer(reasonBuf) ? reasonBuf.toString('utf8') : String(reasonBuf);
      handlers.onClose({ code, reason });
    });

    ws.on('error', () => {
      handlers.onError();
    });
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

export class NodeWsTransportFactory implements RealtimeTransportFactory {
  open(url: string, apiKey: string, handlers: RealtimeTransportHandlers): RealtimeTransport {
    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });
    return new NodeWsTransport(ws, handlers);
  }
}
