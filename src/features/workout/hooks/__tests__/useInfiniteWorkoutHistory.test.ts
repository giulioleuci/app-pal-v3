import { useInfiniteQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

import {
  HistoryFilters,
  useInfiniteWorkoutHistory,
  WorkoutHistoryPage,
} from '../useInfiniteWorkoutHistory';

// Hoisted mocks for proper initialization order
const mockWorkoutLogsToDomain = vi.hoisted(() => vi.fn());

// Mock container
vi.mock('tsyringe', () => ({
  container: {
    resolve: vi.fn(),
  },
  injectable: () => (target: any) => target,
  inject: (token: any) => (target: any, propertyKey: string, parameterIndex: number) => {},
}));

// Mock useInfiniteQuery
vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(),
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  workoutLogsToDomain: mockWorkoutLogsToDomain,
}));

const mockWorkoutQueryService = {
  getWorkoutHistoryPaginated: vi.fn(),
};

const mockUseInfiniteQuery = useInfiniteQuery as any;

// Mock workout data
const createMockWorkout = (id: string, overrides: Partial<WorkoutLogModel> = {}): WorkoutLogModel =>
  ({
    id,
    name: `Workout ${id}`,
    endTime: new Date(`2024-03-${id.slice(-2).padStart(2, '0')}T10:00:00Z`),
    ...overrides,
  }) as WorkoutLogModel;

describe('useInfiniteWorkoutHistory', () => {
  const profileId = 'test-profile-id';
  const defaultPageSize = 20;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup container mocks
    (container.resolve as any).mockImplementation((service: any) => {
      if (service === WorkoutQueryService) return mockWorkoutQueryService;
      return {};
    });

    // Setup transformation mock
    mockWorkoutLogsToDomain.mockImplementation((data: any) => data);
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      // Arrange
      const mockInfiniteQueryResult = {
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      mockUseInfiniteQuery.mockReturnValue(mockInfiniteQueryResult);

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.workouts).toEqual([]);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.isFetchingNextPage).toBe(false);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty profile ID', () => {
      // Arrange
      const mockInfiniteQueryResult = {
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      mockUseInfiniteQuery.mockReturnValue(mockInfiniteQueryResult);

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory('', defaultPageSize));

      // Assert
      expect(result.current.workouts).toEqual([]);
      expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false, // Should be disabled when no profileId
        })
      );
    });
  });

  describe('Query Configuration', () => {
    it('should configure infinite query with correct parameters', () => {
      // Arrange
      const filters: HistoryFilters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
        trainingPlanId: 'plan-1',
        exerciseIds: ['exercise-1', 'exercise-2'],
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      renderHook(() => useInfiniteWorkoutHistory(profileId, 15, filters));

      // Assert
      expect(mockUseInfiniteQuery).toHaveBeenCalledWith({
        queryKey: [
          'infinite-workout-history',
          profileId,
          15,
          expect.stringContaining('plan-1'), // Filter key should contain filter data
        ],
        queryFn: expect.any(Function),
        getNextPageParam: expect.any(Function),
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: true,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      });
    });

    it('should create stable filter keys', () => {
      // Arrange
      const filters1: HistoryFilters = {
        exerciseIds: ['exercise-2', 'exercise-1'], // Different order
      };

      const filters2: HistoryFilters = {
        exerciseIds: ['exercise-1', 'exercise-2'], // Same exercises, different order
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { rerender } = renderHook(
        ({ filters }) => useInfiniteWorkoutHistory(profileId, defaultPageSize, filters),
        { initialProps: { filters: filters1 } }
      );

      const firstCallKey = mockUseInfiniteQuery.mock.calls[0][0].queryKey;

      rerender({ filters: filters2 });

      const secondCallKey = mockUseInfiniteQuery.mock.calls[1][0].queryKey;

      // Assert - keys should be the same because exerciseIds are sorted
      expect(firstCallKey[3]).toBe(secondCallKey[3]);
    });

    it('should handle filters with no values', () => {
      // Arrange
      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize, undefined));

      // Assert
      expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['no-filters']),
        })
      );
    });
  });

  describe('Query Function', () => {
    it('should call query service with correct parameters', async () => {
      // Arrange
      const mockQueryFunction = vi.fn();
      const filters: HistoryFilters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
      };

      const mockResult = {
        logs: [createMockWorkout('1'), createMockWorkout('2')],
        hasMore: true,
        total: 100,
      };

      mockWorkoutQueryService.getWorkoutHistoryPaginated.mockResolvedValue(mockResult);

      mockUseInfiniteQuery.mockImplementation(({ queryFn }) => {
        mockQueryFunction.mockImplementation(queryFn);
        return {
          data: null,
          hasNextPage: false,
          fetchNextPage: vi.fn(),
          isFetchingNextPage: false,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      });

      renderHook(() => useInfiniteWorkoutHistory(profileId, 15, filters));

      // Act
      const result = await mockQueryFunction({ pageParam: 20 });

      // Assert
      expect(mockWorkoutQueryService.getWorkoutHistoryPaginated).toHaveBeenCalledWith(
        profileId,
        15, // pageSize
        20, // offset (pageParam)
        filters
      );

      expect(result).toEqual({
        workouts: mockResult.logs,
        hasNextPage: true,
        nextOffset: 35, // 20 + 15
        totalCount: 100,
      });
    });

    it('should handle first page (pageParam = 0)', async () => {
      // Arrange
      const mockQueryFunction = vi.fn();

      mockWorkoutQueryService.getWorkoutHistoryPaginated.mockResolvedValue({
        logs: [createMockWorkout('1')],
        hasMore: false,
        total: 1,
      });

      mockUseInfiniteQuery.mockImplementation(({ queryFn }) => {
        mockQueryFunction.mockImplementation(queryFn);
        return {
          data: null,
          hasNextPage: false,
          fetchNextPage: vi.fn(),
          isFetchingNextPage: false,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      });

      renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Act
      const result = await mockQueryFunction({ pageParam: undefined }); // First page

      // Assert
      expect(mockWorkoutQueryService.getWorkoutHistoryPaginated).toHaveBeenCalledWith(
        profileId,
        defaultPageSize,
        0, // Should default to 0
        undefined
      );

      expect(result).toMatchObject({
        workouts: expect.any(Array),
        hasNextPage: false,
        nextOffset: 20,
        totalCount: 1,
      });
    });

    it('should handle query service errors', async () => {
      // Arrange
      const mockQueryFunction = vi.fn();
      const error = new Error('Service error');

      mockWorkoutQueryService.getWorkoutHistoryPaginated.mockRejectedValue(error);

      mockUseInfiniteQuery.mockImplementation(({ queryFn }) => {
        mockQueryFunction.mockImplementation(queryFn);
        return {
          data: null,
          hasNextPage: false,
          fetchNextPage: vi.fn(),
          isFetchingNextPage: false,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      });

      renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Act & Assert
      await expect(mockQueryFunction({ pageParam: 0 })).rejects.toThrow('Service error');
    });

    it('should transform workout data using workoutLogsToDomain', async () => {
      // Arrange
      const mockQueryFunction = vi.fn();
      const rawLogs = [{ id: 'raw-1' }, { id: 'raw-2' }];
      const transformedLogs = [createMockWorkout('1'), createMockWorkout('2')];

      mockWorkoutQueryService.getWorkoutHistoryPaginated.mockResolvedValue({
        logs: rawLogs,
        hasMore: false,
        total: 2,
      });

      mockWorkoutLogsToDomain.mockReturnValue(transformedLogs);

      mockUseInfiniteQuery.mockImplementation(({ queryFn }) => {
        mockQueryFunction.mockImplementation(queryFn);
        return {
          data: null,
          hasNextPage: false,
          fetchNextPage: vi.fn(),
          isFetchingNextPage: false,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      });

      renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Act
      const result = await mockQueryFunction({ pageParam: 0 });

      // Assert
      expect(mockWorkoutLogsToDomain).toHaveBeenCalledWith(rawLogs);
      expect(result.workouts).toBe(transformedLogs);
    });
  });

  describe('Next Page Parameter Function', () => {
    it('should return nextOffset when hasNextPage is true', () => {
      // Arrange
      const mockGetNextPageParam = vi.fn();

      mockUseInfiniteQuery.mockImplementation(({ getNextPageParam }) => {
        mockGetNextPageParam.mockImplementation(getNextPageParam);
        return {
          data: null,
          hasNextPage: false,
          fetchNextPage: vi.fn(),
          isFetchingNextPage: false,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      });

      renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      const lastPage: WorkoutHistoryPage = {
        workouts: [],
        hasNextPage: true,
        nextOffset: 40,
        totalCount: 100,
      };

      // Act
      const nextPageParam = mockGetNextPageParam(lastPage);

      // Assert
      expect(nextPageParam).toBe(40);
    });

    it('should return undefined when hasNextPage is false', () => {
      // Arrange
      const mockGetNextPageParam = vi.fn();

      mockUseInfiniteQuery.mockImplementation(({ getNextPageParam }) => {
        mockGetNextPageParam.mockImplementation(getNextPageParam);
        return {
          data: null,
          hasNextPage: false,
          fetchNextPage: vi.fn(),
          isFetchingNextPage: false,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      });

      renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      const lastPage: WorkoutHistoryPage = {
        workouts: [],
        hasNextPage: false,
        nextOffset: 40,
        totalCount: 40,
      };

      // Act
      const nextPageParam = mockGetNextPageParam(lastPage);

      // Assert
      expect(nextPageParam).toBeUndefined();
    });
  });

  describe('Data Processing', () => {
    it('should flatten pages into single workout array', () => {
      // Arrange
      const page1Workouts = [createMockWorkout('1'), createMockWorkout('2')];
      const page2Workouts = [createMockWorkout('3'), createMockWorkout('4')];

      const mockInfiniteQueryData = {
        pages: [
          { workouts: page1Workouts, hasNextPage: true, nextOffset: 20, totalCount: 100 },
          { workouts: page2Workouts, hasNextPage: false, nextOffset: 40, totalCount: 100 },
        ],
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: mockInfiniteQueryData,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.workouts).toHaveLength(4);
      expect(result.current.workouts).toEqual([...page1Workouts, ...page2Workouts]);
    });

    it('should get total count from first page', () => {
      // Arrange
      const mockInfiniteQueryData = {
        pages: [
          { workouts: [], hasNextPage: true, nextOffset: 20, totalCount: 150 },
          { workouts: [], hasNextPage: false, nextOffset: 40, totalCount: 150 },
        ],
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: mockInfiniteQueryData,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.totalCount).toBe(150);
    });

    it('should handle empty pages', () => {
      // Arrange
      const mockInfiniteQueryData = {
        pages: [],
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: mockInfiniteQueryData,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.workouts).toEqual([]);
      expect(result.current.totalCount).toBe(0);
    });

    it('should handle null data', () => {
      // Arrange
      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.workouts).toEqual([]);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('Fetch Next Page', () => {
    it('should call fetchNextPage when hasNextPage is true and not already fetching', () => {
      // Arrange
      const mockFetchNextPage = vi.fn();

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: true,
        fetchNextPage: mockFetchNextPage,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Act
      result.current.fetchNextPage();

      // Assert
      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchNextPage when hasNextPage is false', () => {
      // Arrange
      const mockFetchNextPage = vi.fn();

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: mockFetchNextPage,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Act
      result.current.fetchNextPage();

      // Assert
      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it('should not call fetchNextPage when already fetching next page', () => {
      // Arrange
      const mockFetchNextPage = vi.fn();

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: true,
        fetchNextPage: mockFetchNextPage,
        isFetchingNextPage: true, // Already fetching
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Act
      result.current.fetchNextPage();

      // Assert
      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle query errors', () => {
      // Arrange
      const error = new ApplicationError('Network error', 'NETWORK_ERROR');

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: true,
        error,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });

    it('should handle non-ApplicationError errors', () => {
      // Arrange
      const error = new Error('Generic error');

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: true,
        error,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });
  });

  describe('Loading States', () => {
    it('should expose loading state', () => {
      // Arrange
      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should expose fetching next page state', () => {
      // Arrange
      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: true,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: true,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.isFetchingNextPage).toBe(true);
    });

    it('should expose hasNextPage state', () => {
      // Arrange
      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: true,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.hasNextPage).toBe(true);
    });

    it('should expose refetch function', () => {
      // Arrange
      const mockRefetch = vi.fn();

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      result.current.refetch();

      // Assert
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Page Size', () => {
    it('should use custom page size', () => {
      // Arrange
      const customPageSize = 10;

      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      renderHook(() => useInfiniteWorkoutHistory(profileId, customPageSize));

      // Assert
      expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([customPageSize]),
        })
      );
    });

    it('should use default page size when not specified', () => {
      // Arrange
      mockUseInfiniteQuery.mockReturnValue({
        data: null,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      renderHook(() => useInfiniteWorkoutHistory(profileId));

      // Assert
      expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([20]), // Default page size
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle pages with different totalCount values', () => {
      // Arrange - simulate inconsistent totalCount (shouldn't happen in practice)
      const mockInfiniteQueryData = {
        pages: [
          { workouts: [], hasNextPage: true, nextOffset: 20, totalCount: 100 },
          { workouts: [], hasNextPage: false, nextOffset: 40, totalCount: 150 }, // Different total
        ],
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: mockInfiniteQueryData,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert - should use the first page's totalCount
      expect(result.current.totalCount).toBe(100);
    });

    it('should handle pages with empty workout arrays', () => {
      // Arrange
      const mockInfiniteQueryData = {
        pages: [{ workouts: [], hasNextPage: false, nextOffset: 0, totalCount: 0 }],
      };

      mockUseInfiniteQuery.mockReturnValue({
        data: mockInfiniteQueryData,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      // Act
      const { result } = renderHook(() => useInfiniteWorkoutHistory(profileId, defaultPageSize));

      // Assert
      expect(result.current.workouts).toEqual([]);
      expect(result.current.totalCount).toBe(0);
    });
  });
});
