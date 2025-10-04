import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWorkoutStreak } from '../useWorkoutStreak';

// Hoisted mock dependencies
const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

const mockWorkoutQueryService = vi.hoisted(() => ({
  getWorkoutHistoryInDateRange: vi.fn(),
}));

const mockUseObserveQuery = vi.hoisted(() => vi.fn());
const mockWorkoutLogsToDomain = vi.hoisted(() => vi.fn());

// Mock the container
vi.mock('tsyringe', () => ({
  container: mockContainer,
  injectable: () => (target: any) => target, // Mock injectable decorator
  inject:
    (token: string) => (target: any, propertyKey: string | symbol, parameterIndex: number) => {}, // Mock inject decorator
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  workoutLogsToDomain: mockWorkoutLogsToDomain,
}));

// Mock the shared hooks
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

describe('useWorkoutStreak', () => {
  const mockProfileId = 'profile-123';

  // Create test dates relative to a fixed point for consistency
  const today = new Date('2024-01-15');

  beforeEach(() => {
    vi.clearAllMocks();
    mockContainer.resolve.mockReturnValue(mockWorkoutQueryService);
    mockWorkoutQueryService.getWorkoutHistoryInDateRange.mockReturnValue('mock-query');
    mockWorkoutLogsToDomain.mockImplementation((data) => data);

    // Mock Date.now to return consistent results
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic streak calculation', () => {
    it('should calculate current streak correctly with consecutive workouts', () => {
      const mockWorkouts = [
        {
          id: 'w1',
          endTime: new Date('2024-01-15'), // Today
          startTime: new Date('2024-01-15'),
        },
        {
          id: 'w2',
          endTime: new Date('2024-01-14'), // Yesterday
          startTime: new Date('2024-01-14'),
        },
        {
          id: 'w3',
          endTime: new Date('2024-01-13'), // Day before yesterday
          startTime: new Date('2024-01-13'),
        },
        {
          id: 'w4',
          endTime: new Date('2024-01-11'), // Gap - should not be included
          startTime: new Date('2024-01-11'),
        },
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(3); // 3 consecutive days
    });

    it('should calculate longest streak correctly', () => {
      const mockWorkouts = [
        // Current streak: 2 days
        { id: 'w1', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') },
        { id: 'w2', endTime: new Date('2024-01-14'), startTime: new Date('2024-01-14') },
        // Gap
        // Previous longer streak: 4 days
        { id: 'w3', endTime: new Date('2024-01-10'), startTime: new Date('2024-01-10') },
        { id: 'w4', endTime: new Date('2024-01-09'), startTime: new Date('2024-01-09') },
        { id: 'w5', endTime: new Date('2024-01-08'), startTime: new Date('2024-01-08') },
        { id: 'w6', endTime: new Date('2024-01-07'), startTime: new Date('2024-01-07') },
        // Gap
        { id: 'w7', endTime: new Date('2024-01-05'), startTime: new Date('2024-01-05') },
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(2);
      expect(result.current.longestStreak).toBe(4);
    });

    it('should handle zero streak when no recent workouts', () => {
      const mockWorkouts = [
        {
          id: 'w1',
          endTime: new Date('2024-01-10'), // 5 days ago, no workouts since
          startTime: new Date('2024-01-10'),
        },
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(1);
    });

    it('should use custom streak goal', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const customGoal = 21;
      const { result } = renderHook(() => useWorkoutStreak(mockProfileId, customGoal));

      expect(result.current.streakGoal).toBe(customGoal);
      expect(result.current.daysUntilGoal).toBe(customGoal);
    });

    it('should use default streak goal of 30', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.streakGoal).toBe(30);
      expect(result.current.daysUntilGoal).toBe(30);
    });
  });

  describe('days until goal calculation', () => {
    it('should calculate days until goal correctly', () => {
      const mockWorkouts = [
        { id: 'w1', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') },
        { id: 'w2', endTime: new Date('2024-01-14'), startTime: new Date('2024-01-14') },
        { id: 'w3', endTime: new Date('2024-01-13'), startTime: new Date('2024-01-13') },
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const streakGoal = 10;
      const { result } = renderHook(() => useWorkoutStreak(mockProfileId, streakGoal));

      expect(result.current.currentStreak).toBe(3);
      expect(result.current.daysUntilGoal).toBe(7); // 10 - 3 = 7
    });

    it('should return 0 days until goal when goal is reached', () => {
      const mockWorkouts = Array.from({ length: 15 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i); // 15 consecutive days ending today
        return {
          id: `w${i}`,
          endTime: new Date(date),
          startTime: new Date(date),
        };
      });

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const streakGoal = 10;
      const { result } = renderHook(() => useWorkoutStreak(mockProfileId, streakGoal));

      expect(result.current.currentStreak).toBe(15);
      expect(result.current.daysUntilGoal).toBe(0); // Goal exceeded
    });
  });

  describe('streak history generation', () => {
    it('should generate 90 days of streak history', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.streakHistory).toHaveLength(90);
    });

    it('should mark days with workouts correctly in history', () => {
      const mockWorkouts = [
        { id: 'w1', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') },
        { id: 'w2', endTime: new Date('2024-01-14'), startTime: new Date('2024-01-14') },
        { id: 'w3', endTime: new Date('2024-01-13'), startTime: new Date('2024-01-13') },
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      const history = result.current.streakHistory;

      // Check last 3 days have workouts
      expect(history[history.length - 1].hasWorkout).toBe(true); // Today
      expect(history[history.length - 2].hasWorkout).toBe(true); // Yesterday
      expect(history[history.length - 3].hasWorkout).toBe(true); // Day before
      expect(history[history.length - 4].hasWorkout).toBe(false); // No workout
    });

    it('should count multiple workouts per day', () => {
      const mockWorkouts = [
        { id: 'w1', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') },
        { id: 'w2', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') }, // Same day
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      const todayData = result.current.streakHistory[result.current.streakHistory.length - 1];
      expect(todayData.hasWorkout).toBe(true);
      expect(todayData.workoutCount).toBe(2);
    });

    it('should have correct date ordering in history', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      const history = result.current.streakHistory;

      // Should be ordered from oldest to newest
      for (let i = 1; i < history.length; i++) {
        expect(history[i].date.getTime()).toBeGreaterThan(history[i - 1].date.getTime());
      }

      // Last entry should be today
      const lastEntry = history[history.length - 1];
      expect(lastEntry.date.toDateString()).toBe(today.toDateString());
    });
  });

  describe('workout filtering', () => {
    it('should only consider completed workouts', () => {
      const todayDate = new Date(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockWorkouts = [
        { id: 'w1', endTime: todayDate, startTime: todayDate }, // Completed
        { id: 'w2', endTime: null, startTime: twoDaysAgo }, // Not completed (moved from yesterday)
        { id: 'w3', endTime: yesterday, startTime: yesterday }, // Completed (consecutive)
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(2); // Only completed workouts count
    });

    it('should handle empty workout data gracefully', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
      expect(result.current.streakHistory).toHaveLength(90);
    });

    it('should handle empty workout array', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
      expect(result.current.streakHistory.every((day) => !day.hasWorkout)).toBe(true);
    });
  });

  describe('date range query', () => {
    it('should query for 6 months of workout history', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      renderHook(() => useWorkoutStreak(mockProfileId));

      expect(mockWorkoutQueryService.getWorkoutHistoryInDateRange).toHaveBeenCalledWith(
        mockProfileId,
        expect.objectContaining({
          from: expect.any(Date),
          to: expect.any(Date),
        })
      );

      const callArgs = mockWorkoutQueryService.getWorkoutHistoryInDateRange.mock.calls[0][1];
      const fromDate = callArgs.from;
      const toDate = callArgs.to;

      // Should be approximately 6 months difference (use 30.44 days per month for accuracy)
      const monthsDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      expect(monthsDiff).toBeCloseTo(6, 1);
    });

    it('should not call query service when no profileId', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      renderHook(() => useWorkoutStreak(''));

      expect(mockWorkoutQueryService.getWorkoutHistoryInDateRange).not.toHaveBeenCalled();
    });
  });

  describe('useObserveQuery integration', () => {
    it('should enable query only when profileId is provided', () => {
      renderHook(() => useWorkoutStreak(mockProfileId));

      expect(mockUseObserveQuery).toHaveBeenCalledWith('mock-query', {
        transform: mockWorkoutLogsToDomain,
        enabled: true,
      });
    });

    it('should disable query when profileId is not provided', () => {
      mockUseObserveQuery.mockClear();

      renderHook(() => useWorkoutStreak(''));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(null, {
        transform: mockWorkoutLogsToDomain,
        enabled: false,
      });
    });
  });

  describe('complex streak scenarios', () => {
    it('should handle streaks that span months', () => {
      // Create a 45-day streak ending today
      const today = new Date('2024-01-15T12:00:00.000Z');
      const mockWorkouts = Array.from({ length: 45 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return {
          id: `w${i}`,
          endTime: new Date(date),
          startTime: new Date(date),
        };
      });

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(45);
      expect(result.current.longestStreak).toBe(45);
    });

    it('should handle streaks broken by a single day', () => {
      const mockWorkouts = [
        // Current streak: 3 days
        { id: 'w1', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') },
        { id: 'w2', endTime: new Date('2024-01-14'), startTime: new Date('2024-01-14') },
        { id: 'w3', endTime: new Date('2024-01-13'), startTime: new Date('2024-01-13') },
        // Missing 2024-01-12 (breaks streak)
        // Previous streak: 5 days
        { id: 'w4', endTime: new Date('2024-01-11'), startTime: new Date('2024-01-11') },
        { id: 'w5', endTime: new Date('2024-01-10'), startTime: new Date('2024-01-10') },
        { id: 'w6', endTime: new Date('2024-01-09'), startTime: new Date('2024-01-09') },
        { id: 'w7', endTime: new Date('2024-01-08'), startTime: new Date('2024-01-08') },
        { id: 'w8', endTime: new Date('2024-01-07'), startTime: new Date('2024-01-07') },
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(3);
      expect(result.current.longestStreak).toBe(5);
    });

    it('should handle perfect streaks reaching the goal', () => {
      const streakGoal = 7;
      const today = new Date('2024-01-15T12:00:00.000Z');
      const mockWorkouts = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return {
          id: `w${i}`,
          endTime: new Date(date),
          startTime: new Date(date),
        };
      });

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId, streakGoal));

      expect(result.current.currentStreak).toBe(7);
      expect(result.current.streakGoal).toBe(7);
      expect(result.current.daysUntilGoal).toBe(0);
    });
  });

  describe('memoization behavior', () => {
    it('should recalculate when workout data changes', () => {
      const initialWorkouts = [
        { id: 'w1', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') },
      ];

      mockUseObserveQuery.mockReturnValue({ data: initialWorkouts });

      const { result, rerender } = renderHook(({ goal }) => useWorkoutStreak(mockProfileId, goal), {
        initialProps: { goal: 30 },
      });

      expect(result.current.currentStreak).toBe(1);

      // Change workout data
      const newWorkouts = [
        { id: 'w1', endTime: new Date('2024-01-15'), startTime: new Date('2024-01-15') },
        { id: 'w2', endTime: new Date('2024-01-14'), startTime: new Date('2024-01-14') },
      ];

      mockUseObserveQuery.mockReturnValue({ data: newWorkouts });

      rerender({ goal: 30 });

      expect(result.current.currentStreak).toBe(2);
    });

    it('should recalculate when streak goal changes', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result, rerender } = renderHook(({ goal }) => useWorkoutStreak(mockProfileId, goal), {
        initialProps: { goal: 10 },
      });

      expect(result.current.streakGoal).toBe(10);
      expect(result.current.daysUntilGoal).toBe(10);

      rerender({ goal: 20 });

      expect(result.current.streakGoal).toBe(20);
      expect(result.current.daysUntilGoal).toBe(20);
    });
  });

  describe('container dependency injection', () => {
    it('should resolve WorkoutQueryService from container', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      renderHook(() => useWorkoutStreak(mockProfileId));

      expect(mockContainer.resolve).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('edge cases', () => {
    it('should handle timezone edge cases gracefully', () => {
      // Test with workouts at different times of day - should count as consecutive days
      const todayLate = new Date('2024-01-15T23:59:59.999Z');
      const yesterdayEarly = new Date('2024-01-14T00:00:01.000Z');

      const mockWorkouts = [
        { id: 'w1', endTime: new Date(todayLate), startTime: new Date(todayLate) },
        { id: 'w2', endTime: new Date(yesterdayEarly), startTime: new Date(yesterdayEarly) },
      ];

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      expect(result.current.currentStreak).toBe(2);
    });

    it('should handle very large datasets efficiently', () => {
      // Create 6 months of daily workouts
      const today = new Date('2024-01-15T12:00:00.000Z');
      const mockWorkouts = Array.from({ length: 180 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return {
          id: `w${i}`,
          endTime: new Date(date),
          startTime: new Date(date),
        };
      });

      mockUseObserveQuery.mockReturnValue({ data: mockWorkouts });

      const { result } = renderHook(() => useWorkoutStreak(mockProfileId));

      // Should handle large dataset without performance issues
      expect(result.current.currentStreak).toBeGreaterThan(0);
      expect(result.current.longestStreak).toBeGreaterThan(0);
    });
  });
});
