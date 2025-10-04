import { subDays } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileModel } from '@/features/profile/domain';
import { generateId } from '@/lib';
import { createTestProfileData, createTestProfileModel } from '@/test-factories';

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

describe('ProfileModel', () => {
  let profileData: ReturnType<typeof createTestProfileData>;
  let profile: ProfileModel;

  beforeEach(() => {
    profileData = createTestProfileData({
      name: 'John Doe',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    });
    profile = ProfileModel.hydrate(profileData);
  });

  describe('constructor', () => {
    it('should be protected and only accessible through hydrate', () => {
      // Protected constructor prevents direct instantiation in TypeScript
      // but we can verify hydrate works correctly
      const instance = ProfileModel.hydrate(profileData);
      expect(instance).toBeInstanceOf(ProfileModel);
    });
  });

  describe('hydrate', () => {
    it('should create a ProfileModel instance from plain data', () => {
      const data = createTestProfileData({ name: 'Jane Smith' });
      const model = ProfileModel.hydrate(data);

      expect(model).toBeInstanceOf(ProfileModel);
      expect(model.id).toBe(data.id);
      expect(model.name).toBe('Jane Smith');
      expect(model.createdAt).toEqual(data.createdAt);
      expect(model.updatedAt).toEqual(data.updatedAt);
      expect(model.isActive).toBe(true);
    });

    it('should handle minimal required data', () => {
      const minimalData = createTestProfileData({ name: 'A' });
      const model = ProfileModel.hydrate(minimalData);

      expect(model.name).toBe('A');
      expect(model.isActive).toBe(true);
    });
  });

  describe('cloneWithNewName', () => {
    it('should create a new instance with updated name', () => {
      const newName = 'Jane Smith';
      const cloned = profile.cloneWithNewName(newName);

      expect(cloned).not.toBe(profile);
      expect(cloned.name).toBe(newName);
      expect(cloned.id).toBe(profile.id);
      expect(cloned.createdAt).toEqual(profile.createdAt);
      expect(cloned.updatedAt).not.toBe(profile.updatedAt);
    });

    it('should not mutate the original profile', () => {
      const originalName = profile.name;
      const originalUpdatedAt = profile.updatedAt;

      profile.cloneWithNewName('New Name');

      expect(profile.name).toBe(originalName);
      expect(profile.updatedAt).toBe(originalUpdatedAt);
    });

    it('should handle empty string name', () => {
      const cloned = profile.cloneWithNewName('');
      expect(cloned.name).toBe('');
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(1000);
      const cloned = profile.cloneWithNewName(longName);
      expect(cloned.name).toBe(longName);
    });
  });

  describe('getDisplayName', () => {
    it('should return the profile name', () => {
      expect(profile.getDisplayName()).toBe(profile.name);
    });

    it('should return empty string if name is empty', () => {
      const emptyNameProfile = createTestProfileModel({ name: '' });
      expect(emptyNameProfile.getDisplayName()).toBe('');
    });
  });

  describe('cloneAsDeactivated', () => {
    it('should create a new instance marked as inactive', () => {
      const cloned = profile.cloneAsDeactivated();

      expect(cloned).not.toBe(profile);
      expect(cloned.isActive).toBe(false);
      expect(cloned.id).toBe(profile.id);
      expect(cloned.name).toBe(profile.name);
      expect(cloned.createdAt).toEqual(profile.createdAt);
      expect(cloned.updatedAt).not.toBe(profile.updatedAt);
    });

    it('should not mutate the original profile', () => {
      const originalIsActive = profile.isActive;
      const originalUpdatedAt = profile.updatedAt;

      profile.cloneAsDeactivated();

      expect(profile.isActive).toBe(originalIsActive);
      expect(profile.updatedAt).toBe(originalUpdatedAt);
    });

    it('should work on already deactivated profile', () => {
      const deactivated = profile.cloneAsDeactivated();
      const doubleDeactivated = deactivated.cloneAsDeactivated();

      expect(doubleDeactivated.isActive).toBe(false);
    });
  });

  describe('cloneAsReactivated', () => {
    it('should create a new instance marked as active', () => {
      const deactivated = profile.cloneAsDeactivated();
      const reactivated = deactivated.cloneAsReactivated();

      expect(reactivated).not.toBe(deactivated);
      expect(reactivated.isActive).toBe(true);
      expect(reactivated.id).toBe(deactivated.id);
      expect(reactivated.name).toBe(deactivated.name);
      expect(reactivated.createdAt).toEqual(deactivated.createdAt);
      expect(reactivated.updatedAt).not.toBe(deactivated.updatedAt);
    });

    it('should not mutate the original profile', () => {
      const deactivated = profile.cloneAsDeactivated();
      const originalIsActive = deactivated.isActive;
      const originalUpdatedAt = deactivated.updatedAt;

      deactivated.cloneAsReactivated();

      expect(deactivated.isActive).toBe(originalIsActive);
      expect(deactivated.updatedAt).toBe(originalUpdatedAt);
    });

    it('should work on already active profile', () => {
      const reactivated = profile.cloneAsReactivated();

      expect(reactivated.isActive).toBe(true);
    });
  });

  describe('isNew', () => {
    it('should return true for profiles created today', () => {
      const todayProfile = createTestProfileModel({ createdAt: new Date() });
      expect(todayProfile.isNew()).toBe(true);
    });

    it('should return true for profiles created yesterday with default 1 day', () => {
      const yesterdayProfile = createTestProfileModel({
        createdAt: subDays(new Date(), 1),
      });
      expect(yesterdayProfile.isNew()).toBe(true);
    });

    it('should return false for profiles created 2 days ago with default 1 day', () => {
      const oldProfile = createTestProfileModel({
        createdAt: subDays(new Date(), 2),
      });
      expect(oldProfile.isNew()).toBe(false);
    });

    it('should accept custom days parameter', () => {
      const threeDaysAgoProfile = createTestProfileModel({
        createdAt: subDays(new Date(), 3),
      });
      expect(threeDaysAgoProfile.isNew(5)).toBe(true);
      expect(threeDaysAgoProfile.isNew(2)).toBe(false);
    });

    it('should handle zero days parameter', () => {
      const todayProfile = createTestProfileModel({ createdAt: new Date() });
      expect(todayProfile.isNew(0)).toBe(true);
    });

    it('should handle profiles created in future (edge case)', () => {
      const futureProfile = createTestProfileModel({
        createdAt: new Date(Date.now() + 86400000), // 1 day in future
      });
      expect(futureProfile.isNew()).toBe(false);
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      const cloned = profile.clone();

      expect(cloned).not.toBe(profile);
      expect(cloned.id).toBe(profile.id);
      expect(cloned.name).toBe(profile.name);
      expect(cloned.isActive).toBe(profile.isActive);
      expect(cloned.createdAt).toEqual(profile.createdAt);
      expect(cloned.updatedAt).toEqual(profile.updatedAt);
    });

    it('should return the same type', () => {
      const cloned = profile.clone();
      expect(cloned).toBeInstanceOf(ProfileModel);
    });
  });

  describe('toPlainObject', () => {
    it('should return a plain object with all properties', () => {
      const plainObject = profile.toPlainObject();

      expect(plainObject).toEqual({
        id: profile.id,
        name: profile.name,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
    });

    it('should not include isActive property (readonly domain property)', () => {
      const plainObject = profile.toPlainObject();
      expect('isActive' in plainObject).toBe(false);
    });

    it('should be serializable', () => {
      const plainObject = profile.toPlainObject();
      expect(() => JSON.stringify(plainObject)).not.toThrow();
    });
  });

  describe('validate', () => {
    it('should validate successfully for valid profile data', () => {
      const result = profile.validate();
      expect(result.success).toBe(true);
    });

    it('should fail validation for empty name', () => {
      const invalidProfile = createTestProfileModel({ name: '' });
      const result = invalidProfile.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid id format', () => {
      const invalidProfile = ProfileModel.hydrate({
        ...profileData,
        id: 'not-a-uuid',
      });
      const result = invalidProfile.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for missing required fields', () => {
      const invalidProfile = ProfileModel.hydrate({
        ...profileData,
        // @ts-expect-error - Testing invalid data
        name: undefined,
      });
      const result = invalidProfile.validate();
      expect(result.success).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for the same instance', () => {
      expect(profile.equals(profile)).toBe(true);
    });

    it('should return true for different instances with same id', () => {
      const otherProfile = ProfileModel.hydrate(profileData);
      expect(profile.equals(otherProfile)).toBe(true);
    });

    it('should return false for different instances with different ids', () => {
      const otherProfile = createTestProfileModel({ id: generateId() });
      expect(profile.equals(otherProfile)).toBe(false);
    });

    it('should return false for null', () => {
      expect(profile.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(profile.equals(undefined)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties in TypeScript', () => {
      // TypeScript readonly properties prevent compile-time mutations
      // Runtime mutations are prevented by the class design and immutable operations
      expect(profile.name).toBeDefined();
      expect(profile.id).toBeDefined();
      expect(profile.createdAt).toBeDefined();

      // Verify that cloning creates new instances rather than mutating existing ones
      const originalName = profile.name;
      const cloned = profile.cloneWithNewName('Different Name');

      expect(profile.name).toBe(originalName);
      expect(cloned.name).toBe('Different Name');
      expect(cloned).not.toBe(profile);
    });
  });

  describe('business logic edge cases', () => {
    it('should handle profile with minimum valid name length', () => {
      const minProfile = createTestProfileModel({ name: 'A' });
      expect(minProfile.getDisplayName()).toBe('A');
      expect(minProfile.validate().success).toBe(true);
    });

    it('should handle profiles created exactly at midnight', () => {
      const midnightProfile = createTestProfileModel({
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(midnightProfile.createdAt.getUTCHours()).toBe(0);
    });

    it('should maintain referential integrity after cloning operations', () => {
      const renamed = profile.cloneWithNewName('New Name');
      const deactivated = renamed.cloneAsDeactivated();
      const reactivated = deactivated.cloneAsReactivated();

      expect(reactivated.id).toBe(profile.id);
      expect(reactivated.createdAt).toEqual(profile.createdAt);
      expect(reactivated.name).toBe('New Name');
      expect(reactivated.isActive).toBe(true);
    });
  });
});
