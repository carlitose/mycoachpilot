import type { Session, SessionModeType, AudioConfigProps } from '@domain/session';
import type { Result } from '@domain/shared';

import type { SessionManager } from '../../services/SessionManager';

export interface StartSessionInput {
  mode: SessionModeType;
  templateId?: string;
  audioConfig?: Partial<AudioConfigProps>;
  openaiApiKey?: string;
  deepgramApiKey?: string;
  systemPrompt?: string;
}

export interface StartSessionOutput {
  session: Session;
}

/**
 * Start Session Use Case
 * Initiates a new coaching session with the specified mode and configuration
 */
export class StartSessionUseCase {
  constructor(private readonly sessionManager: SessionManager) {}

  async execute(input: StartSessionInput): Promise<Result<StartSessionOutput, Error>> {
    const options: {
      templateId?: string;
      audioConfig?: Partial<AudioConfigProps>;
      openaiApiKey?: string;
      deepgramApiKey?: string;
      systemPrompt?: string;
    } = {};

    if (input.templateId !== undefined) options.templateId = input.templateId;
    if (input.audioConfig !== undefined) options.audioConfig = input.audioConfig;
    if (input.openaiApiKey !== undefined) options.openaiApiKey = input.openaiApiKey;
    if (input.deepgramApiKey !== undefined) options.deepgramApiKey = input.deepgramApiKey;
    if (input.systemPrompt !== undefined) options.systemPrompt = input.systemPrompt;

    const result = await this.sessionManager.startSession(input.mode, options);

    return result.map((session) => ({ session }));
  }
}
