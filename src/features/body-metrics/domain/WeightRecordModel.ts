import { isBefore } from 'date-fns';
import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { WeightRecordData, weightRecordSchema } from '@/shared/types';

/**
 * Rich domain model representing a bodyweight measurement record.
 * Encapsulates business logic for weight tracking and conversions.
 */
export class WeightRecordModel extends BaseModel<WeightRecordData> {
  [immerable] = true;
  public readonly profileId: string;
  public readonly date: Date;
  public readonly weight: number;
  public readonly notes?: string;

  /**
   * Protected constructor enforces the use of the static hydrate method.
   * @param props The plain WeightRecordData object.
   */
  protected constructor(props: WeightRecordData) {
    super(props);
    this.profileId = props.profileId;
    this.date = props.date;
    this.weight = props.weight;
    this.notes = props.notes;
  }

  /**
   * Static factory method for creating WeightRecordModel instances from plain data.
   * @param props The plain WeightRecordData object.
   * @returns A new WeightRecordModel instance.
   */
  public static hydrate(props: WeightRecordData): WeightRecordModel {
    return new WeightRecordModel(props);
  }

  /**
   * Creates an updated instance with new data while preserving immutability.
   * @param updates Partial updates to apply.
   * @returns A new WeightRecordModel instance with updates applied.
   */
  private createUpdatedInstance(updates: Partial<WeightRecordData>): WeightRecordModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return WeightRecordModel.hydrate(newData);
  }

  /**
   * Creates a new instance with an updated weight value.
   * @param newWeight The new weight in kilograms.
   * @returns A new WeightRecordModel instance with the updated weight.
   */
  cloneWithNewWeight(newWeight: number): WeightRecordModel {
    return this.createUpdatedInstance({ weight: newWeight });
  }

  /**
   * Creates a new instance with updated notes.
   * @param newNotes The new notes text.
   * @returns A new WeightRecordModel instance with updated notes.
   */
  cloneWithNewNotes(newNotes: string): WeightRecordModel {
    return this.createUpdatedInstance({ notes: newNotes });
  }

  /**
   * Compares this weight record with another to determine if it's heavier.
   * @param other The other WeightRecordModel to compare against.
   * @returns True if this record's weight is greater than the other's.
   */
  isHeavierThan(other: WeightRecordModel): boolean {
    return this.weight > other.weight;
  }

  /**
   * Checks if this weight record was recorded before a specific date.
   * @param date The date to compare against.
   * @returns True if this record's date is before the provided date.
   */
  wasRecordedBefore(date: Date): boolean {
    return isBefore(this.date, date);
  }

  /**
   * Converts the weight to different units.
   * @param unit The target unit ('kg' or 'lbs').
   * @returns The weight converted to the specified unit.
   */
  getWeightIn(unit: 'kg' | 'lbs'): number {
    if (unit === 'lbs') {
      return this.weight * 2.20462;
    }
    return this.weight;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this WeightRecordModel.
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain WeightRecordData object.
   */
  toPlainObject(): WeightRecordData {
    const { id, profileId, date, weight, notes, createdAt, updatedAt } = this;
    return { id, profileId, date, weight, notes, createdAt, updatedAt };
  }

  /**
   * Validates the model's data against the WeightRecord Zod schema.
   * @returns Validation result with success flag and potential errors.
   */
  validate() {
    return weightRecordSchema.safeParse(this.toPlainObject());
  }
}
