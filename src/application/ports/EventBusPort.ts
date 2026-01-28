import type { DomainEvent, EventHandler } from '@domain/shared';

/**
 * EventBus port interface
 * Handles publishing and subscribing to domain events
 */
export interface EventBusPort {
  /**
   * Publish a domain event to all subscribers
   */
  publish(event: DomainEvent): void;

  /**
   * Subscribe to a specific event type
   * @returns Unsubscribe function
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): () => void;

  /**
   * Subscribe to multiple event types with a single handler
   * @returns Unsubscribe function
   */
  subscribeMany<T extends DomainEvent>(
    eventTypes: string[],
    handler: EventHandler<T>,
  ): () => void;
}
