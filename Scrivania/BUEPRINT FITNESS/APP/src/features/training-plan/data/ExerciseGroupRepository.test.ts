import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import {
  createTestAppliedExerciseModel,
  createTestExerciseGroupData,
  createTestExerciseGroupModel,
} from '@/test-factories';

import { ExerciseGroupModel } from '../domain/ExerciseGroupModel';
import { IAppliedExerciseRepository } from '../domain/IAppliedExerciseRepository';
import { ExerciseGroupRepository } from './ExerciseGroupRepository';

// Mock the injected repository interface
vi.mock('../domain/IAppliedExerciseRepository');

describe('ExerciseGroupRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: ExerciseGroupRepository;
  let mockAppliedExerciseRepo: IAppliedExerciseRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();

    // Create mock
    mockAppliedExerciseRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    repository = new ExerciseGroupRepository(mockAppliedExerciseRepo, testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist an ExerciseGroupModel and all its applied exercises to the database', async () => {
      // Arrange
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();
      const groupModel = createTestExerciseGroupModel({}, [appliedExercise1, appliedExercise2]);

      mockAppliedExerciseRepo.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.save(groupModel);

      // Assert
      expect(result).toBe(groupModel);

      // Verify group data was persisted
      const savedData = await testDb.exerciseGroups.get(groupModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(groupModel.id);
      expect(savedData!.profileId).toBe(groupModel.profileId);
      expect(savedData!.type).toBe(groupModel.type);
      expect(savedData!.appliedExerciseIds).toEqual(groupModel.appliedExercises.map((e) => e.id));
      expect(savedData!.restTimeSeconds).toBe(groupModel.restTimeSeconds);

      // Verify applied exercises were saved via repository
      expect(mockAppliedExerciseRepo.save).toHaveBeenCalledTimes(2);
      expect(mockAppliedExerciseRepo.save).toHaveBeenCalledWith(appliedExercise1, true);
      expect(mockAppliedExerciseRepo.save).toHaveBeenCalledWith(appliedExercise2, true);
    });

    it('should handle groups with no applied exercises', async () => {
      // Arrange
      const groupModel = createTestExerciseGroupModel({}, []);

      // Act
      const result = await repository.save(groupModel);

      // Assert
      expect(result).toBe(groupModel);

      // Verify group data was persisted
      const savedData = await testDb.exerciseGroups.get(groupModel.id);
      expect(savedData).toBeDefined();

      // Verify no applied exercises were saved
      expect(mockAppliedExerciseRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an ExerciseGroupModel when group exists', async () => {
      // Arrange
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();
      const testData = createTestExerciseGroupData({
        appliedExerciseIds: [appliedExercise1.id, appliedExercise2.id],
      });
      await testDb.write(async () => {
        await testDb.exerciseGroups.put(testData);
      });

      mockAppliedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([appliedExercise1, appliedExercise2]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(ExerciseGroupModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.type).toBe(testData.type);
      expect(result!.appliedExercises).toHaveLength(2);
      expect(result!.appliedExercises).toContain(appliedExercise1);
      expect(result!.appliedExercises).toContain(appliedExercise2);
      expect(result!.restTimeSeconds).toBe(testData.restTimeSeconds);

      // Verify applied exercises were fetched
      expect(mockAppliedExerciseRepo.findByIds).toHaveBeenCalledWith([
        appliedExercise1.id,
        appliedExercise2.id,
      ]);
    });

    it('should return undefined when group does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockAppliedExerciseRepo.findByIds).not.toHaveBeenCalled();
    });

    it('should handle groups with no applied exercises', async () => {
      // Arrange
      const testData = createTestExerciseGroupData({ appliedExerciseIds: [] });
      await testDb.write(async () => {
        await testDb.exerciseGroups.put(testData);
      });

      mockAppliedExerciseRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(ExerciseGroupModel);
      expect(result!.appliedExercises).toHaveLength(0);
      expect(mockAppliedExerciseRepo.findByIds).toHaveBeenCalledWith([]);
    });
  });

  describe('findByIds', () => {
    it('should return array of ExerciseGroupModels for existing groups', async () => {
      // Arrange
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();
      const appliedExercise3 = createTestAppliedExerciseModel();

      const testData1 = createTestExerciseGroupData({ appliedExerciseIds: [appliedExercise1.id] });
      const testData2 = createTestExerciseGroupData({
        appliedExerciseIds: [appliedExercise2.id, appliedExercise3.id],
      });
      await testDb.write(async () => {
        await testDb.exerciseGroups.bulkPut([testData1, testData2]);
      });

      mockAppliedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([appliedExercise1, appliedExercise2, appliedExercise3]);

      // Act
      const result = await repository.findByIds([testData1.id, testData2.id]);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((group) => {
        expect(group).toBeInstanceOf(ExerciseGroupModel);
      });

      // Check first group
      const group1 = result.find((g) => g.id === testData1.id);
      expect(group1).toBeDefined();
      expect(group1!.appliedExercises).toHaveLength(1);
      expect(group1!.appliedExercises[0].id).toBe(appliedExercise1.id);

      // Check second group
      const group2 = result.find((g) => g.id === testData2.id);
      expect(group2).toBeDefined();
      expect(group2!.appliedExercises).toHaveLength(2);

      // Verify all applied exercises were fetched once
      expect(mockAppliedExerciseRepo.findByIds).toHaveBeenCalledWith([
        appliedExercise1.id,
        appliedExercise2.id,
        appliedExercise3.id,
      ]);
    });

    it('should filter out undefined results for non-existent groups', async () => {
      // Arrange
      const appliedExercise1 = createTestAppliedExerciseModel();
      const testData1 = createTestExerciseGroupData({ appliedExerciseIds: [appliedExercise1.id] });
      await testDb.write(async () => {
        await testDb.exerciseGroups.put(testData1);
      });
      const nonExistentId = 'non-existent-id';

      mockAppliedExerciseRepo.findByIds = vi.fn().mockResolvedValue([appliedExercise1]);

      // Act
      const result = await repository.findByIds([testData1.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ExerciseGroupModel);
      expect(result[0].id).toBe(testData1.id);
    });

    it('should return empty array when no groups exist', async () => {
      // Arrange
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(nonExistentIds);

      // Assert
      expect(result).toEqual([]);
      expect(mockAppliedExerciseRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all groups for a profile as ExerciseGroupModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();

      const testData1 = createTestExerciseGroupData({
        profileId,
        appliedExerciseIds: [appliedExercise1.id],
      });
      const testData2 = createTestExerciseGroupData({
        profileId,
        appliedExerciseIds: [appliedExercise2.id],
      });
      const testData3 = createTestExerciseGroupData({
        profileId: otherProfileId,
        appliedExerciseIds: [],
      });
      await testDb.write(async () => {
        await testDb.exerciseGroups.bulkPut([testData1, testData2, testData3]);
      });

      mockAppliedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([appliedExercise1, appliedExercise2]);

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((group) => {
        expect(group).toBeInstanceOf(ExerciseGroupModel);
        expect(group.profileId).toBe(profileId);
      });
      expect(result.map((g) => g.id)).toContain(testData1.id);
      expect(result.map((g) => g.id)).toContain(testData2.id);
      expect(result.map((g) => g.id)).not.toContain(testData3.id);
    });

    it('should return empty array when no groups exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
      expect(mockAppliedExerciseRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete group and all its applied exercises from the database', async () => {
      // Arrange
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();
      const groupModel = createTestExerciseGroupModel({}, [appliedExercise1, appliedExercise2]);

      const testData = groupModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.exerciseGroups.put(testData);
      });

      mockAppliedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([appliedExercise1, appliedExercise2]);
      mockAppliedExerciseRepo.delete = vi.fn().mockResolvedValue(undefined);

      // Verify group exists before deletion
      const beforeDelete = await testDb.exerciseGroups.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.exerciseGroups.get(testData.id);
      expect(afterDelete).toBeUndefined();

      // Verify applied exercises were deleted
      expect(mockAppliedExerciseRepo.delete).toHaveBeenCalledTimes(2);
      expect(mockAppliedExerciseRepo.delete).toHaveBeenCalledWith(appliedExercise1.id, true);
      expect(mockAppliedExerciseRepo.delete).toHaveBeenCalledWith(appliedExercise2.id, true);
    });

    it('should not throw error when deleting non-existent group', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
      expect(mockAppliedExerciseRepo.delete).not.toHaveBeenCalled();
    });

    it('should handle groups with no applied exercises', async () => {
      // Arrange
      const groupModel = createTestExerciseGroupModel({}, []);
      const testData = groupModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.exerciseGroups.put(testData);
      });

      mockAppliedExerciseRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.exerciseGroups.get(testData.id);
      expect(afterDelete).toBeUndefined();
      expect(mockAppliedExerciseRepo.delete).not.toHaveBeenCalled();
    });
  });
});
