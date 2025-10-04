import { isBefore } from 'date-fns';
import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { HeightRecordData, heightRecordSchema } from '@/shared/types';

/**
 * Rich domain model representing a height measurement record.
 * Encapsulates business logic for height tracking and conversions.
 */
export class HeightRecordModel extends BaseModel<HeightRecordData> {
  [immerable] = true;
  public readonly profileId: string;
  public readonly date: Date;
  public readonly height: number;
  public readonly notes?: string;

  /**
   * Protected constructor enforces the use of the static hydrate method.
   * @param props The plain HeightRecordData object.
   */
  protected constructor(props: HeightRecordData) {
    super(props);
    this.profileId = props.profileId;
    this.date = props.date;
    this.height = props.height;
    this.notes = props.notes;
  }

  /**
   * Static factory method for creating HeightRecordModel instances from plain data.
   * @param props The plain HeightRecordData object.
   * @returns A new HeightRecordModel instance.
   */
  public static hydrate(props: HeightRecordData): HeightRecordModel {
    return new HeightRecordModel(props);
  }

  /**
   * Creates an updated instance with new data while preserving immutability.
   * @param updates Partial updates to apply.
   * @returns A new HeightRecordModel instance with updates applied.
   */
  private createUpdatedInstance(updates: Partial<HeightRecordData>): HeightRecordModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return HeightRecordModel.hydrate(newData);
  }

  /**
   * Creates a new instance with an updated height value.
   * @param newHeight The new height in centimeters.
   * @returns A new HeightRecordModel instance with the updated height.
   */
  cloneWithNewHeight(newHeight: number): HeightRecordModel {
    return this.createUpdatedInstance({ height: newHeight });
  }

  /**
   * Creates a new instance with updated notes.
   * @param newNotes The new notes text.
   * @returns A new HeightRecordModel instance with updated notes.
   */
  cloneWithNewNotes(newNotes: string): HeightRecordModel {
    return this.createUpdatedInstance({ notes: newNotes });
  }

  /**
   * Compares this height record with another to determine if it's taller.
   * @param other The other HeightRecordModel to compare against.
   * @returns True if this record's height is greater than the other's.
   */
  isTallerThan(other: HeightRecordModel): boolean {
    return this.height > other.height;
  }

  /**
   * Checks if this height record was recorded before a specific date.
   * @param date The date to compare against.
   * @returns True if this record's date is before the provided date.
   */
  wasRecordedBefore(date: Date): boolean {
    return isBefore(this.date, date);
  }

  /**
   * Converts the height to different units.
   * @param unit The target unit ('cm' or 'inches').
   * @returns The height converted to the specified unit.
   */
  getHeightIn(unit: 'cm' | 'inches'): number {
    if (unit === 'inches') {
      return this.height / 2.54;
    }
    return this.height;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this HeightRecordModel.
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain HeightRecordData object.
   */
  toPlainObject(): HeightRecordData {
    const { id, profileId, date, height, notes, createdAt, updatedAt } = this;
    return { id, profileId, date, height, notes, createdAt, updatedAt };
  }

  /**
   * Validates the model's data against the HeightRecord Zod schema.
   * @returns Validation result with success flag and potential errors.
   */
  validate() {
    return heightRecordSchema.safeParse(this.toPlainObject());
  }
}
