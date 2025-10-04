import { immerable, produce } from 'immer';
import { z } from 'zod';

import { generateId } from '@/lib';
import { BaseModel } from '@/shared/domain';
import {
  type ExerciseGroupData,
  exerciseGroupSchema,
  minMaxDirectionalSchema,
} from '@/shared/types';

import { AppliedExerciseModel } from './AppliedExerciseModel';

/**
 * A domain model representing a group of exercises in a training plan.
 * Acts as a polymorphic factory for specialized group types (superset, circuit, etc.).
 */
export class ExerciseGroupModel extends BaseModel<ExerciseGroupData> {
  [immerable] = true;
  public readonly profileId: string;
  public readonly type: ExerciseGroupData['type'];
  public readonly appliedExercises: AppliedExerciseModel[];
  public readonly restTimeSeconds?: number;
  public readonly durationMinutes?: number;
  public readonly rounds?: z.infer<typeof minMaxDirectionalSchema>;

  protected constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[]) {
    super(props);
    this.profileId = props.profileId;
    this.type = props.type;
    this.appliedExercises = appliedExercises;
    this.restTimeSeconds = props.restTimeSeconds;

    if ('durationMinutes' in props) {
      this.durationMinutes = props.durationMinutes;
    }
    if ('rounds' in props) {
      this.rounds = props.rounds;
    }
  }

  /**
   * Creates a new ExerciseGroupModel instance from plain data using polymorphic instantiation.
   * @param props The exercise group data to hydrate from
   * @param appliedExercises The applied exercises that belong to this group
   * @returns A specialized ExerciseGroupModel subclass based on the type
   */
  public static hydrate(
    props: ExerciseGroupData,
    appliedExercises: AppliedExerciseModel[]
  ): ExerciseGroupModel {
    // For now, return base class for all types until subclasses are properly implemented
    // TODO: Implement polymorphic factory when circular dependency is resolved
    return new ExerciseGroupModel(props, appliedExercises);
  }

  /**
   * Creates a new group instance with a reordered exercise.
   * @param appliedExerciseId The ID of the exercise to reorder
   * @param direction The direction to move the exercise ('up' or 'down')
   * @returns A new ExerciseGroupModel instance with reordered exercises
   */
  cloneWithReorderedExercise(
    appliedExerciseId: string,
    direction: 'up' | 'down'
  ): ExerciseGroupModel {
    return produce(this, (draft) => {
      const index = draft.appliedExercises.findIndex((ae) => ae.id === appliedExerciseId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= draft.appliedExercises.length) return;

      const [item] = draft.appliedExercises.splice(index, 1);
      draft.appliedExercises.splice(newIndex, 0, item);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new group instance with an added exercise.
   * @param appliedExercise The exercise to add to the group
   * @returns A new ExerciseGroupModel instance with the added exercise
   */
  cloneWithAddedExercise(appliedExercise: AppliedExerciseModel): ExerciseGroupModel {
    return produce(this, (draft) => {
      draft.appliedExercises.push(appliedExercise);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new group instance with a removed exercise.
   * @param appliedExerciseId The ID of the exercise to remove
   * @returns A new ExerciseGroupModel instance with the exercise removed
   */
  cloneWithRemovedExercise(appliedExerciseId: string): ExerciseGroupModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).appliedExercises = draft.appliedExercises.filter(
        (ae) => ae.id !== appliedExerciseId
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new group instance with updated rest time.
   * @param restTimeSeconds The new rest time in seconds
   * @returns A new ExerciseGroupModel instance with updated rest time
   */
  cloneWithNewRestTime(restTimeSeconds?: number): ExerciseGroupModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).restTimeSeconds = restTimeSeconds;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Gets the total number of exercises in this group.
   * @returns The number of applied exercises
   */
  getExerciseCount(): number {
    return this.appliedExercises.length;
  }

  /**
   * Gets the estimated duration for this group in seconds.
   * @returns Estimated duration based on exercises and rest time
   */
  getEstimatedDurationSeconds(): number {
    const exerciseDuration = this.appliedExercises.reduce((acc, exercise) => {
      return acc + exercise.getTotalSets() * 60; // Rough estimate: 1 min per set
    }, 0);
    const restDuration = this.restTimeSeconds || 0;
    return exerciseDuration + restDuration;
  }

  /**
   * Checks if this group has custom rest time defined.
   * @returns True if restTimeSeconds is defined
   */
  hasCustomRestTime(): boolean {
    return this.restTimeSeconds !== undefined;
  }

  /**
   * Checks if this group has duration-based configuration (EMOM/AMRAP).
   * @returns True if durationMinutes is defined
   */
  hasDuration(): boolean {
    return this.durationMinutes !== undefined;
  }

  /**
   * Checks if this group has rounds configuration.
   * @returns True if rounds is defined
   */
  hasRounds(): boolean {
    return this.rounds !== undefined;
  }

  /**
   * Gets the group type.
   * @returns The exercise group type
   */
  getType(): string {
    return this.type;
  }

  /**
   * Creates a complete copy of this group with new IDs.
   * @returns A new ExerciseGroupModel instance with new IDs for all components
   */
  cloneAsCopy(): ExerciseGroupModel {
    const newAppliedExercises = this.appliedExercises.map((ae) =>
      AppliedExerciseModel.hydrate({ ...ae.toPlainObject(), id: generateId() })
    );
    return ExerciseGroupModel.hydrate(
      { ...this.toPlainObject(), id: generateId() },
      newAppliedExercises
    );
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this ExerciseGroupModel
   */
  clone(): this {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).appliedExercises = this.appliedExercises.map((ae) => ae.clone());
    }) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain ExerciseGroupData object
   */
  toPlainObject(): ExerciseGroupData {
    const base = {
      id: this.id,
      profileId: this.profileId,
      type: this.type,
      appliedExerciseIds: this.appliedExercises.map((e) => e.id),
      restTimeSeconds: this.restTimeSeconds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fullObject: any = { ...base };
    if (this.durationMinutes) {
      fullObject.durationMinutes = this.durationMinutes;
    }
    if (this.rounds) {
      fullObject.rounds = this.rounds;
    }

    return fullObject as ExerciseGroupData;
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return exerciseGroupSchema.safeParse(this.toPlainObject());
  }
}
