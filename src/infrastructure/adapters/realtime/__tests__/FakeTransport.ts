/**
 * FakeTransport — in-memory test double for RealtimeTransport / RealtimeTransportFactory.
 *
 * Implements the planned port defined in RFC-1:
 *   src/application/ports/RealtimeTransportPort.ts
 *
 * The production port does not exist yet; we inline the required types here so
 * that this file compiles independently and does not depend on the missing module.
 * Once the production port is created the types must be kept in sync (same shape).
 */

// ─── Inline port types (must match RealtimeTransportPort.ts when created) ───────

export type TransportState = 'open' | 'closing' | 'closed';

export interface TransportCloseInfo {
  code: number;
  reason: string;
}

export interface RealtimeTransportHandlers {
  onOpen: () => void;
  onMessage: (raw: string) => void;
  onClose: (info: TransportCloseInfo) => void;
  onError: () => void;
}

export interface RealtimeTransport {
  send(data: string): void;
  close(): void;
  readonly state: TransportState;
}

export interface RealtimeTransportFactory {
  open(url: string, apiKey: string, handlers: RealtimeTransportHandlers): RealtimeTransport;
}

// ─── FakeTransport ───────────────────────────────────────────────────────────────

/**
 * Synchronous in-memory transport.
 *
 * - `sent` accumulates every frame passed to `send()` (only while open).
 * - Driver methods (`emitOpen`, `emitServerEvent`, `emitClose`, `emitError`)
 *   synchronously invoke the registered handlers, making tests fully deterministic
 *   without fake timers for the happy path.
 */
export class FakeTransport implements RealtimeTransport {
  /** All raw frames sent by the protocol core via `send()`. */
  readonly sent: string[] = [];

  private _state: TransportState = 'closed';
  private handlers: RealtimeTransportHandlers | null = null;

  get state(): TransportState {
    return this._state;
  }

  // ── RealtimeTransport implementation ────────────────────────────────────────

  send(data: string): void {
    if (this._state === 'open') {
      this.sent.push(data);
    }
  }

  close(): void {
    if (this._state !== 'closed') {
      this._state = 'closing';
    }
  }

  // ── Synchronous test drivers ─────────────────────────────────────────────────

  /** Simulates the WebSocket `onopen` callback. */
  emitOpen(): void {
    this._state = 'open';
    this.handlers?.onOpen();
  }

  /**
   * Simulates a server-to-client message arriving on the WebSocket.
   * Serialises the event to JSON so the protocol core exercises its parser.
   */
  emitServerEvent(event: Record<string, unknown>): void {
    this.handlers?.onMessage(JSON.stringify(event));
  }

  /**
   * Simulates a server-to-client raw (possibly malformed) message arriving.
   * Use this variant to send non-JSON strings that should trigger parse-error handling.
   */
  emitRawMessage(raw: string): void {
    this.handlers?.onMessage(raw);
  }

  /** Simulates the WebSocket `onclose` callback. */
  emitClose(code: number, reason = ''): void {
    this._state = 'closed';
    this.handlers?.onClose({ code, reason });
  }

  /** Simulates the WebSocket `onerror` callback. */
  emitError(): void {
    this.handlers?.onError();
  }

  /** Internal: called by FakeTransportFactory to wire up handlers. */
  _attachHandlers(handlers: RealtimeTransportHandlers): void {
    this.handlers = handlers;
  }
}

// ─── FakeTransportFactory ────────────────────────────────────────────────────────

/**
 * Creates `FakeTransport` instances and exposes them for inspection.
 *
 * `last` always points to the most recently opened transport, so tests can
 * inspect `factory.last.sent` or drive callbacks without keeping a local ref.
 *
 * `all` holds every transport ever opened, enabling reconnect assertions
 * (e.g. "factory.all.length === 2" after one reconnect).
 */
export class FakeTransportFactory implements RealtimeTransportFactory {
  readonly all: FakeTransport[] = [];

  get last(): FakeTransport {
    if (this.all.length === 0) {
      throw new Error('FakeTransportFactory: no transport has been opened yet');
    }
    return this.all[this.all.length - 1]!;
  }

  /** The URL passed to the most recent `open()` call — useful for URL-routing assertions. */
  lastUrl = '';
  /** The apiKey passed to the most recent `open()` call. */
  lastApiKey = '';

  open(url: string, apiKey: string, handlers: RealtimeTransportHandlers): RealtimeTransport {
    const transport = new FakeTransport();
    transport._attachHandlers(handlers);
    this.all.push(transport);
    this.lastUrl = url;
    this.lastApiKey = apiKey;
    return transport;
  }
}
