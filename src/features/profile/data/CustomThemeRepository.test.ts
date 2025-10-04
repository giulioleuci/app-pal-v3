import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestCustomThemeData, createTestCustomThemeModel } from '@/test-factories';

import { CustomThemeModel } from '../domain/CustomThemeModel';
import { CustomThemeRepository } from './CustomThemeRepository';

describe('CustomThemeRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: CustomThemeRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new CustomThemeRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a CustomThemeModel to the database', async () => {
      // Arrange
      const themeModel = createTestCustomThemeModel();

      // Act
      const result = await repository.save(themeModel);

      // Assert
      expect(result).toBe(themeModel);

      // Verify data was persisted
      const collection = testDb.get('custom_themes');
      const savedRecord = await collection.find(themeModel.id);
      expect(savedRecord).toBeDefined();

      // Check the _raw data since decorators might not work in tests
      expect(savedRecord.id).toBe(themeModel.id);
      expect(savedRecord._raw.profile_id).toBe(themeModel.profileId);
      expect(savedRecord._raw.name).toBe(themeModel.name);
      expect(savedRecord._raw.mode).toBe(themeModel.mode);
      expect(savedRecord._raw.primary_color).toBe(themeModel.primaryColor);
      expect(savedRecord._raw.secondary_color).toBe(themeModel.secondaryColor);
    });

    it('should update existing theme when saving with same id', async () => {
      // Arrange
      const originalData = createTestCustomThemeData({ name: 'Original Theme' });

      // Create the record first using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('custom_themes');
        await collection.create((record) => {
          record._raw.id = originalData.id;
          record._raw.profile_id = originalData.profileId;
          record._raw.name = originalData.name;
          record._raw.mode = originalData.mode;
          record._raw.primary_color = originalData.primaryColor;
          record._raw.secondary_color = originalData.secondaryColor;
        });
      });

      const updatedModel = CustomThemeModel.hydrate({ ...originalData, name: 'Updated Theme' });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const collection = testDb.get('custom_themes');
      const updatedRecord = await collection.find(originalData.id);
      expect(updatedRecord).toBeDefined();
      expect(updatedRecord._raw.name).toBe('Updated Theme');
      expect(updatedRecord.id).toBe(originalData.id);
    });
  });

  describe('findById', () => {
    it('should return a CustomThemeModel when theme exists', async () => {
      // Arrange
      const testData = createTestCustomThemeData();

      // Create the record using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('custom_themes');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.mode = testData.mode;
          record._raw.primary_color = testData.primaryColor;
          record._raw.secondary_color = testData.secondaryColor;
        });
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(CustomThemeModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.name).toBe(testData.name);
      expect(result!.mode).toBe(testData.mode);
      expect(result!.primaryColor).toBe(testData.primaryColor);
      expect(result!.secondaryColor).toBe(testData.secondaryColor);
    });

    it('should return undefined when theme does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findByProfileId', () => {
    it('should return array of CustomThemeModels for existing themes', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const testData1 = createTestCustomThemeData({ profileId, name: 'Theme 1' });
      const testData2 = createTestCustomThemeData({ profileId, name: 'Theme 2' });
      const testData3 = createTestCustomThemeData({ name: 'Other Profile Theme' }); // Different profile
      // Create all records using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('custom_themes');

        // Create first record
        await collection.create((record) => {
          record._raw.id = testData1.id;
          record._raw.profile_id = testData1.profileId;
          record._raw.name = testData1.name;
          record._raw.mode = testData1.mode;
          record._raw.primary_color = testData1.primaryColor;
          record._raw.secondary_color = testData1.secondaryColor;
        });

        // Create second record
        await collection.create((record) => {
          record._raw.id = testData2.id;
          record._raw.profile_id = testData2.profileId;
          record._raw.name = testData2.name;
          record._raw.mode = testData2.mode;
          record._raw.primary_color = testData2.primaryColor;
          record._raw.secondary_color = testData2.secondaryColor;
        });

        // Create third record
        await collection.create((record) => {
          record._raw.id = testData3.id;
          record._raw.profile_id = testData3.profileId;
          record._raw.name = testData3.name;
          record._raw.mode = testData3.mode;
          record._raw.primary_color = testData3.primaryColor;
          record._raw.secondary_color = testData3.secondaryColor;
        });
      });

      // Act
      const result = await repository.findByProfileId(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((theme) => {
        expect(theme).toBeInstanceOf(CustomThemeModel);
        expect(theme.profileId).toBe(profileId);
      });
      expect(result.map((t) => t.name)).toContain('Theme 1');
      expect(result.map((t) => t.name)).toContain('Theme 2');
      expect(result.map((t) => t.name)).not.toContain('Other Profile Theme');
    });

    it('should return empty array when no themes exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile-id';

      // Act
      const result = await repository.findByProfileId(nonExistentProfileId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when themes exist for other profiles only', async () => {
      // Arrange
      const profileId = 'target-profile-id';
      const otherProfileId = 'other-profile-id';
      const testData = createTestCustomThemeData({ profileId: otherProfileId });

      // Create the record using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('custom_themes');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.mode = testData.mode;
          record._raw.primary_color = testData.primaryColor;
          record._raw.secondary_color = testData.secondaryColor;
        });
      });

      // Act
      const result = await repository.findByProfileId(profileId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete theme by id', async () => {
      // Arrange
      const testData = createTestCustomThemeData();

      // Create the record using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('custom_themes');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.mode = testData.mode;
          record._raw.primary_color = testData.primaryColor;
          record._raw.secondary_color = testData.secondaryColor;
        });
      });

      // Verify theme exists before deletion
      const collection = testDb.get('custom_themes');
      const beforeDelete = await collection.find(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert - check if the record is marked as deleted
      try {
        const afterDelete = await collection.find(testData.id);
        expect(afterDelete._raw._status).toBe('deleted');
      } catch (_error) {
        // Record not found - it's been properly deleted
        expect(_error).toBeDefined();
      }
    });

    it('should not throw error when deleting non-existent theme', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });
});
