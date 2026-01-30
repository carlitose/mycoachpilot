/* eslint-disable @typescript-eslint/no-deprecated */
// ScriptProcessorNode is deprecated but AudioWorklet requires more complex setup
// TODO: Migrate to AudioWorklet when time permits
import type { AudioConfigProps } from '@domain/session';
import { ok, err, type Result } from '@domain/shared';

import type {
  AudioCapturePort,
  AudioCaptureState,
  AudioEvent,
  AudioEventHandler,
} from '@application/ports';

/**
 * Audio Capture Adapter
 * Handles microphone and tab audio capture using Web Audio API
 */
export class AudioCaptureAdapter implements AudioCapturePort {
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private tabStream: MediaStream | null = null;
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private _tabProcessor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private mixedSource: GainNode | null = null;
  private eventHandlers: Set<AudioEventHandler> = new Set();
  private isPaused = false;
  private lastPCM16: Int16Array | null = null;

  private state: AudioCaptureState = {
    isCapturing: false,
    source: null,
    sampleRate: 24000,
    channelCount: 1,
    error: null,
  };

  getState(): AudioCaptureState {
    return { ...this.state };
  }

  async startMicrophone(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    try {
      const sampleRate = config?.sampleRate ?? 24000;

      // Request microphone access
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate,
          channelCount: 1,
        },
      });

      this.setupAudioProcessing(this.micStream, sampleRate);

      this.state = {
        isCapturing: true,
        source: 'microphone',
        sampleRate,
        channelCount: 1,
        error: null,
      };

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to access microphone';
      this.state.error = message;
      return err(new Error(message));
    }
  }

  async startTabAudio(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    try {
      const sampleRate = config?.sampleRate ?? 24000;

      // Request tab audio capture
      // Chrome requires video: true for getDisplayMedia - we stop the video track immediately
      this.tabStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });

      // Stop video track immediately - we only need audio
      this.tabStream.getVideoTracks().forEach((t) => { t.stop(); });

      // Check if audio track exists
      const audioTracks = this.tabStream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.tabStream.getTracks().forEach((t) => { t.stop(); });
        this.tabStream = null;
        return err(new Error('No audio track in tab capture. Make sure to share a tab with audio.'));
      }

      this.setupAudioProcessing(this.tabStream, sampleRate);

      this.state = {
        isCapturing: true,
        source: 'tab',
        sampleRate,
        channelCount: 1,
        error: null,
      };

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to capture tab audio';
      this.state.error = message;
      return err(new Error(message));
    }
  }

  async startMixed(config?: Partial<AudioConfigProps>): Promise<Result<void, Error>> {
    try {
      const sampleRate = config?.sampleRate ?? 24000;

      // Start microphone first
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate,
          channelCount: 1,
        },
      });

      // Then request tab audio
      // Chrome requires video: true for getDisplayMedia - we stop the video track immediately
      this.tabStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });

      // Stop video track immediately - we only need audio
      this.tabStream.getVideoTracks().forEach((t) => { t.stop(); });

      // Check if tab has audio
      const audioTracks = this.tabStream.getAudioTracks();
      if (audioTracks.length === 0) {
        // Fall back to mic only
        this.tabStream.getTracks().forEach((t) => { t.stop(); });
        this.tabStream = null;
        this.setupAudioProcessing(this.micStream, sampleRate);
        this.state = {
          isCapturing: true,
          source: 'microphone',
          sampleRate,
          channelCount: 1,
          error: null,
        };
        return ok(undefined);
      }

      // Mix both streams
      this.setupMixedAudioProcessing(sampleRate);

      this.state = {
        isCapturing: true,
        source: 'mixed',
        sampleRate,
        channelCount: 1,
        error: null,
      };

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start mixed audio';
      this.state.error = message;
      return err(new Error(message));
    }
  }

  stop(): void {
    // Stop all tracks
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => { track.stop(); });
      this.micStream = null;
    }

    if (this.tabStream) {
      this.tabStream.getTracks().forEach((track) => { track.stop(); });
      this.tabStream = null;
    }

    // Disconnect audio nodes
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this._tabProcessor) {
      this._tabProcessor.disconnect();
      this._tabProcessor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.mixedSource) {
      this.mixedSource.disconnect();
      this.mixedSource = null;
    }

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    this.state = {
      isCapturing: false,
      source: null,
      sampleRate: 24000,
      channelCount: 1,
      error: null,
    };
    this.isPaused = false;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  onAudioEvent(handler: AudioEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  getPCM16Data(): Int16Array | null {
    return this.lastPCM16;
  }

  private setupAudioProcessing(stream: MediaStream, sampleRate: number): void {
    this.audioContext = new AudioContext({ sampleRate });
    this.source = this.audioContext.createMediaStreamSource(stream);

    // Use ScriptProcessorNode (deprecated but widely supported)
    // TODO: Migrate to AudioWorklet for better performance
    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.processor.onaudioprocess = (event) => {
      if (this.isPaused) return;

      const inputData = event.inputBuffer.getChannelData(0);

      // Calculate audio level
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += (inputData[i] ?? 0) * (inputData[i] ?? 0);
      }
      const level = Math.sqrt(sum / inputData.length);

      // Emit level event
      this.emitEvent({
        type: 'level',
        level: Math.min(1, level * 3), // Amplify for visibility
        timestamp: Date.now(),
      });

      // Emit audio data
      this.emitEvent({
        type: 'audio',
        data: new Float32Array(inputData),
        sampleRate: this.audioContext?.sampleRate ?? sampleRate,
        timestamp: Date.now(),
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  /**
   * Setup mixed audio processing with SEPARATE channels for mic and tab.
   * Each channel emits its own audio events with channel identifier.
   */
  private setupMixedAudioProcessing(sampleRate: number): void {
    if (!this.micStream || !this.tabStream) return;

    this.audioContext = new AudioContext({ sampleRate });
    const bufferSize = 4096;

    // Mic processor - emits with channel: 'microphone'
    const micSource = this.audioContext.createMediaStreamSource(this.micStream);
    const micProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    micProcessor.onaudioprocess = (event) => {
      if (this.isPaused) return;
      const inputData = event.inputBuffer.getChannelData(0);
      this.emitLevelEvent(inputData);
      this.emitEvent({
        type: 'audio',
        data: new Float32Array(inputData),
        sampleRate: this.audioContext?.sampleRate ?? sampleRate,
        timestamp: Date.now(),
        channel: 'microphone',
      });
    };
    micSource.connect(micProcessor);
    micProcessor.connect(this.audioContext.destination);

    // Tab processor - emits with channel: 'system'
    const tabSource = this.audioContext.createMediaStreamSource(this.tabStream);
    const tabProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    tabProcessor.onaudioprocess = (event) => {
      if (this.isPaused) return;
      const inputData = event.inputBuffer.getChannelData(0);
      this.emitEvent({
        type: 'audio',
        data: new Float32Array(inputData),
        sampleRate: this.audioContext?.sampleRate ?? sampleRate,
        timestamp: Date.now(),
        channel: 'system',
      });
    };
    tabSource.connect(tabProcessor);
    tabProcessor.connect(this.audioContext.destination);

    this.processor = micProcessor;
    this._tabProcessor = tabProcessor;
  }

  /**
   * Calculate and emit audio level from input data
   */
  private emitLevelEvent(inputData: Float32Array): void {
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      sum += (inputData[i] ?? 0) * (inputData[i] ?? 0);
    }
    const level = Math.sqrt(sum / inputData.length);
    this.emitEvent({
      type: 'level',
      level: Math.min(1, level * 3),
      timestamp: Date.now(),
    });
  }

  private emitEvent(event: AudioEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    });
  }
}
