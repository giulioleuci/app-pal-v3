import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { HeightRecordModel, WeightRecordModel } from '@/features/body-metrics/domain';
import { BodyMetricsQueryService } from '@/features/body-metrics/query-services/BodyMetricsQueryService';
import { BodyMetricsService } from '@/features/body-metrics/services/BodyMetricsService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';

export interface AddWeightRecordInput {
  profileId: string;
  weight: number;
  date: Date;
  notes?: string;
}

export interface AddHeightRecordInput {
  profileId: string;
  height: number;
  date: Date;
  notes?: string;
}

export interface UpdateWeightRecordInput {
  id: string;
  weight?: number;
  date?: Date;
  notes?: string;
}

/**
 * Comprehensive body metrics tracking aggregate hook.
 *
 * This hook provides a unified interface for:
 * - Weight and height record management (CRUD operations)
 * - Latest metrics tracking
 * - Historical data and trends
 * - Metric conversions and calculations
 * - Progress analysis
 *
 * Consolidates 9 body-metrics hooks into a single, cohesive API while
 * maintaining reactive data updates through WatermelonDB.
 *
 * @param profileId - The profile ID for scoping operations
 * @returns Comprehensive body metrics tracking interface
 */
export function useBodyMetricsTracking(profileId: string) {
  const bodyMetricsQueryService = container.resolve(BodyMetricsQueryService);
  const bodyMetricsService = container.resolve(BodyMetricsService);
  const queryClient = useQueryClient();

  // Weight data
  const weightHistoryQuery = profileId ? bodyMetricsQueryService.getWeightHistory(profileId) : null;
  const { data: weightHistory = [], isObserving: isLoadingWeights } =
    useObserveQuery<WeightRecordModel>(weightHistoryQuery, { enabled: !!profileId });

  const latestWeightQuery = profileId ? bodyMetricsQueryService.getLatestWeight(profileId) : null;
  const { data: latestWeight } = useObserveQuery<WeightRecordModel>(latestWeightQuery, {
    enabled: !!profileId,
  });

  // Height data
  const heightHistoryQuery = profileId ? bodyMetricsQueryService.getHeightHistory(profileId) : null;
  const { data: heightHistory = [], isObserving: isLoadingHeights } =
    useObserveQuery<HeightRecordModel>(heightHistoryQuery, { enabled: !!profileId });

  // Weight operations
  const addWeightRecord = useMutation({
    mutationFn: async (input: AddWeightRecordInput) => {
      return await bodyMetricsService.addWeightRecord(input);
    },
  });

  const updateWeightRecord = useMutation({
    mutationFn: async (input: UpdateWeightRecordInput) => {
      return await bodyMetricsService.updateWeightRecord(input);
    },
  });

  const deleteWeightRecord = useMutation({
    mutationFn: async (recordId: string) => {
      await bodyMetricsService.deleteWeightRecord(recordId);
    },
  });

  // Height operations
  const addHeightRecord = useMutation({
    mutationFn: async (input: AddHeightRecordInput) => {
      return await bodyMetricsService.addHeightRecord(input);
    },
  });

  const deleteHeightRecord = useMutation({
    mutationFn: async (recordId: string) => {
      await bodyMetricsService.deleteHeightRecord(recordId);
    },
  });

  // Metric conversions
  const conversions = useMemo(
    () => ({
      kgToLbs: (kg: number) => kg * 2.20462,
      lbsToKg: (lbs: number) => lbs / 2.20462,
      cmToFeet: (cm: number) => {
        const inches = cm / 2.54;
        const feet = Math.floor(inches / 12);
        const remainingInches = Math.round(inches % 12);
        return { feet, inches: remainingInches };
      },
      feetToCm: (feet: number, inches: number) => (feet * 12 + inches) * 2.54,
    }),
    []
  );

  // Progress calculations
  const progressAnalysis = useMemo(() => {
    if (weightHistory.length < 2) {
      return {
        trend: 'stable' as const,
        changeAmount: 0,
        changePercentage: 0,
        bmi: null,
        healthStatus: 'unknown' as const,
      };
    }

    const sortedWeights = [...weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstWeight = sortedWeights[0];
    const lastWeight = sortedWeights[sortedWeights.length - 1];
    const changeAmount = lastWeight.weight - firstWeight.weight;
    const changePercentage = (changeAmount / firstWeight.weight) * 100;

    // Calculate BMI if height is available
    let bmi = null;
    let healthStatus: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown' = 'unknown';

    if (heightHistory.length > 0 && latestWeight) {
      const latestHeight = heightHistory[heightHistory.length - 1];
      const heightInMeters = latestHeight.height / 100;
      bmi = latestWeight[0]?.weight / (heightInMeters * heightInMeters);

      if (bmi < 18.5) healthStatus = 'underweight';
      else if (bmi < 25) healthStatus = 'normal';
      else if (bmi < 30) healthStatus = 'overweight';
      else healthStatus = 'obese';
    }

    return {
      trend:
        changeAmount > 1
          ? ('increasing' as const)
          : changeAmount < -1
            ? ('decreasing' as const)
            : ('stable' as const),
      changeAmount: Math.round(changeAmount * 10) / 10,
      changePercentage: Math.round(changePercentage * 10) / 10,
      bmi: bmi ? Math.round(bmi * 10) / 10 : null,
      healthStatus,
    };
  }, [weightHistory, heightHistory, latestWeight]);

  // Recent activity summary
  const recentActivity = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentWeights = weightHistory.filter((w) => new Date(w.date) >= thirtyDaysAgo);

    const recentHeights = heightHistory.filter((h) => new Date(h.date) >= thirtyDaysAgo);

    return {
      weightRecords: recentWeights.length,
      heightRecords: recentHeights.length,
      lastWeightUpdate:
        recentWeights.length > 0 ? recentWeights[recentWeights.length - 1].date : null,
      lastHeightUpdate:
        recentHeights.length > 0 ? recentHeights[recentHeights.length - 1].date : null,
    };
  }, [weightHistory, heightHistory]);

  return {
    // Data queries
    weightHistory,
    heightHistory,
    latestWeight: latestWeight?.[0] || null,
    latestHeight: heightHistory[heightHistory.length - 1] || null,

    // Loading states
    isLoadingWeights,
    isLoadingHeights,

    // Weight operations
    weight: {
      add: addWeightRecord,
      update: updateWeightRecord,
      delete: deleteWeightRecord,
    },

    // Height operations
    height: {
      add: addHeightRecord,
      delete: deleteHeightRecord,
    },

    // Utilities
    conversions,

    // Analysis
    progress: progressAnalysis,
    recentActivity,

    // Mutation states
    isAddingWeight: addWeightRecord.isPending,
    isUpdatingWeight: updateWeightRecord.isPending,
    isDeletingWeight: deleteWeightRecord.isPending,
    isAddingHeight: addHeightRecord.isPending,
    isDeletingHeight: deleteHeightRecord.isPending,

    // Error states
    weightError: addWeightRecord.error || updateWeightRecord.error || deleteWeightRecord.error,
    heightError: addHeightRecord.error || deleteHeightRecord.error,
  };
}

/**
 * Type definition for the useBodyMetricsTracking hook return value
 */
export type UseBodyMetricsTrackingResult = ReturnType<typeof useBodyMetricsTracking>;
