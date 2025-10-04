import { beforeEach, describe, expect, it } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { IWorkoutSessionRepository } from '@/features/training-plan/domain/IWorkoutSessionRepository';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import {
  createTestAppliedExerciseModel,
  createTestExerciseGroupModel,
  createTestSessionModel,
  createTestStandardSetParamsData,
} from '@/test-factories';

import { WorkoutService } from './WorkoutService';

/**
 * Integration tests for WorkoutService focusing on the complete vertical slice
 * of the startWorkoutFromPlan method. These tests verify that the service
 * correctly orchestrates domain and persistence layers to create complete
 * WorkoutLog aggregates.
 */
describe('WorkoutService Integration Tests', () => {
  let workoutService: WorkoutService;
  let mockWorkoutLogRepository: IWorkoutLogRepository;
  let mockWorkoutSessionRepository: IWorkoutSessionRepository;
  let mockLogger: ILogger;

  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testTrainingPlanId = '550e8400-e29b-41d4-a716-446655440002';
  const testTrainingPlanName = 'Push/Pull/Legs Program';

  beforeEach(() => {
    // Create in-memory implementations for integration testing
    const workoutLogs = new Map<string, WorkoutLogModel>();
    const sessions = new Map<string, any>();

    mockWorkoutLogRepository = {
      async save(log: WorkoutLogModel): Promise<WorkoutLogModel> {
        workoutLogs.set(log.id, log);
        return log;
      },
      async findById(id: string): Promise<WorkoutLogModel | undefined> {
        return workoutLogs.get(id);
      },
      async findAll(profileId: string, filters?: any): Promise<WorkoutLogModel[]> {
        return Array.from(workoutLogs.values()).filter((log) => log.profileId === profileId);
      },
      async findLastBySessionId(
        profileId: string,
        sessionId: string
      ): Promise<WorkoutLogModel | undefined> {
        const logs = Array.from(workoutLogs.values())
          .filter((log) => log.profileId === profileId && log.sessionId === sessionId)
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        return logs[0];
      },
      async delete(id: string): Promise<void> {
        workoutLogs.delete(id);
      },
    };

    mockWorkoutSessionRepository = {
      async save(session: any): Promise<any> {
        sessions.set(session.id, session);
        return session;
      },
      async findById(id: string): Promise<any> {
        return sessions.get(id);
      },
      async findByIds(ids: string[]): Promise<any[]> {
        return ids.map((id) => sessions.get(id)).filter(Boolean);
      },
      async findAll(profileId: string): Promise<any[]> {
        return Array.from(sessions.values()).filter((session) => session.profileId === profileId);
      },
      async delete(id: string): Promise<void> {
        sessions.delete(id);
      },
    };

    mockLogger = {
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    workoutService = new WorkoutService(
      mockWorkoutLogRepository,
      mockWorkoutSessionRepository,
      mockLogger
    );
  });

  describe('startWorkoutFromPlan - Vertical Slice Integration', () => {
    it('should create a complete WorkoutLog aggregate from a complex training session', async () => {
      // Arrange: Create a comprehensive training session with multiple exercise groups
      const benchPressExercise = createTestAppliedExerciseModel({
        id: 'applied-exercise-1',
        profileId: testProfileId,
        exerciseId: 'bench-press-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 4, max: 4, direction: 'asc' },
          counts: { min: 8, max: 10, direction: 'asc' },
          load: { min: 100, max: 120, direction: 'asc' },
          rpe: { min: 7, max: 8, direction: 'asc' },
        }),
        restTimeSeconds: 180,
      });

      const inclineDbExercise = createTestAppliedExerciseModel({
        id: 'applied-exercise-2',
        profileId: testProfileId,
        exerciseId: 'incline-db-press-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 3, max: 3, direction: 'asc' },
          counts: { min: 10, max: 12, direction: 'asc' },
          load: { min: 40, max: 50, direction: 'asc' },
          rpe: { min: 8, max: 9, direction: 'asc' },
        }),
        restTimeSeconds: 120,
      });

      // Create a superset group (chest exercises)
      const chestSuperset = createTestExerciseGroupModel(
        {
          id: 'chest-superset-group',
          profileId: testProfileId,
          type: 'superset',
          restTimeSeconds: 180,
        },
        [benchPressExercise, inclineDbExercise]
      );

      // Create tricep isolation exercise
      const tricepExercise = createTestAppliedExerciseModel({
        id: 'applied-exercise-3',
        profileId: testProfileId,
        exerciseId: 'tricep-pushdown-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 3, max: 3, direction: 'asc' },
          counts: { min: 12, max: 15, direction: 'asc' },
          load: { min: 30, max: 35, direction: 'asc' },
          rpe: { min: 8, max: 9, direction: 'asc' },
        }),
        restTimeSeconds: 90,
      });

      // Create single exercise group (tricep isolation)
      const tricepSingleGroup = createTestExerciseGroupModel(
        {
          id: 'tricep-single-group',
          profileId: testProfileId,
          type: 'single',
          restTimeSeconds: 90,
        },
        [tricepExercise]
      );

      // Create complete training session
      const pushSession = createTestSessionModel(
        {
          id: 'push-session-1',
          profileId: testProfileId,
          name: 'Push Day - Chest & Triceps',
          executionCount: 2, // Session has been executed before
          notes: 'Focus on progressive overload',
          dayOfWeek: 'monday',
        },
        [chestSuperset, tricepSingleGroup]
      );

      // Save the session to the mock repository
      await mockWorkoutSessionRepository.save(pushSession);

      // Act: Start workout from the planned session
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        pushSession.id,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert: Verify the complete workout log was created successfully
      expect(result.isSuccess).toBe(true);
      const workoutLog = result.getValue()!;

      // Verify basic workout metadata
      expect(workoutLog.profileId).toBe(testProfileId);
      expect(workoutLog.sessionId).toBe(pushSession.id);
      expect(workoutLog.sessionName).toBe('Push Day - Chest & Triceps');
      expect(workoutLog.trainingPlanId).toBe(testTrainingPlanId);
      expect(workoutLog.trainingPlanName).toBe(testTrainingPlanName);
      expect(workoutLog.startTime).toBeInstanceOf(Date);
      expect(workoutLog.endTime).toBeUndefined(); // Workout hasn't ended yet
      expect(workoutLog.isInProgress()).toBe(true);
      expect(workoutLog.isCompleted()).toBe(false);

      // Verify performed groups structure
      expect(workoutLog.performedGroups).toHaveLength(2);

      // Verify the superset group was properly snapshotted
      const performedSuperset = workoutLog.performedGroups[0];
      expect(performedSuperset.type).toBe('superset');
      expect(performedSuperset.performedExercises).toHaveLength(2);

      // Verify bench press exercise snapshot
      const performedBenchPress = performedSuperset.performedExercises[0];
      expect(performedBenchPress.exerciseId).toBe('bench-press-exercise');
      expect(performedBenchPress.plannedExerciseId).toBe('applied-exercise-1');
      expect(performedBenchPress.sets).toHaveLength(4); // Based on set configuration
      expect(performedBenchPress.isSkipped).toBe(false);
      expect(performedBenchPress.totalSets).toBe(4);

      // Verify incline dumbbell press exercise snapshot
      const performedInclineDb = performedSuperset.performedExercises[1];
      expect(performedInclineDb.exerciseId).toBe('incline-db-press-exercise');
      expect(performedInclineDb.plannedExerciseId).toBe('applied-exercise-2');
      expect(performedInclineDb.sets).toHaveLength(3);

      // Verify the single exercise group was properly snapshotted
      const performedSingleGroup = workoutLog.performedGroups[1];
      expect(performedSingleGroup.type).toBe('single');
      expect(performedSingleGroup.performedExercises).toHaveLength(1);

      // Verify tricep exercise snapshot
      const performedTricep = performedSingleGroup.performedExercises[0];
      expect(performedTricep.exerciseId).toBe('tricep-pushdown-exercise');
      expect(performedTricep.plannedExerciseId).toBe('applied-exercise-3');
      expect(performedTricep.sets).toHaveLength(3);

      // Verify all sets were created with correct planned parameters
      const allSets = workoutLog.getAllSets();
      expect(allSets).toHaveLength(10); // 4 + 3 + 3 = 10 total sets

      // Verify sets are not completed yet (fresh workout)
      allSets.forEach((set) => {
        expect(set.completed).toBe(false);
        expect(set.weight).toBeUndefined(); // User hasn't entered actual weights yet
        expect(set.rpe).toBeUndefined(); // User hasn't rated effort yet
        expect(set.plannedLoad).toBeDefined(); // But planned parameters are set
        expect(set.plannedRpe).toBeDefined();
        expect(set.plannedCounts).toBeDefined();
      });

      // Verify workout analytics methods work correctly
      expect(workoutLog.getPlannedSetsCount()).toBe(10); // Total planned sets: 4 + 3 + 3 = 10
      expect(workoutLog.getTotalSets()).toBe(0); // No sets completed yet (fresh workout)
      expect(workoutLog.calculateTotalVolume()).toBe(0); // No actual weights entered yet
      expect(workoutLog.getAllExercises()).toHaveLength(3); // 3 unique exercises

      // Verify the session execution count was incremented
      const updatedSession = await mockWorkoutSessionRepository.findById(pushSession.id);
      expect(updatedSession.executionCount).toBe(3); // Was 2, now 3

      // Verify the workout can be retrieved from persistence
      const retrievedWorkout = await mockWorkoutLogRepository.findById(workoutLog.id);
      expect(retrievedWorkout).toBeDefined();
      expect(retrievedWorkout!.sessionName).toBe('Push Day - Chest & Triceps');
    });

    it('should handle edge case of session with no exercise groups', async () => {
      // Arrange: Create an empty session (edge case)
      const emptySession = createTestSessionModel(
        {
          id: 'empty-session',
          profileId: testProfileId,
          name: 'Empty Session',
          executionCount: 0,
        },
        [] // No groups
      );

      await mockWorkoutSessionRepository.save(emptySession);

      // Act
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        emptySession.id,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert: Should still create a valid workout log
      expect(result.isSuccess).toBe(true);
      const workoutLog = result.getValue()!;

      expect(workoutLog.performedGroups).toHaveLength(0);
      expect(workoutLog.getAllSets()).toHaveLength(0);
      expect(workoutLog.getAllExercises()).toHaveLength(0);
      expect(workoutLog.getTotalSets()).toBe(0);
      expect(workoutLog.sessionName).toBe('Empty Session');
    });

    it('should create immutable snapshots that preserve original session structure', async () => {
      // Arrange: Create a session with specific configuration
      const originalExercise = createTestAppliedExerciseModel({
        id: 'original-exercise',
        profileId: testProfileId,
        exerciseId: 'squat-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 5, max: 5, direction: 'asc' },
          counts: { min: 5, max: 5, direction: 'asc' }, // 5x5 configuration
        }),
      });

      const originalGroup = createTestExerciseGroupModel(
        {
          id: 'squat-group',
          profileId: testProfileId,
          type: 'single',
        },
        [originalExercise]
      );

      const squatSession = createTestSessionModel(
        {
          id: 'squat-session',
          profileId: testProfileId,
          name: 'Squat Day',
        },
        [originalGroup]
      );

      await mockWorkoutSessionRepository.save(squatSession);

      // Act: Start workout (creating immutable snapshot)
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        squatSession.id,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert: Verify snapshot independence
      expect(result.isSuccess).toBe(true);
      const workoutLog = result.getValue()!;

      // Modify the original session after workout creation
      const modifiedSession = squatSession.cloneWithNewName('Modified Squat Day');
      await mockWorkoutSessionRepository.save(modifiedSession);

      // Verify the workout log retains the original session name (immutable snapshot)
      expect(workoutLog.sessionName).toBe('Squat Day'); // Original name preserved

      // Retrieve and verify session was actually modified
      const retrievedSession = await mockWorkoutSessionRepository.findById(squatSession.id);
      expect(retrievedSession.name).toBe('Modified Squat Day');

      // Verify the workout structure is independent
      const performedExercise = workoutLog.performedGroups[0].performedExercises[0];
      expect(performedExercise.sets).toHaveLength(5); // Original 5x5 configuration preserved
      expect(performedExercise.plannedExerciseId).toBe('original-exercise');
    });

    it('should handle complex circuit training scenarios', async () => {
      // Arrange: Create a circuit training session
      const burpeeExercise = createTestAppliedExerciseModel({
        exerciseId: 'burpee-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 1, max: 1, direction: 'asc' },
          counts: { min: 10, max: 10, direction: 'asc' },
        }),
      });

      const jumpSquatExercise = createTestAppliedExerciseModel({
        exerciseId: 'jump-squat-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 1, max: 1, direction: 'asc' },
          counts: { min: 15, max: 15, direction: 'asc' },
        }),
      });

      const mountainClimberExercise = createTestAppliedExerciseModel({
        exerciseId: 'mountain-climber-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 1, max: 1, direction: 'asc' },
          counts: { min: 20, max: 20, direction: 'asc' },
        }),
      });

      const circuitGroup = createTestExerciseGroupModel(
        {
          id: 'hiit-circuit',
          profileId: testProfileId,
          type: 'circuit',
          restTimeSeconds: 60,
        },
        [burpeeExercise, jumpSquatExercise, mountainClimberExercise]
      );

      const hiitSession = createTestSessionModel(
        {
          id: 'hiit-session',
          profileId: testProfileId,
          name: 'HIIT Circuit',
        },
        [circuitGroup]
      );

      await mockWorkoutSessionRepository.save(hiitSession);

      // Act
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        hiitSession.id,
        testTrainingPlanId,
        'HIIT Program'
      );

      // Assert: Verify circuit structure is preserved
      expect(result.isSuccess).toBe(true);
      const workoutLog = result.getValue()!;

      expect(workoutLog.performedGroups).toHaveLength(1);
      const performedCircuit = workoutLog.performedGroups[0];
      expect(performedCircuit.type).toBe('circuit');
      expect(performedCircuit.performedExercises).toHaveLength(3);

      // Verify each exercise in the circuit
      const exercises = performedCircuit.performedExercises;
      expect(exercises[0].exerciseId).toBe('burpee-exercise');
      expect(exercises[1].exerciseId).toBe('jump-squat-exercise');
      expect(exercises[2].exerciseId).toBe('mountain-climber-exercise');

      // Verify total reps are correctly calculated
      expect(workoutLog.getPlannedCountsTotal()).toBe(45); // 10 + 15 + 20 = 45 planned reps
      expect(workoutLog.getTotalCounts()).toBe(0); // No sets completed yet
    });
  });

  describe('Complete Workout Lifecycle Integration', () => {
    it('should support the full workout lifecycle from start to completion', async () => {
      // Arrange: Create a simple session for lifecycle testing
      const exercise = createTestAppliedExerciseModel({
        exerciseId: 'deadlift-exercise',
        setConfiguration: createTestStandardSetParamsData({
          sets: { min: 3, max: 3, direction: 'asc' },
          counts: { min: 5, max: 5, direction: 'asc' },
        }),
      });

      const group = createTestExerciseGroupModel({ type: 'single', profileId: testProfileId }, [
        exercise,
      ]);

      const session = createTestSessionModel(
        {
          id: 'lifecycle-session',
          profileId: testProfileId,
          name: 'Deadlift Day',
        },
        [group]
      );

      await mockWorkoutSessionRepository.save(session);

      // Act 1: Start workout
      const startResult = await workoutService.startWorkoutFromPlan(
        testProfileId,
        session.id,
        testTrainingPlanId,
        testTrainingPlanName
      );

      expect(startResult.isSuccess).toBe(true);
      let workoutLog = startResult.getValue()!;
      expect(workoutLog.isInProgress()).toBe(true);

      // Act 2: Update workout metadata
      const metadataResult = await workoutService.updateWorkoutMetadata(workoutLog.id, {
        notes: 'Feeling strong today',
        userRating: 4,
      });

      expect(metadataResult.isSuccess).toBe(true);
      workoutLog = metadataResult.getValue()!;
      expect(workoutLog.notes).toBe('Feeling strong today');
      expect(workoutLog.userRating).toBe(4);

      // Act 3: End workout
      const endResult = await workoutService.endWorkout(workoutLog.id);

      expect(endResult.isSuccess).toBe(true);
      workoutLog = endResult.getValue()!;
      expect(workoutLog.isCompleted()).toBe(true);
      expect(workoutLog.endTime).toBeDefined();
      expect(workoutLog.durationSeconds).toBeDefined();

      // Act 4: Retrieve workout logs
      const logsResult = await workoutService.getWorkoutLogs(testProfileId);

      expect(logsResult.isSuccess).toBe(true);
      const logs = logsResult.getValue()!;
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(workoutLog.id);

      // Act 5: Find last workout for session
      const lastWorkoutResult = await workoutService.getLastWorkoutForSession(
        testProfileId,
        session.id
      );

      expect(lastWorkoutResult.isSuccess).toBe(true);
      const lastWorkout = lastWorkoutResult.getValue()!;
      expect(lastWorkout!.id).toBe(workoutLog.id);
    });
  });
});
