import { ok, err, type Result } from '@domain/shared';

import type { SessionRepositoryPort, SessionHistoryEntry } from '@application/ports';

import { STORAGE_KEYS, STORAGE_LIMITS } from './storageKeys';

/**
 * LocalStorage Session Repository
 * Persists session history to browser localStorage
 */
export class LocalStorageSessionRepository implements SessionRepositoryPort {
  save(entry: SessionHistoryEntry): Promise<Result<void, Error>> {
    try {
      const history = this.loadHistory();

      // Add new entry
      history.unshift(entry);

      // Trim based on mode
      const maxSessions = entry.session.mode === 'meeting_coach'
        ? STORAGE_LIMITS.MAX_MEETING_COACH_SESSIONS
        : STORAGE_LIMITS.MAX_CONVERSATION_SESSIONS;

      // Keep only sessions of the same mode up to the limit
      const filtered = history.filter((h) => h.session.mode === entry.session.mode);
      if (filtered.length > maxSessions) {
        // Remove oldest sessions of this mode
        const excess = filtered.slice(maxSessions);
        const excessIds = new Set(excess.map((e) => e.session.id));
        const newHistory = history.filter((h) =>
          h.session.mode !== entry.session.mode || !excessIds.has(h.session.id)
        );
        this.saveHistory(newHistory);
      } else {
        this.saveHistory(history);
      }

      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to save session')));
    }
  }

  getById(sessionId: string): Promise<Result<SessionHistoryEntry | null, Error>> {
    try {
      const history = this.loadHistory();
      const entry = history.find((h) => h.session.id === sessionId);
      return Promise.resolve(ok(entry ?? null));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to get session')));
    }
  }

  getAll(): Promise<Result<SessionHistoryEntry[], Error>> {
    try {
      const history = this.loadHistory();
      return Promise.resolve(ok(history));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to get sessions')));
    }
  }

  delete(sessionId: string): Promise<Result<void, Error>> {
    try {
      const history = this.loadHistory();
      const filtered = history.filter((h) => h.session.id !== sessionId);
      this.saveHistory(filtered);
      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to delete session')));
    }
  }

  clearAll(): Promise<Result<void, Error>> {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_HISTORY);
      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to clear sessions')));
    }
  }

  count(): Promise<Result<number, Error>> {
    try {
      const history = this.loadHistory();
      return Promise.resolve(ok(history.length));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to count sessions')));
    }
  }

  async exportAsJson(sessionId: string): Promise<Result<string, Error>> {
    try {
      const result = await this.getById(sessionId);
      if (!result.isOk()) {
        return err(result.unwrapErr());
      }

      const entry = result.unwrap();
      if (!entry) {
        return err(new Error('Session not found'));
      }

      return ok(JSON.stringify(entry, null, 2));
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to export session'));
    }
  }

  async exportAsText(sessionId: string): Promise<Result<string, Error>> {
    try {
      const result = await this.getById(sessionId);
      if (!result.isOk()) {
        return err(result.unwrapErr());
      }

      const entry = result.unwrap();
      if (!entry) {
        return err(new Error('Session not found'));
      }

      let text = `Session: ${entry.session.id}\n`;
      text += `Mode: ${entry.session.mode}\n`;
      text += `Started: ${entry.session.startedAt ? String(entry.session.startedAt) : 'N/A'}\n`;
      text += `Ended: ${entry.session.endedAt ? String(entry.session.endedAt) : 'N/A'}\n`;
      text += '\n--- Transcript ---\n\n';

      if (entry.session.mode === 'meeting_coach') {
        // Format with speaker labels
        for (const segment of entry.segments) {
          const speaker = entry.speakers.find((s) => s.id === segment.speakerId);
          const speakerName = speaker?.name ?? (speaker?.isUser ? 'You' : `Speaker ${String(segment.speakerId)}`);
          text += `[${speakerName}]: ${segment.text}\n`;
        }
      } else {
        // Format messages
        for (const message of entry.messages) {
          const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
          text += `[${role}]: ${message.content}\n`;
        }
      }

      if (entry.suggestions.length > 0) {
        text += '\n--- Coaching Suggestions ---\n\n';
        for (const suggestion of entry.suggestions) {
          text += `- [${suggestion.type}] ${suggestion.content}\n`;
        }
      }

      return ok(text);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to export session'));
    }
  }

  private loadHistory(): SessionHistoryEntry[] {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
    if (!data) return [];

    try {
      return JSON.parse(data) as SessionHistoryEntry[];
    } catch {
      return [];
    }
  }

  private saveHistory(history: SessionHistoryEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));
  }
}
