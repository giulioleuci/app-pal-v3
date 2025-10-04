import { useMemo } from 'react';
import { container } from 'tsyringe';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { exercisesToDomain, workoutLogsToDomain } from '@/shared/utils/transformations';

interface UseRecentExercisesResult {
  recentExercises: ExerciseModel[];
  lastPerformed: Record<string, Date>;
}

/**
 * Hook for tracking recently used exercises for quick workout building.
 *
 * Provides a list of exercises recently performed by the user, sorted by most recent usage.
 * Includes the last performed date for each exercise to help users quickly identify
 * exercises they've used recently. Essential for convenience features in workout creation.
 *
 * @param profileId The profile ID to get recent exercises for
 * @param limit Maximum number of recent exercises to return (default: 10)
 * @returns Object with recent exercises and their last performed dates
 *
 * @example
 * ```typescript
 * const { recentExercises, lastPerformed } = useRecentExercises(profileId, 8);
 *
 * return (
 *   <Box>
 *     <Typography variant="h6">Recent Exercises</Typography>
 *     {recentExercises.map(exercise => (
 *       <Card key={exercise.id}>
 *         <CardContent>
 *           <Typography>{exercise.name}</Typography>
 *           <Typography variant="caption">
 *             Last performed: {formatDate(lastPerformed[exercise.id])}
 *           </Typography>
 *         </CardContent>
 *       </Card>
 *     ))}
 *   </Box>
 * );
 * ```
 */
export function useRecentExercises(
  profileId: string,
  limit: number = 10
): UseRecentExercisesResult {
  const exerciseQueryService = container.resolve(ExerciseQueryService);
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Get all exercises for the profile
  const exercisesQuery = profileId ? exerciseQueryService.getAllExercises(profileId) : null;
  const { data: allExercises } = useObserveQuery(exercisesQuery, {
    transform: exercisesToDomain,
    enabled: !!profileId,
  });

  // Get recent workout history to determine usage
  const workoutHistoryQuery = profileId
    ? workoutQueryService.getRecentWorkoutHistory(profileId, 50) // Get last 50 workouts
    : null;
  const { data: recentWorkouts } = useObserveQuery(workoutHistoryQuery, {
    transform: workoutLogsToDomain,
    enabled: !!profileId,
  });

  const recentExerciseData = useMemo(() => {
    const defaultResult: UseRecentExercisesResult = {
      recentExercises: [],
      lastPerformed: {},
    };

    if (!allExercises || !recentWorkouts || allExercises.length === 0) {
      return defaultResult;
    }

    // Track exercise usage with last performed dates
    const exerciseUsage = new Map<string, Date>();

    // Process workouts from most recent to oldest
    const sortedWorkouts = recentWorkouts
      .filter((workout) => workout.endTime) // Only completed workouts
      .sort((a, b) => {
        const aTime = a.endTime?.getTime() || 0;
        const bTime = b.endTime?.getTime() || 0;
        return bTime - aTime; // Most recent first
      });

    // Collect exercise usage data
    sortedWorkouts.forEach((workout) => {
      const workoutDate = workout.endTime || workout.startTime;

      workout.getAllExercises().forEach((performedExercise) => {
        const exerciseId = performedExercise.exerciseId;

        // Only update if we haven't seen this exercise yet (keeps most recent date)
        if (!exerciseUsage.has(exerciseId)) {
          exerciseUsage.set(exerciseId, workoutDate);
        }
      });
    });

    // Create sorted list of recent exercises
    const exerciseUsageArray = Array.from(exerciseUsage.entries())
      .map(([exerciseId, lastDate]) => ({
        exerciseId,
        lastDate,
        exercise: allExercises.find((ex) => ex.id === exerciseId),
      }))
      .filter((item) => item.exercise) // Only include exercises that still exist
      .sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime()) // Most recent first
      .slice(0, limit); // Apply limit

    // Extract results
    const recentExercises = exerciseUsageArray.map((item) => item.exercise!).filter(Boolean);

    const lastPerformed: Record<string, Date> = {};
    exerciseUsageArray.forEach((item) => {
      if (item.exercise) {
        lastPerformed[item.exercise.id] = item.lastDate;
      }
    });

    return {
      recentExercises,
      lastPerformed,
    };
  }, [allExercises, recentWorkouts, limit]);

  return recentExerciseData;
}
