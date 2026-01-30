# Edge Cases & Error Handling - MyCoachPilot Free

## 1. Network & Connectivity

### EC-001: Connection Timeout Durante Session Start
**Scenario:** User starts session, ma WebSocket connection timeout dopo 10s

**Trigger Conditions:**
- Network latency > 10s
- OpenAI service unreachable
- Firewall blocking WebSocket

**Expected Behavior:**
1. `toggleSession()` throws error dopo 10s
2. Error toast: "Failed to start session"
3. `isStarting` set a false
4. Audio mixer cleaned up if created
5. User può retry immediately

**Recovery Strategy:**
- User clicks "Start Session" again
- Check network connectivity first
- Suggest switching a different network

**Test Approach:**
```typescript
jest.useFakeTimers();
await expect(toggleSession()).rejects.toThrow();
```

---

### EC-002: Connection Lost Durante Active Session
**Scenario:** WebSocket closes unexpectedly mid-conversation

**Trigger Conditions:**
- Network disconnection
- OpenAI server restart
- Ephemeral token expired (dopo 60s)

**Expected Behavior:**
1. WebSocket `close` event fired (code: 1006 abnormal)
2. Session marked come inactive
3. Error logged: `[WebSocket Closed Unexpectedly]`
4. Toast: "Connection lost. Please start a new session."
5. All resources cleaned up

**Recovery Strategy:**
- Auto-save current conversation a history
- User starts new session
- Può resume from history if needed

**Implementation:**
```typescript
session.on('close', (event) => {
  if (event.code === 1006) {
    // Abnormal closure
    log.error('WebSocket Closed Unexpectedly', { code: event.code, reason: event.reason });
    toast.error('Connection lost. Please start a new session.');
    cleanupSession();
    autoSaveToHistory();
  } else if (event.code === 1000) {
    // Normal closure
    log.info('Session ended normally');
  }
});
```

---

### EC-003: Rate Limit Exceeded (HTTP 429)
**Scenario:** User exceeds OpenAI rate limits

**Trigger Conditions:**
- Too many requests in short period
- API key tier limits reached
- Concurrent session limit hit

**Expected Behavior:**
1. Token endpoint returns 429
2. Response include `Retry-After` header
3. Error toast: "Rate limit exceeded. Please wait {seconds}s"
4. Session start button disabled per retry period
5. Automatic retry dopo wait time

**Recovery Strategy:**
- Wait for `Retry-After` duration
- Upgrade API key tier
- Reduce request frequency

**Implementation:**
```typescript
async function fetchToken(apiKey: string): Promise<string> {
  const response = await fetch('/api/realtime/token', {
    method: 'POST',
    body: JSON.stringify({ apiKey })
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    throw new RateLimitError(`Rate limit exceeded. Please wait ${retryAfter}s`, retryAfter);
  }

  if (!response.ok) {
    throw new Error('Failed to generate token');
  }

  const { token } = await response.json();
  return token;
}
```

---

## 2. Browser Compatibility & Permissions

### EC-004: Microphone Permission Denied
**Scenario:** User denies microphone access quando prompted

**Trigger Conditions:**
- Browser permission dialog → "Block"
- System-level mic access disabled (macOS)
- Microphone in use by another app

**Expected Behavior:**
1. `getUserMedia()` throws `NotAllowedError`
2. Session fails to start
3. Error toast: "Microphone access required"
4. Show instructions to enable in browser settings

**Recovery Strategy:**
1. User grants permission in browser settings
2. Refresh page
3. Try starting session again

**Prevention:**
- Show permission explanation before first request
- Detect permission state: `navigator.permissions.query({ name: 'microphone' })`

**Implementation:**
```typescript
async function requestMicrophonePermission(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw createClientError('PERMISSION_DENIED', {
        instructions: 'Please enable microphone access in your browser settings'
      });
    }
    throw error;
  }
}
```

---

### EC-005: Tab Audio Not Shared
**Scenario:** User forgets to check "Share tab audio" in browser dialog

**Trigger Conditions:**
- `getDisplayMedia()` succeeds ma `stream.getAudioTracks().length === 0`
- User unchecks audio checkbox in dialog

**Expected Behavior:**
1. Stream captured successfully (video only)
2. Audio track validation fails
3. System message: "⚠️ No audio captured. Make sure to check 'Share tab audio'."
4. Session continues con mic only (fallback)

**Recovery Strategy:**
- User stops tab capture
- Restarts con audio checkbox checked

**Implementation:**
```typescript
async function captureTabAudio(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });

  const audioTracks = stream.getAudioTracks();

  if (audioTracks.length === 0) {
    log.warn('No audio track in captured stream');
    addSystemMessage('⚠️ No audio captured. Make sure to check "Share tab audio".');

    // Stop video track since we don't need it
    stream.getVideoTracks().forEach(track => track.stop());

    // Return null to indicate fallback to mic only
    return null;
  }

  return stream;
}
```

---

### EC-006: Browser Not Supported
**Scenario:** User on unsupported browser (old Firefox, Safari 13)

**Trigger Conditions:**
- `navigator.mediaDevices.getDisplayMedia` undefined
- WebRTC not supported
- Browser version < minimum required

**Expected Behavior:**
1. Feature detection on app load
2. Warning banner: "This browser has limited support. Please use Chrome 90+ or Edge 90+"
3. Tab audio features hidden/disabled
4. Basic conversation mode still works (if WebRTC supported)

**Prevention:**
- Feature detection: `'getDisplayMedia' in navigator.mediaDevices`
- Browser detection per specific workarounds

**Implementation:**
```typescript
interface BrowserCapabilities {
  webrtc: boolean;
  tabAudio: boolean;
  screenCapture: boolean;
  pictureInPicture: boolean;
}

function detectBrowserCapabilities(): BrowserCapabilities {
  return {
    webrtc: 'RTCPeerConnection' in window,
    tabAudio: 'getDisplayMedia' in (navigator.mediaDevices || {}),
    screenCapture: 'getDisplayMedia' in (navigator.mediaDevices || {}),
    pictureInPicture: 'documentPictureInPicture' in window
  };
}

function showCompatibilityWarning(capabilities: BrowserCapabilities) {
  if (!capabilities.webrtc) {
    toast.error('WebRTC not supported. Please use a modern browser.');
    return;
  }

  if (!capabilities.tabAudio) {
    toast.warning('Tab audio capture not supported. Use Chrome 90+ or Edge 90+ for full features.');
  }
}
```

---

## 3. Data Validation & Limits

### EC-007: Empty Session (No Messages)
**Scenario:** User starts e immediately stops session senza any interaction

**Trigger Conditions:**
- Session duration < 5 seconds
- `messages.length === 0` o solo system messages

**Expected Behavior:**
1. Auto-save logic checks message count
2. Session non saved a history
3. Log: "Session not saved: no content messages"
4. No toast notification (silent)

**Prevention:**
- Filter messages before save: `filterMessagesForHistory(messages)`

**Implementation:**
```typescript
function filterMessagesForHistory(messages: Message[]): Message[] {
  return messages.filter(msg =>
    msg.role !== 'system' &&
    msg.role !== 'log' &&
    !msg.content.startsWith('---')
  );
}

function shouldSaveSession(messages: Message[], durationSeconds: number): boolean {
  const contentMessages = filterMessagesForHistory(messages);

  if (contentMessages.length === 0) {
    log.info('Session not saved: no content messages');
    return false;
  }

  if (durationSeconds < 5) {
    log.info('Session not saved: too short');
    return false;
  }

  return true;
}
```

---

### EC-008: Message Limit Exceeded (100 messages)
**Scenario:** Very long conversation exceeds in-memory message limit

**Trigger Conditions:**
- Continuous conversation per 30+ minutes
- High message frequency (user + AI rapid exchange)

**Expected Behavior:**
1. New messages added a array
2. Oldest messages dropped: `messages.slice(-MAX_MESSAGES)`
3. No user notification (transparent)
4. Full history preserved on disk (if saved)

**Prevention:**
- Limit enforced in `setMessages` updates
- Consider pagination per UI display

**Implementation:**
```typescript
const MAX_MESSAGES = 100;

function addMessage(newMessage: Message) {
  setMessages(prev => {
    const updated = [...prev, newMessage];

    if (updated.length > MAX_MESSAGES) {
      log.debug(`Message limit exceeded. Dropping ${updated.length - MAX_MESSAGES} oldest messages`);
      return updated.slice(-MAX_MESSAGES);
    }

    return updated;
  });
}
```

---

### EC-009: localStorage Quota Exceeded
**Scenario:** Cannot save session due a browser storage limit

**Trigger Conditions:**
- 20 large sessions stored (~5MB)
- Other apps using same origin quota
- Private browsing mode con low limits

**Expected Behavior:**
1. `localStorage.setItem()` throws `QuotaExceededError`
2. Error toast: "Cannot save session: storage full"
3. Suggest deleting old sessions
4. Session still ends gracefully

**Recovery Strategy:**
- Delete oldest sessions manually
- Export important sessions a JSON
- Clear browser cache/data

**Implementation:**
```typescript
function saveToLocalStorage(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      log.error('localStorage quota exceeded', { key });
      toast.error('Cannot save session: storage full. Please delete old sessions.');

      // Try to cleanup old sessions automatically
      const success = cleanupOldSessions();
      if (success) {
        // Retry save
        try {
          localStorage.setItem(key, JSON.stringify(value));
          toast.success('Old sessions cleaned up. Session saved.');
          return true;
        } catch {
          return false;
        }
      }

      return false;
    }
    throw error;
  }
}

function cleanupOldSessions(): boolean {
  try {
    const sessions = JSON.parse(localStorage.getItem('session_history') || '[]');

    if (sessions.length > 10) {
      // Keep only 10 most recent sessions
      const recent = sessions
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 10);

      localStorage.setItem('session_history', JSON.stringify(recent));
      log.info(`Cleaned up ${sessions.length - recent.length} old sessions`);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
```

---

## 4. Resource Management

### EC-010: Memory Leak da Unclosed Tracks
**Scenario:** Media tracks non properly disposed, causing memory buildup

**Trigger Conditions:**
- Multiple session start/stop cycles
- Browser tab left open per hours
- Audio mixer non cleaned up

**Expected Behavior:**
1. `cleanupSession()` stops all tracks:
   - `sender.track.stop()` per all PC senders
   - `receiver.track.stop()` per all PC receivers
   - `stream.getTracks().forEach(track => track.stop())`
2. Event listeners removed
3. AudioContext closed
4. No lingering references

**Prevention:**
- Use `useEffect` cleanup functions
- Track all created streams/contexts
- Test con Chrome DevTools → Performance Monitor

**Implementation:**
```typescript
function cleanupSession() {
  // Stop all media tracks
  if (currentSession?.peerConnection) {
    currentSession.peerConnection.getSenders().forEach(sender => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    currentSession.peerConnection.getReceivers().forEach(receiver => {
      if (receiver.track) {
        receiver.track.stop();
      }
    });

    currentSession.peerConnection.close();
  }

  // Stop tab audio if active
  if (tabAudioStream) {
    tabAudioStream.getTracks().forEach(track => track.stop());
    tabAudioStream = null;
  }

  // Close audio context
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  // Remove event listeners
  if (currentSession?.session) {
    currentSession.session.removeAllListeners();
  }

  // Clear timers
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  log.debug('Session cleanup complete');
}

// Use in React component
useEffect(() => {
  return () => {
    cleanupSession();
  };
}, []);
```

---

### EC-011: AudioContext Suspended (Mobile Safari)
**Scenario:** AudioContext suspended by browser autoplay policy

**Trigger Conditions:**
- User hasn't interacted con page yet
- Mobile Safari aggressive power saving
- Background tab restrictions

**Expected Behavior:**
1. Detect `audioContext.state === 'suspended'`
2. Resume on user gesture: `audioContext.resume()`
3. Show prompt: "Tap to enable audio"
4. Retry audio processing dopo resume

**Recovery Strategy:**
```typescript
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}
```

**Implementation:**
```typescript
async function ensureAudioContextRunning(audioContext: AudioContext): Promise<void> {
  if (audioContext.state === 'suspended') {
    log.warn('AudioContext suspended. Waiting for user gesture...');

    // Show prompt to user
    toast.info('Tap anywhere to enable audio');

    // Wait for user interaction
    await new Promise<void>((resolve) => {
      const resumeAudio = async () => {
        await audioContext.resume();
        log.info('AudioContext resumed');
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
        resolve();
      };

      document.addEventListener('click', resumeAudio, { once: true });
      document.addEventListener('touchstart', resumeAudio, { once: true });
    });
  }
}
```

---

## 5. Concurrent Operations

### EC-012: Multiple Rapid Start Clicks
**Scenario:** User clicks "Start Session" multiple times quickly

**Trigger Conditions:**
- Button click durante `isStarting === true`
- Network latency causing perceived unresponsiveness

**Expected Behavior:**
1. First click sets `isStarting = true`
2. Subsequent clicks ignored con log: "Session start already in progress"
3. No duplicate sessions created
4. Button disabled durante start

**Prevention:**
```typescript
if (isStarting) {
  log.warn("Session start already in progress, ignoring duplicate request");
  return;
}
```

**Implementation:**
```typescript
async function toggleSession() {
  // Guard against concurrent calls
  if (isStarting) {
    log.warn("Session start already in progress, ignoring duplicate request");
    return;
  }

  if (isSessionActive) {
    // Stop session
    await stopSession();
    return;
  }

  // Start session
  setIsStarting(true);

  try {
    await startSession();
  } catch (error) {
    log.error('Failed to start session', error);
    toast.error('Failed to start session');
  } finally {
    setIsStarting(false);
  }
}
```

---

### EC-013: Resume Session Durante Active Session
**Scenario:** User tries to resume from history mentre session running

**Trigger Conditions:**
- Active session exists
- User clicks resume in history drawer

**Expected Behavior:**
1. Resume button disabled: `canResume={!isSessionActive}`
2. Tooltip: "Stop current session first"
3. No action taken on click

**Implementation:**
```typescript
function ResumeButton({ session }: { session: SessionHistory }) {
  const { isSessionActive } = useSession();

  return (
    <button
      disabled={isSessionActive}
      onClick={() => resumeSession(session)}
      title={isSessionActive ? 'Stop current session first' : 'Resume this conversation'}
      className={cn(
        'btn btn-sm',
        isSessionActive && 'btn-disabled cursor-not-allowed'
      )}
    >
      Resume
    </button>
  );
}
```

---

## 6. API-Specific Edge Cases

### EC-014: Deepgram WebSocket Connection Failure
**Scenario:** Cannot establish Deepgram WebSocket for Meeting Coach

**Trigger Conditions:**
- Invalid Deepgram API key
- Network firewall blocks WebSocket
- Deepgram service outage

**Expected Behavior:**
1. Connection attempt times out dopo 10s
2. Error toast: "Failed to connect to Deepgram"
3. Fallback: Offer transcript-only mode
4. Log detailed error for debugging

**Implementation:**
```typescript
async function connectToDeepgram(apiKey: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      'wss://api.deepgram.com/v1/listen?diarize=true&punctuate=true',
      ['token', apiKey]
    );

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Deepgram connection timeout'));
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      log.info('Deepgram WebSocket connected');
      resolve(ws);
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      log.error('Deepgram WebSocket error', error);
      reject(new Error('Failed to connect to Deepgram'));
    };
  });
}
```

---

### EC-015: Token Expiry During Long Session
**Scenario:** OpenAI ephemeral token expires dopo 60 secondi

**Trigger Conditions:**
- Session longer than 60 seconds
- Token not refreshed

**Expected Behavior:**
1. Monitor token expiry time
2. Refresh token proactively (at 50s mark)
3. Seamless continuation without interruption
4. Fallback: If refresh fails, graceful disconnect

**Implementation:**
```typescript
async function startSession() {
  let tokenExpiresAt: Date;

  async function refreshToken() {
    const { token, expires_at } = await fetchToken(apiKey);
    tokenExpiresAt = new Date(expires_at);

    // Schedule next refresh at 50s mark (10s before expiry)
    const refreshIn = tokenExpiresAt.getTime() - Date.now() - 10000;
    if (refreshIn > 0) {
      setTimeout(refreshToken, refreshIn);
    }

    return token;
  }

  const initialToken = await refreshToken();
  // Connect with initial token...
}
```

---

**Documento redatto per**: Riprogettazione architettura MyCoachPilot Free
**Data**: 2026-01-27
**Versione**: 1.0
