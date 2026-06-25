# RFC 1 — Deepen the OpenAI Realtime adapters into a transport-agnostic protocol core

**Status:** Proposed · **Candidate:** #1 (Realtime adapters) · **Chosen design:** Ports & Adapters + portable codec

## Problem

The OpenAI Realtime connection is implemented twice:

- `src/infrastructure/adapters/realtime/OpenAIRealtimeAdapter.ts` (425 lines, browser `WebSocket`, auth via `openai-insecure-api-key.*` subprotocol)
- `src/cli/adapters/NodeOpenAIRealtimeAdapter.ts` (342 lines, Node `ws`, auth via `Authorization: Bearer` header)

The two share `src/infrastructure/adapters/realtime/types.ts` and both implement `src/application/ports/RealtimeConnectionPort.ts`, but ~70% of the body is duplicated: the `processServerEvent` switch, reconnect + exponential backoff (`handleClose`), the `configureSession`/`configureTranscriptionSession` builders, and the int16↔base64 codec.

This duplication is not cosmetic — **it has already drifted into a latent bug**:

- `NodeOpenAIRealtimeAdapter.ts:175` hardcodes `input_audio_transcription: { model: 'gpt-4o-transcribe' }` and ignores `config.transcriptionModel`, while the browser honors it (`OpenAIRealtimeAdapter.ts:194`). The `--transcription-model` flag silently no-ops in CLI conversation mode.
- A third undocumented divergence: Node sends `input_audio_noise_reduction: near_field` (`NodeOpenAIRealtimeAdapter.ts:213-215`); the browser does not.
- Both swallow WS `JSON.parse` errors with an empty `catch {}` (`OpenAIRealtimeAdapter.ts:271-273`, `NodeOpenAIRealtimeAdapter.ts:235-237`), so malformed server frames vanish without surfacing a `ConnectionError` — contradicting the error-code contract in `CLAUDE.md`.

Neither adapter is unit-testable today: the protocol logic is welded to a live `WebSocket`/`ws` socket, so `SessionManager.test.ts` can only mock the whole `RealtimeConnectionPort` and cannot catch the drift.

## Proposed Interface

A new fine-grained port isolates the **only** thing that varies between environments — the socket + auth — below the existing coarse port.

```ts
// NEW: src/application/ports/RealtimeTransportPort.ts
export type TransportState = 'open' | 'closing' | 'closed';
export interface TransportCloseInfo { code: number; reason: string; }

export interface RealtimeTransportHandlers {
  onOpen: () => void;
  onMessage: (raw: string) => void;       // engine owns JSON parsing
  onClose: (info: TransportCloseInfo) => void;
  onError: () => void;
}

export interface RealtimeTransport {
  send(data: string): void;               // no-op if not open
  close(): void;
  readonly state: TransportState;
}

/** Owns transport selection AND auth strategy (subprotocol vs Bearer header). */
export interface RealtimeTransportFactory {
  open(url: string, apiKey: string, handlers: RealtimeTransportHandlers): RealtimeTransport;
}
```

```ts
// NEW: the deep module — implements the EXISTING port, depends only on the transport port
export class OpenAIRealtimeProtocol implements RealtimeConnectionPort {
  constructor(private readonly transportFactory: RealtimeTransportFactory) {}
  // connect / disconnect / sendAudio / commitAudioBuffer / sendText /
  // triggerResponse / cancelResponse / updateSession / onEvent / getState
}
```

```ts
// Production adapters (~25-35 lines each, NO protocol logic):
//   src/infrastructure/adapters/realtime/BrowserWebSocketTransport.ts   (native WebSocket + subprotocol)
//   src/cli/adapters/NodeWsTransport.ts                                  (`ws` + Bearer header)
// Test adapter (in-memory):
//   FakeTransportFactory / FakeTransport  — captures sent[] frames, drives onOpen/onMessage/onClose synchronously
```

### Usage example

```ts
// Browser factory (replaces `new OpenAIRealtimeAdapter()`)
class BrowserRealtimeConnectionFactory implements RealtimeConnectionFactoryPort {
  create(): RealtimeConnectionPort {
    return new OpenAIRealtimeProtocol(new BrowserWebSocketTransportFactory());
  }
}
// CLI composition root (replaces `new NodeOpenAIRealtimeAdapter()`)
const connection = new OpenAIRealtimeProtocol(new NodeWsTransportFactory());
```

`RealtimeConnectionPort` and `RealtimeConnectionFactoryPort` are **unchanged**; the new port sits beneath them:
`RealtimeConnectionFactoryPort → RealtimeConnectionPort (OpenAIRealtimeProtocol) → RealtimeTransportPort → {Browser|Node|Fake}`.

### Complexity hidden

The full WS state machine, reconnect/backoff (`Math.min(1000 * 2^(n-1), 10000)`, max 3 attempts, clean-close `1000` suppression), the `processServerEvent` switch, both session-config builders, URL construction (`REALTIME_API_URL` vs `TRANSCRIPTION_API_URL`), and the codec all live once inside the core. The transport sees only `send/close/state` + four callbacks; auth is absorbed into `open()`.

## Dependency Strategy

**Category 4 (true-external behind a port)** for the socket/credentials, wrapping **category 1 (in-process pure)** protocol logic.

- The WebSocket itself (`window.WebSocket` / `ws`) and credential transmission are isolated behind `RealtimeTransportPort`. Two thin production adapters; one in-memory `FakeTransportFactory` for tests.
- After extraction the core imports no platform global — no `ws`, `WebSocket`, `Buffer`, or `btoa`. **The codec moves to a portable `Uint8Array` byte-loop** (preserving Node's byte-offset correctness: `new Int16Array(buf.buffer, buf.byteOffset, …)`) so a single class runs in both runtimes without a second injected seam.
- Auth is data (`apiKey`) plus the one line that places it, which lives in each transport factory — no separate auth port.

## Testing Strategy

- **New boundary tests (at `OpenAIRealtimeProtocol` with `FakeTransportFactory`, no network):**
  - `connect()` resolves on `onOpen`, rejects on `onError`; resolves at most once while `state === 'connecting'`.
  - Session-config frame carries `config.transcriptionModel` to the wire — **this assertion fails against today's `NodeOpenAIRealtimeAdapter:175`**, pinning the bug fix.
  - A `conversation.item.input_audio_transcription.completed` server event emits a final user `transcript` event.
  - Clean close (`1000`) → `disconnected`, no reconnect, no error event; unexpected close → reconnect with backoff up to the cap.
  - Malformed JSON frame emits an `ErrorEvent` (`code: 'invalid_server_message'`) instead of being swallowed.
- **Old tests to delete:** none directly (adapters are currently untested); `SessionManager.test.ts` realtime mocks stay as-is.
- **Test environment:** none beyond the in-memory fake — no Docker, no sockets.

## Implementation Recommendations

- **Owns:** the entire Realtime protocol/state machine, reconnect policy, session-config assembly, event mapping, audio codec.
- **Hides:** transport choice and auth — the only legitimate per-environment variation.
- **Exposes:** the unchanged `RealtimeConnectionPort`; internally, the 4-method `RealtimeTransport`.
- **Migration:** grep every `new OpenAIRealtimeAdapter` / `new NodeOpenAIRealtimeAdapter` construction site and route it through the factory. Place `RealtimeTransportPort.ts` in `src/application/ports/`; the protocol core may live in `src/infrastructure/adapters/realtime/` beside `types.ts` (it imports only ports + types, so the dependency rule holds). Node transport stays under `src/cli/adapters/`.
- **Behaviour changes to call out in the PR (intended fixes, not regressions):** (1) CLI now honors `transcriptionModel`; (2) noise-reduction unified (keep the `near_field` superset for both, or gate it by config — decide at review); (3) parse errors now surface as `ErrorEvent`.
