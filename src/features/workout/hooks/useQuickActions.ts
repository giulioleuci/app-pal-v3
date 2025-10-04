import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { WorkoutService } from '@/features/workout/services/WorkoutService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { workoutLogsToDomain } from '@/shared/utils/transformations';

export interface QuickLogData {
  exerciseId: string;
  weight: number;
  reps: number;
  sets: number;
  notes?: string;
}

export interface Action {
  id: string;
  type: 'workout_started' | 'exercise_logged' | 'quick_log';
  timestamp: Date;
  description: string;
}

interface UseQuickActionsResult {
  startLastWorkout: () => Promise<string | null>;
  repeatExercise: (exerciseId: string) => Promise<void>;
  quickLog: (data: QuickLogData) => Promise<void>;
  recentActions: Action[];
}

/**
 * Hook for providing one-tap actions for common workout tasks.
 *
 * Simplifies complex multi-step operations into single function calls for improved
 * user experience. Provides quick access to frequently used actions like starting
 * the last workout, repeating exercises, and quick logging without full workflow.
 *
 * @param profileId The profile ID to perform quick actions for
 * @returns Object with quick action functions and recent action history
 *
 * @example
 * ```typescript
 * const { startLastWorkout, repeatExercise, quickLog, recentActions } = useQuickActions(profileId);
 *
 * return (
 *   <Box>
 *     <Button onClick={startLastWorkout}>
 *       Start Last Workout
 *     </Button>
 *     <Button onClick={() => repeatExercise(exerciseId)}>
 *       Repeat Exercise
 *     </Button>
 *     <QuickLogForm onSubmit={quickLog} />
 *   </Box>
 * );
 * ```
 */
export function useQuickActions(profileId: string): UseQuickActionsResult {
  const workoutService = container.resolve(WorkoutService);
  const workoutQueryService = container.resolve(WorkoutQueryService);
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);

  // Get recent workout history
  const recentWorkoutsQuery = profileId
    ? workoutQueryService.getRecentWorkoutHistory(profileId, 5)
    : null;
  const { data: recentWorkouts } = useObserveQuery(recentWorkoutsQuery, {
    transform: workoutLogsToDomain,
    enabled: !!profileId,
  });

  // Track recent actions in memory (could be persisted to storage)
  const recentActions = useMemo((): Action[] => {
    // This would typically be stored in local storage or a service
    // For now, return empty array - could be enhanced with persistence
    return [];
  }, []);

  /**
   * Starts a workout based on the last completed workout
   */
  const startLastWorkout = useCallback(async (): Promise<string | null> => {
    if (!recentWorkouts || recentWorkouts.length === 0) {
      console.warn('No recent workouts found');
      return null;
    }

    try {
      // Get the most recent completed workout
      const lastWorkout = recentWorkouts
        .filter((w) => w.endTime) // Only completed workouts
        .sort((a, b) => {
          const aTime = a.endTime?.getTime() || 0;
          const bTime = b.endTime?.getTime() || 0;
          return bTime - aTime;
        })[0];

      if (!lastWorkout) {
        console.warn('No completed workouts found');
        return null;
      }

      // If the last workout was from a training plan, start from that plan
      if (lastWorkout.trainingPlanId && lastWorkout.sessionId) {
        const newWorkoutId = await workoutService.startWorkoutFromPlan(
          profileId,
          lastWorkout.trainingPlanId,
          lastWorkout.sessionId
        );

        return newWorkoutId;
      } else {
        // Create a custom workout based on the last workout's exercises
        const exerciseData = lastWorkout.getAllExercises().map((exercise) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          plannedSets: exercise.sets.length,
          restTime: 60, // Default rest time
        }));

        // This would need a method in WorkoutService to create workout from exercise list
        console.log('Would create workout from exercises:', exerciseData);

        // For now, return null - this would need implementation in WorkoutService
        return null;
      }
    } catch (_error) {
      console.error('Error starting last workout:', _error);
      return null;
    }
  }, [recentWorkouts, profileId, workoutService]);

  /**
   * Repeats the last performance of a specific exercise
   */
  const repeatExercise = useCallback(
    async (exerciseId: string): Promise<void> => {
      if (!recentWorkouts || recentWorkouts.length === 0) {
        console.warn('No recent workouts found');
        return;
      }

      try {
        // Find the most recent performance of this exercise
        let lastExercisePerformance = null;
        let foundInWorkout = null;

        for (const workout of recentWorkouts) {
          const exerciseLog = workout.getAllExercises().find((ex) => ex.exerciseId === exerciseId);
          if (exerciseLog) {
            lastExercisePerformance = exerciseLog;
            foundInWorkout = workout;
            break;
          }
        }

        if (!lastExercisePerformance || !foundInWorkout) {
          console.warn(`No recent performance found for exercise ${exerciseId}`);
          return;
        }

        // Extract the performance data
        const lastSets = lastExercisePerformance.sets.filter((set) => set.completed);
        console.log(`Would repeat exercise ${exerciseId} with ${lastSets.length} sets:`, lastSets);

        // This could trigger navigation to a quick log form or start a workout
        // For now, just log the action
      } catch (_error) {
        console.error('Error repeating exercise:', _error);
      }
    },
    [recentWorkouts]
  );

  /**
   * Quickly logs exercise performance without full workout context
   */
  const quickLog = useCallback(async (data: QuickLogData): Promise<void> => {
    try {
      // This would create a minimal workout log entry for quick tracking
      console.log('Would quick log:', data);

      // Implementation would:
      // 1. Create a standalone workout log entry
      // 2. Add the exercise performance
      // 3. Mark as completed
      // 4. Potentially update max logs if it's a PR

      // For now, just log the data
    } catch (_error) {
      console.error('Error quick logging exercise:', _error);
    }
  }, []);

  return {
    startLastWorkout,
    repeatExercise,
    quickLog,
    recentActions,
  };
}
