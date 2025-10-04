import { createActor } from '@xstate/react';
import React, { createContext, useContext, useMemo } from 'react';

import type { IWorkoutStatePersistence } from '../domain/IWorkoutStatePersistence';
import { createWorkoutMachine, WorkoutActor } from './workoutMachine';

/**
 * Props for the WorkoutProvider component
 */
interface WorkoutProviderProps {
  children: React.ReactNode;
  /**
   * The persistence implementation to use for saving/loading workout state.
   * This dependency is injected to decouple the provider from concrete implementations.
   */
  workoutStatePersistence: IWorkoutStatePersistence;
}

/**
 * Context value provided by the WorkoutProvider
 */
interface WorkoutContextValue {
  /**
   * The XState actor managing the workout state machine
   */
  workoutActor: WorkoutActor;
}

/**
 * React context for sharing the workout machine actor throughout the component tree
 */
const WorkoutContext = createContext<WorkoutContextValue | null>(null);

/**
 * Provider component that creates and manages the workout state machine.
 * This component handles dependency injection and provides the workout actor
 * to all child components through React context.
 *
 * @param props - The provider props including children and persistence dependency
 * @returns JSX element that provides workout context to children
 */
export const WorkoutProvider: React.FC<WorkoutProviderProps> = ({
  children,
  workoutStatePersistence,
}) => {
  /**
   * Create the workout machine with injected dependencies.
   * The machine is created once per provider instance and memoized.
   */
  const workoutMachine = useMemo(
    () =>
      createWorkoutMachine({
        persistence: workoutStatePersistence,
      }),
    [workoutStatePersistence]
  );

  /**
   * Create the actor from the machine.
   * The actor is created once per machine instance and automatically starts.
   */
  const workoutActor = useMemo(() => createActor(workoutMachine).start(), [workoutMachine]);

  /**
   * Cleanup the actor when the component unmounts
   */
  React.useEffect(() => {
    return () => {
      workoutActor.stop();
    };
  }, [workoutActor]);

  const contextValue = useMemo(
    () => ({
      workoutActor,
    }),
    [workoutActor]
  );

  return <WorkoutContext.Provider value={contextValue}>{children}</WorkoutContext.Provider>;
};

/**
 * Hook to access the workout context from child components.
 * This hook provides access to the workout state machine actor.
 *
 * @throws Error if used outside of a WorkoutProvider
 * @returns The workout context value containing the actor
 */
export const useWorkoutContext = (): WorkoutContextValue => {
  const context = useContext(WorkoutContext);

  if (!context) {
    throw new Error(
      'useWorkoutContext must be used within a WorkoutProvider. ' +
        'Make sure you have wrapped your component tree with <WorkoutProvider>.'
    );
  }

  return context;
};

/**
 * Hook to access the workout actor directly.
 * This is a convenience hook that extracts the actor from the context.
 *
 * @throws Error if used outside of a WorkoutProvider
 * @returns The workout state machine actor
 */
export const useWorkoutActor = (): WorkoutActor => {
  const { workoutActor } = useWorkoutContext();
  return workoutActor;
};
