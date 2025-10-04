import { differenceInSeconds } from 'date-fns';
import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { RepRangeCategory, WorkoutLogData, workoutLogSchema } from '@/shared/types';

import { PerformedExerciseLogModel } from './PerformedExerciseLogModel';
import { PerformedGroupLogModel } from './PerformedGroupLogModel';
import { PerformedSetModel } from './PerformedSetModel';

/**
 * A domain model representing a complete workout log aggregate root.
 * Contains all performed groups, exercises, and sets with performance analytics.
 */
export class WorkoutLogModel extends BaseModel<WorkoutLogData> {
  [immerable] = true;

  public readonly profileId: string;
  public readonly trainingPlanId?: string;
  public readonly trainingPlanName: string;
  public readonly sessionId?: string;
  public readonly sessionName: string;
  public readonly performedGroups: PerformedGroupLogModel[];
  public readonly startTime: Date;
  public readonly endTime?: Date;
  public readonly durationSeconds?: number;
  public readonly totalVolume?: number;
  public readonly notes?: string;
  public readonly userRating?: number;

  protected constructor(props: WorkoutLogData, groups: PerformedGroupLogModel[]) {
    super(props);
    this.profileId = props.profileId;
    this.trainingPlanId = props.trainingPlanId;
    this.trainingPlanName = props.trainingPlanName;
    this.sessionId = props.sessionId;
    this.sessionName = props.sessionName;
    this.performedGroups = groups;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.durationSeconds = props.durationSeconds;
    this.totalVolume = props.totalVolume;
    this.notes = props.notes;
    this.userRating = props.userRating;
  }

  /**
   * Creates a new WorkoutLogModel instance from plain data.
   * @param props The workout log data to hydrate from
   * @param groups The performed group log models that belong to this workout
   * @returns A new WorkoutLogModel instance
   */
  public static hydrate(props: WorkoutLogData, groups: PerformedGroupLogModel[]): WorkoutLogModel {
    return new WorkoutLogModel(props, groups);
  }

  private createUpdatedInstance(
    updates: Partial<WorkoutLogData>,
    newGroups?: PerformedGroupLogModel[]
  ): WorkoutLogModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return new WorkoutLogModel(newData, newGroups || this.performedGroups);
  }

  /**
   * Gets all performed sets from all exercises in the workout.
   * @returns A flat array of all performed sets in the workout
   */
  getAllSets(): PerformedSetModel[] {
    return this.performedGroups.flatMap((g) => g.performedExercises.flatMap((e) => e.sets));
  }

  /**
   * Gets all performed exercises from all groups in the workout.
   * @returns A flat array of all performed exercises in the workout
   */
  getAllExercises(): PerformedExerciseLogModel[] {
    return this.performedGroups.flatMap((g) => g.performedExercises);
  }

  /**
   * Calculates the workout duration in minutes.
   * @returns The duration in minutes, or undefined if workout is not finished
   */
  getDurationInMinutes(): number | undefined {
    if (!this.endTime) return undefined;
    return Math.round(differenceInSeconds(this.endTime, this.startTime) / 60);
  }

  /**
   * Finds personal bests achieved during this workout session.
   * @returns A map of exercise IDs to their heaviest sets in this workout
   */
  getPersonalBests(): Map<string, PerformedSetModel> {
    const bests = new Map<string, PerformedSetModel>();
    this.performedGroups.forEach((g) => {
      g.performedExercises.forEach((e) => {
        const heaviestSet = e.getHeaviestSet();
        if (heaviestSet) {
          const currentBest = bests.get(e.exerciseId);
          if (!currentBest || (heaviestSet.weight || 0) > (currentBest.weight || 0)) {
            bests.set(e.exerciseId, heaviestSet);
          }
        }
      });
    });
    return bests;
  }

  /**
   * Creates a new workout log with an updated set across all exercises.
   * @param updatedSet The set to update within the workout
   * @returns A new WorkoutLogModel instance with the updated set
   */
  cloneWithUpdatedSet(updatedSet: PerformedSetModel): WorkoutLogModel {
    const newGroups = this.performedGroups.map((g) => {
      const newExercises = g.performedExercises.map((e) => e.cloneWithUpdatedSet(updatedSet));
      return PerformedGroupLogModel.hydrate(g.toPlainObject(), newExercises);
    });
    return this.createUpdatedInstance({}, newGroups);
  }

  /**
   * Calculates the total volume for the entire workout.
   * @returns The total volume (weight × reps) for all exercises
   */
  calculateTotalVolume(): number {
    return this.performedGroups.reduce((acc, g) => acc + g.getTotalVolume(), 0);
  }

  /**
   * Calculates the total number of sets performed in the workout.
   * @returns The total set count across all exercises
   */
  getTotalSets(): number {
    return this.performedGroups.reduce((acc, g) => acc + g.getTotalSets(), 0);
  }

  /**
   * Calculates the total number of repetitions performed in the workout.
   * @returns The total rep count across all exercises
   */
  getTotalCounts(): number {
    return this.performedGroups.reduce((acc, g) => acc + g.getTotalCounts(), 0);
  }

  /**
   * Calculates the total number of planned sets in the workout.
   * @returns The total planned set count across all exercises
   */
  getPlannedSetsCount(): number {
    return this.performedGroups.reduce((acc, g) => acc + g.getPlannedSetsCount(), 0);
  }

  /**
   * Calculates the total number of planned repetitions in the workout.
   * @returns The total planned rep count across all exercises
   */
  getPlannedCountsTotal(): number {
    return this.performedGroups.reduce((acc, g) => acc + g.getPlannedCountsTotal(), 0);
  }

  /**
   * Calculates the average RPE across all completed sets with RPE data.
   * @returns The average RPE for the workout, or undefined if no RPE data exists
   */
  getAverageRPE(): number | undefined {
    const completedSetsWithRpe = this.getAllSets().filter((s) => s.rpe && s.completed);
    if (completedSetsWithRpe.length === 0) return undefined;
    const totalRpe = completedSetsWithRpe.reduce((acc, set) => acc + set.rpe!, 0);
    return Math.round((totalRpe / completedSetsWithRpe.length) * 10) / 10;
  }

  /**
   * Calculates the average of the last RPE from each exercise.
   * @returns The average last RPE across exercises, or undefined if no RPE data
   */
  getAverageLastRPE(): number | undefined {
    const lastRpes = this.getAllExercises()
      .map((e) => e.getLastRPE())
      .filter((rpe) => rpe > 0);
    if (lastRpes.length === 0) return undefined;
    return Math.round((lastRpes.reduce((acc, rpe) => acc + rpe, 0) / lastRpes.length) * 10) / 10;
  }

  /**
   * Analyzes the distribution of completed sets across rep range categories.
   * @returns An object with counts for each rep range category
   */
  getSetCountByRepRange(): Record<RepRangeCategory, number> {
    const distribution: Record<RepRangeCategory, number> = {
      strength: 0,
      hypertrophy: 0,
      endurance: 0,
    };
    this.getAllSets()
      .filter((set) => set.completed)
      .forEach((set) => {
        const category = set.getRepRangeCategory();
        distribution[category]++;
      });
    return distribution;
  }

  /**
   * Finds a specific exercise log by exercise ID.
   * @param exerciseId The ID of the exercise to find
   * @returns The performed exercise log or undefined if not found
   */
  findExerciseLog(exerciseId: string): PerformedExerciseLogModel | undefined {
    for (const group of this.performedGroups) {
      const found = group.findExerciseById(exerciseId);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Calculates a performance score for the workout.
   * @returns A performance score based on volume, RPE, and completion
   */
  getPerformanceScore(): number {
    const totalVolume = this.calculateTotalVolume();
    const avgRpe = this.getAverageRPE();
    const completionRate =
      this.getAllSets().filter((s) => s.completed).length / this.getAllSets().length;

    // Simple scoring algorithm - can be refined
    let score = totalVolume * 0.1;
    if (avgRpe) score += avgRpe * 10;
    score *= completionRate;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Analyzes set quality metrics for workout assessment.
   * @returns An object with high effort and junk volume set counts
   */
  getSetQualityMetrics(): { highEffortSets: number; junkVolumeSets: number } {
    const highEffortSets = this.getAllSets().filter((s) => s.rpe && s.rpe >= 7).length;
    const junkVolumeSets = this.getAllSets().filter((s) => s.rpe && s.rpe < 5).length;
    return { highEffortSets, junkVolumeSets };
  }

  /**
   * Creates a new workout log marked as ended with calculated totals.
   * @returns A new WorkoutLogModel instance with end time and calculated metrics
   */
  cloneAsEnded(): WorkoutLogModel {
    const endTime = new Date();
    const durationSeconds = differenceInSeconds(endTime, this.startTime);
    const totalVolume = this.calculateTotalVolume();

    // Update performed groups with comparison fields populated
    const updatedGroups = this.performedGroups.map((group) => {
      const updatedExercises = group.performedExercises.map((exercise) => {
        // Calculate comparison fields from the exercise's sets
        const completedSets = exercise.sets.filter((set) => set.completed);

        const comparisonVolume = exercise.getTotalVolume();
        const comparisonTotalReps = completedSets.reduce((sum, set) => sum + set.counts, 0);

        const weightsWithValues = completedSets
          .map((set) => set.weight)
          .filter((weight): weight is number => weight !== undefined && weight > 0);

        const comparisonAvgWeight =
          weightsWithValues.length > 0
            ? weightsWithValues.reduce((sum, weight) => sum + weight, 0) / weightsWithValues.length
            : 0;

        const comparisonMaxWeight =
          weightsWithValues.length > 0 ? Math.max(...weightsWithValues) : 0;

        // Create updated exercise with comparison fields
        const exerciseData = exercise.toPlainObject();
        const updatedExerciseData = {
          ...exerciseData,
          comparisonVolume,
          comparisonAvgWeight,
          comparisonMaxWeight,
          comparisonTotalReps,
          updatedAt: new Date(),
        };

        return PerformedExerciseLogModel.hydrate(updatedExerciseData, exercise.sets);
      });

      return PerformedGroupLogModel.hydrate(group.toPlainObject(), updatedExercises);
    });

    return this.createUpdatedInstance({ endTime, durationSeconds, totalVolume }, updatedGroups);
  }

  /**
   * Creates a new workout log with updated metadata.
   * @param details The metadata to update (notes, rating)
   * @returns A new WorkoutLogModel instance with updated metadata
   */
  cloneWithUpdatedMetadata(details: { notes?: string; userRating?: number }): WorkoutLogModel {
    return this.createUpdatedInstance(details);
  }

  /**
   * Checks if the workout is currently in progress.
   * @returns True if the workout has started but not ended
   */
  isInProgress(): boolean {
    return !this.endTime;
  }

  /**
   * Checks if the workout has been completed.
   * @returns True if the workout has an end time
   */
  isCompleted(): boolean {
    return !!this.endTime;
  }

  /**
   * Gets the workout display name combining plan and session names.
   * @returns A formatted display name for the workout
   */
  getDisplayName(): string {
    return `${this.trainingPlanName} - ${this.sessionName}`;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this WorkoutLogModel
   */
  clone(): this {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).performedGroups = this.performedGroups.map((g) => g.clone());
    }) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain WorkoutLogData object
   */
  toPlainObject(): WorkoutLogData {
    return {
      id: this.id,
      profileId: this.profileId,
      trainingPlanId: this.trainingPlanId,
      trainingPlanName: this.trainingPlanName,
      sessionId: this.sessionId,
      sessionName: this.sessionName,
      performedGroupIds: this.performedGroups.map((g) => g.id),
      startTime: this.startTime,
      endTime: this.endTime,
      durationSeconds: this.durationSeconds,
      totalVolume: this.totalVolume,
      notes: this.notes,
      userRating: this.userRating,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return workoutLogSchema.safeParse(this.toPlainObject());
  }
}
