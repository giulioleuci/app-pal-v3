import { Database } from '@nozbe/watermelondb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { generateId } from '@/lib';
import { createTestDatabase } from '@/test-database';
import {
  createTestAppliedExerciseModel,
  createTestExerciseGroupModel,
  createTestSessionModel,
  createTestTrainingPlanData,
  createTestTrainingPlanModel,
} from '@/test-factories';

import { SessionModel } from '../domain/SessionModel';
import { TrainingPlanModel } from '../domain/TrainingPlanModel';
import { AppliedExerciseRepository } from './AppliedExerciseRepository';
import { ExerciseGroupRepository } from './ExerciseGroupRepository';
import { TrainingPlanRepository } from './TrainingPlanRepository';
import { WorkoutSessionRepository } from './WorkoutSessionRepository';

/**
 * Integration tests for TrainingPlanRepository.
 * Tests the complete flow of data persistence, retrieval, and hydration/dehydration
 * between TrainingPlanModel domain aggregates and the database layer.
 * Uses real repository instances to test full integration with child entities.
 */
describe('TrainingPlanRepository', () => {
  let testDb: Database;
  let repository: TrainingPlanRepository;
  let sessionRepository: WorkoutSessionRepository;
  let exerciseGroupRepository: ExerciseGroupRepository;
  let appliedExerciseRepository: AppliedExerciseRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();

    // Create real repository instances for full integration testing
    appliedExerciseRepository = new AppliedExerciseRepository(testDb);
    exerciseGroupRepository = new ExerciseGroupRepository(appliedExerciseRepository, testDb);
    sessionRepository = new WorkoutSessionRepository(
      exerciseGroupRepository,
      appliedExerciseRepository,
      testDb
    );
    repository = new TrainingPlanRepository(sessionRepository, testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a complete TrainingPlanModel aggregate with all child entities', async () => {
      // Arrange - Create a complex aggregate with sessions, groups, and applied exercises
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();
      const appliedExercise3 = createTestAppliedExerciseModel();
      const appliedExercise4 = createTestAppliedExerciseModel();

      const group1 = createTestExerciseGroupModel({}, [appliedExercise1, appliedExercise2]);
      const group2 = createTestExerciseGroupModel({}, [appliedExercise3]);
      const group3 = createTestExerciseGroupModel({}, [appliedExercise4]);

      const session1 = createTestSessionModel({}, [group1, group2]);
      const session2 = createTestSessionModel({}, [group3]);

      const trainingPlanModel = createTestTrainingPlanModel({}, [session1, session2]);

      // Act
      const result = await repository.save(trainingPlanModel);

      // Assert
      expect(result).toBe(trainingPlanModel);

      // Verify training plan data was persisted
      const savedPlanData = await testDb.trainingPlans.get(trainingPlanModel.id);
      expect(savedPlanData).toBeDefined();
      expect(savedPlanData!.id).toBe(trainingPlanModel.id);
      expect(savedPlanData!.profileId).toBe(trainingPlanModel.profileId);
      expect(savedPlanData!.name).toBe(trainingPlanModel.name);
      expect(savedPlanData!.description).toBe(trainingPlanModel.description);
      expect(savedPlanData!.sessionIds).toEqual([session1.id, session2.id]);
      expect(savedPlanData!.isArchived).toBe(trainingPlanModel.isArchived);
      expect(savedPlanData!.currentSessionIndex).toBe(trainingPlanModel.currentSessionIndex);
      expect(savedPlanData!.notes).toBe(trainingPlanModel.notes);
      expect(savedPlanData!.cycleId).toBe(trainingPlanModel.cycleId);
      expect(savedPlanData!.order).toBe(trainingPlanModel.order);

      // Verify all sessions were persisted
      const savedSession1 = await testDb.workoutSessions.get(session1.id);
      const savedSession2 = await testDb.workoutSessions.get(session2.id);
      expect(savedSession1).toBeDefined();
      expect(savedSession2).toBeDefined();
      expect(savedSession1!.name).toBe(session1.name);
      expect(savedSession2!.name).toBe(session2.name);

      // Verify all groups were persisted
      const savedGroup1 = await testDb.exerciseGroups.get(group1.id);
      const savedGroup2 = await testDb.exerciseGroups.get(group2.id);
      const savedGroup3 = await testDb.exerciseGroups.get(group3.id);
      expect(savedGroup1).toBeDefined();
      expect(savedGroup2).toBeDefined();
      expect(savedGroup3).toBeDefined();

      // Verify all applied exercises were persisted
      const savedAppliedExercise1 = await testDb.appliedExercises.get(appliedExercise1.id);
      const savedAppliedExercise2 = await testDb.appliedExercises.get(appliedExercise2.id);
      const savedAppliedExercise3 = await testDb.appliedExercises.get(appliedExercise3.id);
      const savedAppliedExercise4 = await testDb.appliedExercises.get(appliedExercise4.id);
      expect(savedAppliedExercise1).toBeDefined();
      expect(savedAppliedExercise2).toBeDefined();
      expect(savedAppliedExercise3).toBeDefined();
      expect(savedAppliedExercise4).toBeDefined();
    });

    it('should update existing training plan when saving with same id', async () => {
      // Arrange
      const originalData = createTestTrainingPlanData({
        name: 'Original Plan',
        description: 'Original description',
        notes: 'Original notes',
        isArchived: false,
      });

      // Use proper WatermelonDB transaction for setup
      await testDb.write(async () => {
        await testDb.trainingPlans.put(originalData);
      });

      const updatedModel = TrainingPlanModel.hydrate(
        {
          ...originalData,
          name: 'Updated Plan',
          description: 'Updated description',
          notes: 'Updated notes',
          isArchived: true,
        },
        []
      );

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const savedData = await testDb.trainingPlans.get(originalData.id);
      expect(savedData).toBeDefined();
      expect(savedData!.name).toBe('Updated Plan');
      expect(savedData!.description).toBe('Updated description');
      expect(savedData!.notes).toBe('Updated notes');
      expect(savedData!.isArchived).toBe(true);
      expect(savedData!.id).toBe(originalData.id);
    });

    it('should handle training plans with no sessions', async () => {
      // Arrange
      const trainingPlanModel = createTestTrainingPlanModel({}, []);

      // Act
      const result = await repository.save(trainingPlanModel);

      // Assert
      expect(result).toBe(trainingPlanModel);

      // Verify training plan data was persisted
      const savedData = await testDb.trainingPlans.get(trainingPlanModel.id);
      expect(savedData).toBeDefined();
      expect(savedData!.sessionIds).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a complete TrainingPlanModel aggregate when training plan exists', async () => {
      // Arrange - Create and persist a complex aggregate
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();

      const group1 = createTestExerciseGroupModel({}, [appliedExercise1]);
      const group2 = createTestExerciseGroupModel({}, [appliedExercise2]);

      const session1 = createTestSessionModel({}, [group1]);
      const session2 = createTestSessionModel({}, [group2]);

      const originalModel = createTestTrainingPlanModel({}, [session1, session2]);

      // Persist the entire aggregate
      await repository.save(originalModel);

      // Act
      const result = await repository.findById(originalModel.id);

      // Assert
      expect(result).toBeInstanceOf(TrainingPlanModel);
      expect(result!.id).toBe(originalModel.id);
      expect(result!.profileId).toBe(originalModel.profileId);
      expect(result!.name).toBe(originalModel.name);
      expect(result!.description).toBe(originalModel.description);
      expect(result!.isArchived).toBe(originalModel.isArchived);
      expect(result!.currentSessionIndex).toBe(originalModel.currentSessionIndex);
      expect(result!.notes).toBe(originalModel.notes);
      expect(result!.cycleId).toBe(originalModel.cycleId);
      expect(result!.order).toBe(originalModel.order);
      expect(result!.createdAt).toEqual(originalModel.createdAt);
      expect(result!.updatedAt).toEqual(originalModel.updatedAt);

      // Verify sessions are properly hydrated
      expect(result!.sessions).toHaveLength(2);
      expect(result!.sessions.every((s) => s instanceof SessionModel)).toBe(true);

      const retrievedSession1 = result!.sessions.find((s) => s.id === session1.id);
      const retrievedSession2 = result!.sessions.find((s) => s.id === session2.id);
      expect(retrievedSession1).toBeDefined();
      expect(retrievedSession2).toBeDefined();
      expect(retrievedSession1!.name).toBe(session1.name);
      expect(retrievedSession2!.name).toBe(session2.name);

      // Verify groups and applied exercises are properly hydrated
      expect(retrievedSession1!.groups).toHaveLength(1);
      expect(retrievedSession2!.groups).toHaveLength(1);
      expect(retrievedSession1!.groups[0].appliedExercises).toHaveLength(1);
      expect(retrievedSession2!.groups[0].appliedExercises).toHaveLength(1);
    });

    it('should return undefined when training plan does not exist', async () => {
      // Arrange
      const nonExistentId = generateId();

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle training plans with no sessions', async () => {
      // Arrange
      const testData = createTestTrainingPlanData({ sessionIds: [] });

      // Use proper WatermelonDB transaction for setup
      await testDb.write(async () => {
        await testDb.trainingPlans.put(testData);
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(TrainingPlanModel);
      expect(result!.sessions).toHaveLength(0);
    });

    it('should correctly hydrate domain model with business logic methods', async () => {
      // Arrange
      const session1 = createTestSessionModel({ isDeload: true });
      const session2 = createTestSessionModel({ isDeload: false });
      const trainingPlanModel = createTestTrainingPlanModel({ currentSessionIndex: 0 }, [
        session1,
        session2,
      ]);

      await repository.save(trainingPlanModel);

      // Act
      const result = await repository.findById(trainingPlanModel.id);

      // Assert
      expect(result).toBeInstanceOf(TrainingPlanModel);
      expect(result!.getTotalSessions()).toBe(2);
      expect(result!.getDeloadSessionCount()).toBe(1);
      expect(result!.getCurrentSession()).toBeDefined();
      expect(result!.findSessionById(session1.id)).toBeDefined();
      expect(typeof result!.estimateTotalDurationMinutes()).toBe('object');
    });
  });

  describe('findAll', () => {
    it('should return all training plans for a given profile ID', async () => {
      // Arrange
      const profileId = generateId();
      const otherProfileId = generateId();

      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();
      const session3 = createTestSessionModel();

      const plan1 = createTestTrainingPlanModel({ profileId }, [session1]);
      const plan2 = createTestTrainingPlanModel({ profileId }, [session2]);
      const plan3 = createTestTrainingPlanModel({ profileId: otherProfileId }, [session3]);

      await repository.save(plan1);
      await repository.save(plan2);
      await repository.save(plan3);

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((plan) => plan instanceof TrainingPlanModel)).toBe(true);
      expect(result.every((plan) => plan.profileId === profileId)).toBe(true);

      const resultIds = result.map((plan) => plan.id);
      expect(resultIds).toContain(plan1.id);
      expect(resultIds).toContain(plan2.id);
      expect(resultIds).not.toContain(plan3.id);

      // Verify sessions are properly hydrated
      expect(result.every((plan) => plan.sessions.length > 0)).toBe(true);
    });

    it('should filter by archived status when provided', async () => {
      // Arrange
      const profileId = generateId();
      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();
      const session3 = createTestSessionModel();

      const archivedPlan = createTestTrainingPlanModel({ profileId, isArchived: true }, [session1]);
      const activePlan1 = createTestTrainingPlanModel({ profileId, isArchived: false }, [session2]);
      const activePlan2 = createTestTrainingPlanModel({ profileId, isArchived: false }, [session3]);

      await repository.save(archivedPlan);
      await repository.save(activePlan1);
      await repository.save(activePlan2);

      // Act - Filter for archived plans
      const archivedResult = await repository.findAll(profileId, { isArchived: true });

      // Act - Filter for active plans
      const activeResult = await repository.findAll(profileId, { isArchived: false });

      // Assert
      expect(archivedResult).toHaveLength(1);
      expect(archivedResult[0].id).toBe(archivedPlan.id);
      expect(archivedResult[0].isArchived).toBe(true);

      expect(activeResult).toHaveLength(2);
      expect(activeResult.every((plan) => plan.isArchived === false)).toBe(true);
      const activeIds = activeResult.map((plan) => plan.id);
      expect(activeIds).toContain(activePlan1.id);
      expect(activeIds).toContain(activePlan2.id);
    });

    it('should filter by cycle ID when provided', async () => {
      // Arrange
      const profileId = generateId();
      const cycleId = generateId();
      const otherCycleId = generateId();

      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();
      const session3 = createTestSessionModel();

      const planWithCycle1 = createTestTrainingPlanModel({ profileId, cycleId }, [session1]);
      const planWithCycle2 = createTestTrainingPlanModel({ profileId, cycleId }, [session2]);
      const planWithDifferentCycle = createTestTrainingPlanModel(
        { profileId, cycleId: otherCycleId },
        [session3]
      );

      await repository.save(planWithCycle1);
      await repository.save(planWithCycle2);
      await repository.save(planWithDifferentCycle);

      // Act
      const result = await repository.findAll(profileId, { cycleId });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((plan) => plan.cycleId === cycleId)).toBe(true);

      const resultIds = result.map((plan) => plan.id);
      expect(resultIds).toContain(planWithCycle1.id);
      expect(resultIds).toContain(planWithCycle2.id);
      expect(resultIds).not.toContain(planWithDifferentCycle.id);
    });

    it('should filter by both archived status and cycle ID when both provided', async () => {
      // Arrange
      const profileId = generateId();
      const cycleId = generateId();

      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();
      const session3 = createTestSessionModel();
      const session4 = createTestSessionModel();

      const archivedWithCycle = createTestTrainingPlanModel(
        { profileId, cycleId, isArchived: true },
        [session1]
      );
      const activeWithCycle = createTestTrainingPlanModel(
        { profileId, cycleId, isArchived: false },
        [session2]
      );
      const archivedWithoutCycle = createTestTrainingPlanModel(
        { profileId, cycleId: null, isArchived: true },
        [session3]
      );
      const activeWithoutCycle = createTestTrainingPlanModel(
        { profileId, cycleId: null, isArchived: false },
        [session4]
      );

      await repository.save(archivedWithCycle);
      await repository.save(activeWithCycle);
      await repository.save(archivedWithoutCycle);
      await repository.save(activeWithoutCycle);

      // Act
      const result = await repository.findAll(profileId, { cycleId, isArchived: true });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(archivedWithCycle.id);
      expect(result[0].cycleId).toBe(cycleId);
      expect(result[0].isArchived).toBe(true);
    });

    it('should return empty array when no training plans exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = generateId();

      // Act
      const result = await repository.findAll(nonExistentProfileId);

      // Assert
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should correctly hydrate all returned models with complete aggregates', async () => {
      // Arrange
      const profileId = generateId();

      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();

      const group1 = createTestExerciseGroupModel({}, [appliedExercise1]);
      const group2 = createTestExerciseGroupModel({}, [appliedExercise2]);

      const session1 = createTestSessionModel({}, [group1]);
      const session2 = createTestSessionModel({}, [group2]);

      const plan1 = createTestTrainingPlanModel({ profileId, currentSessionIndex: 0 }, [session1]);
      const plan2 = createTestTrainingPlanModel({ profileId, currentSessionIndex: 0 }, [session2]);

      await repository.save(plan1);
      await repository.save(plan2);

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((plan) => plan instanceof TrainingPlanModel)).toBe(true);

      // Verify business logic methods work on all plans
      result.forEach((plan) => {
        expect(plan.getTotalSessions()).toBeGreaterThan(0);
        expect(typeof plan.estimateTotalDurationMinutes()).toBe('object');
        expect(plan.getCurrentSession()).toBeDefined();
      });

      // Verify complete aggregate hydration
      result.forEach((plan) => {
        expect(plan.sessions.every((s) => s instanceof SessionModel)).toBe(true);
        plan.sessions.forEach((session) => {
          expect(session.groups.length).toBeGreaterThan(0);
          session.groups.forEach((group) => {
            expect(group.appliedExercises.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('delete', () => {
    it('should remove training plan and all child entities from database', async () => {
      // Arrange - Create a complex aggregate
      const appliedExercise1 = createTestAppliedExerciseModel();
      const appliedExercise2 = createTestAppliedExerciseModel();

      const group1 = createTestExerciseGroupModel({}, [appliedExercise1]);
      const group2 = createTestExerciseGroupModel({}, [appliedExercise2]);

      const session1 = createTestSessionModel({}, [group1]);
      const session2 = createTestSessionModel({}, [group2]);

      const trainingPlanModel = createTestTrainingPlanModel({}, [session1, session2]);

      await repository.save(trainingPlanModel);

      // Verify everything exists before deletion
      const beforePlan = await testDb.trainingPlans.get(trainingPlanModel.id);
      const beforeSession1 = await testDb.workoutSessions.get(session1.id);
      const beforeSession2 = await testDb.workoutSessions.get(session2.id);
      const beforeGroup1 = await testDb.exerciseGroups.get(group1.id);
      const beforeGroup2 = await testDb.exerciseGroups.get(group2.id);
      const beforeAppliedExercise1 = await testDb.appliedExercises.get(appliedExercise1.id);
      const beforeAppliedExercise2 = await testDb.appliedExercises.get(appliedExercise2.id);

      expect(beforePlan).toBeDefined();
      expect(beforeSession1).toBeDefined();
      expect(beforeSession2).toBeDefined();
      expect(beforeGroup1).toBeDefined();
      expect(beforeGroup2).toBeDefined();
      expect(beforeAppliedExercise1).toBeDefined();
      expect(beforeAppliedExercise2).toBeDefined();

      // Act
      await repository.delete(trainingPlanModel.id);

      // Assert - Verify cascade deletion
      const afterPlan = await testDb.trainingPlans.get(trainingPlanModel.id);
      const afterSession1 = await testDb.workoutSessions.get(session1.id);
      const afterSession2 = await testDb.workoutSessions.get(session2.id);
      const afterGroup1 = await testDb.exerciseGroups.get(group1.id);
      const afterGroup2 = await testDb.exerciseGroups.get(group2.id);
      const afterAppliedExercise1 = await testDb.appliedExercises.get(appliedExercise1.id);
      const afterAppliedExercise2 = await testDb.appliedExercises.get(appliedExercise2.id);

      expect(afterPlan).toBeUndefined();
      expect(afterSession1).toBeUndefined();
      expect(afterSession2).toBeUndefined();
      expect(afterGroup1).toBeUndefined();
      expect(afterGroup2).toBeUndefined();
      expect(afterAppliedExercise1).toBeUndefined();
      expect(afterAppliedExercise2).toBeUndefined();
    });

    it('should not throw error when deleting non-existent training plan', async () => {
      // Arrange
      const nonExistentId = generateId();

      // Act & Assert - should not throw
      await expect(repository.delete(nonExistentId)).resolves.toBeUndefined();
    });

    it('should only delete specified training plan and its children', async () => {
      // Arrange
      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();

      const plan1 = createTestTrainingPlanModel({}, [session1]);
      const plan2 = createTestTrainingPlanModel({}, [session2]);

      await repository.save(plan1);
      await repository.save(plan2);

      // Act
      await repository.delete(plan1.id);

      // Assert
      const deletedPlan = await testDb.trainingPlans.get(plan1.id);
      const remainingPlan = await testDb.trainingPlans.get(plan2.id);
      const deletedSession = await testDb.workoutSessions.get(session1.id);
      const remainingSession = await testDb.workoutSessions.get(session2.id);

      expect(deletedPlan).toBeUndefined();
      expect(remainingPlan).toBeDefined();
      expect(deletedSession).toBeUndefined();
      expect(remainingSession).toBeDefined();
      expect(remainingPlan!.id).toBe(plan2.id);
    });

    it('should handle training plans with no sessions', async () => {
      // Arrange
      const trainingPlanModel = createTestTrainingPlanModel({}, []);
      await repository.save(trainingPlanModel);

      // Act
      await repository.delete(trainingPlanModel.id);

      // Assert
      const afterDelete = await testDb.trainingPlans.get(trainingPlanModel.id);
      expect(afterDelete).toBeUndefined();
    });
  });

  describe('round trip testing', () => {
    it('should maintain complete data integrity through save and retrieve cycle', async () => {
      // Arrange - Create a complex aggregate with all possible data
      const appliedExercise1 = createTestAppliedExerciseModel({
        executionCount: 5,
        restTimeSeconds: 90,
      });
      const appliedExercise2 = createTestAppliedExerciseModel({
        executionCount: 3,
        restTimeSeconds: 120,
      });

      const group1 = createTestExerciseGroupModel(
        {
          type: 'superset',
          restTimeSeconds: 180,
        },
        [appliedExercise1, appliedExercise2]
      );

      const session1 = createTestSessionModel(
        {
          name: 'Push Day',
          notes: 'Upper body push session',
          executionCount: 8,
          isDeload: false,
          dayOfWeek: 'monday',
        },
        [group1]
      );

      const originalPlan = createTestTrainingPlanModel(
        {
          name: 'Test Training Plan',
          description: 'A comprehensive test plan',
          isArchived: false,
          currentSessionIndex: 0,
          notes: 'Training plan notes',
          cycleId: generateId(),
          order: 1,
          lastUsed: new Date(),
        },
        [session1]
      );

      // Act - Round trip: save and retrieve
      await repository.save(originalPlan);
      const retrievedPlan = await repository.findById(originalPlan.id);

      // Assert - Deep equality check
      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan!.id).toBe(originalPlan.id);
      expect(retrievedPlan!.profileId).toBe(originalPlan.profileId);
      expect(retrievedPlan!.name).toBe(originalPlan.name);
      expect(retrievedPlan!.description).toBe(originalPlan.description);
      expect(retrievedPlan!.isArchived).toBe(originalPlan.isArchived);
      expect(retrievedPlan!.currentSessionIndex).toBe(originalPlan.currentSessionIndex);
      expect(retrievedPlan!.notes).toBe(originalPlan.notes);
      expect(retrievedPlan!.cycleId).toBe(originalPlan.cycleId);
      expect(retrievedPlan!.order).toBe(originalPlan.order);
      expect(retrievedPlan!.lastUsed).toEqual(originalPlan.lastUsed);
      expect(retrievedPlan!.createdAt).toEqual(originalPlan.createdAt);
      expect(retrievedPlan!.updatedAt).toEqual(originalPlan.updatedAt);

      // Verify sessions deep equality
      expect(retrievedPlan!.sessions).toHaveLength(1);
      const retrievedSession = retrievedPlan!.sessions[0];
      const originalSession = originalPlan.sessions[0];

      expect(retrievedSession.id).toBe(originalSession.id);
      expect(retrievedSession.name).toBe(originalSession.name);
      expect(retrievedSession.notes).toBe(originalSession.notes);
      expect(retrievedSession.executionCount).toBe(originalSession.executionCount);
      expect(retrievedSession.isDeload).toBe(originalSession.isDeload);
      expect(retrievedSession.dayOfWeek).toBe(originalSession.dayOfWeek);

      // Verify groups deep equality
      expect(retrievedSession.groups).toHaveLength(1);
      const retrievedGroup = retrievedSession.groups[0];
      const originalGroup = originalSession.groups[0];

      expect(retrievedGroup.id).toBe(originalGroup.id);
      expect(retrievedGroup.type).toBe(originalGroup.type);
      expect(retrievedGroup.restTimeSeconds).toBe(originalGroup.restTimeSeconds);

      // Verify applied exercises deep equality
      expect(retrievedGroup.appliedExercises).toHaveLength(2);
      const retrievedAppliedExercises = retrievedGroup.appliedExercises.sort((a, b) =>
        a.id.localeCompare(b.id)
      );
      const originalAppliedExercises = originalGroup.appliedExercises.sort((a, b) =>
        a.id.localeCompare(b.id)
      );

      retrievedAppliedExercises.forEach((retrievedEx, index) => {
        const originalEx = originalAppliedExercises[index];
        expect(retrievedEx.id).toBe(originalEx.id);
        expect(retrievedEx.executionCount).toBe(originalEx.executionCount);
        expect(retrievedEx.restTimeSeconds).toBe(originalEx.restTimeSeconds);
      });

      // Verify business logic methods still work
      expect(retrievedPlan!.getTotalSessions()).toBe(originalPlan.getTotalSessions());
      expect(retrievedPlan!.getDeloadSessionCount()).toBe(originalPlan.getDeloadSessionCount());
      expect(retrievedPlan!.getCurrentSession()?.id).toBe(originalPlan.getCurrentSession()?.id);
    });
  });

  describe('repository interface compliance', () => {
    it('should implement all ITrainingPlanRepository methods', () => {
      // Assert
      expect(typeof repository.save).toBe('function');
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.findAll).toBe('function');
      expect(typeof repository.delete).toBe('function');
    });

    it('should accept database dependency injection', () => {
      // Arrange & Act
      const customDb = createTestDatabase();
      const customSessionRepo = new WorkoutSessionRepository(
        exerciseGroupRepository,
        appliedExerciseRepository,
        customDb
      );
      const customRepository = new TrainingPlanRepository(customSessionRepo, customDb);

      // Assert
      expect(customRepository).toBeInstanceOf(TrainingPlanRepository);
    });
  });

  describe('data integrity and validation', () => {
    it('should preserve Date objects through save/load cycle', async () => {
      // Arrange
      const specificDate = new Date('2023-08-15T10:30:00.000Z');
      const specificLastUsed = new Date('2023-08-20T15:45:00.000Z');
      const trainingPlanModel = createTestTrainingPlanModel(
        {
          lastUsed: specificLastUsed,
          createdAt: specificDate,
        },
        []
      );

      // Act
      await repository.save(trainingPlanModel);
      const retrieved = await repository.findById(trainingPlanModel.id);

      // Assert
      expect(retrieved!.lastUsed).toEqual(specificLastUsed);
      expect(retrieved!.lastUsed).toBeInstanceOf(Date);
      expect(retrieved!.createdAt).toEqual(specificDate);
      expect(retrieved!.createdAt).toBeInstanceOf(Date);
    });

    it('should handle optional fields correctly', async () => {
      // Arrange
      const withOptionalFields = createTestTrainingPlanModel(
        {
          description: 'Test description',
          notes: 'Test notes',
          cycleId: generateId(),
          order: 5,
          lastUsed: new Date(),
        },
        []
      );

      const withoutOptionalFields = createTestTrainingPlanModel(
        {
          description: undefined,
          notes: undefined,
          cycleId: null,
          order: undefined,
          lastUsed: undefined,
        },
        []
      );

      // Act
      await repository.save(withOptionalFields);
      await repository.save(withoutOptionalFields);

      const retrievedWith = await repository.findById(withOptionalFields.id);
      const retrievedWithout = await repository.findById(withoutOptionalFields.id);

      // Assert
      expect(retrievedWith!.description).toBe('Test description');
      expect(retrievedWith!.notes).toBe('Test notes');
      expect(retrievedWith!.cycleId).toBe(withOptionalFields.cycleId);
      expect(retrievedWith!.order).toBe(5);
      expect(retrievedWith!.lastUsed).toBeDefined();

      expect(retrievedWithout!.description).toBeUndefined();
      expect(retrievedWithout!.notes).toBeUndefined();
      expect(retrievedWithout!.cycleId).toBeNull();
      expect(retrievedWithout!.order).toBeUndefined();
      expect(retrievedWithout!.lastUsed).toBeUndefined();
    });

    it('should preserve boolean values correctly', async () => {
      // Arrange
      const archivedPlan = createTestTrainingPlanModel({ isArchived: true }, []);
      const activePlan = createTestTrainingPlanModel({ isArchived: false }, []);

      // Act
      await repository.save(archivedPlan);
      await repository.save(activePlan);

      const retrievedArchived = await repository.findById(archivedPlan.id);
      const retrievedActive = await repository.findById(activePlan.id);

      // Assert
      expect(retrievedArchived!.isArchived).toBe(true);
      expect(retrievedActive!.isArchived).toBe(false);
      expect(typeof retrievedArchived!.isArchived).toBe('boolean');
      expect(typeof retrievedActive!.isArchived).toBe('boolean');
    });
  });
});
