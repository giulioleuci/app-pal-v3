import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import {
  createTestPerformedExerciseLogModel,
  createTestPerformedGroupLogModel,
  createTestWorkoutLogModel,
} from '@/test-factories';

import { PerformedExerciseRepository } from '../PerformedExerciseRepository';
import { PerformedGroupRepository } from '../PerformedGroupRepository';
import { PerformedSetRepository } from '../PerformedSetRepository';
import { WorkoutLogRepository } from '../WorkoutLogRepository';

describe('Repository Transaction Handling', () => {
  let testDb: TestExtendedDatabase;
  let workoutLogRepository: WorkoutLogRepository;
  let performedGroupRepository: PerformedGroupRepository;
  let performedExerciseRepository: PerformedExerciseRepository;
  let performedSetRepository: PerformedSetRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();

    // Create REAL repository instances for integration testing
    performedSetRepository = new PerformedSetRepository(testDb);
    performedExerciseRepository = new PerformedExerciseRepository(performedSetRepository, testDb);
    performedGroupRepository = new PerformedGroupRepository(performedExerciseRepository, testDb);
    workoutLogRepository = new WorkoutLogRepository(performedGroupRepository, testDb);
  });

  describe('inTransaction parameter handling', () => {
    it('should handle save operations with inTransaction=true without creating new transactions', async () => {
      // Arrange
      const group = createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()]);

      // Spy on database.write to detect transaction calls
      const writeSpy = vi.spyOn(testDb, 'write');

      // Act - Call save with inTransaction=true within an existing transaction
      await testDb.write(async () => {
        await performedGroupRepository.save(group, true);
      });

      // Assert - Verify that only the outer transaction was created
      expect(writeSpy).toHaveBeenCalledTimes(1);

      // Verify the data was still saved correctly
      const savedGroup = await testDb.performedGroups.get(group.id);
      expect(savedGroup).toBeDefined();
      expect(savedGroup!.id).toBe(group.id);
    });

    it('should handle save operations with inTransaction=false by creating new transactions', async () => {
      // Arrange
      const group = createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()]);

      // Spy on database.write to detect transaction calls
      const writeSpy = vi.spyOn(testDb, 'write');

      // Act - Call save with inTransaction=false (default)
      await performedGroupRepository.save(group, false);

      // Assert - Verify that new transactions were created
      expect(writeSpy).toHaveBeenCalledTimes(1);

      // Verify the data was saved correctly
      const savedGroup = await testDb.performedGroups.get(group.id);
      expect(savedGroup).toBeDefined();
      expect(savedGroup!.id).toBe(group.id);
    });

    it('should handle delete operations with inTransaction=true without creating new transactions', async () => {
      // Arrange
      const group = createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()]);

      // Save the group first
      await performedGroupRepository.save(group);

      // Spy on database.write to detect transaction calls
      const writeSpy = vi.spyOn(testDb, 'write');

      // Act - Call delete with inTransaction=true within an existing transaction
      await testDb.write(async () => {
        await performedGroupRepository.delete(group.id, true);
      });

      // Assert - Verify that only the outer transaction was created
      expect(writeSpy).toHaveBeenCalledTimes(1);

      // Verify the data was deleted correctly
      const deletedGroup = await testDb.performedGroups.get(group.id);
      expect(deletedGroup).toBeUndefined();
    });

    it('should handle delete operations with inTransaction=false by creating new transactions', async () => {
      // Arrange
      const group = createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()]);

      // Save the group first
      await performedGroupRepository.save(group);

      // Spy on database.write to detect transaction calls
      const writeSpy = vi.spyOn(testDb, 'write');

      // Act - Call delete with inTransaction=false (default)
      await performedGroupRepository.delete(group.id, false);

      // Assert - Verify that new transactions were created
      expect(writeSpy).toHaveBeenCalledTimes(1);

      // Verify the data was deleted correctly
      const deletedGroup = await testDb.performedGroups.get(group.id);
      expect(deletedGroup).toBeUndefined();
    });
  });

  describe('nested transaction handling integration', () => {
    it('should properly handle nested transactions across the full aggregate hierarchy', async () => {
      // Arrange
      const workoutLog = createTestWorkoutLogModel(
        {
          trainingPlanName: 'Transaction Test Plan',
          sessionName: 'Transaction Test Session',
        },
        [createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()])]
      );

      // Spy on database.write to count transaction calls
      const writeSpy = vi.spyOn(testDb, 'write');

      // Act - Save the complete aggregate (should use nested transactions properly)
      await workoutLogRepository.save(workoutLog);

      // Assert - Should only have one top-level transaction
      expect(writeSpy).toHaveBeenCalledTimes(1);

      // Verify the complete aggregate was saved correctly
      const savedLog = await testDb.workoutLogs.get(workoutLog.id);
      expect(savedLog).toBeDefined();
      expect(savedLog!.trainingPlanName).toBe('Transaction Test Plan');

      const savedGroups = await testDb.performedGroups.bulkGet(savedLog!.performedGroupIds);
      expect(savedGroups.filter((g) => g !== undefined)).toHaveLength(1);

      const savedGroup = savedGroups[0]!;
      const savedExercises = await testDb.performedExercises.bulkGet(
        savedGroup.performedExerciseLogIds
      );
      expect(savedExercises.filter((e) => e !== undefined)).toHaveLength(1);
    });

    it('should properly handle nested transactions during delete operations', async () => {
      // Arrange
      const workoutLog = createTestWorkoutLogModel({}, [
        createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()]),
      ]);

      // Save the aggregate first
      await workoutLogRepository.save(workoutLog);

      // Spy on database.write to count transaction calls during delete
      const writeSpy = vi.spyOn(testDb, 'write');

      // Act - Delete the complete aggregate (should use nested transactions properly)
      await workoutLogRepository.delete(workoutLog.id);

      // Assert - Should only have one top-level transaction
      expect(writeSpy).toHaveBeenCalledTimes(1);

      // Verify the complete aggregate was deleted correctly (cascade deletion)
      const deletedLog = await testDb.workoutLogs.get(workoutLog.id);
      expect(deletedLog).toBeUndefined();

      // Verify child entities were also deleted
      const remainingGroups = await testDb.performedGroups.bulkGet(
        workoutLog.performedGroups.map((g) => g.id)
      );
      expect(remainingGroups.every((g) => g === undefined)).toBe(true);

      const remainingExercises = await testDb.performedExercises.bulkGet(
        workoutLog.performedGroups.flatMap((g) => g.performedExercises.map((e) => e.id))
      );
      expect(remainingExercises.every((e) => e === undefined)).toBe(true);
    });
  });

  describe('transaction error handling', () => {
    it('should handle database write failures gracefully', async () => {
      // Arrange
      const group = createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()]);

      // Mock database.write to simulate a failure
      const originalWrite = testDb.write;
      vi.spyOn(testDb, 'write').mockRejectedValueOnce(new Error('Database write failed'));

      // Act & Assert
      await expect(performedGroupRepository.save(group)).rejects.toThrow('Database write failed');

      // Verify that no data was persisted due to transaction rollback
      const savedGroup = await testDb.performedGroups.get(group.id);
      expect(savedGroup).toBeUndefined();

      // Restore the original write method for cleanup
      testDb.write = originalWrite;
    });

    it('should maintain data consistency when nested operations fail', async () => {
      // Arrange
      const workoutLog = createTestWorkoutLogModel({}, [
        createTestPerformedGroupLogModel({}, [createTestPerformedExerciseLogModel()]),
      ]);

      // Mock the child repository to fail during nested save
      const originalSave = performedGroupRepository.save;
      vi.spyOn(performedGroupRepository, 'save').mockRejectedValueOnce(
        new Error('Child save failed')
      );

      // Act & Assert
      await expect(workoutLogRepository.save(workoutLog)).rejects.toThrow('Child save failed');

      // Verify that no data was persisted due to transaction rollback
      const savedLog = await testDb.workoutLogs.get(workoutLog.id);
      expect(savedLog).toBeUndefined();

      const savedGroups = await testDb.performedGroups.bulkGet(
        workoutLog.performedGroups.map((g) => g.id)
      );
      expect(savedGroups.every((g) => g === undefined)).toBe(true);

      // Restore the original method
      performedGroupRepository.save = originalSave;
    });
  });
});
