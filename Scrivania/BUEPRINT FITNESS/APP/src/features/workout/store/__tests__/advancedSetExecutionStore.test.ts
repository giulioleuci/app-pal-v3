import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdvancedSetExecutionState, SetProgressionData } from '../../services/types';
import {
  type AdvancedSetExecutionSession,
  useAdvancedSetExecutionStore,
  useAdvancedSetSessionsForProfile,
  useAdvancedSetSessionsForWorkout,
  useCurrentAdvancedSetSession,
  useHasActiveAdvancedSets,
} from '../advancedSetExecutionStore';

// Mock crypto.randomUUID
let mockUUIDCounter = 0;
const mockUUIDs = ['test-uuid-123', 'test-uuid-456', 'test-uuid-789'];
vi.stubGlobal('crypto', {
  randomUUID: () => {
    const uuid = mockUUIDs[mockUUIDCounter % mockUUIDs.length];
    mockUUIDCounter++;
    return uuid;
  },
});

describe('advancedSetExecutionStore', () => {
  const mockExecutionState: AdvancedSetExecutionState = {
    setType: 'drop',
    currentPhase: 1,
    totalPhases: 3,
    isCompleted: false,
    currentSetData: {
      weight: 100,
      counts: 10,
      rpe: 8,
    },
    nextSetData: {
      weight: 80,
      expectedCounts: 8,
      suggestedRpe: 8,
    },
    restPeriodSeconds: 60,
  };

  const mockSetData: SetProgressionData = {
    weight: 100,
    counts: 8,
    rpe: 9,
    completed: true,
  };

  beforeEach(() => {
    // Clear store state before each test using the proper reset action
    useAdvancedSetExecutionStore.getState().resetStore();
    // Reset UUID counter for predictable UUIDs
    mockUUIDCounter = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Session Creation', () => {
    it('should create a new session with correct data', () => {
      const sessionId = useAdvancedSetExecutionStore.getState().createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({ dropPercentages: [20, 40] }),
        executionState: mockExecutionState,
      });

      expect(sessionId).toBe('test-uuid-123');

      const state = useAdvancedSetExecutionStore.getState();
      const session = state.getSession(sessionId);
      expect(session).toMatchObject({
        id: sessionId,
        setType: 'drop',
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        executionState: mockExecutionState,
        completedSets: [],
        timerState: {
          isRunning: false,
          remainingSeconds: 60,
          totalSeconds: 60,
          startTime: null,
        },
      });

      expect(state.currentSessionId).toBe(sessionId);
      expect(session?.metadata.createdAt).toBe(Date.now());
    });

    it('should set current session to new session', () => {
      const sessionId = useAdvancedSetExecutionStore.getState().createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      const state = useAdvancedSetExecutionStore.getState();
      expect(state.currentSessionId).toBe(sessionId);
      expect(state.getCurrentSession()?.id).toBe(sessionId);
    });
  });

  describe('Session Updates', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = useAdvancedSetExecutionStore.getState().createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });
    });

    it('should update execution state and timer state', () => {
      const store = useAdvancedSetExecutionStore.getState();
      const newExecutionState: AdvancedSetExecutionState = {
        ...mockExecutionState,
        currentPhase: 2,
        restPeriodSeconds: 45,
      };

      vi.advanceTimersByTime(1000);
      store.updateExecutionState(sessionId, newExecutionState);

      const session = store.getSession(sessionId);
      expect(session?.executionState).toEqual(newExecutionState);
      expect(session?.timerState.remainingSeconds).toBe(45);
      expect(session?.timerState.totalSeconds).toBe(45);
      expect(session?.metadata.updatedAt).toBe(Date.now());
      expect(session?.metadata.lastActiveAt).toBe(Date.now());
    });

    it('should not update non-existent session', () => {
      const store = useAdvancedSetExecutionStore.getState();

      store.updateExecutionState('non-existent', mockExecutionState);

      expect(store.activeSessions).toHaveProperty(sessionId);
      expect(store.activeSessions).not.toHaveProperty('non-existent');
    });

    it('should add completed sets to session', () => {
      const store = useAdvancedSetExecutionStore.getState();

      vi.advanceTimersByTime(1000);
      store.addCompletedSet(sessionId, mockSetData);

      const session = store.getSession(sessionId);
      expect(session?.completedSets).toHaveLength(1);
      expect(session?.completedSets[0]).toEqual(mockSetData);
      expect(session?.metadata.updatedAt).toBe(Date.now());
    });

    it('should update timer state', () => {
      const store = useAdvancedSetExecutionStore.getState();

      vi.advanceTimersByTime(1000);
      store.updateTimerState(sessionId, {
        isRunning: true,
        remainingSeconds: 30,
        startTime: Date.now(),
      });

      const session = store.getSession(sessionId);
      expect(session?.timerState.isRunning).toBe(true);
      expect(session?.timerState.remainingSeconds).toBe(30);
      expect(session?.timerState.startTime).toBe(Date.now());
      expect(session?.timerState.totalSeconds).toBe(60); // Should preserve original total
    });
  });

  describe('Session Management', () => {
    it('should set current session', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const sessionId1 = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      const sessionId2 = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-2',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      useAdvancedSetExecutionStore.getState().setCurrentSession(sessionId1);
      expect(useAdvancedSetExecutionStore.getState().currentSessionId).toBe(sessionId1);
      expect(useAdvancedSetExecutionStore.getState().getCurrentSession()?.id).toBe(sessionId1);

      useAdvancedSetExecutionStore.getState().setCurrentSession(null);
      expect(useAdvancedSetExecutionStore.getState().currentSessionId).toBeNull();
      expect(useAdvancedSetExecutionStore.getState().getCurrentSession()).toBeUndefined();
    });

    it('should complete and remove session', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const sessionId = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      // Get fresh state after session creation
      let currentState = useAdvancedSetExecutionStore.getState();
      expect(currentState.activeSessions).toHaveProperty(sessionId);
      expect(currentState.currentSessionId).toBe(sessionId);

      store.completeSession(sessionId);

      // Get fresh state after session completion
      currentState = useAdvancedSetExecutionStore.getState();
      expect(currentState.activeSessions).not.toHaveProperty(sessionId);
      expect(currentState.currentSessionId).toBeNull();
    });

    it('should abort and remove session', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const sessionId = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      store.abortSession(sessionId);

      expect(store.activeSessions).not.toHaveProperty(sessionId);
      expect(store.currentSessionId).toBeNull();
    });

    it('should preserve current session if removing different session', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const sessionId1 = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      const sessionId2 = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-2',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      store.setCurrentSession(sessionId1);
      store.completeSession(sessionId2);

      // Get fresh state after operations
      const currentState = useAdvancedSetExecutionStore.getState();
      expect(currentState.currentSessionId).toBe(sessionId1);
      expect(currentState.activeSessions).toHaveProperty(sessionId1);
      expect(currentState.activeSessions).not.toHaveProperty(sessionId2);
    });
  });

  describe('Session Queries', () => {
    let sessionIds: string[];

    beforeEach(() => {
      const store = useAdvancedSetExecutionStore.getState();
      sessionIds = [];

      // Create sessions for different profiles and workouts
      sessionIds.push(
        store.createSession({
          profileId: 'profile-1',
          workoutLogId: 'workout-1',
          exerciseId: 'exercise-1',
          setType: 'drop',
          setConfigurationJson: JSON.stringify({}),
          executionState: mockExecutionState,
        })
      );

      sessionIds.push(
        store.createSession({
          profileId: 'profile-1',
          workoutLogId: 'workout-2',
          exerciseId: 'exercise-2',
          setType: 'myoReps',
          setConfigurationJson: JSON.stringify({}),
          executionState: mockExecutionState,
        })
      );

      sessionIds.push(
        store.createSession({
          profileId: 'profile-2',
          workoutLogId: 'workout-3',
          exerciseId: 'exercise-3',
          setType: 'pyramidal',
          setConfigurationJson: JSON.stringify({}),
          executionState: mockExecutionState,
        })
      );
    });

    it('should get sessions for profile', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const profile1Sessions = store.getSessionsForProfile('profile-1');
      expect(profile1Sessions).toHaveLength(2);
      expect(profile1Sessions.every((s) => s.profileId === 'profile-1')).toBe(true);

      const profile2Sessions = store.getSessionsForProfile('profile-2');
      expect(profile2Sessions).toHaveLength(1);
      expect(profile2Sessions[0].profileId).toBe('profile-2');
    });

    it('should get sessions for workout', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const workout1Sessions = store.getSessionsForWorkout('workout-1');
      expect(workout1Sessions).toHaveLength(1);
      expect(workout1Sessions[0].workoutLogId).toBe('workout-1');

      const workout2Sessions = store.getSessionsForWorkout('workout-2');
      expect(workout2Sessions).toHaveLength(1);
      expect(workout2Sessions[0].workoutLogId).toBe('workout-2');
    });
  });

  describe('Session Cleanup', () => {
    it('should clear expired sessions', () => {
      const store = useAdvancedSetExecutionStore.getState();

      // Create a session
      const sessionId = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      // Advance time by 25 hours
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      store.clearExpiredSessions();

      expect(store.activeSessions).not.toHaveProperty(sessionId);
      expect(store.currentSessionId).toBeNull();
    });

    it('should preserve recent sessions during cleanup', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const sessionId = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      // Advance time by 12 hours (within 24 hour threshold)
      vi.advanceTimersByTime(12 * 60 * 60 * 1000);

      store.clearExpiredSessions();

      // Get fresh state after cleanup
      const currentState = useAdvancedSetExecutionStore.getState();
      expect(currentState.activeSessions).toHaveProperty(sessionId);
      expect(currentState.currentSessionId).toBe(sessionId);
    });

    it('should clear current session if it expires', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const sessionId1 = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      // Set current to first session then advance time by 25 hours
      store.setCurrentSession(sessionId1);
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      // Create another session AFTER the time advance (so it's recent)
      const sessionId2 = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-2',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      store.clearExpiredSessions();

      // Get fresh state after cleanup
      const currentState = useAdvancedSetExecutionStore.getState();
      // First session should be expired, current should be cleared
      expect(currentState.activeSessions).not.toHaveProperty(sessionId1);
      expect(currentState.activeSessions).toHaveProperty(sessionId2); // Created after advance, so still recent
      expect(currentState.currentSessionId).toBe(sessionId2); // sessionId2 becomes current when created
    });
  });

  describe('Helper Functions', () => {
    it('should provide correct current session via getCurrentSession', () => {
      const store = useAdvancedSetExecutionStore.getState();

      const sessionId = store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      const currentSession = store.getCurrentSession();
      expect(currentSession?.id).toBe(sessionId);

      store.setCurrentSession(null);
      const noSession = store.getCurrentSession();
      expect(noSession).toBeUndefined();
    });

    it('should track active sessions via getSessionsForProfile', () => {
      const store = useAdvancedSetExecutionStore.getState();

      expect(Object.keys(store.activeSessions).length).toBe(0);

      store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      store.createSession({
        profileId: 'profile-2',
        workoutLogId: 'workout-2',
        exerciseId: 'exercise-2',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      const profile1Sessions = store.getSessionsForProfile('profile-1');
      expect(profile1Sessions).toHaveLength(1);
      expect(profile1Sessions[0].profileId).toBe('profile-1');

      const profile2Sessions = store.getSessionsForProfile('profile-2');
      expect(profile2Sessions).toHaveLength(1);
      expect(profile2Sessions[0].profileId).toBe('profile-2');
    });

    it('should filter sessions by workout via getSessionsForWorkout', () => {
      const store = useAdvancedSetExecutionStore.getState();

      store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      store.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-2',
        exerciseId: 'exercise-2',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
      });

      const workout1Sessions = store.getSessionsForWorkout('workout-1');
      expect(workout1Sessions).toHaveLength(1);
      expect(workout1Sessions[0].workoutLogId).toBe('workout-1');

      const workout2Sessions = store.getSessionsForWorkout('workout-2');
      expect(workout2Sessions).toHaveLength(1);
      expect(workout2Sessions[0].workoutLogId).toBe('workout-2');
    });
  });
});
