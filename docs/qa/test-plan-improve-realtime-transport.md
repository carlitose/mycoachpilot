# Test Plan — RFC-1: Realtime Transport Consolidation

**Branch:** `improve/realtime-transport`
**RFC:** `docs/rfc-1-realtime-transport-deepening.md`
**Date:** 2026-06-25
**Tester:** _____________________

---

## Scope

This change consolidates two duplicated OpenAI Realtime adapters (`OpenAIRealtimeAdapter.ts` for the browser and `NodeOpenAIRealtimeAdapter.ts` for the CLI) into a single transport-agnostic `OpenAIRealtimeProtocol` core backed by thin `BrowserWebSocketTransport` and `NodeWsTransport` adapters. It also fixes three bugs: (1) the CLI `--transcription-model` flag was silently ignored in conversation mode; (2) JSON parse errors on server messages were swallowed instead of surfaced as error events; (3) `near_field` noise reduction is now sent on both web and CLI transcription sessions (was CLI-only before).

Verify by exercising all three session modes on both the web app and the CLI, confirming live transcription, AI responses, TTS playback, and error surfacing still work correctly, and confirming the three bug fixes are now in effect.

---

## Prerequisites

| # | Requirement |
|---|-------------|
| P1 | Node 18+ and npm installed. Run `npm install` in the project root to ensure dependencies are up to date. |
| P2 | **[REQUIRES LIVE KEY]** A valid OpenAI API key with access to the Realtime API (`gpt-4o-realtime-preview` or equivalent). Set via the app's Settings panel or via `OPENAI_API_KEY` environment variable for the CLI. |
| P3 | **[REQUIRES AUDIO DEVICE]** A working microphone and audio output device (speakers or headphones) on the test machine. |
| P4 | Dev server running: `npm run dev` (serves on `http://localhost:13000`). |
| P5 | For CLI tests: the CLI is invocable via `npx tsx src/cli/main.ts session start` from the project root, or via the `npm run cli` script if configured. |
| P6 | Browser DevTools open (Network tab + Console) for all web app tests — used to verify WebSocket frames and error events. |
| P7 | No `.env` overrides pointing to a non-production Realtime endpoint unless intentionally testing that path. |

---

## Happy Path

### Group A — Web App: Conversation Mode

**A1.** Navigate to `http://localhost:13000`. Open DevTools → Network → filter by `WS`.
**Expected:** Page loads without console errors.

**A2.** Open Settings and enter your OpenAI API key. Save. **[REQUIRES LIVE KEY]**
**Expected:** Settings saved confirmation; the key persists on refresh.

**A3.** In SessionControls, select mode **Conversation** from the mode dropdown. Click **Start Session**.
**Expected:** The connection-status indicator turns green (connected). DevTools shows a WebSocket connection opened to `wss://api.openai.com/v1/realtime?model=gpt-...`. No console errors.

**A4.** Speak a short sentence into the microphone. **[REQUIRES AUDIO DEVICE]**
**Expected:** Within a few seconds, a transcript for your speech appears in the transcript panel (role: user). The AI generates a spoken reply; audio plays back through speakers. An assistant transcript entry appears after the reply completes.

**A5.** Click **Stop Session**.
**Expected:** The connection-status indicator turns grey (disconnected). The WebSocket connection in DevTools shows close code 1000. No error events appear in the console.

---

### Group B — Web App: Transcript-Only Mode

**B1.** Select mode **Transcript Only** in the mode dropdown. Click **Start Session**. **[REQUIRES LIVE KEY, REQUIRES AUDIO DEVICE]**
**Expected:** The status indicator turns green. DevTools shows a WebSocket opened to `wss://api.openai.com/v1/realtime?intent=transcription`. No model parameter in the URL.

**B2.** Speak a sentence. **[REQUIRES AUDIO DEVICE]**
**Expected:** A user transcript appears in the panel. No AI audio response is produced (transcript-only mode). No coaching suggestion is generated.

**B3.** Click **Stop Session**.
**Expected:** Clean disconnect, status indicator grey, close code 1000 in DevTools.

---

### Group C — Web App: Meeting Coach Mode

**C1.** Select mode **Meeting Coach** in the mode dropdown. Click **Start Session**. **[REQUIRES LIVE KEY, REQUIRES AUDIO DEVICE]**
**Expected:** Status indicator turns green. DevTools shows WebSocket opened to the conversation endpoint (`wss://api.openai.com/v1/realtime?model=...`).

**C2.** Speak several sentences simulating a meeting participant. **[REQUIRES AUDIO DEVICE]**
**Expected:** User transcript segments appear in the panel. After sufficient speech, one or more coaching suggestions appear in the suggestions panel. TTS audio plays the suggestion aloud (if TTS is enabled in settings).

**C3.** Click **Stop Session**.
**Expected:** Clean disconnect, status indicator grey.

---

### Group D — CLI: Meeting Coach Mode

**D1.** Run:
```
npx tsx src/cli/main.ts session start --mode meeting_coach --openai-key <YOUR_KEY>
```
**[REQUIRES LIVE KEY, REQUIRES AUDIO DEVICE]**
**Expected:** The CLI prints a "Connecting…" or "Connected" message. No startup errors.

**D2.** Speak into the microphone for 15–20 seconds. **[REQUIRES AUDIO DEVICE]**
**Expected:** Transcription lines appear in the terminal output. At least one coaching suggestion is printed.

**D3.** Press `Ctrl+C` to stop the session.
**Expected:** The CLI prints a clean shutdown message and exits with code 0. No unhandled exception stack traces.

---

### Group E — CLI: Conversation Mode

**E1.** Run:
```
npx tsx src/cli/main.ts session start --mode conversation --openai-key <YOUR_KEY>
```
**[REQUIRES LIVE KEY, REQUIRES AUDIO DEVICE]**
**Expected:** CLI connects and prints a connected status. No startup errors.

**E2.** Speak a question. **[REQUIRES AUDIO DEVICE]**
**Expected:** User transcript appears. The AI's text response is printed in the terminal (and audio plays if audio output is wired in the CLI).

**E3.** Press `Ctrl+C` to stop.
**Expected:** Clean exit.

---

### Group F — CLI: Transcript-Only Mode

**F1.** Run:
```
npx tsx src/cli/main.ts session start --mode transcript_only --openai-key <YOUR_KEY>
```
**[REQUIRES LIVE KEY, REQUIRES AUDIO DEVICE]**
**Expected:** CLI connects. No AI response is generated — only transcription output.

**F2.** Speak. **[REQUIRES AUDIO DEVICE]**
**Expected:** Transcript lines appear; no AI text or audio response.

**F3.** Press `Ctrl+C` to stop.
**Expected:** Clean exit.

---

## Edge Cases

### Group G — Bug Fix Verification

**G1. `--transcription-model` flag is now honored in CLI conversation mode (bug fix).**
Run:
```
npx tsx src/cli/main.ts session start --mode conversation --openai-key <YOUR_KEY> --transcription-model gpt-4o-mini-transcribe
```
**[REQUIRES LIVE KEY]**
Open DevTools on the CLI's outgoing WebSocket frames (or add a temporary `console.log` to `configureConversationSession`) and confirm the `session.update` frame contains `input_audio_transcription.model: "gpt-4o-mini-transcribe"`, not the hardcoded default.
**Expected:** The custom transcription model name appears in the outgoing `session.update` frame. Behavior before this fix: the model field was always `gpt-4o-transcribe` regardless of the flag.

**G2. `--transcription-model` flag also works in CLI transcript-only mode.**
Run:
```
npx tsx src/cli/main.ts session start --mode transcript_only --openai-key <YOUR_KEY> --transcription-model gpt-4o-mini-transcribe
```
**[REQUIRES LIVE KEY]**
**Expected:** The `transcription_session.update` frame contains `input_audio_transcription.model: "gpt-4o-mini-transcribe"`.

**G3. Transcription model flag also works from the web app's Settings panel (regression: should have worked before, must still work after).**
In the web app Settings, set a non-default transcription model value. Start a Conversation session. In DevTools WebSocket frames, find the `session.update` frame sent right after connection opens.
**Expected:** `input_audio_transcription.model` in the frame matches the value entered in Settings.

**G4. `near_field` noise reduction is sent on web transcription-only sessions (new behavior).**
In the web app, start a **Transcript Only** session. In DevTools, inspect the first outgoing WebSocket text frame after the connection opens.
**Expected:** The frame is a `transcription_session.update` containing `input_audio_noise_reduction: { "type": "near_field" }`. This field was absent on the browser before this change.

**G5. `near_field` noise reduction continues to be sent on CLI transcription-only sessions (regression: existed before, must still exist).**
Run CLI in `transcript_only` mode. Inspect the outgoing `transcription_session.update` frame in terminal output or logs.
**Expected:** `input_audio_noise_reduction: { "type": "near_field" }` is present.

---

### Group H — Reconnect Behavior

**H1. Web app reconnects after unexpected connection drop (up to 3 attempts).**
Start a Conversation session in the web app. In DevTools Network → WS, find the active connection and close it manually using the browser's "Cancel" or by using the DevTools console: `/* find the ws object and call ws.close(4001, 'test') */`. Alternatively, simulate a network interruption.
**Expected:** The status indicator briefly shows a "reconnecting" state (yellow or orange), then returns to green once reconnected. A new WebSocket connection appears in the DevTools Network tab. The session resumes without requiring a manual restart.

**H2. Web app stops reconnecting after 3 failed attempts.**
With an invalid API key (temporarily enter a wrong key), start a session. Allow it to attempt to connect 3 times.
**Expected:** After 3 failed attempts the status indicator shows an error state (red). No further automatic reconnection occurs. An error message is visible to the user.

**H3. CLI reconnects after unexpected drop.**
Start a CLI session. Use `tc` (Linux traffic control) or a network proxy to drop the WebSocket mid-session, then restore it.
**Expected:** The CLI logs a "reconnecting" message and reconnects automatically. The session continues.

---

### Group I — Connection Status Indicator

**I1.** During web app connection establishment (before `onOpen` fires), the indicator should show a "connecting" state.
**Expected:** A brief connecting state (e.g. yellow dot) appears before turning green. (May be fast to observe; use a throttled network in DevTools to slow it down if needed.)

**I2.** After a successful reconnect (H1 above), the reconnect-budget counter resets.
**Expected:** After reconnecting once, the session can reconnect again on a second drop without immediately hitting the 3-attempt cap.

---

## Negative / Error Paths

**N1. Wrong or missing OpenAI API key (web app).**
In Settings, enter an invalid API key (`sk-invalid123`). Click **Start Session** (any mode).
**Expected:** The connection-status indicator shows an error state. A user-visible error message appears (e.g. "Failed to connect" or a 401 error surfaced from OpenAI). The app does not crash. The console shows an `error` event with code `connection_failed` or a WS close code error.

**N2. Wrong or missing OpenAI API key (CLI).**
Run:
```
npx tsx src/cli/main.ts session start --mode conversation --openai-key sk-invalid123
```
**Expected:** The CLI prints an error message and exits with a non-zero exit code. No unhandled promise rejection or stack trace.

**N3. Malformed server message is surfaced as an error event, not silently swallowed (bug fix).**
This is difficult to trigger with a real server in production. Instead, verify the behavior via the unit tests already covering this path (`OpenAIRealtimeProtocol.test.ts`, "Malformed frame error surfacing" suite). As a manual check: confirm the browser console does NOT show any uncaught JSON parse exceptions during normal use (which would indicate the old empty-catch was still in place somewhere).
**Expected (automated test evidence):** The `OpenAIRealtimeProtocol.test.ts` tests for malformed frames pass (`npm test` or `npx vitest`).
**Expected (manual):** No uncaught `SyntaxError: Unexpected token` errors appear in the browser console during a normal session.

**N4. Starting a second session while one is already connected (idempotent connect guard).**
Start a web app session until it shows connected. Without stopping it, click **Start Session** again (if the UI allows it, or trigger via DevTools).
**Expected:** A second WebSocket connection is NOT opened. The existing session continues. The app remains stable.

**N5. No microphone permission granted (web app).** **[REQUIRES AUDIO DEVICE]**
With the browser microphone permission blocked for `localhost`, click **Start Session** (Conversation mode).
**Expected:** The app shows a user-friendly error about microphone access. The realtime connection is either not opened or is cleanly closed. No crash.

**N6. Stopping a session immediately after starting (race condition).**
In the web app, click **Start Session** then immediately click **Stop Session** before the green indicator appears.
**Expected:** The connection is cleanly terminated (WS close code 1000). No duplicate connection events or lingering socket. The status indicator returns to disconnected.

---

## Regression Risks

These surfaces were not directly changed but are reachable from the modified wiring and must be verified.

**R1. Web app realtime connection still works identically after consolidation.**
The `BrowserRealtimeConnectionFactory` now creates `new OpenAIRealtimeProtocol(new BrowserWebSocketTransportFactory())` instead of `new OpenAIRealtimeAdapter()`. Run the full Group A (Conversation) and Group B (Transcript-Only) happy paths and confirm behavior is unchanged.
**Expected:** All happy-path steps for web pass identically to before the change.

**R2. CLI realtime connection still works identically after consolidation.**
The CLI container now wires `new OpenAIRealtimeProtocol(new NodeWsTransportFactory())` instead of `new NodeOpenAIRealtimeAdapter()`. Run the full Group D (Meeting Coach) and Group F (Transcript-Only) happy paths.
**Expected:** All happy-path steps for CLI pass identically to before the change.

**R3. Session pause/resume in the web app.**
After starting a Conversation session (A3–A4), click **Pause**. Wait 5 seconds. Click **Resume**.
**Expected:** The transcription and AI response resume normally. The realtime connection is maintained or correctly re-established. No duplicate connections.

**R4. Audio codec correctness (PCM ↔ base64 round-trip).**
The codec was extracted to a separate `codec.ts` file but the logic is unchanged (portable `Uint8Array` byte-loop). During a live Conversation session (web or CLI), verify that AI audio responses play back at the correct pitch and speed. **[REQUIRES AUDIO DEVICE]**
**Expected:** AI voice playback sounds natural — no distortion, pitch shift, or speed artifacts that would indicate a byte-order or encoding regression.

**R5. Redux state and UI consistency after session stop.**
After running a full Conversation session (A3–A5), inspect the Redux DevTools or the UI.
**Expected:** The session state in Redux shows `disconnected`. Transcript entries remain visible. No leftover `connecting` or `reconnecting` state.

**R6. Settings persistence across session starts.**
Configure a custom coaching style or suggestion model in Settings. Start and stop two consecutive sessions.
**Expected:** Settings are not reset between sessions. The same configuration is applied to both sessions.

**R7. Node adapter auth header is correctly set.**
In CLI mode, inspect the outgoing WebSocket upgrade request headers (e.g. via Wireshark, a proxy like mitmproxy, or by temporarily logging in `NodeWsTransport.ts`). The `NodeWsTransportFactory` uses `Authorization: Bearer <apiKey>` (not the subprotocol method used by the browser).
**Expected:** The HTTP upgrade request includes `Authorization: Bearer sk-...` and `OpenAI-Beta: realtime=v1`. No `Sec-WebSocket-Protocol` header with the API key embedded.

**R8. Browser adapter auth subprotocol is correctly set.**
In the web app, inspect the WebSocket upgrade request in DevTools (Network → WS connection → Headers).
**Expected:** `Sec-WebSocket-Protocol` contains `realtime`, `openai-insecure-api-key.<YOUR_KEY>`, and `openai-beta.realtime-v1`. No `Authorization` header carrying the key.

**R9. Unit test suite passes after the change.**
Run `npm test` (or `npx vitest`) from the project root.
**Expected:** All tests pass, including the new `OpenAIRealtimeProtocol.test.ts` suite (9 suites, ~29 cases) and the existing `SessionManager.test.ts`. Zero failures.

---

## Out of Scope

- The `OpenAIRealtimeProtocol` unit tests (`OpenAIRealtimeProtocol.test.ts`) — these are automated and covered by the TDD test suite; they do not need manual execution.
- The `FakeTransportFactory` / `FakeTransport` in-memory test double — internal test infrastructure; not user-facing.
- The audio capture pipeline itself (`NodeMicrophoneAdapter`, `FfmpegAudioAdapter`, `FileAudioCaptureAdapter`) — not modified in this change.
- The suggestion-generation engine (`CoachingEngine`) — not modified.
- Redux slices (`sessionSlice`, `transcriptSlice`, `coachingSlice`, `settingsSlice`) — not modified.
- The `RealtimeConnectionPort` interface — intentionally unchanged; backward compatibility is guaranteed.
- The `codec.ts` pure functions — covered by automated unit tests (audio round-trip test suite in `OpenAIRealtimeProtocol.test.ts`).
- Other CLI commands (`config set-key`) — not affected by the transport change.
- CI/CD pipeline changes — none in this branch.
