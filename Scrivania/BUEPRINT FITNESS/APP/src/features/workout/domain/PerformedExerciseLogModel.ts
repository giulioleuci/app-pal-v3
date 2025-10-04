import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import {
  ComparisonTrend,
  MuscleGroup,
  PerformedExerciseLogData,
  performedExerciseLogSchema,
  RepRangeCategory,
} from '@/shared/types';

import { PerformedSetModel } from './PerformedSetModel';

/**
 * A domain model representing a performed exercise log in a workout.
 * Contains sets, performance metrics, and comparison data.
 */
export class PerformedExerciseLogModel extends BaseModel<PerformedExerciseLogData> {
  [immerable] = true;

  public readonly profileId: string;
  public readonly exerciseId: string;
  public readonly plannedExerciseId?: string;
  public readonly sets: PerformedSetModel[];
  public readonly notes?: string;
  public readonly isSkipped: boolean;
  public readonly exerciseName: string;
  public readonly exerciseCategory: PerformedExerciseLogData['exerciseCategory'];
  public readonly muscleActivation: PerformedExerciseLogData['muscleActivation'];
  public readonly totalSets?: number;
  public readonly totalCounts?: number;
  public readonly totalVolume?: number;
  public readonly repCategoryDistribution?: PerformedExerciseLogData['repCategoryDistribution'];
  public readonly comparisonTrend?: PerformedExerciseLogData['comparisonTrend'];
  public readonly comparisonSetsChange?: number;
  public readonly comparisonCountsChange?: number;
  public readonly comparisonVolumeChange?: number;
  public readonly comparisonVolume?: number;
  public readonly comparisonAvgWeight?: number;
  public readonly comparisonMaxWeight?: number;
  public readonly comparisonTotalReps?: number;
  public readonly rpeEffort?: PerformedExerciseLogData['rpeEffort'];
  public readonly estimated1RM?: number;

  protected constructor(props: PerformedExerciseLogData, sets: PerformedSetModel[]) {
    super(props);
    this.profileId = props.profileId;
    this.exerciseId = props.exerciseId;
    this.plannedExerciseId = props.plannedExerciseId;
    this.sets = sets;
    this.notes = props.notes;
    this.isSkipped = props.isSkipped;
    this.exerciseName = props.exerciseName;
    this.exerciseCategory = props.exerciseCategory;
    this.muscleActivation = props.muscleActivation;
    this.totalSets = props.totalSets;
    this.totalCounts = props.totalCounts;
    this.totalVolume = props.totalVolume;
    this.repCategoryDistribution = props.repCategoryDistribution;
    this.comparisonTrend = props.comparisonTrend;
    this.comparisonSetsChange = props.comparisonSetsChange;
    this.comparisonCountsChange = props.comparisonCountsChange;
    this.comparisonVolumeChange = props.comparisonVolumeChange;
    this.comparisonVolume = props.comparisonVolume;
    this.comparisonAvgWeight = props.comparisonAvgWeight;
    this.comparisonMaxWeight = props.comparisonMaxWeight;
    this.comparisonTotalReps = props.comparisonTotalReps;
    this.rpeEffort = props.rpeEffort;
    this.estimated1RM = props.estimated1RM;
  }

  /**
   * Creates a new PerformedExerciseLogModel instance from plain data.
   * @param props The performed exercise log data to hydrate from
   * @param sets The performed set models that belong to this exercise
   * @returns A new PerformedExerciseLogModel instance
   */
  public static hydrate(
    props: PerformedExerciseLogData,
    sets: PerformedSetModel[]
  ): PerformedExerciseLogModel {
    return new PerformedExerciseLogModel(props, sets);
  }

  private createUpdatedInstance(
    updates: Partial<PerformedExerciseLogData>,
    newSets?: PerformedSetModel[]
  ): PerformedExerciseLogModel {
    const currentData = this.toPlainObject();
    // Ensure updatedAt is always newer than the current timestamp
    const updatedAt = new Date(Math.max(new Date().getTime(), this.updatedAt.getTime() + 1));
    const newData = { ...currentData, ...updates, updatedAt };
    return new PerformedExerciseLogModel(newData, newSets || this.sets);
  }

  private getCompletedSets(): PerformedSetModel[] {
    return this.sets.filter((s) => s.isCompleted());
  }

  /**
   * Calculates the total volume for all completed sets.
   * @returns The total volume (weight × reps) for all completed sets
   */
  getTotalVolume(): number {
    return this.getCompletedSets().reduce((acc, set) => acc + (set.weight || 0) * set.counts, 0);
  }

  /**
   * Calculates the total rep count for all completed sets.
   * @returns The total number of repetitions performed
   */
  getTotalCounts(): number {
    return this.getCompletedSets().reduce((acc, set) => acc + set.counts, 0);
  }

  /**
   * Gets the total number of completed sets.
   * @returns The count of completed sets
   */
  getTotalSets(): number {
    return this.getCompletedSets().length;
  }

  /**
   * Gets the total number of planned sets for this exercise.
   * @returns The total count of all sets (completed and planned)
   */
  getPlannedSetsCount(): number {
    return this.sets.length;
  }

  /**
   * Gets the total number of planned repetitions for this exercise.
   * @returns The total planned rep count across all sets
   */
  getPlannedCountsTotal(): number {
    return this.sets.reduce((acc, set) => acc + set.counts, 0);
  }

  /**
   * Calculates the average weight across all completed sets.
   * @returns The average weight used across completed sets
   */
  getAverageWeight(): number {
    const completedSets = this.getCompletedSets();
    if (completedSets.length === 0) return 0;
    const totalWeight = completedSets.reduce((acc, set) => acc + (set.weight || 0), 0);
    return totalWeight / completedSets.length;
  }

  /**
   * Calculates the average RPE across all completed sets with RPE data.
   * @returns The average RPE across completed sets
   */
  getAverageRPE(): number {
    const setsWithRpe = this.getCompletedSets().filter((s) => s.rpe);
    if (setsWithRpe.length === 0) return 0;
    const totalRpe = setsWithRpe.reduce((acc, set) => acc + set.rpe!, 0);
    return totalRpe / setsWithRpe.length;
  }

  /**
   * Gets the RPE of the last completed set with RPE data.
   * @returns The RPE of the last set, or 0 if no sets have RPE
   */
  getLastRPE(): number {
    const lastSetWithRpe = [...this.getCompletedSets()].reverse().find((s) => s.rpe);
    return lastSetWithRpe?.rpe || 0;
  }

  /**
   * Finds the set with the highest weight.
   * @returns The heaviest completed set, or undefined if no sets are completed
   */
  getHeaviestSet(): PerformedSetModel | undefined {
    return [...this.getCompletedSets()].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
  }

  /**
   * Counts sets above a minimum RPE threshold (considered "effective").
   * @param minRPE The minimum RPE threshold for effective sets
   * @returns The number of sets with RPE above the threshold
   */
  getEffectiveSetsCount(minRPE: number): number {
    return this.getCompletedSets().filter((s) => s.rpe && s.rpe >= minRPE).length;
  }

  /**
   * Analyzes the distribution of sets across rep range categories.
   * @returns An object with counts for each rep range category
   */
  getRepCategoryDistribution(): Record<RepRangeCategory, number> {
    const distribution: Record<RepRangeCategory, number> = {
      strength: 0,
      hypertrophy: 0,
      endurance: 0,
    };
    this.getCompletedSets().forEach((set) => {
      distribution[set.getRepRangeCategory()]++;
    });
    return distribution;
  }

  /**
   * Calculates volume distribution across muscle groups.
   * @returns An object with volume per muscle group based on activation percentages
   */
  getVolumeByMuscleGroup(): Record<MuscleGroup, number> {
    const volume = this.getTotalVolume();
    const distribution: Record<MuscleGroup, number> = {} as any;
    for (const muscle in this.muscleActivation) {
      distribution[muscle as MuscleGroup] = volume * this.muscleActivation[muscle as MuscleGroup];
    }
    return distribution;
  }

  /**
   * Creates a new exercise log with calculated progression compared to a previous session.
   * @param previousLog The previous exercise log to compare against
   * @returns A new PerformedExerciseLogModel instance with updated comparison data
   */
  cloneWithCalculatedProgression(
    previousLog: PerformedExerciseLogModel
  ): PerformedExerciseLogModel {
    const trend = this.getPerformanceTrend(previousLog);
    const volumeChange = this.getTotalVolume() - previousLog.getTotalVolume();
    return this.createUpdatedInstance({
      comparisonTrend: trend,
      comparisonVolumeChange: volumeChange,
    });
  }

  /**
   * Analyzes performance trend compared to a previous session.
   * @param previousLog The previous exercise log to compare against
   * @returns The performance trend classification
   */
  getPerformanceTrend(previousLog: PerformedExerciseLogModel): ComparisonTrend {
    const currentVolume = this.getTotalVolume();
    const previousVolume = previousLog.getTotalVolume();
    if (currentVolume > previousVolume) return 'improvement';
    if (currentVolume < previousVolume) return 'deterioration';
    return 'maintenance';
  }

  /**
   * Creates a new exercise log with an updated set.
   * @param updatedSet The set to update within this exercise
   * @returns A new PerformedExerciseLogModel instance with the updated set
   */
  cloneWithUpdatedSet(updatedSet: PerformedSetModel): PerformedExerciseLogModel {
    const newSets = this.sets.map((s) => (s.id === updatedSet.id ? updatedSet : s));
    return this.createUpdatedInstance({}, newSets);
  }

  /**
   * Creates a new exercise log with an added set.
   * @param newSet The set to add to this exercise
   * @returns A new PerformedExerciseLogModel instance with the added set
   */
  cloneWithAddedSet(newSet: PerformedSetModel): PerformedExerciseLogModel {
    const newSets = [...this.sets, newSet];
    return this.createUpdatedInstance({}, newSets);
  }

  /**
   * Creates a new exercise log with toggled skip status.
   * @returns A new PerformedExerciseLogModel instance with inverted skip status
   */
  cloneWithToggledSkip(): PerformedExerciseLogModel {
    return this.createUpdatedInstance({ isSkipped: !this.isSkipped });
  }

  /**
   * Generates a human-readable summary of the exercise performance.
   * @returns A formatted string describing the exercise performance
   */
  getSummaryString(): string {
    return `${this.exerciseName}: ${this.getTotalSets()} sets, ${this.getTotalCounts()} reps, ${this.getTotalVolume()} kg`;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this PerformedExerciseLogModel
   */
  clone(): this {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).sets = this.sets.map((s) => s.clone());
    }) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain PerformedExerciseLogData object
   */
  toPlainObject(): PerformedExerciseLogData {
    const {
      id,
      profileId,
      exerciseId,
      plannedExerciseId,
      notes,
      isSkipped,
      exerciseName,
      exerciseCategory,
      muscleActivation,
      totalSets,
      totalCounts,
      totalVolume,
      repCategoryDistribution,
      comparisonTrend,
      comparisonSetsChange,
      comparisonCountsChange,
      comparisonVolumeChange,
      comparisonVolume,
      comparisonAvgWeight,
      comparisonMaxWeight,
      comparisonTotalReps,
      rpeEffort,
      estimated1RM,
      createdAt,
      updatedAt,
    } = this;
    return {
      id,
      profileId,
      exerciseId,
      plannedExerciseId,
      setIds: this.sets.map((s) => s.id),
      notes,
      isSkipped,
      exerciseName,
      exerciseCategory,
      muscleActivation,
      totalSets,
      totalCounts,
      totalVolume,
      repCategoryDistribution,
      comparisonTrend,
      comparisonSetsChange,
      comparisonCountsChange,
      comparisonVolumeChange,
      comparisonVolume,
      comparisonAvgWeight,
      comparisonMaxWeight,
      comparisonTotalReps,
      rpeEffort,
      estimated1RM,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return performedExerciseLogSchema.safeParse(this.toPlainObject());
  }
}
