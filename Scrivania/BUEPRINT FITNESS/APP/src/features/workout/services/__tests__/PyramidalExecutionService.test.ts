import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { PyramidalSetConfiguration } from '@/features/training-plan/domain/sets/PyramidalSetConfiguration';

import { PyramidalExecutionService, PyramidalExecutionState } from '../PyramidalExecutionService';

describe('PyramidalExecutionService', () => {
  let service: PyramidalExecutionService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    service = new PyramidalExecutionService(mockLogger);
  });

  describe('initializeExecution', () => {
    it('should initialize ascending pyramid correctly', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 4, direction: 'asc' },
        rpe: { min: 7, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 60);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.configuration).toBe(configuration);
      expect(state.currentPhase).toBe(1);
      expect(state.pyramidSequence).toEqual([12, 10, 8, 6]); // 12->10->8->6
      expect(state.totalPhases).toBe(4);
      expect(state.currentDirection).toBe('ascending');
      expect(state.directionSwitchPoint).toBeUndefined();
      expect(state.currentSetData.weight).toBe(60);
      expect(state.currentSetData.counts).toBe(12); // First set
      expect(state.nextSetData).toBeDefined();
    });

    it('should initialize descending pyramid correctly', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'descending',
        sets: { min: 3, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.pyramidSequence).toEqual([8, 10, 12]); // 8->10->12
      expect(state.currentDirection).toBe('descending');
      expect(state.currentSetData.counts).toBe(8);
    });

    it('should initialize both-direction pyramid correctly', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 10, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'bothAscendingDescending',
        sets: { min: 5, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 70);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.pyramidSequence).toEqual([10, 8, 6, 8, 10]); // 10->8->6->8->10
      expect(state.currentDirection).toBe('ascending');
      expect(state.directionSwitchPoint).toBe(2); // Switch after the 6-rep set
      expect(state.currentSetData.counts).toBe(10);
    });

    it('should handle invalid pyramid configuration', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 5, direction: 'asc' },
        endCounts: { min: 5, direction: 'asc' }, // Same start and end
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 60);

      // Should still work with single set
      expect(result.isSuccess).toBe(true);
      const state = result.getValue();
      expect(state.pyramidSequence).toEqual([5]);
    });
  });

  describe('progressToNextPhase', () => {
    let ascendingState: PyramidalExecutionState;
    let bothDirectionState: PyramidalExecutionState;

    beforeEach(async () => {
      // Ascending pyramid: 12->10->8->6
      const ascendingConfig = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 4, direction: 'asc' },
      });

      const ascendingResult = await service.initializeExecution(ascendingConfig, 60);
      ascendingState = ascendingResult.getValue();

      // Both-direction pyramid: 10->8->6->8->10
      const bothConfig = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 10, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'bothAscendingDescending',
        sets: { min: 5, direction: 'asc' },
      });

      const bothResult = await service.initializeExecution(bothConfig, 70);
      bothDirectionState = bothResult.getValue();
    });

    it('should progress through ascending pyramid correctly', async () => {
      let currentState = ascendingState;
      const expectedSequence = [12, 10, 8, 6];

      for (let i = 0; i < expectedSequence.length - 1; i++) {
        const completedSetData = {
          weight: currentState.currentSetData.weight,
          counts: expectedSequence[i],
          rpe: 7 + i,
          completed: true,
        };

        const result = await service.progressToNextPhase(currentState, completedSetData);

        expect(result.isSuccess).toBe(true);
        currentState = result.getValue();

        expect(currentState.currentPhase).toBe(i + 2);
        expect(currentState.currentSetData.counts).toBe(expectedSequence[i + 1]);
        expect(currentState.currentDirection).toBe('ascending');

        if (i < expectedSequence.length - 2) {
          expect(currentState.nextSetData).toBeDefined();
          expect(currentState.restPeriodSeconds).toBeGreaterThan(0);
        }
      }

      // Complete final set
      const finalResult = await service.progressToNextPhase(currentState, {
        weight: currentState.currentSetData.weight,
        counts: 6,
        rpe: 9,
        completed: true,
      });

      expect(finalResult.isSuccess).toBe(true);
      const finalState = finalResult.getValue();
      expect(finalState.isCompleted).toBe(true);
      expect(finalState.nextSetData).toBeUndefined();
    });

    it('should handle direction switch in both-direction pyramid', async () => {
      let currentState = bothDirectionState;
      const expectedSequence = [10, 8, 6, 8, 10];
      const expectedDirections = [
        'ascending',
        'ascending',
        'ascending',
        'descending',
        'descending',
      ];

      for (let i = 0; i < expectedSequence.length - 1; i++) {
        const completedSetData = {
          weight: currentState.currentSetData.weight,
          counts: expectedSequence[i],
          rpe: 7 + Math.floor(i / 2),
          completed: true,
        };

        const result = await service.progressToNextPhase(currentState, completedSetData);

        expect(result.isSuccess).toBe(true);
        currentState = result.getValue();

        expect(currentState.currentPhase).toBe(i + 2);
        expect(currentState.currentSetData.counts).toBe(expectedSequence[i + 1]);
        expect(currentState.currentDirection).toBe(expectedDirections[i + 1]);
      }
    });

    it('should calculate appropriate weights for different rep ranges', async () => {
      let currentState = ascendingState;
      let previousWeight = currentState.currentSetData.weight;

      // Progress through sets and check weight progression
      for (let i = 0; i < 2; i++) {
        const result = await service.progressToNextPhase(currentState, {
          weight: currentState.currentSetData.weight,
          counts: currentState.currentSetData.counts,
          rpe: 7,
          completed: true,
        });

        currentState = result.getValue();
        const currentWeight = currentState.currentSetData.weight;

        // Weight should generally increase as reps decrease (ascending pyramid)
        expect(currentWeight).toBeGreaterThanOrEqual(previousWeight);
        previousWeight = currentWeight;
      }
    });

    it('should handle already completed state', async () => {
      const completedState: PyramidalExecutionState = {
        ...ascendingState,
        isCompleted: true,
        currentPhase: 4,
      };

      const result = await service.progressToNextPhase(completedState, {
        weight: 70,
        counts: 6,
        rpe: 9,
        completed: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('already completed');
    });
  });

  describe('validatePhaseCompletion', () => {
    let mockState: PyramidalExecutionState;

    beforeEach(async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 4, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 60);
      mockState = result.getValue();
    });

    it('should validate correct pyramid set completion', async () => {
      const validData = {
        weight: 60,
        counts: 12,
        rpe: 7,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, validData);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });

    it('should warn about significant rep count deviation', async () => {
      const deviatedData = {
        weight: 60,
        counts: 20, // Much higher than expected 12
        rpe: 7,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, deviatedData);

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('rep count deviates significantly'),
        expect.any(Object)
      );
    });

    it('should warn about significant weight deviation', async () => {
      const wrongWeightData = {
        weight: 100, // Much higher than expected 60
        counts: 12,
        rpe: 7,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, wrongWeightData);

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('weight deviates significantly'),
        expect.any(Object)
      );
    });

    it('should reject invalid basic data', async () => {
      const invalidDataCases = [
        { weight: 60, counts: 0, rpe: 7, completed: true }, // Zero counts
        { weight: -10, counts: 12, rpe: 7, completed: true }, // Negative weight
        { weight: 60, counts: 12, rpe: 11, completed: true }, // Invalid RPE
      ];

      for (const invalidData of invalidDataCases) {
        const result = await service.validatePhaseCompletion(mockState, invalidData);
        expect(result.isFailure).toBe(true);
      }
    });
  });

  describe('getSuggestedRestPeriod', () => {
    it('should suggest longer rest for heavier, low-rep sets', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 10, direction: 'asc' },
        endCounts: { min: 4, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 4, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);
      let state = result.getValue();

      const initialRestResult = await service.getSuggestedRestPeriod(state);
      const initialRest = initialRestResult.getValue();

      // Progress to lower rep, heavier set
      const progressResult = await service.progressToNextPhase(state, {
        weight: 80,
        counts: 10,
        rpe: 7,
        completed: true,
      });
      state = progressResult.getValue();

      const heavierSetRestResult = await service.getSuggestedRestPeriod(state);
      const heavierSetRest = heavierSetRestResult.getValue();

      expect(heavierSetRest).toBeGreaterThan(initialRest);
    });

    it('should suggest longer rest for descending direction', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'descending',
        sets: { min: 3, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 70);
      const descendingState = result.getValue();

      const descendingRestResult = await service.getSuggestedRestPeriod(descendingState);
      const descendingRest = descendingRestResult.getValue();

      // Compare with ascending at same rep count
      const ascendingConfig = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 3, direction: 'asc' },
      });

      const ascendingResult = await service.initializeExecution(ascendingConfig, 70);
      const ascendingState = ascendingResult.getValue();

      const ascendingRestResult = await service.getSuggestedRestPeriod(ascendingState);
      const ascendingRest = ascendingRestResult.getValue();

      expect(descendingRest).toBeGreaterThan(ascendingRest);
    });

    it('should return 0 for completed pyramid', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 2, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 60);
      let state = initResult.getValue();

      // Complete the pyramid
      const progressResult = await service.progressToNextPhase(state, {
        weight: 60,
        counts: 8,
        rpe: 7,
        completed: true,
      });
      state = progressResult.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(state);
      const restPeriod = restPeriodResult.getValue();

      expect(restPeriod).toBe(0);
    });
  });

  describe('pyramid sequence calculation', () => {
    it('should calculate correct ascending sequence', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 15, direction: 'asc' },
        endCounts: { min: 5, direction: 'asc' },
        step: { min: 5, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 3, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 50);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();
      expect(state.pyramidSequence).toEqual([15, 10, 5]);
    });

    it('should calculate correct descending sequence', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 5, direction: 'asc' },
        endCounts: { min: 15, direction: 'asc' },
        step: { min: 5, direction: 'asc' },
        mode: 'descending',
        sets: { min: 3, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 50);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();
      expect(state.pyramidSequence).toEqual([5, 10, 15]);
    });

    it('should calculate correct both-direction sequence', async () => {
      const configuration = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 4, direction: 'asc' },
        step: { min: 4, direction: 'asc' },
        mode: 'bothAscendingDescending',
        sets: { min: 5, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 60);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();
      expect(state.pyramidSequence).toEqual([12, 8, 4, 8, 12]);
    });
  });
});
