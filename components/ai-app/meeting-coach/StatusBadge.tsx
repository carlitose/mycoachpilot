import React from 'react';
import { AlertCircle, Loader2, CheckCircle2, MicOff } from 'lucide-react';

interface StatusBadgeProps {
  isActive: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  deepgramStatus: string;
  error: any;
}

export default function StatusBadge({
  isActive,
  isConnecting,
  isConnected,
  deepgramStatus,
  error,
}: StatusBadgeProps) {
  if (error) {
    return (
      <div
        className="badge badge-error gap-2 cursor-help"
        title={error.message || 'An error occurred'}
      >
        <AlertCircle size={14} />
        Error: {error.code || 'Unknown'}
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="badge badge-warning gap-2">
        <Loader2 size={14} className="animate-spin" />
        Connecting...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="badge badge-success gap-2">
        <CheckCircle2 size={14} />
        Connected
      </div>
    );
  }

  return (
    <div className="badge badge-ghost gap-2">
      <MicOff size={14} />
      Disconnected
    </div>
  );
}
