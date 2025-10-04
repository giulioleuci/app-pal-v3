import { useMemo } from 'react';

import { useTrainingPlanManager } from '@/features/training-plan/hooks/useTrainingPlanManager';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { useGetLastWorkoutSummary } from '@/features/workout/hooks/useGetLastWorkoutSummary';
import { ApplicationError } from '@/shared/errors/ApplicationError';

export interface WorkoutInitializationData {
  currentSession:
    | {
        id: string;
        name: string;
        groups: any[];
        exercises: any[];
      }
    | undefined;
  lastPerformance: WorkoutLogModel | undefined;
  isLoading: boolean;
  error: ApplicationError | null;
  isReady: boolean;
}

/**
 * Aggregate React Query hook that prepares all data needed before starting a workout.
 *
 * This hook combines multiple data sources to provide a complete picture of what
 * the workout should look like and how the user performed the last time they did
 * this session. It's essential for workout initialization as it provides the
 * context needed to create a historically-aware workout log.
 *
 * The hook waits for both the current session details and last performance data
 * to be available before marking itself as ready, ensuring all necessary context
 * is loaded before workout creation.
 *
 * @param planId The training plan ID containing the session
 * @param sessionId The session ID to initialize
 * @param profileId The profile ID to get historical data for
 * @returns Object containing current session, last performance, loading state, and readiness indicator
 */
export function useWorkoutInitializationData(
  planId: string,
  sessionId: string,
  profileId: string
): WorkoutInitializationData {
  // Fetch the training plan details to get session information
  const { getPlanDetails } = useTrainingPlanManager(profileId);
  const planDetailsQuery = getPlanDetails(planId);
  const trainingPlan = planDetailsQuery?.data;
  const isPlanLoading = planDetailsQuery?.isLoading || false;
  const planError = planDetailsQuery?.error || null;

  // Fetch the last workout summary for this session
  const {
    data: lastWorkout,
    isLoading: isLastWorkoutLoading,
    error: lastWorkoutError,
  } = useGetLastWorkoutSummary(profileId, sessionId);

  // Extract the current session from the training plan
  const currentSession = useMemo(() => {
    if (!trainingPlan || !sessionId) return undefined;

    // Find the session in all cycles
    for (const cycle of trainingPlan.cycles) {
      const session = cycle.sessions.find((s) => s.id === sessionId);
      if (session) {
        return {
          id: session.id,
          name: session.name,
          groups: session.groups,
          exercises: session.groups.flatMap((group) => group.appliedExercises),
        };
      }
    }

    return undefined;
  }, [trainingPlan, sessionId]);

  // Determine loading state
  const isLoading = isPlanLoading || isLastWorkoutLoading;

  // Determine error state (prioritize plan error as it's more critical)
  const error = planError || lastWorkoutError || null;

  // Determine if all required data is ready
  const isReady = !isLoading && !error && !!currentSession;

  return {
    currentSession,
    lastPerformance: lastWorkout,
    isLoading,
    error,
    isReady,
  };
}
