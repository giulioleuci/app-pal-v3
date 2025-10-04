import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * React Query mutation hook for saving multiple exercises in bulk.
 *
 * This hook provides a declarative way to save multiple exercises with automatic
 * cache invalidation. It invalidates all exercises caches for the affected profiles
 * upon successful bulk save to ensure UI consistency.
 *
 * @param options Optional React Query mutation configuration options
 * @returns Mutation result with mutate function, loading state, and error information
 */
export function useSaveBulkExercises(
  options?: Omit<UseMutationOptions<void, ApplicationError, ExerciseModel[]>, 'mutationFn'>
) {
  const exerciseQueryService = container.resolve(ExerciseQueryService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exercises: ExerciseModel[]) => exerciseQueryService.saveBulkExercises(exercises),
    onSuccess: (_, exercises) => {
      // Get unique profile IDs from the exercises
      const profileIds = [...new Set(exercises.map((exercise) => exercise.profileId))];

      // Invalidate exercises lists for all affected profiles
      profileIds.forEach((profileId) => {
        queryClient.invalidateQueries({ queryKey: ['exercises', profileId] });
      });

      // Update individual exercise caches
      exercises.forEach((exercise) => {
        queryClient.setQueryData(['exercises', exercise.profileId, exercise.id], exercise);
      });

      options?.onSuccess?.(undefined, exercises, undefined);
    },
    onError: options?.onError,
    onSettled: options?.onSettled,
    onMutate: options?.onMutate,
  });
}
