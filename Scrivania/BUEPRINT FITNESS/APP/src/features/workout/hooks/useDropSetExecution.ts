import { useMemo } from 'react';

import type { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';

import {
  useAdvancedSetExecution,
  type UseAdvancedSetExecutionResult,
} from './useAdvancedSetExecution';

/**
 * Drop set specific execution state and helpers
 */
export interface UseDropSetExecutionResult extends UseAdvancedSetExecutionResult {
  // Drop set specific data
  dropSetConfig: DropSetConfiguration | null;
  isMainSet: boolean;
  isDropPhase: boolean;
  dropNumber: number;
  totalDrops: number;

  // Weight calculations
  currentWeight: number | null;
  nextWeight: number | null;
  dropPercentage: number | null;

  // Progress helpers
  getDropWeights: (baseWeight: number) => number[];
  getRemainingDrops: () => number;
  getProgressPercentage: () => number;
}

/**
 * Specific hook for drop set execution logic.
 *
 * Drop sets involve performing a main set to near failure, then immediately reducing
 * the weight by a predetermined percentage and continuing for additional drops.
 * This hook manages the weight progression and drop sequence.
 *
 * Drop set phases:
 * 1. Main set (100% weight) → failure
 * 2. Drop 1 (80% weight) → failure
 * 3. Drop 2 (60% weight) → failure
 * 4. etc.
 *
 * @param profileId - The profile ID for scoping operations
 * @param workoutLogId - The workout log ID this set belongs to
 * @param exerciseId - The exercise ID this set is for
 * @param dropConfig - Drop set configuration with percentages and rest periods
 * @returns Drop set specific execution interface with weight calculations
 *
 * @example
 * ```typescript
 * const dropSet = useDropSetExecution('profile-1', 'workout-1', 'exercise-1', dropConfig);
 *
 * // Initialize with 100kg base weight
 * await dropSet.initialize(dropConfig, 100);
 *
 * // Display current phase
 * if (dropSet.isMainSet) {
 *   return <Text>Main Set: {dropSet.currentWeight}kg</Text>;
 * } else if (dropSet.isDropPhase) {
 *   return (
 *     <Text>
 *       Drop {dropSet.dropNumber}/{dropSet.totalDrops}: {dropSet.currentWeight}kg
 *       (-{dropSet.dropPercentage}%)
 *     </Text>
 *   );
 * }
 *
 * // Complete main set and progress to first drop
 * await dropSet.completeCurrentSet({
 *   weight: 100,
 *   counts: 8,
 *   rpe: 9,
 *   completed: true
 * });
 *
 * // Next weight is automatically calculated
 * console.log(dropSet.nextWeight); // 80kg (20% drop)
 * ```
 */
export function useDropSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  dropConfig?: DropSetConfiguration
): UseDropSetExecutionResult {
  const baseExecution = useAdvancedSetExecution(profileId, workoutLogId, exerciseId);

  // Drop set specific computations
  const dropSetConfig = useMemo(() => {
    return dropConfig || null;
  }, [dropConfig]);

  // Phase analysis
  const isMainSet = useMemo(() => {
    return baseExecution.currentPhase === 1;
  }, [baseExecution.currentPhase]);

  const isDropPhase = useMemo(() => {
    return baseExecution.currentPhase > 1 && !baseExecution.isCompleted;
  }, [baseExecution.currentPhase, baseExecution.isCompleted]);

  const dropNumber = useMemo(() => {
    return Math.max(0, baseExecution.currentPhase - 1);
  }, [baseExecution.currentPhase]);

  const totalDrops = useMemo(() => {
    return dropConfig?.drops?.min || 0;
  }, [dropConfig]);

  // Weight calculations
  const currentWeight = useMemo(() => {
    return baseExecution.currentSetData?.weight || null;
  }, [baseExecution.currentSetData]);

  const nextWeight = useMemo(() => {
    return baseExecution.nextSetData?.weight || null;
  }, [baseExecution.nextSetData]);

  const dropPercentage = useMemo(() => {
    if (!dropConfig || !isDropPhase) return null;

    // Default drop percentages for drop sets
    // First drop: 20%, Second drop: 40% (cumulative from original), etc.
    const defaultDropPercentages = [20, 40, 60, 80];

    const dropIndex = dropNumber - 1;
    if (dropIndex < 0 || dropIndex >= defaultDropPercentages.length) return null;

    return defaultDropPercentages[dropIndex];
  }, [dropConfig, isDropPhase, dropNumber]);

  // Helper functions
  const getDropWeights = useMemo(() => {
    return (baseWeight: number): number[] => {
      if (!dropConfig) return [];

      const weights = [baseWeight]; // Main set weight

      // Default drop percentages for drop sets
      const defaultDropPercentages = [20, 40, 60, 80];
      const numDrops = dropConfig.drops?.min || 0;

      for (let i = 0; i < numDrops; i++) {
        const percentage = defaultDropPercentages[i] || 80; // Default to 80% if we run out
        const previousWeight = weights[weights.length - 1];
        const dropWeight = Math.round(previousWeight * (1 - percentage / 100));
        weights.push(dropWeight);
      }

      return weights;
    };
  }, [dropConfig]);

  const getRemainingDrops = useMemo(() => {
    return (): number => {
      if (isMainSet) {
        return totalDrops; // All drops are remaining
      }
      return Math.max(0, totalDrops - dropNumber);
    };
  }, [totalDrops, dropNumber, isMainSet]);

  const getProgressPercentage = useMemo(() => {
    return (): number => {
      if (!baseExecution.totalPhases) return 0;
      return Math.round((baseExecution.currentPhase / baseExecution.totalPhases) * 100);
    };
  }, [baseExecution.currentPhase, baseExecution.totalPhases]);

  return {
    ...baseExecution,

    // Drop set specific data
    dropSetConfig,
    isMainSet,
    isDropPhase,
    dropNumber,
    totalDrops,

    // Weight calculations
    currentWeight,
    nextWeight,
    dropPercentage,

    // Progress helpers
    getDropWeights,
    getRemainingDrops,
    getProgressPercentage,
  };
}

/**
 * Type export for the hook result
 */
export type UseDropSetExecutionHook = typeof useDropSetExecution;
