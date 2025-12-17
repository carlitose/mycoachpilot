import { useState, useEffect, useCallback, useRef } from 'react';

// Type declarations for Document Picture-in-Picture API (Chrome 116+)
declare global {
  interface DocumentPictureInPictureOptions {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
  }

  interface DocumentPictureInPicture extends EventTarget {
    requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
    readonly window: Window | null;
  }

  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

interface UsePictureInPictureOptions {
  width?: number;
  height?: number;
}

interface UsePictureInPictureReturn {
  isPiPSupported: boolean;
  isPiPOpen: boolean;
  pipWindow: Window | null;
  openPiP: () => Promise<boolean>;
  closePiP: () => void;
}

/**
 * Custom hook to manage Document Picture-in-Picture API
 * Only supported in Chrome 116+
 */
export function usePictureInPicture(
  options: UsePictureInPictureOptions = {}
): UsePictureInPictureReturn {
  const { width = 400, height = 500 } = options;

  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPOpen, setIsPiPOpen] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  // Check for browser support on mount
  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      'documentPictureInPicture' in window;
    setIsPiPSupported(supported);
  }, []);

  // Copy styles from main document to PiP window
  const copyStylesToWindow = useCallback((targetWindow: Window) => {
    // Copy all <link rel="stylesheet"> elements
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const newLink = targetWindow.document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = (link as HTMLLinkElement).href;
      targetWindow.document.head.appendChild(newLink);
    });

    // Copy all <style> tags (important for Tailwind JIT styles)
    document.querySelectorAll('style').forEach((style) => {
      const newStyle = targetWindow.document.createElement('style');
      newStyle.textContent = style.textContent;
      targetWindow.document.head.appendChild(newStyle);
    });

    // Add base styles for the PiP window
    const baseStyle = targetWindow.document.createElement('style');
    baseStyle.textContent = `
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
        background-color: rgb(2, 6, 23);
        color: rgb(248, 250, 252);
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      #pip-root {
        height: 100%;
        overflow: hidden;
      }
    `;
    targetWindow.document.head.appendChild(baseStyle);
  }, []);

  // Open PiP window
  const openPiP = useCallback(async (): Promise<boolean> => {
    if (!isPiPSupported || !window.documentPictureInPicture) {
      return false;
    }

    try {
      const newPipWindow = await window.documentPictureInPicture.requestWindow({
        width,
        height,
        disallowReturnToOpener: false,
      });

      // Copy styles to the new window
      copyStylesToWindow(newPipWindow);

      // Create root container for React portal
      const container = newPipWindow.document.createElement('div');
      container.id = 'pip-root';
      newPipWindow.document.body.appendChild(container);

      // Handle window close
      newPipWindow.addEventListener('pagehide', () => {
        setIsPiPOpen(false);
        setPipWindow(null);
        pipWindowRef.current = null;
      });

      pipWindowRef.current = newPipWindow;
      setPipWindow(newPipWindow);
      setIsPiPOpen(true);

      return true;
    } catch (error) {
      // User cancelled or error occurred
      return false;
    }
  }, [isPiPSupported, width, height, copyStylesToWindow]);

  // Close PiP window
  const closePiP = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
    setIsPiPOpen(false);
    setPipWindow(null);
    pipWindowRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  return {
    isPiPSupported,
    isPiPOpen,
    pipWindow,
    openPiP,
    closePiP,
  };
}
