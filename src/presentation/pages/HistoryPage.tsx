import type { ReactNode } from 'react';

import { SessionHistoryList } from '../components/history';

export function HistoryPage(): ReactNode {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Session History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View and export your past sessions
        </p>
      </div>
      <SessionHistoryList />
    </div>
  );
}
