import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import {
  createTestPerformedExerciseLogData,
  createTestPerformedExerciseLogModel,
  createTestPerformedSetModel,
} from '@/test-factories';

import { IPerformedSetRepository } from '../domain/IPerformedSetRepository';
import { PerformedExerciseLogModel } from '../domain/PerformedExerciseLogModel';
import { PerformedExerciseRepository } from './PerformedExerciseRepository';

// Mock the injected repository interface
vi.mock('../domain/IPerformedSetRepository');

describe('PerformedExerciseRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: PerformedExerciseRepository;
  let mockPerformedSetRepo: IPerformedSetRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();

    // Create mock
    mockPerformedSetRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    repository = new PerformedExerciseRepository(mockPerformedSetRepo, testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a PerformedExerciseLogModel and all its performed sets to the database', async () => {
      // Arrange
      const performedSet1 = createTestPerformedSetModel();
      const performedSet2 = createTestPerformedSetModel();
      const exerciseModel = createTestPerformedExerciseLogModel({}, [performedSet1, performedSet2]);

      mockPerformedSetRepo.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.save(exerciseModel);

      // Assert
      expect(result).toBe(exerciseModel);

      // Verify exercise data was persisted
      const savedData = await testDb.performedExercises.get(exerciseModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(exerciseModel.id);
      expect(savedData!.profileId).toBe(exerciseModel.profileId);
      expect(savedData!.exerciseId).toBe(exerciseModel.exerciseId);
      expect(savedData!.plannedExerciseId).toBe(exerciseModel.plannedExerciseId);
      expect(savedData!.setIds).toEqual(exerciseModel.sets.map((s) => s.id));
      expect(savedData!.notes).toBe(exerciseModel.notes);
      expect(savedData!.isSkipped).toBe(exerciseModel.isSkipped);
      expect(savedData!.exerciseName).toBe(exerciseModel.exerciseName);
      expect(savedData!.exerciseCategory).toBe(exerciseModel.exerciseCategory);
      expect(savedData!.muscleActivation).toEqual(exerciseModel.muscleActivation);

      // Verify performed sets were saved via repository
      expect(mockPerformedSetRepo.save).toHaveBeenCalledTimes(2);
      expect(mockPerformedSetRepo.save).toHaveBeenCalledWith(performedSet1, true);
      expect(mockPerformedSetRepo.save).toHaveBeenCalledWith(performedSet2, true);
    });

    it('should handle exercises with no performed sets', async () => {
      // Arrange
      const exerciseModel = createTestPerformedExerciseLogModel({}, []);

      // Act
      const result = await repository.save(exerciseModel);

      // Assert
      expect(result).toBe(exerciseModel);

      // Verify exercise data was persisted
      const savedData = await testDb.performedExercises.get(exerciseModel.id);
      expect(savedData).toBeDefined();

      // Verify no performed sets were saved
      expect(mockPerformedSetRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a PerformedExerciseLogModel when exercise exists', async () => {
      // Arrange
      const performedSet1 = createTestPerformedSetModel();
      const performedSet2 = createTestPerformedSetModel();
      const testData = createTestPerformedExerciseLogData({
        setIds: [performedSet1.id, performedSet2.id],
      });
      await testDb.write(async () => {
        await testDb.performedExercises.put(testData);
      });

      mockPerformedSetRepo.findByIds = vi.fn().mockResolvedValue([performedSet1, performedSet2]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(PerformedExerciseLogModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.exerciseId).toBe(testData.exerciseId);
      expect(result!.plannedExerciseId).toBe(testData.plannedExerciseId);
      expect(result!.sets).toHaveLength(2);
      expect(result!.sets).toContain(performedSet1);
      expect(result!.sets).toContain(performedSet2);
      expect(result!.notes).toBe(testData.notes);
      expect(result!.isSkipped).toBe(testData.isSkipped);
      expect(result!.exerciseName).toBe(testData.exerciseName);

      // Verify performed sets were fetched
      expect(mockPerformedSetRepo.findByIds).toHaveBeenCalledWith([
        performedSet1.id,
        performedSet2.id,
      ]);
    });

    it('should return undefined when exercise does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockPerformedSetRepo.findByIds).not.toHaveBeenCalled();
    });

    it('should handle exercises with no performed sets', async () => {
      // Arrange
      const testData = createTestPerformedExerciseLogData({ setIds: [] });
      await testDb.write(async () => {
        await testDb.performedExercises.put(testData);
      });

      mockPerformedSetRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(PerformedExerciseLogModel);
      expect(result!.sets).toHaveLength(0);
      expect(mockPerformedSetRepo.findByIds).toHaveBeenCalledWith([]);
    });
  });

  describe('findByIds', () => {
    it('should return array of PerformedExerciseLogModels for existing exercises', async () => {
      // Arrange
      const performedSet1 = createTestPerformedSetModel();
      const performedSet2 = createTestPerformedSetModel();
      const performedSet3 = createTestPerformedSetModel();

      const testData1 = createTestPerformedExerciseLogData({ setIds: [performedSet1.id] });
      const testData2 = createTestPerformedExerciseLogData({
        setIds: [performedSet2.id, performedSet3.id],
      });
      await testDb.write(async () => {
        await testDb.performedExercises.bulkPut([testData1, testData2]);
      });

      mockPerformedSetRepo.findByIds = vi
        .fn()
        .mockResolvedValue([performedSet1, performedSet2, performedSet3]);

      // Act
      const result = await repository.findByIds([testData1.id, testData2.id]);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((exercise) => {
        expect(exercise).toBeInstanceOf(PerformedExerciseLogModel);
      });

      // Check first exercise
      const exercise1 = result.find((e) => e.id === testData1.id);
      expect(exercise1).toBeDefined();
      expect(exercise1!.sets).toHaveLength(1);
      expect(exercise1!.sets[0].id).toBe(performedSet1.id);

      // Check second exercise
      const exercise2 = result.find((e) => e.id === testData2.id);
      expect(exercise2).toBeDefined();
      expect(exercise2!.sets).toHaveLength(2);

      // Verify all performed sets were fetched once
      expect(mockPerformedSetRepo.findByIds).toHaveBeenCalledWith([
        performedSet1.id,
        performedSet2.id,
        performedSet3.id,
      ]);
    });

    it('should filter out undefined results for non-existent exercises', async () => {
      // Arrange
      const performedSet1 = createTestPerformedSetModel();
      const testData1 = createTestPerformedExerciseLogData({ setIds: [performedSet1.id] });
      await testDb.write(async () => {
        await testDb.performedExercises.put(testData1);
      });
      const nonExistentId = 'non-existent-id';

      mockPerformedSetRepo.findByIds = vi.fn().mockResolvedValue([performedSet1]);

      // Act
      const result = await repository.findByIds([testData1.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerformedExerciseLogModel);
      expect(result[0].id).toBe(testData1.id);
    });

    it('should return empty array when no exercises exist', async () => {
      // Arrange
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(nonExistentIds);

      // Assert
      expect(result).toEqual([]);
      expect(mockPerformedSetRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all performed exercises for a profile as PerformedExerciseLogModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';
      const performedSet1 = createTestPerformedSetModel();
      const performedSet2 = createTestPerformedSetModel();

      const testData1 = createTestPerformedExerciseLogData({
        profileId,
        setIds: [performedSet1.id],
      });
      const testData2 = createTestPerformedExerciseLogData({
        profileId,
        setIds: [performedSet2.id],
      });
      const testData3 = createTestPerformedExerciseLogData({
        profileId: otherProfileId,
        setIds: [],
      });
      await testDb.write(async () => {
        await testDb.performedExercises.bulkPut([testData1, testData2, testData3]);
      });

      mockPerformedSetRepo.findByIds = vi.fn().mockResolvedValue([performedSet1, performedSet2]);

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((exercise) => {
        expect(exercise).toBeInstanceOf(PerformedExerciseLogModel);
        expect(exercise.profileId).toBe(profileId);
      });
      expect(result.map((e) => e.id)).toContain(testData1.id);
      expect(result.map((e) => e.id)).toContain(testData2.id);
      expect(result.map((e) => e.id)).not.toContain(testData3.id);
    });

    it('should return empty array when no performed exercises exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
      expect(mockPerformedSetRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete performed exercise and all its performed sets from the database', async () => {
      // Arrange
      const performedSet1 = createTestPerformedSetModel();
      const performedSet2 = createTestPerformedSetModel();
      const exerciseModel = createTestPerformedExerciseLogModel({}, [performedSet1, performedSet2]);

      const testData = exerciseModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.performedExercises.put(testData);
      });

      mockPerformedSetRepo.findByIds = vi.fn().mockResolvedValue([performedSet1, performedSet2]);
      mockPerformedSetRepo.delete = vi.fn().mockResolvedValue(undefined);

      // Verify exercise exists before deletion
      const beforeDelete = await testDb.performedExercises.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.performedExercises.get(testData.id);
      expect(afterDelete).toBeUndefined();

      // Verify performed sets were deleted
      expect(mockPerformedSetRepo.delete).toHaveBeenCalledTimes(2);
      expect(mockPerformedSetRepo.delete).toHaveBeenCalledWith(performedSet1.id, true);
      expect(mockPerformedSetRepo.delete).toHaveBeenCalledWith(performedSet2.id, true);
    });

    it('should not throw error when deleting non-existent performed exercise', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
      expect(mockPerformedSetRepo.delete).not.toHaveBeenCalled();
    });

    it('should handle performed exercises with no performed sets', async () => {
      // Arrange
      const exerciseModel = createTestPerformedExerciseLogModel({}, []);
      const testData = exerciseModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.performedExercises.put(testData);
      });

      mockPerformedSetRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.performedExercises.get(testData.id);
      expect(afterDelete).toBeUndefined();
      expect(mockPerformedSetRepo.delete).not.toHaveBeenCalled();
    });
  });
});
