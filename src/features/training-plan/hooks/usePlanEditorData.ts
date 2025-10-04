import { useExerciseCRUD } from '@/features/exercise/hooks/useExerciseCRUD';
import { ExerciseModel } from '@/features/exercise/services';
import { TrainingPlanModel } from '@/features/training-plan/services';
import { ApplicationError } from '@/shared/errors/ApplicationError';

import { useTrainingPlanManager } from './useTrainingPlanManager';

/**
 * Combined data interface for the plan editor.
 */
export interface PlanEditorData {
  plan: TrainingPlanModel | undefined;
  availableExercises: ExerciseModel[] | undefined;
}

/**
 * Combined result interface for the plan editor data hook.
 */
export interface UsePlanEditorDataResult {
  /** Combined data object containing plan details and available exercises */
  data: PlanEditorData | undefined;
  /** True if any of the underlying queries are currently loading */
  isLoading: boolean;
  /** True if any of the underlying queries are in an error state */
  isError: boolean;
  /** The first error encountered from the underlying queries */
  error: ApplicationError | null;
  /** True if all queries have completed successfully and data is available */
  isSuccess: boolean;
  /** True if any of the underlying queries are currently fetching */
  isFetching: boolean;
  /** True if the plan ID or profile ID is missing */
  hasInvalidIds: boolean;
}

/**
 * Aggregate React Query hook that provides all data required for the plan editor workflow.
 *
 * This hook combines the results of multiple queries into a single, unified interface
 * for the plan editing experience. It fetches both the training plan details and the
 * complete list of available exercises for the exercise picker modal.
 *
 * The hook provides intelligent state aggregation, combining loading states, errors,
 * and success states from the underlying queries. It automatically handles concurrent
 * data fetching and provides a clean API for the presentation layer.
 *
 * @param planId The ID of the training plan being edited
 * @param profileId The ID of the profile (required for fetching exercises)
 * @returns Combined result with unified loading states, errors, and data
 */
export function usePlanEditorData(planId: string, profileId: string): UsePlanEditorDataResult {
  // Check for invalid IDs before calling hooks
  const hasInvalidIds = !planId || !profileId;

  const { getPlanDetails } = useTrainingPlanManager(profileId);
  const planQuery = getPlanDetails(planId);
  const {
    exercises: availableExercises,
    isLoading: exercisesLoading,
    error: exercisesError,
  } = useExerciseCRUD(profileId) || {};

  // If essential IDs are missing, return early with invalid state
  if (hasInvalidIds) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      hasInvalidIds: true,
      isSuccess: false,
      isFetching: false,
    };
  }

  // Aggregate loading states - true if any query is loading
  const isLoading = Boolean(planQuery?.isLoading || exercisesLoading);

  // Aggregate fetching states - true if any query is fetching
  const isFetching = Boolean(planQuery?.isFetching || exercisesLoading); // Use isLoading for exercises since isFetching not available

  // Aggregate error states - true if any query has an error
  const isError = Boolean(planQuery?.isError || exercisesError);

  // Get the first error encountered
  const error = planQuery?.error || exercisesError || null;

  // Aggregate success states - true if all queries have succeeded
  const isSuccess = Boolean(planQuery?.isSuccess && !exercisesLoading && !exercisesError);

  // Combine the data from both queries
  const data: PlanEditorData | undefined =
    planQuery?.data !== undefined || availableExercises !== undefined
      ? {
          plan: planQuery?.data,
          availableExercises,
        }
      : undefined;

  return {
    data,
    isLoading,
    isError,
    error,
    hasInvalidIds: false,
    isSuccess,
    isFetching,
  };
}
