import { useMemo } from 'react';
import { container } from 'tsyringe';

import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { workoutLogsToDomain } from '@/shared/utils/transformations';

interface WorkoutProgressData {
  completedExercises: number;
  totalExercises: number;
  completedSets: number;
  totalSets: number;
  progressPercentage: number;
}

/**
 * Hook for tracking real-time workout completion progress during an active session.
 *
 * Provides live progress calculation for ongoing workouts including exercise completion,
 * set completion, and overall progress percentage for UI progress bars and motivation.
 * Monitors active workout state reactively for immediate UI updates.
 *
 * @param workoutId The ID of the active workout to track progress for
 * @returns Object with detailed progress metrics for UI display
 *
 * @example
 * ```typescript
 * const progress = useWorkoutProgress(activeWorkoutId);
 *
 * return (
 *   <Box>
 *     <LinearProgress
 *       variant="determinate"
 *       value={progress.progressPercentage}
 *     />
 *     <Typography>
 *       {progress.completedExercises}/{progress.totalExercises} exercises
 *     </Typography>
 *     <Typography>
 *       {progress.completedSets}/{progress.totalSets} sets
 *     </Typography>
 *   </Box>
 * );
 * ```
 */
export function useWorkoutProgress(workoutId: string): WorkoutProgressData {
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Get the active workout reactively
  const workoutQuery = workoutId ? workoutQueryService.getWorkoutLog(workoutId) : null;
  const { data: workouts } = useObserveQuery(workoutQuery, {
    transform: workoutLogsToDomain,
    enabled: !!workoutId,
  });

  const progressData = useMemo(() => {
    // Default empty progress state
    const defaultProgress: WorkoutProgressData = {
      completedExercises: 0,
      totalExercises: 0,
      completedSets: 0,
      totalSets: 0,
      progressPercentage: 0,
    };

    // Return default if no workout found
    const workout = workouts?.[0];
    if (!workout) {
      return defaultProgress;
    }

    // Get all exercises and sets from the workout
    const allExercises = workout.getAllExercises();
    const allSets = workout.getAllSets();

    // Calculate exercise completion
    // An exercise is considered complete if all its planned sets are completed
    let completedExercises = 0;
    allExercises.forEach((exercise) => {
      const exerciseSets = exercise.sets;
      const plannedSets = exerciseSets.length;
      const completedSetsCount = exerciseSets.filter((set) => set.completed).length;

      // Consider exercise complete if all sets are done or if it has at least one completed set
      // and no more planned sets (flexible completion criteria)
      if (plannedSets > 0 && completedSetsCount === plannedSets) {
        completedExercises++;
      }
    });

    // Calculate set completion
    const completedSets = allSets.filter((set) => set.completed).length;
    const totalSets = allSets.length;

    // Calculate overall progress percentage
    // Base it on set completion as it's more granular than exercise completion
    let progressPercentage = 0;
    if (totalSets > 0) {
      progressPercentage = Math.round((completedSets / totalSets) * 100);
    }

    return {
      completedExercises,
      totalExercises: allExercises.length,
      completedSets,
      totalSets,
      progressPercentage,
    };
  }, [workouts]);

  return progressData;
}
