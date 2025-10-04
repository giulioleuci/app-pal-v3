import type { Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { date, field, relation } from '@nozbe/watermelondb/decorators';

import type { Profile } from './Profile';

/**
 * WatermelonDB model for WorkoutState entity.
 * Represents persisted workout state for session continuity.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class WorkoutState extends Model {
  static table = 'workout_states';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('state') state!: string; // JSON serialized state
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
}
