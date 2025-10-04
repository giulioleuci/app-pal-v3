import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { generateId } from '@/lib';
import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestMaxLogData, createTestMaxLogModel } from '@/test-factories';

import { MaxLogRepository } from '../MaxLogRepository';

/**
 * Integration tests for MaxLogRepository.
 * Tests the complete flow of data persistence, retrieval, and hydration/dehydration
 * between MaxLogModel domain objects and the database layer.
 */
describe('MaxLogRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: MaxLogRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new MaxLogRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a MaxLogModel to the database', async () => {
      // Arrange
      const maxLogModel = createTestMaxLogModel();

      // Act
      const result = await repository.save(maxLogModel);

      // Assert
      expect(result).toBe(maxLogModel);

      // Verify data was persisted correctly
      const savedData = await testDb.maxLogs.get(maxLogModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(maxLogModel.id);
      expect(savedData!.profileId).toBe(maxLogModel.profileId);
      expect(savedData!.exerciseId).toBe(maxLogModel.exerciseId);
      expect(savedData!.weightEnteredByUser).toBe(maxLogModel.weightEnteredByUser);
      expect(savedData!.reps).toBe(maxLogModel.reps);
      expect(savedData!.date).toEqual(maxLogModel.date);
      expect(savedData!.estimated1RM).toBe(maxLogModel.estimated1RM);
      expect(savedData!.maxBrzycki).toBe(maxLogModel.maxBrzycki);
      expect(savedData!.maxBaechle).toBe(maxLogModel.maxBaechle);
      expect(savedData!.notes).toBe(maxLogModel.notes);
      expect(savedData!.createdAt).toEqual(maxLogModel.createdAt);
      expect(savedData!.updatedAt).toEqual(maxLogModel.updatedAt);
    });

    it('should update existing max log when saving with same id', async () => {
      // Arrange
      const originalData = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 5,
        notes: 'Original notes',
      });

      // Create original record using proper WatermelonDB transaction
      await testDb.write(async () => {
        await testDb.maxLogs.put(originalData);
      });

      const updatedModel = MaxLogModel.hydrate({
        ...originalData,
        weightEnteredByUser: 110,
        reps: 3,
        notes: 'Updated notes',
      });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const savedData = await testDb.maxLogs.get(originalData.id);
      expect(savedData).toBeDefined();
      expect(savedData!.weightEnteredByUser).toBe(110);
      expect(savedData!.reps).toBe(3);
      expect(savedData!.notes).toBe('Updated notes');
      expect(savedData!.id).toBe(originalData.id);
    });

    it('should correctly dehydrate complex domain model to plain data', async () => {
      // Arrange
      const maxLogModel = createTestMaxLogModel({
        weightEnteredByUser: 80,
        reps: 6,
        notes: 'Test workout session',
      });

      // Act
      await repository.save(maxLogModel);

      // Assert
      const savedData = await testDb.maxLogs.get(maxLogModel.id);
      expect(savedData).toBeDefined();

      // Verify all calculated fields are persisted
      expect(savedData!.estimated1RM).toBeGreaterThan(0);
      expect(savedData!.maxBrzycki).toBeGreaterThan(0);
      expect(savedData!.maxBaechle).toBeGreaterThan(0);
      expect(typeof savedData!.estimated1RM).toBe('number');
      expect(typeof savedData!.maxBrzycki).toBe('number');
      expect(typeof savedData!.maxBaechle).toBe('number');
    });
  });

  describe('findById', () => {
    it('should return a MaxLogModel when max log exists', async () => {
      // Arrange
      const testData = createTestMaxLogData();
      await testDb.write(async () => {
        await testDb.maxLogs.put(testData);
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(MaxLogModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(testData.profileId);
      expect(result!.exerciseId).toBe(testData.exerciseId);
      expect(result!.weightEnteredByUser).toBe(testData.weightEnteredByUser);
      expect(result!.reps).toBe(testData.reps);
      expect(result!.date).toEqual(testData.date);
      expect(result!.estimated1RM).toBe(testData.estimated1RM);
      expect(result!.maxBrzycki).toBe(testData.maxBrzycki);
      expect(result!.maxBaechle).toBe(testData.maxBaechle);
      expect(result!.notes).toBe(testData.notes);
      expect(result!.createdAt).toEqual(testData.createdAt);
      expect(result!.updatedAt).toEqual(testData.updatedAt);
    });

    it('should return undefined when max log does not exist', async () => {
      // Arrange
      const nonExistentId = generateId();

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should correctly hydrate domain model with business logic', async () => {
      // Arrange
      const testData = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 1,
      });
      await testDb.write(async () => {
        await testDb.maxLogs.put(testData);
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(MaxLogModel);
      expect(result!.isDirect1RM()).toBe(true);
      expect(result!.getPrimaryEstimate()).toBe(result!.estimated1RM);
      expect(typeof result!.getSummaryString()).toBe('string');
    });
  });

  describe('findAll', () => {
    it('should return all max logs for a given profile ID', async () => {
      // Arrange
      const profileId = generateId();
      const otherProfileId = generateId();

      const testData1 = createTestMaxLogData({ profileId });
      const testData2 = createTestMaxLogData({ profileId });
      const testData3 = createTestMaxLogData({ profileId: otherProfileId });

      await testDb.write(async () => {
        await testDb.maxLogs.bulkPut([testData1, testData2, testData3]);
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log instanceof MaxLogModel)).toBe(true);
      expect(result.every((log) => log.profileId === profileId)).toBe(true);

      const resultIds = result.map((log) => log.id);
      expect(resultIds).toContain(testData1.id);
      expect(resultIds).toContain(testData2.id);
      expect(resultIds).not.toContain(testData3.id);
    });

    it('should return empty array when no max logs exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = generateId();

      // Act
      const result = await repository.findAll(nonExistentProfileId);

      // Assert
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should correctly hydrate all returned models', async () => {
      // Arrange
      const profileId = generateId();
      const testData1 = createTestMaxLogData({ profileId, weightEnteredByUser: 80, reps: 5 });
      const testData2 = createTestMaxLogData({ profileId, weightEnteredByUser: 100, reps: 1 });

      await testDb.write(async () => {
        await testDb.maxLogs.bulkPut([testData1, testData2]);
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MaxLogModel);
      expect(result[1]).toBeInstanceOf(MaxLogModel);

      // Verify business logic methods work
      const directMaxLog = result.find((log) => log.reps === 1);
      const estimatedMaxLog = result.find((log) => log.reps === 5);

      expect(directMaxLog!.isDirect1RM()).toBe(true);
      expect(estimatedMaxLog!.isDirect1RM()).toBe(false);
    });
  });

  describe('findLatestByExercise', () => {
    it('should return latest max log for each exercise', async () => {
      // Arrange
      const profileId = generateId();
      const exerciseId1 = generateId();
      const exerciseId2 = generateId();

      const oldDate = new Date('2023-01-01');
      const recentDate = new Date('2023-06-01');
      const latestDate = new Date('2023-12-01');

      const logs = [
        createTestMaxLogData({
          profileId,
          exerciseId: exerciseId1,
          date: oldDate,
          weightEnteredByUser: 80,
        }),
        createTestMaxLogData({
          profileId,
          exerciseId: exerciseId1,
          date: latestDate,
          weightEnteredByUser: 100,
        }),
        createTestMaxLogData({
          profileId,
          exerciseId: exerciseId1,
          date: recentDate,
          weightEnteredByUser: 90,
        }),
        createTestMaxLogData({
          profileId,
          exerciseId: exerciseId2,
          date: recentDate,
          weightEnteredByUser: 120,
        }),
      ];

      await testDb.write(async () => {
        await testDb.maxLogs.bulkPut(logs);
      });

      // Act
      const result = await repository.findLatestByExercise(profileId);

      // Assert
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);

      const exercise1Latest = result.get(exerciseId1);
      const exercise2Latest = result.get(exerciseId2);

      expect(exercise1Latest).toBeInstanceOf(MaxLogModel);
      expect(exercise1Latest!.date).toEqual(latestDate);
      expect(exercise1Latest!.weightEnteredByUser).toBe(100);

      expect(exercise2Latest).toBeInstanceOf(MaxLogModel);
      expect(exercise2Latest!.date).toEqual(recentDate);
      expect(exercise2Latest!.weightEnteredByUser).toBe(120);
    });

    it('should return empty map when no max logs exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = generateId();

      // Act
      const result = await repository.findLatestByExercise(nonExistentProfileId);

      // Assert
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should handle single max log per exercise correctly', async () => {
      // Arrange
      const profileId = generateId();
      const exerciseId = generateId();

      const testData = createTestMaxLogData({ profileId, exerciseId });
      await testDb.write(async () => {
        await testDb.maxLogs.put(testData);
      });

      // Act
      const result = await repository.findLatestByExercise(profileId);

      // Assert
      expect(result.size).toBe(1);
      const latestLog = result.get(exerciseId);
      expect(latestLog).toBeInstanceOf(MaxLogModel);
      expect(latestLog!.id).toBe(testData.id);
    });

    it('should correctly filter by profile ID when finding latest', async () => {
      // Arrange
      const profileId1 = generateId();
      const profileId2 = generateId();
      const exerciseId = generateId();

      const profile1Log = createTestMaxLogData({
        profileId: profileId1,
        exerciseId,
        date: new Date('2023-06-01'),
        weightEnteredByUser: 100,
      });
      const profile2Log = createTestMaxLogData({
        profileId: profileId2,
        exerciseId,
        date: new Date('2023-12-01'),
        weightEnteredByUser: 120,
      });

      await testDb.write(async () => {
        await testDb.maxLogs.bulkPut([profile1Log, profile2Log]);
      });

      // Act
      const result1 = await repository.findLatestByExercise(profileId1);
      const result2 = await repository.findLatestByExercise(profileId2);

      // Assert
      expect(result1.size).toBe(1);
      expect(result2.size).toBe(1);

      expect(result1.get(exerciseId)!.weightEnteredByUser).toBe(100);
      expect(result2.get(exerciseId)!.weightEnteredByUser).toBe(120);
    });
  });

  describe('delete', () => {
    it('should remove max log from database', async () => {
      // Arrange
      const testData = createTestMaxLogData();
      await testDb.write(async () => {
        await testDb.maxLogs.put(testData);
      });

      // Verify it exists
      const existsBefore = await testDb.maxLogs.get(testData.id);
      expect(existsBefore).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert
      const existsAfter = await testDb.maxLogs.get(testData.id);
      expect(existsAfter).toBeUndefined();
    });

    it('should not throw error when deleting non-existent max log', async () => {
      // Arrange
      const nonExistentId = generateId();

      // Act & Assert - should not throw
      await expect(repository.delete(nonExistentId)).resolves.toBeUndefined();
    });

    it('should only delete specified max log', async () => {
      // Arrange
      const testData1 = createTestMaxLogData();
      const testData2 = createTestMaxLogData();
      await testDb.write(async () => {
        await testDb.maxLogs.bulkPut([testData1, testData2]);
      });

      // Act
      await repository.delete(testData1.id);

      // Assert
      const deleted = await testDb.maxLogs.get(testData1.id);
      const remaining = await testDb.maxLogs.get(testData2.id);

      expect(deleted).toBeUndefined();
      expect(remaining).toBeDefined();
      expect(remaining!.id).toBe(testData2.id);
    });
  });

  describe('repository interface compliance', () => {
    it('should implement all IMaxLogRepository methods', () => {
      // Assert
      expect(typeof repository.save).toBe('function');
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.findAll).toBe('function');
      expect(typeof repository.findLatestByExercise).toBe('function');
      expect(typeof repository.delete).toBe('function');
    });

    it('should accept database dependency injection', () => {
      // Arrange & Act
      const customDb = createTestDatabase();
      const customRepository = new MaxLogRepository(customDb);

      // Assert
      expect(customRepository).toBeInstanceOf(MaxLogRepository);
    });
  });

  describe('data integrity and validation', () => {
    it('should preserve Date objects through save/load cycle', async () => {
      // Arrange
      const specificDate = new Date('2023-08-15T10:30:00.000Z');
      const maxLogModel = createTestMaxLogModel({ date: specificDate });

      // Act
      await repository.save(maxLogModel);
      const retrieved = await repository.findById(maxLogModel.id);

      // Assert
      expect(retrieved!.date).toEqual(specificDate);
      expect(retrieved!.date).toBeInstanceOf(Date);
    });

    it('should handle optional notes field correctly', async () => {
      // Arrange
      const withNotes = createTestMaxLogModel({ notes: 'Test notes' });
      const withoutNotes = createTestMaxLogModel({ notes: undefined });

      // Act
      await repository.save(withNotes);
      await repository.save(withoutNotes);

      const retrievedWithNotes = await repository.findById(withNotes.id);
      const retrievedWithoutNotes = await repository.findById(withoutNotes.id);

      // Assert
      expect(retrievedWithNotes!.notes).toBe('Test notes');
      expect(retrievedWithoutNotes!.notes).toBeUndefined();
    });

    it('should preserve numeric precision for weight and calculations', async () => {
      // Arrange
      const preciseWeight = 82.75;
      const maxLogModel = createTestMaxLogModel({ weightEnteredByUser: preciseWeight });

      // Act
      await repository.save(maxLogModel);
      const retrieved = await repository.findById(maxLogModel.id);

      // Assert
      expect(retrieved!.weightEnteredByUser).toBe(preciseWeight);
      expect(typeof retrieved!.estimated1RM).toBe('number');
      expect(retrieved!.estimated1RM).toBeGreaterThan(0);
    });
  });
});
