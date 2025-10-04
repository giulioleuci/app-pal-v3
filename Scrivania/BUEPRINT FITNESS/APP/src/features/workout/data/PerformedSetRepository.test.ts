import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestPerformedSetData, createTestPerformedSetModel } from '@/test-factories';

import { PerformedSetModel } from '../domain/PerformedSetModel';
import { PerformedSetRepository } from './PerformedSetRepository';

describe('PerformedSetRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: PerformedSetRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new PerformedSetRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a PerformedSetModel to the database', async () => {
      // Arrange
      const setModel = createTestPerformedSetModel();

      // Act
      const result = await repository.save(setModel);

      // Assert
      expect(result).toBe(setModel);

      // Verify data was persisted
      const savedData = await testDb.performedSets.get(setModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(setModel.id);
      expect(savedData!.profileId).toBe(setModel.profileId);
      expect(savedData!.counterType).toBe(setModel.counterType);
      expect(savedData!.counts).toBe(setModel.counts);
      expect(savedData!.weight).toBe(setModel.weight);
      expect(savedData!.completed).toBe(setModel.completed);
      expect(savedData!.notes).toBe(setModel.notes);
      expect(savedData!.rpe).toBe(setModel.rpe);
      expect(savedData!.percentage).toBe(setModel.percentage);
    });

    it('should update existing performed set when saving with same id', async () => {
      // Arrange
      const originalData = createTestPerformedSetData({ completed: false });
      await testDb.write(async () => {
        await testDb.performedSets.put(originalData);
      });

      const updatedModel = PerformedSetModel.hydrate({ ...originalData, completed: true });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const savedData = await testDb.performedSets.get(originalData.id);
      expect(savedData).toBeDefined();
      expect(savedData!.completed).toBe(true);
      expect(savedData!.id).toBe(originalData.id);
    });
  });

  describe('findById', () => {
    it('should return a PerformedSetModel when performed set exists', async () => {
      // Arrange
      const testData = createTestPerformedSetData();
      await testDb.write(async () => {
        await testDb.performedSets.put(testData);
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(PerformedSetModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.counterType).toBe(testData.counterType);
      expect(result!.counts).toBe(testData.counts);
      expect(result!.weight).toBe(testData.weight);
      expect(result!.completed).toBe(testData.completed);
      expect(result!.notes).toBe(testData.notes);
      expect(result!.rpe).toBe(testData.rpe);
      expect(result!.percentage).toBe(testData.percentage);
    });

    it('should return undefined when performed set does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findByIds', () => {
    it('should return array of PerformedSetModels for existing performed sets', async () => {
      // Arrange
      const testData1 = createTestPerformedSetData();
      const testData2 = createTestPerformedSetData();
      const testData3 = createTestPerformedSetData();
      await testDb.write(async () => {
        await testDb.performedSets.bulkPut([testData1, testData2, testData3]);
      });

      // Act
      const result = await repository.findByIds([testData1.id, testData2.id, testData3.id]);

      // Assert
      expect(result).toHaveLength(3);
      result.forEach((set) => {
        expect(set).toBeInstanceOf(PerformedSetModel);
      });
      expect(result.map((s) => s.id)).toContain(testData1.id);
      expect(result.map((s) => s.id)).toContain(testData2.id);
      expect(result.map((s) => s.id)).toContain(testData3.id);
    });

    it('should filter out undefined results for non-existent performed sets', async () => {
      // Arrange
      const testData = createTestPerformedSetData();
      await testDb.write(async () => {
        await testDb.performedSets.put(testData);
      });
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findByIds([testData.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerformedSetModel);
      expect(result[0].id).toBe(testData.id);
    });

    it('should return empty array when no performed sets exist', async () => {
      // Arrange
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(nonExistentIds);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all performed sets for a profile as PerformedSetModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';
      const testData1 = createTestPerformedSetData({ profileId });
      const testData2 = createTestPerformedSetData({ profileId });
      const testData3 = createTestPerformedSetData({ profileId: otherProfileId });
      await testDb.write(async () => {
        await testDb.performedSets.bulkPut([testData1, testData2, testData3]);
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((set) => {
        expect(set).toBeInstanceOf(PerformedSetModel);
        expect(set.profileId).toBe(profileId);
      });
      expect(result.map((s) => s.id)).toContain(testData1.id);
      expect(result.map((s) => s.id)).toContain(testData2.id);
      expect(result.map((s) => s.id)).not.toContain(testData3.id);
    });

    it('should return empty array when no performed sets exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete performed set by id', async () => {
      // Arrange
      const testData = createTestPerformedSetData();
      await testDb.write(async () => {
        await testDb.performedSets.put(testData);
      });

      // Verify performed set exists before deletion
      const beforeDelete = await testDb.performedSets.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.performedSets.get(testData.id);
      expect(afterDelete).toBeUndefined();
    });

    it('should not throw error when deleting non-existent performed set', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });
});
