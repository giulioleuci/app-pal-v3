import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestAppliedExerciseData, createTestAppliedExerciseModel } from '@/test-factories';

import { AppliedExerciseModel } from '../domain/AppliedExerciseModel';
import { AppliedExerciseRepository } from './AppliedExerciseRepository';

describe('AppliedExerciseRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: AppliedExerciseRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new AppliedExerciseRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist an AppliedExerciseModel to the database', async () => {
      // Arrange
      const exerciseModel = createTestAppliedExerciseModel({ restTimeSeconds: 90 });

      // Act
      const result = await repository.save(exerciseModel);

      // Assert
      expect(result).toBe(exerciseModel);

      // Verify data was persisted
      const savedData = await testDb.appliedExercises.get(exerciseModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(exerciseModel.id);
      expect(savedData!.profileId).toBe(exerciseModel.profileId);
      expect(savedData!.exerciseId).toBe(exerciseModel.exerciseId);
      expect(savedData!.templateId).toBe(exerciseModel.templateId);
      // setConfiguration is stored as JSON string in database but parsed back to object by test wrapper
      expect(savedData!.setConfiguration).toEqual(exerciseModel.setConfiguration.toPlainObject());
      expect(savedData!.restTimeSeconds).toBe(exerciseModel.restTimeSeconds);
      expect(savedData!.executionCount).toBe(exerciseModel.executionCount);
    });

    it('should update existing applied exercise when saving with same id', async () => {
      // Arrange
      const originalData = createTestAppliedExerciseData({ executionCount: 5 });
      await testDb.write(async () => {
        await testDb.appliedExercises.put(originalData);
      });

      const updatedModel = AppliedExerciseModel.hydrate({ ...originalData, executionCount: 10 });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const savedData = await testDb.appliedExercises.get(originalData.id);
      expect(savedData).toBeDefined();
      expect(savedData!.executionCount).toBe(10);
      expect(savedData!.id).toBe(originalData.id);
    });
  });

  describe('findById', () => {
    it('should return an AppliedExerciseModel when applied exercise exists', async () => {
      // Arrange
      const testData = createTestAppliedExerciseData({ restTimeSeconds: 120 });
      await testDb.write(async () => {
        await testDb.appliedExercises.put(testData);
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(AppliedExerciseModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.exerciseId).toBe(testData.exerciseId);
      expect(result!.templateId).toBe(testData.templateId);
      expect(result!.setConfiguration.toPlainObject()).toEqual(
        typeof testData.setConfiguration === 'string'
          ? JSON.parse(testData.setConfiguration)
          : testData.setConfiguration
      );
      expect(result!.restTimeSeconds).toBe(testData.restTimeSeconds);
      expect(result!.executionCount).toBe(testData.executionCount);
    });

    it('should return undefined when applied exercise does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findByIds', () => {
    it('should return array of AppliedExerciseModels for existing applied exercises', async () => {
      // Arrange
      const testData1 = createTestAppliedExerciseData();
      const testData2 = createTestAppliedExerciseData();
      const testData3 = createTestAppliedExerciseData();
      await testDb.write(async () => {
        await testDb.appliedExercises.bulkPut([testData1, testData2, testData3]);
      });

      // Act
      const result = await repository.findByIds([testData1.id, testData2.id, testData3.id]);

      // Assert
      expect(result).toHaveLength(3);
      result.forEach((exercise) => {
        expect(exercise).toBeInstanceOf(AppliedExerciseModel);
      });
      expect(result.map((e) => e.id)).toContain(testData1.id);
      expect(result.map((e) => e.id)).toContain(testData2.id);
      expect(result.map((e) => e.id)).toContain(testData3.id);
    });

    it('should filter out undefined results for non-existent applied exercises', async () => {
      // Arrange
      const testData = createTestAppliedExerciseData();
      await testDb.write(async () => {
        await testDb.appliedExercises.put(testData);
      });
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findByIds([testData.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(AppliedExerciseModel);
      expect(result[0].id).toBe(testData.id);
    });

    it('should return empty array when no applied exercises exist', async () => {
      // Arrange
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(nonExistentIds);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all applied exercises for a profile as AppliedExerciseModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';
      const testData1 = createTestAppliedExerciseData({ profileId });
      const testData2 = createTestAppliedExerciseData({ profileId });
      const testData3 = createTestAppliedExerciseData({ profileId: otherProfileId });
      await testDb.write(async () => {
        await testDb.appliedExercises.bulkPut([testData1, testData2, testData3]);
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((exercise) => {
        expect(exercise).toBeInstanceOf(AppliedExerciseModel);
        expect(exercise.profileId).toBe(profileId);
      });
      expect(result.map((e) => e.id)).toContain(testData1.id);
      expect(result.map((e) => e.id)).toContain(testData2.id);
      expect(result.map((e) => e.id)).not.toContain(testData3.id);
    });

    it('should return empty array when no applied exercises exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete applied exercise by id', async () => {
      // Arrange
      const testData = createTestAppliedExerciseData();
      await testDb.write(async () => {
        await testDb.appliedExercises.put(testData);
      });

      // Verify applied exercise exists before deletion
      const beforeDelete = await testDb.appliedExercises.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.appliedExercises.get(testData.id);
      expect(afterDelete).toBeUndefined();
    });

    it('should not throw error when deleting non-existent applied exercise', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });
});
