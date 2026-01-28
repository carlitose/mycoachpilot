import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners(): void {
  toastListeners.forEach((listener) => { listener([...toasts]); });
}

export function addToast(message: string, type: ToastType, duration = 5000): void {
  const id = `toast-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`;
  toasts = [...toasts, { id, message, type, duration }];
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
}

export function removeToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

const typeStyles: Record<ToastType, { bg: string; icon: string; iconBg: string }> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    icon: 'M5 13l4 4L19 7',
    iconBg: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    icon: 'M6 18L18 6M6 6l12 12',
    iconBg: 'bg-red-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    iconBg: 'bg-yellow-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconBg: 'bg-blue-500',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }): ReactNode {
  const styles = typeStyles[toast.type];

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${styles.bg} animate-slide-in`}
      role="alert"
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${styles.iconBg} flex items-center justify-center`}>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styles.icon} />
        </svg>
      </div>
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{toast.message}</p>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer(): ReactNode {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setCurrentToasts);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {currentToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => { removeToast(toast.id); }}
        />
      ))}
    </div>,
    document.body
  );
}

export function useToast(): ToastContextValue {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setCurrentToasts);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  const addToastCallback = useCallback((message: string, type: ToastType, duration?: number) => {
    addToast(message, type, duration);
  }, []);

  const removeToastCallback = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return {
    toasts: currentToasts,
    addToast: addToastCallback,
    removeToast: removeToastCallback,
  };
}
