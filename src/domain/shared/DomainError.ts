/**
 * Base class for all domain errors
 * Provides typed error handling with error codes
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Session-related errors
 */
export class SessionError extends DomainError {
  constructor(
    readonly code:
      | 'AudioCaptureFailed'
      | 'TranscriptionFailed'
      | 'InvalidConfiguration'
      | 'SessionNotFound'
      | 'SessionAlreadyRunning',
    message: string,
  ) {
    super(message);
  }

  static audioCaptureFailed(message = 'Failed to capture audio'): SessionError {
    return new SessionError('AudioCaptureFailed', message);
  }

  static transcriptionFailed(message = 'Transcription failed'): SessionError {
    return new SessionError('TranscriptionFailed', message);
  }

  static invalidConfiguration(message = 'Invalid session configuration'): SessionError {
    return new SessionError('InvalidConfiguration', message);
  }

  static sessionNotFound(message = 'Session not found'): SessionError {
    return new SessionError('SessionNotFound', message);
  }

  static sessionAlreadyRunning(message = 'Session is already running'): SessionError {
    return new SessionError('SessionAlreadyRunning', message);
  }
}

/**
 * Connection-related errors
 */
export class ConnectionError extends DomainError {
  constructor(
    readonly code: 'Timeout' | 'Unauthorized' | 'RateLimited' | 'NetworkError',
    message: string,
  ) {
    super(message);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends DomainError {
  constructor(
    readonly code: 'InvalidInput' | 'MissingRequired' | 'OutOfRange',
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}
