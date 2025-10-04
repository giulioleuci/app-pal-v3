import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { type AppliedExerciseData, appliedExerciseSchema } from '@/shared/types';

import { hydrateSetConfiguration } from './hydrateSets';
import { type SetConfiguration } from './sets/SetConfiguration';

/**
 * A domain model representing an applied exercise within a training plan.
 * Contains the exercise reference, set configuration, rest time, and execution tracking.
 */
export class AppliedExerciseModel extends BaseModel<AppliedExerciseData> {
  [immerable] = true;
  public readonly profileId: string;
  public readonly exerciseId: string;
  public readonly templateId: string | null;
  public readonly setConfiguration: SetConfiguration;
  public readonly restTimeSeconds?: number;
  public readonly executionCount: number;

  protected constructor(props: AppliedExerciseData) {
    super(props);
    this.profileId = props.profileId;
    this.exerciseId = props.exerciseId;
    this.templateId = props.templateId;
    this.setConfiguration = hydrateSetConfiguration(props.setConfiguration);
    this.restTimeSeconds = props.restTimeSeconds;
    this.executionCount = props.executionCount;
  }

  /**
   * Creates a new AppliedExerciseModel instance from plain data.
   * @param props The applied exercise data to hydrate from
   * @returns A new AppliedExerciseModel instance
   */
  public static hydrate(props: AppliedExerciseData): AppliedExerciseModel {
    return new AppliedExerciseModel(props);
  }

  /**
   * Creates a new applied exercise instance with incremented execution count.
   * @returns A new AppliedExerciseModel instance with execution count incremented by 1
   */
  public cloneWithIncrementedExecutionCount(): AppliedExerciseModel {
    return produce(this, (draft) => {
      draft.executionCount++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new applied exercise instance with updated rest time.
   * @param restTimeSeconds The new rest time in seconds
   * @returns A new AppliedExerciseModel instance with updated rest time
   */
  cloneWithNewRestTime(restTimeSeconds?: number): AppliedExerciseModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).restTimeSeconds = restTimeSeconds;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new applied exercise instance with updated set configuration.
   * @param newSetConfiguration The new set configuration
   * @returns A new AppliedExerciseModel instance with updated configuration
   */
  cloneWithNewSetConfiguration(newSetConfiguration: SetConfiguration): AppliedExerciseModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).setConfiguration = newSetConfiguration;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Gets the total number of sets defined in the set configuration.
   * @returns The total number of sets
   */
  getTotalSets(): number {
    return this.setConfiguration.getTotalSets();
  }

  /**
   * Gets a summary of the set configuration.
   * @returns A string summarizing the set structure
   */
  getSetSummary(): string {
    return this.setConfiguration.getSummary();
  }

  /**
   * Checks if this applied exercise has a template reference.
   * @returns True if templateId is not null
   */
  hasTemplate(): boolean {
    return this.templateId !== null;
  }

  /**
   * Checks if this applied exercise has custom rest time defined.
   * @returns True if restTimeSeconds is defined
   */
  hasCustomRestTime(): boolean {
    return this.restTimeSeconds !== undefined;
  }

  /**
   * Gets the execution count for this applied exercise.
   * @returns The number of times this exercise has been executed
   */
  getExecutionCount(): number {
    return this.executionCount;
  }

  /**
   * Checks if this applied exercise has been executed before.
   * @returns True if execution count is greater than 0
   */
  hasBeenExecuted(): boolean {
    return this.executionCount > 0;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this AppliedExerciseModel
   */
  clone(): this {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).setConfiguration = this.setConfiguration.clone();
    }) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain AppliedExerciseData object
   */
  toPlainObject(): AppliedExerciseData {
    return {
      id: this.id,
      profileId: this.profileId,
      exerciseId: this.exerciseId,
      templateId: this.templateId,
      setConfiguration: this.setConfiguration.toPlainObject(),
      restTimeSeconds: this.restTimeSeconds,
      executionCount: this.executionCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return appliedExerciseSchema.safeParse(this.toPlainObject());
  }
}
