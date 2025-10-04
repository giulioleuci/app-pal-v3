import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { WorkoutService } from '@/features/workout/services/WorkoutService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { workoutLogsToDomain } from '@/shared/utils/transformations';

export interface CalendarDay {
  date: Date;
  hasWorkout: boolean;
  hasScheduledWorkout: boolean;
  workoutCount: number;
  scheduledWorkouts: ScheduledWorkout[];
  completedWorkouts: WorkoutSummary[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export interface ScheduledWorkout {
  id: string;
  planId: string;
  planName: string;
  sessionId: string;
  sessionName: string;
  scheduledDate: Date;
  isCompleted: boolean;
}

export interface WorkoutSummary {
  id: string;
  name: string;
  duration: number;
  completedAt: Date;
}

interface UseWorkoutCalendarResult {
  calendarData: CalendarDay[];
  scheduledWorkouts: ScheduledWorkout[];
  workoutHistory: WorkoutSummary[];
  addScheduledWorkout: (date: Date, planId: string, sessionId?: string) => Promise<void>;
  removeScheduledWorkout: (scheduledWorkoutId: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook for calendar view of workout planning and history.
 *
 * Provides calendar-organized workout data for scheduling interfaces, combining
 * historical workout data with future scheduled workouts. Enables users to view
 * their workout patterns over time and schedule future training sessions.
 *
 * @param profileId The profile ID to get calendar data for
 * @param month The month to display (0-11, where 0 = January)
 * @param year The year to display
 * @returns Object with calendar data and scheduling functions
 *
 * @example
 * ```typescript
 * const {
 *   calendarData,
 *   addScheduledWorkout,
 *   removeScheduledWorkout
 * } = useWorkoutCalendar(profileId, 2, 2024); // March 2024
 *
 * // Schedule a workout
 * const handleScheduleWorkout = async (date: Date, planId: string) => {
 *   await addScheduledWorkout(date, planId);
 * };
 *
 * return (
 *   <Calendar>
 *     {calendarData.map(day => (
 *       <CalendarDay
 *         key={day.date.toISOString()}
 *         day={day}
 *         onScheduleWorkout={handleScheduleWorkout}
 *       />
 *     ))}
 *   </Calendar>
 * );
 * ```
 */
export function useWorkoutCalendar(
  profileId: string,
  month: number,
  year: number
): UseWorkoutCalendarResult {
  const workoutService = container.resolve(WorkoutService);
  const workoutQueryService = container.resolve(WorkoutQueryService);
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);

  // Calculate date range for the calendar month
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month
    return { startDate: start, endDate: end };
  }, [year, month]);

  // Get workout history for the month
  const workoutHistoryQuery = profileId
    ? workoutQueryService.getWorkoutLogs(profileId, {
        dateRange: {
          from: startDate,
          to: endDate,
        },
      })
    : null;
  const { data: workouts, isObserving: workoutsObserving } = useObserveQuery(workoutHistoryQuery, {
    transform: workoutLogsToDomain,
    enabled: !!profileId,
  });

  // Get scheduled workouts (this would need to be implemented in the service layer)
  // For now, we'll use an empty array as a placeholder
  const scheduledWorkouts: ScheduledWorkout[] = useMemo(() => {
    // This would typically come from a scheduled workout service/query
    return [];
  }, []);

  // Generate calendar data
  const calendarData = useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the first day of the month and calculate calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOfCalendar = new Date(firstDay);
    startOfCalendar.setDate(startOfCalendar.getDate() - firstDay.getDay()); // Start from Sunday

    const endOfCalendar = new Date(lastDay);
    const daysToAdd = 6 - lastDay.getDay();
    endOfCalendar.setDate(endOfCalendar.getDate() + daysToAdd); // End on Saturday

    // Create workout lookup maps
    const workoutsByDate = new Map<string, WorkoutSummary[]>();
    const scheduledByDate = new Map<string, ScheduledWorkout[]>();

    // Process completed workouts
    if (workouts) {
      workouts
        .filter((workout) => workout.endTime)
        .forEach((workout) => {
          const dateKey = workout.endTime!.toDateString();
          const summary: WorkoutSummary = {
            id: workout.id,
            name: workout.getDisplayName(),
            duration: workout.getDurationInMinutes() || 0,
            completedAt: workout.endTime!,
          };

          if (workoutsByDate.has(dateKey)) {
            workoutsByDate.get(dateKey)!.push(summary);
          } else {
            workoutsByDate.set(dateKey, [summary]);
          }
        });
    }

    // Process scheduled workouts
    scheduledWorkouts.forEach((scheduled) => {
      const dateKey = scheduled.scheduledDate.toDateString();
      if (scheduledByDate.has(dateKey)) {
        scheduledByDate.get(dateKey)!.push(scheduled);
      } else {
        scheduledByDate.set(dateKey, [scheduled]);
      }
    });

    // Generate calendar days
    const currentDate = new Date(startOfCalendar);
    while (currentDate <= endOfCalendar) {
      const dateKey = currentDate.toDateString();
      const completedWorkouts = workoutsByDate.get(dateKey) || [];
      const dayScheduledWorkouts = scheduledByDate.get(dateKey) || [];

      const calendarDay: CalendarDay = {
        date: new Date(currentDate),
        hasWorkout: completedWorkouts.length > 0,
        hasScheduledWorkout: dayScheduledWorkouts.length > 0,
        workoutCount: completedWorkouts.length,
        scheduledWorkouts: dayScheduledWorkouts,
        completedWorkouts,
        isToday: currentDate.toDateString() === today.toDateString(),
        isCurrentMonth: currentDate.getMonth() === month,
      };

      days.push(calendarDay);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [workouts, scheduledWorkouts, year, month]);

  // Get workout history summaries for the month
  const workoutHistory = useMemo(() => {
    if (!workouts) return [];

    return workouts
      .filter((workout) => workout.endTime)
      .map((workout) => ({
        id: workout.id,
        name: workout.getDisplayName(),
        duration: workout.getDurationInMinutes() || 0,
        completedAt: workout.endTime!,
      }))
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }, [workouts]);

  /**
   * Adds a scheduled workout to a specific date
   */
  const addScheduledWorkout = useCallback(
    async (date: Date, planId: string, sessionId?: string): Promise<void> => {
      try {
        // This would need to be implemented in the WorkoutService
        console.log('Would schedule workout:', { date, planId, sessionId });

        // Implementation would:
        // 1. Validate the plan and session exist
        // 2. Create a scheduled workout entry
        // 3. Store in the database
        // 4. Potentially set up notifications
      } catch (_error) {
        console.error('Error scheduling workout:', _error);
        throw error;
      }
    },
    []
  );

  /**
   * Removes a scheduled workout
   */
  const removeScheduledWorkout = useCallback(async (scheduledWorkoutId: string): Promise<void> => {
    try {
      // This would need to be implemented in the WorkoutService
      console.log('Would remove scheduled workout:', scheduledWorkoutId);

      // Implementation would:
      // 1. Find the scheduled workout by ID
      // 2. Remove from database
      // 3. Cancel any associated notifications
    } catch (_error) {
      console.error('Error removing scheduled workout:', _error);
      throw error;
    }
  }, []);

  return {
    calendarData,
    scheduledWorkouts,
    workoutHistory,
    addScheduledWorkout,
    removeScheduledWorkout,
    isLoading: !workoutsObserving,
  };
}
