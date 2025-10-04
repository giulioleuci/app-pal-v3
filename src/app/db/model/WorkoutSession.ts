import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, relation } from '@nozbe/watermelondb/decorators';

import type { ExerciseGroup } from './ExerciseGroup';
import type { Profile } from './Profile';
import type { TrainingPlan } from './TrainingPlan';
import type { WorkoutLog } from './WorkoutLog';

/**
 * WatermelonDB model for WorkoutSession entity.
 * Represents an individual workout session within a training plan.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class WorkoutSession extends Model {
  static table = 'workout_sessions';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    training_plans: { type: 'belongs_to', key: 'training_plan_id' },
    exercise_groups: { type: 'has_many', foreignKey: 'workout_session_id' },
    workout_logs: { type: 'has_many', foreignKey: 'session_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('training_plan_id') trainingPlanId!: string;
  @field('name') name!: string;
  @field('notes') notes!: string;
  @field('execution_count') executionCount!: number;
  @field('is_deload') isDeload!: boolean;
  @field('day_of_week') dayOfWeek!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
  @relation('training_plans', 'training_plan_id') trainingPlan!: Relation<TrainingPlan>;

  // One-to-many relationships
  @children('exercise_groups') exerciseGroups!: Query<ExerciseGroup>;
  @children('workout_logs') workoutLogs!: Query<WorkoutLog>;
}
