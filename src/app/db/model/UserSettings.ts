import type { Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { date, field, json, relation } from '@nozbe/watermelondb/decorators';

import type { Profile } from './Profile';

/**
 * WatermelonDB model for UserSettings entity.
 * Represents user-specific settings and preferences.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class UserSettings extends Model {
  static table = 'user_settings';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('theme_mode') themeMode!: string;
  @field('primary_color') primaryColor!: string;
  @field('secondary_color') secondaryColor!: string;
  @field('unit_system') unitSystem!: string;
  @field('bmi_formula') bmiFormula!: string;
  @field('active_training_plan_id') activeTrainingPlanId!: string;
  @field('auto_start_rest_timer') autoStartRestTimer!: boolean;
  @field('auto_start_short_rest_timer') autoStartShortRestTimer!: boolean;
  @json('lift_mappings', (json) => json) liftMappings!: Record<string, string>;
  @json('dashboard_layout', (json) => json) dashboardLayout!: string[];
  @json('dashboard_visibility', (json) => json) dashboardVisibility!: Record<string, boolean>;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
}
