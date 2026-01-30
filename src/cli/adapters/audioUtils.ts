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
 * Find audio input devices by name (case-insensitive partial match).
 */
export function findDevicesByName(searchTerm: string): AudioDeviceInfo[] {
  const devices = listInputDevices();
  const lowerSearch = searchTerm.toLowerCase();
  return devices.filter((d) => d.name.toLowerCase().includes(lowerSearch));
}

/**
 * Find a single audio input device by exact or partial name match.
 * Returns the first match found.
 */
export function findDeviceByName(searchTerm: string): AudioDeviceInfo | null {
  const matches = findDevicesByName(searchTerm);
  return matches.length > 0 ? matches[0] ?? null : null;
}

/**
 * Detect BlackHole virtual audio devices.
 * BlackHole is a virtual audio driver that allows capturing system audio
 * without requiring TCC permissions (Screen & System Audio Recording).
 */
export function detectBlackHoleDevices(): AudioDeviceInfo[] {
  return findDevicesByName('BlackHole');
}

/**
 * Check if BlackHole is installed and available.
 */
export function isBlackHoleAvailable(): boolean {
  return detectBlackHoleDevices().length > 0;
}

/**
 * Get BlackHole installation instructions for macOS.
 */
export function getBlackHoleInstructions(): string {
  return `
⚠️  System audio capture requires additional setup on macOS.

Recommended solution: Install BlackHole virtual audio driver

1. Install BlackHole:
   brew install blackhole-2ch

2. Configure Multi-Output Device:
   a. Open "Audio MIDI Setup" (search in Spotlight)
   b. Click "+" at bottom-left → "Create Multi-Output Device"
   c. Check both your speakers AND "BlackHole 2ch"
   d. Set "Master Device" to your speakers

3. Set System Output:
   System Settings → Sound → Output → Select "Multi-Output Device"

4. Run with dual input (mic + system audio):
   npm run cli -- session start --audio-source mixed --system-device "BlackHole 2ch"

   Or for system audio only:
   npm run cli -- session start --input-device "BlackHole 2ch"

This routes system audio through BlackHole while you still hear it normally.
Dual input captures your microphone (tagged as "You") and system audio separately.
No TCC permissions required!
`.trim();
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

  const float32Array = int16ToFloat32(int16Array);

  const event: AudioDataEvent = {
    type: 'audio',
    data: float32Array,
    sampleRate,
    timestamp: Date.now(),
  };

  return { float32Array, int16Array, event };
}

/**
 * Convert Int16Array to Float32Array.
 * Used for audio format conversion between PCM formats.
 */
export function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    const sample = int16[i] ?? 0;
    // Normalize to [-1, 1] range
    float32[i] = sample / (sample < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}
