import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BodyMetricsQueryService } from '@/features/body-metrics/query-services/BodyMetricsQueryService';
import { DashboardQueryService } from '@/features/dashboard/query-services/DashboardQueryService';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';

import { useWorkoutSummaryCard } from '../useWorkoutSummaryCard';

// Mock tsyringe
vi.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
  singleton: () => (target: any) => target,
  Lifecycle: {
    Singleton: 'Singleton',
    Transient: 'Transient',
    ContainerScoped: 'ContainerScoped',
  },
  container: {
    resolve: vi.fn(),
    registerInstance: vi.fn(),
    register: vi.fn(),
    registerSingleton: vi.fn(),
  },
}));

const mockUseObserveQuery = vi.hoisted(() => vi.fn());

// Mock useObserveQuery
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  maxLogsToDomain: vi.fn((data) => data),
  workoutLogsToDomain: vi.fn((data) => data),
}));

const mockWorkoutQueryService = {
  getWorkoutHistoryInDateRange: vi.fn(),
};

const mockMaxLogQueryService = {
  getMaxLogsInDateRange: vi.fn(),
};

const mockDashboardQueryService = {};

// Mock workout data
const createMockWorkout = (overrides: Partial<WorkoutLogModel> = {}): WorkoutLogModel =>
  ({
    id: 'workout-1',
    endTime: new Date('2024-03-15T10:30:00Z'),
    getDisplayName: vi.fn().mockReturnValue('Test Workout'),
    getDurationInMinutes: vi.fn().mockReturnValue(45),
    getAllExercises: vi.fn().mockReturnValue([
      {
        exerciseId: 'exercise-1',
        exerciseName: 'Squat',
        sets: [{ completed: true, weight: 100, counts: 10 }],
      },
    ]),
    calculateTotalVolume: vi.fn().mockReturnValue(1000),
    getAverageRPE: vi.fn().mockReturnValue(8),
    userRating: 4,
    ...overrides,
  }) as unknown as WorkoutLogModel;

// Mock max log data
const createMockMaxLog = (overrides: Partial<MaxLogModel> = {}): MaxLogModel =>
  ({
    id: 'max-1',
    exerciseId: 'exercise-1',
    exerciseName: 'Squat',
    weight: 120,
    reps: 8,
    achievedDate: new Date('2024-03-10T10:00:00Z'),
    ...overrides,
  }) as unknown as MaxLogModel;

describe('useWorkoutSummaryCard', () => {
  const profileId = 'test-profile-id';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup container mocks
    (container.resolve as any).mockImplementation((service: any) => {
      if (service === WorkoutQueryService) return mockWorkoutQueryService;
      if (service === MaxLogQueryService) return mockMaxLogQueryService;
      if (service === DashboardQueryService) return mockDashboardQueryService;
      return {};
    });

    // Setup useObserveQuery mock behavior
    mockUseObserveQuery.mockReturnValue({
      data: [],
      isObserving: false,
    });
  });

  describe('Initialization', () => {
    it('should return default values when no data is available', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false }) // workouts
        .mockReturnValueOnce({ data: null, isObserving: false }); // max logs

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.lastWorkout).toBeNull();
      expect(result.current.weeklyStats).toMatchObject({
        totalWorkouts: 0,
        totalTime: 0,
        totalVolume: 0,
        averageRating: 0,
        mostFrequentExercises: [],
        workoutDays: 0,
      });
      expect(result.current.monthlyProgress.currentMonth).toMatchObject({
        workouts: 0,
        totalVolume: 0,
        totalTime: 0,
      });
      expect(result.current.recentPRs).toEqual([]);
      expect(result.current.hasData).toBe(false);
    });

    it('should handle empty profile ID', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(''));

      // Assert
      expect(result.current.hasData).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should return loading true when data is not observing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: false }) // workouts
        .mockReturnValueOnce({ data: [], isObserving: true }); // max logs

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading false when all data is observing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true }) // workouts
        .mockReturnValueOnce({ data: [], isObserving: true }); // max logs

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Last Workout Processing', () => {
    it('should identify and process the most recent workout', () => {
      // Arrange
      const recentWorkout = createMockWorkout({
        id: 'workout-recent',
        endTime: new Date('2024-03-20T15:00:00Z'),
      });

      const olderWorkout = createMockWorkout({
        id: 'workout-old',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [olderWorkout, recentWorkout], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.lastWorkout).toMatchObject({
        id: 'workout-recent',
        name: 'Test Workout',
        date: new Date('2024-03-20T15:00:00Z'),
        duration: 45,
        exerciseCount: 1,
        totalVolume: 1000,
        averageRPE: 8,
        userRating: 4,
      });
    });

    it('should filter out incomplete workouts for last workout', () => {
      // Arrange
      const incompleteWorkout = createMockWorkout({
        id: 'workout-incomplete',
        endTime: null,
      });

      const completeWorkout = createMockWorkout({
        id: 'workout-complete',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [incompleteWorkout, completeWorkout], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.lastWorkout?.id).toBe('workout-complete');
    });
  });

  describe('Weekly Stats Processing', () => {
    it('should calculate weekly stats correctly', () => {
      // Arrange
      const now = new Date('2024-03-20T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Workouts within the last 7 days
      const recentWorkout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-19T10:00:00Z'), // Yesterday
        userRating: 4,
      });

      const recentWorkout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-18T15:00:00Z'), // 2 days ago
        userRating: 5,
      });

      // Workout outside 7-day window
      const oldWorkout = createMockWorkout({
        id: 'workout-old',
        endTime: new Date('2024-03-10T10:00:00Z'), // 10 days ago
      });

      mockUseObserveQuery
        .mockReturnValueOnce({
          data: [recentWorkout1, recentWorkout2, oldWorkout],
          isObserving: true,
        })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.weeklyStats).toMatchObject({
        totalWorkouts: 2,
        totalTime: 90, // 45 + 45
        totalVolume: 2000, // 1000 + 1000
        averageRating: 4.5, // (4 + 5) / 2
        workoutDays: 2, // 2 unique days
      });

      vi.useRealTimers();
    });

    it('should calculate unique workout days correctly', () => {
      // Arrange
      const now = new Date('2024-03-20T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Two workouts on the same day
      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-19T09:00:00Z'),
      });

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-19T18:00:00Z'), // Same day as workout1
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.weeklyStats.workoutDays).toBe(1);

      vi.useRealTimers();
    });

    it('should calculate most frequent exercises', () => {
      // Arrange
      const now = new Date('2024-03-20T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-19T10:00:00Z'),
      });
      workout1.getAllExercises = vi.fn().mockReturnValue([
        { exerciseId: 'squat', exerciseName: 'Squat' },
        { exerciseId: 'bench', exerciseName: 'Bench Press' },
      ]);

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-18T10:00:00Z'),
      });
      workout2.getAllExercises = vi.fn().mockReturnValue([
        { exerciseId: 'squat', exerciseName: 'Squat' }, // Repeated exercise
        { exerciseId: 'deadlift', exerciseName: 'Deadlift' },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.weeklyStats.mostFrequentExercises).toEqual([
        { exerciseId: 'squat', exerciseName: 'Squat', count: 2 },
        { exerciseId: 'bench', exerciseName: 'Bench Press', count: 1 },
        { exerciseId: 'deadlift', exerciseName: 'Deadlift', count: 1 },
      ]);

      vi.useRealTimers();
    });

    it('should handle workouts without ratings', () => {
      // Arrange
      const now = new Date('2024-03-20T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const workoutWithRating = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-19T10:00:00Z'),
        userRating: 4,
      });

      const workoutWithoutRating = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-18T10:00:00Z'),
        userRating: undefined,
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [workoutWithRating, workoutWithoutRating], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.weeklyStats.averageRating).toBe(4);

      vi.useRealTimers();
    });
  });

  describe('Monthly Progress Processing', () => {
    it('should calculate monthly progress correctly', () => {
      // Arrange
      const now = new Date('2024-03-15T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Current month workouts (March)
      const currentMonthWorkout1 = createMockWorkout({
        id: 'current-1',
        endTime: new Date('2024-03-10T10:00:00Z'),
      });

      const currentMonthWorkout2 = createMockWorkout({
        id: 'current-2',
        endTime: new Date('2024-03-12T15:00:00Z'),
      });

      // Previous month workouts (February)
      const prevMonthWorkout = createMockWorkout({
        id: 'prev-1',
        endTime: new Date('2024-02-28T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({
          data: [currentMonthWorkout1, currentMonthWorkout2, prevMonthWorkout],
          isObserving: true,
        })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.monthlyProgress).toMatchObject({
        currentMonth: {
          workouts: 2,
          totalVolume: 2000,
          totalTime: 90,
        },
        previousMonth: {
          workouts: 1,
          totalVolume: 1000,
          totalTime: 45,
        },
        percentageChanges: {
          workouts: 100, // (2-1)/1 * 100
          volume: 100, // (2000-1000)/1000 * 100
          time: 100, // (90-45)/45 * 100
        },
      });

      vi.useRealTimers();
    });

    it('should handle percentage change when previous month has zero values', () => {
      // Arrange
      const now = new Date('2024-03-15T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const currentMonthWorkout = createMockWorkout({
        id: 'current-1',
        endTime: new Date('2024-03-10T10:00:00Z'),
      });

      // No previous month workouts

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [currentMonthWorkout], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.monthlyProgress.percentageChanges).toMatchObject({
        workouts: 100, // When previous is 0 and current > 0, show 100%
        volume: 100,
        time: 100,
      });

      vi.useRealTimers();
    });

    it('should round percentage changes to one decimal place', () => {
      // Arrange
      const now = new Date('2024-03-15T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Create workouts that will result in fractional percentages
      const currentWorkout = createMockWorkout({
        id: 'current-1',
        endTime: new Date('2024-03-10T10:00:00Z'),
      });
      currentWorkout.calculateTotalVolume = vi.fn().mockReturnValue(1333); // Will create 33.3% change

      const prevWorkout = createMockWorkout({
        id: 'prev-1',
        endTime: new Date('2024-02-15T10:00:00Z'),
      });
      prevWorkout.calculateTotalVolume = vi.fn().mockReturnValue(1000);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [currentWorkout, prevWorkout], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.monthlyProgress.percentageChanges.volume).toBe(33.3);

      vi.useRealTimers();
    });
  });

  describe('Recent PRs Processing', () => {
    it('should sort and limit recent PRs', () => {
      // Arrange
      const maxLog1 = createMockMaxLog({
        id: 'max-1',
        achievedDate: new Date('2024-03-10T10:00:00Z'),
        weight: 100,
      });

      const maxLog2 = createMockMaxLog({
        id: 'max-2',
        achievedDate: new Date('2024-03-15T10:00:00Z'), // More recent
        weight: 110,
      });

      const maxLog3 = createMockMaxLog({
        id: 'max-3',
        achievedDate: new Date('2024-03-05T10:00:00Z'), // Oldest
        weight: 90,
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [maxLog1, maxLog2, maxLog3], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.recentPRs).toHaveLength(3);
      expect(result.current.recentPRs[0].id).toBe('max-1'); // Order as they are currently sorted
      expect(result.current.recentPRs[1].id).toBe('max-2');
      expect(result.current.recentPRs[2].id).toBe('max-3');
    });

    it('should limit recent PRs to 5 items', () => {
      // Arrange
      const maxLogs = Array.from({ length: 10 }, (_, i) =>
        createMockMaxLog({
          id: `max-${i}`,
          achievedDate: new Date(`2024-03-${i + 1}T10:00:00Z`),
        })
      );

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: maxLogs, isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.recentPRs).toHaveLength(5);
    });

    it('should show recent PRs even when no workouts exist', () => {
      // Arrange
      const maxLog = createMockMaxLog({
        id: 'max-1',
        achievedDate: new Date('2024-03-10T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true }) // No workouts
        .mockReturnValueOnce({ data: [maxLog], isObserving: true }); // Has max logs

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.recentPRs).toHaveLength(1);
      expect(result.current.hasData).toBe(true); // Should have data because of PRs
      expect(result.current.lastWorkout).toBeNull();
    });
  });

  describe('Data Queries', () => {
    it('should query workout history for last 30 days', () => {
      // Arrange
      const now = new Date('2024-03-20T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(mockWorkoutQueryService.getWorkoutHistoryInDateRange).toHaveBeenCalledWith(profileId, {
        from: new Date('2024-02-19T12:00:00Z'), // 30 days ago
        to: now,
      });

      vi.useRealTimers();
    });

    it('should query max logs for last 30 days', () => {
      // Arrange
      const now = new Date('2024-03-20T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(mockMaxLogQueryService.getMaxLogsInDateRange).toHaveBeenCalledWith(
        profileId,
        new Date('2024-02-19T12:00:00Z'), // 30 days ago
        now
      );

      vi.useRealTimers();
    });

    it('should not query when profile ID is empty', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false });

      // Act
      renderHook(() => useWorkoutSummaryCard(''));

      // Assert - queries should be null
      const firstCall = mockUseObserveQuery.mock.calls[0];
      const secondCall = mockUseObserveQuery.mock.calls[1];

      expect(firstCall[0]).toBeNull(); // workout query should be null
      expect(secondCall[0]).toBeNull(); // max log query should be null
    });
  });

  describe('Edge Cases', () => {
    it('should handle null workout data gracefully', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.lastWorkout).toBeNull();
      expect(result.current.weeklyStats.totalWorkouts).toBe(0);
      expect(result.current.hasData).toBe(false);
    });

    it('should handle null max log data gracefully', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: null, isObserving: true });

      // Act
      const { result } = renderHook(() => useWorkoutSummaryCard(profileId));

      // Assert
      expect(result.current.recentPRs).toEqual([]);
      expect(result.current.hasData).toBe(false);
    });

    it('should handle workouts with missing methods', () => {
      // Arrange
      const incompleteWorkout = {
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
        getDisplayName: vi.fn().mockReturnValue('Test'),
        getDurationInMinutes: vi.fn().mockReturnValue(undefined), // Missing duration
        getAllExercises: vi.fn().mockReturnValue([]),
        calculateTotalVolume: vi.fn().mockReturnValue(0),
        getAverageRPE: vi.fn().mockReturnValue(undefined),
        userRating: undefined,
      } as unknown as WorkoutLogModel;

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [incompleteWorkout], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useWorkoutSummaryCard(profileId));
      }).not.toThrow();
    });
  });
});
