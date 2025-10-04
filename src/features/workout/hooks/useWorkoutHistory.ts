import { useMemo } from 'react';
import { container } from 'tsyringe';

import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { workoutLogsToDomain } from '@/shared/utils/transformations';

export interface WorkoutSummary {
  id: string;
  name: string;
  date: Date;
  duration: number; // in minutes
  exerciseCount: number;
  totalVolume: number;
  averageRPE?: number;
  completionRate: number; // percentage
  userRating?: number;
}

export interface HistoryFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  trainingPlanId?: string;
  exerciseIds?: string[];
  minDuration?: number; // in minutes
  maxDuration?: number;
  minRating?: number;
  maxRating?: number;
}

export interface HistoryStats {
  totalWorkouts: number;
  totalTime: number; // in minutes
  totalVolume: number;
  averageDuration: number;
  averageRating: number;
  mostFrequentExercises: Array<{ exerciseId: string; exerciseName: string; count: number }>;
}

interface UseWorkoutHistoryResult {
  history: WorkoutSummary[];
  searchHistory: (query: string) => WorkoutSummary[];
  filterByDateRange: (start: Date, end: Date) => void;
  historyStats: HistoryStats;
  isLoading: boolean;
}

/**
 * Hook for enhanced workout history with advanced filtering and search capabilities.
 *
 * Provides comprehensive workout history management with sophisticated filtering,
 * text search, and statistical analysis. Essential for large workout databases
 * where users need to find specific workouts quickly and analyze their patterns.
 *
 * @param profileId The profile ID to get workout history for
 * @param filters Optional filters to apply to the history
 * @returns Object with filtered history, search functions, and statistics
 *
 * @example
 * ```typescript
 * const {
 *   history,
 *   searchHistory,
 *   filterByDateRange,
 *   historyStats
 * } = useWorkoutHistory(profileId, {
 *   dateRange: { from: startDate, to: endDate },
 *   minRating: 4
 * });
 *
 * // Search through history
 * const searchResults = searchHistory('bench press');
 *
 * return (
 *   <Box>
 *     <Typography>Total Workouts: {historyStats.totalWorkouts}</Typography>
 *     {history.map(workout => (
 *       <WorkoutCard key={workout.id} summary={workout} />
 *     ))}
 *   </Box>
 * );
 * ```
 */
export function useWorkoutHistory(
  profileId: string,
  filters: HistoryFilters = {}
): UseWorkoutHistoryResult {
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Get all workout history for the profile
  const workoutHistoryQuery = profileId
    ? workoutQueryService.getCompleteWorkoutHistory(profileId)
    : null;
  const { data: allWorkouts, isObserving } = useObserveQuery(workoutHistoryQuery, {
    transform: workoutLogsToDomain,
    enabled: !!profileId,
  });

  // Process and filter workout history
  const processedHistory = useMemo(() => {
    if (!allWorkouts) {
      return {
        history: [],
        historyStats: {
          totalWorkouts: 0,
          totalTime: 0,
          totalVolume: 0,
          averageDuration: 0,
          averageRating: 0,
          mostFrequentExercises: [],
        },
      };
    }

    // Only include completed workouts
    let filteredWorkouts = allWorkouts.filter((workout) => workout.endTime);

    // Apply date range filter
    if (filters.dateRange) {
      filteredWorkouts = filteredWorkouts.filter((workout) => {
        const workoutDate = workout.endTime!;
        return workoutDate >= filters.dateRange!.from && workoutDate <= filters.dateRange!.to;
      });
    }

    // Apply training plan filter
    if (filters.trainingPlanId) {
      filteredWorkouts = filteredWorkouts.filter(
        (workout) => workout.trainingPlanId === filters.trainingPlanId
      );
    }

    // Apply exercise filter
    if (filters.exerciseIds && filters.exerciseIds.length > 0) {
      filteredWorkouts = filteredWorkouts.filter((workout) => {
        const workoutExerciseIds = workout.getAllExercises().map((ex) => ex.exerciseId);
        return filters.exerciseIds!.some((exerciseId) => workoutExerciseIds.includes(exerciseId));
      });
    }

    // Apply duration filters
    if (filters.minDuration || filters.maxDuration) {
      filteredWorkouts = filteredWorkouts.filter((workout) => {
        const duration = workout.getDurationInMinutes();
        if (duration === undefined) return false;

        if (filters.minDuration && duration < filters.minDuration) return false;
        if (filters.maxDuration && duration > filters.maxDuration) return false;

        return true;
      });
    }

    // Apply rating filters
    if (filters.minRating || filters.maxRating) {
      filteredWorkouts = filteredWorkouts.filter((workout) => {
        const rating = workout.userRating;
        if (rating === undefined) return false;

        if (filters.minRating && rating < filters.minRating) return false;
        if (filters.maxRating && rating > filters.maxRating) return false;

        return true;
      });
    }

    // Convert to workout summaries
    const history: WorkoutSummary[] = filteredWorkouts
      .map((workout) => createWorkoutSummary(workout))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first

    // Calculate statistics
    const historyStats = calculateHistoryStats(filteredWorkouts);

    return { history, historyStats };
  }, [allWorkouts, filters]);

  // Search function
  const searchHistory = useMemo(() => {
    return (query: string): WorkoutSummary[] => {
      if (!query.trim() || !allWorkouts) {
        return processedHistory.history;
      }

      const searchTerm = query.toLowerCase();

      return processedHistory.history.filter((summary) => {
        // Search in workout name
        if (summary.name.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in date (formatted)
        const dateString = summary.date.toLocaleDateString().toLowerCase();
        if (dateString.includes(searchTerm)) {
          return true;
        }

        // Could also search in exercise names if available
        return false;
      });
    };
  }, [allWorkouts, processedHistory.history]);

  // Filter by date range function (updates filters)
  const filterByDateRange = useMemo(() => {
    return (start: Date, end: Date) => {
      // This would typically trigger a state update to apply the filter
      // For this implementation, we're returning a function that could be used
      // by the consuming component to update the filters prop
      console.log('Filter by date range:', start, 'to', end);
    };
  }, []);

  return {
    history: processedHistory.history,
    searchHistory,
    filterByDateRange,
    historyStats: processedHistory.historyStats,
    isLoading: !isObserving,
  };
}

/**
 * Creates a workout summary from a full workout log model
 */
function createWorkoutSummary(workout: WorkoutLogModel): WorkoutSummary {
  const duration = workout.getDurationInMinutes() || 0;
  const allSets = workout.getAllSets();
  const completedSets = allSets.filter((set) => set.completed);
  const completionRate = allSets.length > 0 ? (completedSets.length / allSets.length) * 100 : 0;

  return {
    id: workout.id,
    name: workout.getDisplayName(),
    date: workout.endTime || workout.startTime,
    duration,
    exerciseCount: workout.getAllExercises().length,
    totalVolume: workout.calculateTotalVolume(),
    averageRPE: workout.getAverageRPE(),
    completionRate: Math.round(completionRate),
    userRating: workout.userRating,
  };
}

/**
 * Calculates comprehensive statistics from workout history
 */
function calculateHistoryStats(workouts: WorkoutLogModel[]): HistoryStats {
  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalTime: 0,
      totalVolume: 0,
      averageDuration: 0,
      averageRating: 0,
      mostFrequentExercises: [],
    };
  }

  // Calculate basic stats
  const totalWorkouts = workouts.length;
  const totalTime = workouts.reduce((sum, workout) => {
    return sum + (workout.getDurationInMinutes() || 0);
  }, 0);
  const totalVolume = workouts.reduce((sum, workout) => {
    return sum + workout.calculateTotalVolume();
  }, 0);
  const averageDuration = totalTime / totalWorkouts;

  // Calculate average rating
  const workoutsWithRating = workouts.filter((w) => w.userRating !== undefined);
  const averageRating =
    workoutsWithRating.length > 0
      ? workoutsWithRating.reduce((sum, w) => sum + w.userRating!, 0) / workoutsWithRating.length
      : 0;

  // Calculate most frequent exercises
  const exerciseFrequency = new Map<string, { name: string; count: number }>();

  workouts.forEach((workout) => {
    workout.getAllExercises().forEach((exercise) => {
      const current = exerciseFrequency.get(exercise.exerciseId) || {
        name: exercise.exerciseName,
        count: 0,
      };

      current.count++;
      exerciseFrequency.set(exercise.exerciseId, current);
    });
  });

  const mostFrequentExercises = Array.from(exerciseFrequency.entries())
    .map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 most frequent

  return {
    totalWorkouts,
    totalTime: Math.round(totalTime),
    totalVolume: Math.round(totalVolume),
    averageDuration: Math.round(averageDuration),
    averageRating: Math.round(averageRating * 10) / 10,
    mostFrequentExercises,
  };
}
