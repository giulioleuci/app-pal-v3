import { assign, createActor, fromPromise, setup } from 'xstate';

import { SessionModel } from '@/features/training-plan/domain';
import { WorkoutLogModel } from '@/features/workout/domain';

import type { IWorkoutStatePersistence } from '../domain/IWorkoutStatePersistence';

/**
 * Context for the workout state machine
 */
interface WorkoutContext {
  profileId: string | null;
  session: SessionModel | null;
  workoutLog: WorkoutLogModel | null;
  error: string | null;
}

/**
 * Events that can be sent to the workout machine
 */
type WorkoutEvent =
  | { type: 'START_WORKOUT'; profileId: string; session: SessionModel }
  | { type: 'UPDATE_SET'; setData: unknown }
  | { type: 'FINISH_WORKOUT'; notes?: string; userRating?: number }
  | { type: 'CANCEL_WORKOUT' }
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'RETRY_INITIALIZATION' };

/**
 * Dependencies that must be injected into the workout machine
 */
interface WorkoutMachineDependencies {
  persistence: IWorkoutStatePersistence;
}

/**
 * Factory function to create a workout state machine with injected dependencies.
 * This approach decouples the machine from concrete implementations and makes it testable.
 *
 * @param dependencies - The dependencies required by the machine (persistence layer)
 * @returns An XState machine configured with the provided dependencies
 */
export const createWorkoutMachine = (dependencies: WorkoutMachineDependencies) => {
  const { persistence } = dependencies;

  return setup({
    types: {
      context: {} as WorkoutContext,
      events: {} as WorkoutEvent,
    },
    actors: {
      /**
       * Loads the persisted workout state for the given profile
       */
      loadPersistedState: fromPromise(async ({ input }: { input: { profileId: string } }) => {
        const serializedState = await persistence.loadState(input.profileId);
        return serializedState ? JSON.parse(serializedState) : null;
      }),

      /**
       * Persists the current workout state
       */
      persistWorkoutState: fromPromise(
        async ({ input }: { input: { profileId: string; state: string } }) => {
          await persistence.saveState(input.profileId, input.state);
        }
      ),

      /**
       * Clears the persisted workout state
       */
      clearPersistedState: fromPromise(async ({ input }: { input: { profileId: string } }) => {
        await persistence.clearState(input.profileId);
      }),
    },
    guards: {
      hasProfileId: ({ context }) => context.profileId !== null,
      hasWorkoutInProgress: ({ context }) => context.workoutLog !== null,
    },
    actions: {
      setProfileId: assign({
        profileId: ({ event }) => {
          if (event.type === 'START_WORKOUT') {
            return event.profileId;
          }
          return null;
        },
      }),

      setSession: assign({
        session: ({ event }) => {
          if (event.type === 'START_WORKOUT') {
            return event.session;
          }
          return null;
        },
      }),

      startWorkout: assign({
        workoutLog: ({ event, context }) => {
          if (event.type === 'START_WORKOUT' && context.profileId) {
            // Create a new workout log from the session
            const workoutData = {
              id: crypto.randomUUID(),
              profileId: context.profileId,
              trainingPlanId: event.session.id,
              trainingPlanName: event.session.name,
              sessionId: event.session.id,
              sessionName: event.session.name,
              performedGroupIds: [],
              startTime: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            return WorkoutLogModel.hydrate(workoutData, []);
          }
          return null;
        },
      }),

      updateWorkout: assign({
        workoutLog: ({ context, event }) => {
          if (event.type === 'UPDATE_SET' && context.workoutLog) {
            // This would be expanded to actually update the workout log
            // For now, return the existing workout log
            return context.workoutLog;
          }
          return context.workoutLog;
        },
      }),

      finishWorkout: assign({
        workoutLog: ({ context, event }) => {
          if (event.type === 'FINISH_WORKOUT' && context.workoutLog) {
            const finishedWorkout = context.workoutLog.cloneAsEnded().cloneWithUpdatedMetadata({
              notes: event.notes,
              userRating: event.userRating,
            });
            return finishedWorkout;
          }
          return context.workoutLog;
        },
      }),

      clearWorkout: assign({
        workoutLog: () => null,
        session: () => null,
        profileId: () => null,
        error: () => null,
      }),

      setError: assign({
        error: (_, params: { error: string }) => params.error,
      }),

      clearError: assign({
        error: () => null,
      }),

      restoreFromPersistedState: assign({
        profileId: ({ event }, params: { persistedData: any }) => {
          return params.persistedData?.profileId || null;
        },
        session: ({ event }, params: { persistedData: any }) => {
          return params.persistedData?.session || null;
        },
        workoutLog: ({ event }, params: { persistedData: any }) => {
          return params.persistedData?.workoutLog || null;
        },
      }),
    },
  }).createMachine({
    id: 'workout',
    initial: 'initializing',
    context: {
      profileId: null,
      session: null,
      workoutLog: null,
      error: null,
    },
    states: {
      /**
       * Initial state - attempts to restore any persisted workout state
       */
      initializing: {
        invoke: {
          id: 'loadState',
          src: 'loadPersistedState',
          input: ({ context }) => ({ profileId: 'default' }), // TODO: Get actual profile ID
          onDone: [
            {
              guard: ({ event }) => event.output !== null,
              target: 'inProgress',
              actions: {
                type: 'restoreFromPersistedState',
                params: ({ event }) => ({ persistedData: event.output }),
              },
            },
            {
              target: 'idle',
            },
          ],
          onError: {
            target: 'idle',
            actions: {
              type: 'setError',
              params: { error: 'Failed to load persisted workout state' },
            },
          },
        },
      },

      /**
       * Idle state - no active workout
       */
      idle: {
        entry: 'clearError',
        on: {
          START_WORKOUT: {
            target: 'inProgress',
            actions: ['setProfileId', 'setSession', 'startWorkout'],
          },
          RETRY_INITIALIZATION: {
            target: 'initializing',
          },
        },
      },

      /**
       * In progress state - workout is active
       */
      inProgress: {
        entry: [
          {
            type: 'invoke',
            src: 'persistWorkoutState',
            input: ({ context }) => ({
              profileId: context.profileId || 'default',
              state: JSON.stringify({
                profileId: context.profileId,
                session: context.session,
                workoutLog: context.workoutLog,
              }),
            }),
          },
        ],
        initial: 'active',
        states: {
          /**
           * Active workout state - user is performing exercises
           */
          active: {
            on: {
              UPDATE_SET: {
                actions: 'updateWorkout',
              },
              PAUSE_WORKOUT: {
                target: 'paused',
              },
              FINISH_WORKOUT: {
                target: '#workout.finishing',
                actions: 'finishWorkout',
              },
              CANCEL_WORKOUT: {
                target: '#workout.cancelling',
              },
            },
          },

          /**
           * Paused workout state - workout is temporarily stopped
           */
          paused: {
            on: {
              RESUME_WORKOUT: {
                target: 'active',
              },
              FINISH_WORKOUT: {
                target: '#workout.finishing',
                actions: 'finishWorkout',
              },
              CANCEL_WORKOUT: {
                target: '#workout.cancelling',
              },
            },
          },
        },
      },

      /**
       * Finishing state - workout is being completed and saved
       */
      finishing: {
        invoke: {
          id: 'clearState',
          src: 'clearPersistedState',
          input: ({ context }) => ({ profileId: context.profileId || 'default' }),
          onDone: {
            target: 'completed',
          },
          onError: {
            target: 'idle',
            actions: {
              type: 'setError',
              params: { error: 'Failed to clear workout state after completion' },
            },
          },
        },
      },

      /**
       * Cancelling state - workout is being cancelled and state cleared
       */
      cancelling: {
        invoke: {
          id: 'clearState',
          src: 'clearPersistedState',
          input: ({ context }) => ({ profileId: context.profileId || 'default' }),
          onDone: {
            target: 'idle',
            actions: 'clearWorkout',
          },
          onError: {
            target: 'idle',
            actions: [
              'clearWorkout',
              {
                type: 'setError',
                params: { error: 'Failed to clear workout state after cancellation' },
              },
            ],
          },
        },
      },

      /**
       * Completed state - workout has been successfully finished
       */
      completed: {
        entry: 'clearWorkout',
        on: {
          START_WORKOUT: {
            target: 'inProgress',
            actions: ['setProfileId', 'setSession', 'startWorkout'],
          },
        },
      },
    },
  });
};

/**
 * Type for the workout machine created by the factory
 */
export type WorkoutMachine = ReturnType<typeof createWorkoutMachine>;

/**
 * Type for the workout actor created from the machine
 */
export type WorkoutActor = ReturnType<typeof createActor<WorkoutMachine>>;
