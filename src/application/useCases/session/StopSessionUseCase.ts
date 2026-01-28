import { ok, err, type Result } from '@domain/shared';

import type { SessionRepositoryPort, SessionHistoryEntry } from '../../ports';
import type { SessionManager } from '../../services/SessionManager';

export interface StopSessionInput {
  saveToHistory?: boolean;
}

export interface StopSessionOutput {
  saved: boolean;
  sessionId: string | null;
}

/**
 * Stop Session Use Case
 * Stops the current session and optionally saves to history
 */
export class StopSessionUseCase {
  constructor(
    private readonly sessionManager: SessionManager,
    private readonly sessionRepository: SessionRepositoryPort,
  ) {}

  async execute(input: StopSessionInput = {}): Promise<Result<StopSessionOutput, Error>> {
    const { saveToHistory = true } = input;

    const session = this.sessionManager.currentSession;
    if (!session) {
      return ok({ saved: false, sessionId: null });
    }

    const sessionId = session.id.toString();

    // Get data before stopping
    const messages = this.sessionManager.getMessages();
    const segments = this.sessionManager.getSegments();
    const speakers = this.sessionManager.getSpeakers();

    // Stop the session
    const stopResult = this.sessionManager.stopSession();
    if (!stopResult.isOk()) {
      return err(stopResult.unwrapErr());
    }

    // Save to history if requested
    if (saveToHistory) {
      const historyEntry: SessionHistoryEntry = {
        session: session.toProps(),
        messages,
        segments,
        speakers,
        suggestions: [],
        savedAt: new Date().toISOString(),
      };

      await this.sessionRepository.save(historyEntry);
    }

    return ok({ saved: saveToHistory, sessionId });
  }
}
