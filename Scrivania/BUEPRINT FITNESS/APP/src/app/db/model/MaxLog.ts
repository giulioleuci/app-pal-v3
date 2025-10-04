import type { Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { date, field, relation } from '@nozbe/watermelondb/decorators';

import type { Exercise } from './Exercise';
import type { Profile } from './Profile';

/**
 * WatermelonDB model for MaxLog entity.
 * Represents a maximum lift record for strength tracking.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class MaxLog extends Model {
  static table = 'max_logs';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    exercises: { type: 'belongs_to', key: 'exercise_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('weight_entered_by_user') weightEnteredByUser!: number;
  @date('date') date!: Date;
  @field('reps') reps!: number;
  @field('notes') notes!: string;
  @field('estimated_1rm') estimated1RM!: number;
  @field('max_brzycki') maxBrzycki!: number;
  @field('max_baechle') maxBaechle!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
  @relation('exercises', 'exercise_id') exercise!: Relation<Exercise>;
}
