# API Contracts & Interfaces - MyCoachPilot Free

## 1. REST API Endpoints

### 1.1 POST /api/realtime/token

**Purpose:** Generate ephemeral token for OpenAI Realtime API

**Request Schema:**
```typescript
interface RealtimeTokenRequest {
  apiKey: string;              // OpenAI API key (sk-...)
  instructions?: string;       // System prompt per conversation mode
  isTranscriptOnly: boolean;   // true = transcription only
}
```

**Response (200 OK):**
```typescript
interface RealtimeTokenResponse {
  token: string;               // Ephemeral token (valid 60 seconds)
  expires_at: string;          // ISO 8601 timestamp
  mode: 'conversation' | 'transcript_only';
}
```

**Error Responses:**
- `400 Bad Request`: Missing API key
  ```json
  { "error": "API key required" }
  ```
- `401 Unauthorized`: Invalid API key from OpenAI
  ```json
  { "error": "Failed to generate token", "details": {...} }
  ```
- `500 Internal Server Error`: Server error
  ```json
  { "error": "Failed to generate token" }
  ```

**Rate Limits:** None (client-side rate limited by OpenAI key)

**Timeout:** 10 seconds

---

### 1.2 POST /api/deepgram/token

**Purpose:** Validate Deepgram API key per Meeting Coach

**Request Schema:**
```typescript
interface DeepgramTokenRequest {
  apiKey: string;  // Deepgram API key
}
```

**Response (200 OK):**
```typescript
interface DeepgramTokenResponse {
  valid: true;
}
```

**Error Responses:**
- `400`: Missing API key
- `401`: Invalid Deepgram key
- `500`: Server error

**Rate Limits:** 60 requests per minute

**Timeout:** 10 seconds

---

### 1.3 POST /api/coach-suggestion

**Purpose:** Generate AI coaching suggestions based on transcript

**Request Schema:**
```typescript
interface CoachSuggestionRequest {
  apiKey: string;              // OpenAI API key
  transcript: string;          // Last N segments formatted
  coachingStyle: 'diplomatic' | 'assertive' | 'analytical';
  templateId?: string;         // Optional template ID
}
```

**Response (200 OK):**
```typescript
interface CoachSuggestionResponse {
  suggestion: string | null;   // null = NO_SUGGESTION
}
```

**Error Responses:**
- `400`: Invalid request parameters
- `401`: Invalid OpenAI key
- `429`: Rate limit exceeded
  ```json
  { "error": "Rate limit exceeded", "retryAfter": 60 }
  ```
- `500`: OpenAI API error

**Rate Limits:** 10 requests per minute per key

**Timeout:** 10 seconds

---

## 2. React Hooks APIs

### 2.1 useSession

**Purpose:** Manage real-time session lifecycle and state

**Function Signature:**
```typescript
function useSession(): SessionHookResult

interface SessionHookResult {
  // State
  sessionId: string | null;
  isSessionActive: boolean;
  isStarting: boolean;
  messages: Message[];
  currentMode: SessionMode;
  sessionStartTime: string | null;
  templateId: string | null;
  resumedFromSession: ResumedSessionInfo | null;

  // Actions
  toggleSession: (tabAudioStream?: MediaStream | null) => Promise<void>;
  sendTextMessage: (text: string) => Promise<void>;
  sendImage: (imageData: string, prompt?: string) => Promise<void>;
  startThinkProcess: () => Promise<void>;
  saveConversation: () => Promise<void>;
  clearMessages: () => void;
  deleteMessage: (index: number) => void;
  loadResumedMessages: (msgs: Message[], info: ResumedSessionInfo, context?: string) => void;
  clearResumeState: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}
```

**Side Effects:**
- Reads/writes localStorage: `ai_config`, `custom_templates`
- Creates WebSocket connections a OpenAI
- Starts/stops media tracks
- Sets timers per inactivity (30min)
- Triggers session history auto-save on cleanup

**Re-render Triggers:**
- `isSessionActive` changes
- `messages` array updates
- `sessionId` changes
- `currentMode` changes

**Cleanup Behavior:**
```typescript
// On unmount o session stop:
1. Clear all timers
2. Close WebSocket connections
3. Stop all media tracks
4. Dispose AudioContext
5. Remove event listeners
6. Set messages to empty array
```

---

### 2.2 useTabAudioCapture

**Function Signature:**
```typescript
function useTabAudioCapture(): UseTabAudioCaptureResultExtended

interface UseTabAudioCaptureResultExtended {
  isCapturing: boolean;
  startTabCapture: () => Promise<MediaStream | null>;
  stopTabCapture: () => void;
  error: string | null;
  getTabAudioOnly: () => MediaStream | null;
  currentStream: MediaStream | null;
}
```

**Side Effects:**
- Calls `navigator.mediaDevices.getDisplayMedia`
- Creates MediaStream con video + audio tracks
- Adds `ended` event listener a video track
- Stops all tracks on cleanup

**Error Handling:**
```typescript
// NotAllowedError → "Permission denied. Please allow tab sharing with audio."
// Other errors → "Error capturing tab: {message}"
```

---

### 2.3 useSessionHistory

**Function Signature:**
```typescript
function useSessionHistory(): UseSessionHistoryResult

interface UseSessionHistoryResult {
  sessions: SessionHistoryPreview[];
  loadSession: (sessionId: string) => SessionHistory | null;
  saveSession: (params: SaveSessionParams) => void;
  deleteSession: (sessionId: string) => void;
  clearAllHistory: () => void;
  exportSession: (sessionId: string) => void;
  storageInfo: { count: number; maxCount: number };
  refreshSessions: () => void;
  getConversationSummary: (session: SessionHistory) => string;
}
```

**Storage:**
- localStorage key: `session_history`
- Max sessions: 20
- Auto-cleanup: Oldest sessions removed when limit exceeded

---

## 3. WebSocket Protocols

### 3.1 OpenAI Realtime WebSocket

**Connection URL:**
```
wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview
```

**Authentication:**
```typescript
{
  "type": "session.create",
  "token": "ephemeral_token_from_api"
}
```

**Session Configuration:**
```typescript
{
  "type": "session.update",
  "session": {
    "modalities": ["text", "audio"],
    "instructions": "system_prompt_here",
    "voice": "alloy",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "silence_duration_ms": 500
    }
  }
}
```

**Message Types (Client → Server):**
```typescript
// Send text message
{
  "type": "conversation.item.create",
  "item": {
    "type": "message",
    "role": "user",
    "content": [{ "type": "text", "text": "Hello" }]
  }
}

// Send audio chunk
{
  "type": "input_audio_buffer.append",
  "audio": "base64_pcm16_data"
}
```

**Message Types (Server → Client):**
```typescript
// Transcript received
{
  "type": "conversation.item.input_audio_transcription.completed",
  "transcript": "user speech text",
  "item_id": "msg_123"
}

// AI response (text)
{
  "type": "response.text.delta",
  "delta": "response text chunk"
}

// AI response (audio)
{
  "type": "response.audio.delta",
  "delta": "base64_pcm16_audio_chunk"
}
```

---

### 3.2 Deepgram WebSocket (Meeting Coach)

**Connection URL:**
```
wss://api.deepgram.com/v1/listen?diarize=true&punctuate=true&interim_results=true
```

**Authentication:**
```
Authorization: Token YOUR_DEEPGRAM_API_KEY
```

**Audio Streaming:**
```typescript
// Send audio chunk (binary data)
websocket.send(pcm16AudioBuffer);
```

**Response Format:**
```typescript
{
  "channel": {
    "alternatives": [{
      "transcript": "speaker text",
      "confidence": 0.95,
      "words": [
        {
          "word": "hello",
          "start": 0.5,
          "end": 0.8,
          "confidence": 0.98,
          "speaker": 0
        }
      ]
    }]
  },
  "is_final": true,
  "speech_final": true
}
```

---

## 4. localStorage Schema

### 4.1 ai_config
```typescript
{
  "openai_api_key": "sk-...",
  "mode": "conversation" | "transcript_only" | "meeting_coach",
  "selected_template_id": "general" | "interview" | "sales" | null,
  "selected_custom_template_id": "uuid" | null,
  "custom_instructions": "string" | null,
  "deepgram_api_key": "string",
  "meeting_coach_template": "general",
  "coaching_style": "diplomatic" | "assertive" | "analytical"
}
```

### 4.2 session_history
```typescript
[
  {
    "sessionId": "realtime-1706320000000",
    "startedAt": "2026-01-27T10:00:00.000Z",
    "endedAt": "2026-01-27T10:15:30.000Z",
    "durationSeconds": 930,
    "mode": "conversation",
    "messages": [
      { "role": "user", "content": "Hello" },
      { "role": "assistant", "content": "Hi there!" }
    ],
    "messageCount": 12,
    "title": "Conversation about project requirements",
    "templateId": "general"
  }
]
```

### 4.3 custom_templates
```typescript
[
  {
    "id": "uuid-1234",
    "name": "Custom Interview Coach",
    "category": "Interview",
    "description": "Specialized coaching for technical interviews",
    "system_prompt": "You are a technical interview coach...",
    "icon": "💼",
    "sort_order": 10,
    "createdAt": "2026-01-27T10:00:00.000Z"
  }
]
```

### 4.4 meeting_coach_history
```typescript
[
  {
    "id": "meeting-1706320000000",
    "title": "Team standup - Jan 27",
    "date": "2026-01-27T10:00:00.000Z",
    "duration": 1800,
    "speakers": [
      { "id": 0, "label": "Tu", "isUser": true, "wordCount": 450 },
      { "id": 1, "label": "Speaker 1", "isUser": false, "wordCount": 320 }
    ],
    "segments": [
      {
        "id": "seg_1",
        "speaker": 0,
        "speakerLabel": "Tu",
        "text": "Good morning everyone",
        "startTime": 0.0,
        "endTime": 1.5,
        "confidence": 0.98,
        "isFinal": true,
        "words": [...],
        "timestamp": "2026-01-27T10:00:00.000Z"
      }
    ],
    "suggestions": [
      {
        "id": "sugg_1",
        "text": "Consider being more specific about timelines",
        "context": "You said: 'We'll finish soon'",
        "timestamp": "2026-01-27T10:05:00.000Z",
        "templateId": "general",
        "coachingStyle": "diplomatic",
        "isDismissed": false,
        "wasCopied": false,
        "triggerSegmentId": "seg_15"
      }
    ],
    "templateId": "general",
    "coachingStyle": "diplomatic",
    "totalWords": 2450,
    "totalSpeakers": 4
  }
]
```

---

## 5. Event Emitters & Listeners

### 5.1 Session Events

```typescript
// Session lifecycle events
session.on('connected', () => void);
session.on('disconnected', (reason: string) => void);
session.on('error', (error: SessionError) => void);

// Message events
session.on('message', (message: Message) => void);
session.on('transcript', (text: string, isFinal: boolean) => void);
session.on('audio', (audioChunk: ArrayBuffer) => void);

// State events
session.on('state_change', (newState: SessionState) => void);
session.on('inactivity_warning', (secondsRemaining: number) => void);
```

### 5.2 Meeting Coach Events

```typescript
// Transcript events
meetingCoach.on('segment', (segment: TranscriptSegment) => void);
meetingCoach.on('speaker_detected', (speakerId: number) => void);

// Suggestion events
meetingCoach.on('suggestion', (suggestion: CoachingSuggestion) => void);
meetingCoach.on('suggestion_dismissed', (suggestionId: string) => void);

// Connection events
meetingCoach.on('deepgram_connected', () => void);
meetingCoach.on('deepgram_error', (error: DeepgramError) => void);
```

---

**Documento redatto per**: Riprogettazione architettura MyCoachPilot Free
**Data**: 2026-01-27
**Versione**: 1.0
