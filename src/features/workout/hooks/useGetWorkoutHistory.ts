import { useInfiniteQuery, type UseInfiniteQueryOptions } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

export interface WorkoutHistoryPage {
  logs: WorkoutLogModel[];
  hasMore: boolean;
  total: number;
  nextOffset?: number;
}

/**
 * React Query infinite query hook for fetching paginated workout history.
 *
 * This hook provides infinite scrolling functionality for workout history,
 * loading workout logs in pages as the user scrolls. It's optimized for
 * displaying large amounts of historical workout data efficiently.
 *
 * @param profileId The profile ID to fetch history for
 * @param limit The number of logs to fetch per page
 * @param filters Optional date range filters
 * @param options Optional React Query infinite query configuration options
 * @returns Infinite query result with paginated workout history data
 */
export function useGetWorkoutHistory(
  profileId: string,
  limit: number = 20,
  filters?: { dateRange?: { from: Date; to: Date } },
  options?: Omit<
    UseInfiniteQueryOptions<WorkoutHistoryPage, ApplicationError>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  const workoutQueryService = container.resolve(WorkoutQueryService);

  return useInfiniteQuery({
    queryKey: ['workout-history', profileId, limit, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;
      const result = await workoutQueryService.getWorkoutHistory(profileId, limit, offset, filters);

      return {
        logs: result.logs,
        hasMore: result.hasMore,
        total: result.total,
        nextOffset: result.hasMore ? offset + limit : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!profileId,
    ...options,
  });
}
