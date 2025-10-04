import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestProfileData, createTestProfileModel } from '@/test-factories';

import { ProfileModel } from '../domain/ProfileModel';
import { ProfileRepository } from './ProfileRepository';

describe('ProfileRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: ProfileRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new ProfileRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a ProfileModel to the database', async () => {
      // Arrange
      const profileModel = createTestProfileModel();

      // Act
      const result = await repository.save(profileModel);

      // Assert
      expect(result).toBe(profileModel);

      // Verify data was persisted
      const collection = testDb.get('profiles');
      const savedRecord = await collection.find(profileModel.id);
      expect(savedRecord).toBeDefined();

      // Check the _raw data for now since decorators aren't working
      expect(savedRecord.id).toBe(profileModel.id);
      expect(savedRecord._raw.name).toBe(profileModel.name);
      expect(new Date(savedRecord._raw.created_at)).toEqual(profileModel.createdAt);
      expect(new Date(savedRecord._raw.updated_at)).toEqual(profileModel.updatedAt);
    });

    it('should update existing profile when saving with same id', async () => {
      // Arrange
      const originalData = createTestProfileData({ name: 'Original Name' });

      // Create original record in WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('profiles');
        await collection.create((record) => {
          record._raw.id = originalData.id;
          record._raw.name = originalData.name;
          record._raw.created_at = originalData.createdAt.getTime();
          record._raw.updated_at = originalData.updatedAt.getTime();
        });
      });

      const updatedModel = ProfileModel.hydrate({ ...originalData, name: 'Updated Name' });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const collection = testDb.get('profiles');
      const savedRecord = await collection.find(originalData.id);
      expect(savedRecord).toBeDefined();
      expect(savedRecord._raw.name).toBe('Updated Name');
      expect(savedRecord.id).toBe(originalData.id);
    });
  });

  describe('findById', () => {
    it('should return a ProfileModel when profile exists', async () => {
      // Arrange
      const testData = createTestProfileData();
      await testDb.write(async () => {
        const collection = testDb.get('profiles');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.name = testData.name;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(ProfileModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.name).toBe(testData.name);
      expect(result!.createdAt).toEqual(testData.createdAt);
      expect(result!.updatedAt).toEqual(testData.updatedAt);
    });

    it('should return undefined when profile does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findByIds', () => {
    it('should return array of ProfileModels for existing profiles', async () => {
      // Arrange
      const testData1 = createTestProfileData();
      const testData2 = createTestProfileData();

      await testDb.write(async () => {
        const collection = testDb.get('profiles');
        await testDb.batch(
          collection.prepareCreate((record) => {
            record._raw.id = testData1.id;
            record._raw.name = testData1.name;
            record._raw.created_at = testData1.createdAt;
            record._raw.updated_at = testData1.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = testData2.id;
            record._raw.name = testData2.name;
            record._raw.created_at = testData2.createdAt;
            record._raw.updated_at = testData2.updatedAt;
          })
        );
      });

      // Act
      const result = await repository.findByIds([testData1.id, testData2.id]);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ProfileModel);
      expect(result[1]).toBeInstanceOf(ProfileModel);
      expect(result.map((p) => p.id)).toContain(testData1.id);
      expect(result.map((p) => p.id)).toContain(testData2.id);
    });

    it('should filter out undefined results for non-existent profiles', async () => {
      // Arrange
      const testData = createTestProfileData();
      await testDb.write(async () => {
        const collection = testDb.get('profiles');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.name = testData.name;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findByIds([testData.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ProfileModel);
      expect(result[0].id).toBe(testData.id);
    });

    it('should return empty array when no profiles exist', async () => {
      // Arrange
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(nonExistentIds);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all profiles as ProfileModels', async () => {
      // Arrange
      const testData1 = createTestProfileData();
      const testData2 = createTestProfileData();
      const testData3 = createTestProfileData();

      await testDb.write(async () => {
        const collection = testDb.get('profiles');
        await testDb.batch(
          collection.prepareCreate((record) => {
            record._raw.id = testData1.id;
            record._raw.name = testData1.name;
            record._raw.created_at = testData1.createdAt;
            record._raw.updated_at = testData1.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = testData2.id;
            record._raw.name = testData2.name;
            record._raw.created_at = testData2.createdAt;
            record._raw.updated_at = testData2.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = testData3.id;
            record._raw.name = testData3.name;
            record._raw.created_at = testData3.createdAt;
            record._raw.updated_at = testData3.updatedAt;
          })
        );
      });

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(3);
      result.forEach((profile) => {
        expect(profile).toBeInstanceOf(ProfileModel);
      });
      expect(result.map((p) => p.id)).toContain(testData1.id);
      expect(result.map((p) => p.id)).toContain(testData2.id);
      expect(result.map((p) => p.id)).toContain(testData3.id);
    });

    it('should return empty array when no profiles exist', async () => {
      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete profile by id', async () => {
      // Arrange
      const testData = createTestProfileData();
      await testDb.write(async () => {
        const collection = testDb.get('profiles');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.name = testData.name;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Verify profile exists before deletion
      const collection = testDb.get('profiles');
      const beforeDelete = await collection.find(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      try {
        await collection.find(testData.id);
        expect.fail('Should have thrown error for deleted record');
      } catch (_error) {
        // Expected - record should not exist
        expect(_error).toBeDefined();
      }
    });

    it('should not throw error when deleting non-existent profile', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });
});
