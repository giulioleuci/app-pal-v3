import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Input parameters for adding a substitution to an exercise.
 */
export interface AddSubstitutionInput {
  profileId: string;
  exerciseId: string;
  substituteExerciseId: string;
  priority: number;
  reason?: string;
}

/**
 * React Query mutation hook for adding a substitution to an exercise.
 *
 * This hook provides a declarative way to add exercise substitutions with automatic
 * cache invalidation and optimistic updates. It updates both the specific exercise
 * cache and the exercises list cache upon successful addition of the substitution.
 *
 * @param options Optional React Query mutation configuration options
 * @returns Mutation result with mutate function, loading state, and error information
 */
export function useAddSubstitution(
  options?: Omit<
    UseMutationOptions<ExerciseModel, ApplicationError, AddSubstitutionInput>,
    'mutationFn'
  >
) {
  const exerciseQueryService = container.resolve(ExerciseQueryService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      exerciseId,
      substituteExerciseId,
      priority,
      reason,
    }: AddSubstitutionInput) =>
      exerciseQueryService.addSubstitution(
        profileId,
        exerciseId,
        substituteExerciseId,
        priority,
        reason
      ),
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
