import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { RestPauseSetConfiguration } from '@/features/training-plan/domain/sets/RestPauseSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { SetProgressionData } from './types';

/**
 * Interface for rest-pause execution state
 */
export interface RestPauseExecutionState {
  readonly configuration: RestPauseSetConfiguration;
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
  readonly pausesCompleted: number;
  readonly totalRepsAchieved: number;
  readonly targetTotalReps: number;
}

/**
 * Application service responsible for managing rest-pause execution during active workouts.
 * Handles the main set followed by pause segments with very short rest periods.
 */
@injectable()
export class RestPauseExecutionService {
  constructor(@inject('ILogger') private readonly logger: ILogger) {}

  /**
   * Initializes execution state for a rest-pause set.
   * @param configuration The rest-pause set configuration
   * @param lastWeight Optional last weight used for this exercise
   * @returns A Result containing the initial execution state or an error
   */
  async initializeExecution(
    configuration: RestPauseSetConfiguration,
    lastWeight?: number
  ): Promise<Result<RestPauseExecutionState, ApplicationError>> {
    try {
      this.logger.info('Initializing rest-pause execution', {
        counts: configuration.counts,
        pauses: configuration.pauses,
        lastWeight,
      });

      const startingWeight = lastWeight || 0;
      const totalPhases = 1 + configuration.pauses.min; // Main set + pause segments
      const targetTotalReps = configuration.counts.min * totalPhases; // Rough estimate

      const initialState: RestPauseExecutionState = {
        configuration,
        currentPhase: 1,
        totalPhases,
        isCompleted: false,
        currentSetData: {
          weight: startingWeight,
          counts: configuration.counts.min,
          rpe: configuration.rpe?.min,
        },
        nextSetData:
          totalPhases > 1
            ? this.calculateNextPauseSegment(configuration, startingWeight, 0, 0)
            : undefined,
        restPeriodSeconds: undefined, // No rest before main set
        pausesCompleted: 0,
        totalRepsAchieved: 0,
        targetTotalReps,
      };

      this.logger.info('Rest-pause execution initialized', {
        totalPhases,
        startingWeight,
        targetCounts: configuration.counts.min,
        plannedPauses: configuration.pauses.min,
        targetTotalReps,
      });

      return Result.success(initialState);
    } catch (_error) {
      this.logger.error('Failed to initialize rest-pause execution', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to initialize rest-pause execution', _error)
      );
    }
  }

  /**
   * Progresses to the next pause segment in the rest-pause sequence.
   * @param currentState The current execution state
   * @param completedSetData Data from the just-completed set
   * @returns A Result containing the updated execution state or an error
   */
  async progressToNextPhase(
    currentState: RestPauseExecutionState,
    completedSetData: SetProgressionData
  ): Promise<Result<RestPauseExecutionState, ApplicationError>> {
    try {
      this.logger.info('Progressing rest-pause to next phase', {
        currentPhase: currentState.currentPhase,
        totalPhases: currentState.totalPhases,
        pausesCompleted: currentState.pausesCompleted,
        completedSetData,
      });

      if (currentState.isCompleted) {
        return Result.failure(new ApplicationError('Rest-pause set is already completed'));
      }

      const nextPhase = currentState.currentPhase + 1;
      const newTotalRepsAchieved = currentState.totalRepsAchieved + completedSetData.counts;

      // Check if we should continue or stop based on performance
      const shouldContinue = this.shouldContinueRestPause(
        currentState,
        completedSetData,
        newTotalRepsAchieved
      );

      if (!shouldContinue || nextPhase > currentState.totalPhases) {
        // Mark as completed
        const completedState: RestPauseExecutionState = {
          ...currentState,
          isCompleted: true,
          nextSetData: undefined,
          restPeriodSeconds: undefined,
          totalRepsAchieved: newTotalRepsAchieved,
        };

        this.logger.info('Rest-pause set completed', {
          totalRepsAchieved: newTotalRepsAchieved,
          targetReps: currentState.targetTotalReps,
          pausesCompleted: currentState.pausesCompleted,
          reason: !shouldContinue ? 'performance_criteria' : 'max_phases_reached',
        });

        return Result.success(completedState);
      }

      const pausesCompleted = currentState.pausesCompleted + 1;

      const nextSetData = this.calculateNextPauseSegment(
        currentState.configuration,
        completedSetData.weight || currentState.currentSetData.weight,
        pausesCompleted,
        newTotalRepsAchieved
      );

      const nextState: RestPauseExecutionState = {
        ...currentState,
        currentPhase: nextPhase,
        currentSetData: {
          weight: nextSetData.weight,
          counts: nextSetData.expectedCounts,
          rpe: nextSetData.suggestedRpe,
        },
        nextSetData:
          nextPhase < currentState.totalPhases
            ? this.calculateNextPauseSegment(
                currentState.configuration,
                nextSetData.weight,
                pausesCompleted + 1,
                newTotalRepsAchieved
              )
            : undefined,
        restPeriodSeconds: this.calculatePauseRestPeriod(pausesCompleted),
        pausesCompleted,
        totalRepsAchieved: newTotalRepsAchieved,
        isCompleted: false,
      };

      this.logger.info('Progressed to next rest-pause segment', {
        newPhase: nextPhase,
        pausesCompleted,
        expectedCounts: nextSetData.expectedCounts,
        totalRepsAchieved: newTotalRepsAchieved,
        restPeriod: nextState.restPeriodSeconds,
      });

      return Result.success(nextState);
    } catch (_error) {
      this.logger.error('Failed to progress rest-pause to next phase', _error as Error, {
        currentPhase: currentState.currentPhase,
        pausesCompleted: currentState.pausesCompleted,
      });
      return Result.failure(
        new ApplicationError('Failed to progress rest-pause to next phase', _error)
      );
    }
  }

  /**
   * Validates if the current phase can be completed with the given data.
   * @param currentState The current execution state
   * @param proposedSetData The proposed set completion data
   * @returns A Result containing validation success or an error
   */
  async validatePhaseCompletion(
    currentState: RestPauseExecutionState,
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

      // For rest-pause, we expect diminishing returns in each segment
      if (currentState.pausesCompleted > 0 && proposedSetData.counts > expectedCounts * 1.5) {
        this.logger.warn('Pause segment rep count seems unusually high', {
          expected: expectedCounts,
          actual: proposedSetData.counts,
          pauseSegment: currentState.pausesCompleted + 1,
        });
      }

      // Check if the rep count is too low for effective training
      if (currentState.pausesCompleted === 0 && proposedSetData.counts < expectedCounts * 0.7) {
        this.logger.warn('Main set rep count seems low for rest-pause training', {
          expected: expectedCounts,
          actual: proposedSetData.counts,
        });
      }

      return Result.success(true);
    } catch (_error) {
      this.logger.error('Failed to validate rest-pause phase completion', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to validate rest-pause phase completion', _error)
      );
    }
  }

  /**
   * Gets the suggested rest period for the current phase.
   * @param currentState The current execution state
   * @returns Suggested rest period in seconds
   */
  async getSuggestedRestPeriod(
    currentState: RestPauseExecutionState
  ): Promise<Result<number, ApplicationError>> {
    try {
      if (currentState.pausesCompleted === 0) {
        return Result.success(0); // No rest before main set
      }

      if (currentState.currentPhase < currentState.totalPhases) {
        const restPeriod = this.calculatePauseRestPeriod(currentState.pausesCompleted);
        return Result.success(restPeriod);
      }

      return Result.success(0); // No rest needed if completed
    } catch (_error) {
      const appError = ApplicationError.fromError(
        error,
        'Failed to calculate suggested rest period for rest-pause set'
      );
      this.logger.error('Error calculating rest-pause rest period', {
        error: appError,
        currentState,
      });
      return Result.failure(appError);
    }
  }

  /**
   * Determines if the rest-pause set should continue based on performance criteria.
   * @param currentState The current execution state
   * @param completedSetData The just-completed set data
   * @param newTotalReps The new total reps achieved
   * @returns Whether to continue with more pause segments
   */
  private shouldContinueRestPause(
    currentState: RestPauseExecutionState,
    completedSetData: SetProgressionData,
    newTotalReps: number
  ): boolean {
    // Stop if we've reached the maximum number of pause segments
    if (currentState.pausesCompleted >= currentState.configuration.pauses.min) {
      return false;
    }

    // Stop if the rep count in this segment was too low (indicating excessive fatigue)
    const minViableReps = currentState.pausesCompleted === 0 ? 3 : 1; // Main set needs at least 3, pauses need at least 1
    if (completedSetData.counts < minViableReps) {
      return false;
    }

    // Stop if RPE is too high (indicating inability to continue effectively)
    if (completedSetData.rpe !== undefined && completedSetData.rpe >= 10) {
      return false;
    }

    // Continue if we haven't reached our target total reps
    if (newTotalReps < currentState.targetTotalReps) {
      return true;
    }

    // Continue if performance is still reasonable
    const expectedCountsForSegment = this.calculateExpectedCountsForSegment(
      currentState.configuration,
      currentState.pausesCompleted
    );

    return completedSetData.counts >= expectedCountsForSegment * 0.5; // Continue if at least 50% of expected
  }

  /**
   * Calculates the expected counts and parameters for the next pause segment.
   * @param configuration The rest-pause configuration
   * @param currentWeight The current weight being used
   * @param pauseNumber The number of pause segments completed (0-indexed)
   * @param totalRepsAchieved Total reps achieved so far
   * @returns The next set data
   */
  private calculateNextPauseSegment(
    configuration: RestPauseSetConfiguration,
    currentWeight: number,
    pauseNumber: number,
    totalRepsAchieved: number
  ): { weight: number; expectedCounts: number; suggestedRpe?: number } {
    // Weight stays the same for all segments
    const weight = currentWeight;

    // Calculate expected counts based on fatigue progression
    const expectedCounts = this.calculateExpectedCountsForSegment(configuration, pauseNumber);

    // RPE typically increases with each pause segment
    const suggestedRpe = configuration.rpe
      ? Math.min(configuration.rpe.min + pauseNumber, 10)
      : undefined;

    return {
      weight: Math.round(weight * 2) / 2, // Round to nearest 0.5
      expectedCounts,
      suggestedRpe,
    };
  }

  /**
   * Calculates expected rep counts for a specific segment based on fatigue.
   * @param configuration The rest-pause configuration
   * @param pauseNumber The pause segment number (0 = main set, 1+ = pause segments)
   * @returns Expected rep count
   */
  private calculateExpectedCountsForSegment(
    configuration: RestPauseSetConfiguration,
    pauseNumber: number
  ): number {
    const baseCounts = configuration.counts.min;

    if (pauseNumber === 0) {
      // Main set - target the full count
      return baseCounts;
    } else {
      // Pause segments - expect decreasing performance
      // Typical progression: 100% -> 50% -> 30% -> 20%
      const fatigueMultipliers = [1.0, 0.5, 0.3, 0.2, 0.15];
      const multiplier = fatigueMultipliers[pauseNumber] || 0.1;

      return Math.max(Math.ceil(baseCounts * multiplier), 1); // Minimum 1 rep
    }
  }

  /**
   * Calculates the rest period for pause segments.
   * Rest-pause uses very short, consistent rest periods.
   * @param pauseNumber The number of pause segments completed (0-indexed)
   * @returns Rest period in seconds
   */
  private calculatePauseRestPeriod(pauseNumber: number): number {
    // Rest-pause typically uses 10-15 second pauses
    return 12; // Consistent 12 seconds for all pauses
  }
}
