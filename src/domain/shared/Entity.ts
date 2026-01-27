/**
 * Base class for all domain entities
 * Provides identity comparison and basic entity behavior
 */

export abstract class Entity<TId> {
  constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this._id === other._id;
  }
}

/**
 * Base class for aggregate roots
 * Aggregates are consistency boundaries and can emit domain events
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: Array<{ eventType: string; payload: unknown }> = [];

  protected addDomainEvent(eventType: string, payload: unknown): void {
    this._domainEvents.push({ eventType, payload });
  }

  pullDomainEvents(): Array<{ eventType: string; payload: unknown }> {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
