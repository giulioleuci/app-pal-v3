import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestUserSettingsData, createTestUserSettingsModel } from '@/test-factories';

import { UserSettingsModel } from '../domain/UserSettingsModel';
import { UserSettingsRepository } from './UserSettingsRepository';

describe('UserSettingsRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: UserSettingsRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new UserSettingsRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a UserSettingsModel to the database', async () => {
      // Arrange
      const settingsModel = createTestUserSettingsModel();

      // Act
      const result = await repository.save(settingsModel);

      // Assert
      expect(result).toBe(settingsModel);

      // Verify data was persisted
      const collection = testDb.get('user_settings');
      const savedRecord = await collection.find(settingsModel.id);
      expect(savedRecord).toBeDefined();

      // Check the _raw data since decorators might not work in tests
      expect(savedRecord.id).toBe(settingsModel.id);
      expect(savedRecord._raw.profile_id).toBe(settingsModel.profileId);
      expect(savedRecord._raw.theme_mode).toBe(settingsModel.themeMode);
      expect(savedRecord._raw.primary_color).toBe(settingsModel.primaryColor);
      expect(savedRecord._raw.unit_system).toBe(settingsModel.unitSystem);
      expect(savedRecord._raw.auto_start_rest_timer).toBe(settingsModel.autoStartRestTimer);
      expect(savedRecord._raw.dashboard_layout).toEqual(settingsModel.dashboardLayout);
      expect(savedRecord._raw.dashboard_visibility).toEqual(settingsModel.dashboardVisibility);
      expect(savedRecord._raw.lift_mappings).toEqual(settingsModel.liftMappings);
    });

    it('should update existing settings when saving with same id', async () => {
      // Arrange
      const originalData = createTestUserSettingsData({ themeMode: 'light' });

      // Create the record first using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('user_settings');
        await collection.create((record) => {
          record._raw.id = originalData.id;
          record._raw.profile_id = originalData.profileId;
          record._raw.theme_mode = originalData.themeMode;
          record._raw.primary_color = originalData.primaryColor;
          record._raw.secondary_color = originalData.secondaryColor;
          record._raw.unit_system = originalData.unitSystem;
          record._raw.bmi_formula = originalData.bmiFormula;
          record._raw.active_training_plan_id = originalData.activeTrainingPlanId;
          record._raw.auto_start_rest_timer = originalData.autoStartRestTimer;
          record._raw.auto_start_short_rest_timer = originalData.autoStartShortRestTimer;
          record._raw.lift_mappings = originalData.liftMappings;
          record._raw.dashboard_layout = originalData.dashboardLayout;
          record._raw.dashboard_visibility = originalData.dashboardVisibility;
          record._raw.created_at = originalData.createdAt.getTime();
          record._raw.updated_at = originalData.updatedAt.getTime();
        });
      });

      const updatedModel = UserSettingsModel.hydrate({ ...originalData, themeMode: 'dark' });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const collection = testDb.get('user_settings');
      const updatedRecord = await collection.find(originalData.id);
      expect(updatedRecord).toBeDefined();
      expect(updatedRecord._raw.theme_mode).toBe('dark');
      expect(updatedRecord.id).toBe(originalData.id);
    });
  });

  describe('findByProfileId', () => {
    it('should return a UserSettingsModel when settings exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const testData = createTestUserSettingsData({ profileId });

      // Create the record using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('user_settings');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.theme_mode = testData.themeMode;
          record._raw.primary_color = testData.primaryColor;
          record._raw.secondary_color = testData.secondaryColor;
          record._raw.unit_system = testData.unitSystem;
          record._raw.bmi_formula = testData.bmiFormula;
          record._raw.active_training_plan_id = testData.activeTrainingPlanId;
          record._raw.auto_start_rest_timer = testData.autoStartRestTimer;
          record._raw.auto_start_short_rest_timer = testData.autoStartShortRestTimer;
          record._raw.lift_mappings = testData.liftMappings;
          record._raw.dashboard_layout = testData.dashboardLayout;
          record._raw.dashboard_visibility = testData.dashboardVisibility;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Act
      const result = await repository.findByProfileId(profileId);

      // Assert
      expect(result).toBeInstanceOf(UserSettingsModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(profileId);
      expect(result!.themeMode).toBe(testData.themeMode);
      expect(result!.primaryColor).toBe(testData.primaryColor);
      expect(result!.secondaryColor).toBe(testData.secondaryColor);
      expect(result!.unitSystem).toBe(testData.unitSystem);
      expect(result!.bmiFormula).toBe(testData.bmiFormula);
      expect(result!.activeTrainingPlanId).toBe(testData.activeTrainingPlanId);
      expect(result!.autoStartRestTimer).toBe(testData.autoStartRestTimer);
      expect(result!.autoStartShortRestTimer).toBe(testData.autoStartShortRestTimer);
      expect(result!.liftMappings).toEqual(testData.liftMappings);
      expect(result!.dashboardLayout).toEqual(testData.dashboardLayout);
      expect(result!.dashboardVisibility).toEqual(testData.dashboardVisibility);
      expect(result!.createdAt).toEqual(testData.createdAt);
      expect(result!.updatedAt).toEqual(testData.updatedAt);
    });

    it('should return undefined when no settings exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile-id';

      // Act
      const result = await repository.findByProfileId(nonExistentProfileId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return correct settings when multiple profiles have settings', async () => {
      // Arrange
      const profileId1 = 'profile-1';
      const profileId2 = 'profile-2';
      const testData1 = createTestUserSettingsData({ profileId: profileId1, themeMode: 'light' });
      const testData2 = createTestUserSettingsData({ profileId: profileId2, themeMode: 'dark' });
      // Create both records using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('user_settings');

        // Create first record
        await collection.create((record) => {
          record._raw.id = testData1.id;
          record._raw.profile_id = testData1.profileId;
          record._raw.theme_mode = testData1.themeMode;
          record._raw.primary_color = testData1.primaryColor;
          record._raw.secondary_color = testData1.secondaryColor;
          record._raw.unit_system = testData1.unitSystem;
          record._raw.bmi_formula = testData1.bmiFormula;
          record._raw.active_training_plan_id = testData1.activeTrainingPlanId;
          record._raw.auto_start_rest_timer = testData1.autoStartRestTimer;
          record._raw.auto_start_short_rest_timer = testData1.autoStartShortRestTimer;
          record._raw.lift_mappings = testData1.liftMappings;
          record._raw.dashboard_layout = testData1.dashboardLayout;
          record._raw.dashboard_visibility = testData1.dashboardVisibility;
          record._raw.created_at = testData1.createdAt.getTime();
          record._raw.updated_at = testData1.updatedAt.getTime();
        });

        // Create second record
        await collection.create((record) => {
          record._raw.id = testData2.id;
          record._raw.profile_id = testData2.profileId;
          record._raw.theme_mode = testData2.themeMode;
          record._raw.primary_color = testData2.primaryColor;
          record._raw.secondary_color = testData2.secondaryColor;
          record._raw.unit_system = testData2.unitSystem;
          record._raw.bmi_formula = testData2.bmiFormula;
          record._raw.active_training_plan_id = testData2.activeTrainingPlanId;
          record._raw.auto_start_rest_timer = testData2.autoStartRestTimer;
          record._raw.auto_start_short_rest_timer = testData2.autoStartShortRestTimer;
          record._raw.lift_mappings = testData2.liftMappings;
          record._raw.dashboard_layout = testData2.dashboardLayout;
          record._raw.dashboard_visibility = testData2.dashboardVisibility;
          record._raw.created_at = testData2.createdAt.getTime();
          record._raw.updated_at = testData2.updatedAt.getTime();
        });
      });

      // Act
      const result1 = await repository.findByProfileId(profileId1);
      const result2 = await repository.findByProfileId(profileId2);

      // Assert
      expect(result1).toBeInstanceOf(UserSettingsModel);
      expect(result1!.profileId).toBe(profileId1);
      expect(result1!.themeMode).toBe('light');

      expect(result2).toBeInstanceOf(UserSettingsModel);
      expect(result2!.profileId).toBe(profileId2);
      expect(result2!.themeMode).toBe('dark');
    });
  });
});
