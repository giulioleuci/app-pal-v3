import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';

import { useAdvancedSetExecutionStore } from '../../store/advancedSetExecutionStore';
import { useMyoRepsExecution } from '../useMyoRepsExecution';

// Mock the base hook
vi.mock('../useAdvancedSetExecution', () => ({
  useAdvancedSetExecution: vi.fn(),
}));

import { useAdvancedSetExecution } from '../useAdvancedSetExecution';

describe('useMyoRepsExecution', () => {
  let queryClient: QueryClient;

  const profileId = 'profile-1';
  const workoutLogId = 'workout-1';
  const exerciseId = 'exercise-1';

  const myoRepsConfig = new MyoRepsSetConfiguration({
    type: 'myoReps',
    sets: { min: 1, direction: 'asc' },
    activationCounts: { min: 15, direction: 'asc' },
    rpe: { min: 9, direction: 'asc' },
    miniSetCounts: { min: 5, direction: 'asc' },
    miniSets: { min: 3, direction: 'asc' },
  });

  const mockBaseExecution = {
    executionState: null,
    isInitialized: false,
    isExecuting: false,
    isCompleted: false,
    currentPhase: 1,
    totalPhases: 4,
    currentSetData: { weight: 60, counts: 15, rpe: 9 },
    nextSetData: { weight: 60, expectedCounts: 5, suggestedRpe: 9 },
    initialize: vi.fn(),
    completeCurrentSet: vi.fn(),
    reset: vi.fn(),
    abort: vi.fn(),
    restTimer: {
      timeRemaining: 0,
      formattedTime: '00:00',
      isActive: false,
      start: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
      skip: vi.fn(),
    },
    startRest: vi.fn(),
    skipRest: vi.fn(),
    completedSets: [],
    sessionId: 'session-123',
    isInitializing: false,
    isProgressing: false,
    isValidating: false,
    error: null,
    validateSetData: vi.fn(),
    getSuggestedRestPeriod: vi.fn(),
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    // Reset store
    useAdvancedSetExecutionStore.setState(
      {
        activeSessions: {},
        currentSessionId: null,
      },
      true
    );

    // Setup default mock return value
    vi.mocked(useAdvancedSetExecution).mockReturnValue(mockBaseExecution);
  });

  describe('Phase Identification', () => {
    it('should identify activation set phase', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 1,
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      expect(result.current.isActivationSet).toBe(true);
      expect(result.current.isMiniSet).toBe(false);
      expect(result.current.currentMiniSet).toBe(0);
    });

    it('should identify mini set phases', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2,
        isCompleted: false,
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      expect(result.current.isActivationSet).toBe(false);
      expect(result.current.isMiniSet).toBe(true);
      expect(result.current.currentMiniSet).toBe(1);
      expect(result.current.remainingMiniSets).toBe(2);
    });

    it('should identify rest between mini sets', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2,
        isCompleted: false,
        restTimer: { ...mockBaseExecution.restTimer, isActive: true },
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      expect(result.current.isRestBetweenMiniSets).toBe(true);
    });
  });

  describe('Configuration Access', () => {
    it('should provide access to MyoReps configuration', () => {
      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      expect(result.current.myoRepsConfig).toBe(myoRepsConfig);
      expect(result.current.activationReps).toBe(15);
      expect(result.current.activationRpe).toBe(9);
      expect(result.current.targetMiniSetReps).toBe(5);
      expect(result.current.totalMiniSets).toBe(3);
    });

    it('should handle missing configuration', () => {
      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, undefined),
        { wrapper }
      );

      expect(result.current.myoRepsConfig).toBeNull();
      expect(result.current.activationReps).toBeNull();
      expect(result.current.totalMiniSets).toBe(0);
    });
  });

  describe('Mini Set History Tracking', () => {
    it('should track mini set history from completed sets', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        completedSets: [
          { weight: 60, counts: 15, rpe: 9, completed: true }, // Activation set
          { weight: 60, counts: 5, rpe: 9, completed: true }, // Mini set 1
          { weight: 60, counts: 4, rpe: 10, completed: true }, // Mini set 2 (failed target)
        ],
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      expect(result.current.miniSetHistory).toHaveLength(2);
      expect(result.current.miniSetHistory[0]).toEqual({
        setNumber: 1,
        reps: 5,
        rpe: 9,
        reachedTarget: true,
      });
      expect(result.current.miniSetHistory[1]).toEqual({
        setNumber: 2,
        reps: 4,
        rpe: 10,
        reachedTarget: false,
      });
    });

    it('should handle no completed sets', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        completedSets: [],
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      expect(result.current.miniSetHistory).toHaveLength(0);
    });
  });

  describe('Continuation Logic', () => {
    it('should recommend continuing when target reps are met', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2, // First mini set
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      const shouldContinue = result.current.shouldContinueMiniSets(5); // Hit target
      expect(shouldContinue).toBe(true);
    });

    it('should recommend stopping when target reps are not met', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2,
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      const shouldContinue = result.current.shouldContinueMiniSets(3); // Below target
      expect(shouldContinue).toBe(false);
    });

    it('should recommend stopping when max mini sets reached', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 4, // At max mini sets
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      const shouldContinue = result.current.shouldContinueMiniSets(5); // Hit target but at limit
      expect(shouldContinue).toBe(false);
    });
  });

  describe('Target Helpers', () => {
    it('should provide activation set target', () => {
      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      const activationTarget = result.current.getActivationSetTarget();
      expect(activationTarget).toEqual({
        reps: 15,
        rpe: 9,
      });
    });

    it('should provide mini set target', () => {
      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      const miniSetTarget = result.current.getMiniSetTarget();
      expect(miniSetTarget).toEqual({
        reps: 5,
        rpe: 9,
      });
    });

    it('should handle missing configuration for targets', () => {
      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, undefined),
        { wrapper }
      );

      expect(result.current.getActivationSetTarget()).toBeNull();
      expect(result.current.getMiniSetTarget()).toBeNull();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage based on estimated phases', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2, // Completed activation, starting mini sets
        totalPhases: 4,
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      const progressPercentage = result.current.getProgressPercentage();
      // 1 completed phase out of estimated 4 total (1 activation + 3 mini sets)
      expect(progressPercentage).toBe(25);
    });

    it('should handle no configuration for progress', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 1,
        totalPhases: 0,
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, undefined),
        { wrapper }
      );

      const progressPercentage = result.current.getProgressPercentage();
      expect(progressPercentage).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle completed execution', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 4,
        isCompleted: true,
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      expect(result.current.isActivationSet).toBe(false);
      expect(result.current.isMiniSet).toBe(false);
      expect(result.current.remainingMiniSets).toBe(0);
    });

    it('should handle zero total mini sets', () => {
      const configWithZeroMini = new MyoRepsSetConfiguration({
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        miniSets: { min: 0, direction: 'asc' },
      });

      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, configWithZeroMini),
        { wrapper }
      );

      expect(result.current.totalMiniSets).toBe(0);
      expect(result.current.remainingMiniSets).toBe(0);
      expect(result.current.shouldContinueMiniSets(5)).toBe(false);
    });
  });

  describe('Integration with Base Hook', () => {
    it('should pass through all base hook properties', () => {
      const { result } = renderHook(
        () => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig),
        { wrapper }
      );

      // Should have all base properties
      expect(result.current.initialize).toBe(mockBaseExecution.initialize);
      expect(result.current.completeCurrentSet).toBe(mockBaseExecution.completeCurrentSet);
      expect(result.current.reset).toBe(mockBaseExecution.reset);
      expect(result.current.abort).toBe(mockBaseExecution.abort);
      expect(result.current.restTimer).toBe(mockBaseExecution.restTimer);
      expect(result.current.sessionId).toBe(mockBaseExecution.sessionId);

      // Should also have MyoReps-specific properties
      expect(result.current.myoRepsConfig).toBe(myoRepsConfig);
      expect(result.current.isActivationSet).toBeDefined();
      expect(result.current.isMiniSet).toBeDefined();
    });

    it('should call useAdvancedSetExecution with correct parameters', () => {
      renderHook(() => useMyoRepsExecution(profileId, workoutLogId, exerciseId, myoRepsConfig), {
        wrapper,
      });

      expect(useAdvancedSetExecution).toHaveBeenCalledWith(profileId, workoutLogId, exerciseId);
    });
  });
});
