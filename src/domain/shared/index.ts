/**
 * Domain shared module - exports common building blocks
 */

export { Ok, Err, ok, err } from './Result';
export type { Result } from './Result';
export { BaseDomainEvent } from './DomainEvent';
export type { DomainEvent, EventHandler, EventBus } from './DomainEvent';
export { Entity, AggregateRoot } from './Entity';
export { ValueObject } from './ValueObject';
export {
  DomainError,
  SessionError,
  ConnectionError,
  ValidationError,
} from './DomainError';
