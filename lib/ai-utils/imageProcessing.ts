// Shared utilities for image processing
import { log } from '@/lib/logger';

/**
 * Convert a File or Blob to base64 data URL
 */
export async function convertToBase64(data: Blob | File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(data);
  });
}

/**
 * Store image data in window object for Realtime API tool access
 */
function storeImageForTool(base64Data: string, type: 'screenshot' | 'file'): void {
  const key = type === 'screenshot' ? '__pendingScreenshot' : '__pendingFile';
  (window as any)[key] = base64Data;
  log.info(`[ImageProcessing] Stored in window.${key}`);
}

/**
 * Process image for Realtime API
 */
export async function processImageForRealtime(
  data: Blob | File,
  type: 'screenshot' | 'file',
  sendTextMessage: (text: string) => Promise<void>,
  fileName?: string
): Promise<void> {
  // Convert to base64
  const base64Data = await convertToBase64(data);
  
  // Log info
  log.info(`[ImageProcessing] Data URL format:`, {
    type,
    fileName: fileName || 'screenshot',
    size: data instanceof File ? data.size : (data as Blob).size,
    preview: base64Data.substring(0, 30) + '...'
  });
  
  // Store for tool access
  storeImageForTool(base64Data, type);
  
  // Send message to trigger the tool
  const messageType = type === 'screenshot' ? 'screenshot' : `file "${fileName || 'file'}"`;
  await sendTextMessage(`Please use the analyze_image tool to analyze the ${messageType} I just ${type === 'screenshot' ? 'captured' : 'uploaded'}.`);
}