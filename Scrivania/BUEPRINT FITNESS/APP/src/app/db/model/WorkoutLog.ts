import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, relation } from '@nozbe/watermelondb/decorators';

import type { PerformedGroup } from './PerformedGroup';
import type { Profile } from './Profile';
import type { TrainingPlan } from './TrainingPlan';
import type { WorkoutSession } from './WorkoutSession';

/**
 * WatermelonDB model for WorkoutLog entity.
 * Represents a completed workout session with its performance data.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class WorkoutLog extends Model {
  static table = 'workout_logs';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    training_plans: { type: 'belongs_to', key: 'training_plan_id' },
    workout_sessions: { type: 'belongs_to', key: 'session_id' },
    performed_groups: { type: 'has_many', foreignKey: 'workout_log_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('training_plan_id') trainingPlanId!: string;
  @field('training_plan_name') trainingPlanName!: string;
  @field('session_id') sessionId!: string;
  @field('session_name') sessionName!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @field('duration_seconds') durationSeconds!: number;
  @field('total_volume') totalVolume!: number;
  @field('notes') notes!: string;
  @field('user_rating') userRating!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
  @relation('training_plans', 'training_plan_id') trainingPlan!: Relation<TrainingPlan>;
  @relation('workout_sessions', 'session_id') session!: Relation<WorkoutSession>;

  // One-to-many relationships
  @children('performed_groups') performedGroups!: Query<PerformedGroup>;
}
