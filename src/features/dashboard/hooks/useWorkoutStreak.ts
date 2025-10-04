import { useMemo } from 'react';
import { container } from 'tsyringe';

import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { workoutLogsToDomain } from '@/shared/utils/transformations';

export interface StreakData {
  date: Date;
  hasWorkout: boolean;
  workoutCount: number;
}

interface UseWorkoutStreakResult {
  currentStreak: number;
  longestStreak: number;
  streakGoal: number;
  daysUntilGoal: number;
  streakHistory: StreakData[];
}

/**
 * Hook for calculating workout consistency streaks and motivation metrics.
 *
 * Analyzes workout frequency patterns from historical data to calculate current
 * and longest streaks. Provides motivational features that encourage consistent
 * workout habits through streak tracking and goal-setting functionality.
 *
 * @param profileId The profile ID to calculate streaks for
 * @param streakGoal Target streak goal in days (default: 30)
 * @returns Object with streak metrics and historical data
 *
 * @example
 * ```typescript
 * const {
 *   currentStreak,
 *   longestStreak,
 *   streakGoal,
 *   daysUntilGoal
 * } = useWorkoutStreak(profileId, 30);
 *
 * return (
 *   <Box>
 *     <Typography variant="h4">{currentStreak} Days</Typography>
 *     <Typography>Current Streak</Typography>
 *     <LinearProgress
 *       value={(currentStreak / streakGoal) * 100}
 *       variant="determinate"
 *     />
 *     <Typography>
 *       {daysUntilGoal} days until goal of {streakGoal}
 *     </Typography>
 *   </Box>
 * );
 * ```
 */
export function useWorkoutStreak(
  profileId: string,
  options?: { streakGoal?: number; enabled?: boolean }
): UseWorkoutStreakResult {
  const { streakGoal = 30, enabled = true } = options || {};
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Memoize date calculations to prevent recreation
  const dateRange = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return {
      from: sixMonthsAgo,
      to: new Date(),
    };
  }, []); // Only calculate once on mount

  const workoutHistoryQuery = profileId && enabled
    ? workoutQueryService.getWorkoutLogs(profileId, { dateRange })
    : null;
  const { data: workouts } = useObserveQuery(workoutHistoryQuery, {
    transform: workoutLogsToDomain,
    enabled: !!(profileId && enabled),
  });

  const streakData = useMemo(() => {
    const defaultResult: UseWorkoutStreakResult = {
      currentStreak: 0,
      longestStreak: 0,
      streakGoal,
      daysUntilGoal: streakGoal,
      streakHistory: [],
    };

    if (!workouts || workouts.length === 0) {
      return defaultResult;
    }

    // Get only completed workouts - single pass filter
    const completedWorkouts = workouts.filter((workout) => workout.endTime);

    if (completedWorkouts.length === 0) {
      return defaultResult;
    }

    // Create a map of workout dates - single pass
    const workoutDates = new Map<string, number>();
    let minDate = new Date();
    let maxDate = new Date(0);

    for (const workout of completedWorkouts) {
      const workoutDate = workout.endTime!;
      const dateKey = workoutDate.toISOString().split('T')[0];
      workoutDates.set(dateKey, (workoutDates.get(dateKey) || 0) + 1);

      if (workoutDate < minDate) minDate = workoutDate;
      if (workoutDate > maxDate) maxDate = workoutDate;
    }

    // Generate only the needed streak history (from first workout to today)
    const streakHistory: StreakData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(Math.min(minDate.getTime(), today.getTime() - 90 * 24 * 60 * 60 * 1000));
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const workoutCount = workoutDates.get(dateKey) || 0;

      streakHistory.push({
        date: new Date(currentDate),
        hasWorkout: workoutCount > 0,
        workoutCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate streaks in single pass
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Working backwards from today for current streak
    for (let i = streakHistory.length - 1; i >= 0; i--) {
      if (streakHistory[i].hasWorkout) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Single pass for longest streak
    for (const day of streakHistory) {
      if (day.hasWorkout) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    const daysUntilGoal = Math.max(0, streakGoal - currentStreak);

    return {
      currentStreak,
      longestStreak,
      streakGoal,
      daysUntilGoal,
      streakHistory,
    };
  }, [workouts, streakGoal]);

  return streakData;
}
