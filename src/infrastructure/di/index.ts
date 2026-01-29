/**
 * Dependency Injection Container
 * Wires up adapters to ports
 */

export {
  getEventBus,
  getAudioCapture,
  getRealtimeConnection,
  getSessionRepository,
  getConfigRepository,
  getSessionManager,
  resetContainer,
} from './container';

export { ContainerProvider, useContainer } from './ContainerProvider';
export type { ServiceContainer } from './ContainerProvider';
