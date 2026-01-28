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

// Event Bus Adapter
export { ReduxEventBusAdapter } from './ReduxEventBusAdapter';
