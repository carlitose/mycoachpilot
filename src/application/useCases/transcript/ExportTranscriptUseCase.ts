import { ok, err, type Result } from '@domain/shared';

import type { SessionRepositoryPort } from '../../ports';

export type ExportFormat = 'json' | 'txt';

export interface ExportTranscriptInput {
  sessionId: string;
  format: ExportFormat;
}

export interface ExportTranscriptOutput {
  content: string;
  filename: string;
  mimeType: string;
}

/**
 * Export Transcript Use Case
 * Exports a session transcript in the specified format
 */
export class ExportTranscriptUseCase {
  constructor(private readonly sessionRepository: SessionRepositoryPort) {}

  async execute(input: ExportTranscriptInput): Promise<Result<ExportTranscriptOutput, Error>> {
    const { sessionId, format } = input;

    let content: string;
    let mimeType: string;

    if (format === 'json') {
      const result = await this.sessionRepository.exportAsJson(sessionId);
      if (!result.isOk()) {
        return err(result.unwrapErr());
      }
      content = result.unwrap();
      mimeType = 'application/json';
    } else {
      const result = await this.sessionRepository.exportAsText(sessionId);
      if (!result.isOk()) {
        return err(result.unwrapErr());
      }
      content = result.unwrap();
      mimeType = 'text/plain';
    }

    const filename = `session-${sessionId}-${String(Date.now())}.${format}`;

    return ok({ content, filename, mimeType });
  }
}
