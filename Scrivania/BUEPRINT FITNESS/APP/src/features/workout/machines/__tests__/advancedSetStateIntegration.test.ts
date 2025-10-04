import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createActor, waitFor } from 'xstate';

import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';
import { MavSetConfiguration } from '@/features/training-plan/domain/sets/MavSetConfiguration';
import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';
import { PyramidalSetConfiguration } from '@/features/training-plan/domain/sets/PyramidalSetConfiguration';
import { RestPauseSetConfiguration } from '@/features/training-plan/domain/sets/RestPauseSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import type {
  AdvancedSetExecutionService,
  AdvancedSetExecutionState,
} from '../../services/AdvancedSetExecutionService';
import { useAdvancedSetExecutionStore } from '../../store/advancedSetExecutionStore';
import { type AdvancedSetActor, createAdvancedSetStateMachine } from '../advancedSetStateMachine';

// Mock dependencies
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
};

const mockExecutionService: AdvancedSetExecutionService = {
  initializeExecution: vi.fn(),
  progressToNextPhase: vi.fn(),
  validatePhaseCompletion: vi.fn(),
  getSuggestedRestPeriod: vi.fn(),
} as any;

// Mock crypto.randomUUID
const mockUUIDs = ['session-1', 'session-2', 'session-3'];
let uuidCallCount = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUIDs[uuidCallCount++] || `session-${uuidCallCount}`,
});

// Mock localStorage to prevent persistence interference
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

describe('Advanced Set State Integration Tests', () => {
  let actor: AdvancedSetActor;

  beforeEach(() => {
    vi.clearAllMocks();
    uuidCallCount = 0;

    // Clear localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Clear store state properly - only clear data, keep methods
    const store = useAdvancedSetExecutionStore.getState();

    // Clear existing sessions individually to maintain store structure
    Object.keys(store.activeSessions || {}).forEach((sessionId) => {
      store.abortSession?.(sessionId);
    });

    // Force clear any remaining state
    useAdvancedSetExecutionStore.setState(
      (state) => ({
        ...state,
        activeSessions: {},
        currentSessionId: null,
      }),
      true // bypass persist middleware
    );

    // Create and start actor
    const machine = createAdvancedSetStateMachine({
      executionService: mockExecutionService,
      logger: mockLogger,
    });
    actor = createActor(machine);
  });

  afterEach(() => {
    if (actor.getSnapshot().status === 'active') {
      actor.stop();
    }
  });

  describe('Drop Set Complete Flow', () => {
    const dropSetConfig = new DropSetConfiguration({
      id: 'drop-test',
      type: 'drop',
      reps: 10,
      rpe: 8,
      dropPercentages: [20, 40],
      restBetweenDropsSeconds: 15,
    });

    const createDropSetStates = () => ({
      phase1: {
        setType: 'drop' as const,
        currentPhase: 1,
        totalPhases: 3,
        isCompleted: false,
        currentSetData: { weight: 100, counts: 10, rpe: 8 },
        nextSetData: { weight: 80, expectedCounts: 8, suggestedRpe: 8 },
        restPeriodSeconds: 15,
      },
      phase2: {
        setType: 'drop' as const,
        currentPhase: 2,
        totalPhases: 3,
        isCompleted: false,
        currentSetData: { weight: 80, counts: 8, rpe: 9 },
        nextSetData: { weight: 60, expectedCounts: 6, suggestedRpe: 9 },
        restPeriodSeconds: 15,
      },
      completed: {
        setType: 'drop' as const,
        currentPhase: 3,
        totalPhases: 3,
        isCompleted: true,
        currentSetData: { weight: 60, counts: 6, rpe: 10 },
        restPeriodSeconds: 0,
      },
    });

    it.skip('should execute complete drop set workflow with store integration', async () => {
      const states = createDropSetStates();
      // Use store methods directly

      const storeState = useAdvancedSetExecutionStore.getState();

      // Setup mocks
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(states.phase1)
      );
      vi.mocked(mockExecutionService.progressToNextPhase)
        .mockResolvedValueOnce(Result.success(states.phase2))
        .mockResolvedValueOnce(Result.success(states.completed));

      actor.start();

      // Initialize execution
      actor.send({
        type: 'INITIALIZE',
        setConfiguration: dropSetConfig,
        lastWeight: 100,
      });

      await waitFor(actor, (state) => state.value === 'ready');

      // Create session in store for integration
      const sessionId = storeState.createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify(dropSetConfig),
        executionState: states.phase1,
      });

      expect(actor.getSnapshot().context.executionState).toEqual(states.phase1);
      expect(useAdvancedSetExecutionStore.getState().getCurrentSession()?.executionState).toEqual(
        states.phase1
      );

      // Complete first set (main set)
      const set1Data = { weight: 100, counts: 10, rpe: 8, completed: true };
      actor.send({ type: 'COMPLETE_SET', setData: set1Data });

      await waitFor(actor, (state) => state.matches('resting'));

      useAdvancedSetExecutionStore.getState().addCompletedSet(sessionId, set1Data);
      useAdvancedSetExecutionStore.getState().updateExecutionState(sessionId, states.phase2);

      expect(actor.getSnapshot().context.executionState).toEqual(states.phase2);
      expect(actor.getSnapshot().context.completedSets).toHaveLength(1);
      expect(
        useAdvancedSetExecutionStore.getState().getSession(sessionId)?.completedSets
      ).toHaveLength(1);

      // Start and complete rest timer
      actor.send({ type: 'START_REST_TIMER' });
      expect(actor.getSnapshot().matches('resting.timerRunning')).toBe(true);

      useAdvancedSetExecutionStore
        .getState()
        .updateTimerState(sessionId, { isRunning: true, startTime: Date.now() });

      actor.send({ type: 'SKIP_REST' });
      await waitFor(actor, (state) => state.value === 'ready');

      // Complete second set (first drop)
      const set2Data = { weight: 80, counts: 8, rpe: 9, completed: true };
      actor.send({ type: 'COMPLETE_SET', setData: set2Data });

      await waitFor(actor, (state) => state.matches('resting'));

      useAdvancedSetExecutionStore.getState().addCompletedSet(sessionId, set2Data);
      useAdvancedSetExecutionStore.getState().updateExecutionState(sessionId, states.completed);

      // Skip rest and complete final set
      actor.send({ type: 'SKIP_REST' });
      await waitFor(actor, (state) => state.value === 'ready');

      const set3Data = { weight: 60, counts: 6, rpe: 10, completed: true };
      actor.send({ type: 'COMPLETE_SET', setData: set3Data });

      await waitFor(actor, (state) => state.value === 'completed');

      useAdvancedSetExecutionStore.getState().addCompletedSet(sessionId, set3Data);
      useAdvancedSetExecutionStore.getState().completeSession(sessionId);

      // Verify final state
      expect(actor.getSnapshot().context.executionState?.isCompleted).toBe(true);
      expect(actor.getSnapshot().context.completedSets).toHaveLength(3);
      expect(useAdvancedSetExecutionStore.getState().getSession(sessionId)).toBeUndefined(); // Session completed and removed
      expect(mockExecutionService.progressToNextPhase).toHaveBeenCalledTimes(2);
    });
  });

  describe('MyoReps Complete Flow', () => {
    const myoRepsConfig = new MyoRepsSetConfiguration({
      id: 'myoreps-test',
      type: 'myoReps',
      activationReps: 15,
      rpe: 9,
      miniSetReps: 5,
      restBetweenSetsSeconds: 20,
      maxMiniSets: 3,
    });

    it.skip('should execute complete myoReps workflow', async () => {
      const states = {
        activation: {
          setType: 'myoReps' as const,
          currentPhase: 1,
          totalPhases: 4,
          isCompleted: false,
          currentSetData: { weight: 60, counts: 15, rpe: 9 },
          nextSetData: { weight: 60, expectedCounts: 5, suggestedRpe: 9 },
          restPeriodSeconds: 20,
        },
        mini1: {
          setType: 'myoReps' as const,
          currentPhase: 2,
          totalPhases: 4,
          isCompleted: false,
          currentSetData: { weight: 60, counts: 5, rpe: 9 },
          nextSetData: { weight: 60, expectedCounts: 5, suggestedRpe: 9 },
          restPeriodSeconds: 20,
        },
        mini2: {
          setType: 'myoReps' as const,
          currentPhase: 3,
          totalPhases: 4,
          isCompleted: false,
          currentSetData: { weight: 60, counts: 4, rpe: 10 },
          nextSetData: { weight: 60, expectedCounts: 5, suggestedRpe: 9 },
          restPeriodSeconds: 20,
        },
        completed: {
          setType: 'myoReps' as const,
          currentPhase: 4,
          totalPhases: 4,
          isCompleted: true,
          currentSetData: { weight: 60, counts: 3, rpe: 10 },
          restPeriodSeconds: 0,
        },
      };

      // Use store methods directly

      // Setup mocks
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(states.activation)
      );
      vi.mocked(mockExecutionService.progressToNextPhase)
        .mockResolvedValueOnce(Result.success(states.mini1))
        .mockResolvedValueOnce(Result.success(states.mini2))
        .mockResolvedValueOnce(Result.success(states.completed));

      actor.start();

      actor.send({
        type: 'INITIALIZE',
        setConfiguration: myoRepsConfig,
        lastWeight: 60,
      });

      await waitFor(actor, (state) => state.value === 'ready');

      const sessionId = useAdvancedSetExecutionStore.getState().createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify(myoRepsConfig),
        executionState: states.activation,
      });

      // Execute activation set
      const activationData = { weight: 60, counts: 15, rpe: 9, completed: true };
      actor.send({ type: 'COMPLETE_SET', setData: activationData });
      await waitFor(actor, (state) => state.matches('resting'));

      useAdvancedSetExecutionStore.getState().addCompletedSet(sessionId, activationData);
      useAdvancedSetExecutionStore.getState().updateExecutionState(sessionId, states.mini1);

      // Execute mini sets
      for (let i = 1; i <= 3; i++) {
        actor.send({ type: 'SKIP_REST' });
        await waitFor(actor, (state) => state.value === 'ready');

        const miniSetData = {
          weight: 60,
          counts: i === 3 ? 3 : i === 2 ? 4 : 5,
          rpe: i === 1 ? 9 : 10,
          completed: true,
        };

        actor.send({ type: 'COMPLETE_SET', setData: miniSetData });

        if (i < 3) {
          await waitFor(actor, (state) => state.matches('resting'));
          useAdvancedSetExecutionStore.getState().addCompletedSet(sessionId, miniSetData);
          useAdvancedSetExecutionStore
            .getState()
            .updateExecutionState(sessionId, i === 1 ? states.mini2 : states.completed);
        } else {
          await waitFor(actor, (state) => state.value === 'completed');
          useAdvancedSetExecutionStore.getState().addCompletedSet(sessionId, miniSetData);
          useAdvancedSetExecutionStore.getState().completeSession(sessionId);
        }
      }

      expect(actor.getSnapshot().context.completedSets).toHaveLength(4);
      expect(actor.getSnapshot().context.executionState?.isCompleted).toBe(true);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle service failures during progression', async () => {
      const initialState: AdvancedSetExecutionState = {
        setType: 'drop',
        currentPhase: 1,
        totalPhases: 3,
        isCompleted: false,
        currentSetData: { weight: 100, counts: 10, rpe: 8 },
        restPeriodSeconds: 15,
      };

      // Use store methods directly

      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(initialState)
      );
      vi.mocked(mockExecutionService.progressToNextPhase).mockResolvedValue(
        Result.failure(new ApplicationError('Service temporarily unavailable'))
      );

      actor.start();
      actor.send({
        type: 'INITIALIZE',
        setConfiguration: new DropSetConfiguration({
          id: 'drop-test',
          type: 'drop',
          reps: 10,
          rpe: 8,
          dropPercentages: [20],
          restBetweenDropsSeconds: 15,
        }),
      });

      await waitFor(actor, (state) => state.value === 'ready');

      const sessionId = useAdvancedSetExecutionStore.getState().createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: initialState,
      });

      // Attempt to progress but fail
      actor.send({
        type: 'COMPLETE_SET',
        setData: { weight: 100, counts: 8, rpe: 9, completed: true },
      });

      await waitFor(actor, (state) => state.value === 'error');

      expect(actor.getSnapshot().context.error).toBe('Service temporarily unavailable');
      expect(useAdvancedSetExecutionStore.getState().getSession(sessionId)).toBeDefined(); // Session should still exist

      // Recovery - reinitialize
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(initialState)
      );

      actor.send({
        type: 'INITIALIZE',
        setConfiguration: new DropSetConfiguration({
          id: 'drop-test',
          type: 'drop',
          reps: 10,
          rpe: 8,
          dropPercentages: [20],
          restBetweenDropsSeconds: 15,
        }),
      });

      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.executionState).toEqual(initialState);
    });

    it('should handle concurrent session management', () => {
      // Use store methods directly

      // Create multiple sessions
      const session1 = useAdvancedSetExecutionStore.getState().createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-1',
        setType: 'drop',
        setConfigurationJson: JSON.stringify({}),
        executionState: {
          setType: 'drop',
          currentPhase: 1,
          totalPhases: 3,
          isCompleted: false,
          currentSetData: { weight: 100, counts: 10 },
        } as AdvancedSetExecutionState,
      });

      const session2 = useAdvancedSetExecutionStore.getState().createSession({
        profileId: 'profile-1',
        workoutLogId: 'workout-1',
        exerciseId: 'exercise-2',
        setType: 'myoReps',
        setConfigurationJson: JSON.stringify({}),
        executionState: {
          setType: 'myoReps',
          currentPhase: 1,
          totalPhases: 4,
          isCompleted: false,
          currentSetData: { weight: 60, counts: 15 },
        } as AdvancedSetExecutionState,
      });

      expect(Object.keys(useAdvancedSetExecutionStore.getState().activeSessions)).toHaveLength(2);
      expect(useAdvancedSetExecutionStore.getState().currentSessionId).toBe(session2); // Latest created becomes current

      // Update one session
      useAdvancedSetExecutionStore.getState().addCompletedSet(session1, {
        weight: 100,
        counts: 10,
        rpe: 8,
        completed: true,
      });

      expect(
        useAdvancedSetExecutionStore.getState().getSession(session1)?.completedSets
      ).toHaveLength(1);
      expect(
        useAdvancedSetExecutionStore.getState().getSession(session2)?.completedSets
      ).toHaveLength(0);

      // Switch current session
      useAdvancedSetExecutionStore.getState().setCurrentSession(session1);
      expect(useAdvancedSetExecutionStore.getState().getCurrentSession()?.id).toBe(session1);

      // Complete one session
      useAdvancedSetExecutionStore.getState().completeSession(session1);
      expect(useAdvancedSetExecutionStore.getState().activeSessions).not.toHaveProperty(session1);
      expect(useAdvancedSetExecutionStore.getState().currentSessionId).toBeNull(); // Current was removed
      expect(useAdvancedSetExecutionStore.getState().activeSessions).toHaveProperty(session2); // Other session remains
    });
  });

  describe('Complex Set Type Integration', () => {
    it('should handle pyramidal set execution', async () => {
      const pyramidalConfig = new PyramidalSetConfiguration({
        id: 'pyramid-test',
        type: 'pyramidal',
        startWeight: 60,
        peakWeight: 100,
        stepWeightIncrease: 20,
        repsAtEachStep: [12, 10, 8, 6, 8, 10, 12],
        restBetweenStepsSeconds: 90,
      });

      const pyramidalState: AdvancedSetExecutionState = {
        setType: 'pyramidal',
        currentPhase: 1,
        totalPhases: 7,
        isCompleted: false,
        currentSetData: { weight: 60, counts: 12, rpe: 6 },
        nextSetData: { weight: 80, expectedCounts: 10, suggestedRpe: 7 },
        restPeriodSeconds: 90,
      };

      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(pyramidalState)
      );

      actor.start();
      actor.send({
        type: 'INITIALIZE',
        setConfiguration: pyramidalConfig,
      });

      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(pyramidalState);
      expect(mockExecutionService.initializeExecution).toHaveBeenCalledWith(
        pyramidalConfig,
        undefined
      );
    });

    it('should handle rest-pause set execution', async () => {
      const restPauseConfig = new RestPauseSetConfiguration({
        id: 'restpause-test',
        type: 'restPause',
        mainSetReps: 8,
        rpe: 9,
        restPauseSeconds: 15,
        miniSetReps: 3,
        maxMiniSets: 3,
      });

      const restPauseState: AdvancedSetExecutionState = {
        setType: 'restPause',
        currentPhase: 1,
        totalPhases: 4,
        isCompleted: false,
        currentSetData: { weight: 80, counts: 8, rpe: 9 },
        nextSetData: { weight: 80, expectedCounts: 3, suggestedRpe: 9 },
        restPeriodSeconds: 15,
      };

      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(restPauseState)
      );

      actor.start();
      actor.send({
        type: 'INITIALIZE',
        setConfiguration: restPauseConfig,
        lastWeight: 80,
      });

      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(restPauseState);
    });

    it('should handle MAV set execution', async () => {
      const mavConfig = new MavSetConfiguration({
        id: 'mav-test',
        type: 'mav',
        sets: 6,
        repsPerSet: 5,
        restBetweenSetsSeconds: 15,
        targetRpe: 8,
      });

      const mavState: AdvancedSetExecutionState = {
        setType: 'mav',
        currentPhase: 1,
        totalPhases: 6,
        isCompleted: false,
        currentSetData: { weight: 70, counts: 5, rpe: 8 },
        nextSetData: { weight: 70, expectedCounts: 5, suggestedRpe: 8 },
        restPeriodSeconds: 15,
      };

      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mavState)
      );

      actor.start();
      actor.send({
        type: 'INITIALIZE',
        setConfiguration: mavConfig,
        lastWeight: 70,
      });

      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(mavState);
    });
  });
});
