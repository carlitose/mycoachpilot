import { log } from './logger';

/**
 * Result of creating an audio mixer
 */
export interface AudioMixerResult {
  /** The combined MediaStream containing both audio sources */
  mixedStream: MediaStream;
  /** The AudioContext used for mixing */
  audioContext: AudioContext;
  /** Function to clean up all resources */
  cleanup: () => void;
}

/**
 * Creates a mixed audio stream from microphone and tab audio sources.
 * Uses Web Audio API to combine multiple MediaStreams into one.
 *
 * @param microphoneStream - MediaStream from getUserMedia (microphone)
 * @param tabAudioStream - MediaStream from getDisplayMedia (tab audio)
 * @returns AudioMixerResult with the combined stream and cleanup function
 */
export async function createAudioMixer(
  microphoneStream: MediaStream,
  tabAudioStream: MediaStream
): Promise<AudioMixerResult> {
  log.info('[AudioMixer] Creating audio mixer for mic + tab audio');

  // Create AudioContext - browser will auto-select appropriate sample rate
  const audioContext = new AudioContext();

  // Create destination node that will output the mixed audio
  const destination = audioContext.createMediaStreamDestination();

  // Setup microphone source with gain control
  const micSource = audioContext.createMediaStreamSource(microphoneStream);
  const micGain = audioContext.createGain();
  micGain.gain.value = 1.0; // Full volume for microphone
  micSource.connect(micGain);
  micGain.connect(destination);

  log.info('[AudioMixer] Microphone source connected', {
    tracks: microphoneStream.getAudioTracks().length,
    sampleRate: audioContext.sampleRate
  });

  // Setup tab audio source with gain control
  const tabSource = audioContext.createMediaStreamSource(tabAudioStream);
  const tabGain = audioContext.createGain();
  tabGain.gain.value = 0.8; // Slightly lower to prioritize voice
  tabSource.connect(tabGain);
  tabGain.connect(destination);

  log.info('[AudioMixer] Tab audio source connected', {
    tracks: tabAudioStream.getAudioTracks().length
  });

  // Cleanup function to release all resources
  const cleanup = () => {
    log.info('[AudioMixer] Cleaning up audio mixer resources');

    try {
      // Disconnect all nodes
      micSource.disconnect();
      micGain.disconnect();
      tabSource.disconnect();
      tabGain.disconnect();
      destination.disconnect();

      // Close audio context
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }

      log.info('[AudioMixer] Cleanup completed');
    } catch (error) {
      log.error('[AudioMixer] Error during cleanup:', { error });
    }
  };

  log.info('[AudioMixer] Audio mixer created successfully');

  return {
    mixedStream: destination.stream,
    audioContext,
    cleanup
  };
}
