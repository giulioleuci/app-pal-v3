import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';

import { MyoRepsExecutionService, MyoRepsExecutionState } from '../MyoRepsExecutionService';

describe('MyoRepsExecutionService', () => {
  let service: MyoRepsExecutionService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    service = new MyoRepsExecutionService(mockLogger);
  });

  describe('initializeExecution', () => {
    it('should initialize myo-reps execution for activation phase', async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.configuration).toBe(configuration);
      expect(state.currentPhase).toBe(1);
      expect(state.totalPhases).toBe(4); // 1 activation + 3 mini-sets
      expect(state.isCompleted).toBe(false);
      expect(state.currentSetData.weight).toBe(80);
      expect(state.currentSetData.counts).toBe(15); // Activation counts
      expect(state.currentSetData.rpe).toBe(8);
      expect(state.isActivationPhase).toBe(true);
      expect(state.miniSetsCompleted).toBe(0);
      expect(state.activationReps).toBeUndefined();
      expect(state.nextSetData).toBeDefined();
    });

    it('should handle single activation set (no mini-sets)', async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 0, direction: 'asc' },
        miniSetCounts: { min: 0, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 70);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.totalPhases).toBe(1);
      expect(state.nextSetData).toBeUndefined();
    });
  });

  describe('progressToNextPhase', () => {
    let initialState: MyoRepsExecutionState;

    beforeEach(async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);
      initialState = result.getValue();
    });

    it('should transition from activation phase to first mini-set', async () => {
      expect(initialState.isActivationPhase).toBe(true);

      const completedSetData = {
        weight: 80,
        counts: 15,
        rpe: 8,
        completed: true,
      };

      const result = await service.progressToNextPhase(initialState, completedSetData);

      expect(result.isSuccess).toBe(true);
      const newState = result.getValue();

      expect(newState.currentPhase).toBe(2);
      expect(newState.isActivationPhase).toBe(false);
      expect(newState.activationReps).toBe(15);
      expect(newState.miniSetsCompleted).toBe(0);
      expect(newState.currentSetData.counts).toBeLessThanOrEqual(15); // Mini-set should be fewer reps
      expect(newState.restPeriodSeconds).toBeGreaterThan(0);
      expect(newState.nextSetData).toBeDefined(); // Should have next mini-set
    });

    it('should progress through mini-sets correctly', async () => {
      // Complete activation phase first
      let currentState = initialState;
      const activationResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 15,
        rpe: 8,
        completed: true,
      });
      currentState = activationResult.getValue();

      expect(currentState.isActivationPhase).toBe(false);
      expect(currentState.miniSetsCompleted).toBe(0);

      // Complete first mini-set
      const firstMiniSetResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 5,
        rpe: 9,
        completed: true,
      });
      currentState = firstMiniSetResult.getValue();

      expect(currentState.miniSetsCompleted).toBe(1);
      expect(currentState.currentPhase).toBe(3);
      expect(currentState.nextSetData).toBeDefined();
    });

    it('should complete myo-reps set after final mini-set', async () => {
      // Progress through all phases
      let currentState = initialState;

      // Activation phase
      const activationResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 15,
        rpe: 8,
        completed: true,
      });
      currentState = activationResult.getValue();

      // Mini-sets
      for (let i = 0; i < 3; i++) {
        const miniSetResult = await service.progressToNextPhase(currentState, {
          weight: 80,
          counts: 5 - i, // Declining reps
          rpe: 9 + i,
          completed: true,
        });
        currentState = miniSetResult.getValue();
      }

      expect(currentState.isCompleted).toBe(true);
      expect(currentState.miniSetsCompleted).toBe(3);
      expect(currentState.nextSetData).toBeUndefined();
      expect(currentState.restPeriodSeconds).toBeUndefined();
    });

    it('should handle already completed state', async () => {
      const completedState: MyoRepsExecutionState = {
        ...initialState,
        isCompleted: true,
        currentPhase: 4,
      };

      const result = await service.progressToNextPhase(completedState, {
        weight: 80,
        counts: 3,
        rpe: 10,
        completed: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('already completed');
    });
  });

  describe('validatePhaseCompletion', () => {
    let activationState: MyoRepsExecutionState;
    let miniSetState: MyoRepsExecutionState;

    beforeEach(async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);
      activationState = result.getValue();

      // Create mini-set state
      const transitionResult = await service.progressToNextPhase(activationState, {
        weight: 80,
        counts: 15,
        rpe: 8,
        completed: true,
      });
      miniSetState = transitionResult.getValue();
    });

    it('should validate activation phase completion', async () => {
      const validActivationData = {
        weight: 80,
        counts: 15,
        rpe: 8,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(activationState, validActivationData);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });

    it('should reject activation phase with insufficient reps', async () => {
      const insufficientRepsData = {
        weight: 80,
        counts: 10, // Below minimum of 15
        rpe: 8,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(activationState, insufficientRepsData);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('requires at least 15 reps');
    });

    it('should warn about low activation RPE', async () => {
      const lowRpeData = {
        weight: 80,
        counts: 15,
        rpe: 6, // Low RPE for activation
        completed: true,
      };

      const result = await service.validatePhaseCompletion(activationState, lowRpeData);

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Activation set RPE seems low'),
        expect.any(Object)
      );
    });

    it('should validate mini-set completion', async () => {
      const validMiniSetData = {
        weight: 80,
        counts: 5,
        rpe: 9,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(miniSetState, validMiniSetData);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });

    it('should warn about unusually high mini-set reps', async () => {
      const highRepsData = {
        weight: 80,
        counts: 15, // Very high for a mini-set
        rpe: 8,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(miniSetState, highRepsData);

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Mini-set rep count seems unusually high'),
        expect.any(Object)
      );
    });

    it('should reject invalid basic data', async () => {
      const invalidDataCases = [
        { weight: 80, counts: 0, rpe: 8, completed: true }, // Zero counts
        { weight: -10, counts: 10, rpe: 8, completed: true }, // Negative weight
        { weight: 80, counts: 10, rpe: 11, completed: true }, // Invalid RPE
      ];

      for (const invalidData of invalidDataCases) {
        const result = await service.validatePhaseCompletion(activationState, invalidData);
        expect(result.isFailure).toBe(true);
      }
    });
  });

  describe('getSuggestedRestPeriod', () => {
    it('should return 0 for activation phase', async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);
      const activationState = result.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(activationState);
      const restPeriod = restPeriodResult.getValue();

      expect(restPeriod).toBe(0);
    });

    it('should return appropriate rest for mini-sets', async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 80);
      let state = initResult.getValue();

      // Transition to mini-set
      const transitionResult = await service.progressToNextPhase(state, {
        weight: 80,
        counts: 15,
        rpe: 8,
        completed: true,
      });
      state = transitionResult.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(state);
      const restPeriod = restPeriodResult.getValue();

      expect(restPeriod).toBeGreaterThan(10);
      expect(restPeriod).toBeLessThanOrEqual(20);
    });

    it('should return 0 for completed set', async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 10, direction: 'asc' },
        miniSets: { min: 1, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 70);
      let state = initResult.getValue();

      // Complete activation
      const activationResult = await service.progressToNextPhase(state, {
        weight: 70,
        counts: 10,
        rpe: 8,
        completed: true,
      });
      state = activationResult.getValue();

      // Complete mini-set
      const finalResult = await service.progressToNextPhase(state, {
        weight: 70,
        counts: 3,
        rpe: 9,
        completed: true,
      });
      state = finalResult.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(state);
      const restPeriod = restPeriodResult.getValue();

      expect(restPeriod).toBe(0);
    });
  });

  describe('mini-set calculation logic', () => {
    it('should calculate appropriate mini-set targets based on activation reps', async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 20, direction: 'asc' },
        miniSets: { min: 2, direction: 'asc' },
        miniSetCounts: { min: 3, max: 6, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 75);
      let state = initResult.getValue();

      // Complete activation with high rep count
      const activationResult = await service.progressToNextPhase(state, {
        weight: 75,
        counts: 20,
        rpe: 8,
        completed: true,
      });
      state = activationResult.getValue();

      // Mini-set target should be based on activation performance
      expect(state.currentSetData.counts).toBeGreaterThanOrEqual(3);
      expect(state.currentSetData.counts).toBeLessThanOrEqual(6);
    });

    it('should adjust rest periods progressively', async () => {
      const configuration = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 4, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 80);
      let state = initResult.getValue();

      // Complete activation
      const activationResult = await service.progressToNextPhase(state, {
        weight: 80,
        counts: 15,
        rpe: 8,
        completed: true,
      });
      state = activationResult.getValue();

      const firstRestPeriod = state.restPeriodSeconds;

      // Complete first mini-set
      const firstMiniResult = await service.progressToNextPhase(state, {
        weight: 80,
        counts: 4,
        rpe: 9,
        completed: true,
      });
      state = firstMiniResult.getValue();

      const secondRestPeriod = state.restPeriodSeconds;

      // Rest periods should decrease as fatigue increases
      expect(secondRestPeriod).toBeLessThanOrEqual(firstRestPeriod!);
      expect(secondRestPeriod).toBeGreaterThanOrEqual(10); // Minimum rest
    });
  });
});
