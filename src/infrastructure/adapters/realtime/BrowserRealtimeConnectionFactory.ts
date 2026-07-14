import type {
  RealtimeConnectionFactoryPort,
  RealtimeConnectionPort,
} from '@application/ports';

import { BrowserWebSocketTransportFactory } from './BrowserWebSocketTransport';
import { OpenAIRealtimeProtocol } from './OpenAIRealtimeProtocol';

/**
 * Browser-based factory for creating RealtimeConnection instances.
 * Uses the transport-agnostic OpenAIRealtimeProtocol wired with the
 * native WebSocket transport (subprotocol auth).
 */
export class BrowserRealtimeConnectionFactory implements RealtimeConnectionFactoryPort {
  create(): RealtimeConnectionPort {
    return new OpenAIRealtimeProtocol(new BrowserWebSocketTransportFactory());
  }
}
