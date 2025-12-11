import { useState, useCallback } from 'react';

interface UseTabAudioCaptureResult {
  isCapturing: boolean;
  startTabCapture: () => Promise<MediaStream | null>;
  stopTabCapture: () => void;
  error: string | null;
}

export function useTabAudioCapture(): UseTabAudioCaptureResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTabCapture = useCallback(async () => {
    try {
      setError(null);
      
      // Request screen/tab capture with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        // @ts-ignore - systemAudio is a newer property
        systemAudio: "exclude" // On macOS, only tab audio, not system
      });

      // Check if audio track was included
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        setError("No audio track captured. Make sure to check 'Share tab audio' in the dialog.");
      }

      setCurrentStream(stream);
      setIsCapturing(true);

      // Listen for track ended (user stopped sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopTabCapture();
      });

      return stream;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permission denied. Please allow tab sharing with audio.');
        } else {
          setError(`Error capturing tab: ${err.message}`);
        }
      }
      setIsCapturing(false);
      return null;
    }
  }, []);

  const stopTabCapture = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
    setIsCapturing(false);
  }, [currentStream]);

  return {
    isCapturing,
    startTabCapture,
    stopTabCapture,
    error
  };
}