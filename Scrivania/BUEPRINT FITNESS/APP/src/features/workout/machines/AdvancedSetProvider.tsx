import { useActor } from '@xstate/react';
import { createContext, type ReactNode, useContext } from 'react';
import { container } from 'tsyringe';

import { ConsoleLogger } from '@/app/services/ConsoleLogger';

import { AdvancedSetExecutionService } from '../services/AdvancedSetExecutionService';
import {
  type AdvancedSetActor,
  type AdvancedSetMachine,
  createAdvancedSetActor,
} from './advancedSetStateMachine';

/**
 * Context value for the Advanced Set Provider
 */
interface AdvancedSetContextValue {
  /** The XState actor for advanced set execution */
  actor: AdvancedSetActor;
  /** Current state snapshot */
  state: ReturnType<AdvancedSetActor['getSnapshot']>;
  /** Function to send events to the machine */
  send: AdvancedSetActor['send'];
}

/**
 * React context for advanced set state machine
 */
const AdvancedSetContext = createContext<AdvancedSetContextValue | null>(null);

/**
 * Props for the AdvancedSetProvider component
 */
interface AdvancedSetProviderProps {
  /** Child components that will have access to the advanced set state */
  children: ReactNode;
}

/**
 * Provider component that creates and manages an advanced set state machine instance.
 * This component should wrap parts of the application that need access to advanced set
 * execution state, typically workout execution screens.
 *
 * The provider automatically injects the required dependencies (execution service and logger)
 * from the DI container and manages the machine lifecycle.
 *
 * @param props - Component props
 * @returns JSX element wrapping children with advanced set context
 */
export const AdvancedSetProvider = ({ children }: AdvancedSetProviderProps): JSX.Element => {
  // Get dependencies from the DI container
  const executionService = container.resolve(AdvancedSetExecutionService);
  const logger = container.resolve(ConsoleLogger);

  // Create and start the actor
  const actor = createAdvancedSetActor({ executionService, logger });
  actor.start();

  // Use the actor with React integration
  const [state, send] = useActor(actor);

  const contextValue: AdvancedSetContextValue = {
    actor,
    state,
    send,
  };

  return <AdvancedSetContext.Provider value={contextValue}>{children}</AdvancedSetContext.Provider>;
};

/**
 * Hook to access the advanced set state machine context.
 * Must be used within an AdvancedSetProvider.
 *
 * @returns The advanced set context value
 * @throws Error if used outside of AdvancedSetProvider
 */
export const useAdvancedSetContext = (): AdvancedSetContextValue => {
  const context = useContext(AdvancedSetContext);
  if (!context) {
    throw new Error('useAdvancedSetContext must be used within an AdvancedSetProvider');
  }
  return context;
};

/**
 * Hook to get the current advanced set state.
 * Convenience hook that extracts just the state from the context.
 *
 * @returns The current state of the advanced set machine
 */
export const useAdvancedSetState = () => {
  const { state } = useAdvancedSetContext();
  return state;
};

/**
 * Hook to send events to the advanced set machine.
 * Convenience hook that extracts just the send function from the context.
 *
 * @returns The send function for the advanced set machine
 */
export const useAdvancedSetSend = () => {
  const { send } = useAdvancedSetContext();
  return send;
};

/**
 * Hook to get both state and send function.
 * Most commonly used hook for components that need to both read state and send events.
 *
 * @returns Tuple of [state, send] for the advanced set machine
 */
export const useAdvancedSet = () => {
  const { state, send } = useAdvancedSetContext();
  return [state, send] as const;
};
