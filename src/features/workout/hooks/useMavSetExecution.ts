import { useMemo } from 'react';

import type { MavSetConfiguration } from '@/features/training-plan/domain/sets/MavSetConfiguration';

import {
  useAdvancedSetExecution,
  type UseAdvancedSetExecutionResult,
} from './useAdvancedSetExecution';

/**
 * MAV set specific execution state and helpers
 */
export interface UseMavSetExecutionResult extends UseAdvancedSetExecutionResult {
  // MAV set specific data
  mavConfig: MavSetConfiguration | null;
  isFirstSet: boolean;
  isLastSet: boolean;
  isMidSets: boolean;

  // Set tracking
  currentSet: number;
  totalSets: number;
  remainingSets: number;
  setsCompleted: number;

  // Volume and intensity
  repsPerSet: number | null;
  targetRpe: number | null;
  restBetweenSets: number | null;
  totalVolumeTarget: number;
  currentVolume: number;
  remainingVolume: number;

  // Consistency tracking
  setHistory: Array<{
    setNumber: number;
    reps: number;
    rpe?: number;
    hitTarget: boolean;
    repDeficit: number;
  }>;
  averageRpe: number;
  consistencyScore: number; // Percentage of sets hitting target reps

  // Helper functions
  shouldAdjustWeight: (
    lastSetReps: number,
    lastSetRpe?: number
  ) => {
    action: 'maintain' | 'increase' | 'decrease';
    reason: string;
  };
  getVolumeProgress: () => {
    completed: number;
    remaining: number;
    percentage: number;
  };
  getPaceAnalysis: () => {
    onTrack: boolean;
    projectedTotal: number;
    recommendation: string;
  };
  getProgressPercentage: () => number;
}

/**
 * Specific hook for MAV (Maximum Adaptive Volume) set execution logic.
 *
 * MAV sets involve performing multiple sets with consistent reps and weight,
 * focusing on volume accumulation at a specific RPE. The goal is to maintain
 * consistent performance across all sets.
 *
 * MAV characteristics:
 * - Fixed reps per set (typically 5-8)
 * - Fixed weight throughout
 * - Target RPE maintained (typically 7-8)
 * - Multiple sets (typically 4-8 sets)
 * - Consistent rest periods
 *
 * MAV phases:
 * 1. Set 1: 70kg×5 @ RPE 7
 * 2. Rest (60 seconds)
 * 3. Set 2: 70kg×5 @ RPE 7
 * 4. Rest (60 seconds)
 * 5. Continue for all sets
 * 6. Monitor consistency and adjust future sessions
 *
 * @param profileId - The profile ID for scoping operations
 * @param workoutLogId - The workout log ID this set belongs to
 * @param exerciseId - The exercise ID this set is for
 * @param mavConfig - MAV configuration with set count, reps, and target RPE
 * @returns MAV set specific execution interface with volume and consistency tracking
 *
 * @example
 * ```typescript
 * const mav = useMavSetExecution('profile-1', 'workout-1', 'exercise-1', config);
 *
 * // Initialize MAV protocol
 * await mav.initialize(config, 70); // 70kg weight
 *
 * // Display current phase
 * return (
 *   <Box>
 *     <Text>
 *       MAV Set {mav.currentSet}/{mav.totalSets}: {mav.currentWeight}kg × {mav.repsPerSet}
 *       Target RPE: {mav.targetRpe}
 *     </Text>
 *     <Text>
 *       Volume: {mav.currentVolume}/{mav.totalVolumeTarget} reps
 *       ({mav.getVolumeProgress().percentage}%)
 *     </Text>
 *     <Text>
 *       Consistency: {mav.consistencyScore}% (Avg RPE: {mav.averageRpe})
 *     </Text>
 *   </Box>
 * );
 *
 * // Complete a set
 * await mav.completeCurrentSet({
 *   weight: 70,
 *   counts: 5, // Hit target reps
 *   rpe: 7,   // Hit target RPE
 *   completed: true
 * });
 *
 * // Check if weight adjustment is needed
 * const adjustment = mav.shouldAdjustWeight(5, 7);
 * console.log(adjustment.action); // 'maintain' - on target
 *
 * // If struggling (only got 3 reps @ RPE 9)
 * const strugglingAdjustment = mav.shouldAdjustWeight(3, 9);
 * console.log(strugglingAdjustment.action); // 'decrease'
 * console.log(strugglingAdjustment.reason); // 'RPE too high and reps below target'
 *
 * // Get pace analysis
 * const pace = mav.getPaceAnalysis();
 * if (!pace.onTrack) {
 *   console.log(pace.recommendation); // 'Consider reducing weight to maintain consistency'
 * }
 * ```
 */
export function useMavSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  mavConfig?: MavSetConfiguration
): UseMavSetExecutionResult {
  const baseExecution = useAdvancedSetExecution(profileId, workoutLogId, exerciseId);

  // MAV specific computations
  const config = useMemo(() => {
    return mavConfig || null;
  }, [mavConfig]);

  // Set tracking
  const currentSet = useMemo(() => {
    return baseExecution.currentPhase;
  }, [baseExecution.currentPhase]);

  const totalSets = useMemo(() => {
    return config?.sets || 0;
  }, [config]);

  const remainingSets = useMemo(() => {
    return Math.max(0, totalSets - currentSet);
  }, [totalSets, currentSet]);

  const setsCompleted = useMemo(() => {
    return baseExecution.completedSets.length;
  }, [baseExecution.completedSets]);

  // Phase analysis
  const isFirstSet = useMemo(() => {
    return currentSet === 1;
  }, [currentSet]);

  const isLastSet = useMemo(() => {
    return currentSet === totalSets;
  }, [currentSet, totalSets]);

  const isMidSets = useMemo(() => {
    return currentSet > 1 && currentSet < totalSets;
  }, [currentSet, totalSets]);

  // Volume and intensity
  const repsPerSet = useMemo(() => {
    return config?.repsPerSet || null;
  }, [config]);

  const targetRpe = useMemo(() => {
    return config?.targetRpe || null;
  }, [config]);

  const restBetweenSets = useMemo(() => {
    return config?.restBetweenSetsSeconds || null;
  }, [config]);

  const totalVolumeTarget = useMemo(() => {
    if (!config) return 0;
    return config.sets * config.repsPerSet;
  }, [config]);

  const currentVolume = useMemo(() => {
    return baseExecution.completedSets.reduce((total, set) => total + set.counts, 0);
  }, [baseExecution.completedSets]);

  const remainingVolume = useMemo(() => {
    return Math.max(0, totalVolumeTarget - currentVolume);
  }, [totalVolumeTarget, currentVolume]);

  // Consistency tracking
  const setHistory = useMemo(() => {
    if (!config) return [];

    return baseExecution.completedSets.map((set, index) => ({
      setNumber: index + 1,
      reps: set.counts,
      rpe: set.rpe,
      hitTarget: set.counts >= config.repsPerSet,
      repDeficit: Math.max(0, config.repsPerSet - set.counts),
    }));
  }, [baseExecution.completedSets, config]);

  const averageRpe = useMemo(() => {
    const rpeSets = setHistory.filter((set) => set.rpe !== undefined);
    if (rpeSets.length === 0) return 0;

    const totalRpe = rpeSets.reduce((sum, set) => sum + (set.rpe || 0), 0);
    return Math.round((totalRpe / rpeSets.length) * 10) / 10;
  }, [setHistory]);

  const consistencyScore = useMemo(() => {
    if (setHistory.length === 0) return 100;

    const successfulSets = setHistory.filter((set) => set.hitTarget).length;
    return Math.round((successfulSets / setHistory.length) * 100);
  }, [setHistory]);

  // Helper functions
  const shouldAdjustWeight = useMemo(() => {
    return (lastSetReps: number, lastSetRpe?: number) => {
      if (!config) return { action: 'maintain' as const, reason: 'No configuration' };

      const targetReps = config.repsPerSet;
      const targetRpeValue = config.targetRpe;

      // Check if reps were hit
      const repsHit = lastSetReps >= targetReps;

      // Check if RPE is appropriate (if provided)
      const rpeAppropriate =
        !lastSetRpe || (lastSetRpe >= targetRpeValue - 0.5 && lastSetRpe <= targetRpeValue + 0.5);

      if (repsHit && rpeAppropriate) {
        return {
          action: 'maintain' as const,
          reason: 'Performance on target - maintain current weight',
        };
      }

      if (!repsHit && lastSetRpe && lastSetRpe > targetRpeValue + 1) {
        return {
          action: 'decrease' as const,
          reason: 'RPE too high and reps below target - reduce weight',
        };
      }

      if (repsHit && lastSetRpe && lastSetRpe < targetRpeValue - 1) {
        return {
          action: 'increase' as const,
          reason: 'RPE too low despite hitting reps - consider increasing weight next session',
        };
      }

      if (!repsHit) {
        return {
          action: 'decrease' as const,
          reason: 'Failed to hit target reps - consider reducing weight',
        };
      }

      return {
        action: 'maintain' as const,
        reason: 'Continue monitoring performance',
      };
    };
  }, [config]);

  const getVolumeProgress = useMemo(() => {
    return () => ({
      completed: currentVolume,
      remaining: remainingVolume,
      percentage: Math.round((currentVolume / totalVolumeTarget) * 100),
    });
  }, [currentVolume, remainingVolume, totalVolumeTarget]);

  const getPaceAnalysis = useMemo(() => {
    return () => {
      if (!config || setHistory.length === 0) {
        return {
          onTrack: true,
          projectedTotal: totalVolumeTarget,
          recommendation: 'Continue as planned',
        };
      }

      const averageRepsPerSet = currentVolume / setHistory.length;
      const projectedTotal = Math.round(averageRepsPerSet * config.sets);
      const onTrack = projectedTotal >= totalVolumeTarget * 0.9; // Within 90% of target

      let recommendation = 'Continue as planned';

      if (!onTrack) {
        if (averageRpe > config.targetRpe + 1) {
          recommendation = 'Consider reducing weight to maintain consistency';
        } else {
          recommendation = 'Focus on hitting target reps each set';
        }
      } else if (averageRpe < config.targetRpe - 1) {
        recommendation = 'Consider increasing weight for next MAV session';
      }

      return {
        onTrack,
        projectedTotal,
        recommendation,
      };
    };
  }, [config, setHistory, currentVolume, totalVolumeTarget, averageRpe]);

  const getProgressPercentage = useMemo(() => {
    return (): number => {
      if (!totalSets) return 0;
      return Math.round(((currentSet - 1) / totalSets) * 100);
    };
  }, [currentSet, totalSets]);

  return {
    ...baseExecution,

    // MAV set specific data
    mavConfig: config,
    isFirstSet,
    isLastSet,
    isMidSets,

    // Set tracking
    currentSet,
    totalSets,
    remainingSets,
    setsCompleted,

    // Volume and intensity
    repsPerSet,
    targetRpe,
    restBetweenSets,
    totalVolumeTarget,
    currentVolume,
    remainingVolume,

    // Consistency tracking
    setHistory,
    averageRpe,
    consistencyScore,

    // Helper functions
    shouldAdjustWeight,
    getVolumeProgress,
    getPaceAnalysis,
    getProgressPercentage,
  };
}

/**
 * Type export for the hook result
 */
export type UseMavSetExecutionHook = typeof useMavSetExecution;
