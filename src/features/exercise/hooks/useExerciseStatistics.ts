import { useMemo } from 'react';
import { container } from 'tsyringe';

import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { maxLogsToDomain, workoutLogsToDomain } from '@/shared/utils/transformations';

export interface SetRecord {
  weight: number;
  reps: number;
  date: Date;
  workoutId: string;
}

export interface VolumeData {
  date: Date;
  volume: number;
  workoutId: string;
}

export interface FrequencyData {
  month: string;
  year: number;
  sessionCount: number;
}

interface UseExerciseStatisticsResult {
  totalSessions: number;
  averageWeight: number;
  bestSet: SetRecord | null;
  volumeProgression: VolumeData[];
  frequencyByMonth: FrequencyData[];
  lastPerformed: Date | null;
}

/**
 * Hook for comprehensive exercise statistics and performance analytics.
 *
 * Provides detailed statistics for individual exercises using workout logs and max logs.
 * Calculates performance metrics, progression data, and usage frequency for comprehensive
 * exercise analysis. Essential for individual exercise detail pages and progress tracking.
 *
 * @param exerciseId The ID of the exercise to analyze
 * @param profileId The profile ID to get statistics for
 * @returns Object with comprehensive exercise performance analytics
 *
 * @example
 * ```typescript
 * const stats = useExerciseStatistics(exerciseId, profileId);
 *
 * return (
 *   <Box>
 *     <Typography>Total Sessions: {stats.totalSessions}</Typography>
 *     <Typography>Average Weight: {stats.averageWeight}kg</Typography>
 *     {stats.bestSet && (
 *       <Typography>
 *         Best Set: {stats.bestSet.weight}kg × {stats.bestSet.reps}
 *       </Typography>
 *     )}
 *     <VolumeChart data={stats.volumeProgression} />
 *   </Box>
 * );
 * ```
 */
export function useExerciseStatistics(
  exerciseId: string,
  profileId: string
): UseExerciseStatisticsResult {
  const maxLogQueryService = container.resolve(MaxLogQueryService);
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Get max logs for this exercise
  const maxLogsQuery =
    exerciseId && profileId ? maxLogQueryService.getMaxLogsByExercise(profileId, exerciseId) : null;
  const { data: maxLogs } = useObserveQuery(maxLogsQuery, {
    transform: maxLogsToDomain,
    enabled: !!(exerciseId && profileId),
  });

  // Get workout history containing this exercise
  const workoutHistoryQuery = profileId
    ? workoutQueryService.getWorkoutHistoryByExercise(profileId, exerciseId)
    : null;
  const { data: workouts } = useObserveQuery(workoutHistoryQuery, {
    transform: workoutLogsToDomain,
    enabled: !!(exerciseId && profileId),
  });

  const statistics = useMemo(() => {
    const defaultStats: UseExerciseStatisticsResult = {
      totalSessions: 0,
      averageWeight: 0,
      bestSet: null,
      volumeProgression: [],
      frequencyByMonth: [],
      lastPerformed: null,
    };

    if (!workouts || workouts.length === 0) {
      return defaultStats;
    }

    // Filter to completed workouts only
    const completedWorkouts = workouts.filter((workout) => workout.endTime);

    if (completedWorkouts.length === 0) {
      return defaultStats;
    }

    // Collect all sets performed for this exercise
    const allSets: SetRecord[] = [];
    const volumeByWorkout = new Map<string, { date: Date; volume: number; workoutId: string }>();

    completedWorkouts.forEach((workout) => {
      const workoutDate = workout.endTime || workout.startTime;
      let workoutVolumeForExercise = 0;

      // Find all performed exercises matching our target exercise
      workout.getAllExercises().forEach((performedExercise) => {
        if (performedExercise.exerciseId === exerciseId) {
          // Process completed sets
          performedExercise.sets
            .filter((set) => set.completed && set.weight && set.counts)
            .forEach((set) => {
              const setRecord: SetRecord = {
                weight: set.weight!,
                reps: set.counts,
                date: workoutDate,
                workoutId: workout.id,
              };
              allSets.push(setRecord);

              // Add to workout volume
              workoutVolumeForExercise += set.weight! * set.counts;
            });
        }
      });

      // Store workout volume if exercise was performed
      if (workoutVolumeForExercise > 0) {
        volumeByWorkout.set(workout.id, {
          date: workoutDate,
          volume: workoutVolumeForExercise,
          workoutId: workout.id,
        });
      }
    });

    // Calculate total sessions (unique workouts where exercise was performed)
    const totalSessions = volumeByWorkout.size;

    // Calculate average weight from all completed sets
    let averageWeight = 0;
    if (allSets.length > 0) {
      const totalWeight = allSets.reduce((sum, set) => sum + set.weight, 0);
      averageWeight = Math.round((totalWeight / allSets.length) * 10) / 10;
    }

    // Find best set (highest weight × reps combination, prioritizing weight)
    let bestSet: SetRecord | null = null;
    if (allSets.length > 0) {
      bestSet = allSets.reduce((best, current) => {
        // Prioritize weight, then total volume (weight × reps)
        const bestVolume = best.weight * best.reps;
        const currentVolume = current.weight * current.reps;

        if (
          current.weight > best.weight ||
          (current.weight === best.weight && currentVolume > bestVolume)
        ) {
          return current;
        }
        return best;
      });
    }

    // Create volume progression data
    const volumeProgression: VolumeData[] = Array.from(volumeByWorkout.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ date, volume, workoutId }) => ({
        date,
        volume,
        workoutId,
      }));

    // Calculate frequency by month
    const monthlyFrequency = new Map<string, FrequencyData>();
    Array.from(volumeByWorkout.values()).forEach(({ date }) => {
      const year = date.getFullYear();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const key = `${year}-${month}`;

      if (monthlyFrequency.has(key)) {
        monthlyFrequency.get(key)!.sessionCount++;
      } else {
        monthlyFrequency.set(key, {
          month,
          year,
          sessionCount: 1,
        });
      }
    });

    const frequencyByMonth = Array.from(monthlyFrequency.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    // Find last performed date
    const lastPerformed =
      volumeProgression.length > 0 ? volumeProgression[volumeProgression.length - 1].date : null;

    return {
      totalSessions,
      averageWeight,
      bestSet,
      volumeProgression,
      frequencyByMonth,
      lastPerformed,
    };
  }, [workouts, exerciseId]);

  return statistics;
}
