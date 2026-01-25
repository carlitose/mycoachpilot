/**
 * AudioStreamBadge Component
 *
 * Generic badge to indicate audio capture status.
 * Used in both Conversation Mode (tab audio) and Meeting Coach Mode.
 */

import React from 'react';
import { Mic } from 'lucide-react';

interface AudioStreamBadgeProps {
  isCapturing: boolean;
  label?: string;
}

export default function AudioStreamBadge({
  isCapturing,
  label = 'Audio Captured',
}: AudioStreamBadgeProps) {
  if (!isCapturing) return null;

  return (
    <div className="badge badge-success gap-2">
      <Mic size={14} />
      {label}
    </div>
  );
}
