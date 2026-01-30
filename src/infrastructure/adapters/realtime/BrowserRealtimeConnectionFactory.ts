import type {
  RealtimeConnectionFactoryPort,
  RealtimeConnectionPort,
} from '@application/ports';

import { OpenAIRealtimeAdapter } from './OpenAIRealtimeAdapter';

/**
 * Browser-based factory for creating RealtimeConnection instances
 * Creates new OpenAIRealtimeAdapter instances for dual-connection scenarios
 */
export class BrowserRealtimeConnectionFactory implements RealtimeConnectionFactoryPort {
  create(): RealtimeConnectionPort {
    return new OpenAIRealtimeAdapter();
  }
}
