import type { Result } from '@domain/shared';

import type { SessionManager } from '../../services/SessionManager';

/**
 * Pause Session Use Case
 * Pauses the current active session
 */
export class PauseSessionUseCase {
  constructor(private readonly sessionManager: SessionManager) {}

  execute(): Result<void, Error> {
    return this.sessionManager.pauseSession();
  }
}

/**
 * Resume Session Use Case
 * Resumes a paused session
 */
export class ResumeSessionUseCase {
  constructor(private readonly sessionManager: SessionManager) {}

  execute(): Result<void, Error> {
    return this.sessionManager.resumeSession();
  }
}
