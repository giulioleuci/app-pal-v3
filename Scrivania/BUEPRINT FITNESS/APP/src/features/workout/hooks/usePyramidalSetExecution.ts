import { useMemo } from 'react';

import type { PyramidalSetConfiguration } from '@/features/training-plan/domain/sets/PyramidalSetConfiguration';
import { useAdvancedSetExecution, type UseAdvancedSetExecutionResult } from './useAdvancedSetExecution';

/**
 * Pyramidal set specific execution state and helpers
 */
export interface UsePyramidalSetExecutionResult extends UseAdvancedSetExecutionResult {
  // Pyramidal set specific data
  pyramidalConfig: PyramidalSetConfiguration | null;
  isAscendingPhase: boolean;
  isAtPeak: boolean;
  isDescendingPhase: boolean;
  
  // Step tracking
  currentStep: number;
  totalSteps: number;
  stepsToPeak: number;
  stepsFromPeak: number;
  remainingSteps: number;
  
  // Weight and rep progression
  currentWeight: number | null;
  nextWeight: number | null;
  currentReps: number | null;
  nextReps: number | null;
  peakWeight: number | null;
  startWeight: number | null;
  weightIncrement: number | null;
  
  // Progress visualization
  pyramidStructure: Array<{
    step: number;
    weight: number;
    reps: number;
    phase: 'ascending' | 'peak' | 'descending';
    completed: boolean;
    current: boolean;
  }>;
  
  // Helper functions
  getWeightForStep: (step: number) => number;
  getRepsForStep: (step: number) => number;
  getPyramidVisualization: () => string[];
  getProgressPercentage: () => number;
}

/**
 * Specific hook for pyramidal set execution logic.
 * 
 * Pyramidal sets involve progressively increasing weight while decreasing reps
 * to a peak, then reversing the pattern. This creates a "pyramid" structure.
 * 
 * Pyramidal phases:
 * 1. Ascending: 60kg×12, 70kg×10, 80kg×8, 90kg×6 (to peak)
 * 2. Peak: 100kg×4 (heaviest weight, lowest reps)
 * 3. Descending: 90kg×6, 80kg×8, 70kg×10, 60kg×12 (back down)
 * 
 * @param profileId - The profile ID for scoping operations
 * @param workoutLogId - The workout log ID this set belongs to
 * @param exerciseId - The exercise ID this set is for
 * @param pyramidalConfig - Pyramidal configuration with weight progression and rep scheme
 * @returns Pyramidal set specific execution interface with weight/rep progression
 * 
 * @example
 * ```typescript
 * const pyramid = usePyramidalSetExecution('profile-1', 'workout-1', 'exercise-1', config);
 * 
 * // Initialize pyramidal protocol
 * await pyramid.initialize(config);
 * 
 * // Display current phase
 * if (pyramid.isAscendingPhase) {
 *   return (
 *     <Text>
 *       Ascending Step {pyramid.currentStep}: {pyramid.currentWeight}kg × {pyramid.currentReps}
 *       (to peak: {pyramid.stepsToP eak} steps)
 *     </Text>
 *   );
 * } else if (pyramid.isAtPeak) {
 *   return (
 *     <Text>
 *       Peak: {pyramid.peakWeight}kg × {pyramid.currentReps} - Maximum effort!
 *     </Text>
 *   );
 * } else if (pyramid.isDescendingPhase) {
 *   return (
 *     <Text>
 *       Descending Step {pyramid.currentStep}: {pyramid.currentWeight}kg × {pyramid.currentReps}
 *       ({pyramid.remainingSteps} steps remaining)
 *     </Text>
 *   );
 * }
 * 
 * // Display pyramid structure
 * pyramid.pyramidStructure.forEach(step => {
 *   console.log(
 *     `Step ${step.step}: ${step.weight}kg × ${step.reps} ${step.current ? '← CURRENT' : ''}`
 *   );
 * });
 * 
 * // Complete current step
 * await pyramid.completeCurrentSet({
 *   weight: pyramid.currentWeight!,
 *   counts: pyramid.currentReps!,
 *   rpe: pyramid.isAtPeak ? 10 : 8,
 *   completed: true
 * });
 * 
 * // Visual representation
 * console.log(pyramid.getPyramidVisualization());
 * // [
 * //   "60kg×12",     ← base
 * //   " 70kg×10",    ← ascending
 * //   "  80kg×8",    ← ascending
 * //   "   90kg×6",   ← ascending
 * //   "    100kg×4", ← peak
 * //   "   90kg×6",   ← descending
 * //   "  80kg×8",    ← descending
 * //   " 70kg×10",    ← descending
 * //   "60kg×12"      ← base
 * // ]
 * ```
 */
export function usePyramidalSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  pyramidalConfig?: PyramidalSetConfiguration
): UsePyramidalSetExecutionResult {
  const baseExecution = useAdvancedSetExecution(profileId, workoutLogId, exerciseId);
  
  // Pyramidal specific computations
  const config = useMemo(() => {
    return pyramidalConfig || null;
  }, [pyramidalConfig]);
  
  // Step calculations
  const totalSteps = useMemo(() => {
    return config?.repsAtEachStep?.length || 0;
  }, [config]);
  
  const peakStepIndex = useMemo(() => {
    if (!config) return 0;
    return Math.floor(config.repsAtEachStep.length / 2);
  }, [config]);
  
  const stepsToP eak = useMemo(() => {
    return peakStepIndex;
  }, [peakStepIndex]);
  
  const currentStep = useMemo(() => {
    return baseExecution.currentPhase;
  }, [baseExecution.currentPhase]);
  
  // Phase analysis
  const isAscendingPhase = useMemo(() => {
    return currentStep <= peakStepIndex && currentStep > 0;
  }, [currentStep, peakStepIndex]);
  
  const isAtPeak = useMemo(() => {
    return currentStep === peakStepIndex + 1;
  }, [currentStep, peakStepIndex]);
  
  const isDescendingPhase = useMemo(() => {
    return currentStep > peakStepIndex + 1 && !baseExecution.isCompleted;
  }, [currentStep, peakStepIndex, baseExecution.isCompleted]);
  
  const stepsFromPeak = useMemo(() => {
    if (!isDescendingPhase) return 0;
    return currentStep - peakStepIndex - 1;
  }, [isDescendingPhase, currentStep, peakStepIndex]);
  
  const remainingSteps = useMemo(() => {
    return Math.max(0, totalSteps - currentStep);
  }, [totalSteps, currentStep]);
  
  // Weight and rep calculations
  const getWeightForStep = useMemo(() => {
    return (step: number): number => {
      if (!config) return 0;
      
      const stepIndex = step - 1; // Convert to 0-based index
      if (stepIndex < 0 || stepIndex >= config.repsAtEachStep.length) return 0;
      
      const stepsFromStart = Math.min(stepIndex, peakStepIndex);
      return config.startWeight + (stepsFromStart * config.stepWeightIncrease);
    };
  }, [config, peakStepIndex]);
  
  const getRepsForStep = useMemo(() => {
    return (step: number): number => {
      if (!config) return 0;
      
      const stepIndex = step - 1; // Convert to 0-based index
      if (stepIndex < 0 || stepIndex >= config.repsAtEachStep.length) return 0;
      
      return config.repsAtEachStep[stepIndex];
    };
  }, [config]);
  
  const currentWeight = useMemo(() => {
    return getWeightForStep(currentStep);
  }, [getWeightForStep, currentStep]);
  
  const nextWeight = useMemo(() => {
    if (currentStep >= totalSteps) return null;
    return getWeightForStep(currentStep + 1);
  }, [getWeightForStep, currentStep, totalSteps]);
  
  const currentReps = useMemo(() => {
    return getRepsForStep(currentStep);
  }, [getRepsForStep, currentStep]);
  
  const nextReps = useMemo(() => {
    if (currentStep >= totalSteps) return null;
    return getRepsForStep(currentStep + 1);
  }, [getRepsForStep, currentStep, totalSteps]);
  
  const peakWeight = useMemo(() => {
    return getWeightForStep(peakStepIndex + 1);
  }, [getWeightForStep, peakStepIndex]);
  
  const startWeight = useMemo(() => {
    return config?.startWeight || null;
  }, [config]);
  
  const weightIncrement = useMemo(() => {
    return config?.stepWeightIncrease || null;
  }, [config]);
  
  // Pyramid structure visualization
  const pyramidStructure = useMemo(() => {
    if (!config) return [];
    
    return config.repsAtEachStep.map((reps, index) => {
      const step = index + 1;
      const weight = getWeightForStep(step);
      const completed = step < currentStep;
      const current = step === currentStep;
      
      let phase: 'ascending' | 'peak' | 'descending';
      if (step <= peakStepIndex) {
        phase = 'ascending';
      } else if (step === peakStepIndex + 1) {
        phase = 'peak';
      } else {
        phase = 'descending';
      }
      
      return {
        step,
        weight,
        reps,
        phase,
        completed,
        current,
      };
    });
  }, [config, getWeightForStep, currentStep, peakStepIndex]);
  
  // Helper functions
  const getPyramidVisualization = useMemo(() => {
    return (): string[] => {
      if (!config) return [];
      
      return pyramidStructure.map((step, index) => {
        const indent = ' '.repeat(Math.abs(index - peakStepIndex));
        const marker = step.completed ? '✓' : (step.current ? '→' : ' ');
        return `${indent}${marker} ${step.weight}kg×${step.reps}`;
      });
    };
  }, [pyramidStructure, peakStepIndex, config]);
  
  const getProgressPercentage = useMemo(() => {
    return (): number => {
      if (!totalSteps) return 0;
      return Math.round(((currentStep - 1) / totalSteps) * 100);
    };
  }, [currentStep, totalSteps]);
  
  return {
    ...baseExecution,
    
    // Pyramidal set specific data
    pyramidalConfig: config,
    isAscendingPhase,
    isAtPeak,
    isDescendingPhase,
    
    // Step tracking
    currentStep,
    totalSteps,
    stepsToP eak,
    stepsFromPeak,
    remainingSteps,
    
    // Weight and rep progression
    currentWeight,
    nextWeight,
    currentReps,
    nextReps,
    peakWeight,
    startWeight,
    weightIncrement,
    
    // Progress visualization
    pyramidStructure,
    
    // Helper functions
    getWeightForStep,
    getRepsForStep,
    getPyramidVisualization,
    getProgressPercentage,
  };
}

/**
 * Type export for the hook result
 */
export type UsePyramidalSetExecutionHook = typeof usePyramidalSetExecution;