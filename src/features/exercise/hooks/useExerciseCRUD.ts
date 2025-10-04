import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { container } from 'tsyringe';

import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { ExerciseService } from '@/features/exercise/services/ExerciseService';
import { useAggregateCache } from '@/shared/hooks/useAggregateCache';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import type { ExerciseData } from '@/shared/types';
import { exercisesToDomain } from '@/shared/utils/transformations';

/**
 * Standard CRUD operations for exercises using shared patterns.
 *
 * This hook provides basic create, read, update, delete operations
 * for exercises following the established architectural patterns.
 * Uses the repository pattern and follows React Query best practices.
 *
 * @param profileId - The profile ID to scope operations
 * @returns Standard CRUD operations and data access
 */
export function useExerciseCRUD(profileId: string) {
  const queryClient = useQueryClient();
  const exerciseService = container.resolve(ExerciseService);
  const queryService = container.resolve(ExerciseQueryService);
  const { warmCache, invalidatePattern } = useAggregateCache();

  // Get all exercises for the profile
  const exercisesQuery = profileId ? queryService.getAllExercises(profileId) : null;
  const {
    data: exercises = [],
    isObserving: isLoading,
    error,
  } = useObserveQuery(exercisesQuery, {
    transform: exercisesToDomain,
    enabled: !!profileId,
  });

  // Get single exercise by ID
  const getExercise = (exerciseId: string) => {
    return useQuery({
      queryKey: ['exercise', exerciseId],
      queryFn: async () => {
        const result = await exerciseService.getExerciseById(exerciseId);
        if (result.isError()) {
          throw result.error;
        }
        return result.value.toData();
      },
      enabled: !!exerciseId,
    });
  };

  // Create exercise mutation
  const createExercise = useMutation({
    mutationFn: async (input: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await exerciseService.createExercise(input);
      if (result.isError()) {
        throw result.error;
      }
      return result.value.toData();
    },
    onSuccess: () => {
      // Invalidate exercises list
      queryClient.invalidateQueries({ queryKey: ['exercises', profileId] });
      invalidatePattern(['exercises', profileId]);
    },
  });

  // Update exercise mutation
  const updateExercise = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ExerciseData> }) => {
      const result = await exerciseService.updateExercise(id, input);
      if (result.isError()) {
        throw result.error;
      }
      return result.value.toData();
    },
    onSuccess: (updatedExercise) => {
      // Update specific exercise cache
      queryClient.setQueryData(['exercise', updatedExercise.id], updatedExercise);
      // Invalidate exercises list
      queryClient.invalidateQueries({ queryKey: ['exercises', profileId] });
      invalidatePattern(['exercises', profileId]);
    },
  });

  // Delete exercise mutation
  const deleteExercise = useMutation({
    mutationFn: async (exerciseId: string) => {
      const result = await exerciseService.deleteExercise(exerciseId);
      if (result.isError()) {
        throw result.error;
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['exercise', deletedId] });
      // Invalidate exercises list
      queryClient.invalidateQueries({ queryKey: ['exercises', profileId] });
      invalidatePattern(['exercises', profileId]);
    },
  });

  return {
    // Data
    exercises,

    // Individual exercise getter
    getExercise,

    // Loading states
    isLoading,
    isCreating: createExercise.isPending,
    isUpdating: updateExercise.isPending,
    isDeleting: deleteExercise.isPending,

    // Error states
    error,
    createError: createExercise.error,
    updateError: updateExercise.error,
    deleteError: deleteExercise.error,

    // Operations
    create: createExercise.mutateAsync,
    update: (id: string, input: Partial<ExerciseData>) => updateExercise.mutateAsync({ id, input }),
    delete: deleteExercise.mutateAsync,

    // Cache operations
    warmCache: useCallback(
      async (exerciseIds: string[] = []) => {
        const cacheKeys = [['exercises', profileId]];

        // Add exercise-specific cache keys
        exerciseIds.forEach((exerciseId) => {
          cacheKeys.push(['exercise', exerciseId]);
        });

        await warmCache(cacheKeys);
      },
      [profileId, warmCache]
    ),

    invalidateCache: useCallback(() => {
      invalidatePattern(['exercises', profileId]);
    }, [profileId, invalidatePattern]),

    // Utility functions
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', profileId] });
    },
  };
}

export type UseExerciseCRUDResult = ReturnType<typeof useExerciseCRUD>;
