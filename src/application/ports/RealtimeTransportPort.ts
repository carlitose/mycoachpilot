/**
 * RealtimeTransportPort — low-level socket abstraction (RFC-1).
 *
 * This port isolates the only thing that varies between environments:
 * the concrete WebSocket implementation and its auth strategy.
 *
 * Production adapters:
 *   src/infrastructure/adapters/realtime/BrowserWebSocketTransport.ts  (native WebSocket, subprotocol auth)
 *   src/cli/adapters/NodeWsTransport.ts                                 (`ws` package, Bearer-header auth)
 * Test double:
 *   src/infrastructure/adapters/realtime/__tests__/FakeTransport.ts
 *
 * IMPORTANT: Keep this shape in sync with the inline types in FakeTransport.ts.
 */

export type TransportState = 'open' | 'closing' | 'closed';

export interface TransportCloseInfo {
  code: number;
  reason: string;
}

export interface RealtimeTransportHandlers {
  onOpen: () => void;
  /** Protocol core owns JSON parsing; transport delivers raw strings. */
  onMessage: (raw: string) => void;
  onClose: (info: TransportCloseInfo) => void;
  onError: () => void;
}

export interface RealtimeTransport {
  /** Send a raw string frame. Should be a no-op if not open. */
  send(data: string): void;
  close(): void;
  readonly state: TransportState;
}

/**
 * Owns transport selection AND auth strategy (subprotocol vs Bearer header).
 * Called once per connection attempt (including reconnects).
 */
export interface RealtimeTransportFactory {
  open(url: string, apiKey: string, handlers: RealtimeTransportHandlers): RealtimeTransport;
}
