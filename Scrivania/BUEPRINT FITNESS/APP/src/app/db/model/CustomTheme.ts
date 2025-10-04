import type { Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

import type { Profile } from './Profile';

/**
 * WatermelonDB model for CustomTheme entity.
 * Represents user-defined theme configurations.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class CustomTheme extends Model {
  static table = 'custom_themes';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('name') name!: string;
  @field('mode') mode!: string;
  @field('primary_color') primaryColor!: string;
  @field('secondary_color') secondaryColor!: string;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
}
