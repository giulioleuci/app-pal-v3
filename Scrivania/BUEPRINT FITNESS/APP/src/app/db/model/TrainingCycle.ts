import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, relation } from '@nozbe/watermelondb/decorators';

import type { Profile } from './Profile';
import type { TrainingPlan } from './TrainingPlan';

/**
 * WatermelonDB model for TrainingCycle entity.
 * Represents a training cycle with specific goals and timeframe.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class TrainingCycle extends Model {
  static table = 'training_cycles';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    training_plans: { type: 'has_many', foreignKey: 'cycle_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('name') name!: string;
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date;
  @field('goal') goal!: string;
  @field('notes') notes!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;

  // One-to-many relationships
  @children('training_plans') trainingPlans!: Query<TrainingPlan>;
}
