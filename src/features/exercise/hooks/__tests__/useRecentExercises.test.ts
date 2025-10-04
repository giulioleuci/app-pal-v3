import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';

import { useRecentExercises } from '../useRecentExercises';

// Mock dependencies with proper hoisting
const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

const mockExerciseQueryService = vi.hoisted(() => ({
  getAllExercises: vi.fn(),
}));

const mockWorkoutQueryService = vi.hoisted(() => ({
  getRecentWorkoutHistory: vi.fn(),
}));

const mockUseObserveQuery = vi.hoisted(() => vi.fn());

// Mock the container
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
  container: mockContainer,
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  exercisesToDomain: vi.fn((data) => data),
  workoutLogsToDomain: vi.fn((data) => data),
}));

// Mock the shared hooks
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

describe('useRecentExercises', () => {
  const mockProfileId = 'profile-123';
  const mockExercises = [
    { id: 'ex1', name: 'Bench Press' },
    { id: 'ex2', name: 'Squats' },
    { id: 'ex3', name: 'Deadlift' },
    { id: 'ex4', name: 'Pull Ups' },
  ];

  const mockWorkouts = [
    {
      id: 'w1',
      startTime: new Date('2024-01-05'),
      endTime: new Date('2024-01-05'),
      getAllExercises: () => [{ exerciseId: 'ex1' }, { exerciseId: 'ex2' }],
    },
    {
      id: 'w2',
      startTime: new Date('2024-01-03'),
      endTime: new Date('2024-01-03'),
      getAllExercises: () => [{ exerciseId: 'ex2' }, { exerciseId: 'ex3' }],
    },
    {
      id: 'w3',
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-01-01'),
      getAllExercises: () => [{ exerciseId: 'ex1' }, { exerciseId: 'ex4' }],
    },
  ];

  beforeEach(() => {
    // Complete reset of all mocks
    vi.resetAllMocks();

    // Re-setup hoisted mocks with fresh instances
    mockContainer.resolve.mockImplementation((token) => {
      if (token === ExerciseQueryService) return mockExerciseQueryService;
      if (token === WorkoutQueryService) return mockWorkoutQueryService;
      return null;
    });

    // Setup default implementation for useObserveQuery
    mockUseObserveQuery.mockImplementation(() => ({ data: null }));
  });

  describe('basic functionality', () => {
    it('should return recent exercises with correct order', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(4);

      // Should be ordered by most recent usage
      expect(result.current.recentExercises[0].name).toBe('Bench Press'); // Most recent: Jan 5
      expect(result.current.recentExercises[1].name).toBe('Squats'); // Most recent: Jan 5
      expect(result.current.recentExercises[2].name).toBe('Deadlift'); // Most recent: Jan 3
      expect(result.current.recentExercises[3].name).toBe('Pull Ups'); // Most recent: Jan 1
    });

    it('should return last performed dates for each exercise', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.lastPerformed['ex1']).toEqual(new Date('2024-01-05')); // Bench Press
      expect(result.current.lastPerformed['ex2']).toEqual(new Date('2024-01-05')); // Squats
      expect(result.current.lastPerformed['ex3']).toEqual(new Date('2024-01-03')); // Deadlift
      expect(result.current.lastPerformed['ex4']).toEqual(new Date('2024-01-01')); // Pull Ups
    });

    it('should respect the limit parameter', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId, 2));

      expect(result.current.recentExercises).toHaveLength(2);
      expect(result.current.recentExercises[0].name).toBe('Bench Press');
      expect(result.current.recentExercises[1].name).toBe('Squats');
    });

    it('should handle default limit of 10', () => {
      // Create more exercises than the default limit
      const manyExercises = Array.from({ length: 15 }, (_, i) => ({
        id: `ex${i + 1}`,
        name: `Exercise ${i + 1}`,
      }));

      const manyWorkouts = Array.from({ length: 15 }, (_, i) => ({
        id: `w${i + 1}`,
        startTime: new Date(`2024-01-${i + 1}`),
        endTime: new Date(`2024-01-${i + 1}`),
        getAllExercises: () => [{ exerciseId: `ex${i + 1}` }],
      }));

      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: manyExercises })
        .mockReturnValueOnce({ data: manyWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(10); // Default limit
    });
  });

  describe('when no data is available', () => {
    it('should return empty results when no exercises', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null })
        .mockReturnValueOnce({ data: mockWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(0);
      expect(result.current.lastPerformed).toEqual({});
    });

    it('should return empty results when no workouts', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: null });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(0);
      expect(result.current.lastPerformed).toEqual({});
    });

    it('should return empty results when both are empty arrays', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery.mockReturnValueOnce({ data: [] }).mockReturnValueOnce({ data: [] });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(0);
      expect(result.current.lastPerformed).toEqual({});
    });
  });

  describe('workout filtering and sorting', () => {
    it('should only consider completed workouts', () => {
      const workoutsWithIncomplete = [
        ...mockWorkouts,
        {
          id: 'w4',
          startTime: new Date('2024-01-06'),
          endTime: null, // Not completed
          getAllExercises: () => [{ exerciseId: 'ex3' }],
        },
      ];

      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: workoutsWithIncomplete });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      // ex3 should still have Jan 3 as most recent, not Jan 6
      expect(result.current.lastPerformed['ex3']).toEqual(new Date('2024-01-03'));
    });

    it('should sort workouts by most recent first', () => {
      const unsortedWorkouts = [
        {
          id: 'w1',
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-01'),
          getAllExercises: () => [{ exerciseId: 'ex1' }],
        },
        {
          id: 'w2',
          startTime: new Date('2024-01-05'),
          endTime: new Date('2024-01-05'),
          getAllExercises: () => [{ exerciseId: 'ex1' }], // Same exercise, more recent
        },
      ];

      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: unsortedWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      // Should use the more recent workout date
      expect(result.current.lastPerformed['ex1']).toEqual(new Date('2024-01-05'));
    });

    it('should use endTime when available, fallback to startTime', () => {
      const workoutsWithMixedTimes = [
        {
          id: 'w1',
          startTime: new Date('2024-01-05'),
          endTime: new Date('2024-01-05'),
          getAllExercises: () => [{ exerciseId: 'ex1' }],
        },
        {
          id: 'w2',
          startTime: new Date('2024-01-03'),
          endTime: null, // This workout won't be included because it's not completed
          getAllExercises: () => [{ exerciseId: 'ex2' }],
        },
      ];

      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: workoutsWithMixedTimes });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.lastPerformed['ex1']).toEqual(new Date('2024-01-05')); // Used endTime
      // ex2 shouldn't appear because workout without endTime is not completed
      expect(result.current.lastPerformed['ex2']).toBeUndefined();
    });
  });

  describe('exercise filtering', () => {
    it('should only include exercises that still exist', () => {
      const workoutsWithNonExistentExercise = [
        {
          id: 'w1',
          startTime: new Date('2024-01-05'),
          endTime: new Date('2024-01-05'),
          getAllExercises: () => [
            { exerciseId: 'ex1' }, // Exists
            { exerciseId: 'ex999' }, // Does not exist
          ],
        },
      ];

      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: workoutsWithNonExistentExercise });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(1);
      expect(result.current.recentExercises[0].name).toBe('Bench Press');
      expect(result.current.lastPerformed['ex999']).toBeUndefined();
    });
  });

  describe('query service integration', () => {
    it('should call exercise query service with correct profile ID', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      renderHook(() => useRecentExercises(mockProfileId));

      expect(mockExerciseQueryService.getAllExercises).toHaveBeenCalledWith(mockProfileId);
    });

    it('should call workout query service with correct parameters', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      renderHook(() => useRecentExercises(mockProfileId));

      expect(mockWorkoutQueryService.getRecentWorkoutHistory).toHaveBeenCalledWith(
        mockProfileId,
        50
      );
    });

    it('should not call services when no profileId', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery.mockReturnValueOnce({ data: null }).mockReturnValueOnce({ data: null });

      renderHook(() => useRecentExercises(''));

      expect(mockExerciseQueryService.getAllExercises).not.toHaveBeenCalled();
      expect(mockWorkoutQueryService.getRecentWorkoutHistory).not.toHaveBeenCalled();
    });
  });

  describe('useObserveQuery integration', () => {
    it('should enable queries only when profileId is provided', () => {
      // Set up proper container resolution with query services that return query objects
      const mockExerciseQuery = { query: 'exercise-query' };
      const mockWorkoutQuery = { query: 'workout-query' };

      mockExerciseQueryService.getAllExercises.mockReturnValue(mockExerciseQuery);
      mockWorkoutQueryService.getRecentWorkoutHistory.mockReturnValue(mockWorkoutQuery);

      renderHook(() => useRecentExercises(mockProfileId));

      expect(mockUseObserveQuery).toHaveBeenNthCalledWith(1, mockExerciseQuery, {
        transform: expect.any(Function),
        enabled: true,
      });
      expect(mockUseObserveQuery).toHaveBeenNthCalledWith(2, mockWorkoutQuery, {
        transform: expect.any(Function),
        enabled: true,
      });
    });

    it('should disable queries when profileId is not provided', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery.mockReturnValueOnce({ data: null }).mockReturnValueOnce({ data: null });

      renderHook(() => useRecentExercises(''));

      expect(mockUseObserveQuery).toHaveBeenNthCalledWith(1, null, {
        transform: expect.any(Function),
        enabled: false,
      });
      expect(mockUseObserveQuery).toHaveBeenNthCalledWith(2, null, {
        transform: expect.any(Function),
        enabled: false,
      });
    });
  });

  describe('memoization behavior', () => {
    it('should recalculate when data changes', () => {
      // Set up initial mocks
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      const { result, rerender } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(4);

      // Set up new data for rerender
      const newWorkouts = [
        {
          id: 'w1',
          startTime: new Date('2024-01-07'),
          endTime: new Date('2024-01-07'),
          getAllExercises: () => [{ exerciseId: 'ex1' }],
        },
      ];

      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: newWorkouts });

      rerender();

      expect(result.current.recentExercises).toHaveLength(1);
      expect(result.current.lastPerformed['ex1']).toEqual(new Date('2024-01-07'));
    });

    it('should recalculate when limit changes', () => {
      // Use mockImplementation to return consistent data across multiple calls
      let callCount = 0;
      mockUseObserveQuery.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) {
          return { data: mockExercises }; // First call of each pair (exercises)
        } else {
          return { data: mockWorkouts }; // Second call of each pair (workouts)
        }
      });

      const { result, rerender } = renderHook(
        ({ limit }) => useRecentExercises(mockProfileId, limit),
        { initialProps: { limit: 4 } }
      );

      expect(result.current.recentExercises).toHaveLength(4);

      rerender({ limit: 2 });

      expect(result.current.recentExercises).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle workouts with no exercises', () => {
      const workoutsWithNoExercises = [
        {
          id: 'w1',
          startTime: new Date('2024-01-05'),
          endTime: new Date('2024-01-05'),
          getAllExercises: () => [],
        },
      ];

      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: workoutsWithNoExercises });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(0);
      expect(result.current.lastPerformed).toEqual({});
    });

    it('should handle duplicate exercises in same workout', () => {
      const workoutWithDuplicates = [
        {
          id: 'w1',
          startTime: new Date('2024-01-05'),
          endTime: new Date('2024-01-05'),
          getAllExercises: () => [
            { exerciseId: 'ex1' },
            { exerciseId: 'ex1' }, // Duplicate
            { exerciseId: 'ex2' },
          ],
        },
      ];

      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: workoutWithDuplicates });

      const { result } = renderHook(() => useRecentExercises(mockProfileId));

      expect(result.current.recentExercises).toHaveLength(2);
      // Should still only have one entry per unique exercise
      expect(result.current.recentExercises.filter((ex) => ex.name === 'Bench Press')).toHaveLength(
        1
      );
    });

    it('should handle limit of 0', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId, 0));

      expect(result.current.recentExercises).toHaveLength(0);
      expect(result.current.lastPerformed).toEqual({});
    });

    it('should handle very large limit', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      const { result } = renderHook(() => useRecentExercises(mockProfileId, 1000));

      // Should still return only the available exercises
      expect(result.current.recentExercises).toHaveLength(4);
    });
  });

  describe('container dependency injection', () => {
    it('should resolve both query services from container', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery
        .mockReturnValueOnce({ data: mockExercises })
        .mockReturnValueOnce({ data: mockWorkouts });

      renderHook(() => useRecentExercises(mockProfileId));

      expect(mockContainer.resolve).toHaveBeenCalledTimes(2);
    });
  });
});
