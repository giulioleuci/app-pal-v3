import { isBefore } from 'date-fns';
import { produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { MaxLogData, maxLogSchema } from '@/shared/types';

import { BrzyckiFormula, EpleyFormula, IOneRepMaxFormula } from './IOneRepMaxFormula';

/**
 * Rich domain model representing a maximum lift log entry.
 * Encapsulates business logic for 1-Rep Max calculations using injectable formula strategies.
 */
export class MaxLogModel extends BaseModel<MaxLogData> {
  public readonly profileId: string;
  public readonly exerciseId: string;
  public readonly weightEnteredByUser: number;
  public readonly date: Date;
  public readonly reps: number;
  public readonly notes?: string;
  public readonly estimated1RM: number;
  public readonly maxBrzycki?: number;
  public readonly maxBaechle?: number;

  /**
   * Protected constructor enforces the use of the static hydrate method.
   * @param props The plain data object.
   * @param formulas Array of 1RM calculation strategies to use for estimation.
   */
  protected constructor(props: MaxLogData, formulas: IOneRepMaxFormula[]) {
    super(props);
    this.profileId = props.profileId;
    this.exerciseId = props.exerciseId;
    this.weightEnteredByUser = props.weightEnteredByUser;
    this.date = props.date;
    this.reps = props.reps;
    this.notes = props.notes;

    // Calculate primary estimate as average of provided formulas
    const results = formulas.map((f) => f.calculate(this.weightEnteredByUser, this.reps));
    this.estimated1RM =
      results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0;

    // Store specific formula results for compatibility
    this.maxBrzycki = new BrzyckiFormula().calculate(this.weightEnteredByUser, this.reps);
    this.maxBaechle = new EpleyFormula().calculate(this.weightEnteredByUser, this.reps);
  }

  /**
   * Static factory method for creating MaxLogModel instances from plain data.
   * @param props The plain MaxLogData object.
   * @param formulas Optional array of formula strategies. Defaults to Brzycki and Epley.
   * @returns A new MaxLogModel instance.
   */
  public static hydrate(
    props: MaxLogData,
    formulas: IOneRepMaxFormula[] = [new BrzyckiFormula(), new EpleyFormula()]
  ): MaxLogModel {
    return new MaxLogModel(props, formulas);
  }

  /**
   * Creates an updated instance with new data while preserving immutability.
   * @param updates Partial updates to apply.
   * @returns A new MaxLogModel instance with updates applied.
   */
  private createUpdatedInstance(updates: Partial<MaxLogData>): MaxLogModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return MaxLogModel.hydrate(newData);
  }

  /**
   * Determines if this is a direct 1-Rep Max attempt.
   * @returns True if the lift was performed for exactly 1 repetition.
   */
  isDirect1RM(): boolean {
    return this.reps === 1;
  }

  /**
   * Creates a new instance with updated lift details.
   * @param details The new lift details to apply.
   * @returns A new MaxLogModel instance with updated details.
   */
  cloneWithUpdatedDetails(
    details: Partial<{ weight: number; reps: number; notes: string; date: Date }>
  ): MaxLogModel {
    const updates: Partial<MaxLogData> = {};

    if (details.weight !== undefined) {
      updates.weightEnteredByUser = details.weight;
    }
    if (details.reps !== undefined) {
      updates.reps = details.reps;
    }
    if (details.notes !== undefined) {
      updates.notes = details.notes;
    }
    if (details.date !== undefined) {
      updates.date = details.date;
    }

    return this.createUpdatedInstance(updates);
  }

  /**
   * Gets the primary 1RM estimate calculated from the strategy formulas.
   * @returns The estimated 1-Rep Max value.
   */
  getPrimaryEstimate(): number {
    return this.estimated1RM;
  }

  /**
   * Compares this max log's performance against another.
   * @param otherLog The other MaxLogModel to compare against.
   * @returns Performance comparison metrics.
   */
  comparePerformance(otherLog: MaxLogModel): {
    differenceKg: number;
    percentageImprovement: number;
  } {
    const differenceKg = this.estimated1RM - otherLog.estimated1RM;
    const percentageImprovement =
      otherLog.estimated1RM > 0 ? (differenceKg / otherLog.estimated1RM) * 100 : 0;
    return { differenceKg, percentageImprovement };
  }

  /**
   * Calculates the lift-to-bodyweight ratio.
   * @param bodyweightKg The user's bodyweight in kilograms.
   * @returns The ratio of 1RM to bodyweight.
   */
  calculateBodyweightRatio(bodyweightKg: number): number {
    if (bodyweightKg <= 0) return 0;
    return this.estimated1RM / bodyweightKg;
  }

  /**
   * Generates a human-readable summary of the max log.
   * @returns A formatted summary string.
   */
  getSummaryString(): string {
    return `${this.weightEnteredByUser}kg x ${this.reps} reps (e1RM: ${this.estimated1RM.toFixed(1)}kg)`;
  }

  /**
   * Checks if this max log was recorded before a specific date.
   * @param date The date to compare against.
   * @returns True if this log's date is before the provided date.
   */
  isOlderThan(date: Date): boolean {
    return isBefore(this.date, date);
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this MaxLogModel.
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain MaxLogData object.
   */
  toPlainObject(): MaxLogData {
    const {
      id,
      profileId,
      exerciseId,
      weightEnteredByUser,
      date,
      reps,
      notes,
      estimated1RM,
      maxBrzycki,
      maxBaechle,
      createdAt,
      updatedAt,
    } = this;
    return {
      id,
      profileId,
      exerciseId,
      weightEnteredByUser,
      date,
      reps,
      notes,
      estimated1RM,
      maxBrzycki,
      maxBaechle,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Validates the model's data against the MaxLog Zod schema.
   * @returns Validation result with success flag and potential errors.
   */
  validate() {
    return maxLogSchema.safeParse(this.toPlainObject());
  }
}
