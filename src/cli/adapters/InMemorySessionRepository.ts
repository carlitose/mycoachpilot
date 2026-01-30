import type { SessionRepositoryPort, SessionHistoryEntry } from '../../application/ports/SessionRepositoryPort';
import { ok, err } from '../../domain/shared/Result';
import type { Result } from '../../domain/shared/Result';

export class InMemorySessionRepository implements SessionRepositoryPort {
  private sessions = new Map<string, SessionHistoryEntry>();

  save(entry: SessionHistoryEntry): Promise<Result<void, Error>> {
    this.sessions.set(entry.session.id, entry);
    return Promise.resolve(ok(undefined));
  }

  getById(sessionId: string): Promise<Result<SessionHistoryEntry | null, Error>> {
    return Promise.resolve(ok(this.sessions.get(sessionId) ?? null));
  }

  getAll(): Promise<Result<SessionHistoryEntry[], Error>> {
    return Promise.resolve(ok(Array.from(this.sessions.values())));
  }

  delete(sessionId: string): Promise<Result<void, Error>> {
    this.sessions.delete(sessionId);
    return Promise.resolve(ok(undefined));
  }

  clearAll(): Promise<Result<void, Error>> {
    this.sessions.clear();
    return Promise.resolve(ok(undefined));
  }

  count(): Promise<Result<number, Error>> {
    return Promise.resolve(ok(this.sessions.size));
  }

  exportAsJson(sessionId: string): Promise<Result<string, Error>> {
    const entry = this.sessions.get(sessionId);
    if (!entry) return Promise.resolve(err(new Error(`Session ${sessionId} not found`)));
    return Promise.resolve(ok(JSON.stringify(entry, null, 2)));
  }

  exportAsText(sessionId: string): Promise<Result<string, Error>> {
    const entry = this.sessions.get(sessionId);
    if (!entry) return Promise.resolve(err(new Error(`Session ${sessionId} not found`)));
    const lines = entry.segments.map(
      (s) => `[Speaker ${String(s.speakerId)}] ${s.text}`,
    );
    return Promise.resolve(ok(lines.join('\n')));
  }
}
