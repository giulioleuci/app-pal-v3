import { useMemo } from 'react';

import type { RestPauseSetConfiguration } from '@/features/training-plan/domain/sets/RestPauseSetConfiguration';

import {
  useAdvancedSetExecution,
  type UseAdvancedSetExecutionResult,
} from './useAdvancedSetExecution';

/**
 * Rest-Pause specific execution state and helpers
 */
export interface UseRestPauseExecutionResult extends UseAdvancedSetExecutionResult {
  // Rest-Pause specific data
  restPauseConfig: RestPauseSetConfiguration | null;
  isMainSet: boolean;
  isPausePhase: boolean;
  isContinuationSet: boolean;

  // Pause tracking
  currentPause: number;
  totalPauses: number;
  remainingPauses: number;
  pauseDuration: number | null;

  // Set progression
  mainSetReps: number | null;
  miniSetReps: number | null;
  targetRpe: number | null;

  // Accumulated data
  totalRepsCompleted: number;
  totalSetsCompleted: number;
  pauseHistory: Array<{
    pauseNumber: number;
    restDuration: number;
    repsAfterPause: number;
    rpe?: number;
  }>;

  // Helper functions
  shouldContinuePauses: (lastMiniSetReps: number) => boolean;
  getMainSetTarget: () => { reps: number; rpe: number } | null;
  getMiniSetTarget: () => { reps: number; rpe?: number } | null;
  getRemainingTotalReps: () => number;
  getProgressPercentage: () => number;
}

/**
 * Specific hook for Rest-Pause execution logic.
 *
 * Rest-Pause sets involve:
 * 1. Main set: Perform reps to near failure (typically RPE 9-10)
 * 2. Brief rest pause (10-15 seconds)
 * 3. Continuation set: Perform additional reps with same weight
 * 4. Repeat pause-continuation cycle until unable to perform target reps
 *
 * Rest-Pause phases:
 * 1. Main set (8 reps @ RPE 9)
 * 2. Pause (15 seconds)
 * 3. Continue (3 reps target)
 * 4. Pause (15 seconds)
 * 5. Continue (3 reps target)
 * 6. Continue until failure to reach target or max pauses
 *
 * @param profileId - The profile ID for scoping operations
 * @param workoutLogId - The workout log ID this set belongs to
 * @param exerciseId - The exercise ID this set is for
 * @param restPauseConfig - Rest-Pause configuration with main set and mini-set parameters
 * @returns Rest-Pause specific execution interface with pause timing and rep accumulation
 *
 * @example
 * ```typescript
 * const restPause = useRestPauseExecution('profile-1', 'workout-1', 'exercise-1', config);
 *
 * // Initialize Rest-Pause protocol
 * await restPause.initialize(config, 80); // 80kg weight
 *
 * // Display current phase
 * if (restPause.isMainSet) {
 *   return (
 *     <Text>
 *       Main Set: {restPause.mainSetReps} reps @ RPE {restPause.targetRpe}
 *     </Text>
 *   );
 * } else if (restPause.isPausePhase) {
 *   return (
 *     <Text>
 *       Rest-Pause {restPause.currentPause}: {restPause.restTimer.formattedTime}
 *     </Text>
 *   );
 * } else if (restPause.isContinuationSet) {
 *   return (
 *     <Text>
 *       Continue {restPause.currentPause}: Target {restPause.miniSetReps} reps
 *       (Total: {restPause.totalRepsCompleted} reps)
 *     </Text>
 *   );
 * }
 *
 * // Complete main set
 * await restPause.completeCurrentSet({
 *   weight: 80,
 *   counts: 8,
 *   rpe: 9,
 *   completed: true
 * });
 *
 * // Complete continuation set and check if should continue
 * const continuationReps = 2; // Failed to reach 3 rep target
 * const shouldContinue = restPause.shouldContinuePauses(continuationReps);
 *
 * if (shouldContinue) {
 *   await restPause.completeCurrentSet({
 *     weight: 80,
 *     counts: continuationReps,
 *     rpe: 10,
 *     completed: true
 *   });
 * } else {
 *   // End Rest-Pause - unable to maintain target
 *   restPause.abort();
 * }
 *
 * console.log(`Total reps: ${restPause.totalRepsCompleted}`); // 10 reps (8 + 2)
 * ```
 */
export function useRestPauseExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  restPauseConfig?: RestPauseSetConfiguration
): UseRestPauseExecutionResult {
  const baseExecution = useAdvancedSetExecution(profileId, workoutLogId, exerciseId);

  // Rest-Pause specific computations
  const config = useMemo(() => {
    return restPauseConfig || null;
  }, [restPauseConfig]);

  // Phase analysis
  const isMainSet = useMemo(() => {
    return baseExecution.currentPhase === 1;
  }, [baseExecution.currentPhase]);

  const isPausePhase = useMemo(() => {
    return baseExecution.restTimer.isActive && baseExecution.currentPhase > 1;
  }, [baseExecution.restTimer.isActive, baseExecution.currentPhase]);

  const isContinuationSet = useMemo(() => {
    return (
      baseExecution.currentPhase > 1 &&
      !baseExecution.isCompleted &&
      !baseExecution.restTimer.isActive
    );
  }, [baseExecution.currentPhase, baseExecution.isCompleted, baseExecution.restTimer.isActive]);

  // Pause tracking
  const currentPause = useMemo(() => {
    return Math.max(0, baseExecution.currentPhase - 1);
  }, [baseExecution.currentPhase]);

  const totalPauses = useMemo(() => {
    return config?.maxMiniSets || 0;
  }, [config]);

  const remainingPauses = useMemo(() => {
    return Math.max(0, totalPauses - currentPause);
  }, [totalPauses, currentPause]);

  const pauseDuration = useMemo(() => {
    return config?.restPauseSeconds || null;
  }, [config]);

  // Set progression data
  const mainSetReps = useMemo(() => {
    return config?.mainSetReps || null;
  }, [config]);

  const miniSetReps = useMemo(() => {
    return config?.miniSetReps || null;
  }, [config]);

  const targetRpe = useMemo(() => {
    return config?.rpe || null;
  }, [config]);

  // Accumulated data
  const totalRepsCompleted = useMemo(() => {
    return baseExecution.completedSets.reduce((total, set) => total + set.counts, 0);
  }, [baseExecution.completedSets]);

  const totalSetsCompleted = useMemo(() => {
    return baseExecution.completedSets.length;
  }, [baseExecution.completedSets]);

  // Pause history from completed continuation sets
  const pauseHistory = useMemo(() => {
    if (!config || baseExecution.completedSets.length <= 1) return [];

    return baseExecution.completedSets
      .slice(1) // Skip main set
      .map((set, index) => ({
        pauseNumber: index + 1,
        restDuration: config.restPauseSeconds,
        repsAfterPause: set.counts,
        rpe: set.rpe,
      }));
  }, [baseExecution.completedSets, config]);

  // Helper functions
  const shouldContinuePauses = useMemo(() => {
    return (lastMiniSetReps: number): boolean => {
      if (!config) return false;

      // Continue if we reached the target reps and haven't hit max pauses
      return lastMiniSetReps >= config.miniSetReps && currentPause < totalPauses;
    };
  }, [config, currentPause, totalPauses]);

  const getMainSetTarget = useMemo(() => {
    return (): { reps: number; rpe: number } | null => {
      if (!config) return null;

      return {
        reps: config.mainSetReps,
        rpe: config.rpe,
      };
    };
  }, [config]);

  const getMiniSetTarget = useMemo(() => {
    return (): { reps: number; rpe?: number } | null => {
      if (!config) return null;

      return {
        reps: config.miniSetReps,
        rpe: config.rpe, // Same RPE as main set
      };
    };
  }, [config]);

  const getRemainingTotalReps = useMemo(() => {
    return (): number => {
      if (!config) return 0;

      const targetTotalReps = config.mainSetReps + config.miniSetReps * totalPauses;
      return Math.max(0, targetTotalReps - totalRepsCompleted);
    };
  }, [config, totalPauses, totalRepsCompleted]);

  const getProgressPercentage = useMemo(() => {
    return (): number => {
      if (!config) return 0;

      const targetTotalReps = config.mainSetReps + config.miniSetReps * totalPauses;
      if (targetTotalReps === 0) return 100;

      return Math.round((totalRepsCompleted / targetTotalReps) * 100);
    };
  }, [config, totalPauses, totalRepsCompleted]);

  return {
    ...baseExecution,

    // Rest-Pause specific data
    restPauseConfig: config,
    isMainSet,
    isPausePhase,
    isContinuationSet,

    // Pause tracking
    currentPause,
    totalPauses,
    remainingPauses,
    pauseDuration,

    // Set progression
    mainSetReps,
    miniSetReps,
    targetRpe,

    // Accumulated data
    totalRepsCompleted,
    totalSetsCompleted,
    pauseHistory,

    // Helper functions
    shouldContinuePauses,
    getMainSetTarget,
    getMiniSetTarget,
    getRemainingTotalReps,
    getProgressPercentage,
  };
}

/**
 * Type export for the hook result
 */
export type UseRestPauseExecutionHook = typeof useRestPauseExecution;
