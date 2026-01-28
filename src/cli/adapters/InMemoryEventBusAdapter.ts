import type { EventBusPort } from '../../application/ports/EventBusPort';
import type { DomainEvent, EventHandler } from '../../domain/shared/DomainEvent';

export class InMemoryEventBusAdapter implements EventBusPort {
  private handlers = new Map<string, Set<EventHandler<DomainEvent>>>();

  publish(event: DomainEvent): void {
    const eventHandlers = this.handlers.get(event.eventType);
    if (!eventHandlers) return;
    for (const handler of eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const set = this.handlers.get(eventType) ?? new Set();
    set.add(handler as EventHandler<DomainEvent>);
    return () => { set.delete(handler as EventHandler<DomainEvent>); };
  }

  subscribeMany<T extends DomainEvent>(
    eventTypes: string[],
    handler: EventHandler<T>,
  ): () => void {
    const unsubs = eventTypes.map((type) => this.subscribe(type, handler));
    return () => { unsubs.forEach((u) => { u(); }); };
  }
}
