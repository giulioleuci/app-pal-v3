import type { Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { date, field, relation } from '@nozbe/watermelondb/decorators';

import type { Profile } from './Profile';

/**
 * WatermelonDB model for HeightRecord entity.
 * Represents a height measurement record for body metrics tracking.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class HeightRecord extends Model {
  static table = 'height_records';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @date('date') date!: Date;
  @field('height') height!: number;
  @field('notes') notes!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
}
