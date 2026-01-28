import type { ReactNode } from 'react';

import { SettingsPanel } from '../components/settings';

export function SettingsPage(): ReactNode {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configure your API keys and session preferences
        </p>
      </div>
      <SettingsPanel />
    </div>
  );
}
