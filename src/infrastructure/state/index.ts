/**
 * Infrastructure State Management
 * Redux store configuration and slices
 */

// Store
export { store } from './store';
export type { RootState, AppDispatch } from './store';

// Slices
export * from './slices';

// Selectors
export * from './selectors';

// State Adapters (implement application ports)
export {
  useReduxSessionState,
  useReduxTranscriptState,
  useReduxCoachingState,
  useReduxSettingsState,
} from './adapters';

// Event Bus Adapter
export { ReduxEventBusAdapter } from './ReduxEventBusAdapter';
