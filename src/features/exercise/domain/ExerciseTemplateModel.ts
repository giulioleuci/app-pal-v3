import { produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import {
  type AnySetConfigurationData,
  type ExerciseTemplateData,
  exerciseTemplateSchema,
} from '@/shared/types';

/**
 * A domain model representing a template for exercise execution with predefined set configurations.
 * Links an exercise with specific set parameters for consistent workout planning.
 */
export class ExerciseTemplateModel extends BaseModel<ExerciseTemplateData> {
  public readonly name: string;
  public readonly exerciseId: string;
  public readonly setConfiguration: AnySetConfigurationData;
  public readonly notes?: string;

  protected constructor(props: ExerciseTemplateData) {
    super(props);
    this.name = props.name;
    this.exerciseId = props.exerciseId;
    this.setConfiguration = props.setConfiguration;
    this.notes = props.notes;
  }

  /**
   * Creates a new ExerciseTemplateModel instance from plain data.
   * @param props The exercise template data to hydrate from
   * @returns A new ExerciseTemplateModel instance
   */
  public static hydrate(props: ExerciseTemplateData): ExerciseTemplateModel {
    return new ExerciseTemplateModel(props);
  }

  /**
   * Creates a new template instance with an updated name.
   * @param newName The new name for the template
   * @returns A new ExerciseTemplateModel instance with the updated name
   */
  cloneWithNewName(newName: string): ExerciseTemplateModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).name = newName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new template instance with updated notes.
   * @param newNotes The new notes for the template
   * @returns A new ExerciseTemplateModel instance with the updated notes
   */
  cloneWithNewNotes(newNotes?: string): ExerciseTemplateModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).notes = newNotes;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new template instance with an updated set configuration.
   * @param newSetConfiguration The new set configuration
   * @returns A new ExerciseTemplateModel instance with the updated configuration
   */
  cloneWithNewSetConfiguration(
    newSetConfiguration: AnySetConfigurationData
  ): ExerciseTemplateModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).setConfiguration = newSetConfiguration;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Gets the total number of sets defined in this template.
   * @returns The total number of sets
   */
  getTotalSets(): number {
    // Simplified logic - for full functionality, delegate to hydrated SetConfiguration
    switch (this.setConfiguration.type) {
      case 'standard':
      case 'drop':
      case 'restPause':
      case 'mav':
        return this.setConfiguration.sets?.max || this.setConfiguration.sets?.min || 1;
      case 'myoReps':
        return (
          (this.setConfiguration.sets?.max || this.setConfiguration.sets?.min || 1) +
          (this.setConfiguration.miniSets?.max || this.setConfiguration.miniSets?.min || 0)
        );
      case 'pyramidal':
        const sets = this.setConfiguration.sets?.max || this.setConfiguration.sets?.min || 1;
        return this.setConfiguration.mode === 'bothAscendingDescending' ? sets * 2 : sets;
      default:
        return 1;
    }
  }

  /**
   * Gets a human-readable summary of the set configuration.
   * @returns A string summarizing the set structure (e.g., "3x8-12")
   */
  getSetSummary(): string {
    // Simplified summary - for full functionality, delegate to hydrated SetConfiguration
    const sets = this.getTotalSets();
    return `${sets} sets (${this.setConfiguration.type})`;
  }

  /**
   * Gets the estimated duration for completing this template.
   * @param timePerRep Optional time per rep in seconds
   * @param baseTimePerSet Optional base time per set in seconds
   * @returns Estimated duration in seconds
   */
  getEstimatedDurationSeconds(timePerRep?: number, baseTimePerSet?: number): number {
    // Simplified estimation - for full functionality, delegate to hydrated SetConfiguration
    const sets = this.getTotalSets();
    const avgTimePerSet = (timePerRep || 3) * 10 + (baseTimePerSet || 30); // rough estimate
    return sets * avgTimePerSet;
  }

  /**
   * Gets a simplified RPE curve for this template's set configuration.
   * @returns Array of RPE values, one for each set
   */
  getEstimatedRPECurve(): number[] {
    // Simplified RPE curve - for full functionality, delegate to hydrated SetConfiguration
    const sets = this.getTotalSets();
    return Array.from({ length: sets }, (_, i) => 6 + Math.floor((i / sets) * 3)); // 6-9 RPE curve
  }

  /**
   * Gets the type of set configuration used in this template.
   * @returns The set configuration type
   */
  getSetConfigurationType(): string {
    return this.setConfiguration.type;
  }

  /**
   * Checks if this template has notes.
   * @returns True if notes are present
   */
  hasNotes(): boolean {
    return !!this.notes;
  }

  /**
   * Gets the template display name.
   * @returns The template name
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this ExerciseTemplateModel
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain ExerciseTemplateData object
   */
  toPlainObject(): ExerciseTemplateData {
    return {
      id: this.id,
      name: this.name,
      exerciseId: this.exerciseId,
      setConfiguration: this.setConfiguration,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return exerciseTemplateSchema.safeParse(this.toPlainObject());
  }
}
