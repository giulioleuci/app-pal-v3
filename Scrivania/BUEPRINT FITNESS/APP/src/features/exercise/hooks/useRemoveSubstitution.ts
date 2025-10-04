import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Input parameters for removing a substitution from an exercise.
 */
export interface RemoveSubstitutionInput {
  profileId: string;
  exerciseId: string;
  substituteExerciseId: string;
}

/**
 * React Query mutation hook for removing a substitution from an exercise.
 *
 * This hook provides a declarative way to remove exercise substitutions with automatic
 * cache invalidation and optimistic updates. It updates both the specific exercise
 * cache and the exercises list cache upon successful removal of the substitution.
 *
 * @param options Optional React Query mutation configuration options
 * @returns Mutation result with mutate function, loading state, and error information
 */
export function useRemoveSubstitution(
  options?: Omit<
    UseMutationOptions<ExerciseModel, ApplicationError, RemoveSubstitutionInput>,
    'mutationFn'
  >
) {
  const exerciseQueryService = container.resolve(ExerciseQueryService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, exerciseId, substituteExerciseId }: RemoveSubstitutionInput) =>
      exerciseQueryService.removeSubstitution(profileId, exerciseId, substituteExerciseId),
    onSuccess: (updatedExercise, variables) => {
      // Update the specific exercise cache
      queryClient.setQueryData(
        ['exercises', variables.profileId, variables.exerciseId],
        updatedExercise
      );

      // Update the exercise in the exercises list cache
      const existingExercises = queryClient.getQueryData<ExerciseModel[]>([
        'exercises',
        variables.profileId,
      ]);
      if (existingExercises) {
        queryClient.setQueryData(
          ['exercises', variables.profileId],
          existingExercises.map((exercise) =>
            exercise.id === variables.exerciseId ? updatedExercise : exercise
          )
        );
      }

      options?.onSuccess?.(updatedExercise, variables, undefined);
    },
    onError: options?.onError,
    onSettled: options?.onSettled,
    onMutate: options?.onMutate,
  });
}
