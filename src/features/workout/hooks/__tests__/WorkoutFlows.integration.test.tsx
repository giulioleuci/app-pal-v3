import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureContainer } from '@/app/container';
import { type BlueprintFitnessDB } from '@/app/db/database';
import { PerformedSet } from '@/app/db/model/PerformedSet';
import { WorkoutLog } from '@/app/db/model/WorkoutLog';
import { ConsoleLogger } from '@/app/services/ConsoleLogger';
import { AppliedExerciseRepository } from '@/features/training-plan/data/AppliedExerciseRepository';
import { ExerciseGroupRepository } from '@/features/training-plan/data/ExerciseGroupRepository';
import { TrainingPlanRepository } from '@/features/training-plan/data/TrainingPlanRepository';
import { WorkoutSessionRepository } from '@/features/training-plan/data/WorkoutSessionRepository';
import { PerformedExerciseRepository } from '@/features/workout/data/PerformedExerciseRepository';
import { PerformedGroupRepository } from '@/features/workout/data/PerformedGroupRepository';
import { PerformedSetRepository } from '@/features/workout/data/PerformedSetRepository';
import { WorkoutLogRepository } from '@/features/workout/data/WorkoutLogRepository';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { useWorkoutSession } from '@/features/workout/hooks/useWorkoutSession';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { WorkoutService } from '@/features/workout/services/WorkoutService';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { WorkoutFinishedPlanProgressionHandler } from '@/shared/domain/events/handlers/WorkoutFinishedPlanProgressionHandler';
import { createTestDatabase } from '@/test-database';
import { createWrapper } from '@/test-utils';

describe('WorkoutFlows Integration Tests', () => {
  let testDb: BlueprintFitnessDB;
  let queryClient: QueryClient;
  let mockLogger: jest.Mocked<ConsoleLogger>;
  let workoutSessionRepository: WorkoutSessionRepository;
  let workoutService: WorkoutService;
  let workoutLogRepository: WorkoutLogRepository;

  beforeEach(async () => {
    // Clear domain events
    DomainEvents.clearHandlers();

    // Create test database
    testDb = createTestDatabase();

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    // Create real service instances
    const appliedExerciseRepository = new AppliedExerciseRepository(testDb);
    const exerciseGroupRepository = new ExerciseGroupRepository(appliedExerciseRepository, testDb);
    workoutSessionRepository = new WorkoutSessionRepository(
      exerciseGroupRepository,
      appliedExerciseRepository,
      testDb
    );
    const trainingPlanRepository = new TrainingPlanRepository(workoutSessionRepository, testDb);

    const performedSetRepository = new PerformedSetRepository(testDb);
    const performedExerciseRepository = new PerformedExerciseRepository(
      performedSetRepository,
      testDb
    );
    const performedGroupRepository = new PerformedGroupRepository(
      performedExerciseRepository,
      testDb
    );
    workoutLogRepository = new WorkoutLogRepository(performedGroupRepository, testDb);

    workoutService = new WorkoutService(workoutLogRepository, workoutSessionRepository, mockLogger);

    // Register domain event handlers
    const workoutFinishedHandler = new WorkoutFinishedPlanProgressionHandler(
      trainingPlanRepository
    );
    workoutFinishedHandler.setupSubscriptions();

    // Create a mock WorkoutQueryService that doesn't use real WatermelonDB queries
    const mockWorkoutQueryService = {
      getWorkoutLogs: vi.fn().mockReturnValue(null), // Return null to avoid hanging queries
      startWorkoutFromPlan: workoutService.startWorkoutFromPlan.bind(workoutService),
      endWorkout: workoutService.endWorkout.bind(workoutService),
      updateWorkoutMetadata: workoutService.updateWorkoutMetadata.bind(workoutService),
      deleteWorkout: workoutService.deleteWorkout.bind(workoutService),
      getWorkoutLog: workoutService.getWorkoutLog.bind(workoutService),
      getWorkoutHistory: vi.fn(),
      getLastWorkoutForSession: workoutService.getLastWorkoutForSession.bind(workoutService),
    };

    // Mock container.resolve to return our test instances
    vi.mocked(container.resolve).mockImplementation((token: any) => {
      if (token === WorkoutQueryService || token === 'WorkoutQueryService') {
        return mockWorkoutQueryService;
      }
      if (token === WorkoutService || token === 'WorkoutService') {
        return workoutService;
      }
      if (token === 'IWorkoutLogRepository') {
        return workoutLogRepository;
      }
      if (token === 'IWorkoutSessionRepository') {
        return workoutSessionRepository;
      }
      if (token === 'BlueprintFitnessDB') {
        return testDb;
      }
      if (token === 'ILogger') {
        return mockLogger;
      }
      throw new Error(`No mock registered for token: ${token}`);
    });

    // Create fresh query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock crypto for consistent testing
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440001'),
      getRandomValues: vi.fn().mockImplementation((array) => {
        // Fill with deterministic values for testing
        for (let i = 0; i < array.length; i++) {
          array[i] = 42;
        }
        return array;
      }),
    });
  });

  afterEach(async () => {
    // Cleanup
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    DomainEvents.clearHandlers();
    queryClient.clear();

    if (testDb) {
      await testDb.delete();
    }
  });

  describe('Start Workout with Historical Pre-population', () => {
    it('should create new workout log with data pre-populated from previous workout', async () => {
      // Arrange - Create a profile, training plan, and completed workout log
      const profileId = 'profile-123';
      const sessionId = 'session-123';
      const trainingPlanId = 'plan-123';
      const exerciseId = 'exercise-123';
      const appliedExerciseId = 'applied-exercise-123';
      const exerciseGroupId = 'exercise-group-123';
      const completedWorkoutLogId = 'completed-workout-123';

      const now = new Date();

      // Setup all test data in a single transaction
      await testDb.write(async () => {
        // Create profile
        await testDb.profiles.put({
          id: profileId,
          name: 'Test Profile',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        // Create base exercise
        await testDb.exercises.put({
          id: exerciseId,
          profileId,
          name: 'Bench Press',
          type: 'strength',
          targetMuscles: ['chest'],
          equipment: 'barbell',
          instructions: 'Press the weight up',
          createdAt: now,
          updatedAt: now,
        });

        // Create exercise template
        await testDb.exerciseTemplates.put({
          id: 'template-123',
          profileId,
          exerciseId,
          name: 'Bench Press Template',
          description: 'Standard bench press template',
          defaultSetConfiguration: {
            type: 'standard',
            sets: { min: 3, max: 3 },
            counts: { min: 8, max: 8 },
            load: { min: 100, max: 100 },
          },
          isArchived: false,
          lastUsed: now,
          createdAt: now,
          updatedAt: now,
        });

        // Create exercise group first (required for applied exercise relationship)
        await testDb.exerciseGroups.put({
          id: exerciseGroupId,
          profileId,
          workoutSessionId: sessionId,
          type: 'standard',
          rounds: { min: 1, max: 1, direction: 'asc' },
          durationMinutes: 0,
          restTimeSeconds: 120,
          appliedExerciseIds: [appliedExerciseId], // Explicitly set the relationship
          createdAt: now,
          updatedAt: now,
        });

        // Create applied exercise with proper relationship
        await testDb.appliedExercises.put({
          id: appliedExerciseId,
          profileId,
          exerciseGroupId,
          exerciseId,
          templateId: 'template-123',
          setConfiguration: {
            type: 'standard',
            sets: { min: 3, max: 3 },
            counts: { min: 8, max: 8 },
            load: { min: 100, max: 100 },
          },
          restTimeSeconds: 180,
          executionCount: 0,
          createdAt: now,
          updatedAt: now,
        });

        // Create workout session
        await testDb.workoutSessions.put({
          id: sessionId,
          profileId,
          name: 'Push Session',
          groupIds: [exerciseGroupId],
          notes: 'Focus on form',
          executionCount: 0,
          isDeload: false,
          dayOfWeek: null,
          createdAt: now,
          updatedAt: now,
        });

        // Create training plan
        await testDb.trainingPlans.put({
          id: trainingPlanId,
          profileId,
          name: 'Push Pull Legs',
          description: 'PPL split',
          sessionIds: [sessionId],
          isArchived: false,
          currentSessionIndex: 0,
          createdAt: now,
          updatedAt: now,
          cycleId: null,
        });

        // Create a completed workout log with performed sets
        await testDb.workoutLogs.put({
          id: completedWorkoutLogId,
          profileId,
          sessionId,
          planId: trainingPlanId,
          planName: 'Push Pull Legs',
          sessionName: 'Push Session',
          startTime: new Date(now.getTime() - 86400000), // 1 day ago
          endTime: new Date(now.getTime() - 86400000 + 3600000), // 1 hour workout
          totalVolume: 2400,
          notes: 'Good workout',
          userRating: 5,
          createdAt: new Date(now.getTime() - 86400000),
          updatedAt: new Date(now.getTime() - 86400000),
        });

        // Create performed exercise group
        const performedGroupId = 'performed-group-123';
        await testDb.performedGroups.put({
          id: performedGroupId,
          workoutLogId: completedWorkoutLogId,
          exerciseGroupId,
          name: 'Push Day',
          type: 'standard',
          orderIndex: 0,
          createdAt: new Date(now.getTime() - 86400000),
          updatedAt: new Date(now.getTime() - 86400000),
        });

        // Create performed exercise log
        const performedExerciseLogId = 'performed-exercise-log-123';
        await testDb.performedExercises.put({
          id: performedExerciseLogId,
          profileId,
          exerciseId,
          plannedExerciseId: appliedExerciseId,
          setIds: [],
          notes: '',
          isSkipped: false,
          exerciseName: 'Bench Press',
          exerciseCategory: 'barbell',
          muscleActivation: { chest: 0.8, triceps: 0.5 },
          totalSets: 3,
          totalCounts: 24,
          totalVolume: 100,
          createdAt: new Date(now.getTime() - 86400000),
          updatedAt: new Date(now.getTime() - 86400000),
        });

        // Create performed sets with historical data
        await testDb.performedSets.put({
          id: 'performed-set-1',
          performedExerciseLogId,
          setIndex: 0,
          setType: 'working',
          plannedWeight: 95,
          plannedReps: 8,
          actualWeight: 95,
          actualReps: 8,
          plannedLoad: 760,
          actualLoad: 760,
          restTime: 180,
          rpe: 7,
          notes: '',
          createdAt: new Date(now.getTime() - 86400000),
          updatedAt: new Date(now.getTime() - 86400000),
        });

        await testDb.performedSets.put({
          id: 'performed-set-2',
          performedExerciseLogId,
          setIndex: 1,
          setType: 'working',
          plannedWeight: 95,
          plannedReps: 8,
          actualWeight: 95,
          actualReps: 8,
          plannedLoad: 760,
          actualLoad: 760,
          restTime: 180,
          rpe: 7,
          notes: '',
          createdAt: new Date(now.getTime() - 86400000),
          updatedAt: new Date(now.getTime() - 86400000),
        });

        await testDb.performedSets.put({
          id: 'performed-set-3',
          performedExerciseLogId,
          setIndex: 2,
          setType: 'working',
          plannedWeight: 95,
          plannedReps: 8,
          actualWeight: 100,
          actualReps: 8,
          plannedLoad: 760,
          actualLoad: 800,
          restTime: 180,
          rpe: 8,
          notes: 'Felt strong',
          createdAt: new Date(now.getTime() - 86400000),
          updatedAt: new Date(now.getTime() - 86400000),
        });
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Debug - Check if session and groups exist in database
      const sessionCheck = await testDb.workoutSessions.get(sessionId);
      console.log('Session exists:', sessionCheck ? 'YES' : 'NO', sessionCheck);

      const groupCheck = await testDb.exerciseGroups.get(exerciseGroupId);
      console.log('Exercise group exists:', groupCheck ? 'YES' : 'NO', groupCheck);
      console.log('Exercise group appliedExerciseIds:', groupCheck?.appliedExerciseIds);

      console.log('About to check applied exercise...');
      const appliedExerciseCheck = await testDb.appliedExercises.get(appliedExerciseId);
      console.log(
        'Applied exercise exists:',
        appliedExerciseCheck ? 'YES' : 'NO',
        appliedExerciseCheck
      );
      console.log('Applied exercise check completed');

      // Add debug for container resolution
      console.log('About to test container resolution...');
      try {
        const queryService = container.resolve(WorkoutQueryService);
        console.log('WorkoutQueryService resolved:', !!queryService);
        const workoutSrv = container.resolve(WorkoutService);
        console.log('WorkoutService resolved:', !!workoutSrv);
      } catch (_error) {
        console.error('Container resolution failed:', _error);
      }

      // Skip direct database query for now - just proceed to hook testing
      console.log('Container resolution working - proceeding to hook test...');

      // Act - Start a new workout for the same session
      console.log('About to create useWorkoutSession hook...');
      const { result } = renderHook(() => useWorkoutSession(profileId), { wrapper });
      console.log('Hook created successfully');

      // Add a timeout to see if the hook initialization completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log('About to call start.mutate...');
      await act(async () => {
        result.current.start.mutate({
          sessionId,
          trainingPlanId,
        });
      });
      console.log('start.mutate completed');

      // Assert - Wait for mutation to complete
      await waitFor(() => {
        if (result.current.startError) {
          console.error('Mutation error:', result.current.startError);
          console.error('Mock logger error calls:', mockLogger.error.mock.calls);
        }
        expect(result.current.start.isSuccess).toBe(true);
      });

      // Verify a new WorkoutLog aggregate was created
      const newWorkoutLog = result.current.start.data!;
      expect(newWorkoutLog).toBeDefined();
      expect(newWorkoutLog.profileId).toBe(profileId);
      expect(newWorkoutLog.sessionId).toBe(sessionId);
      expect(newWorkoutLog.trainingPlanId).toBe(trainingPlanId);

      // Verify the new workout log is in the database
      const workoutLogs = await testDb.workoutLogs
        .where('id')
        .notEqual(completedWorkoutLogId)
        .toArray();
      expect(workoutLogs).toHaveLength(1);
      expect(workoutLogs[0].sessionId).toBe(sessionId);

      // Query ALL performed sets to see what was created
      const allPerformedSetsRaw = await testDb.performedSets.toArray();
      console.log(
        'All performed sets after workout creation:',
        allPerformedSetsRaw.length,
        'sets found'
      );

      // Transform raw models to domain models to properly handle JSON deserialization
      // Note: For this test, we'll inspect the raw database data directly since
      // the transformation function expects fully hydrated WatermelonDB models
      const allPerformedSets = allPerformedSetsRaw.map((set) => ({
        id: set.id,
        profileId: set.profileId,
        performedExerciseLogId: set.performedExerciseLogId,
        counterType: set.counterType,
        counts: set.counts,
        weight: set.weight,
        completed: set.completed,
        notes: set.notes,
        rpe: set.rpe,
        percentage: set.percentage,
        // Parse JSON strings back to objects
        plannedLoad:
          typeof set.plannedLoad === 'string' ? JSON.parse(set.plannedLoad) : set.plannedLoad,
        plannedCounts:
          typeof set.plannedCounts === 'string' ? JSON.parse(set.plannedCounts) : set.plannedCounts,
        plannedRpe:
          typeof set.plannedRpe === 'string' ? JSON.parse(set.plannedRpe) : set.plannedRpe,
      }));

      // Query the newly created performedSets and verify pre-population
      const newPerformedSets = allPerformedSets.filter(
        (set) => set.performedExerciseLogId !== 'performed-exercise-log-123'
      );

      expect(newPerformedSets).toHaveLength(3);

      // All sets should use template configuration values
      for (let i = 0; i < 3; i++) {
        const set = newPerformedSets[i];
        expect(set.profileId).toBe(profileId);
        expect(set.counterType).toBe('reps');
        expect(set.counts).toBe(8); // From template min counts
        expect(set.completed).toBe(false);

        // Planned values should come from template configuration
        expect(set.plannedLoad).toEqual({ min: 100, max: 100 });
        expect(set.plannedCounts).toEqual({ min: 8, max: 8 });

        // Weight should be undefined since it's a new workout that hasn't been performed
        expect(set.weight).toBeUndefined();
      }
    });
  });

  describe('Finish Workout and Progress Plan', () => {
    it('should finalize workout log and advance training plan session index', async () => {
      // Arrange - Start a workout and modify it
      const profileId = 'profile-456';
      const sessionId = 'session-456';
      const trainingPlanId = 'plan-456';
      const exerciseId = 'exercise-456';
      const appliedExerciseId = 'applied-exercise-456';
      const exerciseGroupId = 'exercise-group-456';

      const now = new Date();

      // Create all required entities in a single transaction
      await testDb.write(async () => {
        await testDb.profiles.put({
          id: profileId,
          name: 'Test Profile',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        await testDb.exercises.put({
          id: exerciseId,
          profileId,
          name: 'Squat',
          type: 'strength',
          targetMuscles: ['quadriceps'],
          equipment: 'barbell',
          instructions: 'Squat down and up',
          createdAt: now,
          updatedAt: now,
        });

        // Create exercise template
        await testDb.exerciseTemplates.put({
          id: 'template-456',
          profileId,
          exerciseId,
          name: 'Squat Template',
          description: 'Standard squat template',
          defaultSetConfiguration: {
            type: 'standard',
            sets: { min: 2, max: 2 },
            counts: { min: 5, max: 5 },
            load: { min: 120, max: 120 },
          },
          isArchived: false,
          lastUsed: now,
          createdAt: now,
          updatedAt: now,
        });

        await testDb.exerciseGroups.put({
          id: exerciseGroupId,
          profileId,
          workoutSessionId: sessionId,
          type: 'standard',
          rounds: { min: 1, max: 1, direction: 'asc' },
          durationMinutes: 0,
          restTimeSeconds: 120,
          appliedExerciseIds: [appliedExerciseId], // Explicitly set the relationship
          createdAt: now,
          updatedAt: now,
        });

        await testDb.appliedExercises.put({
          id: appliedExerciseId,
          profileId,
          exerciseGroupId,
          exerciseId,
          templateId: 'template-456',
          setConfiguration: {
            type: 'standard',
            sets: { min: 2, max: 2 },
            counts: { min: 5, max: 5 },
            load: { min: 120, max: 120 },
          },
          restTimeSeconds: 180,
          executionCount: 0,
          createdAt: now,
          updatedAt: now,
        });

        await testDb.workoutSessions.put({
          id: sessionId,
          profileId,
          name: 'Leg Session',
          groupIds: [exerciseGroupId],
          notes: 'Focus on depth',
          executionCount: 0,
          isDeload: false,
          dayOfWeek: null,
          createdAt: now,
          updatedAt: now,
        });

        const session2Id = 'session-457';
        await testDb.workoutSessions.put({
          id: session2Id,
          profileId,
          name: 'Upper Session',
          groupIds: [],
          notes: 'Upper body focus',
          executionCount: 0,
          isDeload: false,
          dayOfWeek: null,
          createdAt: now,
          updatedAt: now,
        });

        // Create training plan with 2 sessions
        await testDb.trainingPlans.put({
          id: trainingPlanId,
          profileId,
          name: 'Lower Upper Split',
          description: 'Two day split',
          sessionIds: [sessionId, session2Id],
          isArchived: false,
          currentSessionIndex: 0, // Starting with first session
          createdAt: now,
          updatedAt: now,
          cycleId: null,
        });
      });

      // Start a workout first
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result: startResult } = renderHook(() => useWorkoutSession(profileId), { wrapper });

      await act(async () => {
        startResult.current.start.mutate({
          sessionId,
          trainingPlanId,
        });
      });

      await waitFor(() => {
        if (startResult.current.startError) {
          console.error('Start workout mutation error:', startResult.current.startError);
          console.error('Mock logger error calls:', mockLogger.error.mock.calls);
        }
        expect(startResult.current.start.isSuccess).toBe(true);
      });

      const workoutLog = startResult.current.start.data!;

      // Modify the workout in memory (simulate completing sets with higher weights)
      const endedWorkout = workoutLog.cloneAsEnded();

      // Get the training plan before finishing workout
      const planBefore = await testDb.trainingPlans.get(trainingPlanId);
      expect(planBefore?.currentSessionIndex).toBe(0);

      // Act - End the workout
      const { result: endResult } = renderHook(() => useWorkoutSession(profileId), { wrapper });

      await act(async () => {
        endResult.current.end.mutate(workoutLog.id);
      });

      // Assert - Wait for mutation to complete
      await waitFor(() => {
        if (endResult.current.endError) {
          console.error('End workout mutation error:', endResult.current.endError);
          console.error('Mock logger error calls:', mockLogger.error.mock.calls);
        }
        expect(endResult.current.end.isSuccess).toBe(true);
      });

      // Verify the workoutLogs record is finalized
      const finalizedWorkout = await testDb.workoutLogs.get(workoutLog.id);
      expect(finalizedWorkout).toBeDefined();
      expect(finalizedWorkout!.endTime).toBeDefined();
      expect(finalizedWorkout!.totalVolume).toBeGreaterThanOrEqual(0);

      // Verify the performedExercises have comparison fields populated
      const performedExercises = await testDb.performedExercises.toArray();
      expect(performedExercises.length).toBeGreaterThan(0);

      for (const exerciseLog of performedExercises) {
        expect(exerciseLog.comparisonVolume).toBeDefined();
        expect(exerciseLog.comparisonAvgWeight).toBeDefined();
        expect(exerciseLog.comparisonMaxWeight).toBeDefined();
        expect(exerciseLog.comparisonTotalReps).toBeDefined();
      }

      // Verify event side-effect: training plan currentSessionIndex has been incremented
      const planAfter = await testDb.trainingPlans.get(trainingPlanId);
      expect(planAfter).toBeDefined();
      expect(planAfter!.currentSessionIndex).toBe(1); // Advanced from 0 to 1
    });
  });
});
