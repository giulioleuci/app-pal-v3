/**
 * Shared types for workout execution services.
 * This file contains interfaces used by multiple execution services to avoid circular dependencies.
 */

/**
 * Interface for advanced set execution state
 */
export interface AdvancedSetExecutionState {
  readonly setType: 'drop' | 'myoReps' | 'pyramidal' | 'restPause' | 'mav';
  readonly currentPhase: number;
  readonly totalPhases: number;
  readonly isCompleted: boolean;
  readonly currentSetData: {
    weight?: number;
    counts: number;
    rpe?: number;
  };
  readonly nextSetData?: {
    weight?: number;
    expectedCounts: number;
    suggestedRpe?: number;
  };
  readonly restPeriodSeconds?: number;
}

/**
 * Interface for set progression data
 */
export interface SetProgressionData {
  readonly weight?: number;
  readonly counts: number;
  readonly rpe?: number;
  readonly completed: boolean;
}
