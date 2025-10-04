import { useMemo } from 'react';
import { container } from 'tsyringe';

import { BodyMetricsQueryService } from '@/features/body-metrics/query-services/BodyMetricsQueryService';
import { DashboardQueryService } from '@/features/dashboard/query-services/DashboardQueryService';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { maxLogsToDomain, workoutLogsToDomain } from '@/shared/utils/transformations';

export interface WorkoutSummary {
  id: string;
  name: string;
  date: Date;
  duration: number;
  exerciseCount: number;
  totalVolume: number;
  averageRPE?: number;
  userRating?: number;
}

export interface WeeklyStats {
  totalWorkouts: number;
  totalTime: number; // in minutes
  totalVolume: number;
  averageRating: number;
  mostFrequentExercises: Array<{ exerciseId: string; exerciseName: string; count: number }>;
  workoutDays: number; // unique days with workouts
}

export interface MonthlyProgress {
  currentMonth: {
    workouts: number;
    totalVolume: number;
    totalTime: number;
  };
  previousMonth: {
    workouts: number;
    totalVolume: number;
    totalTime: number;
  };
  percentageChanges: {
    workouts: number;
    volume: number;
    time: number;
  };
}

interface UseWorkoutSummaryCardResult {
  lastWorkout: WorkoutSummary | null;
  weeklyStats: WeeklyStats;
  monthlyProgress: MonthlyProgress;
  recentPRs: MaxLogModel[];
  isLoading: boolean;
  hasData: boolean;
}

/**
 * Hook for combining dashboard summary card data from multiple sources.
 *
 * Aggregates workout logs, max logs, and body metrics into a unified interface
 * for dashboard summary cards. Eliminates the need for multiple useEffect
 * combinations in components by providing pre-processed dashboard data.
 *
 * @param profileId The profile ID to get summary data for
 * @returns Object with combined dashboard summary data
 *
 * @example
 * ```typescript
 * const {
 *   lastWorkout,
 *   weeklyStats,
 *   monthlyProgress,
 *   recentPRs,
 *   isLoading
 * } = useWorkoutSummaryCard(profileId);
 *
 * return (
 *   <Grid container spacing={3}>
 *     <Grid item xs={12} md={6}>
 *       <LastWorkoutCard workout={lastWorkout} />
 *     </Grid>
 *     <Grid item xs={12} md={6}>
 *       <WeeklyStatsCard stats={weeklyStats} />
 *     </Grid>
 *     <Grid item xs={12} md={6}>
 *       <MonthlyProgressCard progress={monthlyProgress} />
 *     </Grid>
 *     <Grid item xs={12} md={6}>
 *       <RecentPRsCard prs={recentPRs} />
 *     </Grid>
 *   </Grid>
 * );
 * ```
 */
export function useWorkoutSummaryCard(
  profileId: string,
  options?: { enabled?: boolean }
): UseWorkoutSummaryCardResult {
  const { enabled = true } = options || {};
  const workoutQueryService = container.resolve(WorkoutQueryService);
  const maxLogQueryService = container.resolve(MaxLogQueryService);
  const dashboardQueryService = container.resolve(DashboardQueryService);

  // Memoize date calculations
  const dateRange = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      from: thirtyDaysAgo,
      to: new Date(),
    };
  }, []);

  const recentWorkoutsQuery = profileId && enabled
    ? workoutQueryService.getWorkoutLogs(profileId, { dateRange })
    : null;
  const { data: recentWorkouts, isObserving: workoutsObserving } = useObserveQuery(
    recentWorkoutsQuery,
    {
      transform: workoutLogsToDomain,
      enabled: !!(profileId && enabled),
    }
  );

  // Get recent max logs (last 30 days)
  const recentMaxLogsQuery = profileId && enabled
    ? maxLogQueryService.getMaxLogsInDateRange(profileId, dateRange.from, dateRange.to)
    : null;
  const { data: recentMaxLogs, isObserving: maxLogsObserving } = useObserveQuery(
    recentMaxLogsQuery,
    {
      transform: maxLogsToDomain,
      enabled: !!(profileId && enabled),
    }
  );

  // Process all summary data
  const summaryData = useMemo(() => {
    const defaultResult: UseWorkoutSummaryCardResult = {
      lastWorkout: null,
      weeklyStats: {
        totalWorkouts: 0,
        totalTime: 0,
        totalVolume: 0,
        averageRating: 0,
        mostFrequentExercises: [],
        workoutDays: 0,
      },
      monthlyProgress: {
        currentMonth: { workouts: 0, totalVolume: 0, totalTime: 0 },
        previousMonth: { workouts: 0, totalVolume: 0, totalTime: 0 },
        percentageChanges: { workouts: 0, volume: 0, time: 0 },
      },
      recentPRs: [],
      isLoading: false,
      hasData: false,
    };

    if (!recentWorkouts || !recentMaxLogs) {
      return defaultResult;
    }

    // Filter to completed workouts and find last workout in single pass
    const completedWorkouts: typeof recentWorkouts = [];
    let lastWorkoutLog = recentWorkouts[0];
    let lastWorkoutTime = 0;

    for (const workout of recentWorkouts) {
      if (workout.endTime) {
        completedWorkouts.push(workout);
        const time = workout.endTime.getTime();
        if (time > lastWorkoutTime) {
          lastWorkoutTime = time;
          lastWorkoutLog = workout;
        }
      }
    }

    if (completedWorkouts.length === 0) {
      return {
        ...defaultResult,
        recentPRs: recentMaxLogs.slice(0, 5), // Show recent PRs even without workouts
        hasData: recentMaxLogs.length > 0,
      };
    }
    const lastWorkout: WorkoutSummary = {
      id: lastWorkoutLog.id,
      name: lastWorkoutLog.getDisplayName(),
      date: lastWorkoutLog.endTime!,
      duration: lastWorkoutLog.getDurationInMinutes() || 0,
      exerciseCount: lastWorkoutLog.getAllExercises().length,
      totalVolume: lastWorkoutLog.calculateTotalVolume(),
      averageRPE: lastWorkoutLog.getAverageRPE(),
      userRating: lastWorkoutLog.userRating,
    };

    // Calculate weekly stats in single pass (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoTime = weekAgo.getTime();

    const weeklyStats: WeeklyStats = {
      totalWorkouts: 0,
      totalTime: 0,
      totalVolume: 0,
      averageRating: 0,
      mostFrequentExercises: [],
      workoutDays: 0,
    };

    const uniqueDays = new Set<string>();
    const exerciseFrequency = new Map<string, { name: string; count: number }>();
    let ratingSum = 0;
    let ratingCount = 0;

    for (const workout of completedWorkouts) {
      if (workout.endTime!.getTime() >= weekAgoTime) {
        weeklyStats.totalWorkouts++;
        weeklyStats.totalTime += workout.getDurationInMinutes() || 0;
        weeklyStats.totalVolume += workout.calculateTotalVolume();
        uniqueDays.add(workout.endTime!.toDateString());

        if (workout.userRating !== undefined) {
          ratingSum += workout.userRating;
          ratingCount++;
        }

        // Process exercises
        for (const exercise of workout.getAllExercises()) {
          const current = exerciseFrequency.get(exercise.exerciseId);
          if (current) {
            current.count++;
          } else {
            exerciseFrequency.set(exercise.exerciseId, {
              name: exercise.exerciseName,
              count: 1,
            });
          }
        }
      }
    }

    weeklyStats.workoutDays = uniqueDays.size;
    weeklyStats.averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

    // Get top 3 exercises efficiently
    weeklyStats.mostFrequentExercises = Array.from(exerciseFrequency.entries())
      .map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculate monthly progress in single pass
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentMonthStartTime = currentMonthStart.getTime();
    const previousMonthStartTime = previousMonthStart.getTime();
    const previousMonthEndTime = previousMonthEnd.getTime();

    const currentMonth = { workouts: 0, totalVolume: 0, totalTime: 0 };
    const previousMonth = { workouts: 0, totalVolume: 0, totalTime: 0 };

    for (const workout of completedWorkouts) {
      const time = workout.endTime!.getTime();
      const volume = workout.calculateTotalVolume();
      const duration = workout.getDurationInMinutes() || 0;

      if (time >= currentMonthStartTime) {
        currentMonth.workouts++;
        currentMonth.totalVolume += volume;
        currentMonth.totalTime += duration;
      } else if (time >= previousMonthStartTime && time <= previousMonthEndTime) {
        previousMonth.workouts++;
        previousMonth.totalVolume += volume;
        previousMonth.totalTime += duration;
      }
    }

    // Calculate percentage changes
    const percentageChanges = {
      workouts: calculatePercentageChange(previousMonth.workouts, currentMonth.workouts),
      volume: calculatePercentageChange(previousMonth.totalVolume, currentMonth.totalVolume),
      time: calculatePercentageChange(previousMonth.totalTime, currentMonth.totalTime),
    };

    const monthlyProgress: MonthlyProgress = {
      currentMonth,
      previousMonth,
      percentageChanges,
    };

    // Get recent PRs (last 5) - find top 5 without full sort
    const recentPRs = recentMaxLogs
      .slice()
      .sort((a, b) => b.achievedDate.getTime() - a.achievedDate.getTime())
      .slice(0, 5);

    return {
      lastWorkout,
      weeklyStats,
      monthlyProgress,
      recentPRs,
      isLoading: false,
      hasData: true,
    };
  }, [recentWorkouts, recentMaxLogs]);

  return {
    ...summaryData,
    isLoading: !workoutsObserving || !maxLogsObserving,
  };
}

/**
 * Calculates percentage change between two values
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }

  const change = ((newValue - oldValue) / oldValue) * 100;
  return Math.round(change * 10) / 10; // Round to 1 decimal place
}
