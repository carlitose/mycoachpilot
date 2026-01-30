/**
 * App.tsx - Composition Root
 *
 * This is the ONLY file in the presentation layer that is allowed to import
 * from the infrastructure layer. It wires up the application by:
 * 1. Creating the Redux store provider
 * 2. Creating the service container with infrastructure implementations
 * 3. Passing the container to the presentation layer's ContainerProvider
 *
 * @fileoverview Composition root - exempt from boundary rules as it must wire
 * infrastructure to presentation.
 */
/* eslint-disable boundaries/element-types */
import { useMemo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import type { ServiceContainer } from '@application/ports';

// Infrastructure imports - ONLY allowed in this composition root file
import {
  getEventBus,
  getAudioCapture,
  getRealtimeConnection,
  getSessionRepository,
  getConfigRepository,
  getSessionManager,
} from '@infrastructure/di';
import {
  store,
  useReduxSessionState,
  useReduxTranscriptState,
  useReduxCoachingState,
  useReduxSettingsState,
} from '@infrastructure/state';

// Presentation layer imports
import { ThemeProvider } from './components/theme/ThemeProvider';
import { ContainerProvider } from './context';
import { MainLayout } from './layouts';
import { MainPage } from './pages';

export function App(): ReactNode {
  // Create the service container with all infrastructure implementations
  const container = useMemo<ServiceContainer>(() => ({
    // Infrastructure services
    eventBus: getEventBus(),
    audioCapture: getAudioCapture(),
    realtimeConnection: getRealtimeConnection(),
    sessionRepository: getSessionRepository(),
    configRepository: getConfigRepository(),
    sessionManager: getSessionManager(),

    // State hooks - pass the hook functions directly
    useSessionState: useReduxSessionState,
    useTranscriptState: useReduxTranscriptState,
    useCoachingState: useReduxCoachingState,
    useSettingsState: useReduxSettingsState,
  }), []);

  return (
    <Provider store={store}>
      <ContainerProvider container={container}>
        <ThemeProvider defaultTheme="system">
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<MainPage />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </ThemeProvider>
      </ContainerProvider>
    </Provider>
  );
}
