import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ContainerProvider } from '@infrastructure/di';
import { store } from '@infrastructure/state';

import { ToastContainer } from './components/common';
import { MainLayout } from './layouts';
import { MainPage, SettingsPage, HistoryPage } from './pages';

export function App(): ReactNode {
  return (
    <Provider store={store}>
      <ContainerProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </MainLayout>
          <ToastContainer />
        </BrowserRouter>
      </ContainerProvider>
    </Provider>
  );
}
