import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateId } from '@/lib';
import { TrainingPlanMustHaveSessionsError } from '@/shared/errors';

import { AppliedExerciseModel } from '../../AppliedExerciseModel';
import { ExerciseGroupModel } from '../../ExerciseGroupModel';
import { TrainingPlanModel } from '../../TrainingPlanModel';
import { TrainingPlanBuilder } from '../TrainingPlanBuilder';

// Mock external dependencies
vi.mock('@/lib', () => ({
  generateId: vi.fn(),
}));

vi.mock('../../ExerciseGroupModel', () => ({
  ExerciseGroupModel: {
    hydrate: vi.fn(),
  },
}));

const mockGenerateId = vi.mocked(generateId);
const mockExerciseGroupModelHydrate = vi.mocked(ExerciseGroupModel.hydrate);

describe('TrainingPlanBuilder', () => {
  let initialPlan: TrainingPlanModel;
  let builder: TrainingPlanBuilder;
  let mockAppliedExercise1: AppliedExerciseModel;
  let mockAppliedExercise2: AppliedExerciseModel;
  let mockExerciseGroup: ExerciseGroupModel;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock ID generation
    let idCounter = 0;
    mockGenerateId.mockImplementation(() => `test-id-${++idCounter}`);

    // Create mock initial plan
    const now = new Date('2024-01-01T00:00:00.000Z');
    initialPlan = TrainingPlanModel.hydrate(
      {
        id: 'plan-1',
        profileId: 'profile-1',
        name: 'Test Plan',
        sessionIds: [],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: null,
        createdAt: now,
        updatedAt: now,
      },
      []
    );

    // Create mock applied exercises
    mockAppliedExercise1 = {
      id: 'exercise-1',
      profileId: 'profile-1',
      exerciseId: 'ex-1',
      templateId: null,
      setConfiguration: {
        toPlainObject: () => ({
          type: 'standard',
          sets: 3,
          reps: { min: 8, max: 12, direction: 'asc' },
        }),
      },
      restTimeSeconds: 60,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    } as unknown as AppliedExerciseModel;

    mockAppliedExercise2 = {
      id: 'exercise-2',
      profileId: 'profile-1',
      exerciseId: 'ex-2',
      templateId: null,
      setConfiguration: {
        toPlainObject: () => ({
          type: 'standard',
          sets: 3,
          reps: { min: 8, max: 12, direction: 'asc' },
        }),
      },
      restTimeSeconds: 90,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    } as unknown as AppliedExerciseModel;

    // Create mock exercise group
    mockExerciseGroup = {
      id: 'group-1',
      profileId: 'profile-1',
      type: 'single',
      appliedExerciseIds: ['exercise-1'],
      createdAt: now,
      updatedAt: now,
    } as unknown as ExerciseGroupModel;

    mockExerciseGroupModelHydrate.mockReturnValue(mockExerciseGroup);

    builder = new TrainingPlanBuilder(initialPlan);
  });

  describe('addSession', () => {
    it('should add a new session and set it as current', () => {
      // Act
      const result = builder.addSession('Push Day');

      // Assert
      expect(result).toBe(builder); // Should return this for chaining
      const builtPlan = result.build();
      expect(builtPlan.sessions).toHaveLength(1);
      expect(builtPlan.sessions[0].name).toBe('Push Day');
      expect(builtPlan.sessions[0].id).toBe('test-id-1');
      expect(builtPlan.sessions[0].profileId).toBe('profile-1');
      expect(builtPlan.sessions[0].groups).toEqual([]);
      expect(builtPlan.sessions[0].isDeload).toBe(false);
      expect(builtPlan.sessions[0].dayOfWeek).toBeNull();
      expect(builtPlan.sessions[0].executionCount).toBe(0);
    });

    it('should support fluent API chaining with multiple sessions', () => {
      // Act
      const result = builder.addSession('Push Day').addSession('Pull Day').addSession('Legs Day');

      // Assert
      const builtPlan = result.build();
      expect(builtPlan.sessions).toHaveLength(3);
      expect(builtPlan.sessions.map((s) => s.name)).toEqual(['Push Day', 'Pull Day', 'Legs Day']);
    });

    it('should set the newly added session as current for subsequent operations', () => {
      // Arrange
      builder.addSession('Push Day');

      // Act
      builder.updateCurrentSessionDetails({ name: 'Updated Push Day' });

      // Assert
      const builtPlan = builder.build();
      expect(builtPlan.sessions[0].name).toBe('Updated Push Day');
    });
  });

  describe('removeSession', () => {
    it('should remove a session by ID', () => {
      // Arrange
      builder.addSession('Push Day').addSession('Pull Day');
      const planWithSessions = builder.build();
      const firstSessionId = planWithSessions.sessions[0].id;

      // Create new builder with the plan that has sessions
      const builderWithSessions = new TrainingPlanBuilder(planWithSessions);

      // Act
      const result = builderWithSessions.removeSession(firstSessionId);

      // Assert
      expect(result).toBe(builderWithSessions); // Should return this for chaining
      const builtPlan = result.build();
      expect(builtPlan.sessions).toHaveLength(1);
      expect(builtPlan.sessions[0].name).toBe('Pull Day');
    });

    it('should update current session to first available when current session is removed', () => {
      // Arrange
      builder.addSession('Push Day').addSession('Pull Day');
      const planWithSessions = builder.build();
      const firstSessionId = planWithSessions.sessions[0].id;
      const secondSessionId = planWithSessions.sessions[1].id;

      const builderWithSessions = new TrainingPlanBuilder(planWithSessions);
      builderWithSessions.selectSession(firstSessionId); // Select first session as current

      // Act
      builderWithSessions.removeSession(firstSessionId); // Remove current session
      builderWithSessions.updateCurrentSessionDetails({ name: 'Updated Name' });

      // Assert
      const builtPlan = builderWithSessions.build();
      expect(builtPlan.sessions).toHaveLength(1);
      expect(builtPlan.sessions[0].name).toBe('Updated Name'); // Should update the remaining session
      expect(builtPlan.sessions[0].id).toBe(secondSessionId);
    });

    it('should set current session to null when all sessions are removed', () => {
      // Arrange
      builder.addSession('Push Day');
      const planWithSession = builder.build();
      const sessionId = planWithSession.sessions[0].id;

      const builderWithSession = new TrainingPlanBuilder(planWithSession);

      // Act
      builderWithSession.removeSession(sessionId);
      builderWithSession.updateCurrentSessionDetails({ name: 'Should Not Update' });

      // Assert
      expect(() => builderWithSession.build()).toThrow(TrainingPlanMustHaveSessionsError);
    });
  });

  describe('selectSession', () => {
    it('should select an existing session as current', () => {
      // Arrange
      builder.addSession('Push Day').addSession('Pull Day');
      const planWithSessions = builder.build();
      const firstSessionId = planWithSessions.sessions[0].id;

      const builderWithSessions = new TrainingPlanBuilder(planWithSessions);

      // Act
      const result = builderWithSessions.selectSession(firstSessionId);
      builderWithSessions.updateCurrentSessionDetails({ name: 'Updated Push Day' });

      // Assert
      expect(result).toBe(builderWithSessions); // Should return this for chaining
      const builtPlan = builderWithSessions.build();
      expect(builtPlan.sessions[0].name).toBe('Updated Push Day');
      expect(builtPlan.sessions[1].name).toBe('Pull Day'); // Should remain unchanged
    });

    it('should not change current session when selecting non-existent session ID', () => {
      // Arrange
      builder.addSession('Push Day').addSession('Pull Day');
      const planWithSessions = builder.build();
      const secondSessionId = planWithSessions.sessions[1].id;

      const builderWithSessions = new TrainingPlanBuilder(planWithSessions);
      builderWithSessions.selectSession(secondSessionId); // Select second session first

      // Act
      builderWithSessions.selectSession('non-existent-id'); // Try to select non-existent
      builderWithSessions.updateCurrentSessionDetails({ name: 'Updated Name' });

      // Assert
      const builtPlan = builderWithSessions.build();
      expect(builtPlan.sessions[0].name).toBe('Push Day'); // Should remain unchanged
      expect(builtPlan.sessions[1].name).toBe('Updated Name'); // Second session should be updated
    });
  });

  describe('updateCurrentSessionDetails', () => {
    it('should update the name of the current session', () => {
      // Arrange
      builder.addSession('Push Day');

      // Act
      const result = builder.updateCurrentSessionDetails({ name: 'Heavy Push Day' });

      // Assert
      expect(result).toBe(builder); // Should return this for chaining
      const builtPlan = result.build();
      expect(builtPlan.sessions[0].name).toBe('Heavy Push Day');
    });

    it('should do nothing when no session is selected as current', () => {
      // Arrange - Start with empty plan (no current session)

      // Act
      const result = builder.updateCurrentSessionDetails({ name: 'Should Not Work' });

      // Assert
      expect(result).toBe(builder); // Should return this for chaining
      expect(() => builder.build()).toThrow(TrainingPlanMustHaveSessionsError);
    });

    it('should do nothing when current session ID does not exist in plan', () => {
      // This edge case is handled by the findSessionById method returning undefined
      // Arrange
      builder.addSession('Push Day');
      const planWithSession = builder.build();

      // Manually remove the session but keep the currentSessionId pointing to it
      const planWithoutSession = planWithSession.cloneWithRemovedSession(
        planWithSession.sessions[0].id
      );
      const builderWithOrphanedCurrent = new TrainingPlanBuilder(planWithoutSession);

      // Act
      const result = builderWithOrphanedCurrent.updateCurrentSessionDetails({
        name: 'Should Not Work',
      });

      // Assert
      expect(result).toBe(builderWithOrphanedCurrent);
      expect(() => builderWithOrphanedCurrent.build()).toThrow(TrainingPlanMustHaveSessionsError);
    });
  });

  describe('addExerciseToCurrentSession', () => {
    it('should add a single exercise to the current session', () => {
      // Arrange
      builder.addSession('Push Day');

      // Act
      const result = builder.addExerciseToCurrentSession(mockAppliedExercise1);

      // Assert
      expect(result).toBe(builder); // Should return this for chaining
      expect(mockExerciseGroupModelHydrate).toHaveBeenCalledWith(
        {
          id: 'test-id-2',
          profileId: 'profile-1',
          type: 'single',
          appliedExerciseIds: ['exercise-1'],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        [mockAppliedExercise1]
      );
    });

    it('should do nothing when no session is selected as current', () => {
      // Act
      const result = builder.addExerciseToCurrentSession(mockAppliedExercise1);

      // Assert
      expect(result).toBe(builder);
      expect(mockExerciseGroupModelHydrate).not.toHaveBeenCalled();
    });

    it('should do nothing when current session ID does not exist in plan', () => {
      // Arrange
      builder.addSession('Push Day');
      const planWithSession = builder.build();
      const planWithoutSession = planWithSession.cloneWithRemovedSession(
        planWithSession.sessions[0].id
      );
      const builderWithOrphanedCurrent = new TrainingPlanBuilder(planWithoutSession);

      // Act
      const result = builderWithOrphanedCurrent.addExerciseToCurrentSession(mockAppliedExercise1);

      // Assert
      expect(result).toBe(builderWithOrphanedCurrent);
      expect(mockExerciseGroupModelHydrate).not.toHaveBeenCalled();
    });

    it('should support fluent API chaining with multiple exercises', () => {
      // Arrange
      const mockExerciseGroup2 = { ...mockExerciseGroup, id: 'group-2' };
      mockExerciseGroupModelHydrate
        .mockReturnValueOnce(mockExerciseGroup)
        .mockReturnValueOnce(mockExerciseGroup2);

      // Act
      builder
        .addSession('Push Day')
        .addExerciseToCurrentSession(mockAppliedExercise1)
        .addExerciseToCurrentSession(mockAppliedExercise2);

      // Assert
      expect(mockExerciseGroupModelHydrate).toHaveBeenCalledTimes(2);
      expect(mockExerciseGroupModelHydrate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          type: 'single',
          appliedExerciseIds: ['exercise-1'],
        }),
        [mockAppliedExercise1]
      );
      expect(mockExerciseGroupModelHydrate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          type: 'single',
          appliedExerciseIds: ['exercise-2'],
        }),
        [mockAppliedExercise2]
      );
    });
  });

  describe('addSupersetToCurrentSession', () => {
    it('should add a superset of two exercises to the current session', () => {
      // Arrange
      builder.addSession('Push Day');
      const exercises = [mockAppliedExercise1, mockAppliedExercise2];

      // Act
      const result = builder.addSupersetToCurrentSession(exercises);

      // Assert
      expect(result).toBe(builder); // Should return this for chaining
      expect(mockExerciseGroupModelHydrate).toHaveBeenCalledWith(
        {
          id: 'test-id-2',
          profileId: 'profile-1',
          type: 'superset',
          appliedExerciseIds: ['exercise-1', 'exercise-2'],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        exercises
      );
    });

    it('should delegate validation of exactly 2 exercises to ExerciseGroupModel.hydrate', () => {
      // Arrange
      builder.addSession('Push Day');
      const singleExercise = [mockAppliedExercise1];
      const threeExercises = [mockAppliedExercise1, mockAppliedExercise2, mockAppliedExercise1];

      // Act & Assert - Single exercise
      builder.addSupersetToCurrentSession(singleExercise);
      expect(mockExerciseGroupModelHydrate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'superset',
          appliedExerciseIds: ['exercise-1'],
        }),
        singleExercise
      );

      // Act & Assert - Three exercises
      builder.addSupersetToCurrentSession(threeExercises);
      expect(mockExerciseGroupModelHydrate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'superset',
          appliedExerciseIds: ['exercise-1', 'exercise-2', 'exercise-1'],
        }),
        threeExercises
      );
    });

    it('should do nothing when no session is selected as current', () => {
      // Act
      const result = builder.addSupersetToCurrentSession([
        mockAppliedExercise1,
        mockAppliedExercise2,
      ]);

      // Assert
      expect(result).toBe(builder);
      expect(mockExerciseGroupModelHydrate).not.toHaveBeenCalled();
    });

    it('should do nothing when current session ID does not exist in plan', () => {
      // Arrange
      builder.addSession('Push Day');
      const planWithSession = builder.build();
      const planWithoutSession = planWithSession.cloneWithRemovedSession(
        planWithSession.sessions[0].id
      );
      const builderWithOrphanedCurrent = new TrainingPlanBuilder(planWithoutSession);

      // Act
      const result = builderWithOrphanedCurrent.addSupersetToCurrentSession([
        mockAppliedExercise1,
        mockAppliedExercise2,
      ]);

      // Assert
      expect(result).toBe(builderWithOrphanedCurrent);
      expect(mockExerciseGroupModelHydrate).not.toHaveBeenCalled();
    });
  });

  describe('build', () => {
    it('should return the constructed training plan when it has sessions', () => {
      // Arrange
      builder.addSession('Push Day').addSession('Pull Day');

      // Act
      const result = builder.build();

      // Assert
      expect(result).toBeInstanceOf(TrainingPlanModel);
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions.map((s) => s.name)).toEqual(['Push Day', 'Pull Day']);
    });

    it('should throw TrainingPlanMustHaveSessionsError when plan has no sessions', () => {
      // Act & Assert
      expect(() => builder.build()).toThrow(TrainingPlanMustHaveSessionsError);
      expect(() => builder.build()).toThrow('errors.domain.trainingPlan.noSessions');
    });

    it('should throw TrainingPlanMustHaveSessionsError after all sessions are removed', () => {
      // Arrange
      builder.addSession('Push Day');
      const planWithSession = builder.build();
      const sessionId = planWithSession.sessions[0].id;
      const builderWithSession = new TrainingPlanBuilder(planWithSession);

      // Act
      builderWithSession.removeSession(sessionId);

      // Assert
      expect(() => builderWithSession.build()).toThrow(TrainingPlanMustHaveSessionsError);
    });
  });

  describe('complex fluent API scenarios', () => {
    it('should support complete workout construction in a single fluent chain', () => {
      // Arrange
      const mockSupersetGroup = { ...mockExerciseGroup, id: 'superset-group-1', type: 'superset' };
      mockExerciseGroupModelHydrate
        .mockReturnValueOnce(mockExerciseGroup) // First single exercise
        .mockReturnValueOnce(mockSupersetGroup) // Superset
        .mockReturnValueOnce({ ...mockExerciseGroup, id: 'group-3' }); // Second single exercise

      // Act
      const result = builder
        .addSession('Push Day')
        .addExerciseToCurrentSession(mockAppliedExercise1)
        .addSupersetToCurrentSession([mockAppliedExercise1, mockAppliedExercise2])
        .addSession('Pull Day')
        .selectSession(builder.build().sessions[0].id) // Go back to first session
        .addExerciseToCurrentSession(mockAppliedExercise2)
        .updateCurrentSessionDetails({ name: 'Heavy Push Day' });

      // Assert
      const builtPlan = result.build();
      expect(builtPlan.sessions).toHaveLength(2);
      expect(builtPlan.sessions[0].name).toBe('Heavy Push Day');
      expect(builtPlan.sessions[1].name).toBe('Pull Day');
      expect(mockExerciseGroupModelHydrate).toHaveBeenCalledTimes(3);
    });

    it('should maintain session references correctly during complex operations', () => {
      // Arrange & Act
      const builder1 = builder.addSession('Day 1').addSession('Day 2').addSession('Day 3');

      const planWith3Sessions = builder1.build();
      const day1Id = planWith3Sessions.sessions[0].id;
      const day2Id = planWith3Sessions.sessions[1].id;
      const day3Id = planWith3Sessions.sessions[2].id;

      const builder2 = new TrainingPlanBuilder(planWith3Sessions)
        .removeSession(day2Id) // Remove middle session
        .selectSession(day1Id) // Select first session
        .updateCurrentSessionDetails({ name: 'Updated Day 1' })
        .selectSession(day3Id) // Select third session (now second)
        .updateCurrentSessionDetails({ name: 'Updated Day 3' });

      // Assert
      const finalPlan = builder2.build();
      expect(finalPlan.sessions).toHaveLength(2);
      expect(finalPlan.sessions[0].name).toBe('Updated Day 1');
      expect(finalPlan.sessions[0].id).toBe(day1Id);
      expect(finalPlan.sessions[1].name).toBe('Updated Day 3');
      expect(finalPlan.sessions[1].id).toBe(day3Id);
    });

    it('should handle edge case where current session becomes invalid during operations', () => {
      // Arrange
      builder.addSession('Session 1').addSession('Session 2');
      const planWithSessions = builder.build();
      const session1Id = planWithSessions.sessions[0].id;
      const session2Id = planWithSessions.sessions[1].id;

      const builderWithSessions = new TrainingPlanBuilder(planWithSessions);

      // Act - Select first session, then remove it, then try to update details
      builderWithSessions
        .selectSession(session1Id) // Current is now session1
        .removeSession(session1Id) // Remove current session (should set current to session2)
        .updateCurrentSessionDetails({ name: 'Updated Name' }); // Should update session2

      // Assert
      const finalPlan = builderWithSessions.build();
      expect(finalPlan.sessions).toHaveLength(1);
      expect(finalPlan.sessions[0].id).toBe(session2Id);
      expect(finalPlan.sessions[0].name).toBe('Updated Name');
    });
  });
});
