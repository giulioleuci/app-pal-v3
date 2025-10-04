import type { Query } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, field, relation } from '@nozbe/watermelondb/decorators';

import type { ExerciseGroup } from './ExerciseGroup';
import type { PerformedExerciseLog } from './PerformedExerciseLog';
import type { Profile } from './Profile';
import type { WorkoutLog } from './WorkoutLog';

/**
 * WatermelonDB model for PerformedGroup entity.
 * Represents a group of exercises actually performed during a workout.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class PerformedGroup extends Model {
  static table = 'performed_groups';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    workout_logs: { type: 'belongs_to', key: 'workout_log_id' },
    exercise_groups: { type: 'belongs_to', key: 'planned_group_id' },
    performed_exercise_logs: { type: 'has_many', foreignKey: 'performed_group_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('workout_log_id') workoutLogId!: string;
  @field('planned_group_id') plannedGroupId!: string;
  @field('type') type!: string;
  @field('actual_rest_seconds') actualRestSeconds!: number;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Profile;
  @relation('workout_logs', 'workout_log_id') workoutLog!: WorkoutLog;
  @relation('exercise_groups', 'planned_group_id') plannedGroup!: ExerciseGroup;

  // One-to-many relationships
  @children('performed_exercise_logs') performedExerciseLogs!: Query<PerformedExerciseLog>;
}
