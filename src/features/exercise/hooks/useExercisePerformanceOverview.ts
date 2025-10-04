import { useMemo } from 'react';
import { container } from 'tsyringe';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import {
  exercisesToDomain,
  maxLogsToDomain,
  workoutLogsToDomain,
} from '@/shared/utils/transformations';

export interface ProgressData {
  date: Date;
  value: number;
  type: 'weight' | 'volume' | 'reps';
  workoutId: string;
}

export interface VolumeData {
  date: Date;
  volume: number;
  averageWeight: number;
  totalSets: number;
  workoutId: string;
}

export interface PerformanceMetrics {
  totalSessions: number;
  totalVolume: number;
  averageVolume: number;
  bestSet: {
    weight: number;
    reps: number;
    date: Date;
    workoutId: string;
  } | null;
  currentStreak: number; // consecutive workouts with this exercise
  lastPerformed: Date | null;
  progressTrend: 'improving' | 'declining' | 'stable';
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
}

interface UseExercisePerformanceOverviewResult {
  exerciseData: ExerciseModel | null;
  maxLogs: MaxLogModel[];
  recentWorkouts: WorkoutLogModel[];
  progressTrend: ProgressData[];
  volumeHistory: VolumeData[];
  performanceMetrics: PerformanceMetrics;
  isLoading: boolean;
  hasData: boolean;
}

/**
 * Hook for aggregating comprehensive exercise performance data.
 *
 * Combines exercise details, max logs, and workout history into a unified
 * interface for exercise detail pages. Eliminates the need for multiple
 * separate hook calls by providing pre-processed performance analytics.
 *
 * @param exerciseId The ID of the exercise to analyze
 * @param profileId The profile ID to get performance data for
 * @returns Object with comprehensive exercise performance data
 *
 * @example
 * ```typescript
 * const {
 *   exerciseData,
 *   maxLogs,
 *   recentWorkouts,
 *   progressTrend,
 *   volumeHistory,
 *   performanceMetrics,
 *   isLoading
 * } = useExercisePerformanceOverview(exerciseId, profileId);
 *
 * return (
 *   <Box>
 *     <ExerciseHeader exercise={exerciseData} />
 *     <PerformanceMetricsCard metrics={performanceMetrics} />
 *     <ProgressChart data={progressTrend} />
 *     <VolumeChart data={volumeHistory} />
 *     <MaxLogsTable logs={maxLogs} />
 *     <RecentWorkoutsTable workouts={recentWorkouts} />
 *   </Box>
 * );
 * ```
 */
export function useExercisePerformanceOverview(
  exerciseId: string,
  profileId: string
): UseExercisePerformanceOverviewResult {
  const exerciseQueryService = container.resolve(ExerciseQueryService);
  const maxLogQueryService = container.resolve(MaxLogQueryService);
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Get exercise details
  const exerciseQuery =
    exerciseId && profileId ? exerciseQueryService.getExerciseById(exerciseId) : null;
  const { data: exercises, isObserving: exerciseObserving } = useObserveQuery(exerciseQuery, {
    transform: exercisesToDomain,
    enabled: !!(exerciseId && profileId),
  });

  // Get max logs for this exercise
  const maxLogsQuery =
    exerciseId && profileId ? maxLogQueryService.getMaxLogsByExercise(profileId, exerciseId) : null;
  const { data: maxLogs, isObserving: maxLogsObserving } = useObserveQuery(maxLogsQuery, {
    transform: maxLogsToDomain,
    enabled: !!(exerciseId && profileId),
  });

  // Get workout history containing this exercise (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const workoutHistoryQuery =
    exerciseId && profileId
      ? workoutQueryService.getWorkoutHistoryByExerciseInDateRange(profileId, exerciseId, {
          from: threeMonthsAgo,
          to: new Date(),
        })
      : null;
  const { data: recentWorkouts, isObserving: workoutsObserving } = useObserveQuery(
    workoutHistoryQuery,
    {
      transform: workoutLogsToDomain,
      enabled: !!(exerciseId && profileId),
    }
  );

  // Process all performance data
  const performanceData = useMemo(() => {
    const defaultResult: UseExercisePerformanceOverviewResult = {
      exerciseData: null,
      maxLogs: [],
      recentWorkouts: [],
      progressTrend: [],
      volumeHistory: [],
      performanceMetrics: {
        totalSessions: 0,
        totalVolume: 0,
        averageVolume: 0,
        bestSet: null,
        currentStreak: 0,
        lastPerformed: null,
        progressTrend: 'stable',
        volumeTrend: 'stable',
      },
      isLoading: false,
      hasData: false,
    };

    // Return default if no data
    const exerciseData = exercises?.[0] || null;
    if (!exerciseData || !maxLogs || !recentWorkouts) {
      return {
        ...defaultResult,
        exerciseData,
      };
    }

    // Filter to completed workouts
    const completedWorkouts = recentWorkouts.filter((w) => w.endTime);

    // Calculate progress trend from max logs
    const progressTrend: ProgressData[] = maxLogs
      .sort((a, b) => a.achievedDate.getTime() - b.achievedDate.getTime())
      .map((maxLog) => ({
        date: maxLog.achievedDate,
        value: maxLog.weight,
        type: 'weight' as const,
        workoutId: maxLog.workoutId || '',
      }));

    // Calculate volume history from workouts
    const volumeHistory: VolumeData[] = [];
    const volumeByWorkout = new Map<
      string,
      { date: Date; volume: number; sets: number; totalWeight: number }
    >();

    completedWorkouts.forEach((workout) => {
      let workoutVolumeForExercise = 0;
      let totalWeight = 0;
      let setCount = 0;

      workout
        .getAllExercises()
        .filter((ex) => ex.exerciseId === exerciseId)
        .forEach((exercise) => {
          exercise.sets
            .filter((set) => set.completed && set.weight && set.counts)
            .forEach((set) => {
              workoutVolumeForExercise += set.weight! * set.counts;
              totalWeight += set.weight!;
              setCount++;
            });
        });

      if (workoutVolumeForExercise > 0) {
        volumeByWorkout.set(workout.id, {
          date: workout.endTime!,
          volume: workoutVolumeForExercise,
          sets: setCount,
          totalWeight,
        });
      }
    });

    Array.from(volumeByWorkout.entries()).forEach(([workoutId, data]) => {
      volumeHistory.push({
        date: data.date,
        volume: data.volume,
        averageWeight: data.sets > 0 ? data.totalWeight / data.sets : 0,
        totalSets: data.sets,
        workoutId,
      });
    });

    // Sort volume history by date
    volumeHistory.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate performance metrics
    const totalSessions = volumeHistory.length;
    const totalVolume = volumeHistory.reduce((sum, vh) => sum + vh.volume, 0);
    const averageVolume = totalSessions > 0 ? totalVolume / totalSessions : 0;

    // Find best set from all workouts
    let bestSet: PerformanceMetrics['bestSet'] = null;
    let bestSetValue = 0;

    completedWorkouts.forEach((workout) => {
      workout
        .getAllExercises()
        .filter((ex) => ex.exerciseId === exerciseId)
        .forEach((exercise) => {
          exercise.sets
            .filter((set) => set.completed && set.weight && set.counts)
            .forEach((set) => {
              const setValue = set.weight! * set.counts; // Simple volume calculation
              if (setValue > bestSetValue) {
                bestSetValue = setValue;
                bestSet = {
                  weight: set.weight!,
                  reps: set.counts,
                  date: workout.endTime!,
                  workoutId: workout.id,
                };
              }
            });
        });
    });

    // Calculate current streak (consecutive workouts with this exercise)
    let currentStreak = 0;
    const sortedWorkouts = [...completedWorkouts].sort(
      (a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0)
    );

    for (const workout of sortedWorkouts) {
      const hasExercise = workout.getAllExercises().some((ex) => ex.exerciseId === exerciseId);
      if (hasExercise) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Find last performed date
    const lastPerformed =
      volumeHistory.length > 0 ? volumeHistory[volumeHistory.length - 1].date : null;

    // Calculate trends
    const progressTrendDirection = calculateTrend(progressTrend.map((p) => p.value));
    const volumeTrendDirection = calculateTrend(volumeHistory.map((v) => v.volume));

    const performanceMetrics: PerformanceMetrics = {
      totalSessions,
      totalVolume: Math.round(totalVolume),
      averageVolume: Math.round(averageVolume),
      bestSet,
      currentStreak,
      lastPerformed,
      progressTrend: progressTrendDirection,
      volumeTrend: volumeTrendDirection,
    };

    return {
      exerciseData,
      maxLogs,
      recentWorkouts: completedWorkouts,
      progressTrend,
      volumeHistory,
      performanceMetrics,
      isLoading: false,
      hasData: totalSessions > 0 || maxLogs.length > 0,
    };
  }, [exercises, maxLogs, recentWorkouts, exerciseId]);

  return {
    ...performanceData,
    isLoading: !exerciseObserving || !maxLogsObserving || !workoutsObserving,
  };
}

/**
 * Calculates trend direction from a series of values
 */
function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';

  // Simple linear regression to determine trend
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Determine trend based on slope
  if (Math.abs(slope) < 0.1) return 'stable'; // Very small slope = stable
  return slope > 0 ? 'improving' : 'declining';
}
