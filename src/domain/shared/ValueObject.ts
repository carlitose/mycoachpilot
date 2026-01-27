/**
 * Base class for value objects
 * Value objects are immutable and compared by value, not identity
 */

export abstract class ValueObject<T> {
  protected abstract get value(): T;

  equals(other: ValueObject<T> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }
}
