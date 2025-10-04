import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';

import type { AdvancedSetExecutionState } from '../../services/AdvancedSetExecutionService';
import { useAdvancedSetExecutionStore } from '../../store/advancedSetExecutionStore';
import { useDropSetExecution } from '../useDropSetExecution';

// Mock the base hook
vi.mock('../useAdvancedSetExecution', () => ({
  useAdvancedSetExecution: vi.fn(),
}));

import { useAdvancedSetExecution } from '../useAdvancedSetExecution';

describe('useDropSetExecution', () => {
  let queryClient: QueryClient;

  const profileId = 'profile-1';
  const workoutLogId = 'workout-1';
  const exerciseId = 'exercise-1';

  const dropConfig = new DropSetConfiguration({
    type: 'drop',
    sets: { min: 1, direction: 'asc' },
    startCounts: { min: 10, direction: 'asc' },
    drops: { min: 2, direction: 'asc' },
    rpe: { min: 8, direction: 'asc' },
  });

  const mockBaseExecution = {
    executionState: null,
    isInitialized: false,
    isExecuting: false,
    isCompleted: false,
    currentPhase: 1,
    totalPhases: 3,
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

  describe('Drop Set Specific Properties', () => {
    it('should return drop set configuration', () => {
      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.dropSetConfig).toBe(dropConfig);
    });

    it('should identify main set phase correctly', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 1,
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.isMainSet).toBe(true);
      expect(result.current.isDropPhase).toBe(false);
      expect(result.current.dropNumber).toBe(0);
    });

    it('should identify drop phases correctly', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2,
        isCompleted: false,
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.isMainSet).toBe(false);
      expect(result.current.isDropPhase).toBe(true);
      expect(result.current.dropNumber).toBe(1);
    });

    it('should calculate total drops correctly', () => {
      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.totalDrops).toBe(2);
    });
  });

  describe('Weight Calculations', () => {
    it('should extract current and next weights', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
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
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.currentWeight).toBe(100);
      expect(result.current.nextWeight).toBe(80);
    });

    it('should calculate drop percentage for current drop', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2, // First drop
        isCompleted: false,
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.dropPercentage).toBe(20); // First drop is 20%
    });

    it('should calculate drop percentage for second drop', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 3, // Second drop
        isCompleted: false,
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.dropPercentage).toBe(40); // Second drop is 40%
    });

    it('should return null drop percentage for main set', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 1, // Main set
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.dropPercentage).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    it('should calculate all drop weights from base weight', () => {
      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      const dropWeights = result.current.getDropWeights(100);

      expect(dropWeights).toEqual([
        100, // Main set (100%)
        80, // First drop (100 * 0.8 = 80)
        48, // Second drop (80 * 0.6 = 48, rounded)
      ]);
    });

    it('should calculate remaining drops', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2, // First drop
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      const remainingDrops = result.current.getRemainingDrops();

      expect(remainingDrops).toBe(1); // One drop remaining
    });

    it('should calculate remaining drops from main set', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 1, // Main set
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      const remainingDrops = result.current.getRemainingDrops();

      expect(remainingDrops).toBe(2); // Two drops remaining (plus main set)
    });

    it('should calculate progress percentage', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 2,
        totalPhases: 3,
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      const progressPercentage = result.current.getProgressPercentage();

      expect(progressPercentage).toBe(67); // 2/3 = 66.67% rounded to 67%
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing configuration', () => {
      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, undefined),
        { wrapper }
      );

      expect(result.current.dropSetConfig).toBeNull();
      expect(result.current.totalDrops).toBe(0);
      expect(result.current.dropPercentage).toBeNull();
      expect(result.current.getDropWeights(100)).toEqual([]);
    });

    it('should handle completed execution', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 3,
        isCompleted: true,
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.isMainSet).toBe(false);
      expect(result.current.isDropPhase).toBe(false); // Completed, so not in drop phase
      expect(result.current.dropNumber).toBe(2);
    });

    it('should handle invalid drop indices', () => {
      vi.mocked(useAdvancedSetExecution).mockReturnValue({
        ...mockBaseExecution,
        currentPhase: 10, // Beyond available drops
        isCompleted: false,
      });

      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      expect(result.current.dropPercentage).toBeNull();
    });

    it('should handle zero base weight', () => {
      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      const dropWeights = result.current.getDropWeights(0);

      expect(dropWeights).toEqual([0, 0, 0]); // All weights should be 0
    });
  });

  describe('Integration with Base Hook', () => {
    it('should pass through all base hook properties', () => {
      const { result } = renderHook(
        () => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig),
        { wrapper }
      );

      // Should have all base properties
      expect(result.current.initialize).toBe(mockBaseExecution.initialize);
      expect(result.current.completeCurrentSet).toBe(mockBaseExecution.completeCurrentSet);
      expect(result.current.reset).toBe(mockBaseExecution.reset);
      expect(result.current.abort).toBe(mockBaseExecution.abort);
      expect(result.current.restTimer).toBe(mockBaseExecution.restTimer);
      expect(result.current.sessionId).toBe(mockBaseExecution.sessionId);

      // Should also have drop-specific properties
      expect(result.current.dropSetConfig).toBe(dropConfig);
      expect(result.current.isMainSet).toBeDefined();
      expect(result.current.isDropPhase).toBeDefined();
    });

    it('should call useAdvancedSetExecution with correct parameters', () => {
      renderHook(() => useDropSetExecution(profileId, workoutLogId, exerciseId, dropConfig), {
        wrapper,
      });

      expect(useAdvancedSetExecution).toHaveBeenCalledWith(profileId, workoutLogId, exerciseId);
    });
  });
});
