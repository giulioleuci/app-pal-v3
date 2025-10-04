import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createActor, waitFor } from 'xstate';

import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';
import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import type {
  AdvancedSetExecutionService,
  AdvancedSetExecutionState,
} from '../../services/AdvancedSetExecutionService';
import {
  type AdvancedSetActor,
  type AdvancedSetMachine,
  createAdvancedSetStateMachine,
} from '../advancedSetStateMachine';

// Mock logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
};

// Mock execution service
const mockExecutionService: AdvancedSetExecutionService = {
  initializeExecution: vi.fn(),
  progressToNextPhase: vi.fn(),
  validatePhaseCompletion: vi.fn(),
  getSuggestedRestPeriod: vi.fn(),
} as any;

describe('advancedSetStateMachine', () => {
  let machine: AdvancedSetMachine;
  let actor: AdvancedSetActor;

  const mockDropSetState: AdvancedSetExecutionState = {
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
    restPeriodSeconds: 10,
  };

  const mockMyoRepsState: AdvancedSetExecutionState = {
    setType: 'myoReps',
    currentPhase: 1,
    totalPhases: 4,
    isCompleted: false,
    currentSetData: {
      weight: 60,
      counts: 15,
      rpe: 9,
    },
    nextSetData: {
      weight: 60,
      expectedCounts: 5,
      suggestedRpe: 9,
    },
    restPeriodSeconds: 15,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    machine = createAdvancedSetStateMachine({
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

  describe('Machine Creation', () => {
    it('should create machine with correct initial state', () => {
      expect(machine).toBeDefined();
      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.executionState).toBeNull();
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.completedSets).toEqual([]);
    });
  });

  describe('Initialization Flow', () => {
    it('should successfully initialize drop set execution', async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mockDropSetState)
      );

      actor.start();

      actor.send({
        type: 'INITIALIZE',
        setConfiguration: new DropSetConfiguration({
          id: 'test-drop',
          type: 'drop',
          reps: 10,
          rpe: 8,
          dropPercentages: [20, 40],
          restBetweenDropsSeconds: 10,
        }),
        lastWeight: 100,
      });

      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(mockDropSetState);
      expect(mockExecutionService.initializeExecution).toHaveBeenCalledWith(
        expect.any(DropSetConfiguration),
        100
      );
    });

    it('should successfully initialize myoReps execution without last weight', async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mockMyoRepsState)
      );

      actor.start();

      actor.send({
        type: 'INITIALIZE',
        setConfiguration: new MyoRepsSetConfiguration({
          id: 'test-myoreps',
          type: 'myoReps',
          activationReps: 15,
          rpe: 9,
          miniSetReps: 5,
          restBetweenSetsSeconds: 15,
          maxMiniSets: 3,
        }),
      });

      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(mockMyoRepsState);
      expect(mockExecutionService.initializeExecution).toHaveBeenCalledWith(
        expect.any(MyoRepsSetConfiguration),
        undefined
      );
    });

    it('should handle initialization failure', async () => {
      const errorMessage = 'Invalid set configuration';
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.failure(new ApplicationError(errorMessage))
      );

      actor.start();

      actor.send({
        type: 'INITIALIZE',
        setConfiguration: {} as any,
      });

      await waitFor(actor, (state) => state.value === 'error');

      expect(actor.getSnapshot().context.error).toBe(errorMessage);
      expect(actor.getSnapshot().context.executionState).toBeNull();
    });

    it('should handle initialization promise rejection', async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockRejectedValue(
        new Error('Service unavailable')
      );

      actor.start();

      actor.send({
        type: 'INITIALIZE',
        setConfiguration: {} as any,
      });

      await waitFor(actor, (state) => state.value === 'error');

      expect(actor.getSnapshot().context.error).toBe('Service unavailable');
    });
  });

  describe('Set Progression Flow', () => {
    beforeEach(async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mockDropSetState)
      );

      actor.start();
      actor.send({
        type: 'INITIALIZE',
        setConfiguration: {} as any,
      });

      await waitFor(actor, (state) => state.value === 'ready');
    });

    it('should progress to next phase with rest period', async () => {
      const nextPhaseState: AdvancedSetExecutionState = {
        ...mockDropSetState,
        currentPhase: 2,
        restPeriodSeconds: 10,
      };

      vi.mocked(mockExecutionService.progressToNextPhase).mockResolvedValue(
        Result.success(nextPhaseState)
      );

      const setData = { weight: 100, counts: 8, rpe: 9, completed: true };

      actor.send({
        type: 'COMPLETE_SET',
        setData,
      });

      await waitFor(actor, (state) => state.matches('resting'));

      expect(actor.getSnapshot().context.executionState).toEqual(nextPhaseState);
      expect(actor.getSnapshot().context.completedSets).toHaveLength(1);
      expect(actor.getSnapshot().context.completedSets[0]).toEqual(setData);
      expect(actor.getSnapshot().context.timer.totalSeconds).toBe(10);
      expect(mockExecutionService.progressToNextPhase).toHaveBeenCalledWith(
        mockDropSetState,
        setData
      );
    });

    it('should complete set execution when all phases done', async () => {
      const completedState: AdvancedSetExecutionState = {
        ...mockDropSetState,
        currentPhase: 3,
        isCompleted: true,
      };

      vi.mocked(mockExecutionService.progressToNextPhase).mockResolvedValue(
        Result.success(completedState)
      );

      actor.send({
        type: 'COMPLETE_SET',
        setData: { weight: 60, counts: 6, rpe: 10, completed: true },
      });

      await waitFor(actor, (state) => state.value === 'completed');

      expect(actor.getSnapshot().context.executionState).toEqual(completedState);
    });

    it('should progress directly to ready when no rest period', async () => {
      const nextPhaseState: AdvancedSetExecutionState = {
        ...mockDropSetState,
        currentPhase: 2,
        restPeriodSeconds: 0,
      };

      vi.mocked(mockExecutionService.progressToNextPhase).mockResolvedValue(
        Result.success(nextPhaseState)
      );

      actor.send({
        type: 'COMPLETE_SET',
        setData: { weight: 100, counts: 8, rpe: 9, completed: true },
      });

      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(nextPhaseState);
    });

    it('should handle progression failure', async () => {
      vi.mocked(mockExecutionService.progressToNextPhase).mockResolvedValue(
        Result.failure(new ApplicationError('Progression failed'))
      );

      actor.send({
        type: 'COMPLETE_SET',
        setData: { weight: 100, counts: 8, rpe: 9, completed: true },
      });

      await waitFor(actor, (state) => state.value === 'error');

      expect(actor.getSnapshot().context.error).toBe('Progression failed');
    });
  });

  describe('Rest Timer Management', () => {
    beforeEach(async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mockDropSetState)
      );
      vi.mocked(mockExecutionService.progressToNextPhase).mockResolvedValue(
        Result.success({
          ...mockDropSetState,
          currentPhase: 2,
          restPeriodSeconds: 5,
        })
      );

      actor.start();
      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'ready');

      actor.send({
        type: 'COMPLETE_SET',
        setData: { weight: 100, counts: 8, rpe: 9, completed: true },
      });
      await waitFor(actor, (state) => state.matches('resting.timerReady'));
    });

    it('should start rest timer', () => {
      actor.send({ type: 'START_REST_TIMER' });

      expect(actor.getSnapshot().matches('resting.timerRunning')).toBe(true);
      expect(actor.getSnapshot().context.timer.isRunning).toBe(true);
    });

    it('should pause and resume timer', () => {
      actor.send({ type: 'START_REST_TIMER' });
      actor.send({ type: 'PAUSE_TIMER' });

      expect(actor.getSnapshot().matches('resting.timerPaused')).toBe(true);
      expect(actor.getSnapshot().context.timer.isRunning).toBe(false);

      actor.send({ type: 'RESUME_TIMER' });

      expect(actor.getSnapshot().matches('resting.timerRunning')).toBe(true);
      expect(actor.getSnapshot().context.timer.isRunning).toBe(true);
    });

    it('should skip rest period', () => {
      actor.send({ type: 'SKIP_REST' });

      expect(actor.getSnapshot().value).toBe('ready');
      expect(actor.getSnapshot().context.timer.isRunning).toBe(false);
    });

    it('should complete timer and return to ready', async () => {
      actor.send({ type: 'START_REST_TIMER' });

      // Simulate timer completion by manually setting remaining seconds to 0
      await waitFor(actor, (state) => state.matches('resting.timerRunning'), { timeout: 1000 });

      // Send timer complete event
      actor.send({ type: 'TIMER_COMPLETE' });

      await waitFor(actor, (state) => state.value === 'ready');
    });
  });

  describe('State Transitions and Guards', () => {
    it('should automatically transition to completed when set is complete on initialization', async () => {
      const completedState: AdvancedSetExecutionState = {
        ...mockDropSetState,
        isCompleted: true,
      };

      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(completedState)
      );

      actor.start();
      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });

      await waitFor(actor, (state) => state.value === 'completed');
    });

    it('should allow reset from any state', async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mockDropSetState)
      );

      actor.start();
      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'ready');

      actor.send({ type: 'RESET_SET' });

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.executionState).toBeNull();
      expect(actor.getSnapshot().context.completedSets).toEqual([]);
    });

    it('should allow abort from any state', async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mockDropSetState)
      );

      actor.start();
      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'ready');

      actor.send({ type: 'ABORT_SET' });

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.executionState).toBeNull();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should allow reinitialization from error state', async () => {
      vi.mocked(mockExecutionService.initializeExecution)
        .mockResolvedValueOnce(Result.failure(new ApplicationError('First failure')))
        .mockResolvedValueOnce(Result.success(mockDropSetState));

      actor.start();
      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'error');

      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(mockDropSetState);
      expect(actor.getSnapshot().context.error).toBeNull();
    });

    it('should allow reinitialization from completed state', async () => {
      vi.mocked(mockExecutionService.initializeExecution)
        .mockResolvedValueOnce(Result.success({ ...mockDropSetState, isCompleted: true }))
        .mockResolvedValueOnce(Result.success(mockDropSetState));

      actor.start();
      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'completed');

      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'ready');

      expect(actor.getSnapshot().context.executionState).toEqual(mockDropSetState);
    });
  });

  describe('Logging Integration', () => {
    it('should log state transitions', async () => {
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.success(mockDropSetState)
      );

      actor.start();
      actor.send({ type: 'INITIALIZE', setConfiguration: {} as any });
      await waitFor(actor, (state) => state.value === 'ready');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Advanced set state transition',
        expect.objectContaining({
          from: 'idle',
          to: 'initializing',
          event: 'INITIALIZE',
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Advanced set state transition',
        expect.objectContaining({
          from: 'initializing',
          to: 'ready',
          setType: 'drop',
          currentPhase: 1,
          totalPhases: 3,
        })
      );
    });
  });
});
