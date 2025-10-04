import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { MavSetConfiguration } from '@/features/training-plan/domain/sets/MavSetConfiguration';

import { MavExecutionService, MavExecutionState } from '../MavExecutionService';

describe('MavExecutionService', () => {
  let service: MavExecutionService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    service = new MavExecutionService(mockLogger);
  });

  describe('initializeExecution', () => {
    it('should initialize MAV execution correctly', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 5, max: 15, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        rpe: { min: 7, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.configuration).toBe(configuration);
      expect(state.currentPhase).toBe(1);
      expect(state.totalPhases).toBe(15); // Max sets
      expect(state.isCompleted).toBe(false);
      expect(state.currentSetData.weight).toBe(80);
      expect(state.currentSetData.counts).toBe(8);
      expect(state.currentSetData.rpe).toBe(7);
      expect(state.setsCompleted).toBe(0);
      expect(state.totalVolumeAchieved).toBe(0);
      expect(state.performanceDecline).toBe(false);
      expect(state.nextSetData).toBeDefined();
    });

    it('should handle unlimited max sets', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 3, direction: 'asc' }, // No max specified
        counts: { min: 10, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 70);

      expect(result.isSuccess).toBe(true);
      const state = result.getValue();

      expect(state.totalPhases).toBe(20); // Safety limit
    });
  });

  describe('progressToNextPhase', () => {
    let initialState: MavExecutionState;

    beforeEach(async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 3, max: 10, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        rpe: { min: 7, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 80);
      initialState = result.getValue();
    });

    it('should progress through MAV sets while performance is stable', async () => {
      let currentState = initialState;

      // Complete several sets with stable performance
      for (let i = 0; i < 3; i++) {
        const completedSetData = {
          weight: 80,
          counts: 8 - i * 0.5, // Slight decline but within threshold
          rpe: 7 + i,
          completed: true,
        };

        const result = await service.progressToNextPhase(currentState, completedSetData);

        expect(result.isSuccess).toBe(true);
        currentState = result.getValue();

        expect(currentState.currentPhase).toBe(i + 2);
        expect(currentState.setsCompleted).toBe(i + 1);
        expect(currentState.totalVolumeAchieved).toBeGreaterThan(0);
        expect(currentState.lastSetPerformance).toBeDefined();
        expect(currentState.nextSetData).toBeDefined();
        expect(currentState.restPeriodSeconds).toBeGreaterThan(0);
        expect(currentState.isCompleted).toBe(false);
      }
    });

    it('should complete MAV when performance declines significantly', async () => {
      let currentState = initialState;

      // First set - good performance
      const firstSetResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 10,
        rpe: 7,
        completed: true,
      });
      currentState = firstSetResult.getValue();

      // Second set - significant decline
      const secondSetResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 3, // 70% drop from 10 reps - below threshold
        rpe: 9,
        completed: true,
      });

      expect(secondSetResult.isSuccess).toBe(true);
      const finalState = secondSetResult.getValue();

      expect(finalState.isCompleted).toBe(true);
      expect(finalState.performanceDecline).toBe(true);
      expect(finalState.setsCompleted).toBe(2);
      expect(finalState.nextSetData).toBeUndefined();
      expect(finalState.restPeriodSeconds).toBeUndefined();
    });

    it('should complete MAV when maximum sets reached', async () => {
      let currentState = initialState;

      // Progress through maximum allowed sets
      for (let i = 0; i < 10; i++) {
        const completedSetData = {
          weight: 80,
          counts: Math.max(8 - i * 0.2, 6), // Gradual decline but not too severe
          rpe: 7 + Math.floor(i / 2),
          completed: true,
        };

        const result = await service.progressToNextPhase(currentState, completedSetData);
        currentState = result.getValue();

        if (currentState.isCompleted) {
          expect(currentState.setsCompleted).toBeLessThanOrEqual(10);
          break;
        }
      }

      expect(currentState.isCompleted).toBe(true);
    });

    it('should complete MAV when RPE reaches maximum', async () => {
      let currentState = initialState;

      // First set - moderate RPE
      const firstSetResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 8,
        rpe: 8,
        completed: true,
      });
      currentState = firstSetResult.getValue();

      // Second set - maximum RPE
      const secondSetResult = await service.progressToNextPhase(currentState, {
        weight: 80,
        counts: 7,
        rpe: 10, // Maximum RPE
        completed: true,
      });

      expect(secondSetResult.isSuccess).toBe(true);
      const finalState = secondSetResult.getValue();

      expect(finalState.isCompleted).toBe(true);
      expect(finalState.setsCompleted).toBe(2);
    });

    it('should handle already completed state', async () => {
      const completedState: MavExecutionState = {
        ...initialState,
        isCompleted: true,
        setsCompleted: 5,
      };

      const result = await service.progressToNextPhase(completedState, {
        weight: 80,
        counts: 6,
        rpe: 9,
        completed: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('already completed');
    });

    it('should calculate volume correctly', async () => {
      let currentState = initialState;

      const completedSetData = {
        weight: 80,
        counts: 10,
        rpe: 7,
        completed: true,
      };

      const result = await service.progressToNextPhase(currentState, completedSetData);
      currentState = result.getValue();

      const expectedVolume = 80 * 10; // weight * reps
      expect(currentState.totalVolumeAchieved).toBe(expectedVolume);
    });
  });

  describe('validatePhaseCompletion', () => {
    let mockState: MavExecutionState;

    beforeEach(async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 5, max: 15, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        rpe: { min: 7, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 75);
      mockState = result.getValue();
    });

    it('should validate normal MAV set completion', async () => {
      const validData = {
        weight: 75,
        counts: 8,
        rpe: 7,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, validData);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });

    it('should warn about significantly low performance', async () => {
      const lowPerformanceData = {
        weight: 75,
        counts: 3, // Much below target of 8
        rpe: 9,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, lowPerformanceData);

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('performance significantly below target'),
        expect.any(Object)
      );
    });

    it('should warn about approaching high RPE', async () => {
      const highRpeData = {
        weight: 75,
        counts: 8,
        rpe: 9,
        completed: true,
      };

      const result = await service.validatePhaseCompletion(mockState, highRpeData);

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('approaching high RPE'),
        expect.any(Object)
      );
    });

    it('should reject invalid basic data', async () => {
      const invalidDataCases = [
        { weight: 75, counts: 0, rpe: 7, completed: true }, // Zero counts
        { weight: -10, counts: 8, rpe: 7, completed: true }, // Negative weight
        { weight: 75, counts: 8, rpe: 11, completed: true }, // Invalid RPE
      ];

      for (const invalidData of invalidDataCases) {
        const result = await service.validatePhaseCompletion(mockState, invalidData);
        expect(result.isFailure).toBe(true);
      }
    });
  });

  describe('getSuggestedRestPeriod', () => {
    it('should return 0 for first set', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 5, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      });

      const result = await service.initializeExecution(configuration, 70);
      const initialState = result.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(initialState);

      expect(restPeriodResult.isSuccess).toBe(true);
      expect(restPeriodResult.getValue()).toBe(0);
    });

    it('should increase rest period with fatigue', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 8, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        rpe: { min: 7, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 80);
      let state = initResult.getValue();

      // Complete several sets to accumulate fatigue
      for (let i = 0; i < 6; i++) {
        const progressResult = await service.progressToNextPhase(state, {
          weight: 80,
          counts: 10 - i,
          rpe: 7 + i,
          completed: true,
        });

        if (progressResult.getValue().isCompleted) break;
        state = progressResult.getValue();
      }

      const laterRestPeriodResult = await service.getSuggestedRestPeriod(state);

      expect(laterRestPeriodResult.isSuccess).toBe(true);
      const laterRestPeriod = laterRestPeriodResult.getValue();
      expect(laterRestPeriod).toBeGreaterThan(90); // Should be more than base rest
      expect(laterRestPeriod).toBeLessThanOrEqual(180); // Should respect maximum
    });

    it('should increase rest for high RPE', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 5, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 75);
      let state = initResult.getValue();

      // Complete a set with high RPE
      const progressResult = await service.progressToNextPhase(state, {
        weight: 75,
        counts: 8,
        rpe: 9, // High RPE
        completed: true,
      });
      state = progressResult.getValue();

      const highRpeRestPeriodResult = await service.getSuggestedRestPeriod(state);
      expect(highRpeRestPeriodResult.isSuccess).toBe(true);
      const highRpeRestPeriod = highRpeRestPeriodResult.getValue();

      // Complete another set with lower RPE for comparison
      const lowRpeProgressResult = await service.progressToNextPhase(state, {
        weight: 75,
        counts: 8,
        rpe: 7, // Lower RPE
        completed: true,
      });

      if (!lowRpeProgressResult.getValue().isCompleted) {
        const lowRpeState = lowRpeProgressResult.getValue();
        const lowRpeRestPeriodResult = await service.getSuggestedRestPeriod(lowRpeState);
        expect(lowRpeRestPeriodResult.isSuccess).toBe(true);
        const lowRpeRestPeriod = lowRpeRestPeriodResult.getValue();

        expect(highRpeRestPeriod).toBeGreaterThan(lowRpeRestPeriod);
      }
    });

    it('should return 0 for completed MAV', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 2, max: 2, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 70);
      let state = initResult.getValue();

      // Complete first set
      const firstResult = await service.progressToNextPhase(state, {
        weight: 70,
        counts: 8,
        rpe: 7,
        completed: true,
      });
      state = firstResult.getValue();

      // Complete second (final) set
      const finalResult = await service.progressToNextPhase(state, {
        weight: 70,
        counts: 7,
        rpe: 8,
        completed: true,
      });
      state = finalResult.getValue();

      const restPeriodResult = await service.getSuggestedRestPeriod(state);

      expect(restPeriodResult.isSuccess).toBe(true);
      expect(restPeriodResult.getValue()).toBe(0);
    });
  });

  describe('performance decline detection', () => {
    it('should detect significant performance decline', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 3, max: 10, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 80);
      let state = initResult.getValue();

      // First set - good performance
      const firstResult = await service.progressToNextPhase(state, {
        weight: 80,
        counts: 10,
        rpe: 7,
        completed: true,
      });
      state = firstResult.getValue();

      // Second set - major decline (below 80% threshold)
      const declineResult = await service.progressToNextPhase(state, {
        weight: 80,
        counts: 7, // 30% decline from 10
        rpe: 9,
        completed: true,
      });

      expect(declineResult.isSuccess).toBe(true);
      const finalState = declineResult.getValue();

      expect(finalState.isCompleted).toBe(true);
      expect(finalState.performanceDecline).toBe(true);
    });

    it('should continue with stable performance', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 4, max: 8, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 75);
      let state = initResult.getValue();

      // Multiple sets with stable performance
      for (let i = 0; i < 4; i++) {
        const result = await service.progressToNextPhase(state, {
          weight: 75,
          counts: 8 - i * 0.1, // Minor decline within acceptable range
          rpe: 7 + i * 0.5,
          completed: true,
        });

        state = result.getValue();

        if (i < 3) {
          expect(state.isCompleted).toBe(false);
          expect(state.performanceDecline).toBe(false);
        }
      }
    });

    it('should respect safety limits', async () => {
      const configuration = new MavSetConfiguration({
        type: 'mav',
        sets: { min: 2, direction: 'asc' }, // No max - should use safety limit
        counts: { min: 8, direction: 'asc' },
      });

      const initResult = await service.initializeExecution(configuration, 70);
      let state = initResult.getValue();

      // Try to exceed safety limit
      let setsCompleted = 0;
      while (!state.isCompleted && setsCompleted < 25) {
        // Try more than safety limit
        const result = await service.progressToNextPhase(state, {
          weight: 70,
          counts: 8,
          rpe: 7,
          completed: true,
        });

        state = result.getValue();
        setsCompleted++;
      }

      expect(setsCompleted).toBeLessThanOrEqual(20); // Safety limit
      expect(state.isCompleted).toBe(true);
    });
  });
});
