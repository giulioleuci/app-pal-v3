import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import {
  createTestExerciseGroupModel,
  createTestSessionModel,
  createTestWorkoutSessionData,
} from '@/test-factories';

import { IAppliedExerciseRepository } from '../domain/IAppliedExerciseRepository';
import { IExerciseGroupRepository } from '../domain/IExerciseGroupRepository';
import { SessionModel } from '../domain/SessionModel';
import { WorkoutSessionRepository } from './WorkoutSessionRepository';

// Mock the injected repository interfaces
vi.mock('../domain/IExerciseGroupRepository');
vi.mock('../domain/IAppliedExerciseRepository');

describe('WorkoutSessionRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: WorkoutSessionRepository;
  let mockExerciseGroupRepo: IExerciseGroupRepository;
  let mockAppliedExerciseRepo: IAppliedExerciseRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();

    // Create mocks
    mockExerciseGroupRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockAppliedExerciseRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    repository = new WorkoutSessionRepository(
      mockExerciseGroupRepo,
      mockAppliedExerciseRepo,
      testDb
    );
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a SessionModel and all its groups to the database', async () => {
      // Arrange
      const group1 = createTestExerciseGroupModel();
      const group2 = createTestExerciseGroupModel();
      const sessionModel = createTestSessionModel({}, [group1, group2]);

      mockExerciseGroupRepo.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.save(sessionModel);

      // Assert
      expect(result).toBe(sessionModel);

      // Verify session data was persisted
      const savedData = await testDb.workoutSessions.get(sessionModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(sessionModel.id);
      expect(savedData!.profileId).toBe(sessionModel.profileId);
      expect(savedData!.name).toBe(sessionModel.name);
      expect(savedData!.groupIds).toEqual(sessionModel.groups.map((g) => g.id));
      expect(savedData!.notes).toBe(sessionModel.notes);
      expect(savedData!.executionCount).toBe(sessionModel.executionCount);
      expect(savedData!.isDeload).toBe(sessionModel.isDeload);
      expect(savedData!.dayOfWeek).toBe(sessionModel.dayOfWeek);

      // Verify groups were saved via repository with transaction context
      expect(mockExerciseGroupRepo.save).toHaveBeenCalledTimes(2);
      expect(mockExerciseGroupRepo.save).toHaveBeenCalledWith(group1, true);
      expect(mockExerciseGroupRepo.save).toHaveBeenCalledWith(group2, true);
    });

    it('should handle sessions with no groups', async () => {
      // Arrange
      const sessionModel = createTestSessionModel({}, []);

      // Act
      const result = await repository.save(sessionModel);

      // Assert
      expect(result).toBe(sessionModel);

      // Verify session data was persisted
      const savedData = await testDb.workoutSessions.get(sessionModel.id);
      expect(savedData).toBeDefined();

      // Verify no groups were saved
      expect(mockExerciseGroupRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a SessionModel when session exists', async () => {
      // Arrange
      const group1 = createTestExerciseGroupModel();
      const group2 = createTestExerciseGroupModel();
      const testData = createTestWorkoutSessionData({
        groupIds: [group1.id, group2.id],
      });
      await testDb.write(async () => {
        await testDb.workoutSessions.put(testData);
      });

      mockExerciseGroupRepo.findByIds = vi.fn().mockResolvedValue([group1, group2]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(SessionModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.name).toBe(testData.name);
      expect(result!.groups).toHaveLength(2);
      expect(result!.groups).toContain(group1);
      expect(result!.groups).toContain(group2);

      // Verify groups were fetched
      expect(mockExerciseGroupRepo.findByIds).toHaveBeenCalledWith([group1.id, group2.id]);
    });

    it('should return undefined when session does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockExerciseGroupRepo.findByIds).not.toHaveBeenCalled();
    });

    it('should handle sessions with no groups', async () => {
      // Arrange
      const testData = createTestWorkoutSessionData({ groupIds: [] });
      await testDb.write(async () => {
        await testDb.workoutSessions.put(testData);
      });

      mockExerciseGroupRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(SessionModel);
      expect(result!.groups).toHaveLength(0);
      expect(mockExerciseGroupRepo.findByIds).toHaveBeenCalledWith([]);
    });
  });

  describe('findByIds', () => {
    it('should return array of SessionModels for existing sessions', async () => {
      // Arrange
      const group1 = createTestExerciseGroupModel();
      const group2 = createTestExerciseGroupModel();
      const group3 = createTestExerciseGroupModel();

      const testData1 = createTestWorkoutSessionData({ groupIds: [group1.id] });
      const testData2 = createTestWorkoutSessionData({ groupIds: [group2.id, group3.id] });
      await testDb.write(async () => {
        await testDb.workoutSessions.bulkPut([testData1, testData2]);
      });

      mockExerciseGroupRepo.findByIds = vi.fn().mockResolvedValue([group1, group2, group3]);

      // Act
      const result = await repository.findByIds([testData1.id, testData2.id]);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((session) => {
        expect(session).toBeInstanceOf(SessionModel);
      });

      // Check first session
      const session1 = result.find((s) => s.id === testData1.id);
      expect(session1).toBeDefined();
      expect(session1!.groups).toHaveLength(1);
      expect(session1!.groups[0].id).toBe(group1.id);

      // Check second session
      const session2 = result.find((s) => s.id === testData2.id);
      expect(session2).toBeDefined();
      expect(session2!.groups).toHaveLength(2);

      // Verify all groups were fetched once
      expect(mockExerciseGroupRepo.findByIds).toHaveBeenCalledWith([
        group1.id,
        group2.id,
        group3.id,
      ]);
    });

    it('should filter out undefined results for non-existent sessions', async () => {
      // Arrange
      const group1 = createTestExerciseGroupModel();
      const testData1 = createTestWorkoutSessionData({ groupIds: [group1.id] });
      await testDb.write(async () => {
        await testDb.workoutSessions.put(testData1);
      });
      const nonExistentId = 'non-existent-id';

      mockExerciseGroupRepo.findByIds = vi.fn().mockResolvedValue([group1]);

      // Act
      const result = await repository.findByIds([testData1.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SessionModel);
      expect(result[0].id).toBe(testData1.id);
    });

    it('should return empty array when no sessions exist', async () => {
      // Arrange
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(nonExistentIds);

      // Assert
      expect(result).toEqual([]);
      expect(mockExerciseGroupRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all sessions for a profile as SessionModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';
      const group1 = createTestExerciseGroupModel();
      const group2 = createTestExerciseGroupModel();

      const testData1 = createTestWorkoutSessionData({ profileId, groupIds: [group1.id] });
      const testData2 = createTestWorkoutSessionData({ profileId, groupIds: [group2.id] });
      const testData3 = createTestWorkoutSessionData({ profileId: otherProfileId, groupIds: [] });
      await testDb.write(async () => {
        await testDb.workoutSessions.bulkPut([testData1, testData2, testData3]);
      });

      mockExerciseGroupRepo.findByIds = vi.fn().mockResolvedValue([group1, group2]);

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((session) => {
        expect(session).toBeInstanceOf(SessionModel);
        expect(session.profileId).toBe(profileId);
      });
      expect(result.map((s) => s.id)).toContain(testData1.id);
      expect(result.map((s) => s.id)).toContain(testData2.id);
      expect(result.map((s) => s.id)).not.toContain(testData3.id);
    });

    it('should return empty array when no sessions exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
      expect(mockExerciseGroupRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete session and all its groups from the database', async () => {
      // Arrange
      const group1 = createTestExerciseGroupModel();
      const group2 = createTestExerciseGroupModel();
      const sessionModel = createTestSessionModel({}, [group1, group2]);

      const testData = sessionModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.workoutSessions.put(testData);
      });

      mockExerciseGroupRepo.findByIds = vi.fn().mockResolvedValue([group1, group2]);
      mockExerciseGroupRepo.delete = vi.fn().mockResolvedValue(undefined);

      // Verify session exists before deletion
      const beforeDelete = await testDb.workoutSessions.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.workoutSessions.get(testData.id);
      expect(afterDelete).toBeUndefined();

      // Verify groups were deleted
      expect(mockExerciseGroupRepo.delete).toHaveBeenCalledTimes(2);
      expect(mockExerciseGroupRepo.delete).toHaveBeenCalledWith(group1.id, true);
      expect(mockExerciseGroupRepo.delete).toHaveBeenCalledWith(group2.id, true);
    });

    it('should not throw error when deleting non-existent session', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
      expect(mockExerciseGroupRepo.delete).not.toHaveBeenCalled();
    });

    it('should handle sessions with no groups', async () => {
      // Arrange
      const sessionModel = createTestSessionModel({}, []);
      const testData = sessionModel.toPlainObject();
      await testDb.write(async () => {
        await testDb.workoutSessions.put(testData);
      });

      mockExerciseGroupRepo.findByIds = vi.fn().mockResolvedValue([]);

      // Act
      await repository.delete(testData.id);

      // Assert
      const afterDelete = await testDb.workoutSessions.get(testData.id);
      expect(afterDelete).toBeUndefined();
      expect(mockExerciseGroupRepo.delete).not.toHaveBeenCalled();
    });
  });
});
