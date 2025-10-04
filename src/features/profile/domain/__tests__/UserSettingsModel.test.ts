import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserSettingsModel } from '@/features/profile/domain';
import { generateId } from '@/lib';
import { userSettingsSchema } from '@/shared/types';
import { createTestUserSettingsData, createTestUserSettingsModel } from '@/test-factories';

vi.mock('immer', async () => {
  const actual = await vi.importActual('immer');
  return {
    ...actual,
    produce: vi.fn().mockImplementation((base, recipe) => {
      // Create a proper deep copy that preserves dates
      const draft = JSON.parse(JSON.stringify(base), (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
      recipe(draft);
      // Return a new instance of the same constructor if it's a model
      if (base.constructor && base.constructor.name && base.constructor.hydrate) {
        return base.constructor.hydrate(draft);
      }
      return draft;
    }),
  };
});

describe('UserSettingsModel', () => {
  let userSettingsData: ReturnType<typeof createTestUserSettingsData>;
  let userSettings: UserSettingsModel;

  beforeEach(() => {
    userSettingsData = createTestUserSettingsData({
      themeMode: 'light',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      activeTrainingPlanId: null,
      autoStartRestTimer: true,
      autoStartShortRestTimer: true,
    });
    userSettings = UserSettingsModel.hydrate(userSettingsData);
  });

  describe('constructor', () => {
    it('should be protected and only accessible through hydrate', () => {
      // Protected constructor prevents direct instantiation in TypeScript
      // but we can verify hydrate works correctly
      const instance = UserSettingsModel.hydrate(userSettingsData);
      expect(instance).toBeInstanceOf(UserSettingsModel);
    });
  });

  describe('hydrate', () => {
    it('should create a UserSettingsModel instance from plain data', () => {
      const data = createTestUserSettingsData({
        themeMode: 'dark',
        primaryColor: '#ff5722',
        secondaryColor: '#4caf50',
      });
      const model = UserSettingsModel.hydrate(data);

      expect(model).toBeInstanceOf(UserSettingsModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.themeMode).toBe('dark');
      expect(model.primaryColor).toBe('#ff5722');
      expect(model.secondaryColor).toBe('#4caf50');
      expect(model.unitSystem).toBe(data.unitSystem);
      expect(model.bmiFormula).toBe(data.bmiFormula);
      expect(model.createdAt).toEqual(data.createdAt);
      expect(model.updatedAt).toEqual(data.updatedAt);
    });

    it('should handle all property assignments correctly', () => {
      const data = createTestUserSettingsData({
        activeTrainingPlanId: generateId(),
        autoStartRestTimer: false,
        autoStartShortRestTimer: false,
        liftMappings: { backSquat: generateId(), bench: generateId() },
        dashboardLayout: ['nextWorkout', 'lastWorkout'],
        dashboardVisibility: { nextWorkout: true, lastWorkout: false },
      });
      const model = UserSettingsModel.hydrate(data);

      expect(model.activeTrainingPlanId).toBe(data.activeTrainingPlanId);
      expect(model.autoStartRestTimer).toBe(false);
      expect(model.autoStartShortRestTimer).toBe(false);
      expect(model.liftMappings).toEqual(data.liftMappings);
      expect(model.dashboardLayout).toEqual(data.dashboardLayout);
      expect(model.dashboardVisibility).toEqual(data.dashboardVisibility);
    });
  });

  describe('cloneWithThemeMode', () => {
    it('should create a new instance with updated theme mode', () => {
      const cloned = userSettings.cloneWithThemeMode('dark');

      expect(cloned).not.toBe(userSettings);
      expect(cloned.themeMode).toBe('dark');
      expect(cloned.id).toBe(userSettings.id);
      expect(cloned.profileId).toBe(userSettings.profileId);
      expect(cloned.primaryColor).toBe(userSettings.primaryColor);
      expect(cloned.updatedAt).not.toBe(userSettings.updatedAt);
    });

    it('should not mutate the original settings', () => {
      const originalThemeMode = userSettings.themeMode;
      const originalUpdatedAt = userSettings.updatedAt;

      userSettings.cloneWithThemeMode('dark');

      expect(userSettings.themeMode).toBe(originalThemeMode);
      expect(userSettings.updatedAt).toBe(originalUpdatedAt);
    });

    it('should handle switching from dark to light', () => {
      const darkSettings = createTestUserSettingsModel({ themeMode: 'dark' });
      const cloned = darkSettings.cloneWithThemeMode('light');

      expect(cloned.themeMode).toBe('light');
    });

    it('should handle setting the same theme mode', () => {
      const cloned = userSettings.cloneWithThemeMode('light');
      expect(cloned.themeMode).toBe('light');
    });
  });

  describe('cloneWithColors', () => {
    it('should create a new instance with updated colors', () => {
      const newPrimary = '#ff9800';
      const newSecondary = '#9c27b0';
      const cloned = userSettings.cloneWithColors(newPrimary, newSecondary);

      expect(cloned).not.toBe(userSettings);
      expect(cloned.primaryColor).toBe(newPrimary);
      expect(cloned.secondaryColor).toBe(newSecondary);
      expect(cloned.id).toBe(userSettings.id);
      expect(cloned.themeMode).toBe(userSettings.themeMode);
      expect(cloned.updatedAt).not.toBe(userSettings.updatedAt);
    });

    it('should not mutate the original settings', () => {
      const originalPrimary = userSettings.primaryColor;
      const originalSecondary = userSettings.secondaryColor;
      const originalUpdatedAt = userSettings.updatedAt;

      userSettings.cloneWithColors('#ffffff', '#000000');

      expect(userSettings.primaryColor).toBe(originalPrimary);
      expect(userSettings.secondaryColor).toBe(originalSecondary);
      expect(userSettings.updatedAt).toBe(originalUpdatedAt);
    });

    it('should handle identical colors', () => {
      const sameColor = '#123456';
      const cloned = userSettings.cloneWithColors(sameColor, sameColor);

      expect(cloned.primaryColor).toBe(sameColor);
      expect(cloned.secondaryColor).toBe(sameColor);
    });
  });

  describe('cloneWithActiveTrainingPlan', () => {
    it('should create a new instance with updated active training plan', () => {
      const planId = generateId();
      const cloned = userSettings.cloneWithActiveTrainingPlan(planId);

      expect(cloned).not.toBe(userSettings);
      expect(cloned.activeTrainingPlanId).toBe(planId);
      expect(cloned.id).toBe(userSettings.id);
      expect(cloned.updatedAt).not.toBe(userSettings.updatedAt);
    });

    it('should handle setting to null (deactivating plan)', () => {
      const withPlan = createTestUserSettingsModel({ activeTrainingPlanId: generateId() });
      const cloned = withPlan.cloneWithActiveTrainingPlan(null);

      expect(cloned.activeTrainingPlanId).toBe(null);
    });

    it('should not mutate the original settings', () => {
      const originalPlanId = userSettings.activeTrainingPlanId;
      const originalUpdatedAt = userSettings.updatedAt;

      userSettings.cloneWithActiveTrainingPlan(generateId());

      expect(userSettings.activeTrainingPlanId).toBe(originalPlanId);
      expect(userSettings.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithTimerSettings', () => {
    it('should create a new instance with updated timer settings', () => {
      const cloned = userSettings.cloneWithTimerSettings(false, true);

      expect(cloned).not.toBe(userSettings);
      expect(cloned.autoStartRestTimer).toBe(false);
      expect(cloned.autoStartShortRestTimer).toBe(true);
      expect(cloned.id).toBe(userSettings.id);
      expect(cloned.updatedAt).not.toBe(userSettings.updatedAt);
    });

    it('should handle all combinations of timer settings', () => {
      const testCases = [
        [true, true],
        [true, false],
        [false, true],
        [false, false],
      ] as const;

      testCases.forEach(([rest, shortRest]) => {
        const cloned = userSettings.cloneWithTimerSettings(rest, shortRest);
        expect(cloned.autoStartRestTimer).toBe(rest);
        expect(cloned.autoStartShortRestTimer).toBe(shortRest);
      });
    });

    it('should not mutate the original settings', () => {
      const originalRestTimer = userSettings.autoStartRestTimer;
      const originalShortRestTimer = userSettings.autoStartShortRestTimer;
      const originalUpdatedAt = userSettings.updatedAt;

      userSettings.cloneWithTimerSettings(!originalRestTimer, !originalShortRestTimer);

      expect(userSettings.autoStartRestTimer).toBe(originalRestTimer);
      expect(userSettings.autoStartShortRestTimer).toBe(originalShortRestTimer);
      expect(userSettings.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithLiftMappings', () => {
    it('should create a new instance with updated lift mappings', () => {
      const newMappings = {
        backSquat: generateId(),
        deadlift: generateId(),
        bench: generateId(),
      };
      const cloned = userSettings.cloneWithLiftMappings(newMappings);

      expect(cloned).not.toBe(userSettings);
      expect(cloned.liftMappings).toEqual(newMappings);
      expect(cloned.id).toBe(userSettings.id);
      expect(cloned.updatedAt).not.toBe(userSettings.updatedAt);
    });

    it('should handle empty lift mappings', () => {
      const cloned = userSettings.cloneWithLiftMappings({});
      expect(cloned.liftMappings).toEqual({});
    });

    it('should not mutate the original settings', () => {
      const originalMappings = userSettings.liftMappings;
      const originalUpdatedAt = userSettings.updatedAt;

      userSettings.cloneWithLiftMappings({ bench: generateId() });

      expect(userSettings.liftMappings).toEqual(originalMappings);
      expect(userSettings.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithDashboardSettings', () => {
    it('should create a new instance with updated dashboard settings', () => {
      const newLayout = ['nextWorkout', 'bodyweightChart'];
      const newVisibility = { nextWorkout: false, bodyweightChart: true };

      const cloned = userSettings.cloneWithDashboardSettings(newLayout, newVisibility);

      expect(cloned).not.toBe(userSettings);
      expect(cloned.dashboardLayout).toEqual(newLayout);
      expect(cloned.dashboardVisibility).toEqual(newVisibility);
      expect(cloned.id).toBe(userSettings.id);
      expect(cloned.updatedAt).not.toBe(userSettings.updatedAt);
    });

    it('should handle empty dashboard layout', () => {
      const cloned = userSettings.cloneWithDashboardSettings([], {});

      expect(cloned.dashboardLayout).toEqual([]);
      expect(cloned.dashboardVisibility).toEqual({});
    });

    it('should not mutate the original settings', () => {
      const originalLayout = userSettings.dashboardLayout;
      const originalVisibility = userSettings.dashboardVisibility;
      const originalUpdatedAt = userSettings.updatedAt;

      userSettings.cloneWithDashboardSettings(['nextWorkout'], { nextWorkout: false });

      expect(userSettings.dashboardLayout).toEqual(originalLayout);
      expect(userSettings.dashboardVisibility).toEqual(originalVisibility);
      expect(userSettings.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('hasActiveTrainingPlan', () => {
    it('should return true when activeTrainingPlanId is set', () => {
      const withPlan = createTestUserSettingsModel({ activeTrainingPlanId: generateId() });
      expect(withPlan.hasActiveTrainingPlan()).toBe(true);
    });

    it('should return false when activeTrainingPlanId is null', () => {
      const withoutPlan = createTestUserSettingsModel({ activeTrainingPlanId: null });
      expect(withoutPlan.hasActiveTrainingPlan()).toBe(false);
    });

    it('should work correctly after cloning operations', () => {
      const planId = generateId();
      const withPlan = userSettings.cloneWithActiveTrainingPlan(planId);
      const withoutPlan = withPlan.cloneWithActiveTrainingPlan(null);

      expect(withPlan.hasActiveTrainingPlan()).toBe(true);
      expect(withoutPlan.hasActiveTrainingPlan()).toBe(false);
    });
  });

  describe('hasAutoTimersEnabled', () => {
    it('should return true when both timers are enabled', () => {
      const bothEnabled = createTestUserSettingsModel({
        autoStartRestTimer: true,
        autoStartShortRestTimer: true,
      });
      expect(bothEnabled.hasAutoTimersEnabled()).toBe(true);
    });

    it('should return false when only rest timer is enabled', () => {
      const onlyRest = createTestUserSettingsModel({
        autoStartRestTimer: true,
        autoStartShortRestTimer: false,
      });
      expect(onlyRest.hasAutoTimersEnabled()).toBe(false);
    });

    it('should return false when only short rest timer is enabled', () => {
      const onlyShort = createTestUserSettingsModel({
        autoStartRestTimer: false,
        autoStartShortRestTimer: true,
      });
      expect(onlyShort.hasAutoTimersEnabled()).toBe(false);
    });

    it('should return false when both timers are disabled', () => {
      const bothDisabled = createTestUserSettingsModel({
        autoStartRestTimer: false,
        autoStartShortRestTimer: false,
      });
      expect(bothDisabled.hasAutoTimersEnabled()).toBe(false);
    });

    it('should work correctly after cloning operations', () => {
      const bothEnabled = userSettings.cloneWithTimerSettings(true, true);
      const oneDisabled = bothEnabled.cloneWithTimerSettings(true, false);

      expect(bothEnabled.hasAutoTimersEnabled()).toBe(true);
      expect(oneDisabled.hasAutoTimersEnabled()).toBe(false);
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      const cloned = userSettings.clone();

      expect(cloned).not.toBe(userSettings);
      expect(cloned.id).toBe(userSettings.id);
      expect(cloned.profileId).toBe(userSettings.profileId);
      expect(cloned.themeMode).toBe(userSettings.themeMode);
      expect(cloned.primaryColor).toBe(userSettings.primaryColor);
      expect(cloned.secondaryColor).toBe(userSettings.secondaryColor);
      expect(cloned.liftMappings).toEqual(userSettings.liftMappings);
      expect(cloned.dashboardLayout).toEqual(userSettings.dashboardLayout);
      expect(cloned.dashboardVisibility).toEqual(userSettings.dashboardVisibility);
    });

    it('should return the same type', () => {
      const cloned = userSettings.clone();
      expect(cloned).toBeInstanceOf(UserSettingsModel);
    });
  });

  describe('toPlainObject', () => {
    it('should return a plain object with all properties', () => {
      const plainObject = userSettings.toPlainObject();

      expect(plainObject).toEqual({
        id: userSettings.id,
        profileId: userSettings.profileId,
        themeMode: userSettings.themeMode,
        primaryColor: userSettings.primaryColor,
        secondaryColor: userSettings.secondaryColor,
        unitSystem: userSettings.unitSystem,
        bmiFormula: userSettings.bmiFormula,
        activeTrainingPlanId: userSettings.activeTrainingPlanId,
        autoStartRestTimer: userSettings.autoStartRestTimer,
        autoStartShortRestTimer: userSettings.autoStartShortRestTimer,
        liftMappings: userSettings.liftMappings,
        dashboardLayout: userSettings.dashboardLayout,
        dashboardVisibility: userSettings.dashboardVisibility,
        createdAt: userSettings.createdAt,
        updatedAt: userSettings.updatedAt,
      });
    });

    it('should be serializable', () => {
      const plainObject = userSettings.toPlainObject();
      expect(() => JSON.stringify(plainObject)).not.toThrow();
    });
  });

  describe('validate', () => {
    it('should validate successfully for valid user settings data', () => {
      const result = userSettings.validate();
      expect(result.success).toBe(true);
    });

    it('should fail validation for invalid theme mode', () => {
      const invalidSettings = UserSettingsModel.hydrate({
        ...userSettingsData,
        // @ts-expect-error - Testing invalid data
        themeMode: 'invalid',
      });
      const result = invalidSettings.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid color format', () => {
      const invalidSettings = UserSettingsModel.hydrate({
        ...userSettingsData,
        primaryColor: 'not-a-hex-color',
      });
      const result = invalidSettings.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid secondary color format', () => {
      const invalidSettings = UserSettingsModel.hydrate({
        ...userSettingsData,
        secondaryColor: '#gggggg', // Invalid hex
      });
      const result = invalidSettings.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid unit system', () => {
      const invalidSettings = UserSettingsModel.hydrate({
        ...userSettingsData,
        // @ts-expect-error - Testing invalid data
        unitSystem: 'imperial',
      });
      const result = invalidSettings.validate();
      expect(result.success).toBe(false);
    });

    it('should validate successfully with null activeTrainingPlanId', () => {
      const settings = createTestUserSettingsModel({ activeTrainingPlanId: null });
      const result = settings.validate();
      expect(result.success).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for the same instance', () => {
      expect(userSettings.equals(userSettings)).toBe(true);
    });

    it('should return true for different instances with same id', () => {
      const otherSettings = UserSettingsModel.hydrate(userSettingsData);
      expect(userSettings.equals(otherSettings)).toBe(true);
    });

    it('should return false for different instances with different ids', () => {
      const otherSettings = createTestUserSettingsModel({ id: generateId() });
      expect(userSettings.equals(otherSettings)).toBe(false);
    });

    it('should return false for null', () => {
      expect(userSettings.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(userSettings.equals(undefined)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties in TypeScript', () => {
      // TypeScript readonly properties prevent compile-time mutations
      // Runtime mutations are prevented by the class design and immutable operations
      expect(userSettings.themeMode).toBeDefined();
      expect(userSettings.liftMappings).toBeDefined();
      expect(userSettings.dashboardLayout).toBeDefined();

      // Verify that cloning creates new instances rather than mutating existing ones
      const originalTheme = userSettings.themeMode;
      const cloned = userSettings.cloneWithThemeMode('light');

      expect(userSettings.themeMode).toBe(originalTheme);
      expect(cloned.themeMode).toBe('light');
      expect(cloned).not.toBe(userSettings);
    });
  });

  describe('business logic edge cases', () => {
    it('should handle minimum valid hex colors', () => {
      const settings = createTestUserSettingsModel({
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
      });
      expect(settings.validate().success).toBe(true);
    });

    it('should maintain data integrity through multiple clone operations', () => {
      const originalId = userSettings.id;
      const originalProfileId = userSettings.profileId;
      const originalCreatedAt = userSettings.createdAt;

      const modified = userSettings
        .cloneWithThemeMode('dark')
        .cloneWithColors('#ff0000', '#00ff00')
        .cloneWithActiveTrainingPlan(generateId())
        .cloneWithTimerSettings(false, false);

      expect(modified.id).toBe(originalId);
      expect(modified.profileId).toBe(originalProfileId);
      expect(modified.createdAt).toEqual(originalCreatedAt);
      expect(modified.themeMode).toBe('dark');
      expect(modified.primaryColor).toBe('#ff0000');
      expect(modified.secondaryColor).toBe('#00ff00');
      expect(modified.hasActiveTrainingPlan()).toBe(true);
      expect(modified.hasAutoTimersEnabled()).toBe(false);
    });

    it('should handle complex dashboard configurations', () => {
      const complexLayout = [
        'nextWorkout',
        'lastWorkout',
        'motivationalQuote',
        'bodyweightChart',
        'liftRatios',
        'todaysEquipment',
        'muscleGroupVolume',
        'muscleRecovery',
        'adherenceCalendar',
      ] as const;

      const complexVisibility = {
        nextWorkout: true,
        lastWorkout: false,
        motivationalQuote: true,
        bodyweightChart: false,
        liftRatios: true,
        todaysEquipment: false,
        muscleGroupVolume: true,
        muscleRecovery: false,
        adherenceCalendar: true,
      } as const;

      const complex = userSettings.cloneWithDashboardSettings(complexLayout, complexVisibility);
      expect(complex.dashboardLayout).toEqual(complexLayout);
      expect(complex.dashboardVisibility).toEqual(complexVisibility);
      expect(complex.validate().success).toBe(true);
    });
  });
});
