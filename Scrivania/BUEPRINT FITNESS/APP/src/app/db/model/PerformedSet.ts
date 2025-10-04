import { Model } from '@nozbe/watermelondb';
import { field, json, relation } from '@nozbe/watermelondb/decorators';

/**
 * WatermelonDB model for PerformedSet entity.
 * Represents an individual set performed during a workout.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class PerformedSet extends Model {
  static table = 'performed_sets';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    performed_exercise_logs: { type: 'belongs_to', key: 'performed_exercise_log_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('performed_exercise_log_id') performedExerciseLogId!: string;
  @field('counter_type') counterType!: string;
  @field('counts') counts!: number;
  @field('weight') weight!: number;
  @field('completed') completed!: boolean;
  @field('notes') notes!: string;
  @field('rpe') rpe!: number;
  @field('percentage') percentage!: number;
  @json('planned_load', (json) => json) plannedLoad!: {
    min: number;
    max?: number;
    direction: 'asc' | 'desc';
  };
  @json('planned_rpe', (json) => json) plannedRpe!: {
    min: number;
    max?: number;
    direction: 'asc' | 'desc';
  };
  @json('planned_counts', (json) => json) plannedCounts!: {
    min: number;
    max?: number;
    direction: 'asc' | 'desc';
  };

  // Sub-set tracking fields (v3 schema additions)
  @json('sub_sets', (json) => json) subSets!: Array<{
    weight?: number;
    counts: number;
    restSeconds?: number;
    dropNumber?: number;
  }>;
  @field('execution_type') executionType!:
    | 'standard'
    | 'drop'
    | 'myoReps'
    | 'pyramidal'
    | 'restPause'
    | 'mav';
  @json('is_sub_set_completed', (json) => json) isSubSetCompleted!: boolean[];

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile;
  @relation('performed_exercise_logs', 'performed_exercise_log_id') performedExerciseLog;
}
