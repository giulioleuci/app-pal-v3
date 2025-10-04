import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { DashboardService, RecentActivity } from '@/features/dashboard/services/DashboardService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * React Query hook for fetching recent activity data.
 *
 * This hook fetches recent workout and personal record activity for the dashboard.
 * It provides a reactive interface for recent activity data with automatic caching,
 * error handling, and background updates.
 *
 * @param profileId - The profile ID to fetch activity for
 * @param options - React Query options for customizing behavior
 * @returns Query result with recent activity data
 */
export function useGetRecentActivity(
  profileId: string | null,
  options?: Partial<UseQueryOptions<RecentActivity, ApplicationError>>
) {
  const dashboardService = container.resolve(DashboardService);

  return useQuery({
    queryKey: ['dashboard', 'recent-activity', profileId],
    queryFn: async () => {
      if (!profileId) {
        throw new ApplicationError('Profile ID is required');
      }

      const result = await dashboardService.generateRecentActivity(profileId);

      if (result.isFailure()) {
        throw result.getError();
      }

      return result.getValue()!;
    },
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent updates for activity
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
