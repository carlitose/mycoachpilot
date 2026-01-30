import { type ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps): ReactNode {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
