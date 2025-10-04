import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { workoutLogsToDomain } from '@/shared/utils/transformations';

export interface WorkoutHistoryPage {
  workouts: WorkoutLogModel[];
  hasNextPage: boolean;
  nextOffset: number;
  totalCount: number;
}

export interface HistoryFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  trainingPlanId?: string;
  exerciseIds?: string[];
}

interface UseInfiniteWorkoutHistoryResult {
  workouts: WorkoutLogModel[];
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  error: ApplicationError | null;
  refetch: () => void;
}

/**
 * Hook for infinite scrolling workout history with performance optimization.
 *
 * Implements infinite scrolling for workout history using existing pagination APIs.
 * Reduces memory usage and improves performance for users with large workout histories
 * by loading data incrementally as needed.
 *
 * @param profileId The profile ID to get workout history for
 * @param pageSize Number of workouts to fetch per page (default: 20)
 * @param filters Optional filters to apply to the history
 * @returns Object with infinite scroll data and controls
 *
 * @example
 * ```typescript
 * const {
 *   workouts,
 *   hasNextPage,
 *   fetchNextPage,
 *   isFetchingNextPage,
 *   totalCount
 * } = useInfiniteWorkoutHistory(profileId, 15, {
 *   dateRange: { from: startDate, to: endDate }
 * });
 *
 * return (
 *   <InfiniteScroll
 *     dataLength={workouts.length}
 *     next={fetchNextPage}
 *     hasMore={hasNextPage}
 *     loader={<Loading />}
 *   >
 *     {workouts.map(workout => (
 *       <WorkoutCard key={workout.id} workout={workout} />
 *     ))}
 *   </InfiniteScroll>
 * );
 * ```
 */
export function useInfiniteWorkoutHistory(
  profileId: string,
  pageSize: number = 20,
  filters?: HistoryFilters
): UseInfiniteWorkoutHistoryResult {
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Create stable filter key for query invalidation
  const filterKey = useMemo(() => {
    if (!filters) return 'no-filters';
    return JSON.stringify({
      dateRange: filters.dateRange
        ? {
            from: filters.dateRange.from.toISOString(),
            to: filters.dateRange.to.toISOString(),
          }
        : undefined,
      trainingPlanId: filters.trainingPlanId,
      exerciseIds: filters.exerciseIds?.sort(), // Sort for consistent key
    });
  }, [filters]);

  // Use React Query's infinite query
  const infiniteQuery = useInfiniteQuery({
    queryKey: ['infinite-workout-history', profileId, pageSize, filterKey],

    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;

      try {
        // Fetch workout history page
        const result = await workoutQueryService.getWorkoutHistoryPaginated(
          profileId,
          pageSize,
          offset,
          filters
        );

        // Transform the data
        const transformedWorkouts = workoutLogsToDomain(result.logs);

        return {
          workouts: transformedWorkouts,
          hasNextPage: result.hasMore,
          nextOffset: offset + pageSize,
          totalCount: result.total,
        } satisfies WorkoutHistoryPage;
      } catch (_error) {
        console.error('Error fetching workout history page:', _error);
        throw _error;
      }
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.nextOffset : undefined;
    },

    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    enabled: !!profileId,
    refetchOnWindowFocus: false, // Prevent excessive refetches
    refetchOnMount: false, // Use cached data when available
  });

  // Flatten all pages into a single array
  const workouts = useMemo(() => {
    return infiniteQuery.data?.pages.flatMap((page) => page.workouts) ?? [];
  }, [infiniteQuery.data]);

  // Get total count from the most recent page
  const totalCount = useMemo(() => {
    const pages = infiniteQuery.data?.pages;
    return pages && pages.length > 0 ? pages[0].totalCount : 0;
  }, [infiniteQuery.data]);

  // Check if there are more pages to fetch
  const hasNextPage = !!infiniteQuery.hasNextPage;

  // Fetch next page function
  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !infiniteQuery.isFetchingNextPage) {
      infiniteQuery.fetchNextPage();
    }
  }, [hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.fetchNextPage]);

  return {
    workouts,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    totalCount,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error as ApplicationError | null,
    refetch: infiniteQuery.refetch,
  };
}

// Note: This requires the WorkoutQueryService to have a getWorkoutHistoryPaginated method
// Here's what that method signature should look like:

/*
In WorkoutQueryService:

async getWorkoutHistoryPaginated(
  profileId: string,
  limit: number,
  offset: number,
  filters?: {
    dateRange?: { from: Date; to: Date };
    trainingPlanId?: string;
    exerciseIds?: string[];
  }
): Promise<{
  logs: WorkoutLogRecord[];
  hasMore: boolean;
  total: number;
}> {
  // Implementation would:
  // 1. Build a WatermelonDB query with filters
  // 2. Apply pagination with skip/take
  // 3. Count total records for hasMore calculation
  // 4. Return paginated results
}
*/
