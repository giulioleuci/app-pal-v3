import { useMemo } from 'react';
import { container } from 'tsyringe';

import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { maxLogsToDomain, workoutLogsToDomain } from '@/shared/utils/transformations';

export interface ChartDataPoint {
  date: string;
  value: number;
  exerciseId: string;
  exerciseName?: string;
  workoutId?: string;
}

export interface ChartData {
  exerciseId: string;
  exerciseName: string;
  dataPoints: ChartDataPoint[];
  color?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

interface UseProgressChartsResult {
  strengthData: ChartData[];
  volumeData: ChartData[];
  frequencyData: ChartData[];
  isLoading: boolean;
}

/**
 * Hook for providing formatted chart data for progress visualization components.
 *
 * Processes strength, volume, and frequency data into chart-ready format with proper
 * axis labels and series formatting. Designed specifically for integration with chart
 * libraries like Chart.js, Recharts, or D3. Transforms raw workout and max log data
 * into visualization-ready datasets.
 *
 * @param exerciseIds Array of exercise IDs to include in charts
 * @param dateRange Date range filter for chart data
 * @param profileId Profile ID to get data for
 * @returns Object with formatted chart data for different visualization types
 *
 * @example
 * ```typescript
 * const { strengthData, volumeData, frequencyData } = useProgressCharts(
 *   ['exercise1', 'exercise2'],
 *   { from: startDate, to: endDate },
 *   profileId
 * );
 *
 * return (
 *   <Box>
 *     <LineChart data={strengthData} />
 *     <BarChart data={volumeData} />
 *     <AreaChart data={frequencyData} />
 *   </Box>
 * );
 * ```
 */
export function useProgressCharts(
  exerciseIds: string[],
  dateRange: DateRange,
  profileId: string
): UseProgressChartsResult {
  const maxLogQueryService = container.resolve(MaxLogQueryService);
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Get max logs for strength progression
  const maxLogsQuery =
    profileId && exerciseIds.length > 0
      ? maxLogQueryService.getMaxLogsByExercisesInDateRange(profileId, exerciseIds, dateRange)
      : null;
  const { data: maxLogs, isObserving: maxLogsObserving } = useObserveQuery(maxLogsQuery, {
    transform: maxLogsToDomain,
    enabled: !!(profileId && exerciseIds.length > 0),
  });

  // Get workout history for volume and frequency data
  const workoutHistoryQuery = profileId
    ? workoutQueryService.getWorkoutLogs(profileId, { dateRange })
    : null;
  const { data: workouts, isObserving: workoutsObserving } = useObserveQuery(workoutHistoryQuery, {
    transform: workoutLogsToDomain,
    enabled: !!profileId,
  });

  const chartData = useMemo(() => {
    const defaultResult: UseProgressChartsResult = {
      strengthData: [],
      volumeData: [],
      frequencyData: [],
      isLoading: false,
    };

    if (!maxLogs || !workouts) {
      return defaultResult;
    }

    // Generate colors for different exercises
    const colors = [
      '#2196F3',
      '#4CAF50',
      '#FF9800',
      '#9C27B0',
      '#F44336',
      '#00BCD4',
      '#CDDC39',
      '#FF5722',
      '#607D8B',
      '#795548',
    ];

    // Process strength data from max logs
    const strengthDataMap = new Map<string, ChartData>();

    maxLogs
      .filter((maxLog) => exerciseIds.includes(maxLog.exerciseId))
      .forEach((maxLog, index) => {
        const exerciseId = maxLog.exerciseId;

        if (!strengthDataMap.has(exerciseId)) {
          strengthDataMap.set(exerciseId, {
            exerciseId,
            exerciseName: maxLog.exerciseName || `Exercise ${exerciseId}`,
            dataPoints: [],
            color: colors[index % colors.length],
          });
        }

        const dataPoint: ChartDataPoint = {
          date: maxLog.achievedDate.toISOString().split('T')[0], // YYYY-MM-DD format
          value: maxLog.weight,
          exerciseId,
          exerciseName: maxLog.exerciseName,
        };

        strengthDataMap.get(exerciseId)!.dataPoints.push(dataPoint);
      });

    // Sort strength data points by date
    strengthDataMap.forEach((chartData) => {
      chartData.dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const strengthData = Array.from(strengthDataMap.values());

    // Process volume data from workout logs
    const volumeDataMap = new Map<string, ChartData>();
    const dailyVolumeMap = new Map<string, Map<string, number>>(); // exerciseId -> date -> volume

    workouts
      .filter((workout) => workout.endTime) // Only completed workouts
      .forEach((workout) => {
        const workoutDate = workout.endTime!.toISOString().split('T')[0];

        workout
          .getAllExercises()
          .filter((exercise) => exerciseIds.includes(exercise.exerciseId))
          .forEach((exercise) => {
            const exerciseId = exercise.exerciseId;
            const exerciseVolume = exercise.getTotalVolume();

            if (!dailyVolumeMap.has(exerciseId)) {
              dailyVolumeMap.set(exerciseId, new Map());
            }

            const currentVolume = dailyVolumeMap.get(exerciseId)!.get(workoutDate) || 0;
            dailyVolumeMap.get(exerciseId)!.set(workoutDate, currentVolume + exerciseVolume);
          });
      });

    // Convert daily volume to chart data
    dailyVolumeMap.forEach((dateVolumeMap, exerciseId) => {
      const exerciseIndex = exerciseIds.indexOf(exerciseId);
      const dataPoints: ChartDataPoint[] = [];

      dateVolumeMap.forEach((volume, date) => {
        dataPoints.push({
          date,
          value: volume,
          exerciseId,
        });
      });

      // Sort by date
      dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      volumeDataMap.set(exerciseId, {
        exerciseId,
        exerciseName: `Exercise ${exerciseId}`, // Would need exercise names from exercise service
        dataPoints,
        color: colors[exerciseIndex % colors.length],
      });
    });

    const volumeData = Array.from(volumeDataMap.values());

    // Process frequency data (sessions per week)
    const frequencyDataMap = new Map<string, ChartData>();
    const weeklyFrequencyMap = new Map<string, Map<string, number>>(); // exerciseId -> week -> count

    workouts
      .filter((workout) => workout.endTime)
      .forEach((workout) => {
        const workoutDate = workout.endTime!;
        const weekStart = getWeekStartDate(workoutDate);
        const weekKey = weekStart.toISOString().split('T')[0];

        workout
          .getAllExercises()
          .filter((exercise) => exerciseIds.includes(exercise.exerciseId))
          .forEach((exercise) => {
            const exerciseId = exercise.exerciseId;

            if (!weeklyFrequencyMap.has(exerciseId)) {
              weeklyFrequencyMap.set(exerciseId, new Map());
            }

            const currentCount = weeklyFrequencyMap.get(exerciseId)!.get(weekKey) || 0;
            weeklyFrequencyMap.get(exerciseId)!.set(weekKey, currentCount + 1);
          });
      });

    // Convert weekly frequency to chart data
    weeklyFrequencyMap.forEach((weekCountMap, exerciseId) => {
      const exerciseIndex = exerciseIds.indexOf(exerciseId);
      const dataPoints: ChartDataPoint[] = [];

      weekCountMap.forEach((count, weekStart) => {
        dataPoints.push({
          date: weekStart,
          value: count,
          exerciseId,
        });
      });

      // Sort by date
      dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      frequencyDataMap.set(exerciseId, {
        exerciseId,
        exerciseName: `Exercise ${exerciseId}`,
        dataPoints,
        color: colors[exerciseIndex % colors.length],
      });
    });

    const frequencyData = Array.from(frequencyDataMap.values());

    return {
      strengthData,
      volumeData,
      frequencyData,
      isLoading: false,
    };
  }, [maxLogs, workouts, exerciseIds, dateRange]);

  return {
    ...chartData,
    isLoading: !maxLogsObserving || !workoutsObserving,
  };
}

/**
 * Helper function to get the start of the week (Monday) for a given date
 */
function getWeekStartDate(date: Date): Date {
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(date.setDate(diff));
}
