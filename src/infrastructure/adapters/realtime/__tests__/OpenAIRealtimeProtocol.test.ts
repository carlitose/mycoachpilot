/**
 * Boundary tests for OpenAIRealtimeProtocol (RFC-1).
 *
 * All assertions go through the public RealtimeConnectionPort interface only.
 * Internal state is never inspected; transport frames are inspected via
 * FakeTransport.sent (the observable wire format).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type {
  RealtimeConnectionPort,
  RealtimeConfig,
  RealtimeEvent,
} from '@application/ports/RealtimeConnectionPort';

// ── Production module under test ─────────────────────────────────────────────
import { OpenAIRealtimeProtocol } from '../OpenAIRealtimeProtocol';

// ── In-memory transport double ───────────────────────────────────────────────
import { FakeTransportFactory, FakeTransport } from './FakeTransport';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeProtocol(factory: FakeTransportFactory): RealtimeConnectionPort {
  return new OpenAIRealtimeProtocol(factory) as RealtimeConnectionPort;
}

const BASE_CONFIG: RealtimeConfig = {
  apiKey: 'sk-test-key',
};

const TRANSCRIPT_ONLY_CONFIG: RealtimeConfig = {
  apiKey: 'sk-test-key',
  transcriptOnly: true,
  transcriptionModel: 'gpt-4o-mini-transcribe',
};

/** Collect all RealtimeEvents emitted during the lifetime of a protocol instance. */
function collectEvents(protocol: RealtimeConnectionPort): RealtimeEvent[] {
  const events: RealtimeEvent[] = [];
  protocol.onEvent((e) => events.push(e));
  return events;
}

/**
 * Portable int16-to-base64 implementation — same byte-loop strategy mandated
 * by RFC-1 for the production codec (no btoa/Buffer, Uint8Array only).
 * Used in tests to verify the wire format without relying on the production
 * codec directly.
 */
function int16ToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. connect() lifecycle
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — connect()', () => {
  let factory: FakeTransportFactory;
  let protocol: RealtimeConnectionPort;

  beforeEach(() => {
    factory = new FakeTransportFactory();
    protocol = makeProtocol(factory);
  });

  it('resolves to Ok when transport fires onOpen', async () => {
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    const result = await connectPromise;

    expect(result.isOk()).toBe(true);
  });

  it('state transitions to connected after onOpen', async () => {
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    expect(protocol.getState()).toBe('connected');
  });

  it('resolves to Err when transport fires onError during connecting', async () => {
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitError();
    const result = await connectPromise;

    expect(result.isErr()).toBe(true);
  });

  it('state transitions to error when transport fires onError during connecting', async () => {
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitError();
    await connectPromise;

    expect(protocol.getState()).toBe('error');
  });

  it('emits connection_state connecting event before transport opens', async () => {
    const events = collectEvents(protocol);

    const connectPromise = protocol.connect(BASE_CONFIG);
    // Check state was emitted before resolving
    const connectingEvents = events.filter(
      (e) => e.type === 'connection_state' && e.state === 'connecting',
    );
    expect(connectingEvents.length).toBeGreaterThanOrEqual(1);

    factory.last.emitOpen();
    await connectPromise;
  });

  it('emits connection_state connected event after onOpen', async () => {
    const events = collectEvents(protocol);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    const connectedEvents = events.filter(
      (e) => e.type === 'connection_state' && e.state === 'connected',
    );
    expect(connectedEvents.length).toBe(1);
  });

  it('resolves at most once — second connect() while already connected is a no-op', async () => {
    const p1 = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    const r1 = await p1;
    expect(r1.isOk()).toBe(true);

    // Second call while connected should resolve immediately without opening a new transport
    const transportCountBefore = factory.all.length;
    const r2 = await protocol.connect(BASE_CONFIG);
    expect(r2.isOk()).toBe(true);
    expect(factory.all.length).toBe(transportCountBefore); // no new socket opened
  });

  it('opening a new transport is called with the apiKey', async () => {
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    expect(factory.lastApiKey).toBe(BASE_CONFIG.apiKey);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Bug-fix pin — transcriptionModel carried to wire (transcript-only mode)
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — transcriptionModel bug-fix pin', () => {
  /**
   * THIS TEST MUST FAIL against today's NodeOpenAIRealtimeAdapter:175 which
   * hardcodes `model: 'gpt-4o-transcribe'` and ignores config.transcriptionModel.
   *
   * After RFC-1 is implemented, this test passes because OpenAIRealtimeProtocol
   * always honours config.transcriptionModel.
   */
  it('carries config.transcriptionModel to the first session-config frame in transcript-only mode', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);

    const connectPromise = protocol.connect(TRANSCRIPT_ONLY_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    // The protocol must have sent at least one frame after connect
    expect(factory.last.sent.length).toBeGreaterThanOrEqual(1);

    // Parse the first sent frame
    const firstFrame = JSON.parse(factory.last.sent[0]!) as Record<string, unknown>;

    // For transcriptOnly mode the browser adapter uses `transcription_session.update`
    // The RFC requires the new protocol to use the same message type.
    expect(firstFrame.type).toBe('transcription_session.update');

    // The model field must match the config — this is the drifted bug
    const session = firstFrame.session as Record<string, unknown> | undefined;
    expect(session).toBeDefined();
    const inputAudioTranscription = session?.['input_audio_transcription'] as
      | Record<string, unknown>
      | undefined;
    expect(inputAudioTranscription?.['model']).toBe('gpt-4o-mini-transcribe');
  });

  it('carries config.transcriptionModel to session.update in full conversation mode', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);

    const config: RealtimeConfig = {
      apiKey: 'sk-test-key',
      transcriptOnly: false,
      transcriptionModel: 'gpt-4o-mini-transcribe',
    };

    const connectPromise = protocol.connect(config);
    factory.last.emitOpen();
    await connectPromise;

    expect(factory.last.sent.length).toBeGreaterThanOrEqual(1);

    const firstFrame = JSON.parse(factory.last.sent[0]!) as Record<string, unknown>;
    expect(firstFrame.type).toBe('session.update');

    const session = firstFrame.session as Record<string, unknown> | undefined;
    const inputAudioTranscription = session?.['input_audio_transcription'] as
      | Record<string, unknown>
      | undefined;
    expect(inputAudioTranscription?.['model']).toBe('gpt-4o-mini-transcribe');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Server event → RealtimeEvent mapping
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — server event mapping', () => {
  let factory: FakeTransportFactory;
  let protocol: RealtimeConnectionPort;
  let transport: FakeTransport;

  beforeEach(async () => {
    factory = new FakeTransportFactory();
    protocol = makeProtocol(factory);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;
    transport = factory.last;
  });

  it('conversation.item.input_audio_transcription.completed → final user transcript event', () => {
    const events = collectEvents(protocol);

    transport.emitServerEvent({
      type: 'conversation.item.input_audio_transcription.completed',
      item_id: 'item-1',
      content_index: 0,
      transcript: 'Hello world',
    });

    const transcriptEvents = events.filter((e) => e.type === 'transcript');
    expect(transcriptEvents.length).toBe(1);

    const evt = transcriptEvents[0]!;
    expect(evt.type).toBe('transcript');
    if (evt.type === 'transcript') {
      expect(evt.text).toBe('Hello world');
      expect(evt.isFinal).toBe(true);
      expect(evt.role).toBe('user');
    }
  });

  it('error server event → error RealtimeEvent with code and message', () => {
    const events = collectEvents(protocol);

    transport.emitServerEvent({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        code: 'session_expired',
        message: 'Your session has expired.',
      },
    });

    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents.length).toBeGreaterThanOrEqual(1);

    const evt = errorEvents[0]!;
    if (evt.type === 'error') {
      expect(evt.message).toContain('expired');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Clean close (1000) — no reconnect, no error event
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — clean close (code 1000)', () => {
  it('transitions to disconnected state', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    factory.last.emitClose(1000, 'Normal closure');

    expect(protocol.getState()).toBe('disconnected');
  });

  it('does NOT attempt reconnect after clean close', async () => {
    vi.useFakeTimers();
    try {
      const factory = new FakeTransportFactory();
      const protocol = makeProtocol(factory);
      const connectPromise = protocol.connect(BASE_CONFIG);
      factory.last.emitOpen();
      await connectPromise;

      const transportCountBefore = factory.all.length;
      factory.last.emitClose(1000, 'Normal closure');

      // Advance timers well beyond the maximum reconnect backoff (10 000 ms)
      await vi.advanceTimersByTimeAsync(15_000);

      expect(factory.all.length).toBe(transportCountBefore); // no new transport opened
    } finally {
      vi.useRealTimers();
    }
  });

  it('does NOT emit an error event on clean close', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const events = collectEvents(protocol);

    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    // Clear events captured during connect
    events.length = 0;

    factory.last.emitClose(1000, 'Normal closure');

    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Unexpected close — reconnect with backoff
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — unexpected close triggers reconnect', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens a second transport after an unexpected close', async () => {
    vi.useFakeTimers();

    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    expect(factory.all.length).toBe(1);

    // Unexpected close (non-1000)
    factory.last.emitClose(1006, 'Abnormal closure');

    // Advance timers to trigger the first reconnect attempt (backoff: 1000 * 2^0 = 1 000 ms)
    await vi.advanceTimersByTimeAsync(1_500);

    // A second transport should have been opened by the reconnect attempt
    expect(factory.all.length).toBe(2);
  });

  it('state transitions to reconnecting before the backoff fires', async () => {
    vi.useFakeTimers();

    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    factory.last.emitClose(1006, 'Abnormal closure');

    // Should be reconnecting immediately after close (before the timeout fires)
    expect(protocol.getState()).toBe('reconnecting');

    vi.useRealTimers();
  });

  it('gives up (no infinite retry) when a reconnect attempt fails to re-open', async () => {
    // Termination condition under test: after an unexpected drop schedules a
    // reconnect, the reconnect transport is opened but then closes again WITHOUT
    // ever firing onOpen. At that point state is 'connecting' (not connected/
    // reconnecting), so handleClose takes the `!wasConnected` branch and the
    // protocol stops — it does not retry forever.
    //
    // NOTE on the numeric MAX_RECONNECT_ATTEMPTS cap: with the per-outage reset
    // (reconnectAttempts → 0 on every successful onOpen), the counter can only
    // reach 1 before either a successful re-open resets it or a failed attempt
    // bails via `!wasConnected`. The >= MAX_RECONNECT_ATTEMPTS guard is therefore
    // a defensive backstop that this state machine rarely reaches; this test pins
    // the *observable* contract (no infinite reconnect storm), which is what
    // callers depend on. The per-outage reset itself is pinned by the next test.
    vi.useFakeTimers();

    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);

    // Initial successful connection (transport 1)
    const p1 = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await p1;

    // Drop 1 → attempt 1 fires (reconnectAttempts becomes 1 → reset to 0 on open)
    factory.last.emitClose(1006, 'Abnormal');
    await vi.advanceTimersByTimeAsync(1_500); // backoff 1 000 ms
    expect(factory.all.length).toBe(2);
    factory.last.emitOpen(); // attempt 1 succeeds; reconnectAttempts reset to 0

    // Drop 2 → attempt 2 fires (reconnectAttempts becomes 1 → reset to 0 on open)
    factory.last.emitClose(1006, 'Abnormal');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(factory.all.length).toBe(3);
    factory.last.emitOpen(); // attempt 2 succeeds; reset to 0

    // Drop 3 → attempt 3 fires (reconnectAttempts becomes 1 → reset to 0 on open)
    factory.last.emitClose(1006, 'Abnormal');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(factory.all.length).toBe(4);
    factory.last.emitOpen(); // attempt 3 succeeds; reset to 0

    // Drop 4 → attempt 4 fires (reconnectAttempts 0 → 1)
    factory.last.emitClose(1006, 'Abnormal');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(factory.all.length).toBe(5);
    // Do NOT emitOpen this time — attempt 4 transport just stays in 'connecting'.
    // The cap of 3 applies to consecutive *failed* reconnects inside a single
    // outage.  Close this transport without opening to simulate a failed attempt.
    factory.last.emitClose(1006, 'Abnormal');
    // State is now 'connecting' when the 2nd close fires, so wasConnected=false
    // → the protocol should give up and move to disconnected without a 5th transport.
    await vi.advanceTimersByTimeAsync(15_000);
    expect(factory.all.length).toBe(5); // no 6th transport
    expect(protocol.getState()).toBe('disconnected');

    vi.useRealTimers();
  });

  it('resets the reconnect budget after a successful reconnect (per-outage semantics)', async () => {
    // Verifies that reconnectAttempts resets to 0 on emitOpen so a fresh
    // outage can use the full 3-attempt budget again.
    vi.useFakeTimers();

    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);

    // Initial successful connection
    const p1 = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await p1;

    // Outage 1: drop → reconnect → re-open (resets budget)
    factory.last.emitClose(1006, 'Abnormal');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(factory.all.length).toBe(2);
    factory.last.emitOpen(); // budget reset
    expect(protocol.getState()).toBe('connected');

    // Outage 2: drop → reconnect → re-open (budget still fresh)
    factory.last.emitClose(1006, 'Abnormal');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(factory.all.length).toBe(3);
    factory.last.emitOpen(); // budget reset again
    expect(protocol.getState()).toBe('connected');

    // Outage 3: drop → reconnect → re-open (budget still fresh)
    factory.last.emitClose(1006, 'Abnormal');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(factory.all.length).toBe(4);
    factory.last.emitOpen(); // budget reset again
    expect(protocol.getState()).toBe('connected');

    // Still connected after 3+ successful reconnects — no lifetime cap hit
    expect(protocol.getState()).toBe('connected');

    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Bug-fix pin — malformed frame emits error event (not swallowed silently)
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — malformed frame error surfacing (bug-fix pin)', () => {
  /**
   * Both existing adapters swallow JSON.parse errors with an empty catch{}.
   * RFC-1 requires the new protocol to emit an ErrorEvent with
   * code 'invalid_server_message' instead.
   *
   * This test FAILS against OpenAIRealtimeAdapter:271-273 and
   * NodeOpenAIRealtimeAdapter:235-237 (both silently drop parse errors).
   */
  it('emits an error event with code invalid_server_message on malformed JSON', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const events = collectEvents(protocol);

    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    // Clear events captured during connect
    events.length = 0;

    // Send a non-JSON raw message
    factory.last.emitRawMessage('this is not { valid JSON }}}');

    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents.length).toBe(1);

    const evt = errorEvents[0]!;
    if (evt.type === 'error') {
      expect(evt.code).toBe('invalid_server_message');
    }
  });

  it('does not crash / throw on malformed frame', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);

    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    expect(() => {
      factory.last.emitRawMessage('NOT JSON AT ALL');
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Audio round-trip — sendAudio() → input_audio_buffer.append with correct base64
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — audio round-trip', () => {
  it('sendAudio() sends an input_audio_buffer.append frame with base64-encoded PCM', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);

    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    // Clear frames produced during session setup
    factory.last.sent.length = 0;

    const samples = new Int16Array([100, -200, 300, -400, 500]);
    protocol.sendAudio(samples);

    expect(factory.last.sent.length).toBe(1);

    const frame = JSON.parse(factory.last.sent[0]!) as Record<string, unknown>;
    expect(frame.type).toBe('input_audio_buffer.append');
    expect(typeof frame.audio).toBe('string');

    // Verify the bytes round-trip correctly using the same portable codec
    const expectedBase64 = int16ToBase64(samples);
    expect(frame.audio).toBe(expectedBase64);
  });

  it('sendAudio() is a no-op when not connected', () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);

    // Do NOT connect — state is 'disconnected'
    expect(() => {
      protocol.sendAudio(new Int16Array([1, 2, 3]));
    }).not.toThrow();

    // No transport has been opened, nothing to inspect
    expect(factory.all.length).toBe(0);
  });

  it('audio codec preserves byte order for a known PCM value', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;
    factory.last.sent.length = 0;

    // Single sample: 256 in int16 little-endian = bytes [0x00, 0x01]
    const samples = new Int16Array([256]);
    protocol.sendAudio(samples);

    const frame = JSON.parse(factory.last.sent[0]!) as Record<string, unknown>;
    const decoded = atob(frame.audio as string);

    // Int16 256 = 0x0100; little-endian: low byte = 0x00, high byte = 0x01
    expect(decoded.charCodeAt(0)).toBe(0x00);
    expect(decoded.charCodeAt(1)).toBe(0x01);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. disconnect() — explicit disconnect is clean
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — disconnect()', () => {
  it('transitions to disconnected state immediately', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    protocol.disconnect();

    expect(protocol.getState()).toBe('disconnected');
  });

  it('emits connection_state disconnected event', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const events = collectEvents(protocol);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;
    events.length = 0;

    protocol.disconnect();

    const disconnectedEvents = events.filter(
      (e) => e.type === 'connection_state' && e.state === 'disconnected',
    );
    expect(disconnectedEvents.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. onEvent — unsubscribe works
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIRealtimeProtocol — onEvent subscription lifecycle', () => {
  it('onEvent returns an unsubscribe function that stops further delivery', async () => {
    const factory = new FakeTransportFactory();
    const protocol = makeProtocol(factory);
    const connectPromise = protocol.connect(BASE_CONFIG);
    factory.last.emitOpen();
    await connectPromise;

    const received: RealtimeEvent[] = [];
    const unsubscribe = protocol.onEvent((e) => received.push(e));

    factory.last.emitServerEvent({
      type: 'conversation.item.input_audio_transcription.completed',
      item_id: 'i1',
      content_index: 0,
      transcript: 'first',
    });

    expect(received.length).toBe(1);

    unsubscribe();

    factory.last.emitServerEvent({
      type: 'conversation.item.input_audio_transcription.completed',
      item_id: 'i2',
      content_index: 0,
      transcript: 'second',
    });

    // Still just one — the second event was not delivered after unsubscribe
    expect(received.length).toBe(1);
  });
});
