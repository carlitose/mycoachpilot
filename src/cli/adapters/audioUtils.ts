import {
  listAudioDevices,
  getDefaultInputDevice,
} from 'coreaudio-node';

import type { AudioDataEvent } from '../../application/ports/AudioCapturePort';

// Timeout constants for audio operations
export const PERMISSION_TIMEOUT_MS = 5000;
export const RECORDER_START_TIMEOUT_MS = 5000;

export interface AudioDeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
  isInput: boolean;
  isOutput: boolean;
  sampleRate: number;
  channelCount: number;
}

/**
 * Wraps a promise with a timeout. Rejects if the operation takes too long.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${String(timeoutMs)}ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Logger for diagnostic output during audio capture.
 * Respects DEBUG environment variable.
 */
export function debugAudio(message: string): void {
  if (process.env.DEBUG === 'audio' || process.env.DEBUG === '*' || process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] [NodeMicrophoneAdapter] ${message}\n`);
  }
}

/**
 * List available audio input devices.
 */
export function listInputDevices(): AudioDeviceInfo[] {
  const devices = listAudioDevices();
  return devices.filter((d) => d.isInput).map((d) => ({
    id: d.id,
    name: d.name,
    isDefault: d.isDefault,
    isInput: d.isInput,
    isOutput: d.isOutput,
    sampleRate: d.sampleRate,
    channelCount: d.channelCount,
  }));
}

/**
 * Get the default input device ID.
 */
export function getDefaultInputDeviceId(): string | null {
  return getDefaultInputDevice() ?? null;
}

/**
 * Convert Int16 PCM buffer to Float32Array and create an AudioDataEvent.
 */
export function convertPcmToAudioEvent(
  data: Buffer,
  sampleRate: number,
): { float32Array: Float32Array; int16Array: Int16Array; event: AudioDataEvent } {
  const int16Array = new Int16Array(
    data.buffer,
    data.byteOffset,
    data.length / 2,
  );

  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const sample = int16Array[i] ?? 0;
    float32Array[i] = sample / (sample < 0 ? 0x8000 : 0x7fff);
  }

  const event: AudioDataEvent = {
    type: 'audio',
    data: float32Array,
    sampleRate,
    timestamp: Date.now(),
  };

  return { float32Array, int16Array, event };
}
