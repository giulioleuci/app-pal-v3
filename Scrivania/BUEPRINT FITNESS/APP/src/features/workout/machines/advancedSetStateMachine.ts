import { assign, createActor, fromPromise, setup } from 'xstate';

import type { ILogger } from '@/app/services/ILogger';
import type { ApplicationError } from '@/shared/errors/ApplicationError';
import type { Result } from '@/shared/utils/Result';

import type {
  AdvancedSetExecutionService,
  AdvancedSetExecutionState,
  SetProgressionData,
} from '../services/AdvancedSetExecutionService';

/**
 * Context for the advanced set execution state machine
 */
interface AdvancedSetContext {
  /** Current execution state from the service */
  executionState: AdvancedSetExecutionState | null;
  /** Current timer state */
  timer: {
    isRunning: boolean;
    remainingSeconds: number;
    totalSeconds: number;
  };
  /** Error state */
  error: string | null;
  /** Set progression history */
  completedSets: SetProgressionData[];
}

/**
 * Events that can be sent to the advanced set machine
 */
type AdvancedSetEvent =
  | { type: 'INITIALIZE'; setConfiguration: unknown; lastWeight?: number }
  | { type: 'COMPLETE_SET'; setData: SetProgressionData }
  | { type: 'START_REST_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'SKIP_REST' }
  | { type: 'TIMER_TICK' }
  | { type: 'TIMER_COMPLETE' }
  | { type: 'RESET_SET' }
  | { type: 'ABORT_SET' };

/**
 * Dependencies that must be injected into the advanced set machine
 */
interface AdvancedSetMachineDependencies {
  executionService: AdvancedSetExecutionService;
  logger: ILogger;
}

/**
 * Factory function to create an advanced set state machine with injected dependencies.
 * This machine manages the complex execution flow of advanced set types like drop sets,
 * myo-reps, pyramidal sets, rest-pause, and MAV sets.
 *
 * @param dependencies - The dependencies required by the machine
 * @returns An XState machine configured with the provided dependencies
 */
export const createAdvancedSetStateMachine = (dependencies: AdvancedSetMachineDependencies) => {
  const { executionService, logger } = dependencies;

  return setup({
    types: {
      context: {} as AdvancedSetContext,
      events: {} as AdvancedSetEvent,
    },
    actors: {
      /**
       * Initializes the execution state for an advanced set
       */
      initializeExecution: fromPromise(
        async ({
          input,
        }: {
          input: { setConfiguration: unknown; lastWeight?: number };
        }): Promise<AdvancedSetExecutionState> => {
          const result = await executionService.initializeExecution(
            input.setConfiguration as any,
            input.lastWeight
          );
          if (result.isSuccess) {
            return result.getValue();
          }
          throw new Error(result.error?.message || 'Failed to initialize execution');
        }
      ),

      /**
       * Progresses to the next phase of execution
       */
      progressToNextPhase: fromPromise(
        async ({
          input,
        }: {
          input: { currentState: AdvancedSetExecutionState; completedSetData: SetProgressionData };
        }): Promise<AdvancedSetExecutionState> => {
          const result = await executionService.progressToNextPhase(
            input.currentState,
            input.completedSetData
          );
          if (result.isSuccess) {
            return result.getValue();
          }
          throw new Error(result.error?.message || 'Failed to progress to next phase');
        }
      ),

      /**
       * Timer actor that decrements every second
       */
      timer: fromPromise(async ({ input }: { input: { seconds: number } }): Promise<void> => {
        return new Promise((resolve) => {
          setTimeout(resolve, input.seconds * 1000);
        });
      }),
    },
    guards: {
      hasExecutionState: ({ context }) => context.executionState !== null,
      isSetCompleted: ({ context }) => context.executionState?.isCompleted === true,
      hasRemainingPhases: ({ context }) =>
        context.executionState !== null &&
        context.executionState.currentPhase < context.executionState.totalPhases,
      needsRestPeriod: ({ context }) =>
        context.executionState?.restPeriodSeconds !== undefined &&
        context.executionState.restPeriodSeconds > 0,
      isTimerRunning: ({ context }) => context.timer.isRunning,
      hasTimerRemaining: ({ context }) => context.timer.remainingSeconds > 0,
    },
    actions: {
      setExecutionState: assign({
        executionState: ({ event }, params: { state: AdvancedSetExecutionState }) => params.state,
        error: () => null,
      }),

      addCompletedSet: assign({
        completedSets: ({ context, event }) => {
          if (event.type === 'COMPLETE_SET') {
            return [...context.completedSets, event.setData];
          }
          return context.completedSets;
        },
      }),

      initializeTimer: assign({
        timer: ({ context }) => {
          const restSeconds = context.executionState?.restPeriodSeconds || 60;
          return {
            isRunning: false,
            remainingSeconds: restSeconds,
            totalSeconds: restSeconds,
          };
        },
      }),

      startTimer: assign({
        timer: ({ context }) => ({
          ...context.timer,
          isRunning: true,
        }),
      }),

      pauseTimer: assign({
        timer: ({ context }) => ({
          ...context.timer,
          isRunning: false,
        }),
      }),

      resumeTimer: assign({
        timer: ({ context }) => ({
          ...context.timer,
          isRunning: true,
        }),
      }),

      decrementTimer: assign({
        timer: ({ context }) => ({
          ...context.timer,
          remainingSeconds: Math.max(0, context.timer.remainingSeconds - 1),
        }),
      }),

      resetTimer: assign({
        timer: ({ context }) => {
          const restSeconds = context.executionState?.restPeriodSeconds || 60;
          return {
            isRunning: false,
            remainingSeconds: restSeconds,
            totalSeconds: restSeconds,
          };
        },
      }),

      clearTimer: assign({
        timer: ({ context }) => ({
          ...context.timer,
          isRunning: false,
          remainingSeconds: 0,
        }),
      }),

      setError: assign({
        error: (_, params: { error: string }) => params.error,
      }),

      clearError: assign({
        error: () => null,
      }),

      clearState: assign({
        executionState: () => null,
        completedSets: () => [],
        error: () => null,
        timer: () => ({
          isRunning: false,
          remainingSeconds: 0,
          totalSeconds: 0,
        }),
      }),

      logStateTransition: ({ context, event }, params: { from: string; to: string }) => {
        logger.info('Advanced set state transition', {
          from: params.from,
          to: params.to,
          setType: context.executionState?.setType,
          currentPhase: context.executionState?.currentPhase,
          totalPhases: context.executionState?.totalPhases,
          event: event.type,
        });
      },
    },
  }).createMachine({
    id: 'advancedSet',
    initial: 'idle',
    context: {
      executionState: null,
      timer: {
        isRunning: false,
        remainingSeconds: 0,
        totalSeconds: 0,
      },
      error: null,
      completedSets: [],
    },
    states: {
      /**
       * Idle state - no advanced set execution in progress
       */
      idle: {
        entry: [
          'clearState',
          {
            type: 'logStateTransition',
            params: { from: 'any', to: 'idle' },
          },
        ],
        on: {
          INITIALIZE: {
            target: 'initializing',
          },
        },
      },

      /**
       * Initializing state - setting up the advanced set execution
       */
      initializing: {
        entry: [
          'clearError',
          {
            type: 'logStateTransition',
            params: { from: 'idle', to: 'initializing' },
          },
        ],
        invoke: {
          id: 'initializeExecution',
          src: 'initializeExecution',
          input: ({ event }) => {
            if (event.type === 'INITIALIZE') {
              return {
                setConfiguration: event.setConfiguration,
                lastWeight: event.lastWeight,
              };
            }
            return { setConfiguration: null };
          },
          onDone: {
            target: 'ready',
            actions: {
              type: 'setExecutionState',
              params: ({ event }) => ({ state: event.output }),
            },
          },
          onError: {
            target: 'error',
            actions: {
              type: 'setError',
              params: ({ event }) => ({ error: event.error?.message || 'Initialization failed' }),
            },
          },
        },
      },

      /**
       * Ready state - advanced set is initialized and ready for execution
       */
      ready: {
        entry: [
          {
            type: 'logStateTransition',
            params: { from: 'initializing', to: 'ready' },
          },
        ],
        always: [
          {
            guard: 'isSetCompleted',
            target: 'completed',
          },
        ],
        on: {
          COMPLETE_SET: {
            target: 'processingPhase',
            actions: 'addCompletedSet',
          },
          RESET_SET: {
            target: 'idle',
          },
          ABORT_SET: {
            target: 'idle',
          },
        },
      },

      /**
       * Processing phase - determining next phase after set completion
       */
      processingPhase: {
        entry: [
          {
            type: 'logStateTransition',
            params: { from: 'ready', to: 'processingPhase' },
          },
        ],
        invoke: {
          id: 'progressToNextPhase',
          src: 'progressToNextPhase',
          input: ({ context, event }) => {
            if (event.type === 'COMPLETE_SET' && context.executionState) {
              return {
                currentState: context.executionState,
                completedSetData: event.setData,
              };
            }
            return null;
          },
          onDone: [
            {
              guard: ({ event }) => event.output.isCompleted,
              target: 'completed',
              actions: {
                type: 'setExecutionState',
                params: ({ event }) => ({ state: event.output }),
              },
            },
            {
              guard: ({ event }) =>
                event.output.restPeriodSeconds && event.output.restPeriodSeconds > 0,
              target: 'resting',
              actions: [
                {
                  type: 'setExecutionState',
                  params: ({ event }) => ({ state: event.output }),
                },
                'initializeTimer',
              ],
            },
            {
              target: 'ready',
              actions: {
                type: 'setExecutionState',
                params: ({ event }) => ({ state: event.output }),
              },
            },
          ],
          onError: {
            target: 'error',
            actions: {
              type: 'setError',
              params: ({ event }) => ({ error: event.error?.message || 'Phase processing failed' }),
            },
          },
        },
      },

      /**
       * Resting state - rest period between phases
       */
      resting: {
        entry: [
          {
            type: 'logStateTransition',
            params: { from: 'processingPhase', to: 'resting' },
          },
        ],
        initial: 'timerReady',
        states: {
          timerReady: {
            on: {
              START_REST_TIMER: {
                target: 'timerRunning',
                actions: 'startTimer',
              },
              SKIP_REST: {
                target: '#advancedSet.ready',
                actions: 'clearTimer',
              },
            },
          },
          timerRunning: {
            invoke: {
              id: 'restTimer',
              src: 'timer',
              input: { seconds: 1 },
              onDone: [
                {
                  guard: ({ context }) => context.timer.remainingSeconds - 1 <= 0,
                  target: 'timerComplete',
                  actions: 'decrementTimer',
                },
                {
                  target: 'timerRunning',
                  actions: 'decrementTimer',
                  reenter: true,
                },
              ],
            },
            on: {
              PAUSE_TIMER: {
                target: 'timerPaused',
                actions: 'pauseTimer',
              },
              SKIP_REST: {
                target: '#advancedSet.ready',
                actions: 'clearTimer',
              },
              TIMER_COMPLETE: {
                target: 'timerComplete',
              },
            },
          },
          timerPaused: {
            on: {
              RESUME_TIMER: {
                target: 'timerRunning',
                actions: 'resumeTimer',
              },
              SKIP_REST: {
                target: '#advancedSet.ready',
                actions: 'clearTimer',
              },
            },
          },
          timerComplete: {
            entry: 'clearTimer',
            always: {
              target: '#advancedSet.ready',
            },
          },
        },
        on: {
          RESET_SET: {
            target: 'idle',
          },
          ABORT_SET: {
            target: 'idle',
          },
        },
      },

      /**
       * Completed state - advanced set execution is finished
       */
      completed: {
        entry: [
          'clearTimer',
          {
            type: 'logStateTransition',
            params: { from: 'any', to: 'completed' },
          },
        ],
        on: {
          INITIALIZE: {
            target: 'initializing',
          },
          RESET_SET: {
            target: 'idle',
          },
        },
      },

      /**
       * Error state - execution encountered an error
       */
      error: {
        entry: [
          'clearTimer',
          {
            type: 'logStateTransition',
            params: { from: 'any', to: 'error' },
          },
        ],
        on: {
          INITIALIZE: {
            target: 'initializing',
          },
          RESET_SET: {
            target: 'idle',
          },
        },
      },
    },
  });
};

/**
 * Type for the advanced set machine created by the factory
 */
export type AdvancedSetMachine = ReturnType<typeof createAdvancedSetStateMachine>;

/**
 * Type for the advanced set actor created from the machine
 */
export type AdvancedSetActor = ReturnType<typeof createActor<AdvancedSetMachine>>;

/**
 * Helper function to create and start an advanced set actor
 */
export const createAdvancedSetActor = (
  dependencies: AdvancedSetMachineDependencies
): AdvancedSetActor => {
  const machine = createAdvancedSetStateMachine(dependencies);
  return createActor(machine);
};
