import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { EventBusPort, AudioCapturePort, RealtimeConnectionPort, TranscriptionPort, SessionRepositoryPort, ConfigRepositoryPort } from '@application/ports';
import type { SessionManager } from '@application/services';

import {
  getEventBus,
  getAudioCapture,
  getRealtimeConnection,
  getTranscription,
  getSessionRepository,
  getConfigRepository,
  getSessionManager,
} from './container';

export interface ServiceContainer {
  eventBus: EventBusPort;
  audioCapture: AudioCapturePort;
  realtimeConnection: RealtimeConnectionPort;
  transcription: TranscriptionPort;
  sessionRepository: SessionRepositoryPort;
  configRepository: ConfigRepositoryPort;
  sessionManager: SessionManager;
}

const ContainerContext = createContext<ServiceContainer | null>(null);

interface ContainerProviderProps {
  children: ReactNode;
}

export function ContainerProvider({ children }: ContainerProviderProps): ReactNode {
  const container = useMemo<ServiceContainer>(() => ({
    eventBus: getEventBus(),
    audioCapture: getAudioCapture(),
    realtimeConnection: getRealtimeConnection(),
    transcription: getTranscription(),
    sessionRepository: getSessionRepository(),
    configRepository: getConfigRepository(),
    sessionManager: getSessionManager(),
  }), []);

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}

export function useContainer(): ServiceContainer {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error('useContainer must be used within a ContainerProvider');
  }
  return container;
}
