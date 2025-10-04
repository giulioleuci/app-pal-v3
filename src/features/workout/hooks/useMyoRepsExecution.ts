import { useMemo } from 'react';

import type { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';

import {
  useAdvancedSetExecution,
  type UseAdvancedSetExecutionResult,
} from './useAdvancedSetExecution';

/**
 * MyoReps specific execution state and helpers
 */
export interface UseMyoRepsExecutionResult extends UseAdvancedSetExecutionResult {
  // MyoReps specific data
  myoRepsConfig: MyoRepsSetConfiguration | null;
  isActivationSet: boolean;
  isMiniSet: boolean;
  isRestBetweenMiniSets: boolean;

  // Mini set tracking
  currentMiniSet: number;
  totalMiniSets: number;
  remainingMiniSets: number;

  // Activation set data
  activationReps: number | null;
  activationRpe: number | null;
  targetMiniSetReps: number | null;

  // Progress tracking
  miniSetHistory: Array<{
    setNumber: number;
    reps: number;
    rpe?: number;
    reachedTarget: boolean;
  }>;

  // Helper functions
  shouldContinueMiniSets: (lastMiniSetReps: number) => boolean;
  getActivationSetTarget: () => { reps: number; rpe: number } | null;
  getMiniSetTarget: () => { reps: number; rpe?: number } | null;
  getProgressPercentage: () => number;
}

/**
 * Specific hook for MyoReps execution logic.
 *
 * MyoReps (Myo-Repetition) sets involve:
 * 1. Activation set: Perform reps to a specific RPE (usually 8-9)
 * 2. Brief rest (15-20 seconds)
 * 3. Mini-sets: Perform smaller rep clusters until failure to maintain target reps
 * 4. Continue until unable to reach target reps or max mini-sets reached
 *
 * MyoReps phases:
 * 1. Activation set (15 reps @ RPE 9)
 * 2. Rest (15-20 seconds)
 * 3. Mini-set 1 (5 reps target)
 * 4. Rest (15-20 seconds)
 * 5. Mini-set 2 (5 reps target)
 * 6. Continue until failure to reach target or max sets
 *
 * @param profileId - The profile ID for scoping operations
 * @param workoutLogId - The workout log ID this set belongs to
 * @param exerciseId - The exercise ID this set is for
 * @param myoRepsConfig - MyoReps configuration with activation and mini-set parameters
 * @returns MyoReps specific execution interface with rep tracking and continuation logic
 *
 * @example
 * ```typescript
 * const myoReps = useMyoRepsExecution('profile-1', 'workout-1', 'exercise-1', config);
 *
 * // Initialize MyoReps protocol
 * await myoReps.initialize(config, 60); // 60kg weight
 *
 * // Display current phase
 * if (myoReps.isActivationSet) {
 *   return (
 *     <Text>
 *       Activation Set: {myoReps.activationReps} reps @ RPE {myoReps.activationRpe}
 *     </Text>
 *   );
 * } else if (myoReps.isMiniSet) {
 *   return (
 *     <Text>
 *       Mini-Set {myoReps.currentMiniSet}/{myoReps.totalMiniSets}:
 *       Target {myoReps.targetMiniSetReps} reps
 *     </Text>
 *   );
 * }
 *
 * // Complete activation set
 * await myoReps.completeCurrentSet({
 *   weight: 60,
 *   counts: 15,
 *   rpe: 9,
 *   completed: true
 * });
 *
 * // Complete mini-set and check if should continue
 * const miniSetReps = 4; // Failed to reach 5 rep target
 * const shouldContinue = myoReps.shouldContinueMiniSets(miniSetReps);
 *
 * if (shouldContinue) {
 *   await myoReps.completeCurrentSet({
 *     weight: 60,
 *     counts: miniSetReps,
 *     rpe: 10,
 *     completed: true
 *   });
 * } else {
 *   // End MyoReps - unable to maintain target
 *   myoReps.abort();
 * }
 * ```
 */
export function useMyoRepsExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  myoRepsConfig?: MyoRepsSetConfiguration
): UseMyoRepsExecutionResult {
  const baseExecution = useAdvancedSetExecution(profileId, workoutLogId, exerciseId);

  // MyoReps specific computations
  const config = useMemo(() => {
    return myoRepsConfig || null;
  }, [myoRepsConfig]);

  // Phase analysis
  const isActivationSet = useMemo(() => {
    return baseExecution.currentPhase === 1;
  }, [baseExecution.currentPhase]);

  const isMiniSet = useMemo(() => {
    return baseExecution.currentPhase > 1 && !baseExecution.isCompleted;
  }, [baseExecution.currentPhase, baseExecution.isCompleted]);

  const isRestBetweenMiniSets = useMemo(() => {
    return baseExecution.restTimer.isActive && isMiniSet;
  }, [baseExecution.restTimer.isActive, isMiniSet]);

  // Mini set tracking
  const currentMiniSet = useMemo(() => {
    return Math.max(0, baseExecution.currentPhase - 1);
  }, [baseExecution.currentPhase]);

  const totalMiniSets = useMemo(() => {
    return config?.miniSets?.min || 0;
  }, [config]);

  const remainingMiniSets = useMemo(() => {
    return Math.max(0, totalMiniSets - currentMiniSet);
  }, [totalMiniSets, currentMiniSet]);

  // Configuration data
  const activationReps = useMemo(() => {
    return config?.activationCounts?.min || null;
  }, [config]);

  const activationRpe = useMemo(() => {
    return config?.rpe?.min || null;
  }, [config]);

  const targetMiniSetReps = useMemo(() => {
    return config?.miniSetCounts?.min || null;
  }, [config]);

  // Mini set history from completed sets
  const miniSetHistory = useMemo(() => {
    if (!config) return [];

    return baseExecution.completedSets
      .slice(1) // Skip activation set
      .map((set, index) => ({
        setNumber: index + 1,
        reps: set.counts,
        rpe: set.rpe,
        reachedTarget: set.counts >= (config.miniSetCounts?.min || 0),
      }));
  }, [baseExecution.completedSets, config]);

  // Helper functions
  const shouldContinueMiniSets = useMemo(() => {
    return (lastMiniSetReps: number): boolean => {
      if (!config) return false;

      // Continue if we reached the target reps and haven't hit max mini-sets
      return lastMiniSetReps >= (config.miniSetCounts?.min || 0) && currentMiniSet < totalMiniSets;
    };
  }, [config, currentMiniSet, totalMiniSets]);

  const getActivationSetTarget = useMemo(() => {
    return (): { reps: number; rpe: number } | null => {
      if (!config) return null;

      return {
        reps: config.activationCounts?.min || 0,
        rpe: config.rpe?.min || 0,
      };
    };
  }, [config]);

  const getMiniSetTarget = useMemo(() => {
    return (): { reps: number; rpe?: number } | null => {
      if (!config) return null;

      return {
        reps: config.miniSetCounts?.min || 0,
        rpe: config.rpe?.min, // Same RPE as activation set
      };
    };
  }, [config]);

  const getProgressPercentage = useMemo(() => {
    return (): number => {
      if (!baseExecution.totalPhases) return 0;

      // Factor in the variable nature of MyoReps - completion depends on performance
      const completedPhases = baseExecution.currentPhase - 1;
      const estimatedTotal = 1 + totalMiniSets; // Activation + estimated mini-sets

      return Math.round((completedPhases / estimatedTotal) * 100);
    };
  }, [baseExecution.currentPhase, totalMiniSets]);

  return {
    ...baseExecution,

    // MyoReps specific data
    myoRepsConfig: config,
    isActivationSet,
    isMiniSet,
    isRestBetweenMiniSets,

    // Mini set tracking
    currentMiniSet,
    totalMiniSets,
    remainingMiniSets,

    // Activation set data
    activationReps,
    activationRpe,
    targetMiniSetReps,

    // Progress tracking
    miniSetHistory,

    // Helper functions
    shouldContinueMiniSets,
    getActivationSetTarget,
    getMiniSetTarget,
    getProgressPercentage,
  };
}

/**
 * Type export for the hook result
 */
export type UseMyoRepsExecutionHook = typeof useMyoRepsExecution;
