/**
 * Audio Playback Port
 * Interface for playing audio responses from AI
 */
export interface AudioPlaybackPort {
  /**
   * Queue audio data for playback
   * @param audio PCM16 audio data (Int16Array)
   * @param sampleRate Audio sample rate (e.g., 24000 Hz)
   */
  queueAudio(audio: Int16Array, sampleRate: number): void;

  /**
   * Set playback volume
   * @param volume Volume level from 0.0 to 1.0
   */
  setVolume(volume: number): void;

  /**
   * Get current volume level
   */
  getVolume(): number;

  /**
   * Stop playback and clear the audio queue
   */
  stop(): void;

  /**
   * Clear the audio queue without stopping current playback
   */
  clearQueue(): void;

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean;

  /**
   * Enable or disable playback
   */
  setEnabled(enabled: boolean): void;

  /**
   * Check if playback is enabled
   */
  isEnabled(): boolean;
}
