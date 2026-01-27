# Data Models - MyCoachPilot Free

## 1. Core Message Types

```typescript
type MessageRole = 'user' | 'assistant' | 'system' | 'log' | 'transcript';

interface Message {
  role: MessageRole;
  content: string;
  id?: string;  // Optional tracking ID
}
```

**Validation Rules:**
- `role`: Required, one of 5 enum values
- `content`: Required, min 1 char, max 50,000 chars
- `id`: Optional, UUID format if provided

**Storage:** In-memory array, max 100 messages per session

**Relationships:**
```
Session
  └─ messages: Message[]
       └─ role: MessageRole
```

---

## 2. Session Models

### 2.1 SessionHistory

```typescript
interface SessionHistory {
  sessionId: string;           // Format: "realtime-{timestamp}"
  startedAt: string;           // ISO 8601 timestamp
  endedAt: string;             // ISO 8601 timestamp
  durationSeconds: number;     // Calculated
  mode: SessionMode;
  messages: Message[];         // Filtered (no system markers)
  messageCount: number;
  title?: string;              // Auto-generated (max 50 chars)
  templateId?: string;
}
```

**Storage:**
- Location: localStorage key `session_history`
- Format: JSON array
- Max entries: 20
- Size constraint: ~5MB total localStorage quota
- Index: By sessionId (unique)

**Validation:**
```typescript
function validateSessionHistory(session: SessionHistory): boolean {
  return (
    session.sessionId.startsWith('realtime-') &&
    session.durationSeconds >= 0 &&
    session.messages.length === session.messageCount &&
    ['conversation', 'transcript_only', 'meeting_coach'].includes(session.mode)
  );
}
```

---

### 2.2 SessionHistoryPreview

```typescript
interface SessionHistoryPreview {
  sessionId: string;
  title: string;
  startedAt: string;
  durationSeconds: number;
  messageCount: number;
  mode: SessionMode;
}
```

**Purpose:** Lightweight representation per history list display

**Derivation:**
```typescript
function toPreview(session: SessionHistory): SessionHistoryPreview {
  return {
    sessionId: session.sessionId,
    title: session.title || 'Untitled Session',
    startedAt: session.startedAt,
    durationSeconds: session.durationSeconds,
    messageCount: session.messageCount,
    mode: session.mode
  };
}
```

---

### 2.3 ResumedSessionInfo

```typescript
interface ResumedSessionInfo {
  originalSessionId: string;
  originalTitle?: string;
  resumedAt: string;
  messageCount: number;
}
```

**Purpose:** Metadata per displaying resume banner

**Storage:** In-memory only (not persisted)

**Usage:**
```typescript
// When resuming a session
const resumeInfo: ResumedSessionInfo = {
  originalSessionId: oldSession.sessionId,
  originalTitle: oldSession.title,
  resumedAt: new Date().toISOString(),
  messageCount: oldSession.messageCount
};
```

---

## 3. Configuration Models

### 3.1 AIConfig

```typescript
interface AIConfig {
  openai_api_key: string;
  mode: SessionMode;
  selected_template_id: string | null;
  selected_custom_template_id: string | null;
  custom_instructions: string | null;
  deepgram_api_key: string;
  meeting_coach_template: string;
  coaching_style: CoachingStyle;
}

type SessionMode = 'conversation' | 'transcript_only' | 'meeting_coach';
type CoachingStyle = 'diplomatic' | 'assertive' | 'analytical';
```

**Storage:**
- Location: localStorage key `ai_config`
- Format: JSON object
- Validation:
  - `openai_api_key`: Required, starts con "sk-"
  - `mode`: Required, enum validation
  - Template: Required per conversation mode

**Validation:**
```typescript
function validateAIConfig(config: AIConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.openai_api_key?.startsWith('sk-')) {
    errors.push('Invalid OpenAI API key format');
  }

  if (config.mode === 'conversation' && !config.selected_template_id && !config.selected_custom_template_id) {
    errors.push('Template required for conversation mode');
  }

  if (config.mode === 'meeting_coach' && !config.deepgram_api_key) {
    errors.push('Deepgram API key required for Meeting Coach mode');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

### 3.2 Template

```typescript
interface Template {
  id: string;
  name: string;                // Max 100 chars
  category: string;
  description: string;         // Max 500 chars
  system_prompt: string;       // Max 5000 chars
  icon?: string;
  sort_order?: number;
}
```

**Storage:**
- System templates: Hardcoded in `lib/templates.ts`
- Custom templates: localStorage key `custom_templates`, JSON array

**Predefined Templates:**
```typescript
const PREDEFINED_TEMPLATES = [
  {
    id: 'general',
    name: 'General Meeting Coach',
    category: 'General',
    description: 'Balanced coaching for any type of meeting',
    system_prompt: '...',
    icon: '🤖',
    sort_order: 1
  },
  {
    id: 'interview',
    name: 'Interview Coach',
    category: 'Career',
    description: 'Help ace job interviews with structured responses',
    system_prompt: '...',
    icon: '💼',
    sort_order: 2
  },
  {
    id: 'sales',
    name: 'Sales Coach',
    category: 'Business',
    description: 'Overcome objections and close deals',
    system_prompt: '...',
    icon: '📊',
    sort_order: 3
  },
  {
    id: 'presentation',
    name: 'Presentation Coach',
    category: 'Public Speaking',
    description: 'Deliver impactful presentations and talks',
    system_prompt: '...',
    icon: '🎤',
    sort_order: 4
  }
];
```

---

### 3.3 CoachingTemplate (Meeting Coach)

```typescript
interface CoachingTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isPredefined: boolean;
  createdAt: string;
}
```

**System Prompt Structure:**
```typescript
function buildSystemPrompt(templateId: string, coachingStyle: CoachingStyle): string {
  const template = getTemplateById(templateId);
  const styleModifier = COACHING_STYLE_MODIFIERS[coachingStyle];

  return `${template.systemPrompt}\n\n${styleModifier}`;
}

const COACHING_STYLE_MODIFIERS: Record<CoachingStyle, string> = {
  diplomatic: `Style: Be diplomatic and tactful. Frame suggestions gently...`,
  assertive: `Style: Be direct and assertive. Use clear, action-oriented language...`,
  analytical: `Style: Be analytical and data-driven. Provide logical reasoning...`
};
```

---

## 4. Meeting Coach Models

### 4.1 TranscriptSegment

```typescript
interface TranscriptSegment {
  id: string;
  speaker: number;             // Speaker index (0, 1, 2, ...)
  speakerLabel: string;        // "Speaker 0", "Tu"
  text: string;
  startTime: number;           // Seconds
  endTime: number;
  confidence: number;          // 0.0 - 1.0
  isFinal: boolean;
  words: TranscriptWord[];
  timestamp: string;
}

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker: number;
}
```

**Storage:**
- In-memory durante session
- Saved a MeetingHistoryItem on session end
- localStorage key: `meeting_coach_history`

**Size Constraints:**
- Max 1000 segments per session
- Max 10,000 words per session

**Derivation:**
```typescript
function createSegmentFromDeepgram(result: DeepgramResult): TranscriptSegment {
  const alternative = result.channel.alternatives[0];
  const firstWord = alternative.words[0];
  const lastWord = alternative.words[alternative.words.length - 1];

  return {
    id: `seg_${Date.now()}_${Math.random()}`,
    speaker: firstWord.speaker,
    speakerLabel: `Speaker ${firstWord.speaker}`,
    text: alternative.transcript,
    startTime: firstWord.start,
    endTime: lastWord.end,
    confidence: alternative.confidence,
    isFinal: result.is_final,
    words: alternative.words.map(w => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
      speaker: w.speaker
    })),
    timestamp: new Date().toISOString()
  };
}
```

---

### 4.2 Speaker

```typescript
interface Speaker {
  id: number;                  // Speaker index from diarization
  label: string;               // "Speaker 0", "Tu", custom name
  isUser: boolean;             // Marked by user
  wordCount: number;
  segmentCount: number;
  totalDuration: number;       // Seconds
  averageConfidence: number;
}
```

**Aggregation:**
```typescript
function aggregateSpeakerStats(segments: TranscriptSegment[]): Speaker[] {
  const speakerMap = new Map<number, Speaker>();

  segments.forEach(segment => {
    if (!speakerMap.has(segment.speaker)) {
      speakerMap.set(segment.speaker, {
        id: segment.speaker,
        label: segment.speakerLabel,
        isUser: false,
        wordCount: 0,
        segmentCount: 0,
        totalDuration: 0,
        averageConfidence: 0
      });
    }

    const speaker = speakerMap.get(segment.speaker)!;
    speaker.wordCount += segment.words.length;
    speaker.segmentCount++;
    speaker.totalDuration += segment.endTime - segment.startTime;
  });

  // Calculate average confidence
  speakerMap.forEach(speaker => {
    const speakerSegments = segments.filter(s => s.speaker === speaker.id);
    speaker.averageConfidence =
      speakerSegments.reduce((sum, s) => sum + s.confidence, 0) / speakerSegments.length;
  });

  return Array.from(speakerMap.values());
}
```

---

### 4.3 CoachingSuggestion

```typescript
interface CoachingSuggestion {
  id: string;
  text: string;
  context: string;
  timestamp: string;
  templateId: string;
  coachingStyle: CoachingStyle;
  isDismissed: boolean;
  wasCopied: boolean;
  triggerSegmentId: string;
}
```

**Generation:**
```typescript
async function generateSuggestion(
  segments: TranscriptSegment[],
  templateId: string,
  coachingStyle: CoachingStyle
): Promise<CoachingSuggestion | null> {
  const recentSegments = segments.slice(-10); // Last 10 segments
  const transcript = recentSegments.map(s => `${s.speakerLabel}: ${s.text}`).join('\n');

  const response = await fetch('/api/coach-suggestion', {
    method: 'POST',
    body: JSON.stringify({ transcript, templateId, coachingStyle })
  });

  const { suggestion } = await response.json();

  if (!suggestion || suggestion === 'NO_SUGGESTION') {
    return null;
  }

  return {
    id: `sugg_${Date.now()}`,
    text: suggestion,
    context: recentSegments[recentSegments.length - 1].text,
    timestamp: new Date().toISOString(),
    templateId,
    coachingStyle,
    isDismissed: false,
    wasCopied: false,
    triggerSegmentId: recentSegments[recentSegments.length - 1].id
  };
}
```

---

### 4.4 MeetingHistoryItem

```typescript
interface MeetingHistoryItem {
  id: string;
  title: string;
  date: string;
  duration: number;
  speakers: Speaker[];
  segments: TranscriptSegment[];
  suggestions: CoachingSuggestion[];
  templateId: string;
  coachingStyle: CoachingStyle;
  totalWords: number;
  totalSpeakers: number;
  exported?: {
    format: 'json' | 'txt';
    timestamp: string;
  };
}
```

**Storage:**
- Location: localStorage key `meeting_coach_history`
- Format: JSON array
- Max entries: 100

**Creation:**
```typescript
function createMeetingHistoryItem(
  segments: TranscriptSegment[],
  suggestions: CoachingSuggestion[],
  startTime: Date,
  endTime: Date,
  templateId: string,
  coachingStyle: CoachingStyle
): MeetingHistoryItem {
  const speakers = aggregateSpeakerStats(segments);
  const totalWords = speakers.reduce((sum, s) => sum + s.wordCount, 0);

  return {
    id: `meeting_${startTime.getTime()}`,
    title: generateMeetingTitle(segments),
    date: startTime.toISOString(),
    duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
    speakers,
    segments,
    suggestions,
    templateId,
    coachingStyle,
    totalWords,
    totalSpeakers: speakers.length
  };
}

function generateMeetingTitle(segments: TranscriptSegment[]): string {
  const firstSegment = segments[0];
  if (!firstSegment) return 'Untitled Meeting';

  const title = firstSegment.text.substring(0, 50);
  return title + (firstSegment.text.length > 50 ? '...' : '');
}
```

---

## 5. Error Models

```typescript
type ErrorType = 'CLIENT_ERROR' | 'NETWORK_ERROR' | 'API_ERROR';

interface SessionError {
  type: ErrorType;
  code: string;
  message: string;
  timestamp: string;
  details?: any;
}

interface ClientError extends SessionError {
  type: 'CLIENT_ERROR';
  code: 'NO_API_KEY' | 'NO_AUDIO_TRACK' | 'BROWSER_NOT_SUPPORTED' | 'PERMISSION_DENIED';
  userMessage: string;
}

interface NetworkError extends SessionError {
  type: 'NETWORK_ERROR';
  code: 'CONNECTION_TIMEOUT' | 'CONNECTION_LOST' | 'REQUEST_FAILED';
  retryable: boolean;
}

interface APIError extends SessionError {
  type: 'API_ERROR';
  provider: 'deepgram' | 'openai';
  code: 'INVALID_API_KEY' | 'RATE_LIMIT' | 'SERVER_ERROR' | 'BAD_REQUEST';
  httpStatus?: number;
  retryAfter?: number;
}
```

**Error Factory:**
```typescript
function createClientError(code: ClientError['code'], details?: any): ClientError {
  const errorMessages: Record<ClientError['code'], string> = {
    NO_API_KEY: 'Please configure your OpenAI API Key in Settings',
    NO_AUDIO_TRACK: 'No audio track captured. Make sure to check "Share tab audio"',
    BROWSER_NOT_SUPPORTED: 'This browser has limited support. Please use Chrome 90+ or Edge 90+',
    PERMISSION_DENIED: 'Permission denied. Please allow microphone access in browser settings'
  };

  return {
    type: 'CLIENT_ERROR',
    code,
    message: errorMessages[code],
    userMessage: errorMessages[code],
    timestamp: new Date().toISOString(),
    details
  };
}

function createAPIError(
  provider: 'deepgram' | 'openai',
  code: APIError['code'],
  httpStatus?: number,
  details?: any
): APIError {
  return {
    type: 'API_ERROR',
    provider,
    code,
    message: `${provider} API error: ${code}`,
    timestamp: new Date().toISOString(),
    httpStatus,
    details
  };
}
```

---

## 6. Enums & Constants

```typescript
// Message roles
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  LOG: 'log',
  TRANSCRIPT: 'transcript'
} as const;

// Session modes
export const SESSION_MODES = {
  CONVERSATION: 'conversation',
  TRANSCRIPT_ONLY: 'transcript_only',
  MEETING_COACH: 'meeting_coach'
} as const;

// Coaching styles
export const COACHING_STYLES = {
  DIPLOMATIC: 'diplomatic',
  ASSERTIVE: 'assertive',
  ANALYTICAL: 'analytical'
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AI_CONFIG: 'ai_config',
  SESSION_HISTORY: 'session_history',
  CUSTOM_TEMPLATES: 'custom_templates',
  MEETING_COACH_HISTORY: 'meeting_coach_history',
  ONBOARDING_COMPLETED: 'onboarding_completed'
} as const;

// Limits
export const LIMITS = {
  MAX_MESSAGES_IN_MEMORY: 100,
  MAX_MESSAGE_LENGTH: 50000,
  MAX_SESSIONS_STORED: 20,
  MAX_MEETING_SESSIONS_STORED: 100,
  MAX_TEMPLATE_NAME_LENGTH: 100,
  MAX_TEMPLATE_DESCRIPTION_LENGTH: 500,
  MAX_TEMPLATE_PROMPT_LENGTH: 5000,
  MAX_FILE_SIZE_MB: 10,
  MAX_SEGMENTS_PER_SESSION: 1000,
  MAX_WORDS_PER_SESSION: 10000
} as const;
```

---

**Documento redatto per**: Riprogettazione architettura MyCoachPilot Free
**Data**: 2026-01-27
**Versione**: 1.0
