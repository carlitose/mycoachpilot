import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as dotenvConfig } from 'dotenv';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';

import type { TranscriptionEvent, TranscriptSegmentEvent } from '../../../application/ports/TranscriptionPort';
import { NodeDeepgramAdapter } from '../../adapters/NodeDeepgramAdapter';

// Load environment variables from .env
dotenvConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_WAV_PATH = resolve(__dirname, 'fixtures/test-speech.wav');

// Get API key from environment
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ?? '';
const hasApiKey = DEEPGRAM_API_KEY.length > 0 && !DEEPGRAM_API_KEY.startsWith('your-');

describe('Deepgram Real API Integration', () => {
  let adapter: NodeDeepgramAdapter | null = null;

  beforeAll(() => {
    if (!hasApiKey) {
      // eslint-disable-next-line no-console
      console.log('Skipping Deepgram real API tests - DEEPGRAM_API_KEY not configured');
      // eslint-disable-next-line no-console
      console.log('   To run these tests, create a .env file with your Deepgram API key');
    }
  });

  afterEach(() => {
    if (adapter !== null) {
      adapter.disconnect();
      adapter = null;
    }
  });

  it.skipIf(!hasApiKey)('should connect to Deepgram API successfully', async () => {
    adapter = new NodeDeepgramAdapter();

    const result = await adapter.connect({
      apiKey: DEEPGRAM_API_KEY,
      sampleRate: 16000,
      punctuate: true,
      diarize: true,
      interimResults: true,
    });

    expect(result.isOk()).toBe(true);
    expect(adapter.getState()).toBe('connected');
  });

  it.skipIf(!hasApiKey)('should transcribe audio file and receive segments', async () => {
    adapter = new NodeDeepgramAdapter();
    const segments: TranscriptSegmentEvent[] = [];
    const events: TranscriptionEvent[] = [];

    // Subscribe to events
    adapter.onEvent((event) => {
      events.push(event);
      if (event.type === 'segment') {
        segments.push(event);
      }
    });

    // Connect to Deepgram
    const connectResult = await adapter.connect({
      apiKey: DEEPGRAM_API_KEY,
      sampleRate: 16000,
      punctuate: true,
      diarize: true,
      interimResults: true,
    });

    expect(connectResult.isOk()).toBe(true);

    // Load and send audio file
    const audioBuffer = readFileSync(TEST_WAV_PATH);
    // Skip WAV header (44 bytes) and get PCM data
    const pcm16 = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset + 44);

    // Send audio in chunks (simulate real-time streaming)
    const chunkSize = 4800; // 300ms at 16kHz
    for (let i = 0; i < pcm16.length; i += chunkSize) {
      const chunk = pcm16.slice(i, i + chunkSize);
      adapter.sendAudio(chunk);
      // Small delay to simulate real-time
      await new Promise((r) => { setTimeout(r, 50); });
    }

    // Wait for Deepgram to process and return results
    await new Promise((r) => { setTimeout(r, 3000); });

    // Disconnect
    adapter.disconnect();

    // Verify we received transcript segments
    expect(segments.length).toBeGreaterThan(0);

    // Check that at least one segment contains expected words from our test audio
    // The test audio says: "Hello, this is a test of the speech recognition system. The quick brown fox jumps over the lazy dog."
    const allText = segments.map((s) => s.text.toLowerCase()).join(' ');

    // At minimum, we should see some of these words
    const expectedWords = ['hello', 'test', 'speech', 'recognition', 'quick', 'brown', 'fox', 'lazy', 'dog'];
    const foundWords = expectedWords.filter((word) => allText.includes(word));

    // We expect to find at least 3 of the expected words
    expect(foundWords.length).toBeGreaterThanOrEqual(3);

    // Verify segment structure
    const firstFinalSegment = segments.find((s) => s.isFinal);
    if (firstFinalSegment) {
      expect(firstFinalSegment.speakerId).toBeDefined();
      expect(firstFinalSegment.startMs).toBeGreaterThanOrEqual(0);
      expect(firstFinalSegment.endMs).toBeGreaterThan(firstFinalSegment.startMs);
      expect(firstFinalSegment.confidence).toBeGreaterThan(0);
    }
  }, 30000); // 30 second timeout for real API call

  it.skipIf(!hasApiKey)('should emit state change events', async () => {
    adapter = new NodeDeepgramAdapter();
    const stateEvents: string[] = [];

    adapter.onEvent((event) => {
      if (event.type === 'state') {
        stateEvents.push(event.state);
      }
    });

    // Connect
    await adapter.connect({
      apiKey: DEEPGRAM_API_KEY,
      sampleRate: 16000,
    });

    // Disconnect
    adapter.disconnect();

    // Wait for events to be processed
    await new Promise((r) => { setTimeout(r, 500); });

    // Should have seen: connecting -> connected -> disconnected
    expect(stateEvents).toContain('connecting');
    expect(stateEvents).toContain('connected');
    expect(stateEvents).toContain('disconnected');
  });

  it.skipIf(!hasApiKey)('should handle invalid API key gracefully', async () => {
    adapter = new NodeDeepgramAdapter();

    const result = await adapter.connect({
      apiKey: 'invalid-api-key-12345',
      sampleRate: 16000,
    });

    // Deepgram may either return an error or disconnect immediately
    // Both behaviors indicate the invalid key was rejected
    const state = adapter.getState();
    const isRejected = result.isErr() || state === 'disconnected' || state === 'error';
    expect(isRejected).toBe(true);
  }, 10000);
});
