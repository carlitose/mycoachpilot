/**
 * Portable PCM↔base64 codec (RFC-1).
 *
 * Works in both browser and Node.js 18+.  btoa/atob became part of the Web
 * Platform Standard and were added to Node.js globals in v16 (unflagged in
 * v18).  The project already requires Node ≥ 18, so both globals are always
 * available without any polyfill or import.
 *
 * The byte-loop via Uint8Array preserves the byteOffset of subarray slices,
 * matching both the browser adapter and Node adapter semantics from before
 * RFC-1 (the browser adapter used a Uint8Array loop; this is the same).
 */

/**
 * Encode an Int16Array of PCM samples to a base64 string.
 *
 * Handles subarray views correctly: byteOffset is taken into account so that
 * a sliced Int16Array (non-zero byteOffset) encodes only its own bytes, not
 * the entire underlying buffer.
 */
export function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * Decode a base64 string back to an Int16Array of PCM samples.
 *
 * Mirror of int16ToBase64.  The returned array owns its buffer (byteOffset = 0).
 */
export function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const uint8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    uint8[i] = binary.charCodeAt(i);
  }
  return new Int16Array(uint8.buffer);
}
