/**
 * Audio Processing Utilities
 *
 * Converts and processes audio data for Deepgram:
 * - Float32Array → Int16Array (PCM16)
 * - Resampling (e.g., 48kHz → 16kHz)
 * - Mono conversion
 */

import { log } from '@/lib/logger';

/**
 * Convert Float32Array to Int16Array (PCM16)
 * Float32: -1.0 to 1.0
 * Int16: -32768 to 32767
 */
export function convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1.0, 1.0]
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to Int16 range
    int16Array[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
  }

  return int16Array;
}

/**
 * Resample audio data
 * Uses linear interpolation
 *
 * @param audioData Source audio data
 * @param sourceSampleRate Source sample rate (e.g., 48000)
 * @param targetSampleRate Target sample rate (e.g., 16000)
 * @returns Resampled audio data
 */
export function resample(
  audioData: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return audioData;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const targetLength = Math.floor(audioData.length / ratio);
  const resampled = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const sourceIndex = i * ratio;
    const index1 = Math.floor(sourceIndex);
    const index2 = Math.min(index1 + 1, audioData.length - 1);
    const fraction = sourceIndex - index1;

    // Linear interpolation
    resampled[i] = audioData[index1] * (1 - fraction) + audioData[index2] * fraction;
  }

  return resampled;
}

/**
 * Convert stereo to mono by averaging channels
 *
 * @param left Left channel audio data
 * @param right Right channel audio data
 * @returns Mono audio data
 */
export function stereoToMono(left: Float32Array, right: Float32Array): Float32Array {
  const mono = new Float32Array(left.length);

  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }

  return mono;
}

/**
 * Audio Processor Class
 * Manages AudioContext and audio processing pipeline
 */
export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private audioStream: MediaStream | null = null;

  constructor(
    private targetSampleRate: number = 16000,
    private targetChannels: number = 1
  ) {}

  /**
   * Initialize audio processing for a MediaStream
   *
   * @param stream MediaStream from getDisplayMedia
   * @param onAudioData Callback for processed audio chunks
   */
  async initialize(
    stream: MediaStream,
    onAudioData: (audioData: Int16Array) => void
  ): Promise<void> {
    this.audioStream = stream;

    // Create AudioContext (will use browser's default sample rate)
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sourceSampleRate = this.audioContext.sampleRate;

    log.info(`[AudioProcessor] Initialized - Source: ${sourceSampleRate}Hz, Target: ${this.targetSampleRate}Hz`);

    // Create source node from stream
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);

    // Create processor node (4096 buffer size = ~256ms @ 16kHz)
    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, this.targetChannels, this.targetChannels);

    this.processorNode.onaudioprocess = (event) => {
      try {
        let audioData = event.inputBuffer.getChannelData(0);

        // Resample if needed
        if (sourceSampleRate !== this.targetSampleRate) {
          audioData = resample(audioData, sourceSampleRate, this.targetSampleRate);
        }

        // Convert to Int16Array
        const int16Data = convertFloat32ToInt16(audioData);

        // Send to callback
        onAudioData(int16Data);
      } catch (err) {
        log.error('[AudioProcessor] Error processing audio', err);
      }
    };

    // Connect nodes
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    log.info('[AudioProcessor] Audio pipeline connected');
  }

  /**
   * Stop audio processing and cleanup
   */
  stop(): void {
    log.info('[AudioProcessor] Stopping audio processing');

    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }

  /**
   * Check if audio is being processed
   */
  isActive(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  /**
   * Get current sample rate
   */
  getCurrentSampleRate(): number | null {
    return this.audioContext?.sampleRate || null;
  }
}

/**
 * Validate audio stream has audio tracks
 *
 * @param stream MediaStream to validate
 * @throws Error if no audio tracks found
 */
export function validateAudioStream(stream: MediaStream): void {
  const audioTracks = stream.getAudioTracks();

  if (audioTracks.length === 0) {
    throw new Error('NO_AUDIO_TRACK: No audio track found in stream. Make sure "Share audio" is enabled.');
  }

  log.info(`[AudioProcessor] Audio track validated - ${audioTracks.length} track(s) found`);
}

/**
 * Setup audio track ended listener
 *
 * @param stream MediaStream to monitor
 * @param onEnded Callback when audio track ends
 */
export function setupAudioTrackEndedListener(stream: MediaStream, onEnded: () => void): void {
  const audioTrack = stream.getAudioTracks()[0];

  if (audioTrack) {
    audioTrack.onended = () => {
      log.warn('[AudioProcessor] Audio track ended');
      onEnded();
    };
  }
}
