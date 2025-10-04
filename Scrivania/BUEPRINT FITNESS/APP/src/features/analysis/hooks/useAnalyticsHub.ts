import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { AnalysisService } from '@/features/analysis/services/AnalysisService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useAggregateCache } from '@/shared/hooks/useAggregateCache';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  exerciseIds?: string[];
  includeBodyWeight?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  includeCharts?: boolean;
  includeRawData?: boolean;
}

/**
 * Comprehensive analytics and reporting aggregate hook.
 *
 * This hook provides a unified interface for:
 * - Volume, frequency, strength, and weight progress analysis
 * - Comprehensive report generation
 * - Data export in multiple formats
 * - Chart-ready data formatting
 * - Progress calculations and trends
 *
 * Consolidates 7+ analysis hooks into a single, cohesive API while
 * providing optimized data fetching and caching.
 *
 * @param profileId - The profile ID for scoping operations
 * @param filters - Default filters for analysis queries
 * @returns Comprehensive analytics and reporting interface
 */
export function useAnalyticsHub(profileId: string, defaultFilters?: AnalyticsFilters) {
  const analysisService = container.resolve(AnalysisService);
  const { warmCache, invalidatePattern } = useAggregateCache();

  // Volume Analysis
  const volumeAnalysis = useQuery({
    queryKey: ['analysis', 'volume', profileId, defaultFilters?.dateRange],
    queryFn: () =>
      analysisService.getVolumeAnalysis({
        profileId,
        dateRange: defaultFilters?.dateRange || getDefaultDateRange(),
      }),
    enabled: !!profileId,
  });

  // Frequency Analysis
  const frequencyAnalysis = useQuery({
    queryKey: ['analysis', 'frequency', profileId, defaultFilters?.dateRange],
    queryFn: () =>
      analysisService.getFrequencyAnalysis({
        profileId,
        dateRange: defaultFilters?.dateRange || getDefaultDateRange(),
      }),
    enabled: !!profileId,
  });

  // Weight Progress Analysis
  const weightProgress = useQuery({
    queryKey: ['analysis', 'weight-progress', profileId, defaultFilters?.dateRange],
    queryFn: () =>
      analysisService.getWeightProgress({
        profileId,
        dateRange: defaultFilters?.dateRange || getDefaultDateRange(),
      }),
    enabled: !!profileId,
  });

  // Dynamic strength progress for specific exercises
  const getStrengthProgress = useCallback(
    (exerciseId: string, dateRange?: DateRange) => {
      return useQuery({
        queryKey: ['analysis', 'strength-progress', profileId, exerciseId, dateRange],
        queryFn: () =>
          analysisService.getStrengthProgress({
            profileId,
            exerciseId,
            dateRange: dateRange || defaultFilters?.dateRange || getDefaultDateRange(),
          }),
        enabled: !!profileId && !!exerciseId,
      });
    },
    [profileId, analysisService, defaultFilters]
  );

  // Chart data formatting
  const chartData = useMemo(() => {
    const volumeData = volumeAnalysis.data;
    const frequencyData = frequencyAnalysis.data;
    const weightData = weightProgress.data;

    return {
      volume: formatVolumeChartData(volumeData),
      frequency: formatFrequencyChartData(frequencyData),
      weight: formatWeightChartData(weightData),
      combined: formatCombinedChartData(volumeData, frequencyData, weightData),
    };
  }, [volumeAnalysis.data, frequencyAnalysis.data, weightProgress.data]);

  // Full report generation (potentially slow operation)
  const generateFullReport = useMutation({
    mutationFn: async (filters: AnalyticsFilters) => {
      return await analysisService.generateFullReport({
        profileId,
        ...filters,
      });
    },
  });

  // Data export functionality
  const exportData = useMutation({
    mutationFn: async (options: ExportOptions & { filters?: AnalyticsFilters }) => {
      const filters = options.filters || defaultFilters || { dateRange: getDefaultDateRange() };
      return await analysisService.exportAnalyticsData({
        profileId,
        format: options.format,
        includeCharts: options.includeCharts,
        includeRawData: options.includeRawData,
        ...filters,
      });
    },
  });

  // Progress calculations and insights
  const insights = useMemo(() => {
    const volume = volumeAnalysis.data;
    const frequency = frequencyAnalysis.data;
    const weight = weightProgress.data;

    if (!volume || !frequency || !weight) {
      return {
        volumeTrend: 'unknown',
        frequencyTrend: 'unknown',
        weightTrend: 'unknown',
        overallProgress: 'insufficient_data',
        recommendations: [],
      };
    }

    return calculateProgressInsights(volume, frequency, weight);
  }, [volumeAnalysis.data, frequencyAnalysis.data, weightProgress.data]);

  // Quick analysis functions
  const quickAnalysis = useMemo(
    () => ({
      getWeeklyVolume: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return analysisService.getVolumeAnalysis({
          profileId,
          dateRange: { from: weekAgo, to: new Date() },
        });
      },

      getMonthlyProgress: () => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return analysisService.getFrequencyAnalysis({
          profileId,
          dateRange: { from: monthAgo, to: new Date() },
        });
      },

      compareToLastMonth: async () => {
        const thisMonth = getDateRange('thisMonth');
        const lastMonth = getDateRange('lastMonth');

        const [thisMonthData, lastMonthData] = await Promise.all([
          analysisService.getVolumeAnalysis({ profileId, dateRange: thisMonth }),
          analysisService.getVolumeAnalysis({ profileId, dateRange: lastMonth }),
        ]);

        return compareAnalysisData(thisMonthData, lastMonthData);
      },
    }),
    [profileId, analysisService]
  );

  return {
    // Core analysis data
    volume: volumeAnalysis,
    frequency: frequencyAnalysis,
    weightProgress,

    // Dynamic queries
    getStrengthProgress,

    // Chart data
    charts: chartData,

    // Insights and recommendations
    insights,

    // Operations
    generateReport: generateFullReport,
    export: exportData,
    quickAnalysis,

    // Loading states
    isLoadingAnalysis:
      volumeAnalysis.isLoading || frequencyAnalysis.isLoading || weightProgress.isLoading,
    isGeneratingReport: generateFullReport.isPending,
    isExporting: exportData.isPending,

    // Error states
    analysisError: volumeAnalysis.error || frequencyAnalysis.error || weightProgress.error,
    reportError: generateFullReport.error,
    exportError: exportData.error,

    // Data refresh
    refetch: useCallback(() => {
      volumeAnalysis.refetch();
      frequencyAnalysis.refetch();
      weightProgress.refetch();
    }, [volumeAnalysis, frequencyAnalysis, weightProgress]),

    // Cache operations
    warmCache: useCallback(
      async (dateRanges: DateRange[] = []) => {
        const cacheKeys = [
          ['analysis', 'volume', profileId],
          ['analysis', 'frequency', profileId],
          ['analysis', 'weight-progress', profileId],
        ];

        // Add date-range specific cache keys
        dateRanges.forEach((range) => {
          cacheKeys.push(['analysis', 'volume', profileId, range]);
          cacheKeys.push(['analysis', 'frequency', profileId, range]);
          cacheKeys.push(['analysis', 'weight-progress', profileId, range]);
        });

        await warmCache(cacheKeys);
      },
      [profileId, warmCache]
    ),

    invalidateCache: useCallback(() => {
      invalidatePattern(['analysis', profileId]);
    }, [profileId, invalidatePattern]),
  };
}

// Helper functions
function getDefaultDateRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3); // Last 3 months
  return { from, to };
}

function getDateRange(period: 'thisMonth' | 'lastMonth'): DateRange {
  const now = new Date();

  if (period === 'thisMonth') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: now,
    };
  } else {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      from: lastMonth,
      to: new Date(now.getFullYear(), now.getMonth(), 0), // Last day of last month
    };
  }
}

function formatVolumeChartData(data: any) {
  if (!data?.dataPoints) return [];
  return data.dataPoints.map((point: any) => ({
    x: point.date,
    y: point.totalVolume,
    label: `${point.totalVolume} kg`,
  }));
}

function formatFrequencyChartData(data: any) {
  if (!data?.dataPoints) return [];
  return data.dataPoints.map((point: any) => ({
    x: point.date,
    y: point.sessionCount,
    label: `${point.sessionCount} sessions`,
  }));
}

function formatWeightChartData(data: any) {
  if (!data?.dataPoints) return [];
  return data.dataPoints.map((point: any) => ({
    x: point.date,
    y: point.weight,
    label: `${point.weight} kg`,
  }));
}

function formatCombinedChartData(volume: any, frequency: any, weight: any) {
  // Combine multiple metrics into a single chart dataset
  const combined = [];

  if (volume?.dataPoints) {
    combined.push({
      name: 'Volume',
      data: formatVolumeChartData(volume),
      color: '#2196F3',
    });
  }

  if (frequency?.dataPoints) {
    combined.push({
      name: 'Frequency',
      data: formatFrequencyChartData(frequency),
      color: '#4CAF50',
    });
  }

  return combined;
}

function calculateProgressInsights(volume: any, frequency: any, weight: any) {
  const recommendations = [];

  // Simple trend analysis (can be enhanced with more sophisticated algorithms)
  const volumeTrend = volume?.trend || 'stable';
  const frequencyTrend = frequency?.trend || 'stable';
  const weightTrend = weight?.trend || 'stable';

  if (volumeTrend === 'decreasing') {
    recommendations.push('Consider increasing training intensity or volume');
  }

  if (frequencyTrend === 'decreasing') {
    recommendations.push('Try to maintain consistent training frequency');
  }

  if (weightTrend === 'decreasing' && volume?.trend === 'increasing') {
    recommendations.push("Great progress! You're building muscle while losing weight");
  }

  return {
    volumeTrend,
    frequencyTrend,
    weightTrend,
    overallProgress: calculateOverallProgress(volumeTrend, frequencyTrend, weightTrend),
    recommendations,
  };
}

function calculateOverallProgress(volume: string, frequency: string, weight: string): string {
  const positive = [volume, frequency, weight].filter((trend) => trend === 'increasing').length;
  const negative = [volume, frequency, weight].filter((trend) => trend === 'decreasing').length;

  if (positive > negative) return 'improving';
  if (negative > positive) return 'declining';
  return 'stable';
}

function compareAnalysisData(current: any, previous: any) {
  if (!current || !previous) return null;

  return {
    volumeChange: (
      ((current.totalVolume - previous.totalVolume) / previous.totalVolume) *
      100
    ).toFixed(1),
    frequencyChange: (
      ((current.totalSessions - previous.totalSessions) / previous.totalSessions) *
      100
    ).toFixed(1),
    improvement: current.totalVolume > previous.totalVolume,
  };
}

/**
 * Type definition for the useAnalyticsHub hook return value
 */
export type UseAnalyticsHubResult = ReturnType<typeof useAnalyticsHub>;
