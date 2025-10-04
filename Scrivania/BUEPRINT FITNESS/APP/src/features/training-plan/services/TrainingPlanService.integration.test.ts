import { Database } from '@nozbe/watermelondb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConsoleLogger } from '@/app/services/ConsoleLogger';
import {
  AppliedExerciseRepository,
  ExerciseGroupRepository,
  TrainingCycleRepository,
  TrainingPlanRepository,
  WorkoutSessionRepository,
} from '@/features/training-plan/data';
import { createTestDatabase } from '@/test-database';
import {
  createTestAppliedExerciseModel,
  createTestExerciseGroupModel,
  createTestSessionModel,
  createTestTrainingCycleModel,
  createTestTrainingPlanModel,
} from '@/test-factories';

import { TrainingPlanService } from './TrainingPlanService';

describe('TrainingPlanService Integration Tests', () => {
  let trainingPlanService: TrainingPlanService;
  let trainingPlanRepository: TrainingPlanRepository;
  let trainingCycleRepository: TrainingCycleRepository;
  let workoutSessionRepository: WorkoutSessionRepository;
  let exerciseGroupRepository: ExerciseGroupRepository;
  let appliedExerciseRepository: AppliedExerciseRepository;
  let testDb: Database;

  const testProfileId = 'integration-test-profile-id';

  beforeEach(async () => {
    // Create a test database instance
    testDb = createTestDatabase();

    // Create repositories with test database
    appliedExerciseRepository = new AppliedExerciseRepository(testDb);
    exerciseGroupRepository = new ExerciseGroupRepository(appliedExerciseRepository, testDb);
    workoutSessionRepository = new WorkoutSessionRepository(
      exerciseGroupRepository,
      appliedExerciseRepository,
      testDb
    );

    trainingPlanRepository = new TrainingPlanRepository(workoutSessionRepository, testDb);
    trainingCycleRepository = new TrainingCycleRepository(testDb);

    trainingPlanService = new TrainingPlanService(
      trainingPlanRepository,
      trainingCycleRepository,
      new ConsoleLogger()
    );
  });

  afterEach(async () => {
    // No explicit cleanup needed for test database instances
  });

  describe('deleteTrainingPlan with cascading delete', () => {
    it('should delete training plan and all descendant entities', async () => {
      // Arrange: Create a complex training plan with nested entities

      // 1. Create applied exercises
      const appliedExercise1 = createTestAppliedExerciseModel({
        id: 'applied-exercise-1',
        profileId: testProfileId,
        exerciseId: 'test-exercise-1',
        name: 'Bench Press',
      });

      const appliedExercise2 = createTestAppliedExerciseModel({
        id: 'applied-exercise-2',
        profileId: testProfileId,
        exerciseId: 'test-exercise-2',
        name: 'Squat',
      });

      // 2. Create exercise groups containing the applied exercises
      const exerciseGroup1 = createTestExerciseGroupModel(
        {
          id: 'exercise-group-1',
          profileId: testProfileId,
          name: 'Upper Body',
        },
        [appliedExercise1]
      );

      const exerciseGroup2 = createTestExerciseGroupModel(
        {
          id: 'exercise-group-2',
          profileId: testProfileId,
          name: 'Lower Body',
        },
        [appliedExercise2]
      );

      // 3. Create sessions containing the exercise groups
      const session1 = createTestSessionModel(
        {
          id: 'session-1',
          profileId: testProfileId,
          name: 'Push Day',
        },
        [exerciseGroup1]
      );

      const session2 = createTestSessionModel(
        {
          id: 'session-2',
          profileId: testProfileId,
          name: 'Pull Day',
        },
        [exerciseGroup2]
      );

      // 4. Create training plan containing the sessions
      const trainingPlan = createTestTrainingPlanModel(
        {
          id: 'training-plan-1',
          profileId: testProfileId,
          name: 'Push/Pull Split',
          description: 'A comprehensive push/pull training split',
          isArchived: false,
          currentSessionIndex: 0,
        },
        [session1, session2]
      );

      // Save the training plan (which should cascade save all children)
      const savedPlan = await trainingPlanRepository.save(trainingPlan);
      expect(savedPlan).toBeDefined();

      // Verify that all entities exist in the database before deletion
      const planBeforeDelete = await trainingPlanRepository.findById('training-plan-1');
      expect(planBeforeDelete).toBeDefined();
      expect(planBeforeDelete?.sessions).toHaveLength(2);

      const session1BeforeDelete = await workoutSessionRepository.findById('session-1');
      expect(session1BeforeDelete).toBeDefined();

      const exerciseGroup1BeforeDelete = await exerciseGroupRepository.findById('exercise-group-1');
      expect(exerciseGroup1BeforeDelete).toBeDefined();

      const appliedExercise1BeforeDelete =
        await appliedExerciseRepository.findById('applied-exercise-1');
      expect(appliedExercise1BeforeDelete).toBeDefined();

      // Act: Delete the training plan with cascading delete
      const deleteResult = await trainingPlanService.deleteTrainingPlan('training-plan-1', true);

      // Assert: Verify successful deletion
      expect(deleteResult.isSuccess).toBe(true);

      // Verify that the training plan is deleted
      const planAfterDelete = await trainingPlanRepository.findById('training-plan-1');
      expect(planAfterDelete).toBeUndefined();

      // Verify that all child entities are also deleted (cascading delete)
      const session1AfterDelete = await workoutSessionRepository.findById('session-1');
      expect(session1AfterDelete).toBeUndefined();

      const session2AfterDelete = await workoutSessionRepository.findById('session-2');
      expect(session2AfterDelete).toBeUndefined();

      const exerciseGroup1AfterDelete = await exerciseGroupRepository.findById('exercise-group-1');
      expect(exerciseGroup1AfterDelete).toBeUndefined();

      const exerciseGroup2AfterDelete = await exerciseGroupRepository.findById('exercise-group-2');
      expect(exerciseGroup2AfterDelete).toBeUndefined();

      const appliedExercise1AfterDelete =
        await appliedExerciseRepository.findById('applied-exercise-1');
      expect(appliedExercise1AfterDelete).toBeUndefined();

      const appliedExercise2AfterDelete =
        await appliedExerciseRepository.findById('applied-exercise-2');
      expect(appliedExercise2AfterDelete).toBeUndefined();
    });

    it('should handle deletion of non-existent training plan gracefully', async () => {
      // Act: Try to delete a non-existent training plan
      const deleteResult = await trainingPlanService.deleteTrainingPlan('non-existent-plan-id');

      // Assert: Should return a NotFoundError
      expect(deleteResult.isFailure).toBe(true);
      if (deleteResult.isFailure) {
        expect(deleteResult.error.message).toBe('Training plan not found');
      }
    });

    it('should delete empty training plan successfully', async () => {
      // Arrange: Create a training plan with no sessions
      const emptyTrainingPlan = createTestTrainingPlanModel({
        id: 'empty-training-plan',
        profileId: testProfileId,
        name: 'Empty Plan',
        sessions: [],
      });

      const savedPlan = await trainingPlanRepository.save(emptyTrainingPlan);
      expect(savedPlan).toBeDefined();

      // Act: Delete the empty training plan
      const deleteResult = await trainingPlanService.deleteTrainingPlan('empty-training-plan');

      // Assert: Should succeed
      expect(deleteResult.isSuccess).toBe(true);

      // Verify deletion
      const planAfterDelete = await trainingPlanRepository.findById('empty-training-plan');
      expect(planAfterDelete).toBeUndefined();
    });

    it('should delete training plan with complex nested structure', async () => {
      // Arrange: Create a more complex structure with multiple levels
      const appliedExercises = Array.from({ length: 3 }, (_, i) =>
        createTestAppliedExerciseModel({
          id: `applied-exercise-${i + 1}`,
          profileId: testProfileId,
          exerciseId: `exercise-${i + 1}`,
          name: `Exercise ${i + 1}`,
        })
      );

      const exerciseGroups = Array.from({ length: 4 }, (_, i) =>
        createTestExerciseGroupModel(
          {
            id: `exercise-group-${i + 1}`,
            profileId: testProfileId,
            name: `Group ${i + 1}`,
          },
          appliedExercises.slice(i % 2, (i % 2) + 2)
        )
      );

      const sessions = Array.from({ length: 4 }, (_, i) =>
        createTestSessionModel(
          {
            id: `session-${i + 1}`,
            profileId: testProfileId,
            name: `Session ${i + 1}`,
          },
          [exerciseGroups[i]]
        )
      );

      const complexTrainingPlan = createTestTrainingPlanModel(
        {
          id: 'complex-training-plan',
          profileId: testProfileId,
          name: 'Complex Training Plan',
          description: 'A complex plan with multiple sessions and groups',
        },
        sessions
      );

      // Save the complex plan
      await trainingPlanRepository.save(complexTrainingPlan);

      // Verify structure exists
      const planBeforeDelete = await trainingPlanRepository.findById('complex-training-plan');
      expect(planBeforeDelete?.sessions).toHaveLength(4);

      // Act: Delete the complex training plan
      const deleteResult = await trainingPlanService.deleteTrainingPlan('complex-training-plan');

      // Assert: Should succeed and cascade delete all entities
      expect(deleteResult.isSuccess).toBe(true);

      // Verify complete deletion
      const planAfterDelete = await trainingPlanRepository.findById('complex-training-plan');
      expect(planAfterDelete).toBeUndefined();

      // Check that all sessions are deleted
      for (let i = 1; i <= 4; i++) {
        const sessionAfterDelete = await workoutSessionRepository.findById(`session-${i}`);
        expect(sessionAfterDelete).toBeUndefined();
      }

      // Check that all exercise groups are deleted
      for (let i = 1; i <= 4; i++) {
        const groupAfterDelete = await exerciseGroupRepository.findById(`exercise-group-${i}`);
        expect(groupAfterDelete).toBeUndefined();
      }

      // Check that all applied exercises are deleted
      for (let i = 1; i <= 3; i++) {
        const exerciseAfterDelete = await appliedExerciseRepository.findById(
          `applied-exercise-${i}`
        );
        expect(exerciseAfterDelete).toBeUndefined();
      }
    });
  });

  describe('deleteTrainingCycle with plan cleanup', () => {
    it('should delete training cycle and remove cycle references from plans', async () => {
      // Arrange: Create a training cycle and associated plans
      const trainingCycle = createTestTrainingCycleModel({
        id: 'test-cycle-1',
        profileId: testProfileId,
        name: 'Strength Cycle',
        goal: 'strength',
      });

      const plan1 = createTestTrainingPlanModel({
        id: 'plan-1',
        profileId: testProfileId,
        name: 'Plan 1',
        cycleId: 'test-cycle-1',
      });

      const plan2 = createTestTrainingPlanModel({
        id: 'plan-2',
        profileId: testProfileId,
        name: 'Plan 2',
        cycleId: 'test-cycle-1',
      });

      // Save cycle and plans
      await trainingCycleRepository.save(trainingCycle);
      await trainingPlanRepository.save(plan1);
      await trainingPlanRepository.save(plan2);

      // Verify initial state
      const cycleBeforeDelete = await trainingCycleRepository.findById('test-cycle-1');
      expect(cycleBeforeDelete).toBeDefined();

      const plan1BeforeDelete = await trainingPlanRepository.findById('plan-1');
      expect(plan1BeforeDelete?.cycleId).toBe('test-cycle-1');

      // Act: Delete the training cycle
      const deleteResult = await trainingPlanService.deleteTrainingCycle('test-cycle-1');

      // Assert: Should succeed
      expect(deleteResult.isSuccess).toBe(true);

      // Verify cycle is deleted
      const cycleAfterDelete = await trainingCycleRepository.findById('test-cycle-1');
      expect(cycleAfterDelete).toBeUndefined();

      // Verify plans still exist but with null cycle references
      const plan1AfterDelete = await trainingPlanRepository.findById('plan-1');
      expect(plan1AfterDelete).toBeDefined();
      expect(plan1AfterDelete?.cycleId).toBeNull();

      const plan2AfterDelete = await trainingPlanRepository.findById('plan-2');
      expect(plan2AfterDelete).toBeDefined();
      expect(plan2AfterDelete?.cycleId).toBeNull();
    });
  });
});
