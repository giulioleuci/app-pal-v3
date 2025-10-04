import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { DashboardMetrics, DashboardService } from '@/features/dashboard/services/DashboardService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * React Query hook for fetching dashboard metrics.
 *
 * This hook fetches key dashboard metrics like total workouts, streaks, and personal records.
 * It provides a reactive interface for dashboard metric data with automatic caching,
 * error handling, and background updates.
 *
 * @param profileId - The profile ID to fetch metrics for
 * @param options - React Query options for customizing behavior
 * @returns Query result with dashboard metrics data
 */
export function useGetDashboardMetrics(
  profileId: string | null,
  options?: Partial<UseQueryOptions<DashboardMetrics, ApplicationError>>
) {
  const dashboardService = container.resolve(DashboardService);

  return useQuery({
    queryKey: ['dashboard', 'metrics', profileId],
    queryFn: async () => {
      if (!profileId) {
        throw new ApplicationError('Profile ID is required');
      }

      const result = await dashboardService.generateDashboardMetrics(profileId);

      if (result.isFailure()) {
        throw result.getError();
      }

      return result.getValue()!;
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}
