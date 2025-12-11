// Screen capture utilities
import { log } from '@/lib/logger';

export interface ScreenInfo {
  id: string;
  name: string;
  thumbnail?: string;
}

export async function getAvailableScreens(): Promise<ScreenInfo[]> {
  // This would typically enumerate available screens
  // For now, return a default screen
  return [
    {
      id: 'screen:0:0',
      name: 'Main Screen'
    }
  ];
}

export async function captureScreenshot(): Promise<Blob> {
  try {
    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile, use file input to capture from camera
      return new Promise<Blob>((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use rear camera on mobile
        
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            resolve(file);
          } else {
            reject(new Error('No file selected'));
          }
        };
        
        input.oncancel = () => {
          reject(new Error('Capture cancelled'));
        };
        
        // Trigger file picker
        input.click();
      });
    } else {
      // Desktop: use existing screen capture
      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor'
        }
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Failed to capture')),
          'image/png'
        );
      });
    }
  } catch (error) {
    log.error('Screen capture error:', error);
    throw error;
  }
}