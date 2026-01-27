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
