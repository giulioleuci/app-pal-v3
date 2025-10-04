import { container } from 'tsyringe';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { TrainingCycleModel } from '@/features/training-plan/services';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { trainingCyclesToDomain } from '@/shared/utils/transformations';

/**
 * Reactive hook for observing all training cycles for a specific profile.
 *
 * This hook provides a reactive way to observe all training cycles for a given profile
 * using WatermelonDB's observe() API. It automatically updates when training cycle data
 * changes, eliminating the need for manual cache invalidation while maintaining a clean
 * separation from the underlying persistence layer.
 *
 * @param profileId The profile ID to observe training cycles for
 * @param options Optional configuration options
 * @returns Observable result with training cycles data and observation status
 */
export function useGetTrainingCycles(profileId: string, options?: { enabled?: boolean }) {
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);
  const enabled = !!profileId && options?.enabled !== false;
  const query = enabled ? trainingPlanQueryService.getTrainingCycles(profileId) : null;

  return useObserveQuery<TrainingCycleModel>(query, {
    transform: trainingCyclesToDomain,
    enabled,
  });
}
