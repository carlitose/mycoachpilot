import type { RealtimeConnectionPort } from './RealtimeConnectionPort';

/**
 * Factory port for creating RealtimeConnection instances
 * Used for dual-connection scenarios (mic + system audio)
 */
export interface RealtimeConnectionFactoryPort {
  /**
   * Create a new RealtimeConnectionPort instance
   */
  create(): RealtimeConnectionPort;
}
