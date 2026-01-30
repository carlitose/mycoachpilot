/**
 * Base class for all domain events
 * Used for cross-context communication via EventBus
 */

export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    readonly eventType: string,
    readonly aggregateId: string,
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * Event handler type for subscribing to domain events
 */
export type EventHandler<T extends DomainEvent> = (event: T) => void;

/**
 * EventBus port interface - implementation in infrastructure
 */
export interface EventBus {
  publish(event: DomainEvent): void;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): () => void;
}
