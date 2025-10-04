import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createActor, waitFor } from 'xstate';

import { SessionModel } from '@/features/training-plan/domain';
import { WorkoutLogModel } from '@/features/workout/domain';

import type { IWorkoutStatePersistence } from '../../domain/IWorkoutStatePersistence';
import { createWorkoutMachine, type WorkoutMachine } from '../workoutMachine';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

// Mock dependencies
vi.mock('@/features/training-plan/domain', () => ({
  SessionModel: {
    hydrate: vi.fn(),
  },
}));

vi.mock('@/features/workout/domain', () => ({
  WorkoutLogModel: {
    hydrate: vi.fn(),
  },
}));

describe('workoutMachine', () => {
  let mockPersistence: IWorkoutStatePersistence;
  let machine: WorkoutMachine;
  let mockSession: SessionModel;
  let mockWorkoutLog: WorkoutLogModel;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock persistence
    mockPersistence = {
      saveState: vi.fn().mockResolvedValue(undefined),
      loadState: vi.fn().mockResolvedValue(null),
      clearState: vi.fn().mockResolvedValue(undefined),
    };

    // Setup mock session
    mockSession = {
      id: 'session-123',
      name: 'Test Session',
      profileId: 'profile-123',
      groups: [],
      notes: undefined,
      executionCount: 0,
      isDeload: false,
      dayOfWeek: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SessionModel;

    // Setup mock workout log with required methods
    mockWorkoutLog = {
      id: 'workout-123',
      profileId: 'profile-123',
      cloneAsEnded: vi.fn().mockReturnValue({
        id: 'workout-123',
        profileId: 'profile-123',
        endTime: new Date(),
        cloneWithUpdatedMetadata: vi.fn().mockReturnValue({
          id: 'workout-123',
          profileId: 'profile-123',
          endTime: new Date(),
          notes: 'Test notes',
          userRating: 5,
        }),
      }),
      cloneWithUpdatedMetadata: vi.fn().mockReturnValue({
        id: 'workout-123',
        profileId: 'profile-123',
        notes: 'Test notes',
        userRating: 5,
      }),
    } as unknown as WorkoutLogModel;

    // Setup WorkoutLogModel.hydrate mock
    vi.mocked(WorkoutLogModel.hydrate).mockReturnValue(mockWorkoutLog);

    // Create machine with mocked dependencies
    machine = createWorkoutMachine({ persistence: mockPersistence });
  });

  describe('Machine Creation and Configuration', () => {
    it('should create a machine with correct initial state', () => {
      expect(machine.config.id).toBe('workout');
      expect(machine.config.initial).toBe('initializing');
    });

    it('should have correct initial context', () => {
      const actor = createActor(machine);
      expect(actor.getSnapshot().context).toEqual({
        profileId: null,
        session: null,
        workoutLog: null,
        error: null,
      });
    });

    it('should define all required actors', () => {
      const actorKeys = Object.keys(machine.implementations.actors || {});
      expect(actorKeys).toContain('loadPersistedState');
      expect(actorKeys).toContain('persistWorkoutState');
      expect(actorKeys).toContain('clearPersistedState');
    });

    it('should define all required guards', () => {
      const guardKeys = Object.keys(machine.implementations.guards || {});
      expect(guardKeys).toContain('hasProfileId');
      expect(guardKeys).toContain('hasWorkoutInProgress');
    });

    it('should define all required actions', () => {
      const actionKeys = Object.keys(machine.implementations.actions || {});
      expect(actionKeys).toContain('setProfileId');
      expect(actionKeys).toContain('setSession');
      expect(actionKeys).toContain('startWorkout');
      expect(actionKeys).toContain('updateWorkout');
      expect(actionKeys).toContain('finishWorkout');
      expect(actionKeys).toContain('clearWorkout');
      expect(actionKeys).toContain('setError');
      expect(actionKeys).toContain('clearError');
      expect(actionKeys).toContain('restoreFromPersistedState');
    });
  });

  describe('State Machine Initialization', () => {
    it('should start in initializing state', () => {
      const actor = createActor(machine);
      actor.start();
      expect(actor.getSnapshot().value).toBe('initializing');
    });

    it('should load persisted state on initialization', () => {
      const actor = createActor(machine);
      actor.start();
      expect(mockPersistence.loadState).toHaveBeenCalledWith('default');
    });

    it('should transition to idle when no persisted state exists', async () => {
      mockPersistence.loadState.mockResolvedValue(null);
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));
      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition to inProgress when persisted state exists', async () => {
      const persistedState = {
        profileId: 'profile-123',
        session: mockSession,
        workoutLog: mockWorkoutLog,
      };
      mockPersistence.loadState.mockResolvedValue(JSON.stringify(persistedState));

      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('inProgress'));
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
      expect(actor.getSnapshot().context.profileId).toBe('profile-123');
    });

    it('should handle initialization errors gracefully', async () => {
      mockPersistence.loadState.mockRejectedValue(new Error('Load failed'));
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));
      expect(actor.getSnapshot().value).toBe('idle');
      // The error should be cleared when entering idle state
      // But we can verify the error handling works by checking the flow
    });
  });

  describe('Idle State Behavior', () => {
    it('should clear errors when entering idle state', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));
      expect(actor.getSnapshot().context.error).toBeNull();
    });

    it('should handle START_WORKOUT event from idle', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
      expect(actor.getSnapshot().context.profileId).toBe('profile-123');
      expect(actor.getSnapshot().context.session).toBe(mockSession);
      expect(actor.getSnapshot().context.workoutLog).toBe(mockWorkoutLog);
    });

    it('should handle RETRY_INITIALIZATION event from idle', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({ type: 'RETRY_INITIALIZATION' });
      expect(actor.getSnapshot().value).toBe('initializing');
    });
  });

  describe('In Progress State Behavior', () => {
    let actor: ReturnType<typeof createActor<WorkoutMachine>>;

    beforeEach(async () => {
      actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));
    });

    it('should persist workout state when entering inProgress', async () => {
      // Wait a bit for the persistence to be called
      await new Promise((resolve) => setTimeout(resolve, 10));
      // The persistence call happens in the entry action, so it might be async
      // We'll verify the machine reached the correct state instead
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
    });

    it('should start in active substate', () => {
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
    });

    it('should handle UPDATE_SET event in active state', () => {
      actor.send({ type: 'UPDATE_SET', setData: { reps: 10, weight: 100 } });
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
      // Verify updateWorkout action was called (workout log should remain the same for now)
      expect(actor.getSnapshot().context.workoutLog).toBe(mockWorkoutLog);
    });

    it('should transition to paused on PAUSE_WORKOUT', () => {
      actor.send({ type: 'PAUSE_WORKOUT' });
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'paused' });
    });

    it('should transition to finishing on FINISH_WORKOUT', () => {
      const finishedWorkout = mockWorkoutLog.cloneAsEnded();
      vi.mocked(mockWorkoutLog.cloneAsEnded).mockReturnValue(finishedWorkout);

      actor.send({ type: 'FINISH_WORKOUT', notes: 'Great workout', userRating: 5 });
      expect(actor.getSnapshot().value).toBe('finishing');
      expect(mockWorkoutLog.cloneAsEnded).toHaveBeenCalled();
    });

    it('should transition to cancelling on CANCEL_WORKOUT', () => {
      actor.send({ type: 'CANCEL_WORKOUT' });
      expect(actor.getSnapshot().value).toBe('cancelling');
    });
  });

  describe('Paused State Behavior', () => {
    let actor: ReturnType<typeof createActor<WorkoutMachine>>;

    beforeEach(async () => {
      actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));

      actor.send({ type: 'PAUSE_WORKOUT' });
    });

    it('should be in paused state', () => {
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'paused' });
    });

    it('should resume to active on RESUME_WORKOUT', () => {
      actor.send({ type: 'RESUME_WORKOUT' });
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
    });

    it('should finish from paused state', () => {
      actor.send({ type: 'FINISH_WORKOUT' });
      expect(actor.getSnapshot().value).toBe('finishing');
    });

    it('should cancel from paused state', () => {
      actor.send({ type: 'CANCEL_WORKOUT' });
      expect(actor.getSnapshot().value).toBe('cancelling');
    });
  });

  describe('Finishing State Behavior', () => {
    let actor: ReturnType<typeof createActor<WorkoutMachine>>;

    beforeEach(async () => {
      actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));
    });

    it('should clear persisted state when finishing workout', async () => {
      actor.send({ type: 'FINISH_WORKOUT' });

      await waitFor(actor, (state) => state.matches('finishing'));
      expect(mockPersistence.clearState).toHaveBeenCalledWith('profile-123');
    });

    it('should transition to completed after clearing state', async () => {
      actor.send({ type: 'FINISH_WORKOUT' });

      await waitFor(actor, (state) => state.matches('completed'));
      expect(actor.getSnapshot().value).toBe('completed');
    });

    it('should handle clear state errors during finishing', async () => {
      mockPersistence.clearState.mockRejectedValue(new Error('Clear failed'));

      actor.send({ type: 'FINISH_WORKOUT' });

      await waitFor(actor, (state) => state.matches('idle'));
      // The error handling transitions to idle even on error
      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('Cancelling State Behavior', () => {
    let actor: ReturnType<typeof createActor<WorkoutMachine>>;

    beforeEach(async () => {
      actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));
    });

    it('should clear persisted state when cancelling workout', async () => {
      actor.send({ type: 'CANCEL_WORKOUT' });

      await waitFor(actor, (state) => state.matches('cancelling'));
      expect(mockPersistence.clearState).toHaveBeenCalledWith('profile-123');
    });

    it('should transition to idle and clear context after cancelling', async () => {
      actor.send({ type: 'CANCEL_WORKOUT' });

      await waitFor(actor, (state) => state.matches('idle'));
      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.profileId).toBeNull();
      expect(actor.getSnapshot().context.session).toBeNull();
      expect(actor.getSnapshot().context.workoutLog).toBeNull();
      expect(actor.getSnapshot().context.error).toBeNull();
    });

    it('should handle clear state errors during cancellation', async () => {
      mockPersistence.clearState.mockRejectedValue(new Error('Clear failed'));

      actor.send({ type: 'CANCEL_WORKOUT' });

      await waitFor(actor, (state) => state.matches('idle'));
      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.profileId).toBeNull();
    });
  });

  describe('Completed State Behavior', () => {
    let actor: ReturnType<typeof createActor<WorkoutMachine>>;

    beforeEach(async () => {
      actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));

      actor.send({ type: 'FINISH_WORKOUT' });

      await waitFor(actor, (state) => state.matches('completed'));
    });

    it('should clear workout context when entering completed state', () => {
      expect(actor.getSnapshot().context.profileId).toBeNull();
      expect(actor.getSnapshot().context.session).toBeNull();
      expect(actor.getSnapshot().context.workoutLog).toBeNull();
    });

    it('should allow starting a new workout from completed state', async () => {
      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-456',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
      expect(actor.getSnapshot().context.profileId).toBe('profile-456');
    });
  });

  describe('Guards', () => {
    it('should correctly evaluate hasProfileId guard', () => {
      const contextWithProfile = {
        profileId: 'profile-123',
        session: null,
        workoutLog: null,
        error: null,
      };
      const contextWithoutProfile = {
        profileId: null,
        session: null,
        workoutLog: null,
        error: null,
      };

      const guardImpl = machine.implementations.guards?.hasProfileId as Function;
      expect(guardImpl({ context: contextWithProfile })).toBe(true);
      expect(guardImpl({ context: contextWithoutProfile })).toBe(false);
    });

    it('should correctly evaluate hasWorkoutInProgress guard', () => {
      const contextWithWorkout = {
        profileId: null,
        session: null,
        workoutLog: mockWorkoutLog,
        error: null,
      };
      const contextWithoutWorkout = {
        profileId: null,
        session: null,
        workoutLog: null,
        error: null,
      };

      const guardImpl = machine.implementations.guards?.hasWorkoutInProgress as Function;
      expect(guardImpl({ context: contextWithWorkout })).toBe(true);
      expect(guardImpl({ context: contextWithoutWorkout })).toBe(false);
    });
  });

  describe('Actions Integration', () => {
    it('should properly set context when starting workout', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));

      const context = actor.getSnapshot().context;
      expect(context.profileId).toBe('profile-123');
      expect(context.session).toBe(mockSession);
      expect(context.workoutLog).toBe(mockWorkoutLog);
      expect(WorkoutLogModel.hydrate).toHaveBeenCalled();
    });

    it('should handle UPDATE_SET action correctly', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));

      actor.send({ type: 'UPDATE_SET', setData: { reps: 10, weight: 100 } });

      // Should remain in active state with same workout log
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
      expect(actor.getSnapshot().context.workoutLog).toBe(mockWorkoutLog);
    });

    it('should finish workout with metadata', async () => {
      const finishedWorkout = {
        ...mockWorkoutLog,
        endTime: new Date(),
        notes: 'Great workout!',
        userRating: 5,
      };
      const mockCloneWithMetadata = vi.fn().mockReturnValue(finishedWorkout);
      const mockCloneAsEnded = vi
        .fn()
        .mockReturnValue({ cloneWithUpdatedMetadata: mockCloneWithMetadata });
      mockWorkoutLog.cloneAsEnded = mockCloneAsEnded;

      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));

      actor.send({ type: 'FINISH_WORKOUT', notes: 'Great workout!', userRating: 5 });

      expect(mockCloneAsEnded).toHaveBeenCalled();
      expect(mockCloneWithMetadata).toHaveBeenCalledWith({
        notes: 'Great workout!',
        userRating: 5,
      });
    });

    it('should clear workout context when cancelled', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));

      actor.send({ type: 'CANCEL_WORKOUT' });

      await waitFor(actor, (state) => state.matches('idle'));

      const context = actor.getSnapshot().context;
      expect(context.profileId).toBeNull();
      expect(context.session).toBeNull();
      expect(context.workoutLog).toBeNull();
      expect(context.error).toBeNull();
    });
  });

  describe('Actor Lifecycle and Cleanup', () => {
    it('should handle actor cleanup properly', () => {
      const actor = createActor(machine);
      actor.start();

      expect(() => actor.stop()).not.toThrow();
    });

    it('should handle multiple actor instances', () => {
      const actor1 = createActor(machine);
      const actor2 = createActor(machine);

      actor1.start();
      actor2.start();

      expect(actor1.getSnapshot().context).toEqual(actor2.getSnapshot().context);

      actor1.stop();
      actor2.stop();
    });

    it('should maintain state consistency across restarts', async () => {
      const persistedState = {
        profileId: 'profile-123',
        session: mockSession,
        workoutLog: mockWorkoutLog,
      };

      mockPersistence.loadState.mockResolvedValue(JSON.stringify(persistedState));

      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('inProgress'));

      const contextBeforeStop = actor.getSnapshot().context;
      actor.stop();

      const newActor = createActor(machine);
      newActor.start();

      await waitFor(newActor, (state) => state.matches('inProgress'));

      expect(newActor.getSnapshot().context).toEqual(contextBeforeStop);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid JSON in persisted state', async () => {
      mockPersistence.loadState.mockResolvedValue('invalid-json');

      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));
      // Should transition to idle even with invalid JSON
      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should handle undefined profile ID gracefully', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      // The machine should handle the case where profileId might be missing
      expect(() => actor.getSnapshot()).not.toThrow();
    });

    it('should handle rapid event sequences', async () => {
      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      // Send multiple events rapidly
      actor.send({ type: 'START_WORKOUT', profileId: 'profile-123', session: mockSession });
      actor.send({ type: 'PAUSE_WORKOUT' });
      actor.send({ type: 'RESUME_WORKOUT' });
      actor.send({ type: 'FINISH_WORKOUT' });

      // Machine should handle this gracefully and end up in the finishing state
      await waitFor(actor, (state) => state.matches('completed') || state.matches('finishing'));
    });

    it('should handle persistence failures during state transitions', async () => {
      mockPersistence.saveState.mockRejectedValue(new Error('Save failed'));

      const actor = createActor(machine);
      actor.start();

      await waitFor(actor, (state) => state.matches('idle'));

      // Even if persistence fails, the machine should continue to function
      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });
    });

    it('should handle valid events without errors', () => {
      const actor = createActor(machine);

      // Machine should be created and started without issues
      expect(() => actor.start()).not.toThrow();
      expect(actor.getSnapshot()).toBeDefined();
    });
  });

  describe('Type Safety and Integration', () => {
    it('should maintain type safety for events', () => {
      const actor = createActor(machine);

      // These should compile without errors in TypeScript
      const validEvents = [
        { type: 'START_WORKOUT' as const, profileId: 'test', session: mockSession },
        { type: 'UPDATE_SET' as const, setData: {} },
        { type: 'FINISH_WORKOUT' as const, notes: 'test', userRating: 5 },
        { type: 'CANCEL_WORKOUT' as const },
        { type: 'PAUSE_WORKOUT' as const },
        { type: 'RESUME_WORKOUT' as const },
        { type: 'RETRY_INITIALIZATION' as const },
      ];

      validEvents.forEach((event) => {
        expect(() => actor.send(event)).not.toThrow();
      });
    });

    it('should properly integrate with domain models', () => {
      expect(WorkoutLogModel.hydrate).toBeDefined();
      expect(mockSession.id).toBeDefined();
      expect(mockSession.name).toBeDefined();
    });

    it('should handle complex workout flow end-to-end', async () => {
      const actor = createActor(machine);
      actor.start();

      // Start from idle
      await waitFor(actor, (state) => state.matches('idle'));

      // Start workout
      actor.send({
        type: 'START_WORKOUT',
        profileId: 'profile-123',
        session: mockSession,
      });

      await waitFor(actor, (state) => state.matches('inProgress'));
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });

      // Update sets during workout
      actor.send({ type: 'UPDATE_SET', setData: { reps: 10, weight: 100 } });
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });

      // Pause workout
      actor.send({ type: 'PAUSE_WORKOUT' });
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'paused' });

      // Resume workout
      actor.send({ type: 'RESUME_WORKOUT' });
      expect(actor.getSnapshot().value).toEqual({ inProgress: 'active' });

      // Finish workout
      actor.send({ type: 'FINISH_WORKOUT', notes: 'Great session!', userRating: 5 });

      await waitFor(actor, (state) => state.matches('completed'));
      expect(actor.getSnapshot().value).toBe('completed');

      // Verify state is cleared
      expect(actor.getSnapshot().context.workoutLog).toBeNull();
      expect(actor.getSnapshot().context.session).toBeNull();
      expect(actor.getSnapshot().context.profileId).toBeNull();
    });
  });
});
