import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { PerformedGroupData, performedGroupSchema } from '@/shared/types';

import { PerformedExerciseLogModel } from './PerformedExerciseLogModel';

/**
 * A domain model representing a performed group of exercises in a workout log.
 * Groups exercises that were executed together (e.g., supersets, circuits).
 */
export class PerformedGroupLogModel extends BaseModel<PerformedGroupData> {
  [immerable] = true;

  public readonly profileId: string;
  public readonly plannedGroupId?: string;
  public readonly type: PerformedGroupData['type'];
  public readonly performedExercises: PerformedExerciseLogModel[];
  public readonly actualRestSeconds?: number;

  protected constructor(props: PerformedGroupData, exercises: PerformedExerciseLogModel[]) {
    super(props);
    this.profileId = props.profileId;
    this.plannedGroupId = props.plannedGroupId;
    this.type = props.type;
    this.performedExercises = exercises;
    this.actualRestSeconds = props.actualRestSeconds;
  }

  /**
   * Creates a new PerformedGroupLogModel instance from plain data.
   * @param props The performed group data to hydrate from
   * @param exercises The performed exercise log models that belong to this group
   * @returns A new PerformedGroupLogModel instance
   */
  public static hydrate(
    props: PerformedGroupData,
    exercises: PerformedExerciseLogModel[]
  ): PerformedGroupLogModel {
    return new PerformedGroupLogModel(props, exercises);
  }

  private createUpdatedInstance(
    updates: Partial<PerformedGroupData>,
    newExercises?: PerformedExerciseLogModel[]
  ): PerformedGroupLogModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return new PerformedGroupLogModel(newData, newExercises || this.performedExercises);
  }

  /**
   * Calculates the total volume for all exercises in this group.
   * @returns The combined volume of all exercises in the group
   */
  getTotalVolume(): number {
    return this.performedExercises.reduce((acc, exercise) => acc + exercise.getTotalVolume(), 0);
  }

  /**
   * Calculates the total number of sets across all exercises in this group.
   * @returns The total set count for the group
   */
  getTotalSets(): number {
    return this.performedExercises.reduce((acc, exercise) => acc + exercise.getTotalSets(), 0);
  }

  /**
   * Calculates the total repetition count across all exercises in this group.
   * @returns The total rep count for the group
   */
  getTotalCounts(): number {
    return this.performedExercises.reduce((acc, exercise) => acc + exercise.getTotalCounts(), 0);
  }

  /**
   * Calculates the total number of planned sets across all exercises in this group.
   * @returns The total planned set count for the group
   */
  getPlannedSetsCount(): number {
    return this.performedExercises.reduce(
      (acc, exercise) => acc + exercise.getPlannedSetsCount(),
      0
    );
  }

  /**
   * Calculates the total planned repetition count across all exercises in this group.
   * @returns The total planned rep count for the group
   */
  getPlannedCountsTotal(): number {
    return this.performedExercises.reduce(
      (acc, exercise) => acc + exercise.getPlannedCountsTotal(),
      0
    );
  }

  /**
   * Gets the average RPE across all exercises in this group.
   * @returns The average RPE for the group, or 0 if no RPE data exists
   */
  getAverageRPE(): number {
    const rpes = this.performedExercises.map((ex) => ex.getAverageRPE()).filter((rpe) => rpe > 0);
    if (rpes.length === 0) return 0;
    return rpes.reduce((acc, rpe) => acc + rpe, 0) / rpes.length;
  }

  /**
   * Finds an exercise within this group by its exercise ID.
   * @param exerciseId The ID of the exercise to find
   * @returns The performed exercise log or undefined if not found
   */
  findExerciseById(exerciseId: string): PerformedExerciseLogModel | undefined {
    return this.performedExercises.find((ex) => ex.exerciseId === exerciseId);
  }

  /**
   * Checks if all exercises in the group were skipped.
   * @returns True if all exercises in the group are marked as skipped
   */
  isCompletelySkipped(): boolean {
    return (
      this.performedExercises.length > 0 && this.performedExercises.every((ex) => ex.isSkipped)
    );
  }

  /**
   * Gets the number of exercises that were actually performed (not skipped).
   * @returns The count of non-skipped exercises
   */
  getCompletedExerciseCount(): number {
    return this.performedExercises.filter((ex) => !ex.isSkipped).length;
  }

  /**
   * Creates a new group log with updated rest time.
   * @param restSeconds The actual rest time in seconds
   * @returns A new PerformedGroupLogModel instance with updated rest time
   */
  cloneWithUpdatedRest(restSeconds: number): PerformedGroupLogModel {
    return this.createUpdatedInstance({ actualRestSeconds: restSeconds });
  }

  /**
   * Creates a new group log with an updated exercise.
   * @param updatedExercise The exercise to update within this group
   * @returns A new PerformedGroupLogModel instance with the updated exercise
   */
  cloneWithUpdatedExercise(updatedExercise: PerformedExerciseLogModel): PerformedGroupLogModel {
    const newExercises = this.performedExercises.map((ex) =>
      ex.id === updatedExercise.id ? updatedExercise : ex
    );
    return this.createUpdatedInstance({}, newExercises);
  }

  /**
   * Generates a human-readable summary of the group performance.
   * @returns A formatted string describing the group performance
   */
  getSummaryString(): string {
    const exerciseNames = this.performedExercises.map((ex) => ex.exerciseName).join(', ');
    return `${this.type}: ${exerciseNames} - ${this.getTotalSets()} sets, ${this.getTotalVolume()} kg`;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this PerformedGroupLogModel
   */
  clone(): this {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).performedExercises = this.performedExercises.map((e) => e.clone());
    }) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain PerformedGroupData object
   */
  toPlainObject(): PerformedGroupData {
    return {
      id: this.id,
      profileId: this.profileId,
      plannedGroupId: this.plannedGroupId,
      type: this.type,
      performedExerciseLogIds: this.performedExercises.map((e) => e.id),
      actualRestSeconds: this.actualRestSeconds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return performedGroupSchema.safeParse(this.toPlainObject());
  }
}
