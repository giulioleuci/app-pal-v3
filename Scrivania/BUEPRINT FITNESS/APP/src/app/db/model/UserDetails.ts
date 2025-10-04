import type { Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { date, field, relation } from '@nozbe/watermelondb/decorators';

import type { Profile } from './Profile';

/**
 * WatermelonDB model for UserDetails entity.
 * Represents personal details and information about the user.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class UserDetails extends Model {
  static table = 'user_details';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('full_name') fullName!: string;
  @field('biological_sex') biologicalSex!: string;
  @date('date_of_birth') dateOfBirth!: Date;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
}
