/**
 * An interface representing a domain event.
 * All domain events must implement this interface.
 */
export interface IDomainEvent {
  readonly dateTimeOccurred: Date;
  getAggregateId(): string;
}
