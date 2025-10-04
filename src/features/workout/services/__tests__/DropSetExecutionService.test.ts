import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';

import { DropSetExecutionService, DropSetExecutionState } from '../DropSetExecutionService';

describe('DropSetExecutionService', () => {
  let service: DropSetExecutionService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    service = new DropSetExecutionService(mockLogger);
  });

  describe('initializeExecution', () => {
    it('should initialize drop set execution correctly', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 100);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.configuration).toBe(configuration);
      expect(state.currentPhase).toBe(1);
      expect(state.totalPhases).toBe(3); // 1 main set + 2 drops
      expect(state.isCompleted).toBe(false);
      expect(state.currentSetData.weight).toBe(100);
      expect(state.currentSetData.counts).toBe(8);
      expect(state.currentSetData.rpe).toBe(8);
      expect(state.nextSetData).toBeDefined();
      expect(state.restPeriodSeconds).toBe(15);
      expect(state.dropsCompleted).toBe(0);
    });

    it('should handle initialization without last weight', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 1, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.currentSetData.weight).toBe(0);
      expect(state.totalPhases).toBe(2); // 1 main set + 1 drop
    });

    it('should handle single set (no drops)', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 0, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.totalPhases).toBe(1);
      expect(state.nextSetData).toBeUndefined();
      expect(state.restPeriodSeconds).toBeUndefined();
    });
  });

  describe('progressToNextPhase', () => {
    let initialState: DropSetExecutionState;

    beforeEach(async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 100);
      initialState = result.getValue();
    });

    it('should progress to next drop correctly', async () => {
      const completedSetData = {
        weight: 100,
        counts: 8,
        rpe: 8,
        completed: true,
      };

      const result = await service.progressToNextPhase(initialState, completedSetData);

      expect(result.isSuccess).toBe(true);
      const newState = result.getValue();

      expect(newState.currentPhase).toBe(2);
      expect(newState.dropsCompleted).toBe(1);
      expect(newState.currentSetData.weight).toBeLessThan(100); // Weight should drop
      expect(newState.nextSetData).toBeDefined(); // Should have next drop
      expect(newState.restPeriodSeconds).toBe(15);
      expect(newState.isCompleted).toBe(false);
    });

    it('should complete drop set on final phase', async () => {
      // Progress through all phases
      let currentState = initialState;

      // First drop
      const firstDropResult = await service.progressToNextPhase(currentState, {
        weight: 100,
        counts: 8,
        rpe: 8,
        completed: true,
      });
      currentState = firstDropResult.getValue();

      // Second (final) drop
      const finalDropResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 6,
        rpe: 9,
        completed: true,
      });

      expect(finalDropResult.isSuccess).toBe(true);
      const finalState = finalDropResult.getValue();

      expect(finalState.isCompleted).toBe(true);
      expect(finalState.nextSetData).toBeUndefined();
      expect(finalState.restPeriodSeconds).toBeUndefined();
      expect(finalState.dropsCompleted).toBe(2);
    });

    it('should handle already completed state', async () => {
      const completedState: DropSetExecutionState = {
        ...initialState,
        isCompleted: true,
        currentPhase: 3,
      };

      const result = await service.progressToNextPhase(completedState, {
        weight: 60,
        counts: 5,
        rpe: 10,
        completed: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('already completed');
    });

    it('should handle weight calculation with different weights', async () => {
      const completedSetData = {
        weight: 120, // Different weight than initial
        counts: 8,
        rpe: 8,
        completed: true,
      };

      const result = await service.progressToNextPhase(initialState, completedSetData);

      expect(result.isSuccess).toBe(true);
      const newState = result.getValue();

      // Should base calculation on the actual completed weight
      expect(newState.currentSetData.weight).toBeLessThan(120);
      expect(newState.currentSetData.weight).toBeCloseTo(96, 0); // 20% drop from 120
    });
  });

  describe('validatePhaseCompletion', () => {
    let mockState: DropSetExecutionState;

    beforeEach(async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 100);
      mockState = result.getValue();
    });

    it('should validate valid completion data', async () => {
      const proposedData = {
        weight: 100,
        counts: 8,
        rpe: 8,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, proposedData);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });

    it('should reject zero or negative counts', async () => {
      const proposedData = {
        weight: 100,
        counts: 0,
        rpe: 8,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, proposedData);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Counts must be greater than 0');
    });

    it('should reject negative weight', async () => {
      const proposedData = {
        weight: -10,
        counts: 5,
        rpe: 8,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, proposedData);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Weight cannot be negative');
    });

    it('should reject invalid RPE values', async () => {
      const invalidRpeData = [
        { weight: 100, counts: 5, rpe: 0, completed: true },
        { weight: 100, counts: 5, rpe: 11, completed: true },
      ];

      for (const data of invalidRpeData) {
        const result = await service.validatePhaseCompletion(mockState, data);
        expect(result.isFailure).toBe(true);
        expect(result.error.message).toContain('RPE must be between 1 and 10');
      }
    });

    it('should warn about unusually high rep counts', async () => {
      const proposedData = {
        weight: 100,
        counts: 20, // Much higher than expected 8
        rpe: 8,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, proposedData);

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unusually high rep count'),
        expect.any(Object)
      );
    });
  });

  describe('getSuggestedRestPeriod', () => {
    it('should return 15 seconds for ongoing drop set', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 100);
      const state = result.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(state);

      expect(restPeriodResult.isSuccess).toBe(true);
      expect(restPeriodResult.getValue()).toBe(15);
    });

    it('should return 0 for completed drop set', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 1, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 100);
      let state = initResult.getValue();

      // Progress to completion
      const progressResult = await service.progressToNextPhase(state, {
        weight: 100,
        counts: 8,
        rpe: 8,
        completed: true,
      });
      state = progressResult.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(state);

      expect(restPeriodResult.isSuccess).toBe(true);
      expect(restPeriodResult.getValue()).toBe(0);
    });
  });

  describe('weight calculation logic', () => {
    it('should calculate appropriate drop weights', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 100);
      let state = result.getValue();

      // First drop
      const firstDropResult = await service.progressToNextPhase(state, {
        weight: 100,
        counts: 10,
        rpe: 8,
        completed: true,
      });

      state = firstDropResult.getValue();
      const firstDropWeight = state.currentSetData.weight;

      expect(firstDropWeight).toBeLessThan(100);
      expect(firstDropWeight).toBeGreaterThanOrEqual(5); // Minimum weight constraint

      // Second drop
      const secondDropResult = await service.progressToNextPhase(state, {
        weight: firstDropWeight,
        counts: 8,
        rpe: 9,
        completed: true,
      });

      const secondState = secondDropResult.getValue();
      const secondDropWeight = secondState.currentSetData.weight;

      expect(secondDropWeight).toBeLessThan(firstDropWeight);
      expect(secondDropWeight).toBeGreaterThanOrEqual(5);
    });

    it('should respect minimum weight constraints', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 5, direction: 'asc' }, // Many drops to test minimum
        sets: { min: 1, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 10); // Low starting weight
      let state = result.getValue();

      // Progress through multiple drops
      for (let i = 0; i < 5; i++) {
        const progressResult = await service.progressToNextPhase(state, {
          weight: state.currentSetData.weight,
          counts: Math.max(6 - i, 1),
          rpe: 8 + i,
          completed: true,
        });

        if (progressResult.getValue().isCompleted) break;

        state = progressResult.getValue();
        expect(state.currentSetData.weight).toBeGreaterThanOrEqual(5); // Should not go below minimum
      }
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const configuration = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      // Mock logger to throw error
      vi.mocked(mockLogger.info).mockImplementationOnce(() => {
        throw new Error('Logger error');
      });

      const result = await service.initializeExecution(configuration, 100);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Failed to initialize drop set execution');
    });
  });
});
