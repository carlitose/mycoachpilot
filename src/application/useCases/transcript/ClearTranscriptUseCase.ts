import type { Result } from '@domain/shared';

import type { SessionRepositoryPort } from '../../ports';

export interface ClearTranscriptInput {
  sessionId?: string; // If not provided, clears all
}

/**
 * Clear Transcript Use Case
 * Clears session history from storage
 */
export class ClearTranscriptUseCase {
  constructor(private readonly sessionRepository: SessionRepositoryPort) {}

  async execute(input: ClearTranscriptInput = {}): Promise<Result<void, Error>> {
    if (input.sessionId) {
      return this.sessionRepository.delete(input.sessionId);
    }
    return this.sessionRepository.clearAll();
  }
}
