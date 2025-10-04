import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { MavSetConfiguration } from '@/features/training-plan/domain/sets/MavSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { SetProgressionData } from './types';

/**
 * Interface for MAV (Maximum Adaptive Volume) execution state
 */
export interface MavExecutionState {
  readonly configuration: MavSetConfiguration;
  readonly currentPhase: number;
  readonly totalPhases: number;
  readonly isCompleted: boolean;
  readonly currentSetData: {
    weight: number;
    counts: number;
    rpe?: number;
  };
  readonly nextSetData?: {
    weight: number;
    expectedCounts: number;
    suggestedRpe?: number;
  };
  readonly restPeriodSeconds?: number;
  readonly setsCompleted: number;
  readonly totalVolumeAchieved: number;
  readonly performanceDecline: boolean;
  readonly lastSetPerformance?: {
    counts: number;
    rpe?: number;
  };
}

/**
 * Interface for MAV performance tracking
 */
export interface MavPerformanceMetrics {
  readonly averageReps: number;
  readonly averageRpe?: number;
  readonly volumePerSet: number;
  readonly performanceStability: 'stable' | 'declining' | 'improving';
  readonly recommendContinue: boolean;
}

/**
 * Application service responsible for managing MAV (Maximum Adaptive Volume) set execution.
 * MAV sets continue until performance significantly declines, maximizing training volume.
 */
@injectable()
export class MavExecutionService {
  private readonly PERFORMANCE_DECLINE_THRESHOLD = 0.8; // 20% drop triggers stop
  private readonly MIN_REPS_THRESHOLD = 0.5; // 50% of target triggers stop
  private readonly MAX_SETS_SAFETY_LIMIT = 20; // Safety limit to prevent endless sets

  constructor(@inject('ILogger') private readonly logger: ILogger) {}

  /**
   * Initializes execution state for a MAV set.
   * @param configuration The MAV set configuration
   * @param lastWeight Optional last weight used for this exercise
   * @returns A Result containing the initial execution state or an error
   */
  async initializeExecution(
    configuration: MavSetConfiguration,
    lastWeight?: number
  ): Promise<Result<MavExecutionState, ApplicationError>> {
    try {
      this.logger.info('Initializing MAV execution', {
        sets: configuration.sets,
        counts: configuration.counts,
        lastWeight,
      });

      const startingWeight = lastWeight || 0;
      const totalPhases = configuration.sets.max || this.MAX_SETS_SAFETY_LIMIT;

      const initialState: MavExecutionState = {
        configuration,
        currentPhase: 1,
        totalPhases,
        isCompleted: false,
        currentSetData: {
          weight: startingWeight,
          counts: configuration.counts.min,
          rpe: configuration.rpe?.min,
        },
        nextSetData: this.calculateNextMavSet(configuration, startingWeight, 1, []),
        restPeriodSeconds: undefined, // No rest before first set
        setsCompleted: 0,
        totalVolumeAchieved: 0,
        performanceDecline: false,
        lastSetPerformance: undefined,
      };

      this.logger.info('MAV execution initialized', {
        maxSets: totalPhases,
        startingWeight,
        targetCounts: configuration.counts.min,
        targetRpe: configuration.rpe?.min,
      });

      return Result.success(initialState);
    } catch (_error) {
      this.logger.error('Failed to initialize MAV execution', _error as Error);
      return Result.failure(new ApplicationError('Failed to initialize MAV execution', _error));
    }
  }

  /**
   * Progresses to the next set in the MAV sequence.
   * @param currentState The current execution state
   * @param completedSetData Data from the just-completed set
   * @returns A Result containing the updated execution state or an error
   */
  async progressToNextPhase(
    currentState: MavExecutionState,
    completedSetData: SetProgressionData
  ): Promise<Result<MavExecutionState, ApplicationError>> {
    try {
      this.logger.info('Progressing MAV to next phase', {
        currentPhase: currentState.currentPhase,
        setsCompleted: currentState.setsCompleted,
        completedSetData,
      });

      if (currentState.isCompleted) {
        return Result.failure(new ApplicationError('MAV set is already completed'));
      }

      const setsCompleted = currentState.setsCompleted + 1;
      const newTotalVolume =
        currentState.totalVolumeAchieved +
        completedSetData.counts * (completedSetData.weight || currentState.currentSetData.weight);

      // Build performance history for analysis
      const performanceHistory = this.buildPerformanceHistory(currentState, completedSetData);
      const shouldContinue = this.shouldContinueMav(
        currentState,
        completedSetData,
        performanceHistory,
        setsCompleted
      );

      if (!shouldContinue.continue) {
        // Mark as completed
        const completedState: MavExecutionState = {
          ...currentState,
          isCompleted: true,
          nextSetData: undefined,
          restPeriodSeconds: undefined,
          setsCompleted,
          totalVolumeAchieved: newTotalVolume,
          lastSetPerformance: {
            counts: completedSetData.counts,
            rpe: completedSetData.rpe,
          },
          performanceDecline: shouldContinue.reason === 'performance_decline',
        };

        this.logger.info('MAV set completed', {
          setsCompleted,
          totalVolume: newTotalVolume,
          reason: shouldContinue.reason,
          averageReps: performanceHistory.averageReps,
        });

        return Result.success(completedState);
      }

      const nextPhase = currentState.currentPhase + 1;
      const nextSetData = this.calculateNextMavSet(
        currentState.configuration,
        completedSetData.weight || currentState.currentSetData.weight,
        setsCompleted,
        performanceHistory.history
      );

      const nextState: MavExecutionState = {
        ...currentState,
        currentPhase: nextPhase,
        currentSetData: {
          weight: nextSetData.weight,
          counts: nextSetData.expectedCounts,
          rpe: nextSetData.suggestedRpe,
        },
        nextSetData: this.calculateNextMavSet(
          currentState.configuration,
          nextSetData.weight,
          setsCompleted + 1,
          [...performanceHistory.history, completedSetData]
        ),
        restPeriodSeconds: this.calculateMavRest(setsCompleted, completedSetData.rpe),
        setsCompleted,
        totalVolumeAchieved: newTotalVolume,
        performanceDecline: performanceHistory.performanceStability === 'declining',
        lastSetPerformance: {
          counts: completedSetData.counts,
          rpe: completedSetData.rpe,
        },
        isCompleted: false,
      };

      this.logger.info('Progressed to next MAV set', {
        newPhase: nextPhase,
        setsCompleted,
        expectedCounts: nextSetData.expectedCounts,
        restPeriod: nextState.restPeriodSeconds,
        performanceStability: performanceHistory.performanceStability,
      });

      return Result.success(nextState);
    } catch (_error) {
      this.logger.error('Failed to progress MAV to next phase', _error as Error, {
        currentPhase: currentState.currentPhase,
        setsCompleted: currentState.setsCompleted,
      });
      return Result.failure(new ApplicationError('Failed to progress MAV to next phase', _error));
    }
  }

  /**
   * Validates if the current phase can be completed with the given data.
   * @param currentState The current execution state
   * @param proposedSetData The proposed set completion data
   * @returns A Result containing validation success or an error
   */
  async validatePhaseCompletion(
    currentState: MavExecutionState,
    proposedSetData: SetProgressionData
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      if (proposedSetData.counts <= 0) {
        return Result.failure(new ApplicationError('Counts must be greater than 0'));
      }

      if (proposedSetData.weight !== undefined && proposedSetData.weight < 0) {
        return Result.failure(new ApplicationError('Weight cannot be negative'));
      }

      if (
        proposedSetData.rpe !== undefined &&
        (proposedSetData.rpe < 1 || proposedSetData.rpe > 10)
      ) {
        return Result.failure(new ApplicationError('RPE must be between 1 and 10'));
      }

      const expectedCounts = currentState.currentSetData.counts;

      // For MAV, validate performance isn't too far below expectations
      if (proposedSetData.counts < expectedCounts * this.MIN_REPS_THRESHOLD) {
        this.logger.warn('MAV set performance significantly below target', {
          expected: expectedCounts,
          actual: proposedSetData.counts,
          setNumber: currentState.setsCompleted + 1,
        });
      }

      // Warn if RPE is getting very high (may indicate approaching failure)
      if (proposedSetData.rpe !== undefined && proposedSetData.rpe >= 9) {
        this.logger.info('MAV set approaching high RPE - may be nearing completion', {
          rpe: proposedSetData.rpe,
          setNumber: currentState.setsCompleted + 1,
        });
      }

      return Result.success(true);
    } catch (_error) {
      this.logger.error('Failed to validate MAV phase completion', _error as Error);
      return Result.failure(new ApplicationError('Failed to validate MAV phase completion', _error));
    }
  }

  /**
   * Gets the suggested rest period for the current phase.
   * @param currentState The current execution state
   * @returns A Result containing the suggested rest period in seconds or an error
   */
  async getSuggestedRestPeriod(
    currentState: MavExecutionState
  ): Promise<Result<number, ApplicationError>> {
    try {
      if (currentState.setsCompleted === 0) {
        return Result.success(0); // No rest before first set
      }

      if (currentState.isCompleted) {
        return Result.success(0); // No rest needed if completed
      }

      const lastRpe = currentState.lastSetPerformance?.rpe;
      const restPeriod = this.calculateMavRest(currentState.setsCompleted, lastRpe);
      return Result.success(restPeriod);
    } catch (_error) {
      this.logger.error('Failed to get suggested rest period for MAV set', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to get suggested rest period for MAV set', _error)
      );
    }
  }

  /**
   * Determines if the MAV set should continue based on performance criteria.
   * @param currentState The current execution state
   * @param completedSetData The just-completed set data
   * @param performanceMetrics The calculated performance metrics
   * @param setsCompleted Number of sets completed
   * @returns Whether to continue and the reason
   */
  private shouldContinueMav(
    currentState: MavExecutionState,
    completedSetData: SetProgressionData,
    performanceMetrics: MavPerformanceMetrics & { history: SetProgressionData[] },
    setsCompleted: number
  ): { continue: boolean; reason: string } {
    // Stop if reached safety limit
    if (setsCompleted >= this.MAX_SETS_SAFETY_LIMIT) {
      return { continue: false, reason: 'safety_limit_reached' };
    }

    // Stop if reached maximum configured sets
    const maxSets = currentState.configuration.sets.max;
    if (maxSets && maxSets !== Infinity && setsCompleted >= maxSets) {
      return { continue: false, reason: 'max_sets_reached' };
    }

    // Stop for severe performance decline regardless of minimum sets (if we have performance history)
    if (performanceMetrics.performanceStability === 'declining' && setsCompleted >= 2) {
      return { continue: false, reason: 'performance_decline' };
    }

    // Stop if minimum sets requirement met and performance is declining significantly
    const minSets = currentState.configuration.sets.min;
    if (setsCompleted >= minSets && performanceMetrics.performanceStability === 'declining') {
      return { continue: false, reason: 'performance_decline' };
    }

    // Stop if rep count drops below threshold
    const targetCounts = currentState.configuration.counts.min;
    if (completedSetData.counts < targetCounts * this.MIN_REPS_THRESHOLD) {
      return { continue: false, reason: 'rep_threshold_reached' };
    }

    // Stop if RPE is at maximum
    if (completedSetData.rpe !== undefined && completedSetData.rpe >= 10) {
      return { continue: false, reason: 'max_rpe_reached' };
    }

    // Continue if performance is stable or we haven't reached minimum sets
    if (setsCompleted < minSets || performanceMetrics.recommendContinue) {
      return { continue: true, reason: 'performance_stable' };
    }

    return { continue: false, reason: 'natural_completion' };
  }

  /**
   * Builds performance history and calculates metrics.
   * @param currentState The current execution state
   * @param latestSet The latest completed set data
   * @returns Performance metrics and history
   */
  private buildPerformanceHistory(
    currentState: MavExecutionState,
    latestSet: SetProgressionData
  ): MavPerformanceMetrics & { history: SetProgressionData[] } {
    // For now, we'll use simple heuristics based on the current and last performance
    const history: SetProgressionData[] = [];

    if (currentState.lastSetPerformance) {
      history.push({
        counts: currentState.lastSetPerformance.counts,
        rpe: currentState.lastSetPerformance.rpe,
        weight: currentState.currentSetData.weight,
        completed: true,
      });
    }

    history.push(latestSet);

    // Calculate metrics
    const averageReps = history.reduce((sum, set) => sum + set.counts, 0) / history.length;
    const rpeValues = history.filter((set) => set.rpe !== undefined).map((set) => set.rpe!);
    const averageRpe =
      rpeValues.length > 0
        ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
        : undefined;

    const volumePerSet = averageReps * (latestSet.weight || currentState.currentSetData.weight);

    // Determine performance stability
    let performanceStability: 'stable' | 'declining' | 'improving' = 'stable';

    if (history.length >= 2) {
      const recentPerformance = history.slice(-2);
      const performanceChange = recentPerformance[1].counts / recentPerformance[0].counts;

      if (performanceChange < this.PERFORMANCE_DECLINE_THRESHOLD) {
        performanceStability = 'declining';
      } else if (performanceChange > 1.1) {
        performanceStability = 'improving';
      }
    }

    const recommendContinue =
      performanceStability !== 'declining' &&
      latestSet.counts >= currentState.configuration.counts.min * this.MIN_REPS_THRESHOLD;

    return {
      averageReps,
      averageRpe,
      volumePerSet,
      performanceStability,
      recommendContinue,
      history,
    };
  }

  /**
   * Calculates the next MAV set parameters.
   * @param configuration The MAV configuration
   * @param currentWeight The current weight
   * @param setNumber The upcoming set number (1-indexed)
   * @param performanceHistory Historical performance data
   * @returns Next set data
   */
  private calculateNextMavSet(
    configuration: MavSetConfiguration,
    currentWeight: number,
    setNumber: number,
    performanceHistory: SetProgressionData[]
  ): { weight: number; expectedCounts: number; suggestedRpe?: number } {
    // Weight typically stays the same for MAV sets
    const weight = currentWeight;

    // Expected counts based on configuration and performance trends
    let expectedCounts = configuration.counts.min;

    // Adjust expectations based on recent performance
    if (performanceHistory.length > 0) {
      const recentAverage =
        performanceHistory.slice(-2).reduce((sum, set) => sum + set.counts, 0) /
        Math.min(performanceHistory.length, 2);

      // Gradually lower expectations as fatigue accumulates
      expectedCounts = Math.max(
        Math.floor(recentAverage * 0.9), // Expect 10% decline
        Math.floor(configuration.counts.min * this.MIN_REPS_THRESHOLD)
      );
    }

    // RPE typically increases with each set
    const baseRpe = configuration.rpe?.min || 7;
    const suggestedRpe = Math.min(baseRpe + Math.floor(setNumber / 3), 10); // Gradual RPE increase

    return {
      weight: Math.round(weight * 2) / 2, // Round to nearest 0.5
      expectedCounts,
      suggestedRpe: configuration.rpe ? suggestedRpe : undefined,
    };
  }

  /**
   * Calculates rest period based on set number and RPE.
   * @param setsCompleted Number of sets completed
   * @param lastRpe Optional RPE from the last set
   * @returns Rest period in seconds
   */
  private calculateMavRest(setsCompleted: number, lastRpe?: number): number {
    // Base rest period
    let restSeconds = 90; // 1.5 minutes base

    // Increase rest as sets accumulate
    restSeconds += Math.floor(setsCompleted / 3) * 15; // +15s every 3 sets

    // Increase rest based on RPE
    if (lastRpe !== undefined) {
      if (lastRpe >= 9) {
        restSeconds += 30; // Extra rest for very high RPE
      } else if (lastRpe >= 8) {
        restSeconds += 15; // Moderate extra rest for high RPE
      }
    }

    // Cap at maximum rest period
    return Math.min(restSeconds, 180); // Maximum 3 minutes
  }
}
