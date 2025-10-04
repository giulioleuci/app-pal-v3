import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { SetProgressionData } from './types';

/**
 * Interface for myo-reps execution state
 */
export interface MyoRepsExecutionState {
  readonly configuration: MyoRepsSetConfiguration;
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
  readonly isActivationPhase: boolean;
  readonly miniSetsCompleted: number;
  readonly activationReps?: number;
}

/**
 * Application service responsible for managing myo-reps execution during active workouts.
 * Handles the activation set followed by mini-sets with progressively shorter rest periods.
 */
@injectable()
export class MyoRepsExecutionService {
  constructor(@inject('ILogger') private readonly logger: ILogger) {}

  /**
   * Initializes execution state for a myo-reps set.
   * @param configuration The myo-reps set configuration
   * @param lastWeight Optional last weight used for this exercise
   * @returns A Result containing the initial execution state or an error
   */
  async initializeExecution(
    configuration: MyoRepsSetConfiguration,
    lastWeight?: number
  ): Promise<Result<MyoRepsExecutionState, ApplicationError>> {
    try {
      this.logger.info('Initializing myo-reps execution', {
        activationCounts: configuration.activationCounts,
        miniSets: configuration.miniSets,
        miniSetCounts: configuration.miniSetCounts,
        lastWeight,
      });

      const startingWeight = lastWeight || 0;
      const totalPhases = 1 + configuration.miniSets.min; // Activation + mini-sets

      const initialState: MyoRepsExecutionState = {
        configuration,
        currentPhase: 1,
        totalPhases,
        isCompleted: false,
        currentSetData: {
          weight: startingWeight,
          counts: configuration.activationCounts.min,
          rpe: configuration.rpe?.min,
        },
        nextSetData:
          totalPhases > 1 ? this.calculateNextMiniSet(configuration, startingWeight, 0) : undefined,
        restPeriodSeconds: undefined, // No rest before activation set
        isActivationPhase: true,
        miniSetsCompleted: 0,
        activationReps: undefined, // Will be set after activation set is completed
      };

      this.logger.info('Myo-reps execution initialized', {
        totalPhases,
        startingWeight,
        activationCounts: configuration.activationCounts.min,
        plannedMiniSets: configuration.miniSets.min,
      });

      return Result.success(initialState);
    } catch (_error) {
      this.logger.error('Failed to initialize myo-reps execution', _error as Error);
      return Result.failure(new ApplicationError('Failed to initialize myo-reps execution', _error));
    }
  }

  /**
   * Progresses to the next mini-set in the myo-reps sequence.
   * @param currentState The current execution state
   * @param completedSetData Data from the just-completed set
   * @returns A Result containing the updated execution state or an error
   */
  async progressToNextPhase(
    currentState: MyoRepsExecutionState,
    completedSetData: SetProgressionData
  ): Promise<Result<MyoRepsExecutionState, ApplicationError>> {
    try {
      this.logger.info('Progressing myo-reps to next phase', {
        currentPhase: currentState.currentPhase,
        totalPhases: currentState.totalPhases,
        isActivationPhase: currentState.isActivationPhase,
        completedSetData,
      });

      if (currentState.isCompleted) {
        return Result.failure(new ApplicationError('Myo-reps set is already completed'));
      }

      const nextPhase = currentState.currentPhase + 1;

      if (nextPhase > currentState.totalPhases) {
        // Mark as completed - increment miniSetsCompleted for the just-completed set
        const completedState: MyoRepsExecutionState = {
          ...currentState,
          isCompleted: true,
          miniSetsCompleted: currentState.isActivationPhase
            ? currentState.miniSetsCompleted
            : currentState.miniSetsCompleted + 1,
          nextSetData: undefined,
          restPeriodSeconds: undefined,
        };
        return Result.success(completedState);
      }

      // Transition from activation phase to mini-sets
      if (currentState.isActivationPhase) {
        const activationReps = completedSetData.counts;
        const miniSetsCompleted = 0;

        const nextSetData = this.calculateNextMiniSet(
          currentState.configuration,
          completedSetData.weight || currentState.currentSetData.weight,
          miniSetsCompleted,
          activationReps
        );

        const nextState: MyoRepsExecutionState = {
          ...currentState,
          currentPhase: nextPhase,
          currentSetData: {
            weight: nextSetData.weight,
            counts: nextSetData.expectedCounts,
            rpe: nextSetData.suggestedRpe,
          },
          nextSetData:
            nextPhase < currentState.totalPhases
              ? this.calculateNextMiniSet(
                  currentState.configuration,
                  nextSetData.weight,
                  miniSetsCompleted + 1,
                  activationReps
                )
              : undefined,
          restPeriodSeconds: this.calculateMiniSetRest(miniSetsCompleted),
          isActivationPhase: false,
          miniSetsCompleted,
          activationReps,
        };

        this.logger.info('Transitioned from activation to mini-sets', {
          activationReps,
          nextMiniSetCounts: nextSetData.expectedCounts,
          restPeriod: nextState.restPeriodSeconds,
        });

        return Result.success(nextState);
      } else {
        // Continue with mini-sets
        const miniSetsCompleted = currentState.miniSetsCompleted + 1;

        const nextSetData =
          nextPhase <= currentState.totalPhases
            ? this.calculateNextMiniSet(
                currentState.configuration,
                completedSetData.weight || currentState.currentSetData.weight,
                miniSetsCompleted,
                currentState.activationReps
              )
            : undefined;

        const nextState: MyoRepsExecutionState = {
          ...currentState,
          currentPhase: nextPhase,
          currentSetData: nextSetData
            ? {
                weight: nextSetData.weight,
                counts: nextSetData.expectedCounts,
                rpe: nextSetData.suggestedRpe,
              }
            : currentState.currentSetData,
          nextSetData:
            nextPhase < currentState.totalPhases && nextSetData
              ? this.calculateNextMiniSet(
                  currentState.configuration,
                  nextSetData.weight,
                  miniSetsCompleted + 1,
                  currentState.activationReps
                )
              : undefined,
          restPeriodSeconds:
            nextPhase < currentState.totalPhases
              ? this.calculateMiniSetRest(miniSetsCompleted)
              : undefined,
          miniSetsCompleted,
        };

        this.logger.info('Progressed to next mini-set', {
          miniSetsCompleted,
          expectedCounts: nextSetData?.expectedCounts,
          restPeriod: nextState.restPeriodSeconds,
          isCompleted: nextState.isCompleted,
        });

        return Result.success(nextState);
      }
    } catch (_error) {
      this.logger.error('Failed to progress myo-reps to next phase', _error as Error, {
        currentPhase: currentState.currentPhase,
        isActivationPhase: currentState.isActivationPhase,
      });
      return Result.failure(
        new ApplicationError('Failed to progress myo-reps to next phase', _error)
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
    currentState: MyoRepsExecutionState,
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

      if (currentState.isActivationPhase) {
        // Validation for activation set
        const minActivation = currentState.configuration.activationCounts.min;
        const maxActivation = currentState.configuration.activationCounts.max || Infinity;

        if (proposedSetData.counts < minActivation) {
          return Result.failure(
            new ApplicationError(
              `Activation set requires at least ${minActivation} reps, got ${proposedSetData.counts}`
            )
          );
        }

        if (maxActivation !== Infinity && proposedSetData.counts > maxActivation) {
          this.logger.warn('Activation set exceeds maximum expected reps', {
            expected: maxActivation,
            actual: proposedSetData.counts,
          });
        }

        // Check if RPE is high enough for effective activation (typically should be RPE 8-9)
        if (proposedSetData.rpe !== undefined && proposedSetData.rpe < 7) {
          this.logger.warn('Activation set RPE seems low for effective myo-reps', {
            rpe: proposedSetData.rpe,
          });
        }
      } else {
        // Validation for mini-sets
        const expectedCounts = currentState.currentSetData.counts;

        // Mini-sets should typically be 3-5 reps or match a specific target
        if (proposedSetData.counts > expectedCounts * 2) {
          this.logger.warn('Mini-set rep count seems unusually high', {
            expected: expectedCounts,
            actual: proposedSetData.counts,
            miniSetNumber: currentState.miniSetsCompleted + 1,
          });
        }
      }

      return Result.success(true);
    } catch (_error) {
      this.logger.error('Failed to validate myo-reps phase completion', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to validate myo-reps phase completion', _error)
      );
    }
  }

  /**
   * Gets the suggested rest period for the current phase.
   * @param currentState The current execution state
   * @returns A Result containing the suggested rest period in seconds or an error
   */
  async getSuggestedRestPeriod(
    currentState: MyoRepsExecutionState
  ): Promise<Result<number, ApplicationError>> {
    try {
      if (currentState.isActivationPhase) {
        return Result.success(0); // No rest before activation set
      }

      if (currentState.isCompleted) {
        return Result.success(0); // No rest needed if completed
      }

      const restPeriod = this.calculateMiniSetRest(currentState.miniSetsCompleted);
      return Result.success(restPeriod);
    } catch (_error) {
      this.logger.error('Failed to get suggested rest period for myo-reps', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to get suggested rest period for myo-reps', _error)
      );
    }
  }

  /**
   * Calculates the expected counts and parameters for the next mini-set.
   * @param configuration The myo-reps configuration
   * @param currentWeight The current weight being used
   * @param miniSetNumber The number of mini-sets completed (0-indexed)
   * @param activationReps Optional number of reps achieved in activation set
   * @returns The next set data
   */
  private calculateNextMiniSet(
    configuration: MyoRepsSetConfiguration,
    currentWeight: number,
    miniSetNumber: number,
    activationReps?: number
  ): { weight: number; expectedCounts: number; suggestedRpe?: number } {
    // Weight stays the same for all mini-sets
    const weight = currentWeight;

    // Calculate expected counts based on configuration
    let expectedCounts = configuration.miniSetCounts.min;

    // If we have activation reps, we can adjust mini-set targets
    if (activationReps !== undefined) {
      // Typically mini-sets are 3-5 reps or approximately 25% of activation set
      const calculatedCounts = Math.max(Math.ceil(activationReps * 0.25), 3);
      expectedCounts = Math.min(calculatedCounts, configuration.miniSetCounts.max || 5);
    }

    // RPE typically stays high for mini-sets (RPE 8-10)
    const suggestedRpe = configuration.rpe
      ? Math.min(configuration.rpe.min + miniSetNumber, 10)
      : undefined;

    return {
      weight: Math.round(weight * 2) / 2, // Round to nearest 0.5
      expectedCounts,
      suggestedRpe,
    };
  }

  /**
   * Calculates the rest period between mini-sets.
   * Myo-reps use progressively shorter rest periods.
   * @param miniSetNumber The number of mini-sets completed (0-indexed)
   * @returns Rest period in seconds
   */
  private calculateMiniSetRest(miniSetNumber: number): number {
    // Start with 15-20 seconds, reducing slightly with each mini-set
    const baseRest = 20;
    const reduction = Math.min(miniSetNumber * 2, 8); // Max 8 seconds reduction

    return Math.max(baseRest - reduction, 10); // Minimum 10 seconds rest
  }
}
