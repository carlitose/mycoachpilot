/**
 * TTS (Text-to-Speech) Port
 * Interface for text-to-speech functionality used by coach suggestions
 */
import type { TTSVoice } from '@domain/settings';
import type { Result } from '@domain/shared';

/**
 * Error types for TTS operations
 */
export type TTSErrorCode =
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'PLAYBACK_ERROR';

export interface TTSError {
  code: TTSErrorCode;
  message: string;
}

/**
 * Options for speaking text
 */
export interface SpeakOptions {
  voice?: TTSVoice;
  speed?: number;
  volume?: number;
  instructions?: string;
}

/**
 * Port interface for Text-to-Speech functionality.
 * Implementations handle API calls and audio playback.
 */
export interface TTSPort {
  /**
   * Speak the given text using TTS
   * @param text The text to speak (max 4096 characters)
   * @param options Optional speaking options
   * @returns Result indicating success or error
   */
  speak(text: string, options?: SpeakOptions): Promise<Result<void, TTSError>>;

  /**
   * Stop any currently playing TTS audio
   */
  stop(): void;

  /**
   * Set whether TTS is enabled
   */
  setEnabled(enabled: boolean): void;

  /**
   * Check if TTS is enabled
   */
  isEnabled(): boolean;

  /**
   * Set the playback volume (0.0 - 1.0)
   */
  setVolume(volume: number): void;

  /**
   * Get current volume
   */
  getVolume(): number;

  /**
   * Set the default voice
   */
  setVoice(voice: TTSVoice): void;

  /**
   * Get current voice
   */
  getVoice(): TTSVoice;

  /**
   * Set the default speed (0.25 - 4.0)
   */
  setSpeed(speed: number): void;

  /**
   * Get current speed
   */
  getSpeed(): number;

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean;

  /**
   * Set the API key for TTS service
   */
  setApiKey(apiKey: string | null): void;
}
