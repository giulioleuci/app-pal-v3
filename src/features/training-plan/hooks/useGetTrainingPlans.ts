import { container } from 'tsyringe';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { TrainingPlanModel } from '@/features/training-plan/services';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { trainingPlansToDomain } from '@/shared/utils/transformations';

/**
 * Reactive hook for observing all training plans for a specific profile.
 *
 * This hook provides a reactive way to observe all training plans for a given profile
 * using WatermelonDB's observe() API. It automatically updates when training plan data
 * changes, eliminating the need for manual cache invalidation while maintaining a clean
 * separation from the underlying persistence layer.
 *
 * @param profileId The profile ID to observe training plans for
 * @param filters Optional filters for archived status and cycle ID
 * @param options Optional configuration options
 * @returns Observable result with training plans data and observation status
 */
export function useGetTrainingPlans(
  profileId: string,
  filters?: { isArchived?: boolean; cycleId?: string },
  options?: { enabled?: boolean }
) {
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);
  const enabled = !!profileId && options?.enabled !== false;

  // Only create query when we have a profileId and the hook is not explicitly disabled
  const query =
    profileId && options?.enabled !== false
      ? trainingPlanQueryService.getTrainingPlans(profileId, filters)
      : null;

  return useObserveQuery<TrainingPlanModel>(query, {
    transform: trainingPlansToDomain,
    enabled,
  });
}
