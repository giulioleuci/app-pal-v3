import { immerable } from 'immer';

import { AnySetConfigurationData, ExerciseCounter, PerformedSetData } from '@/shared/types';

/**
 * Parameters for calculating duration estimates.
 */
export interface DurationParams {
  timePerRep?: number;
  baseTimePerSet?: number;
}

/**
 * Abstract base class for all set configurations in the training plan domain.
 *
 * This class uses the Template Method pattern to define a common interface for all
 * set configuration types while allowing each concrete implementation to provide
 * specific behavior. The static hydrate method acts as a polymorphic factory,
 * eliminating the need for a separate factory class.
 *
 * All set configurations are immutable - methods that modify state return new instances.
 */
export abstract class SetConfiguration {
  [immerable] = true;
  public readonly type: AnySetConfigurationData['type'];

  /**
   * Protected constructor to enforce the use of the hydrate factory method.
   * @param data The configuration data for this set type.
   */
  protected constructor(data: AnySetConfigurationData) {
    this.type = data.type;
  }

  /**
   * Acts as a polymorphic factory to create the correct SetConfiguration subclass.
   * This is the only public entry point for creating SetConfiguration instances.
   *
   * @param data The plain data object for the set configuration.
   * @returns An instance of a concrete SetConfiguration subclass.
   * @throws Error if the set configuration type is unknown.
   */
  public static hydrate(data: AnySetConfigurationData): SetConfiguration {
    throw new Error(
      'SetConfiguration.hydrate must be implemented. This method should be overridden by the factory initialization.'
    );
  }

  /**
   * Calculates the total number of sets this configuration will generate.
   * @returns The total number of sets.
   */
  abstract getTotalSets(): number;

  /**
   * Generates a human-readable summary of this set configuration.
   * @returns A string summarizing the set structure (e.g., "3x8-12").
   */
  abstract getSummary(): string;

  /**
   * Generates empty performed set data templates for workout execution.
   * These serve as placeholders that will be filled during workout performance.
   *
   * @param profileId The profile ID to assign to the generated sets.
   * @param counterType The type of counter (reps, mins, secs) for the exercise.
   * @returns Array of partial PerformedSetData objects ready for completion.
   */
  abstract generateEmptySets(
    profileId: string,
    counterType: ExerciseCounter
  ): Partial<PerformedSetData>[];

  /**
   * Estimates the total duration this set configuration will take to complete.
   *
   * @param params Optional parameters for time calculations.
   * @returns Estimated duration in seconds.
   */
  abstract getEstimatedDurationSeconds(params?: DurationParams): number;

  /**
   * Generates an estimated RPE (Rate of Perceived Exertion) curve for this set configuration.
   * The curve represents how RPE is expected to change across sets.
   *
   * @returns Array of RPE values, one for each set in the configuration.
   */
  abstract getEstimatedRPECurve(): number[];

  /**
   * Converts this domain model back to a plain data object.
   * Used for serialization and persistence.
   *
   * @returns Plain object representation of this set configuration.
   */
  abstract toPlainObject(): AnySetConfigurationData;

  /**
   * Creates a deep copy of this set configuration.
   * Maintains immutability by returning a new instance.
   *
   * @returns A new SetConfiguration instance with identical data.
   */
  abstract clone(): SetConfiguration;
}
