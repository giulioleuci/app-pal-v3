import {
  DashboardMetrics,
  ProgressTrends,
  RecentActivity,
} from '@/features/dashboard/services/DashboardService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

import { useGetDashboardMetrics } from './useGetDashboardMetrics';
import { useGetProgressTrends } from './useGetProgressTrends';
import { useGetRecentActivity } from './useGetRecentActivity';

/**
 * Combined state interface for dashboard data.
 */
export interface DashboardData {
  metrics: DashboardMetrics | undefined;
  recentActivity: RecentActivity | undefined;
  progressTrends: ProgressTrends | undefined;
}

/**
 * Combined result interface for the dashboard data hook.
 */
export interface UseDashboardDataResult {
  /** Combined data object containing metrics, recent activity, and progress trends */
  data: DashboardData | undefined;
  /** True if any of the underlying queries are currently loading */
  isLoading: boolean;
  /** True if any of the underlying queries are in an error state */
  isError: boolean;
  /** The first error encountered from the underlying queries */
  error: ApplicationError | null;
  /** True if there is no active profile selected */
  hasNoActiveProfile: boolean;
  /** True if all queries have completed successfully and data is available */
  isSuccess: boolean;
  /** True if any of the underlying queries are currently fetching */
  isFetching: boolean;
}

/**
 * Aggregate React Query hook that provides all dashboard data in a unified interface.
 *
 * This hook combines the results of multiple dashboard-related queries into a single,
 * unified interface. It orchestrates the fetching of dashboard metrics, recent activity,
 * and progress trends, providing intelligent state aggregation that combines loading states,
 * errors, and success states from all underlying queries.
 *
 * The hook automatically fetches data for the currently active profile ID from the profile
 * store. If no profile is active, all queries are disabled and the hook returns appropriate
 * empty states.
 *
 * This is a powerful example of the aggregate hook pattern, providing a clean interface
 * for complex dashboard pages that need multiple data sources.
 *
 * @returns Combined result with unified loading states, errors, and dashboard data
 */
export function useDashboardData(): UseDashboardDataResult {
  const activeProfileId = useActiveProfileId();

  const metricsQuery = useGetDashboardMetrics(activeProfileId, { enabled: !!activeProfileId });
  const recentActivityQuery = useGetRecentActivity(activeProfileId, { enabled: !!activeProfileId });
  const progressTrendsQuery = useGetProgressTrends(activeProfileId, { enabled: !!activeProfileId });

  // If no active profile, return early with empty state
  if (!activeProfileId) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      hasNoActiveProfile: true,
      isSuccess: false,
      isFetching: false,
    };
  }

  // Aggregate loading states - true if any query is loading
  const isLoading =
    metricsQuery.isLoading || recentActivityQuery.isLoading || progressTrendsQuery.isLoading;

  // Aggregate fetching states - true if any query is fetching
  const isFetching =
    metricsQuery.isFetching || recentActivityQuery.isFetching || progressTrendsQuery.isFetching;

  // Aggregate error states - true if any query has an error
  const isError =
    metricsQuery.isError || recentActivityQuery.isError || progressTrendsQuery.isError;

  // Get the first error encountered
  const error =
    metricsQuery.error || recentActivityQuery.error || progressTrendsQuery.error || null;

  // Aggregate success states - true if all queries have succeeded
  const isSuccess =
    metricsQuery.isSuccess && recentActivityQuery.isSuccess && progressTrendsQuery.isSuccess;

  // Combine the data from all queries
  const data: DashboardData | undefined =
    metricsQuery.data !== undefined ||
    recentActivityQuery.data !== undefined ||
    progressTrendsQuery.data !== undefined
      ? {
          metrics: metricsQuery.data,
          recentActivity: recentActivityQuery.data,
          progressTrends: progressTrendsQuery.data,
        }
      : undefined;

  return {
    data,
    isLoading,
    isError,
    error,
    hasNoActiveProfile: false,
    isSuccess,
    isFetching,
  };
}
