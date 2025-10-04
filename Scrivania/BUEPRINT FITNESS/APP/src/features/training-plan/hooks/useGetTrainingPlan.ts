import { container } from 'tsyringe';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { TrainingPlanModel } from '@/features/training-plan/services';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { trainingPlanToDomain } from '@/shared/utils/transformations';

/**
 * Reactive hook for observing a specific training plan by ID.
 *
 * This hook provides a reactive way to observe a training plan using WatermelonDB's
 * observe() API. It automatically updates when training plan data changes,
 * eliminating the need for manual cache invalidation while maintaining a clean
 * separation from the underlying persistence layer.
 *
 * @param planId The training plan ID to observe
 * @param options Optional configuration options
 * @returns Observable result with training plan data and observation status
 */
export function useGetTrainingPlan(planId: string, options?: { enabled?: boolean }) {
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);
  const enabled = !!planId && options?.enabled !== false;
  const query = enabled ? trainingPlanQueryService.getTrainingPlanQuery(planId) : null;

  return useObserveQuery<TrainingPlanModel>(query, {
    transform: (trainingPlans) =>
      trainingPlans.length > 0 ? [trainingPlanToDomain(trainingPlans[0])] : [],
    enabled,
  });
}
