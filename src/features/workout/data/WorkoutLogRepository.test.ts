import { beforeEach, describe, expect, it } from 'vitest';

import { type BlueprintFitnessDB } from '@/app/db/database';
import { createTestDatabase } from '@/test-database';
import {
  createTestPerformedExerciseLogModel,
  createTestPerformedGroupLogModel,
  createTestPerformedSetModel,
  createTestWorkoutLogData,
  createTestWorkoutLogModel,
} from '@/test-factories';

import { WorkoutLogModel } from '../domain/WorkoutLogModel';
import { PerformedExerciseRepository } from './PerformedExerciseRepository';
import { PerformedGroupRepository } from './PerformedGroupRepository';
import { PerformedSetRepository } from './PerformedSetRepository';
import { WorkoutLogRepository } from './WorkoutLogRepository';

describe('WorkoutLogRepository Integration Tests', () => {
  let testDb: BlueprintFitnessDB;
  let repository: WorkoutLogRepository;
  let performedGroupRepository: PerformedGroupRepository;
  let performedExerciseRepository: PerformedExerciseRepository;
  let performedSetRepository: PerformedSetRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();

    // Create REAL instances of all child repositories for full integration testing
    performedSetRepository = new PerformedSetRepository(testDb);
    performedExerciseRepository = new PerformedExerciseRepository(performedSetRepository, testDb);
    performedGroupRepository = new PerformedGroupRepository(performedExerciseRepository, testDb);
    repository = new WorkoutLogRepository(performedGroupRepository, testDb);
  });

  describe('save', () => {
    it('should persist a complete WorkoutLogModel aggregate with all child entities', async () => {
      // Arrange - Create a complex aggregate using test factories
      const sets1 = [
        createTestPerformedSetModel({ weight: 100, counts: 10, completed: true }),
        createTestPerformedSetModel({ weight: 105, counts: 8, completed: true }),
      ];
      const sets2 = [
        createTestPerformedSetModel({ weight: 60, counts: 12, completed: true }),
        createTestPerformedSetModel({ weight: 62.5, counts: 10, completed: true }),
      ];
      const sets3 = [createTestPerformedSetModel({ weight: 80, counts: 15, completed: true })];

      const exercise1 = createTestPerformedExerciseLogModel({}, sets1);
      const exercise2 = createTestPerformedExerciseLogModel({}, sets2);
      const exercise3 = createTestPerformedExerciseLogModel({}, sets3);

      const group1 = createTestPerformedGroupLogModel({ type: 'single' }, [exercise1, exercise2]);
      const group2 = createTestPerformedGroupLogModel({ type: 'superset' }, [exercise3]);

      const workoutLog = createTestWorkoutLogModel(
        {
          trainingPlanName: 'Push/Pull/Legs',
          sessionName: 'Push Day',
          notes: 'Good workout today!',
          userRating: 4,
        },
        [group1, group2]
      );

      // Act
      const result = await repository.save(workoutLog);

      // Assert
      expect(result).toBe(workoutLog);

      // Verify workout log was persisted
      const savedLog = await testDb.workoutLogs.get(workoutLog.id);
      expect(savedLog).toBeDefined();
      expect(savedLog!.id).toBe(workoutLog.id);
      expect(savedLog!.trainingPlanName).toBe('Push/Pull/Legs');
      expect(savedLog!.sessionName).toBe('Push Day');
      expect(savedLog!.notes).toBe('Good workout today!');
      expect(savedLog!.userRating).toBe(4);
      expect(savedLog!.performedGroupIds).toEqual([group1.id, group2.id]);

      // Verify all performed groups were persisted
      const savedGroups = await testDb.performedGroups.bulkGet([group1.id, group2.id]);
      expect(savedGroups.filter((g) => g !== undefined)).toHaveLength(2);

      const savedGroup1 = savedGroups.find((g) => g?.id === group1.id);
      expect(savedGroup1).toBeDefined();
      expect(savedGroup1!.type).toBe('single');
      expect(savedGroup1!.performedExerciseLogIds).toEqual([exercise1.id, exercise2.id]);

      const savedGroup2 = savedGroups.find((g) => g?.id === group2.id);
      expect(savedGroup2).toBeDefined();
      expect(savedGroup2!.type).toBe('superset');
      expect(savedGroup2!.performedExerciseLogIds).toEqual([exercise3.id]);

      // Verify all performed exercises were persisted
      const savedExercises = await testDb.performedExercises.bulkGet([
        exercise1.id,
        exercise2.id,
        exercise3.id,
      ]);
      expect(savedExercises.filter((e) => e !== undefined)).toHaveLength(3);

      // Verify all performed sets were persisted
      const allSetIds = [
        ...sets1.map((s) => s.id),
        ...sets2.map((s) => s.id),
        ...sets3.map((s) => s.id),
      ];
      const savedSets = await testDb.performedSets.bulkGet(allSetIds);
      expect(savedSets.filter((s) => s !== undefined)).toHaveLength(5);

      // Verify specific set data
      const savedSet1 = savedSets.find((s) => s?.id === sets1[0].id);
      expect(savedSet1).toBeDefined();
      expect(savedSet1!.weight).toBe(100);
      expect(savedSet1!.counts).toBe(10);
      expect(savedSet1!.completed).toBe(true);
    });

    it('should handle workout logs with no performed groups', async () => {
      // Arrange
      const workoutLog = createTestWorkoutLogModel({}, []);

      // Act
      const result = await repository.save(workoutLog);

      // Assert
      expect(result).toBe(workoutLog);

      const savedLog = await testDb.workoutLogs.get(workoutLog.id);
      expect(savedLog).toBeDefined();
      expect(savedLog!.performedGroupIds).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should retrieve and hydrate a complete WorkoutLogModel aggregate', async () => {
      // Arrange - Set up test data in database
      const sets = [
        createTestPerformedSetModel({ weight: 100, counts: 8, rpe: 8, completed: true }),
        createTestPerformedSetModel({ weight: 102.5, counts: 6, rpe: 9, completed: true }),
      ];
      const exercise = createTestPerformedExerciseLogModel({}, sets);
      const group = createTestPerformedGroupLogModel({ type: 'single' }, [exercise]);
      const originalLog = createTestWorkoutLogModel(
        {
          trainingPlanName: 'Upper/Lower',
          sessionName: 'Upper Body',
          totalVolume: 1625.0,
          userRating: 5,
        },
        [group]
      );

      // Save the complete aggregate
      await repository.save(originalLog);

      // Act
      const retrievedLog = await repository.findById(originalLog.id);

      // Assert
      expect(retrievedLog).toBeInstanceOf(WorkoutLogModel);
      expect(retrievedLog!.id).toBe(originalLog.id);
      expect(retrievedLog!.trainingPlanName).toBe('Upper/Lower');
      expect(retrievedLog!.sessionName).toBe('Upper Body');
      expect(retrievedLog!.totalVolume).toBe(1625.0);
      expect(retrievedLog!.userRating).toBe(5);

      // Verify performed groups were hydrated correctly
      expect(retrievedLog!.performedGroups).toHaveLength(1);
      const retrievedGroup = retrievedLog!.performedGroups[0];
      expect(retrievedGroup.id).toBe(group.id);
      expect(retrievedGroup.type).toBe('single');

      // Verify performed exercises were hydrated correctly
      expect(retrievedGroup.performedExercises).toHaveLength(1);
      const retrievedExercise = retrievedGroup.performedExercises[0];
      expect(retrievedExercise.id).toBe(exercise.id);

      // Verify performed sets were hydrated correctly
      expect(retrievedExercise.sets).toHaveLength(2);
      expect(retrievedExercise.sets.map((s) => s.id)).toEqual([sets[0].id, sets[1].id]);
      expect(retrievedExercise.sets[0].weight).toBe(100);
      expect(retrievedExercise.sets[0].counts).toBe(8);
      expect(retrievedExercise.sets[0].rpe).toBe(8);
      expect(retrievedExercise.sets[1].weight).toBe(102.5);
      expect(retrievedExercise.sets[1].counts).toBe(6);
      expect(retrievedExercise.sets[1].rpe).toBe(9);

      // Test domain methods work on hydrated model
      expect(retrievedLog!.getAllSets()).toHaveLength(2);
      expect(retrievedLog!.getAllExercises()).toHaveLength(1);
      expect(retrievedLog!.getTotalSets()).toBe(2);
    });

    it('should return undefined when workout log does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-workout-log-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle workout logs with empty performed groups', async () => {
      // Arrange
      const workoutLog = createTestWorkoutLogModel({}, []);
      await repository.save(workoutLog);

      // Act
      const result = await repository.findById(workoutLog.id);

      // Assert
      expect(result).toBeInstanceOf(WorkoutLogModel);
      expect(result!.performedGroups).toHaveLength(0);
      expect(result!.getAllSets()).toHaveLength(0);
      expect(result!.getAllExercises()).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Set up test data with multiple workout logs for different profiles and dates
      const profileId1 = 'profile-1';
      const profileId2 = 'profile-2';

      const oldDate = new Date('2024-01-01');
      const recentDate = new Date('2024-06-15');
      const futureDate = new Date('2024-12-31');

      // Profile 1 workout logs
      const log1 = createTestWorkoutLogModel({
        profileId: profileId1,
        startTime: oldDate,
        trainingPlanName: 'Plan A',
        sessionName: 'Session 1',
      });
      const log2 = createTestWorkoutLogModel({
        profileId: profileId1,
        startTime: recentDate,
        trainingPlanName: 'Plan A',
        sessionName: 'Session 2',
      });
      const log3 = createTestWorkoutLogModel({
        profileId: profileId1,
        startTime: futureDate,
        trainingPlanName: 'Plan A',
        sessionName: 'Session 3',
      });

      // Profile 2 workout log (should not appear in profile 1 results)
      const log4 = createTestWorkoutLogModel({
        profileId: profileId2,
        startTime: recentDate,
        trainingPlanName: 'Plan B',
        sessionName: 'Session 1',
      });

      await Promise.all([
        repository.save(log1),
        repository.save(log2),
        repository.save(log3),
        repository.save(log4),
      ]);
    });

    it('should return all workout logs for a profile with no filters', async () => {
      // Arrange
      const profileId = 'profile-1';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(3);
      result.forEach((log) => {
        expect(log).toBeInstanceOf(WorkoutLogModel);
        expect(log.profileId).toBe(profileId);
        expect(log.trainingPlanName).toBe('Plan A');
      });

      // Verify session names are correct
      const sessionNames = result.map((log) => log.sessionName).sort();
      expect(sessionNames).toEqual(['Session 1', 'Session 2', 'Session 3']);
    });

    it('should filter workout logs by date range correctly', async () => {
      // Arrange
      const profileId = 'profile-1';
      const filters = {
        dateRange: {
          from: new Date('2024-06-01'),
          to: new Date('2024-06-30'),
        },
      };

      // Act
      const result = await repository.findAll(profileId, filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].sessionName).toBe('Session 2');
      expect(result[0].startTime).toEqual(new Date('2024-06-15'));
    });

    it('should return empty array when no workout logs exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile';

      // Act
      const result = await repository.findAll(nonExistentProfileId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when date range filter excludes all logs', async () => {
      // Arrange
      const profileId = 'profile-1';
      const filters = {
        dateRange: {
          from: new Date('2025-01-01'),
          to: new Date('2025-01-31'),
        },
      };

      // Act
      const result = await repository.findAll(profileId, filters);

      // Assert
      expect(result).toEqual([]);
    });

    it('should efficiently batch-fetch child entities for multiple workout logs', async () => {
      // Arrange
      const profileId = 'profile-batch-test';

      // Create multiple complex workout logs with different structures
      const log1 = createTestWorkoutLogModel({ profileId }, [
        createTestPerformedGroupLogModel({}, [
          createTestPerformedExerciseLogModel({}, [
            createTestPerformedSetModel({ completed: true }),
          ]),
        ]),
      ]);

      const log2 = createTestWorkoutLogModel({ profileId }, [
        createTestPerformedGroupLogModel({}, [
          createTestPerformedExerciseLogModel({}, [
            createTestPerformedSetModel({ completed: true }),
            createTestPerformedSetModel({ completed: true }),
          ]),
        ]),
        createTestPerformedGroupLogModel({}, [
          createTestPerformedExerciseLogModel({}, [
            createTestPerformedSetModel({ completed: true }),
          ]),
        ]),
      ]);

      await Promise.all([repository.save(log1), repository.save(log2)]);

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);

      // Sort results by number of groups to make the test deterministic
      const sortedResult = result.sort(
        (a, b) => a.performedGroups.length - b.performedGroups.length
      );

      // Verify log with 1 group (should be log1)
      expect(sortedResult[0].performedGroups).toHaveLength(1);
      expect(sortedResult[0].getAllExercises()).toHaveLength(1);
      expect(sortedResult[0].getAllSets()).toHaveLength(1);
      expect(sortedResult[0].id).toBe(log1.id);

      // Verify log with 2 groups (should be log2)
      expect(sortedResult[1].performedGroups).toHaveLength(2);
      expect(sortedResult[1].getAllExercises()).toHaveLength(2);
      expect(sortedResult[1].getAllSets()).toHaveLength(3);
      expect(sortedResult[1].id).toBe(log2.id);
    });
  });

  describe('findLastBySessionId', () => {
    it('should return the most recent workout log for a specific session', async () => {
      // Arrange
      const profileId = 'test-profile';
      const sessionId = 'test-session';
      const otherSessionId = 'other-session';

      const oldDate = new Date('2024-01-01T10:00:00Z');
      const recentDate = new Date('2024-06-15T10:00:00Z');
      const mostRecentDate = new Date('2024-07-01T10:00:00Z');

      // Create multiple logs for the same session (different dates)
      const oldLog = createTestWorkoutLogModel({
        profileId,
        sessionId,
        startTime: oldDate,
        sessionName: 'Target Session',
        userRating: 3,
      });

      const recentLog = createTestWorkoutLogModel({
        profileId,
        sessionId,
        startTime: recentDate,
        sessionName: 'Target Session',
        userRating: 4,
      });

      const mostRecentLog = createTestWorkoutLogModel({
        profileId,
        sessionId,
        startTime: mostRecentDate,
        sessionName: 'Target Session',
        userRating: 5,
      });

      // Create log for different session (should not be returned)
      const otherSessionLog = createTestWorkoutLogModel({
        profileId,
        sessionId: otherSessionId,
        startTime: mostRecentDate,
        sessionName: 'Other Session',
        userRating: 4,
      });

      // Save all logs
      await Promise.all([
        repository.save(oldLog),
        repository.save(recentLog),
        repository.save(mostRecentLog),
        repository.save(otherSessionLog),
      ]);

      // Act
      const result = await repository.findLastBySessionId(profileId, sessionId);

      // Assert
      expect(result).toBeInstanceOf(WorkoutLogModel);
      expect(result!.id).toBe(mostRecentLog.id);
      expect(result!.sessionId).toBe(sessionId);
      expect(result!.sessionName).toBe('Target Session');
      expect(result!.userRating).toBe(5);
      expect(result!.startTime).toEqual(mostRecentDate);
    });

    it('should return undefined when no workout log exists for the session', async () => {
      // Arrange
      const profileId = 'test-profile';
      const nonExistentSessionId = 'non-existent-session';

      // Act
      const result = await repository.findLastBySessionId(profileId, nonExistentSessionId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when no workout log exists for the profile', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile';
      const sessionId = 'test-session';

      // Act
      const result = await repository.findLastBySessionId(nonExistentProfileId, sessionId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle session with complex workout log structure', async () => {
      // Arrange
      const profileId = 'test-profile';
      const sessionId = 'complex-session';

      const sets = [
        createTestPerformedSetModel({ weight: 120, counts: 5, rpe: 9, completed: true }),
        createTestPerformedSetModel({ weight: 125, counts: 3, rpe: 10, completed: true }),
      ];
      const exercise = createTestPerformedExerciseLogModel({}, sets);
      const group = createTestPerformedGroupLogModel({ type: 'single' }, [exercise]);

      const complexLog = createTestWorkoutLogModel(
        {
          profileId,
          sessionId,
          sessionName: 'Heavy Day',
          notes: 'Personal records today!',
        },
        [group]
      );

      await repository.save(complexLog);

      // Act
      const result = await repository.findLastBySessionId(profileId, sessionId);

      // Assert
      expect(result).toBeInstanceOf(WorkoutLogModel);
      expect(result!.performedGroups).toHaveLength(1);
      expect(result!.getAllSets()).toHaveLength(2);
      expect(result!.notes).toBe('Personal records today!');

      // Verify domain methods work
      const personalBests = result!.getPersonalBests();
      expect(personalBests.size).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete workout log and cascade delete all child entities', async () => {
      // Arrange - Create complex aggregate with nested structure
      const sets1 = [
        createTestPerformedSetModel({ weight: 100 }),
        createTestPerformedSetModel({ weight: 105 }),
      ];
      const sets2 = [createTestPerformedSetModel({ weight: 60 })];

      const exercise1 = createTestPerformedExerciseLogModel({}, sets1);
      const exercise2 = createTestPerformedExerciseLogModel({}, sets2);

      const group = createTestPerformedGroupLogModel({}, [exercise1, exercise2]);
      const workoutLog = createTestWorkoutLogModel({}, [group]);

      await repository.save(workoutLog);

      // Verify entities exist before deletion
      expect(await testDb.workoutLogs.get(workoutLog.id)).toBeDefined();
      expect(await testDb.performedGroups.get(group.id)).toBeDefined();
      expect(await testDb.performedExercises.get(exercise1.id)).toBeDefined();
      expect(await testDb.performedExercises.get(exercise2.id)).toBeDefined();
      expect(await testDb.performedSets.get(sets1[0].id)).toBeDefined();
      expect(await testDb.performedSets.get(sets1[1].id)).toBeDefined();
      expect(await testDb.performedSets.get(sets2[0].id)).toBeDefined();

      // Act
      await repository.delete(workoutLog.id);

      // Assert - Verify cascade deletion
      expect(await testDb.workoutLogs.get(workoutLog.id)).toBeUndefined();
      expect(await testDb.performedGroups.get(group.id)).toBeUndefined();
      expect(await testDb.performedExercises.get(exercise1.id)).toBeUndefined();
      expect(await testDb.performedExercises.get(exercise2.id)).toBeUndefined();
      expect(await testDb.performedSets.get(sets1[0].id)).toBeUndefined();
      expect(await testDb.performedSets.get(sets1[1].id)).toBeUndefined();
      expect(await testDb.performedSets.get(sets2[0].id)).toBeUndefined();
    });

    it('should not throw error when deleting non-existent workout log', async () => {
      // Arrange
      const nonExistentId = 'non-existent-workout-log-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });

    it('should handle deletion of workout log with no performed groups', async () => {
      // Arrange
      const workoutLog = createTestWorkoutLogModel({}, []);
      await repository.save(workoutLog);

      // Verify workout log exists
      expect(await testDb.workoutLogs.get(workoutLog.id)).toBeDefined();

      // Act
      await repository.delete(workoutLog.id);

      // Assert
      expect(await testDb.workoutLogs.get(workoutLog.id)).toBeUndefined();
    });

    it('should not affect other workout logs when deleting one', async () => {
      // Arrange
      const workoutLog1 = createTestWorkoutLogModel({
        trainingPlanName: 'Plan A',
      });
      const workoutLog2 = createTestWorkoutLogModel({
        trainingPlanName: 'Plan B',
      });

      await Promise.all([repository.save(workoutLog1), repository.save(workoutLog2)]);

      // Act - Delete only the first workout log
      await repository.delete(workoutLog1.id);

      // Assert
      expect(await testDb.workoutLogs.get(workoutLog1.id)).toBeUndefined();
      expect(await testDb.workoutLogs.get(workoutLog2.id)).toBeDefined();

      // Verify second log can still be retrieved properly
      const retrievedLog2 = await repository.findById(workoutLog2.id);
      expect(retrievedLog2).toBeInstanceOf(WorkoutLogModel);
      expect(retrievedLog2!.trainingPlanName).toBe('Plan B');
    });
  });

  describe('round trip testing', () => {
    it('should maintain data integrity through save and retrieve cycle', async () => {
      // Arrange - Create comprehensive test aggregate
      const profileId = 'round-trip-profile';
      const trainingPlanId = 'training-plan-123';
      const sessionId = 'session-456';

      const sets = [
        createTestPerformedSetModel({
          profileId,
          weight: 100.5,
          counts: 8,
          rpe: 8,
          completed: true,
          notes: 'Felt strong',
        }),
        createTestPerformedSetModel({
          profileId,
          weight: 102.5,
          counts: 6,
          rpe: 9,
          completed: true,
          notes: 'Last rep was hard',
        }),
        createTestPerformedSetModel({
          profileId,
          weight: 105,
          counts: 4,
          rpe: 10,
          completed: true,
          notes: 'Last set was tough',
        }),
      ];

      const exercise = createTestPerformedExerciseLogModel(
        {
          profileId,
          exerciseName: 'Bench Press',
          notes: 'Great form today',
          totalVolume: 1625.0,
        },
        sets
      );

      const group = createTestPerformedGroupLogModel(
        {
          profileId,
          type: 'single',
          actualRestSeconds: 180,
        },
        [exercise]
      );

      const originalStartTime = new Date('2024-07-15T10:30:00Z');
      const originalEndTime = new Date('2024-07-15T11:45:00Z');

      const originalLog = createTestWorkoutLogModel(
        {
          profileId,
          trainingPlanId,
          trainingPlanName: 'Push/Pull/Legs Split',
          sessionId,
          sessionName: 'Push Day - Chest Focus',
          startTime: originalStartTime,
          endTime: originalEndTime,
          durationSeconds: 4500, // 75 minutes
          totalVolume: 1625.0,
          notes: 'Excellent workout, hit new PR on bench!',
          userRating: 5,
        },
        [group]
      );

      // Act - Save and retrieve
      const savedLog = await repository.save(originalLog);
      const retrievedLog = await repository.findById(originalLog.id);

      // Assert - Deep equality check
      expect(retrievedLog).toBeInstanceOf(WorkoutLogModel);
      expect(retrievedLog!.id).toBe(originalLog.id);
      expect(retrievedLog!.profileId).toBe(profileId);
      expect(retrievedLog!.trainingPlanId).toBe(trainingPlanId);
      expect(retrievedLog!.trainingPlanName).toBe('Push/Pull/Legs Split');
      expect(retrievedLog!.sessionId).toBe(sessionId);
      expect(retrievedLog!.sessionName).toBe('Push Day - Chest Focus');
      expect(retrievedLog!.startTime).toEqual(originalStartTime);
      expect(retrievedLog!.endTime).toEqual(originalEndTime);
      expect(retrievedLog!.durationSeconds).toBe(4500);
      expect(retrievedLog!.totalVolume).toBe(1625.0);
      expect(retrievedLog!.notes).toBe('Excellent workout, hit new PR on bench!');
      expect(retrievedLog!.userRating).toBe(5);

      // Assert performed groups
      expect(retrievedLog!.performedGroups).toHaveLength(1);
      const retrievedGroup = retrievedLog!.performedGroups[0];
      expect(retrievedGroup.id).toBe(group.id);
      expect(retrievedGroup.profileId).toBe(profileId);
      expect(retrievedGroup.type).toBe('single');
      expect(retrievedGroup.actualRestSeconds).toBe(180);

      // Assert performed exercises
      expect(retrievedGroup.performedExercises).toHaveLength(1);
      const retrievedExercise = retrievedGroup.performedExercises[0];
      expect(retrievedExercise.id).toBe(exercise.id);
      expect(retrievedExercise.profileId).toBe(profileId);
      expect(retrievedExercise.exerciseName).toBe('Bench Press');
      expect(retrievedExercise.notes).toBe('Great form today');
      expect(retrievedExercise.totalVolume).toBe(1625.0);

      // Assert performed sets
      expect(retrievedExercise.sets).toHaveLength(3);

      const retrievedSet1 = retrievedExercise.sets.find((s) => s.id === sets[0].id)!;
      expect(retrievedSet1).toBeDefined();
      expect(retrievedSet1.profileId).toBe(profileId);
      expect(retrievedSet1.weight).toBe(100.5);
      expect(retrievedSet1.counts).toBe(8);
      expect(retrievedSet1.rpe).toBe(8);
      expect(retrievedSet1.completed).toBe(true);
      expect(retrievedSet1.notes).toBe('Felt strong');

      const retrievedSet2 = retrievedExercise.sets.find((s) => s.id === sets[1].id)!;
      expect(retrievedSet2).toBeDefined();
      expect(retrievedSet2.weight).toBe(102.5);
      expect(retrievedSet2.counts).toBe(6);
      expect(retrievedSet2.rpe).toBe(9);
      expect(retrievedSet2.completed).toBe(true);
      expect(retrievedSet2.notes).toBe('Last rep was hard');

      const retrievedSet3 = retrievedExercise.sets.find((s) => s.id === sets[2].id)!;
      expect(retrievedSet3).toBeDefined();
      expect(retrievedSet3.weight).toBe(105);
      expect(retrievedSet3.counts).toBe(4);
      expect(retrievedSet3.rpe).toBe(10);
      expect(retrievedSet3.completed).toBe(true);
      expect(retrievedSet3.notes).toBe('Last set was tough');

      // Assert domain methods work on retrieved model
      expect(retrievedLog!.getAllSets()).toHaveLength(3);
      expect(retrievedLog!.getAllExercises()).toHaveLength(1);
      expect(retrievedLog!.getTotalSets()).toBe(3);
      expect(retrievedLog!.getTotalCounts()).toBe(18); // 8 + 6 + 4
      expect(retrievedLog!.calculateTotalVolume()).toBe(retrievedExercise.getTotalVolume());
      expect(retrievedLog!.getAverageRPE()).toBe(9); // (8 + 9 + 10) / 3, but only completed sets
      expect(retrievedLog!.isCompleted()).toBe(true);

      const personalBests = retrievedLog!.getPersonalBests();
      expect(personalBests.size).toBe(1);
      expect(personalBests.get(exercise.exerciseId)?.weight).toBe(105); // Heaviest completed set

      // Test that saved reference is identical to original
      expect(savedLog).toBe(originalLog);
    });
  });
});
