# Quality Requirements - MyCoachPilot Free

## 1. Testing

### 1.1 Unit Tests
**Coverage Target:** 80% per critical paths

**Critical Paths:**
- `useSession.toggleSession()` - session lifecycle
- `sessionHistoryStorage.save()` - data persistence
- `filterMessagesForHistory()` - message filtering
- `calculateDuration()` - timestamp math
- `generateSessionTitle()` - title generation

**Test Framework:** Jest + React Testing Library

**Sample Test:**
```typescript
describe('useSession', () => {
  it('should start session con valid config', async () => {
    const { result } = renderHook(() => useSession());

    localStorage.setItem('ai_config', JSON.stringify({
      openai_api_key: 'sk-test',
      mode: 'conversation',
      selected_template_id: 'default'
    }));

    await act(async () => {
      await result.current.toggleSession();
    });

    expect(result.current.isSessionActive).toBe(true);
    expect(result.current.sessionId).toMatch(/^realtime-\d+$/);
  });

  it('should reject invalid API key', async () => {
    const { result } = renderHook(() => useSession());

    localStorage.setItem('ai_config', JSON.stringify({
      openai_api_key: 'invalid-key',
      mode: 'conversation',
      selected_template_id: 'default'
    }));

    await expect(result.current.toggleSession()).rejects.toThrow();
  });
});
```

---

### 1.2 Integration Tests
**Scenarios:**
1. End-to-end session flow: Start → Send message → Receive response → Stop → Auto-save
2. Resume flow: Load history → Resume → Start new session con context
3. Tab audio flow: Capture tab → Mix con mic → Stream to OpenAI
4. Meeting Coach flow: Start → Transcribe → Generate suggestion → Save history

**Tools:** Playwright per browser automation

**Sample Test:**
```typescript
test('complete conversation flow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:13000');

  // Configure API key
  await page.click('[data-testid="settings-button"]');
  await page.fill('[data-testid="api-key-input"]', process.env.OPENAI_API_KEY);
  await page.click('[data-testid="save-button"]');

  // Start session
  await page.click('[data-testid="start-button"]');
  await page.waitForSelector('[data-testid="connected-indicator"]');

  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello');
  await page.click('[data-testid="send-button"]');

  // Wait for response
  await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 5000 });

  // Stop session
  await page.click('[data-testid="stop-button"]');

  // Verify session in history
  await page.click('[data-testid="history-button"]');
  await expect(page.locator('[data-testid="history-item"]').first()).toBeVisible();
});
```

---

### 1.3 E2E Test Cases
1. **Happy Path Conversation:**
   - Configure API key
   - Select template
   - Start session (verify connection entro 3s)
   - Send text "Hello"
   - Verify AI response appears
   - Stop session
   - Verify session in history

2. **Tab Audio Capture:**
   - Start session
   - Click tab audio capture
   - Select tab con audio checkbox checked
   - Verify "with tab audio" indicator
   - Speak into mic + play tab audio
   - Verify mixed audio processed
   - Stop session

3. **Error Recovery:**
   - Configure invalid API key
   - Attempt start
   - Verify error toast
   - Update to valid key
   - Retry e succeed

---

## 2. Performance

### 2.1 Latency Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Voice → Transcript | < 500ms | 1000ms |
| Text message send | < 200ms | 500ms |
| Session start | < 3s | 5s |
| Session stop | < 1s | 2s |
| History load | < 500ms | 1000ms |
| Screenshot capture | < 2s | 5s |
| Tab audio start | < 3s | 5s |

**Measurement:**
```typescript
// Performance monitoring
class PerformanceMonitor {
  static measure(label: string, fn: () => Promise<any>) {
    const start = performance.now();

    return fn().finally(() => {
      const duration = performance.now() - start;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

      // Send to analytics if available
      if (window.analytics) {
        window.analytics.track('Performance', {
          operation: label,
          duration_ms: duration
        });
      }
    });
  }
}

// Usage
await PerformanceMonitor.measure('Session Start', () => toggleSession());
```

---

### 2.2 Memory Usage Limits

| Resource | Limit | Action on Exceed |
|----------|-------|------------------|
| Messages in memory | 100 | Drop oldest |
| Session history | 20 sessions | Delete oldest |
| localStorage total | 5MB | Error toast |
| AudioContext instances | 1 active | Reuse existing |
| MediaStream tracks | 4 max | Stop unused before creating new |

**Monitoring:**
```typescript
// Memory usage monitoring
function checkMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / 1048576;
    const totalMB = memory.jsHeapSizeLimit / 1048576;
    const percentage = (usedMB / totalMB) * 100;

    log.debug('Memory usage', {
      used: `${usedMB.toFixed(2)} MB`,
      total: `${totalMB.toFixed(2)} MB`,
      percentage: `${percentage.toFixed(2)}%`
    });

    if (percentage > 80) {
      log.warn('High memory usage detected');
      // Trigger cleanup
      cleanupOldData();
    }
  }
}

// Run periodically
setInterval(checkMemoryUsage, 60000); // Every minute
```

---

### 2.3 CPU Usage Constraints

- Audio processing: < 10% CPU average
- UI rendering: 60 FPS maintained
- Background tabs: Suspend audio processing
- Long sessions: No progressive slowdown

**Optimization Techniques:**
```typescript
// Use AudioWorklet for efficient audio processing
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // Efficient audio processing
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i];
      }
    }

    return true;
  }
}

// Lazy loading for UI components
const MeetingCoach = lazy(() => import('./components/MeetingCoach'));
const Settings = lazy(() => import('./components/Settings'));

// Debounce expensive operations
const debouncedTranscriptUpdate = debounce((text: string) => {
  updateTranscript(text);
}, 100);
```

---

### 2.4 Network Bandwidth Requirements

| Feature | Bandwidth | Codec |
|---------|-----------|-------|
| Voice (WebRTC) | 32-64 kbps | Opus |
| Transcription | 128 kbps | PCM16 24kHz |
| Tab audio | 128 kbps | PCM16 16kHz |

**Adaptive Quality:**
```typescript
// Monitor network quality and adjust
function monitorNetworkQuality() {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;

    connection.addEventListener('change', () => {
      const effectiveType = connection.effectiveType;

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          log.warn('Slow connection detected');
          // Lower audio quality
          updateAudioQuality('low');
          break;
        case '3g':
          updateAudioQuality('medium');
          break;
        case '4g':
          updateAudioQuality('high');
          break;
      }
    });
  }
}
```

---

## 3. Security

### 3.1 API Key Storage Strategy

**Storage:** localStorage (client-side only)
- Key: `ai_config.openai_api_key`
- Format: String (masked in UI come password field)
- Encryption: None (browser security boundary)

**Transmission:**
- HTTPS required per all API calls
- API key sent in Authorization header
- Ephemeral tokens used per WebSocket (60s expiry)
- Never logged o exposed in error messages

**Recommendations:**
- Users should use restricted API keys
- Regular key rotation suggested
- Warning if key detected in browser DevTools

**Implementation:**
```typescript
// Mask API key in UI
function maskApiKey(key: string): string {
  if (key.length < 12) return '***';
  return key.slice(0, 7) + '...' + key.slice(-4);
}

// Validate API key format
function isValidApiKey(key: string): boolean {
  return key.startsWith('sk-') && key.length > 20;
}

// Never log API keys
class SecureLogger {
  static log(message: string, data?: any) {
    if (data) {
      // Remove sensitive fields
      const sanitized = { ...data };
      if ('apiKey' in sanitized) delete sanitized.apiKey;
      if ('openai_api_key' in sanitized) delete sanitized.openai_api_key;

      console.log(message, sanitized);
    } else {
      console.log(message);
    }
  }
}
```

---

### 3.2 HTTPS Requirement

**Enforcement:**
- Production deployment must use HTTPS
- WebRTC requires secure context
- `getDisplayMedia` requires HTTPS (except localhost)

**Development:**
- localhost exempted from HTTPS requirement

**Validation:**
```typescript
function enforceHTTPS() {
  if (process.env.NODE_ENV === 'production' && location.protocol !== 'https:') {
    // Redirect to HTTPS
    location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
  }
}
```

---

### 3.3 XSS Prevention

**Measures:**
1. React auto-escapes all rendered content
2. No `dangerouslySetInnerHTML` used
3. Message content sanitized before display
4. No inline `eval()` o `Function()` usage

**Validation:**
- All user input validated before storage
- Message content: HTML-escaped
- File uploads: Type validation before processing

**Implementation:**
```typescript
// Sanitize user input
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate file upload
function validateFileUpload(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type');
  }

  if (file.size > maxSize) {
    throw new Error('File too large');
  }

  return true;
}
```

---

## 4. Accessibility

### 4.1 WCAG 2.1 AA Compliance

**Requirements:**
- All interactive elements keyboard accessible
- Focus indicators visible (outline on focus)
- Color contrast ratio ≥ 4.5:1 per text
- Form inputs have associated labels
- Error messages announced to screen readers

**Implementation:**
```typescript
// Focus management
function useFocusTrap(elementRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [elementRef]);
}
```

---

### 4.2 Screen Reader Support

**Semantic HTML:**
- Use `<button>`, `<nav>`, `<main>`, `<section>`
- ARIA labels per icon-only buttons
- Role attributes: `role="dialog"` per modals
- Live regions: `aria-live="polite"` per status updates

**Announcements:**
- Session start: "Session started"
- Message received: "New message from assistant"
- Error: "Error: {message}"

**Implementation:**
```typescript
// Screen reader announcements
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Usage
announceToScreenReader('Session started successfully');
```

---

### 4.3 Color Contrast Ratios

| Element | Foreground | Background | Ratio |
|---------|------------|------------|-------|
| Body text | #e2e8f0 | #020617 | 15.8:1 ✅ |
| Primary button | #ffffff | #3b82f6 | 4.6:1 ✅ |
| Error text | #fca5a5 | #020617 | 7.2:1 ✅ |
| Disabled button | #64748b | #1e293b | 2.8:1 ❌ |

**Validation:**
```typescript
// Check contrast ratio
function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string) => {
    // Convert hex to RGB
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Usage
const ratio = getContrastRatio('#e2e8f0', '#020617');
const isCompliant = ratio >= 4.5; // WCAG AA for normal text
```

---

## 5. Browser Support

### 5.1 Full Support (All Features)

**Chrome 90+ / Edge 90+:**
- WebRTC ✅
- Tab audio capture ✅
- Screen capture ✅
- Picture-in-Picture ✅
- AudioContext ✅
- localStorage ✅

---

### 5.2 Partial Support

**Firefox 90+:**
- WebRTC ✅
- Tab audio capture ⚠️ (limited)
- Screen capture ✅
- Picture-in-Picture ⚠️ (video only)
- AudioContext ✅
- localStorage ✅

---

### 5.3 Basic Support

**Safari 14+:**
- WebRTC ✅
- Tab audio capture ❌
- Screen capture ⚠️ (limited)
- Picture-in-Picture ❌
- AudioContext ⚠️ (autoplay restrictions)
- localStorage ✅

---

### 5.4 Feature Detection

```typescript
interface BrowserSupport {
  webrtc: boolean;
  tabAudio: boolean;
  screenCapture: boolean;
  pictureInPicture: boolean;
  audioContext: boolean;
  localStorage: boolean;
}

function detectBrowserSupport(): BrowserSupport {
  return {
    webrtc: 'RTCPeerConnection' in window,
    tabAudio: 'getDisplayMedia' in (navigator.mediaDevices || {}),
    screenCapture: 'getDisplayMedia' in (navigator.mediaDevices || {}),
    pictureInPicture: 'documentPictureInPicture' in window,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    localStorage: (() => {
      try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })()
  };
}

// Show warnings for missing features
function showBrowserWarnings(support: BrowserSupport) {
  if (!support.webrtc) {
    toast.error('WebRTC not supported. Core features will not work.');
  }

  if (!support.tabAudio) {
    toast.warning('Tab audio capture not available. Use Chrome/Edge for full features.');
  }

  if (!support.localStorage) {
    toast.error('localStorage not available. Settings will not persist.');
  }
}
```

---

**Documento redatto per**: Riprogettazione architettura MyCoachPilot Free
**Data**: 2026-01-27
**Versione**: 1.0
