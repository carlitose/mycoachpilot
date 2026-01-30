/**
 * Container Context
 * Provides dependency injection for presentation layer.
 * The context is created here in presentation, while the actual
 * container values are created in the composition root (App.tsx).
 */
import { createContext, useContext, type ReactNode, type Context } from 'react';

import type { ServiceContainer } from '@application/ports';

/**
 * React Context for the service container.
 */
export const ContainerContext: Context<ServiceContainer | null> = createContext<ServiceContainer | null>(null);

interface ContainerProviderProps {
  container: ServiceContainer;
  children: ReactNode;
}

/**
 * Provider component that provides an existing service container.
 * The container should be created in App.tsx (composition root).
 */
export function ContainerProvider({ container, children }: ContainerProviderProps): ReactNode {
  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}

/**
 * Hook to access the service container.
 * Must be used within a ContainerProvider.
 */
export function useContainer(): ServiceContainer {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error('useContainer must be used within a ContainerProvider');
  }
  return container;
}
