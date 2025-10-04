import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { PyramidalSetConfiguration } from '@/features/training-plan/domain/sets/PyramidalSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { SetProgressionData } from './types';

/**
 * Interface for pyramidal execution state
 */
export interface PyramidalExecutionState {
  readonly configuration: PyramidalSetConfiguration;
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
  readonly pyramidSequence: number[];
  readonly currentDirection: 'ascending' | 'descending';
  readonly directionSwitchPoint?: number;
}

/**
 * Interface for pyramid weight calculation parameters
 */
export interface PyramidWeightParams {
  readonly startingWeight: number;
  readonly weightIncrement: number;
  readonly incrementType: 'percentage' | 'absolute';
  readonly maxWeight?: number;
}

/**
 * Application service responsible for managing pyramidal set execution during active workouts.
 * Handles ascending, descending, and both-direction pyramid progressions with calculated weight and rep changes.
 */
@injectable()
export class PyramidalExecutionService {
  constructor(@inject('ILogger') private readonly logger: ILogger) {}

  /**
   * Initializes execution state for a pyramidal set.
   * @param configuration The pyramidal set configuration
   * @param lastWeight Optional last weight used for this exercise
   * @returns A Result containing the initial execution state or an error
   */
  async initializeExecution(
    configuration: PyramidalSetConfiguration,
    lastWeight?: number
  ): Promise<Result<PyramidalExecutionState, ApplicationError>> {
    try {
      this.logger.info('Initializing pyramidal execution', {
        mode: configuration.mode,
        startCounts: configuration.startCounts,
        endCounts: configuration.endCounts,
        step: configuration.step,
        lastWeight,
      });

      const startingWeight = lastWeight || 0;
      const pyramidSequence = this.calculatePyramidSequence(configuration);
      const totalPhases = pyramidSequence.length;

      if (totalPhases === 0) {
        return Result.failure(
          new ApplicationError('Invalid pyramid configuration - no sets generated')
        );
      }

      // Determine initial direction and switch point
      const { currentDirection, directionSwitchPoint } = this.calculatePyramidDirections(
        configuration,
        pyramidSequence
      );

      const initialWeightData = this.calculateWeightForPhase(
        startingWeight,
        0,
        pyramidSequence,
        currentDirection,
        configuration
      );

      const initialState: PyramidalExecutionState = {
        configuration,
        currentPhase: 1,
        totalPhases,
        isCompleted: false,
        currentSetData: {
          weight: initialWeightData.weight,
          counts: pyramidSequence[0],
          rpe: configuration.rpe?.min,
        },
        nextSetData:
          totalPhases > 1
            ? this.calculateNextPyramidSet(
                startingWeight,
                1,
                pyramidSequence,
                currentDirection,
                directionSwitchPoint,
                configuration
              )
            : undefined,
        restPeriodSeconds:
          totalPhases > 1
            ? this.calculatePyramidRest(pyramidSequence[0], currentDirection)
            : undefined,
        pyramidSequence,
        currentDirection,
        directionSwitchPoint,
      };

      this.logger.info('Pyramidal execution initialized', {
        totalPhases,
        pyramidSequence: pyramidSequence.join(' -> '),
        startingWeight,
        mode: configuration.mode,
        currentDirection,
        directionSwitchPoint,
      });

      return Result.success(initialState);
    } catch (_error) {
      this.logger.error('Failed to initialize pyramidal execution', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to initialize pyramidal execution', _error)
      );
    }
  }

  /**
   * Progresses to the next set in the pyramidal sequence.
   * @param currentState The current execution state
   * @param completedSetData Data from the just-completed set
   * @returns A Result containing the updated execution state or an error
   */
  async progressToNextPhase(
    currentState: PyramidalExecutionState,
    completedSetData: SetProgressionData
  ): Promise<Result<PyramidalExecutionState, ApplicationError>> {
    try {
      this.logger.info('Progressing pyramidal to next phase', {
        currentPhase: currentState.currentPhase,
        totalPhases: currentState.totalPhases,
        currentDirection: currentState.currentDirection,
        completedSetData,
      });

      if (currentState.isCompleted) {
        return Result.failure(new ApplicationError('Pyramidal set is already completed'));
      }

      const nextPhase = currentState.currentPhase + 1;

      if (nextPhase > currentState.totalPhases) {
        // Mark as completed
        const completedState: PyramidalExecutionState = {
          ...currentState,
          isCompleted: true,
          nextSetData: undefined,
          restPeriodSeconds: undefined,
        };

        this.logger.info('Pyramidal set completed', {
          totalPhases: currentState.totalPhases,
          finalCounts: currentState.pyramidSequence[currentState.pyramidSequence.length - 1],
        });

        return Result.success(completedState);
      }

      // Check if we need to switch direction for "bothAscendingDescending" mode
      const newDirection = this.getCurrentDirection(currentState, nextPhase - 1);
      const phaseIndex = nextPhase - 1;

      const nextSetData = this.calculateNextPyramidSet(
        completedSetData.weight || currentState.currentSetData.weight,
        phaseIndex,
        currentState.pyramidSequence,
        newDirection,
        currentState.directionSwitchPoint,
        currentState.configuration
      );

      const nextState: PyramidalExecutionState = {
        ...currentState,
        currentPhase: nextPhase,
        currentSetData: {
          weight: nextSetData.weight,
          counts: nextSetData.expectedCounts,
          rpe: nextSetData.suggestedRpe,
        },
        nextSetData:
          nextPhase < currentState.totalPhases
            ? this.calculateNextPyramidSet(
                nextSetData.weight,
                phaseIndex + 1,
                currentState.pyramidSequence,
                this.getCurrentDirection(currentState, phaseIndex + 1),
                currentState.directionSwitchPoint,
                currentState.configuration
              )
            : undefined,
        restPeriodSeconds:
          nextPhase < currentState.totalPhases
            ? this.calculatePyramidRest(nextSetData.expectedCounts, newDirection)
            : undefined,
        currentDirection: newDirection,
        isCompleted: false,
      };

      this.logger.info('Progressed to next pyramidal set', {
        newPhase: nextPhase,
        newDirection,
        expectedCounts: nextSetData.expectedCounts,
        newWeight: nextSetData.weight,
        restPeriod: nextState.restPeriodSeconds,
      });

      return Result.success(nextState);
    } catch (_error) {
      this.logger.error('Failed to progress pyramidal to next phase', _error as Error, {
        currentPhase: currentState.currentPhase,
        currentDirection: currentState.currentDirection,
      });
      return Result.failure(
        new ApplicationError('Failed to progress pyramidal to next phase', _error)
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
    currentState: PyramidalExecutionState,
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

      // Validate rep count is reasonable for the target
      if (Math.abs(proposedSetData.counts - expectedCounts) > expectedCounts * 0.5) {
        this.logger.warn('Pyramid set rep count deviates significantly from target', {
          expected: expectedCounts,
          actual: proposedSetData.counts,
          phase: currentState.currentPhase,
          direction: currentState.currentDirection,
        });
      }

      // Check if weight progression makes sense
      if (proposedSetData.weight !== undefined) {
        const expectedWeight = currentState.currentSetData.weight;
        const weightDeviation = Math.abs(proposedSetData.weight - expectedWeight) / expectedWeight;

        if (weightDeviation > 0.2) {
          // More than 20% deviation
          this.logger.warn('Pyramid set weight deviates significantly from expected', {
            expected: expectedWeight,
            actual: proposedSetData.weight,
            phase: currentState.currentPhase,
          });
        }
      }

      return Result.success(true);
    } catch (_error) {
      this.logger.error('Failed to validate pyramidal phase completion', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to validate pyramidal phase completion', _error)
      );
    }
  }

  /**
   * Gets the suggested rest period for the current phase.
   * @param currentState The current execution state
   * @returns A Result containing the suggested rest period in seconds or an error
   */
  async getSuggestedRestPeriod(
    currentState: PyramidalExecutionState
  ): Promise<Result<number, ApplicationError>> {
    try {
      if (currentState.isCompleted || currentState.currentPhase >= currentState.totalPhases) {
        return Result.success(0); // No rest needed if completed
      }

      const currentCounts = currentState.pyramidSequence[currentState.currentPhase - 1];
      const restPeriod = this.calculatePyramidRest(currentCounts, currentState.currentDirection);
      return Result.success(restPeriod);
    } catch (_error) {
      this.logger.error('Failed to get suggested rest period for pyramidal set', _error as Error);
      return Result.failure(
        new ApplicationError('Failed to get suggested rest period for pyramidal set', _error)
      );
    }
  }

  /**
   * Calculates the rep sequence for the entire pyramid.
   * @param configuration The pyramidal configuration
   * @returns Array of rep counts for each set
   */
  private calculatePyramidSequence(configuration: PyramidalSetConfiguration): number[] {
    const sequence: number[] = [];
    const step = configuration.step.min;
    const startCounts = configuration.startCounts.min;
    const endCounts = configuration.endCounts.min;

    if (configuration.mode === 'ascending') {
      // Ascending pyramid: start high, go low (e.g., 12 -> 10 -> 8 -> 6)
      // If startCounts < endCounts, we need to swap them for ascending mode
      const highReps = Math.max(startCounts, endCounts);
      const lowReps = Math.min(startCounts, endCounts);

      for (let reps = highReps; reps >= lowReps; reps -= step) {
        sequence.push(reps);
      }
    } else if (configuration.mode === 'descending') {
      // Descending pyramid: start low, go high (e.g., 8 -> 10 -> 12)
      // If startCounts > endCounts, we need to swap them for descending mode
      const lowReps = Math.min(startCounts, endCounts);
      const highReps = Math.max(startCounts, endCounts);

      for (let reps = lowReps; reps <= highReps; reps += step) {
        sequence.push(reps);
      }
    } else if (configuration.mode === 'bothAscendingDescending') {
      // Both direction pyramid: start high, go low, then back high
      // e.g., 10 -> 8 -> 6 -> 8 -> 10
      const highReps = Math.max(startCounts, endCounts);
      const lowReps = Math.min(startCounts, endCounts);

      // Ascending portion (high to low)
      const ascendingSequence: number[] = [];
      for (let reps = highReps; reps >= lowReps; reps -= step) {
        ascendingSequence.push(reps);
      }

      // Add ascending portion
      sequence.push(...ascendingSequence);

      // Add descending portion (excluding the lowest point to avoid duplication)
      for (let i = ascendingSequence.length - 2; i >= 0; i--) {
        sequence.push(ascendingSequence[i]);
      }
    }

    return sequence;
  }

  /**
   * Calculates pyramid directions and switch points.
   * @param configuration The pyramidal configuration
   * @param sequence The calculated rep sequence
   * @returns Direction information
   */
  private calculatePyramidDirections(
    configuration: PyramidalSetConfiguration,
    sequence: number[]
  ): { currentDirection: 'ascending' | 'descending'; directionSwitchPoint?: number } {
    if (configuration.mode === 'ascending') {
      return { currentDirection: 'ascending' };
    }

    if (configuration.mode === 'descending') {
      return { currentDirection: 'descending' };
    }

    if (configuration.mode === 'bothAscendingDescending') {
      // For both-direction pyramid, the switch point is where we hit the lowest rep count
      // e.g., in sequence [10, 8, 6, 8, 10], the switch point is index 2 (the 6-rep set)
      const minReps = Math.min(...sequence);
      const switchPoint = sequence.findIndex((reps) => reps === minReps);

      return {
        currentDirection: 'ascending',
        directionSwitchPoint: switchPoint,
      };
    }

    return { currentDirection: 'ascending' };
  }

  /**
   * Gets the current direction for a specific phase.
   * @param currentState The current execution state
   * @param phaseIndex The phase index (0-based)
   * @returns The direction for that phase
   */
  private getCurrentDirection(
    currentState: PyramidalExecutionState,
    phaseIndex: number
  ): 'ascending' | 'descending' {
    if (
      currentState.configuration.mode !== 'bothAscendingDescending' ||
      currentState.directionSwitchPoint === undefined
    ) {
      return currentState.currentDirection;
    }

    // In both-direction pyramid, we're "ascending" (going down in reps) until we hit the switch point,
    // then we're "descending" (going back up in reps)
    return phaseIndex > currentState.directionSwitchPoint ? 'descending' : 'ascending';
  }

  /**
   * Calculates the weight for a specific pyramid phase.
   * @param baseWeight The base weight to calculate from
   * @param phaseIndex The phase index (0-based)
   * @param sequence The rep sequence
   * @param direction The current direction
   * @param configuration The pyramid configuration
   * @returns Weight data for the phase
   */
  private calculateWeightForPhase(
    baseWeight: number,
    phaseIndex: number,
    sequence: number[],
    direction: 'ascending' | 'descending',
    configuration: PyramidalSetConfiguration
  ): { weight: number } {
    // For pyramids, weight typically increases as reps decrease
    const currentReps = sequence[phaseIndex];
    const maxReps = Math.max(...sequence);
    const minReps = Math.min(...sequence);

    // Calculate weight progression based on rep range
    // Higher reps = lighter weight, lower reps = heavier weight
    const repRatio = (maxReps - currentReps) / (maxReps - minReps);

    // Apply weight increment (default 10% increase from lightest to heaviest)
    const weightIncrement = baseWeight * 0.1 * repRatio;
    const calculatedWeight = baseWeight + weightIncrement;

    return {
      weight: Math.round(calculatedWeight * 2) / 2, // Round to nearest 0.5
    };
  }

  /**
   * Calculates the next pyramid set parameters.
   * @param currentWeight The current weight
   * @param phaseIndex The next phase index (0-based)
   * @param sequence The rep sequence
   * @param direction The direction for the next phase
   * @param switchPoint The direction switch point
   * @param configuration The pyramid configuration
   * @returns Next set data
   */
  private calculateNextPyramidSet(
    currentWeight: number,
    phaseIndex: number,
    sequence: number[],
    direction: 'ascending' | 'descending',
    switchPoint: number | undefined,
    configuration: PyramidalSetConfiguration
  ): { weight: number; expectedCounts: number; suggestedRpe?: number } {
    const expectedCounts = sequence[phaseIndex];
    const weightData = this.calculateWeightForPhase(
      currentWeight,
      phaseIndex,
      sequence,
      direction,
      configuration
    );

    // RPE typically increases as the pyramid progresses
    const progressRatio = phaseIndex / (sequence.length - 1);
    const suggestedRpe = configuration.rpe
      ? Math.min(configuration.rpe.min + Math.floor(progressRatio * 2), 10)
      : undefined;

    return {
      weight: weightData.weight,
      expectedCounts,
      suggestedRpe,
    };
  }

  /**
   * Calculates rest period based on rep count and direction.
   * @param repCount The rep count for the current/upcoming set
   * @param direction The current pyramid direction
   * @returns Rest period in seconds
   */
  private calculatePyramidRest(repCount: number, direction: 'ascending' | 'descending'): number {
    // Base rest periods: higher reps = shorter rest, lower reps = longer rest
    const baseRest = 60; // Base 1 minute

    // Adjust based on rep count
    let restSeconds = baseRest;

    if (repCount <= 5) {
      restSeconds = 120; // 2 minutes for heavy, low-rep sets
    } else if (repCount <= 8) {
      restSeconds = 90; // 1.5 minutes for moderate sets
    } else {
      restSeconds = 60; // 1 minute for higher-rep sets
    }

    // Slightly longer rest when descending (heavier weights)
    if (direction === 'descending') {
      restSeconds += 15;
    }

    return restSeconds;
  }
}
