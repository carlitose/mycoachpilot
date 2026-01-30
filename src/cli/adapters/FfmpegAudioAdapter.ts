import { spawn, ChildProcess } from 'child_process';

import { debugAudio as debug } from './audioUtils';

export type FfmpegAudioHandler = (data: Int16Array) => void;

/**
 * Audio capture adapter using FFmpeg for virtual audio devices like BlackHole.
 *
 * coreaudio-node has issues with virtual audio devices on macOS.
 * FFmpeg is battle-tested and handles sample rates correctly.
 *
 * Outputs PCM 24kHz mono s16le directly - no resampling needed for OpenAI.
 */
export class FfmpegAudioAdapter {
  private process: ChildProcess | null = null;
  private handlers = new Set<FfmpegAudioHandler>();
  private isRunning = false;

  /**
   * Check if FFmpeg is installed and available.
   */
  static async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('ffmpeg', ['-version'], { stdio: ['ignore', 'ignore', 'ignore'] });
      proc.on('error', () => {
        resolve(false);
      });
      proc.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  /**
   * List available audio input devices using FFmpeg.
   * Returns device names that can be used with start().
   */
  static async listDevices(): Promise<string[]> {
    return new Promise((resolve) => {
      const devices: string[] = [];
      const proc = spawn('ffmpeg', [
        '-f', 'avfoundation',
        '-list_devices', 'true',
        '-i', '',
      ], { stdio: ['ignore', 'pipe', 'pipe'] });

      let output = '';
      proc.stderr.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });

      proc.on('close', () => {
        // Parse device list from FFmpeg output
        // Format: [AVFoundation indev @ ...] [0] Device Name
        const audioDeviceSection = output.includes('AVFoundation audio devices:');
        if (audioDeviceSection) {
          const lines = output.split('\n');
          let inAudioSection = false;
          for (const line of lines) {
            if (line.includes('AVFoundation audio devices:')) {
              inAudioSection = true;
              continue;
            }
            if (inAudioSection && line.includes('[AVFoundation')) {
              const match = line.match(/\[\d+\]\s+(.+)$/);
              if (match?.[1]) {
                devices.push(match[1].trim());
              }
            }
          }
        }
        resolve(devices);
      });

      proc.on('error', () => {
        resolve([]);
      });
    });
  }

  /**
   * Start capturing audio from the specified device.
   *
   * @param deviceName - The name of the audio device (e.g., "BlackHole 2ch")
   */
  async start(deviceName: string): Promise<void> {
    if (this.isRunning) {
      debug('FfmpegAudioAdapter already running');
      return;
    }

    // Check if FFmpeg is available
    const available = await FfmpegAudioAdapter.isAvailable();
    if (!available) {
      throw new Error('FFmpeg is not installed. Install with: brew install ffmpeg');
    }

    debug(`Starting FFmpeg capture from device: ${deviceName}`);

    // Spawn FFmpeg process
    // -f avfoundation: Use AVFoundation input (macOS)
    // -i ":DeviceName": Audio device only (colon prefix means audio-only)
    // -ar 24000: Output sample rate (OpenAI Realtime API requirement)
    // -ac 1: Mono
    // -acodec pcm_s16le: 16-bit signed little-endian PCM
    // -f s16le: Raw PCM output format
    // pipe:1: Output to stdout
    this.process = spawn('ffmpeg', [
      '-f', 'avfoundation',
      '-i', `:${deviceName}`,
      '-ar', '24000',
      '-ac', '1',
      '-acodec', 'pcm_s16le',
      '-f', 's16le',
      'pipe:1',
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.isRunning = true;
    let startupFailed = false;

    // Handle audio data from stdout
    this.process.stdout?.on('data', (chunk: Buffer) => {
      // Convert Buffer to Int16Array
      // Buffer may not be aligned to 2 bytes, so we need to handle this carefully
      const alignedLength = Math.floor(chunk.length / 2) * 2;
      if (alignedLength === 0) return;

      const int16 = new Int16Array(alignedLength / 2);
      for (let i = 0; i < int16.length; i++) {
        // Read as little-endian signed 16-bit
        int16[i] = chunk.readInt16LE(i * 2);
      }

      // Emit to all handlers
      for (const handler of this.handlers) {
        try {
          handler(int16);
        } catch {
          // Ignore handler errors
        }
      }
    });

    // Log stderr for debugging (FFmpeg outputs info/warnings here)
    this.process.stderr?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      // Only log actual errors, not the startup info
      if (msg.includes('Error') || msg.includes('error') || msg.includes('Invalid')) {
        debug(`FFmpeg stderr: ${msg}`);
      }
    });

    this.process.on('error', (error) => {
      debug(`FFmpeg process error: ${error.message}`);
      this.isRunning = false;
      startupFailed = true;
    });

    this.process.on('close', (code) => {
      debug(`FFmpeg process exited with code: ${String(code)}`);
      this.isRunning = false;
      startupFailed = true;
    });

    // Wait a bit for FFmpeg to start and check if it's still running
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if startup failed (event callbacks may have fired during await)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (startupFailed || !this.isRunning) {
      throw new Error('FFmpeg failed to start');
    }

    debug('FFmpeg capture started successfully');
  }

  /**
   * Register a handler for audio data.
   *
   * @param handler - Function called with Int16Array audio samples (24kHz mono)
   * @returns Unsubscribe function
   */
  onAudio(handler: FfmpegAudioHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Stop capturing audio.
   */
  stop(): void {
    if (this.process) {
      debug('Stopping FFmpeg capture');
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.isRunning = false;
    this.handlers.clear();
  }

  /**
   * Check if the adapter is currently capturing.
   */
  get capturing(): boolean {
    return this.isRunning;
  }
}
