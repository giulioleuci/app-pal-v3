import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, relation } from '@nozbe/watermelondb/decorators';

import type { Profile } from './Profile';
import type { TrainingCycle } from './TrainingCycle';
import type { WorkoutLog } from './WorkoutLog';
import type { WorkoutSession } from './WorkoutSession';

/**
 * WatermelonDB model for TrainingPlan entity.
 * Represents a complete training plan with multiple sessions.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class TrainingPlan extends Model {
  static table = 'training_plans';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    training_cycles: { type: 'belongs_to', key: 'cycle_id' },
    workout_sessions: { type: 'has_many', foreignKey: 'training_plan_id' },
    workout_logs: { type: 'has_many', foreignKey: 'training_plan_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('is_archived') isArchived!: boolean;
  @field('current_session_index') currentSessionIndex!: number;
  @field('notes') notes?: string;
  @field('cycle_id') cycleId?: string;
  @field('order') order?: number;
  @date('last_used') lastUsed?: Date;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
  @relation('training_cycles', 'cycle_id') cycle!: Relation<TrainingCycle>;

  // One-to-many relationships
  @children('workout_sessions') workoutSessions!: Query<WorkoutSession>;
  @children('workout_logs') workoutLogs!: Query<WorkoutLog>;
}
