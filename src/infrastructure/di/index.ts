/**
 * Dependency Injection Container
 * Wires up adapters to ports
 *
 * Note: The ContainerProvider is now in the presentation layer.
 * App.tsx (composition root) imports these factories and passes them
 * to the presentation's ContainerProvider.
 */

export {
  getEventBus,
  getAudioCapture,
  getAudioPlayback,
  getTTS,
  getRealtimeConnection,
  getSessionRepository,
  getConfigRepository,
  getSessionManager,
  resetContainer,
} from './container';
