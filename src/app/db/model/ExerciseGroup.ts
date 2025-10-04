import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, json, relation } from '@nozbe/watermelondb/decorators';

import type { AppliedExercise } from './AppliedExercise';
import type { PerformedGroup } from './PerformedGroup';
import type { Profile } from './Profile';
import type { WorkoutSession } from './WorkoutSession';

/**
 * WatermelonDB model for ExerciseGroup entity.
 * Represents a group of exercises (single, superset, circuit, etc.) within a workout session.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class ExerciseGroup extends Model {
  static table = 'exercise_groups';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    workout_sessions: { type: 'belongs_to', key: 'workout_session_id' },
    applied_exercises: { type: 'has_many', foreignKey: 'exercise_group_id' },
    performed_groups: { type: 'has_many', foreignKey: 'planned_group_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('workout_session_id') workoutSessionId!: string;
  @field('type') type!: string;
  @json('rounds', (json) => json) rounds!: { min: number; max?: number; direction: 'asc' | 'desc' };
  @field('duration_minutes') durationMinutes!: number;
  @field('rest_time_seconds') restTimeSeconds!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
  @relation('workout_sessions', 'workout_session_id') workoutSession!: Relation<WorkoutSession>;

  // One-to-many relationships
  @children('applied_exercises') appliedExercises!: Query<AppliedExercise>;
  @children('performed_groups') performedGroups!: Query<PerformedGroup>;
}
