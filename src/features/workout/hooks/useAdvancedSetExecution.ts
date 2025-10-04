import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { container } from 'tsyringe';

import type { SetConfiguration } from '@/features/training-plan/domain/sets/SetConfiguration';

import type {
  AdvancedSetExecutionService,
  AdvancedSetExecutionState,
  SetProgressionData,
} from '../services/AdvancedSetExecutionService';
import { useAdvancedSetExecutionStore } from '../store/advancedSetExecutionStore';
import { useRestTimer } from './useRestTimer';

/**
 * Result interface for the main advanced set execution hook
 */
export interface UseAdvancedSetExecutionResult {
  // Execution state
  executionState: AdvancedSetExecutionState | null;
  isInitialized: boolean;
  isExecuting: boolean;
  isCompleted: boolean;

  // Phase management
  currentPhase: number;
  totalPhases: number;
  currentSetData: AdvancedSetExecutionState['currentSetData'] | null;
  nextSetData: AdvancedSetExecutionState['nextSetData'] | null;

  // Actions
  initialize: (setConfig: SetConfiguration, lastWeight?: number) => Promise<void>;
  completeCurrentSet: (setData: SetProgressionData) => Promise<void>;
  reset: () => void;
  abort: () => void;

  // Timer integration
  restTimer: ReturnType<typeof useRestTimer>;
  startRest: () => void;
  skipRest: () => void;

  // Progress tracking
  completedSets: SetProgressionData[];
  sessionId: string | null;

  // Loading and error states
  isInitializing: boolean;
  isProgressing: boolean;
  isValidating: boolean;
  error: string | null;

  // Validation
  validateSetData: (proposedData: SetProgressionData) => Promise<boolean>;
  getSuggestedRestPeriod: () => number;
}

/**
 * Main hook for managing advanced set execution state and bridging services to UI components.
 *
 * This hook provides a comprehensive interface for executing complex set types like drop sets,
 * myo-reps, pyramidal sets, rest-pause, and MAV sets. It integrates with the XState machine
 * and Zustand store for state management, and provides timer functionality for rest periods.
 *
 * Features:
 * - Real-time state management during set execution
 * - Automatic calculation of next weights/reps
 * - Timer management for rest periods
 * - Progress persistence and resumption
 * - Integration with existing rest timer system
 *
 * @param profileId - The profile ID for scoping operations
 * @param workoutLogId - The workout log ID this set belongs to
 * @param exerciseId - The exercise ID this set is for
 * @returns Comprehensive advanced set execution interface
 *
 * @example
 * ```typescript
 * const dropSetExecution = useAdvancedSetExecution('profile-1', 'workout-1', 'exercise-1');
 *
 * // Initialize a drop set
 * await dropSetExecution.initialize(dropSetConfig, 100);
 *
 * // Complete the main set
 * await dropSetExecution.completeCurrentSet({
 *   weight: 100,
 *   counts: 8,
 *   rpe: 9,
 *   completed: true
 * });
 *
 * // Start rest timer
 * dropSetExecution.startRest();
 *
 * // Display progress
 * return (
 *   <Box>
 *     <Typography>Phase {dropSetExecution.currentPhase} of {dropSetExecution.totalPhases}</Typography>
 *     <Typography>Next: {dropSetExecution.nextSetData?.weight}kg × {dropSetExecution.nextSetData?.expectedCounts}</Typography>
 *     {dropSetExecution.restTimer.isActive && (
 *       <Typography>Rest: {dropSetExecution.restTimer.formattedTime}</Typography>
 *     )}
 *   </Box>
 * );
 * ```
 */
export function useAdvancedSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string
): UseAdvancedSetExecutionResult {
  const executionService = container.resolve(
    'AdvancedSetExecutionService'
  ) as AdvancedSetExecutionService;
  const queryClient = useQueryClient();

  // Local state
  const [executionState, setExecutionState] = useState<AdvancedSetExecutionState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Store integration - use stable selectors to avoid infinite loops
  const activeSessionForExercise = useAdvancedSetExecutionStore(
    useCallback(
      (state) => {
        const sessions = Object.values(state.activeSessions);
        return sessions.find(
          (s) =>
            s.workoutLogId === workoutLogId &&
            s.exerciseId === exerciseId &&
            !s.executionState?.isCompleted
        );
      },
      [workoutLogId, exerciseId]
    )
  );

  // Rest timer integration
  const restTimer = useRestTimer();
  const restTimerStart = restTimer.start;
  const restTimerSkip = restTimer.skip;
  const restTimerReset = restTimer.reset;

  // Mutations for async operations
  const initializeMutation = useMutation({
    mutationFn: async ({
      setConfig,
      lastWeight,
    }: {
      setConfig: SetConfiguration;
      lastWeight?: number;
    }) => {
      setError(null);
      const result = await executionService.initializeExecution(setConfig, lastWeight);
      if (result.isFailure) {
        throw new Error(result.error?.message || 'Failed to initialize execution');
      }
      return result.getValue();
    },
    onSuccess: (state, { setConfig }) => {
      setExecutionState(state);

      // Create session in store
      const store = useAdvancedSetExecutionStore.getState();
      const newSessionId = store.createSession({
        profileId,
        workoutLogId,
        exerciseId,
        setType: state.setType,
        setConfigurationJson: JSON.stringify(setConfig),
        executionState: state,
      });

      setSessionId(newSessionId);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (completedSetData: SetProgressionData) => {
      if (!executionState) {
        throw new Error('No active execution state');
      }

      setError(null);
      const result = await executionService.progressToNextPhase(executionState, completedSetData);
      if (result.isFailure) {
        throw new Error(result.error?.message || 'Failed to progress to next phase');
      }
      return { newState: result.getValue(), completedSetData };
    },
    onSuccess: ({ newState, completedSetData }) => {
      setExecutionState(newState);

      // Update store session
      if (sessionId) {
        const store = useAdvancedSetExecutionStore.getState();
        store.addCompletedSet(sessionId, completedSetData);
        store.updateExecutionState(sessionId, newState);

        // Start rest timer if there's a rest period and not completed
        if (!newState.isCompleted && newState.restPeriodSeconds && newState.restPeriodSeconds > 0) {
          restTimerStart(newState.restPeriodSeconds);

          // Update timer state in store immediately
          store.updateTimerState(sessionId, {
            isRunning: true,
            remainingSeconds: newState.restPeriodSeconds,
            totalSeconds: newState.restPeriodSeconds,
            startTime: Date.now(),
          });
        }

        // Complete session if execution is done
        if (newState.isCompleted) {
          store.completeSession(sessionId);
          setSessionId(null);
        }
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (proposedData: SetProgressionData) => {
      if (!executionState) {
        throw new Error('No active execution state');
      }

      const result = await executionService.validatePhaseCompletion(executionState, proposedData);
      if (result.isFailure) {
        throw new Error(result.error?.message || 'Validation failed');
      }
      return result.getValue();
    },
  });

  // Initialize from existing session on mount
  useEffect(() => {
    if (activeSessionForExercise && !executionState) {
      setExecutionState(activeSessionForExercise.executionState);
      setSessionId(activeSessionForExercise.id);

      // Restore timer state if applicable (but don't include restTimer in dependencies)
      if (
        activeSessionForExercise.timerState.isRunning &&
        activeSessionForExercise.timerState.remainingSeconds > 0
      ) {
        restTimerStart(activeSessionForExercise.timerState.remainingSeconds);
      }
    }
  }, [activeSessionForExercise?.id, executionState, restTimerStart]);

  // Sync timer state to store when timer active state changes
  const prevTimerActiveRef = useRef(restTimer.isActive);
  const prevSessionIdRef = useRef(sessionId);

  useEffect(() => {
    if (
      sessionId &&
      (prevTimerActiveRef.current !== restTimer.isActive || prevSessionIdRef.current !== sessionId)
    ) {
      prevTimerActiveRef.current = restTimer.isActive;
      prevSessionIdRef.current = sessionId;

      // Use the current store state instead of causing re-renders
      const currentStore = useAdvancedSetExecutionStore.getState();
      currentStore.updateTimerState(sessionId, {
        isRunning: restTimer.isActive,
        remainingSeconds: restTimer.timeRemaining,
        totalSeconds: restTimer.isActive
          ? restTimer.timeRemaining
          : (currentStore.getSession(sessionId)?.timerState.totalSeconds ??
            restTimer.timeRemaining),
        startTime: restTimer.isActive ? Date.now() : null,
      });
    }
  }, [sessionId, restTimer.isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      restTimerReset();
    };
  }, [restTimerReset]);

  // Actions
  const initialize = useCallback(
    async (setConfig: SetConfiguration, lastWeight?: number) => {
      await initializeMutation.mutateAsync({ setConfig, lastWeight });
    },
    [initializeMutation]
  );

  const completeCurrentSet = useCallback(
    async (setData: SetProgressionData) => {
      await progressMutation.mutateAsync(setData);
    },
    [progressMutation]
  );

  const reset = useCallback(() => {
    if (sessionId) {
      useAdvancedSetExecutionStore.getState().abortSession(sessionId);
    }
    setExecutionState(null);
    setSessionId(null);
    setError(null);
    restTimerReset();
  }, [sessionId, restTimerReset]);

  const abort = useCallback(() => {
    reset();
  }, [reset]);

  const startRest = useCallback(() => {
    const restPeriod = executionState?.restPeriodSeconds;
    if (restPeriod && restPeriod > 0) {
      restTimerStart(restPeriod);

      // Sync to store immediately after starting timer
      if (sessionId) {
        const currentStore = useAdvancedSetExecutionStore.getState();
        currentStore.updateTimerState(sessionId, {
          isRunning: true,
          remainingSeconds: restPeriod,
          totalSeconds: restPeriod,
          startTime: Date.now(),
        });
      }
    }
  }, [executionState?.restPeriodSeconds, restTimerStart, sessionId]);

  const skipRest = useCallback(() => {
    restTimerSkip();

    // Sync to store immediately after skipping timer
    if (sessionId) {
      const currentStore = useAdvancedSetExecutionStore.getState();
      currentStore.updateTimerState(sessionId, {
        isRunning: false,
        remainingSeconds: 0,
        startTime: null,
      });
    }
  }, [restTimerSkip, sessionId]);

  const validateSetData = useCallback(
    async (proposedData: SetProgressionData) => {
      try {
        return await validateMutation.mutateAsync(proposedData);
      } catch {
        return false;
      }
    },
    [validateMutation]
  );

  const getSuggestedRestPeriod = useCallback(() => {
    if (!executionState) return 60; // Default 1 minute
    return executionService.getSuggestedRestPeriod(executionState);
  }, [executionState, executionService]);

  // Computed state
  const isInitialized = executionState !== null;
  const isExecuting = isInitialized && !executionState.isCompleted;
  const isCompleted = executionState?.isCompleted ?? false;

  const sessionData = useAdvancedSetExecutionStore(
    useCallback((state) => (sessionId ? state.activeSessions[sessionId] : null), [sessionId])
  );
  const completedSets = useMemo(() => {
    return sessionData?.completedSets ?? [];
  }, [sessionData?.completedSets]);

  return {
    // Execution state
    executionState,
    isInitialized,
    isExecuting,
    isCompleted,

    // Phase management
    currentPhase: executionState?.currentPhase ?? 0,
    totalPhases: executionState?.totalPhases ?? 0,
    currentSetData: executionState?.currentSetData ?? null,
    nextSetData: executionState?.nextSetData ?? null,

    // Actions
    initialize,
    completeCurrentSet,
    reset,
    abort,

    // Timer integration
    restTimer,
    startRest,
    skipRest,

    // Progress tracking
    completedSets,
    sessionId,

    // Loading and error states
    isInitializing: initializeMutation.isPending,
    isProgressing: progressMutation.isPending,
    isValidating: validateMutation.isPending,
    error,

    // Validation
    validateSetData,
    getSuggestedRestPeriod,
  };
}

/**
 * Type export for the hook result
 */
export type UseAdvancedSetExecutionHook = typeof useAdvancedSetExecution;
