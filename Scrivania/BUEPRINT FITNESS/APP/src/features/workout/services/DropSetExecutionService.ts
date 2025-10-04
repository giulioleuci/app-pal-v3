import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { SetProgressionData } from './types';

/**
 * Interface for drop set execution state
 */
export interface DropSetExecutionState {
  readonly configuration: DropSetConfiguration;
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
  readonly dropsCompleted: number;
}

/**
 * Interface for drop set configuration
 */
export interface DropSetParams {
  readonly startingWeight: number;
  readonly dropType: 'percentage' | 'absolute';
  readonly dropAmount: number;
  readonly minimumWeight?: number;
}

/**
 * Application service responsible for managing drop set execution during active workouts.
 * Handles the progressive weight reduction and phase transitions for drop sets.
 */
@injectable()
export class DropSetExecutionService {
  constructor(@inject('ILogger') private readonly logger: ILogger) {}

  /**
   * Initializes execution state for a drop set.
   * @param configuration The drop set configuration
   * @param lastWeight Optional last weight used for this exercise
   * @returns A Result containing the initial execution state or an error
   */
  async initializeExecution(
    configuration: DropSetConfiguration,
    lastWeight?: number
  ): Promise<Result<DropSetExecutionState, ApplicationError>> {
    try {
      this.logger.info('Initializing drop set execution', {
        startCounts: configuration.startCounts,
        drops: configuration.drops,
        lastWeight,
      });

      const startingWeight = lastWeight || 0;
      const totalPhases = 1 + configuration.drops.min;

      const initialState: DropSetExecutionState = {
        configuration,
        currentPhase: 1,
        totalPhases,
        isCompleted: false,
        currentSetData: {
          weight: startingWeight,
          counts: configuration.startCounts.min,
          rpe: configuration.rpe?.min,
        },
        nextSetData:
          totalPhases > 1 ? this.calculateNextDropSet(configuration, startingWeight, 1) : undefined,
        restPeriodSeconds: totalPhases > 1 ? 15 : undefined, // Short rest between drops
        dropsCompleted: 0,
      };

      this.logger.info('Drop set execution initialized', {
        totalPhases,
        startingWeight,
        startingCounts: configuration.startCounts.min,
      });

      return Result.success(initialState);
    } catch (_error) {
      this.logger.error('Failed to initialize drop set execution', _error as Error);
      return Result.failure(new ApplicationError('Failed to initialize drop set execution', _error));
    }
  }

  /**
   * Progresses to the next drop in the drop set sequence.
   * @param currentState The current execution state
   * @param completedSetData Data from the just-completed set
   * @returns A Result containing the updated execution state or an error
   */
  async progressToNextPhase(
    currentState: DropSetExecutionState,
    completedSetData: SetProgressionData
  ): Promise<Result<DropSetExecutionState, ApplicationError>> {
    try {
      this.logger.info('Progressing drop set to next phase', {
        currentPhase: currentState.currentPhase,
        totalPhases: currentState.totalPhases,
        completedSetData,
      });

      if (currentState.isCompleted) {
        return Result.failure(new ApplicationError('Drop set is already completed'));
      }

      if (currentState.currentPhase >= currentState.totalPhases) {
        // Mark as completed
        const completedState: DropSetExecutionState = {
          ...currentState,
          isCompleted: true,
          nextSetData: undefined,
          restPeriodSeconds: undefined,
        };
        return Result.success(completedState);
      }

      const nextPhase = currentState.currentPhase + 1;
      const dropsCompleted = currentState.dropsCompleted + 1;

      const nextSetData = this.calculateNextDropSet(
        currentState.configuration,
        completedSetData.weight || currentState.currentSetData.weight,
        dropsCompleted
      );

      const nextState: DropSetExecutionState = {
        ...currentState,
        currentPhase: nextPhase,
        currentSetData: {
          weight: nextSetData.weight,
          counts: nextSetData.expectedCounts,
          rpe: nextSetData.suggestedRpe,
        },
        nextSetData:
          nextPhase < currentState.totalPhases
            ? this.calculateNextDropSet(
                currentState.configuration,
                nextSetData.weight,
                dropsCompleted + 1
              )
            : undefined,
        restPeriodSeconds: nextPhase < currentState.totalPhases ? 15 : undefined,
        dropsCompleted,
        isCompleted: nextPhase >= currentState.totalPhases,
      };

      this.logger.info('Drop set progressed to next phase', {
        newPhase: nextPhase,
        newWeight: nextSetData.weight,
        expectedCounts: nextSetData.expectedCounts,
        isCompleted: nextState.isCompleted,
      });

      return Result.success(nextState);
    } catch (_error) {
      this.logger.error('Failed to progress drop set to next phase', _error as Error, {
        currentPhase: currentState.currentPhase,
      });
      return Result.failure(
        new ApplicationError('Failed to progress drop set to next phase', _error)
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
    currentState: DropSetExecutionState,
    proposedSetData: SetProgressionData
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      // For drop sets, we're more lenient since fatigue is expected
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

      // Warn if the counts are significantly higher than expected (might indicate error)
      const expectedCounts = currentState.currentSetData.counts;
      if (proposedSetData.counts > expectedCounts * 2) {
        this.logger.warn('Unusually high rep count for drop set phase', {
          expected: expectedCounts,
          actual: proposedSetData.counts,
          phase: currentState.currentPhase,
        });
      }

      return Result.success(true);
    } catch (_error) {
      this.logger.error('Failed to validate drop set phase completion', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to validate drop set phase completion', _error)
      );
    }
  }

  /**
   * Gets the suggested rest period for the current phase.
   * @param currentState The current execution state
   * @returns A Result containing the suggested rest period in seconds or an error
   */
  async getSuggestedRestPeriod(
    currentState: DropSetExecutionState
  ): Promise<Result<number, ApplicationError>> {
    try {
      // Drop sets typically use very short rest periods between drops
      if (currentState.currentPhase < currentState.totalPhases) {
        return Result.success(15); // 15 seconds between drops
      } else {
        return Result.success(0); // No rest needed if completed
      }
    } catch (_error) {
      this.logger.error('Failed to get suggested rest period for drop set', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to get suggested rest period for drop set', _error)
      );
    }
  }

  /**
   * Calculates the weight and expected counts for the next drop set.
   * @param configuration The drop set configuration
   * @param currentWeight The current weight being used
   * @param dropNumber The number of drops already completed (0-indexed)
   * @returns The next set data
   */
  private calculateNextDropSet(
    configuration: DropSetConfiguration,
    currentWeight: number,
    dropNumber: number
  ): { weight: number; expectedCounts: number; suggestedRpe?: number } {
    // Calculate the weight drop
    // For simplicity, we'll use a 20% drop as default
    const dropPercentage = 0.2;
    const newWeight = Math.max(currentWeight * (1 - dropPercentage), 5); // Minimum 5kg/lbs

    // Calculate expected counts (typically maintain same reps or slightly reduce)
    const baseCountsReduction = Math.floor(dropNumber * 0.5); // Slight reduction with each drop
    const expectedCounts = Math.max(configuration.startCounts.min - baseCountsReduction, 1);

    // Suggest maintaining or slightly increasing RPE due to fatigue
    const suggestedRpe = configuration.rpe
      ? Math.min(configuration.rpe.min + dropNumber, 10)
      : undefined;

    return {
      weight: Math.round(newWeight * 2) / 2, // Round to nearest 0.5
      expectedCounts,
      suggestedRpe,
    };
  }

  /**
   * Calculates the optimal drop weight based on the drop type and amount.
   * @param params The drop set parameters
   * @param currentWeight The current weight
   * @returns The calculated drop weight
   */
  private calculateDropWeight(params: DropSetParams, currentWeight: number): number {
    let newWeight: number;

    if (params.dropType === 'percentage') {
      newWeight = currentWeight * (1 - params.dropAmount / 100);
    } else {
      newWeight = currentWeight - params.dropAmount;
    }

    // Apply minimum weight constraint
    if (params.minimumWeight && newWeight < params.minimumWeight) {
      newWeight = params.minimumWeight;
    }

    // Round to nearest 0.5 for practical weight selection
    return Math.round(newWeight * 2) / 2;
  }
}
