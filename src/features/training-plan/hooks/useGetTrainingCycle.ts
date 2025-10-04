import { useCallback } from 'react';
import { container } from 'tsyringe';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { TrainingCycleModel } from '@/features/training-plan/services';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { trainingCycleToDomain } from '@/shared/utils/transformations';

/**
 * Reactive hook for observing a specific training cycle by ID.
 *
 * This hook provides a reactive way to observe a training cycle using WatermelonDB's
 * observe() API. It automatically updates when training cycle data changes,
 * eliminating the need for manual cache invalidation while maintaining a clean
 * separation from the underlying persistence layer.
 *
 * @param cycleId The training cycle ID to observe
 * @param options Optional configuration options
 * @returns Observable result with training cycle data and observation status
 */
export function useGetTrainingCycle(cycleId: string, options?: { enabled?: boolean }) {
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);
  const enabled = !!cycleId && options?.enabled !== false;
  const query = enabled ? trainingPlanQueryService.getTrainingCycleQuery(cycleId) : null;

  // Stable transform function to prevent infinite re-renders
  const transform = useCallback(
    (trainingCycles: any[]) =>
      trainingCycles.length > 0 ? [trainingCycleToDomain(trainingCycles[0])] : [],
    []
  );

  return useObserveQuery<TrainingCycleModel>(query, {
    transform,
    enabled,
  });
}
