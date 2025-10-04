import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestTrainingCycleData, createTestTrainingCycleModel } from '@/test-factories';

import { TrainingCycleModel } from '../domain/TrainingCycleModel';
import { TrainingCycleRepository } from './TrainingCycleRepository';

describe('TrainingCycleRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: TrainingCycleRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new TrainingCycleRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a TrainingCycleModel to the database', async () => {
      // Arrange
      const cycleModel = createTestTrainingCycleModel();

      // Act
      const result = await repository.save(cycleModel);

      // Assert
      expect(result).toBe(cycleModel);

      // Verify data was persisted
      const collection = testDb.get('training_cycles');
      const savedRecord = await collection.find(cycleModel.id);

      expect(savedRecord).toBeDefined();
      expect(savedRecord.id).toBe(cycleModel.id);
      expect(savedRecord._raw.profile_id).toBe(cycleModel.profileId);
      expect(savedRecord._raw.name).toBe(cycleModel.name);
      expect(new Date(savedRecord._raw.start_date)).toEqual(cycleModel.startDate);
      expect(new Date(savedRecord._raw.end_date)).toEqual(cycleModel.endDate);
      expect(savedRecord._raw.goal).toBe(cycleModel.goal);
      expect(savedRecord._raw.notes).toBe(cycleModel.notes);
    });

    it('should update existing cycle when saving with same id', async () => {
      // Arrange
      const originalData = createTestTrainingCycleData({ name: 'Original Cycle' });

      // Create the record directly in WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('training_cycles');
        await collection.create((record) => {
          record._raw.id = originalData.id;
          record._raw.profile_id = originalData.profileId;
          record._raw.name = originalData.name;
          record._raw.start_date = originalData.startDate.getTime();
          record._raw.end_date = originalData.endDate.getTime();
          record._raw.goal = originalData.goal;
          record._raw.notes = originalData.notes;
          record._raw.created_at = originalData.createdAt.getTime();
          record._raw.updated_at = originalData.updatedAt.getTime();
        });
      });

      const updatedModel = TrainingCycleModel.hydrate({ ...originalData, name: 'Updated Cycle' });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const collection = testDb.get('training_cycles');
      const savedRecord = await collection.find(originalData.id);
      expect(savedRecord).toBeDefined();
      expect(savedRecord._raw.name).toBe('Updated Cycle');
      expect(savedRecord.id).toBe(originalData.id);
    });
  });

  describe('findById', () => {
    it('should return a TrainingCycleModel when cycle exists', async () => {
      // Arrange
      const testData = createTestTrainingCycleData();

      // Create the record directly in WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('training_cycles');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.start_date = testData.startDate.getTime();
          record._raw.end_date = testData.endDate.getTime();
          record._raw.goal = testData.goal;
          record._raw.notes = testData.notes;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(TrainingCycleModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.name).toBe(testData.name);
      expect(result!.startDate).toEqual(testData.startDate);
      expect(result!.endDate).toEqual(testData.endDate);
      expect(result!.goal).toBe(testData.goal);
      expect(result!.notes).toBe(testData.notes);
    });

    it('should return undefined when cycle does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all training cycles for a profile as TrainingCycleModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';
      const testData1 = createTestTrainingCycleData({ profileId });
      const testData2 = createTestTrainingCycleData({ profileId });
      const testData3 = createTestTrainingCycleData({ profileId: otherProfileId });
      await testDb.write(async () => {
        await testDb.trainingCycles.bulkPut([testData1, testData2, testData3]);
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((cycle) => {
        expect(cycle).toBeInstanceOf(TrainingCycleModel);
        expect(cycle.profileId).toBe(profileId);
      });
      expect(result.map((c) => c.id)).toContain(testData1.id);
      expect(result.map((c) => c.id)).toContain(testData2.id);
      expect(result.map((c) => c.id)).not.toContain(testData3.id);
    });

    it('should return empty array when no cycles exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete cycle by id', async () => {
      // Arrange
      const testData = createTestTrainingCycleData();
      await testDb.write(async () => {
        await testDb.trainingCycles.put(testData);
      });

      // Verify cycle exists before deletion
      const beforeDelete = await testDb.trainingCycles.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.trainingCycles.get(testData.id);
      expect(afterDelete).toBeUndefined();
    });

    it('should not throw error when deleting non-existent cycle', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });
});
