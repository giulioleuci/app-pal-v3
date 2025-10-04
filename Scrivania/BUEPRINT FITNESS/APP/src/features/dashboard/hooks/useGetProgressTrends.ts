import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { DashboardService, ProgressTrends } from '@/features/dashboard/services/DashboardService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * React Query hook for fetching progress trends data.
 *
 * This hook fetches progress trend data including workout frequency, strength progress,
 * and body weight trends for dashboard charts. It provides a reactive interface for
 * trend data with automatic caching, error handling, and background updates.
 *
 * @param profileId - The profile ID to fetch trends for
 * @param options - React Query options for customizing behavior
 * @returns Query result with progress trends data
 */
export function useGetProgressTrends(
  profileId: string | null,
  options?: Partial<UseQueryOptions<ProgressTrends, ApplicationError>>
) {
  const dashboardService = container.resolve(DashboardService);

  return useQuery({
    queryKey: ['dashboard', 'progress-trends', profileId],
    queryFn: async () => {
      if (!profileId) {
        throw new ApplicationError('Profile ID is required');
      }

      const result = await dashboardService.generateProgressTrends(profileId);

      if (result.isFailure()) {
        throw result.getError();
      }

      return result.getValue()!;
    },
    enabled: !!profileId,
    staleTime: 10 * 60 * 1000, // 10 minutes - trends change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}
