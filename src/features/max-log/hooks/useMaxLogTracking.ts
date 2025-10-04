import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { MaxLogService } from '@/features/max-log/services/MaxLogService';
import { useAggregateCache } from '@/shared/hooks/useAggregateCache';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import type { MaxLogData } from '@/shared/types';
import { maxLogsToDomain } from '@/shared/utils/transformations';

export type CreateMaxLogInput = Omit<
  MaxLogData,
  'id' | 'createdAt' | 'updatedAt' | 'estimated1RM' | 'maxBrzycki' | 'maxBaechle'
>;

export type UpdateMaxLogInput = {
  id: string;
} & Partial<Omit<MaxLogData, 'id' | 'createdAt' | 'updatedAt'>>;

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: Date;
  improvement?: {
    previousWeight: number;
    previousDate: Date;
    weightIncrease: number;
    daysBetween: number;
  };
}

export interface MaxLogSummary {
  totalLogs: number;
  personalRecords: PersonalRecord[];
  recentActivity: MaxLogData[];
  strongestExercises: {
    exerciseId: string;
    maxWeight: number;
    estimated1RM: number;
  }[];
  progressTrend: 'improving' | 'stable' | 'declining';
  lastLogDate: Date | null;
}

/**
 * Comprehensive max log management aggregate hook.
 *
 * This hook provides a unified interface for:
 * - Max log CRUD operations (create, update, delete, get)
 * - Personal record tracking and calculations
 * - 1RM calculations (Brzycki, Baechle formulas)
 * - Performance comparisons and trends
 * - Bodyweight ratio calculations
 * - Personal record alerts and notifications
 *
 * Consolidates 13+ individual max-log hooks into a single, cohesive API
 * while providing optimized data fetching and intelligent caching.
 *
 * @param profileId - The profile ID to scope all max log operations
 * @returns Comprehensive max log tracking interface
 */
export function useMaxLogTracking(profileId: string) {
  const queryClient = useQueryClient();
  const maxLogQueryService = container.resolve(MaxLogQueryService);
  const maxLogService = container.resolve(MaxLogService);
  const { warmCache, invalidatePattern } = useAggregateCache();

  // Get all max logs for the profile
  const maxLogsQuery = profileId ? maxLogQueryService.getAllMaxLogs(profileId) : null;
  const { data: maxLogs = [], isObserving: isLoading } = useObserveQuery(maxLogsQuery, {
    transform: maxLogsToDomain,
    enabled: !!profileId,
  });

  // Get max log summary
  const summaryQuery = useQuery({
    queryKey: ['max-logs', profileId, 'summary'],
    queryFn: async () => {
      const result = await maxLogService.getMaxLogSummary(profileId);
      if (result.isError()) {
        throw result.error;
      }
      return result.value;
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create max log mutation
  const createMaxLog = useMutation({
    mutationFn: async (input: CreateMaxLogInput) => {
      const result = await maxLogService.createMaxLog(input);
      if (result.isError()) {
        throw result.error;
      }
      return result.value.toData();
    },
    onSuccess: () => {
      invalidatePattern(['max-logs', profileId]);
    },
  });

  // Update max log mutation
  const updateMaxLog = useMutation({
    mutationFn: async (input: UpdateMaxLogInput) => {
      const result = await maxLogService.updateMaxLog(input.id, input);
      if (result.isError()) {
        throw result.error;
      }
      return result.value.toData();
    },
    onSuccess: (updatedLog) => {
      queryClient.setQueryData(['max-log', updatedLog.id], updatedLog);
      invalidatePattern(['max-logs', profileId]);
    },
  });

  // Delete max log mutation
  const deleteMaxLog = useMutation({
    mutationFn: async (maxLogId: string) => {
      const result = await maxLogService.deleteMaxLog(maxLogId);
      if (result.isError()) {
        throw result.error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ['max-log', deletedId] });
      invalidatePattern(['max-logs', profileId]);
    },
  });

  // Get single max log by ID
  const getMaxLog = useCallback(
    (maxLogId: string) => {
      return useQuery({
        queryKey: ['max-log', maxLogId],
        queryFn: async () => {
          const result = await maxLogService.getMaxLogById(maxLogId);
          if (result.isError()) {
            throw result.error;
          }
          return result.value.toData();
        },
        enabled: !!maxLogId,
      });
    },
    [maxLogService]
  );

  // Personal records calculation
  const personalRecords = useMemo((): PersonalRecord[] => {
    const recordsByExercise = new Map<string, PersonalRecord>();

    maxLogs
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((log) => {
        const current = recordsByExercise.get(log.exerciseId);
        const estimated1RM = log.estimated1RM || calculate1RM(log.weight, log.reps);

        if (!current || estimated1RM > current.estimated1RM) {
          const improvement = current
            ? {
                previousWeight: current.weight,
                previousDate: current.date,
                weightIncrease: log.weight - current.weight,
                daysBetween: Math.floor(
                  (new Date(log.date).getTime() - current.date.getTime()) / (1000 * 60 * 60 * 24)
                ),
              }
            : undefined;

          recordsByExercise.set(log.exerciseId, {
            exerciseId: log.exerciseId,
            weight: log.weight,
            reps: log.reps,
            estimated1RM,
            date: new Date(log.date),
            improvement,
          });
        }
      });

    return Array.from(recordsByExercise.values());
  }, [maxLogs]);

  // Latest max logs by exercise
  const latestByExercise = useMemo(() => {
    const latest = new Map<string, MaxLogData>();

    maxLogs.forEach((log) => {
      const current = latest.get(log.exerciseId);
      if (!current || new Date(log.date) > new Date(current.date)) {
        latest.set(log.exerciseId, log);
      }
    });

    return latest;
  }, [maxLogs]);

  // 1RM calculations (using domain model formulas)
  const calculate1RM = useCallback(
    (weight: number, reps: number, formula: 'brzycki' | 'baechle' = 'brzycki'): number => {
      // This mirrors the domain model calculations for UI convenience
      if (reps === 1) return weight;

      switch (formula) {
        case 'brzycki':
          return weight * (36 / (37 - reps));
        case 'baechle':
          return weight * (1 + reps / 30);
        default:
          return weight * (36 / (37 - reps));
      }
    },
    []
  );

  // Bodyweight ratio calculations
  const calculateBodyweightRatio = useCallback(
    (exerciseWeight: number, bodyweight: number): number => {
      return bodyweight > 0 ? exerciseWeight / bodyweight : 0;
    },
    []
  );

  // Performance comparison
  const comparePerformance = useCallback(
    (exerciseId: string, timeframe: 'week' | 'month' | 'quarter' = 'month') => {
      const now = new Date();
      const cutoffDate = new Date();

      switch (timeframe) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }

      const recentLogs = maxLogs
        .filter((log) => log.exerciseId === exerciseId && new Date(log.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (recentLogs.length < 2) {
        return {
          trend: 'insufficient_data' as const,
          change: 0,
          recent: recentLogs[0] || null,
          previous: null,
        };
      }

      const recent = recentLogs[0];
      const previous = recentLogs[recentLogs.length - 1];
      const recentMax = recent.estimated1RM || calculate1RM(recent.weight, recent.reps);
      const previousMax = previous.estimated1RM || calculate1RM(previous.weight, previous.reps);

      const change = ((recentMax - previousMax) / previousMax) * 100;

      return {
        trend: change > 5 ? 'improving' : change < -5 ? 'declining' : ('stable' as const),
        change,
        recent,
        previous,
      };
    },
    [maxLogs, calculate1RM]
  );

  // Personal record alerts
  const checkForPersonalRecords = useCallback(
    (newMaxLog: MaxLogData): boolean => {
      const currentRecord = personalRecords.find((pr) => pr.exerciseId === newMaxLog.exerciseId);
      const new1RM = newMaxLog.estimated1RM || calculate1RM(newMaxLog.weight, newMaxLog.reps);

      return !currentRecord || new1RM > currentRecord.estimated1RM;
    },
    [personalRecords, calculate1RM]
  );

  // Get strongest exercises
  const strongestExercises = useMemo(() => {
    return personalRecords
      .map((pr) => ({
        exerciseId: pr.exerciseId,
        maxWeight: pr.weight,
        estimated1RM: pr.estimated1RM,
      }))
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .slice(0, 10);
  }, [personalRecords]);

  // Cache warming for max log data
  const warmMaxLogCache = useCallback(
    async (exerciseIds: string[] = []) => {
      const cacheKeys = [
        ['max-logs', profileId],
        ['max-logs', profileId, 'summary'],
        ['max-logs', profileId, 'personal-records'],
      ];

      // Add exercise-specific caches
      exerciseIds.forEach((exerciseId) => {
        cacheKeys.push(['max-logs', profileId, 'by-exercise', exerciseId]);
      });

      await warmCache(cacheKeys);
    },
    [profileId, warmCache]
  );

  return {
    // Core data
    maxLogs,
    personalRecords,
    summary: summaryQuery.data,

    // Latest data by exercise
    getLatestForExercise: (exerciseId: string) => latestByExercise.get(exerciseId) || null,
    strongestExercises,

    // Loading states
    isLoading,
    isSummaryLoading: summaryQuery.isLoading,
    isCreating: createMaxLog.isPending,
    isUpdating: updateMaxLog.isPending,
    isDeleting: deleteMaxLog.isPending,

    // Error states
    error: summaryQuery.error,
    createError: createMaxLog.error,
    updateError: updateMaxLog.error,
    deleteError: deleteMaxLog.error,

    // CRUD operations
    create: createMaxLog.mutateAsync,
    update: updateMaxLog.mutateAsync,
    delete: deleteMaxLog.mutateAsync,
    getById: getMaxLog,

    // Calculations
    calculate1RM,
    calculateBodyweightRatio,

    // Analysis
    comparePerformance,
    checkForPersonalRecords,

    // Cache operations
    warmCache: warmMaxLogCache,
    invalidateCache: () => invalidatePattern(['max-logs', profileId]),

    // Utility functions
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['max-logs', profileId] });
      summaryQuery.refetch();
    },

    // Quick access
    hasData: maxLogs.length > 0,
    isEmpty: maxLogs.length === 0,
    recordCount: personalRecords.length,

    // Recent activity
    recentActivity: maxLogs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),

    // Progress indicators
    progressTrend:
      personalRecords.length > 0
        ? personalRecords.filter((pr) => pr.improvement).length > personalRecords.length * 0.6
          ? 'improving'
          : 'stable'
        : ('insufficient_data' as const),
  };
}

export type UseMaxLogTrackingResult = ReturnType<typeof useMaxLogTracking>;
