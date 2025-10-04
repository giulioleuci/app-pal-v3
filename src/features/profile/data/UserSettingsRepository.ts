import { Database, Q } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { UserSettings } from '@/app/db/model/UserSettings';
import { UserSettingsData } from '@/shared/types';

import { IUserSettingsRepository } from '../domain/IUserSettingsRepository';
import { UserSettingsModel } from '../domain/UserSettingsModel';

/**
 * Concrete implementation of IUserSettingsRepository using WatermelonDB.
 * Handles persistence and retrieval of UserSettings domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class UserSettingsRepository implements IUserSettingsRepository {
  private readonly database: Database;

  /**
   * Creates a new UserSettingsRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists a UserSettingsModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param settings The UserSettingsModel instance to save
   * @returns Promise resolving to the saved UserSettingsModel
   */
  async save(settings: UserSettingsModel): Promise<UserSettingsModel> {
    const plainData = settings.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<UserSettings>('user_settings');

      // Try to find existing record
      try {
        const existing = await collection.find(settings.id);
        await existing.update((record) => {
          record._raw.profile_id = plainData.profileId;
          record._raw.theme_mode = plainData.themeMode;
          record._raw.primary_color = plainData.primaryColor;
          record._raw.secondary_color = plainData.secondaryColor;
          record._raw.unit_system = plainData.unitSystem;
          record._raw.bmi_formula = plainData.bmiFormula;
          record._raw.active_training_plan_id = plainData.activeTrainingPlanId;
          record._raw.auto_start_rest_timer = plainData.autoStartRestTimer;
          record._raw.auto_start_short_rest_timer = plainData.autoStartShortRestTimer;
          record._raw.lift_mappings = plainData.liftMappings;
          record._raw.dashboard_layout = plainData.dashboardLayout;
          record._raw.dashboard_visibility = plainData.dashboardVisibility;
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          record._raw.id = plainData.id;
          record._raw.profile_id = plainData.profileId;
          record._raw.theme_mode = plainData.themeMode;
          record._raw.primary_color = plainData.primaryColor;
          record._raw.secondary_color = plainData.secondaryColor;
          record._raw.unit_system = plainData.unitSystem;
          record._raw.bmi_formula = plainData.bmiFormula;
          record._raw.active_training_plan_id = plainData.activeTrainingPlanId;
          record._raw.auto_start_rest_timer = plainData.autoStartRestTimer;
          record._raw.auto_start_short_rest_timer = plainData.autoStartShortRestTimer;
          record._raw.lift_mappings = plainData.liftMappings;
          record._raw.dashboard_layout = plainData.dashboardLayout;
          record._raw.dashboard_visibility = plainData.dashboardVisibility;
          record._raw.created_at = plainData.createdAt.getTime();
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return settings;
  }

  /**
   * Retrieves user settings by profile ID and hydrates it into a UserSettingsModel
   * using the model's static hydrate method.
   * @param profileId The profile ID to find settings for
   * @returns Promise resolving to UserSettingsModel if found, undefined otherwise
   */
  async findByProfileId(profileId: string): Promise<UserSettingsModel | undefined> {
    try {
      const collection = this.database.get<UserSettings>('user_settings');
      const records = await collection.query(Q.where('profile_id', profileId)).fetch();

      if (records.length === 0) {
        return undefined;
      }

      const record = records[0];
      const plainData: UserSettingsData = {
        id: record.id,
        profileId: record._raw.profile_id,
        themeMode: record._raw.theme_mode,
        primaryColor: record._raw.primary_color,
        secondaryColor: record._raw.secondary_color,
        unitSystem: record._raw.unit_system,
        bmiFormula: record._raw.bmi_formula,
        activeTrainingPlanId: record._raw.active_training_plan_id,
        autoStartRestTimer: record._raw.auto_start_rest_timer,
        autoStartShortRestTimer: record._raw.auto_start_short_rest_timer,
        liftMappings: record._raw.lift_mappings,
        dashboardLayout: record._raw.dashboard_layout,
        dashboardVisibility: record._raw.dashboard_visibility,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return UserSettingsModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }
}
