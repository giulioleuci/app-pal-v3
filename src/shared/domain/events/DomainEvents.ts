import { IDomainEvent } from './IDomainEvent';

type HandlerCallback = (event: IDomainEvent) => void;

/**
 * A static class for dispatching and registering domain events.
 * This enables a decoupled, event-driven architecture.
 */
export class DomainEvents {
  private static handlersMap: { [eventName: string]: HandlerCallback[] } = {};

  /**
   * Registers a handler for a specific event.
   * @param callback The function to execute when the event is dispatched.
   * @param eventClassName The name of the event class to subscribe to.
   */
  public static register(callback: HandlerCallback, eventClassName: string): void {
    if (!this.handlersMap[eventClassName]) {
      this.handlersMap[eventClassName] = [];
    }
    this.handlersMap[eventClassName].push(callback);
  }

  /**
   * Dispatches an event to all registered handlers.
   * @param event The domain event to dispatch.
   */
  public static dispatch(event: IDomainEvent): void {
    const eventClassName = event.constructor.name;
    const handlers = this.handlersMap[eventClassName];
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  /**
   * Clears all registered handlers. Crucial for test isolation.
   */
  public static clearHandlers(): void {
    this.handlersMap = {};
  }

  /**
   * A helper for integration testing to ensure handlers are registered.
   * @param eventClassName The name of the event class to check for subscriptions.
   * @returns `true` if at least one handler is subscribed, `false` otherwise.
   */
  public static hasSubscription(eventClassName: string): boolean {
    const handlers = this.handlersMap[eventClassName];
    return !!handlers && handlers.length > 0;
  }
}
