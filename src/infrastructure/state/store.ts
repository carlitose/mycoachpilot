import { configureStore } from '@reduxjs/toolkit';

import {
  sessionReducer,
  transcriptReducer,
  coachingReducer,
  settingsReducer,
} from './slices';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    transcript: transcriptReducer,
    coaching: coachingReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Date objects in state
        ignoredPaths: [
          'session.currentSession.startedAt',
          'session.currentSession.endedAt',
          'session.currentSession.createdAt',
        ],
        ignoredActionPaths: ['payload.startedAt', 'payload.endedAt', 'payload.timestamp'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
