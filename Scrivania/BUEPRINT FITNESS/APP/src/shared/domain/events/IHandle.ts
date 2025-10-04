import { IDomainEvent } from './IDomainEvent';

/**
 * An interface for a domain event handler.
 * @template T The type of the domain event this handler can process.
 */
export interface IHandle<T extends IDomainEvent> {
  /**
   * Sets up the subscription for the event.
   * This method is called at application startup to register the handler.
   * @param event The event instance for type inference.
   */
  setupSubscriptions(event?: T): void;
}
