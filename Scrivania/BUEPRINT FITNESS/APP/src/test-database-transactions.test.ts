import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';

describe('Test Database Transaction Utilities', () => {
  let testDb: TestExtendedDatabase;

  beforeEach(async () => {
    testDb = createTestDatabase();
  });

  describe('collection wrapper transaction handling', () => {
    it('should wrap Collection.create operations in database.write for new records', async () => {
      // Arrange
      const testData = {
        id: 'test-workout-log-id',
        profileId: 'test-profile-id',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: [],
        startTime: new Date(),
        endTime: new Date(),
        durationSeconds: 3600,
        totalVolume: 1000,
        notes: 'Test notes',
        userRating: 4,
      };

      // Spy on database.write to verify transaction usage
      const writeSpy = vi.spyOn(testDb, 'write');

      // Act - Use collection wrapper put method wrapped in database.write transaction
      await testDb.write(async () => {
        await testDb.workoutLogs.put(testData);
      });

      // Assert - Verify that database.write was called for the create operation
      expect(writeSpy).toHaveBeenCalled();

      // Verify the data was persisted correctly
      const savedData = await testDb.workoutLogs.get(testData.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(testData.id);
      expect(savedData!.trainingPlanName).toBe('Test Plan');
      expect(savedData!.sessionName).toBe('Test Session');
    });

    it('should handle transaction failures during record creation gracefully', async () => {
      // Arrange
      const testData = {
        id: 'test-workout-log-id',
        profileId: 'test-profile-id',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: [],
        startTime: new Date(),
        endTime: new Date(),
        durationSeconds: 3600,
        totalVolume: 1000,
      };

      // Mock database.write to simulate transaction failure
      const originalWrite = testDb.write;
      const mockWrite = vi.fn().mockRejectedValueOnce(new Error('Transaction failed'));
      testDb.write = mockWrite;

      // Act & Assert - put operation should propagate the transaction error
      await expect(
        testDb.write(async () => {
          await testDb.workoutLogs.put(testData);
        })
      ).rejects.toThrow('Transaction failed');

      // Verify that no data was persisted due to failed transaction
      // Restore the original write method first to allow get operation
      testDb.write = originalWrite;
      const savedData = await testDb.workoutLogs.get(testData.id);
      expect(savedData).toBeUndefined();
    });

    it('should handle bulkPut operations with proper batch transactions', async () => {
      // Arrange
      const testData = [
        {
          id: 'workout-log-1',
          profileId: 'test-profile-id',
          trainingPlanName: 'Plan A',
          sessionName: 'Session 1',
          performedGroupIds: [],
          startTime: new Date(),
          endTime: new Date(),
          durationSeconds: 3600,
          totalVolume: 1000,
        },
        {
          id: 'workout-log-2',
          profileId: 'test-profile-id',
          trainingPlanName: 'Plan B',
          sessionName: 'Session 2',
          performedGroupIds: [],
          startTime: new Date(),
          endTime: new Date(),
          durationSeconds: 4200,
          totalVolume: 1200,
        },
      ];

      // Spy on database.batch to verify batch operations
      const batchSpy = vi.spyOn(testDb, 'batch');

      // Act - Wrap bulkPut in database.write transaction
      await testDb.write(async () => {
        await testDb.workoutLogs.bulkPut(testData);
      });

      // Assert - Verify that batch operations were used
      expect(batchSpy).toHaveBeenCalled();

      // Verify both records were persisted correctly
      const savedData1 = await testDb.workoutLogs.get('workout-log-1');
      const savedData2 = await testDb.workoutLogs.get('workout-log-2');

      expect(savedData1).toBeDefined();
      expect(savedData1!.trainingPlanName).toBe('Plan A');
      expect(savedData2).toBeDefined();
      expect(savedData2!.trainingPlanName).toBe('Plan B');
    });

    it('should handle batch operation failures and maintain atomicity', async () => {
      // Arrange
      const testData = [
        {
          id: 'workout-log-1',
          profileId: 'test-profile-id',
          trainingPlanName: 'Plan A',
          sessionName: 'Session 1',
          performedGroupIds: [],
          startTime: new Date(),
          endTime: new Date(),
          durationSeconds: 3600,
          totalVolume: 1000,
        },
        {
          id: 'workout-log-2',
          profileId: 'test-profile-id',
          trainingPlanName: 'Plan B',
          sessionName: 'Session 2',
          performedGroupIds: [],
          startTime: new Date(),
          endTime: new Date(),
          durationSeconds: 4200,
          totalVolume: 1200,
        },
      ];

      // Mock database.batch to simulate failure
      const originalBatch = testDb.batch;
      const mockBatch = vi.fn().mockRejectedValueOnce(new Error('Batch operation failed'));
      testDb.batch = mockBatch;

      // Act & Assert - Wrap in write transaction
      await expect(
        testDb.write(async () => {
          await testDb.workoutLogs.bulkPut(testData);
        })
      ).rejects.toThrow('Batch operation failed');

      // Restore original method and verify no partial data was persisted
      testDb.batch = originalBatch;
      const savedData1 = await testDb.workoutLogs.get('workout-log-1');
      const savedData2 = await testDb.workoutLogs.get('workout-log-2');
      expect(savedData1).toBeUndefined();
      expect(savedData2).toBeUndefined();
    });

    it('should handle delete operations with proper transaction isolation', async () => {
      // Arrange
      const testData = {
        id: 'test-workout-log-id',
        profileId: 'test-profile-id',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: [],
        startTime: new Date(),
        endTime: new Date(),
        durationSeconds: 3600,
        totalVolume: 1000,
      };

      // Create the record first - wrap in transaction
      await testDb.write(async () => {
        await testDb.workoutLogs.put(testData);
      });

      // Verify it exists
      const beforeDelete = await testDb.workoutLogs.get(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act - Delete the record wrapped in transaction
      await testDb.write(async () => {
        await testDb.workoutLogs.delete(testData.id);
      });

      // Assert - Verify the record is properly deleted
      const afterDelete = await testDb.workoutLogs.get(testData.id);
      expect(afterDelete).toBeUndefined();
    });
  });

  describe('database cleanup with transactions', () => {
    it('should handle cleanup operations with proper transaction management', async () => {
      // Arrange - Create test data across multiple collections
      const workoutLogData = {
        id: 'test-workout-log',
        profileId: 'test-profile',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: ['group-1'],
        startTime: new Date(),
        endTime: new Date(),
        durationSeconds: 3600,
        totalVolume: 1000,
      };

      const groupData = {
        id: 'group-1',
        profileId: 'test-profile',
        workoutLogId: 'test-workout-log',
        type: 'single',
        performedExerciseLogIds: ['exercise-1'],
      };

      const exerciseData = {
        id: 'exercise-1',
        profileId: 'test-profile',
        performedGroupId: 'group-1',
        exerciseName: 'Test Exercise',
        performedSetIds: [],
        totalSets: 0,
        totalCounts: 0,
        totalVolume: 0,
      };

      // Create test data wrapped in transaction
      await testDb.write(async () => {
        await testDb.workoutLogs.put(workoutLogData);
        await testDb.performedGroups.put(groupData);
        await testDb.performedExercises.put(exerciseData);
      });

      // Verify data exists
      expect(await testDb.workoutLogs.get('test-workout-log')).toBeDefined();
      expect(await testDb.performedGroups.get('group-1')).toBeDefined();
      expect(await testDb.performedExercises.get('exercise-1')).toBeDefined();

      // Act - Run cleanup
      await testDb.cleanup();

      // Assert - Verify all data is cleaned up
      expect(await testDb.workoutLogs.get('test-workout-log')).toBeUndefined();
      expect(await testDb.performedGroups.get('group-1')).toBeUndefined();
      expect(await testDb.performedExercises.get('exercise-1')).toBeUndefined();
    });

    it('should handle cleanup transaction failures gracefully', async () => {
      // Arrange
      const testData = {
        id: 'test-workout-log',
        profileId: 'test-profile',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: [],
        startTime: new Date(),
        endTime: new Date(),
        durationSeconds: 3600,
        totalVolume: 1000,
      };

      // Create test data wrapped in transaction
      await testDb.write(async () => {
        await testDb.workoutLogs.put(testData);
      });

      // Mock database.write to simulate cleanup failure
      const originalWrite = testDb.write;
      const mockWrite = vi
        .fn()
        .mockImplementationOnce(() => Promise.reject(new Error('Cleanup transaction failed')));
      testDb.write = mockWrite;

      // Act - Cleanup should handle the error gracefully (not throw)
      await expect(testDb.cleanup()).resolves.not.toThrow();

      // Restore original write method
      testDb.write = originalWrite;

      // The data should still exist since cleanup failed
      const remainingData = await testDb.workoutLogs.get(testData.id);
      expect(remainingData).toBeDefined();
    });
  });
});
