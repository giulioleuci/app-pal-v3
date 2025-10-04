import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import {
  createTestPerformedExerciseLogModel,
  createTestPerformedGroupData,
  createTestPerformedGroupLogModel,
} from '@/test-factories';

import { IPerformedExerciseRepository } from '../domain/IPerformedExerciseRepository';
import { PerformedGroupLogModel } from '../domain/PerformedGroupLogModel';
import { PerformedGroupRepository } from './PerformedGroupRepository';

// Mock the injected repository interface
vi.mock('../domain/IPerformedExerciseRepository');

describe('PerformedGroupRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: PerformedGroupRepository;
  let mockPerformedExerciseRepo: IPerformedExerciseRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();

    // Create mock
    mockPerformedExerciseRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    repository = new PerformedGroupRepository(mockPerformedExerciseRepo, testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a PerformedGroupLogModel and all its performed exercises to the database', async () => {
      // Arrange
      const performedExercise1 = createTestPerformedExerciseLogModel();
      const performedExercise2 = createTestPerformedExerciseLogModel();
      const groupModel = createTestPerformedGroupLogModel({}, [
        performedExercise1,
        performedExercise2,
      ]);

      mockPerformedExerciseRepo.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.save(groupModel);

      // Assert
      expect(result).toBe(groupModel);

      // Verify group data was persisted
      const savedData = await testDb.performedGroups.get(groupModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(groupModel.id);
      expect(savedData!.profileId).toBe(groupModel.profileId);
      expect(savedData!.plannedGroupId).toBe(groupModel.plannedGroupId);
      expect(savedData!.type).toBe(groupModel.type);
      expect(savedData!.performedExerciseLogIds).toEqual(
        groupModel.performedExercises.map((e) => e.id)
      );
      expect(savedData!.actualRestSeconds).toBe(groupModel.actualRestSeconds);

      // Verify performed exercises were saved via repository
      expect(mockPerformedExerciseRepo.save).toHaveBeenCalledTimes(2);
      expect(mockPerformedExerciseRepo.save).toHaveBeenCalledWith(performedExercise1, true);
      expect(mockPerformedExerciseRepo.save).toHaveBeenCalledWith(performedExercise2, true);
    });

    it('should handle groups with no performed exercises', async () => {
      // Arrange
      const groupModel = createTestPerformedGroupLogModel({}, []);

      // Act
      const result = await repository.save(groupModel);

      // Assert
      expect(result).toBe(groupModel);

      // Verify group data was persisted
      const savedData = await testDb.performedGroups.get(groupModel.id);
      expect(savedData).toBeDefined();

      // Verify no performed exercises were saved
      expect(mockPerformedExerciseRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a PerformedGroupLogModel when group exists', async () => {
      // Arrange
      const performedExercise1 = createTestPerformedExerciseLogModel();
      const performedExercise2 = createTestPerformedExerciseLogModel();
      const testData = createTestPerformedGroupData({
        performedExerciseLogIds: [performedExercise1.id, performedExercise2.id],
      });
      await testDb.write(async () => {
        await testDb.performedGroups.put(testData);
      });

      mockPerformedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([performedExercise1, performedExercise2]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(PerformedGroupLogModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.plannedGroupId).toBe(testData.plannedGroupId);
      expect(result!.type).toBe(testData.type);
      expect(result!.performedExercises).toHaveLength(2);
      expect(result!.performedExercises).toContain(performedExercise1);
      expect(result!.performedExercises).toContain(performedExercise2);
      expect(result!.actualRestSeconds).toBe(testData.actualRestSeconds);

      // Verify performed exercises were fetched
      expect(mockPerformedExerciseRepo.findByIds).toHaveBeenCalledWith([
        performedExercise1.id,
        performedExercise2.id,
      ]);
    });

    it('should return undefined when group does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockPerformedExerciseRepo.findByIds).not.toHaveBeenCalled();
    });

    it('should handle groups with no performed exercises', async () => {
      // Arrange
      const testData = createTestPerformedGroupData({ performedExerciseLogIds: [] });
      await testDb.write(async () => {
        await testDb.performedGroups.put(testData);
      });

      mockPerformedExerciseRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(PerformedGroupLogModel);
      expect(result!.performedExercises).toHaveLength(0);
      expect(mockPerformedExerciseRepo.findByIds).toHaveBeenCalledWith([]);
    });
  });

  describe('findByIds', () => {
    it('should return array of PerformedGroupLogModels for existing groups', async () => {
      // Arrange
      const performedExercise1 = createTestPerformedExerciseLogModel();
      const performedExercise2 = createTestPerformedExerciseLogModel();
      const performedExercise3 = createTestPerformedExerciseLogModel();

      const testData1 = createTestPerformedGroupData({
        performedExerciseLogIds: [performedExercise1.id],
      });
      const testData2 = createTestPerformedGroupData({
        performedExerciseLogIds: [performedExercise2.id, performedExercise3.id],
      });
      await testDb.write(async () => {
        await testDb.performedGroups.bulkPut([testData1, testData2]);
      });

      mockPerformedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([performedExercise1, performedExercise2, performedExercise3]);

      // Act
      const result = await repository.findByIds([testData1.id, testData2.id]);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((group) => {
        expect(group).toBeInstanceOf(PerformedGroupLogModel);
      });

      // Check first group
      const group1 = result.find((g) => g.id === testData1.id);
      expect(group1).toBeDefined();
      expect(group1!.performedExercises).toHaveLength(1);
      expect(group1!.performedExercises[0].id).toBe(performedExercise1.id);

      // Check second group
      const group2 = result.find((g) => g.id === testData2.id);
      expect(group2).toBeDefined();
      expect(group2!.performedExercises).toHaveLength(2);

      // Verify all performed exercises were fetched once
      expect(mockPerformedExerciseRepo.findByIds).toHaveBeenCalledWith([
        performedExercise1.id,
        performedExercise2.id,
        performedExercise3.id,
      ]);
    });

    it('should filter out undefined results for non-existent groups', async () => {
      // Arrange
      const performedExercise1 = createTestPerformedExerciseLogModel();
      const testData1 = createTestPerformedGroupData({
        performedExerciseLogIds: [performedExercise1.id],
      });
      await testDb.write(async () => {
        await testDb.performedGroups.put(testData1);
      });
      const nonExistentId = 'non-existent-id';

      mockPerformedExerciseRepo.findByIds = vi.fn().mockResolvedValue([performedExercise1]);

      // Act
      const result = await repository.findByIds([testData1.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerformedGroupLogModel);
      expect(result[0].id).toBe(testData1.id);
    });

    it('should return empty array when no groups exist', async () => {
      // Arrange
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(nonExistentIds);

      // Assert
      expect(result).toEqual([]);
      expect(mockPerformedExerciseRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all performed groups for a profile as PerformedGroupLogModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';
      const performedExercise1 = createTestPerformedExerciseLogModel();
      const performedExercise2 = createTestPerformedExerciseLogModel();

      const testData1 = createTestPerformedGroupData({
        profileId,
        performedExerciseLogIds: [performedExercise1.id],
      });
      const testData2 = createTestPerformedGroupData({
        profileId,
        performedExerciseLogIds: [performedExercise2.id],
      });
      const testData3 = createTestPerformedGroupData({
        profileId: otherProfileId,
        performedExerciseLogIds: [],
      });
      await testDb.write(async () => {
        await testDb.performedGroups.bulkPut([testData1, testData2, testData3]);
      });

      mockPerformedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([performedExercise1, performedExercise2]);

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((group) => {
        expect(group).toBeInstanceOf(PerformedGroupLogModel);
        expect(group.profileId).toBe(profileId);
      });
      expect(result.map((g) => g.id)).toContain(testData1.id);
      expect(result.map((g) => g.id)).toContain(testData2.id);
      expect(result.map((g) => g.id)).not.toContain(testData3.id);
    });

    it('should return empty array when no performed groups exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
      expect(mockPerformedExerciseRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete performed group and all its performed exercises from the database', async () => {
      // Arrange
      const performedExercise1 = createTestPerformedExerciseLogModel();
      const performedExercise2 = createTestPerformedExerciseLogModel();
      const groupModel = createTestPerformedGroupLogModel({}, [
        performedExercise1,
        performedExercise2,
      ]);

      const testData = groupModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.performedGroups.put(testData);
      });

      mockPerformedExerciseRepo.findByIds = vi
        .fn()
        .mockResolvedValue([performedExercise1, performedExercise2]);
      mockPerformedExerciseRepo.delete = vi.fn().mockResolvedValue(undefined);

      // Verify group exists before deletion
      const beforeDelete = await testDb.performedGroups.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.performedGroups.get(testData.id);
      expect(afterDelete).toBeUndefined();

      // Verify performed exercises were deleted
      expect(mockPerformedExerciseRepo.delete).toHaveBeenCalledTimes(2);
      expect(mockPerformedExerciseRepo.delete).toHaveBeenCalledWith(performedExercise1.id, true);
      expect(mockPerformedExerciseRepo.delete).toHaveBeenCalledWith(performedExercise2.id, true);
    });

    it('should not throw error when deleting non-existent performed group', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
      expect(mockPerformedExerciseRepo.delete).not.toHaveBeenCalled();
    });

    it('should handle performed groups with no performed exercises', async () => {
      // Arrange
      const groupModel = createTestPerformedGroupLogModel({}, []);
      const testData = groupModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.performedGroups.put(testData);
      });

      mockPerformedExerciseRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.performedGroups.get(testData.id);
      expect(afterDelete).toBeUndefined();
      expect(mockPerformedExerciseRepo.delete).not.toHaveBeenCalled();
    });
  });
});
