import { immerable, produce } from 'immer';

import { generateId } from '@/lib';
import { BaseModel } from '@/shared/domain';
import { type DayOfWeek, type WorkoutSessionData, workoutSessionSchema } from '@/shared/types';

import { AppliedExerciseModel } from './AppliedExerciseModel';
import { ExerciseGroupModel } from './ExerciseGroupModel';

/**
 * A domain model representing a workout session in a training plan.
 * Contains groups of exercises, execution tracking, and session metadata.
 */
export class SessionModel extends BaseModel<WorkoutSessionData> {
  [immerable] = true;
  public readonly profileId: string;
  public readonly name: string;
  public readonly groups: ExerciseGroupModel[];
  public readonly notes?: string;
  public readonly executionCount: number;
  public readonly isDeload: boolean;
  public readonly dayOfWeek: DayOfWeek | null;

  protected constructor(props: WorkoutSessionData, groups: ExerciseGroupModel[]) {
    super(props);
    this.profileId = props.profileId;
    this.name = props.name;
    this.groups = groups;
    this.notes = props.notes;
    this.executionCount = props.executionCount;
    this.isDeload = props.isDeload;
    this.dayOfWeek = props.dayOfWeek;
  }

  /**
   * Creates a new SessionModel instance from plain data.
   * @param props The workout session data to hydrate from
   * @param groups The exercise groups that belong to this session
   * @returns A new SessionModel instance
   */
  public static hydrate(props: WorkoutSessionData, groups: ExerciseGroupModel[]): SessionModel {
    return new SessionModel(props, groups);
  }

  /**
   * Creates a new session instance with incremented execution count.
   * @returns A new SessionModel instance with execution count incremented by 1
   */
  public cloneWithIncrementedExecutionCount(): SessionModel {
    return produce(this, (draft) => {
      draft.executionCount++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new session instance with updated name.
   * @param newName The new name for the session
   * @returns A new SessionModel instance with updated name
   */
  cloneWithNewName(newName: string): SessionModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).name = newName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new session instance with updated notes.
   * @param newNotes The new notes for the session
   * @returns A new SessionModel instance with updated notes
   */
  cloneWithNewNotes(newNotes?: string): SessionModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).notes = newNotes;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new session instance with updated day of week.
   * @param dayOfWeek The new day of week for the session
   * @returns A new SessionModel instance with updated day of week
   */
  cloneWithNewDayOfWeek(dayOfWeek: DayOfWeek | null): SessionModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).dayOfWeek = dayOfWeek;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Finds an applied exercise by ID within this session.
   * @param appliedExerciseId The ID of the applied exercise to find
   * @returns The exercise and its containing group, or undefined if not found
   */
  findExerciseById(
    appliedExerciseId: string
  ): { exercise: AppliedExerciseModel; group: ExerciseGroupModel } | undefined {
    for (const group of this.groups) {
      const exercise = group.appliedExercises.find((ae) => ae.id === appliedExerciseId);
      if (exercise) {
        return { exercise, group };
      }
    }
    return undefined;
  }

  /**
   * Gets the total number of exercises across all groups in this session.
   * @returns The total exercise count
   */
  getTotalExerciseCount(): number {
    return this.groups.reduce((acc, group) => acc + group.appliedExercises.length, 0);
  }

  /**
   * Gets the total number of groups in this session.
   * @returns The total group count
   */
  getTotalGroupCount(): number {
    return this.groups.length;
  }

  /**
   * Creates a complete copy of this session with new IDs.
   * @param newName The name for the copied session
   * @returns A new SessionModel instance with new IDs for all components
   */
  cloneAsCopy(newName: string): SessionModel {
    const newSessionData = { ...this.toPlainObject(), id: generateId(), name: newName };
    const newGroups = this.groups.map((group) => {
      const newAppliedExercises = group.appliedExercises.map((ae) =>
        AppliedExerciseModel.hydrate({ ...ae.toPlainObject(), id: generateId() })
      );
      return ExerciseGroupModel.hydrate(
        { ...group.toPlainObject(), id: generateId() },
        newAppliedExercises
      );
    });
    return new SessionModel(newSessionData, newGroups);
  }

  /**
   * Creates a new session instance with a reordered group.
   * @param groupId The ID of the group to reorder
   * @param direction The direction to move the group ('up' or 'down')
   * @returns A new SessionModel instance with reordered groups
   */
  cloneWithReorderedGroup(groupId: string, direction: 'up' | 'down'): SessionModel {
    return produce(this, (draft) => {
      const index = draft.groups.findIndex((g) => g.id === groupId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= draft.groups.length) return;

      const [item] = draft.groups.splice(index, 1);
      draft.groups.splice(newIndex, 0, item);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new session instance with a removed exercise.
   * @param appliedExerciseId The ID of the exercise to remove
   * @returns A new SessionModel instance with the exercise removed
   */
  cloneWithRemovedExercise(appliedExerciseId: string): SessionModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).groups = draft.groups
        .map((group) => {
          const newAppliedExercises = group.appliedExercises.filter(
            (ae) => ae.id !== appliedExerciseId
          );
          if (newAppliedExercises.length === group.appliedExercises.length) return group;
          // Return a new group with filtered exercises
          return ExerciseGroupModel.hydrate(group.toPlainObject(), newAppliedExercises);
        })
        .filter((group) => group.appliedExercises.length > 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new session instance with added group.
   * @param group The group to add to the session
   * @returns A new SessionModel instance with the added group
   */
  cloneWithAddedGroup(group: ExerciseGroupModel): SessionModel {
    return produce(this, (draft) => {
      draft.groups.push(group);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Creates a new session instance with a removed group.
   * @param groupId The ID of the group to remove
   * @returns A new SessionModel instance with the group removed
   */
  cloneWithRemovedGroup(groupId: string): SessionModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).groups = draft.groups.filter((g) => g.id !== groupId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Gets the estimated total duration for this session in seconds.
   * @returns Estimated duration based on all groups and exercises
   */
  getEstimatedDurationSeconds(): number {
    return this.groups.reduce((acc, group) => acc + group.getEstimatedDurationSeconds(), 0);
  }

  /**
   * Creates a new session instance with toggled deload status.
   * @returns A new SessionModel instance with inverted deload status
   */
  cloneWithToggledDeload(): SessionModel {
    return produce(this, (draft) => {
      draft.isDeload = !this.isDeload;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date(this.updatedAt.getTime() + 1);
    });
  }

  /**
   * Checks if this session has been executed before.
   * @returns True if execution count is greater than 0
   */
  hasBeenExecuted(): boolean {
    return this.executionCount > 0;
  }

  /**
   * Checks if this session is scheduled for a specific day.
   * @returns True if dayOfWeek is not null
   */
  hasScheduledDay(): boolean {
    return this.dayOfWeek !== null;
  }

  /**
   * Checks if this session has notes.
   * @returns True if notes are present
   */
  hasNotes(): boolean {
    return !!this.notes;
  }

  /**
   * Gets the session display name.
   * @returns The session name
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this SessionModel
   */
  clone(): this {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).groups = this.groups.map((g) => g.clone());
    }) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain WorkoutSessionData object
   */
  toPlainObject(): WorkoutSessionData {
    return {
      id: this.id,
      profileId: this.profileId,
      name: this.name,
      groupIds: this.groups.map((g) => g.id),
      notes: this.notes,
      executionCount: this.executionCount,
      isDeload: this.isDeload,
      dayOfWeek: this.dayOfWeek,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return workoutSessionSchema.safeParse(this.toPlainObject());
  }
}
