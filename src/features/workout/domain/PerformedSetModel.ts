import { immerable, produce } from 'immer';

import { classifyRepRange } from '@/lib';
import { BaseModel } from '@/shared/domain';
import {
  PerformedSetData,
  performedSetSchema,
  RepRangeCategory,
  RpeEffort,
  SetExecutionType,
  SubSetData,
} from '@/shared/types';

/**
 * A domain model representing a performed set in a workout log.
 * Contains set data, completion status, and performance metrics.
 */
export class PerformedSetModel extends BaseModel<PerformedSetData> {
  [immerable] = true;

  public readonly profileId: string;
  public readonly counterType: PerformedSetData['counterType'];
  public readonly counts: number;
  public readonly weight?: number;
  public readonly completed: boolean;
  public readonly notes?: string;
  public readonly rpe?: number;
  public readonly percentage?: number;
  public readonly plannedLoad?: PerformedSetData['plannedLoad'];
  public readonly plannedRpe?: PerformedSetData['plannedRpe'];
  public readonly plannedCounts?: PerformedSetData['plannedCounts'];

  // Sub-set tracking fields (v3 additions)
  public readonly subSets?: SubSetData[];
  public readonly executionType?: SetExecutionType;
  public readonly isSubSetCompleted?: boolean[];

  protected constructor(props: PerformedSetData) {
    super(props);
    this.profileId = props.profileId;
    this.counterType = props.counterType;
    this.counts = props.counts;
    this.weight = props.weight;
    this.completed = props.completed;
    this.notes = props.notes;
    this.rpe = props.rpe;
    this.percentage = props.percentage;
    this.plannedLoad = props.plannedLoad;
    this.plannedRpe = props.plannedRpe;
    this.plannedCounts = props.plannedCounts;

    // Sub-set tracking fields
    this.subSets = props.subSets;
    this.executionType = props.executionType;
    this.isSubSetCompleted = props.isSubSetCompleted;
  }

  /**
   * Creates a new PerformedSetModel instance from plain data.
   * @param props The performed set data to hydrate from
   * @returns A new PerformedSetModel instance
   */
  public static hydrate(props: PerformedSetData): PerformedSetModel {
    return new PerformedSetModel(props);
  }

  private createUpdatedInstance(updates: Partial<PerformedSetData>): PerformedSetModel {
    const currentData = this.toPlainObject();
    // Ensure updatedAt is always newer than the current timestamp
    const updatedAt = new Date(Math.max(new Date().getTime(), this.updatedAt.getTime() + 1));
    const newData = { ...currentData, ...updates, updatedAt };
    return new PerformedSetModel(newData);
  }

  /**
   * Classifies the set's repetition count into a strength category.
   * @returns The rep range category (strength, hypertrophy, endurance)
   */
  getRepRangeCategory(): RepRangeCategory {
    return classifyRepRange(this.counts);
  }

  /**
   * Checks if the set was completed.
   * @returns True if the set was marked as completed
   */
  isCompleted(): boolean {
    return this.completed;
  }

  /**
   * Calculates deviation from planned rep count.
   * @returns The difference between actual and planned minimum counts
   */
  getCountsDeviation(): number {
    if (!this.plannedCounts) return 0;
    return this.counts - this.plannedCounts.min;
  }

  /**
   * Calculates deviation from planned load.
   * @returns The difference between actual and planned minimum load
   */
  getLoadDeviation(): number {
    if (!this.plannedLoad || !this.weight) return 0;
    return this.weight - this.plannedLoad.min;
  }

  /**
   * Evaluates RPE effort level based on performance.
   * @returns The RPE effort classification
   */
  getRPEEffort(): RpeEffort {
    if (!this.rpe) return 'optimal';
    if (this.rpe >= 9) return 'excessive';
    if (this.rpe <= 5) return 'poor';
    return 'optimal';
  }

  /**
   * Checks if the set uses advanced execution techniques (has sub-sets).
   * @returns True if the set has sub-set data
   */
  hasSubSets(): boolean {
    return Boolean(this.subSets && this.subSets.length > 0);
  }

  /**
   * Gets the execution type, defaulting to 'standard' for backward compatibility.
   * @returns The execution type
   */
  getExecutionType(): SetExecutionType {
    return this.executionType || 'standard';
  }

  /**
   * Calculates the total counts across all sub-sets.
   * @returns Total counts including main set and all sub-sets
   */
  getTotalCounts(): number {
    if (!this.hasSubSets()) return this.counts;

    const subSetCounts = this.subSets!.reduce((total, subSet) => total + subSet.counts, 0);
    return this.counts + subSetCounts;
  }

  /**
   * Calculates the total volume across all sub-sets.
   * @returns Total volume including main set and all sub-sets
   */
  getTotalVolume(): number {
    const mainVolume = (this.weight || 0) * this.counts;

    if (!this.hasSubSets()) return mainVolume;

    const subSetVolume = this.subSets!.reduce((total, subSet) => {
      return total + (subSet.weight || this.weight || 0) * subSet.counts;
    }, 0);

    return mainVolume + subSetVolume;
  }

  /**
   * Gets completion status for a specific sub-set.
   * @param subSetIndex The index of the sub-set
   * @returns True if the sub-set is completed, false otherwise
   */
  getSubSetCompletionStatus(subSetIndex: number): boolean {
    if (!this.isSubSetCompleted || subSetIndex >= this.isSubSetCompleted.length) {
      return false;
    }
    return this.isSubSetCompleted[subSetIndex];
  }

  /**
   * Checks if all sub-sets are completed.
   * @returns True if all sub-sets are completed
   */
  areAllSubSetsCompleted(): boolean {
    if (!this.hasSubSets() || !this.isSubSetCompleted) return true;
    return this.isSubSetCompleted.every((completed) => completed);
  }

  /**
   * Creates a new set instance with updated data.
   * @param newData The data to update
   * @returns A new PerformedSetModel instance with updated data
   */
  cloneWithUpdates(newData: Partial<PerformedSetData>): PerformedSetModel {
    return this.createUpdatedInstance(newData);
  }

  /**
   * Creates a new set instance with toggled completion status.
   * @returns A new PerformedSetModel instance with inverted completion status
   */
  cloneWithToggledCompletion(): PerformedSetModel {
    return this.createUpdatedInstance({ completed: !this.completed });
  }

  /**
   * Generates a human-readable summary of the set.
   * @returns A formatted string describing the set performance
   */
  getSummaryString(): string {
    let summary = `${this.weight || 0} kg x ${this.counts}`;
    if (this.rpe) {
      summary += ` @ RPE ${this.rpe}`;
    }
    return summary;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this PerformedSetModel
   */
  clone(): this {
    // Create a proper deep clone while preserving timestamp references
    const plainData = this.toPlainObject();
    const clonedData = {
      ...plainData,
      // Preserve timestamp references for immutable timestamps
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Deep clone nested objects
      plannedLoad: plainData.plannedLoad ? { ...plainData.plannedLoad } : undefined,
      plannedRpe: plainData.plannedRpe ? { ...plainData.plannedRpe } : undefined,
      plannedCounts: plainData.plannedCounts ? { ...plainData.plannedCounts } : undefined,
      // Deep clone sub-set arrays
      subSets: plainData.subSets ? plainData.subSets.map((subSet) => ({ ...subSet })) : undefined,
      isSubSetCompleted: plainData.isSubSetCompleted ? [...plainData.isSubSetCompleted] : undefined,
    };
    return PerformedSetModel.hydrate(clonedData) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain PerformedSetData object
   */
  toPlainObject(): PerformedSetData {
    const {
      id,
      profileId,
      counterType,
      counts,
      weight,
      completed,
      notes,
      rpe,
      percentage,
      plannedLoad,
      plannedRpe,
      plannedCounts,
      subSets,
      executionType,
      isSubSetCompleted,
      createdAt,
      updatedAt,
    } = this;
    return {
      id,
      profileId,
      counterType,
      counts,
      weight,
      completed,
      notes,
      rpe,
      percentage,
      plannedLoad,
      plannedRpe,
      plannedCounts,
      subSets,
      executionType,
      isSubSetCompleted,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return performedSetSchema.safeParse(this.toPlainObject());
  }
}
