import { container } from 'tsyringe';

import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { workoutLogToDomain } from '@/shared/utils/transformations';

/**
 * Reactive hook for observing the last workout summary for a specific session.
 *
 * This hook provides a reactive way to observe the most recent workout log for
 * a given session using WatermelonDB's observe() API. It automatically updates
 * when workout data changes, providing historical context for workout initialization.
 *
 * @param profileId The profile ID to search for
 * @param sessionId The session ID to find the last workout for
 * @param options Optional configuration options
 * @returns Observable result with last workout data and observation status
 */
export function useGetLastWorkoutSummary(
  profileId: string,
  sessionId: string,
  options?: { enabled?: boolean }
) {
  const workoutQueryService = container.resolve(WorkoutQueryService);
  const query =
    profileId && sessionId
      ? workoutQueryService.getLastWorkoutForSessionQuery(profileId, sessionId)
      : null;
  const enabled = !!profileId && !!sessionId && options?.enabled !== false;

  return useObserveQuery<WorkoutLogModel>(query, {
    transform: (workoutLogs) =>
      workoutLogs.length > 0 ? workoutLogToDomain(workoutLogs[0]) : null,
    enabled,
  });
}
