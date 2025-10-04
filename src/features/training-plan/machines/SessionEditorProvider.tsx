import { createActor } from '@xstate/react';
import React, { createContext, useContext, useMemo } from 'react';

import { SessionEditorActor, sessionEditorMachine } from './sessionEditorMachine';

/**
 * Props for the SessionEditorProvider component
 */
interface SessionEditorProviderProps {
  children: React.ReactNode;
}

/**
 * Context value provided by the SessionEditorProvider
 */
interface SessionEditorContextValue {
  /**
   * The XState actor managing the session editor state machine
   */
  sessionEditorActor: SessionEditorActor;
}

/**
 * React context for sharing the session editor machine actor throughout the component tree
 */
const SessionEditorContext = createContext<SessionEditorContextValue | null>(null);

/**
 * Provider component that creates and manages the session editor state machine.
 * This component provides the session editor actor to all child components
 * through React context, enabling complex session editing workflows.
 *
 * @param props - The provider props including children
 * @returns JSX element that provides session editor context to children
 */
export const SessionEditorProvider: React.FC<SessionEditorProviderProps> = ({ children }) => {
  /**
   * Create the session editor actor from the machine.
   * The actor is created once per provider instance and automatically starts.
   */
  const sessionEditorActor = useMemo(() => createActor(sessionEditorMachine).start(), []);

  /**
   * Cleanup the actor when the component unmounts
   */
  React.useEffect(() => {
    return () => {
      sessionEditorActor.stop();
    };
  }, [sessionEditorActor]);

  const contextValue = useMemo(
    () => ({
      sessionEditorActor,
    }),
    [sessionEditorActor]
  );

  return (
    <SessionEditorContext.Provider value={contextValue}>{children}</SessionEditorContext.Provider>
  );
};

/**
 * Hook to access the session editor context from child components.
 * This hook provides access to the session editor state machine actor.
 *
 * @throws Error if used outside of a SessionEditorProvider
 * @returns The session editor context value containing the actor
 */
export const useSessionEditorContext = (): SessionEditorContextValue => {
  const context = useContext(SessionEditorContext);

  if (!context) {
    throw new Error(
      'useSessionEditorContext must be used within a SessionEditorProvider. ' +
        'Make sure you have wrapped your component tree with <SessionEditorProvider>.'
    );
  }

  return context;
};

/**
 * Hook to access the session editor actor directly.
 * This is a convenience hook that extracts the actor from the context.
 *
 * @throws Error if used outside of a SessionEditorProvider
 * @returns The session editor state machine actor
 */
export const useSessionEditorActor = (): SessionEditorActor => {
  const { sessionEditorActor } = useSessionEditorContext();
  return sessionEditorActor;
};
