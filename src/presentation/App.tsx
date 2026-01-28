import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ContainerProvider } from '@infrastructure/di';
import { store } from '@infrastructure/state';

import { ThemeProvider } from './components/theme/ThemeProvider';
import { MainLayout } from './layouts';
import { MainPage } from './pages';

export function App(): ReactNode {
  return (
    <Provider store={store}>
      <ContainerProvider>
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
