import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { AnalysisQueryService } from '@/features/analysis/query-services/AnalysisQueryService';
import {
  FrequencyAnalysisData,
  StrengthProgressData,
  VolumeAnalysisData,
  WeightProgressData,
} from '@/features/analysis/services/AnalysisService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Calculates an overall performance score based on all analysis data.
 */
function calculatePerformanceScore(
  volumeAnalysis: EnhancedVolumeAnalysisData,
  frequencyAnalysis: EnhancedFrequencyAnalysisData,
  weightProgress: EnhancedWeightProgressData,
  strengthProgress: EnhancedStrengthProgressData[]
): number {
  // Simple performance score calculation based on multiple factors
  let score = 0;

  // Volume consistency (0-3 points)
  score += Math.min(3, volumeAnalysis.volumeConsistency * 3);

  // Frequency adherence (0-3 points)
  score += Math.min(3, frequencyAnalysis.adherenceScore * 3);

  // Weight progress consideration (0-2 points)
  if (weightProgress.trend === 'increasing' || weightProgress.trend === 'stable') {
    score += 2;
  } else if (Math.abs(weightProgress.changePercentage) < 5) {
    score += 1;
  }

  // Average strength improvement (0-2 points)
  const avgImprovement =
    strengthProgress.reduce((sum, p) => sum + (p.improvementPercentage || 0), 0) /
    Math.max(1, strengthProgress.length);
  score += Math.min(2, avgImprovement / 10);

  return Math.round(score * 10) / 10;
}

/**
 * Generates key insights based on analysis data.
 */
function generateKeyInsights(
  volumeAnalysis: EnhancedVolumeAnalysisData,
  frequencyAnalysis: EnhancedFrequencyAnalysisData,
  weightProgress: EnhancedWeightProgressData,
  strengthProgress: EnhancedStrengthProgressData[]
): string[] {
  const insights: string[] = [];

  // Strength progress insights
  if (strengthProgress.length > 0) {
    const avgImprovement =
      strengthProgress.reduce((sum, p) => sum + (p.improvementPercentage || 0), 0) /
      strengthProgress.length;
    if (avgImprovement > 10) {
      insights.push(`Excellent strength gains averaging ${avgImprovement.toFixed(1)}% improvement`);
    } else if (avgImprovement > 5) {
      insights.push(
        `Good strength progress with ${avgImprovement.toFixed(1)}% average improvement`
      );
    }
  }

  // Frequency insights
  if (frequencyAnalysis.adherenceScore > 0.8) {
    insights.push(
      `Highly consistent workout frequency with ${Math.round(frequencyAnalysis.adherenceScore * 100)}% adherence`
    );
  } else if (frequencyAnalysis.currentStreak > 7) {
    insights.push(`Currently on a ${frequencyAnalysis.currentStreak}-day workout streak`);
  }

  // Volume insights
  if (volumeAnalysis.volumeProgression.length > 1) {
    const firstVolume = volumeAnalysis.volumeProgression[0].volume;
    const lastVolume =
      volumeAnalysis.volumeProgression[volumeAnalysis.volumeProgression.length - 1].volume;
    const progressionPercentage = ((lastVolume - firstVolume) / firstVolume) * 100;
    if (progressionPercentage > 15) {
      insights.push(`Strong volume progression with ${progressionPercentage.toFixed(1)}% increase`);
    }
  }

  // Weight progress insights
  if (Math.abs(weightProgress.changePercentage) > 2) {
    const direction = weightProgress.changePercentage > 0 ? 'gained' : 'lost';
    insights.push(
      `Body weight ${direction} ${Math.abs(weightProgress.totalChange).toFixed(1)}kg over the period`
    );
  }

  return insights.length > 0 ? insights : ['Steady progress maintained throughout the period'];
}

/**
 * Generates recommendations based on analysis data.
 */
function generateRecommendations(
  volumeAnalysis: EnhancedVolumeAnalysisData,
  frequencyAnalysis: EnhancedFrequencyAnalysisData,
  weightProgress: EnhancedWeightProgressData,
  strengthProgress: EnhancedStrengthProgressData[]
): string[] {
  const recommendations: string[] = [];

  // Volume recommendations
  if (volumeAnalysis.volumeConsistency < 0.7) {
    recommendations.push('Focus on maintaining more consistent training volumes week-to-week');
  }

  // Frequency recommendations
  if (frequencyAnalysis.adherenceScore < 0.7) {
    recommendations.push('Improve workout consistency to maximize training adaptations');
  } else if (frequencyAnalysis.averageWorkoutsPerWeek > 6) {
    recommendations.push('Consider incorporating more rest days to prevent overtraining');
  }

  // Strength progress recommendations
  if (strengthProgress.some((p) => (p.improvementPercentage || 0) < 2)) {
    recommendations.push(
      'Consider progressive overload strategies for exercises showing minimal improvement'
    );
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Continue current training approach - results show good progress');
    recommendations.push('Consider setting new challenging goals to maintain motivation');
  }

  return recommendations;
}

/**
 * Enhances basic strength progress data with calculated metrics.
 */
function enhanceStrengthProgress(data: StrengthProgressData): EnhancedStrengthProgressData {
  const progressPoints = data.data.map((point) => ({
    date: point.date,
    value: point.oneRepMax,
    volume: point.oneRepMax * 10, // Estimated volume
  }));

  const firstValue = progressPoints[0]?.value || 0;
  const lastValue = progressPoints[progressPoints.length - 1]?.value || 0;
  const totalImprovement = lastValue - firstValue;
  const improvementPercentage = firstValue > 0 ? (totalImprovement / firstValue) * 100 : 0;

  const volumeChanges = progressPoints
    .slice(1)
    .map((point, index) => point.volume - progressPoints[index].volume);
  const averageVolumeIncrease =
    volumeChanges.length > 0
      ? volumeChanges.reduce((sum, change) => sum + change, 0) / volumeChanges.length
      : 0;

  const consistencyScore = Math.max(0, Math.min(1, improvementPercentage / 20));

  return {
    ...data,
    progressPoints,
    totalImprovement,
    improvementPercentage,
    averageVolumeIncrease,
    consistencyScore,
  };
}

/**
 * Enhances basic weight progress data with calculated metrics.
 */
function enhanceWeightProgress(data: WeightProgressData): EnhancedWeightProgressData {
  const progressPoints = data.data.map((point) => ({
    date: point.date,
    weight: point.weight,
  }));

  const firstWeight = progressPoints[0]?.weight || 0;
  const lastWeight = progressPoints[progressPoints.length - 1]?.weight || 0;
  const totalChange = lastWeight - firstWeight;
  const changePercentage = firstWeight > 0 ? (totalChange / firstWeight) * 100 : 0;

  const weeks = progressPoints.length > 1 ? progressPoints.length - 1 : 1;
  const averageWeeklyChange = totalChange / weeks;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(changePercentage) > 1) {
    trend = changePercentage > 0 ? 'increasing' : 'decreasing';
  }

  return {
    progressPoints,
    totalChange,
    changePercentage,
    averageWeeklyChange,
    trend,
  };
}

/**
 * Enhances basic volume analysis data with calculated metrics.
 */
function enhanceVolumeAnalysis(data: VolumeAnalysisData): EnhancedVolumeAnalysisData {
  const averageVolumePerWorkout =
    data.totalWorkouts > 0 ? data.totalVolume / data.totalWorkouts : 0;

  // Mock muscle group distribution for now
  const volumeByMuscleGroup = {
    chest: Math.round(data.totalVolume * 0.3),
    back: Math.round(data.totalVolume * 0.25),
    legs: Math.round(data.totalVolume * 0.35),
    shoulders: Math.round(data.totalVolume * 0.1),
  };

  // Generate mock volume progression
  const volumeProgression = Array.from({ length: 4 }, (_, index) => ({
    date: new Date(data.timeRange.startDate.getTime() + index * 7 * 24 * 60 * 60 * 1000),
    volume: averageVolumePerWorkout + index * 100,
  }));

  const peakVolumeWeek = volumeProgression.reduce((peak, current) =>
    current.volume > peak.volume ? current : peak
  ).date;

  // Calculate consistency based on volume variation
  const volumes = volumeProgression.map((v) => v.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
  const stdDev = Math.sqrt(variance);
  const volumeConsistency = Math.max(0, Math.min(1, 1 - stdDev / avgVolume));

  return {
    ...data,
    averageVolumePerWorkout,
    volumeByMuscleGroup,
    volumeProgression,
    peakVolumeWeek,
    volumeConsistency,
  };
}

/**
 * Enhances basic frequency analysis data with calculated metrics.
 */
function enhanceFrequencyAnalysis(data: FrequencyAnalysisData): EnhancedFrequencyAnalysisData {
  const averageWorkoutsPerWeek = data.workoutsPerWeek;

  // Mock streak calculations
  const longestStreak = Math.min(14, data.totalWorkouts);
  const currentStreak = Math.min(7, data.totalWorkouts);

  // Mock frequency by day distribution
  const frequencyByDay = {
    monday: Math.floor(data.totalWorkouts * 0.2),
    tuesday: Math.floor(data.totalWorkouts * 0.15),
    wednesday: Math.floor(data.totalWorkouts * 0.2),
    thursday: Math.floor(data.totalWorkouts * 0.15),
    friday: Math.floor(data.totalWorkouts * 0.2),
    saturday: Math.floor(data.totalWorkouts * 0.1),
    sunday: 0,
  };

  const restDayPattern = averageWorkoutsPerWeek <= 5 ? 'regular' : 'irregular';
  const adherenceScore = data.consistencyScore;

  return {
    ...data,
    averageWorkoutsPerWeek,
    longestStreak,
    currentStreak,
    frequencyByDay,
    restDayPattern,
    adherenceScore,
  };
}

/**
 * Input type for generating a full report.
 */
export type GenerateFullReportInput = {
  profileId: string;
  startDate: Date;
  endDate: Date;
  exerciseIds?: string[];
};

/**
 * Complete analysis report containing all metrics.
 */
/**
 * Enhanced strength progress data with calculated metrics.
 */
export interface EnhancedStrengthProgressData extends StrengthProgressData {
  progressPoints: Array<{
    date: Date;
    value: number;
    volume: number;
  }>;
  totalImprovement: number;
  improvementPercentage: number;
  averageVolumeIncrease: number;
  consistencyScore: number;
}

/**
 * Enhanced weight progress data with calculated metrics.
 */
export interface EnhancedWeightProgressData {
  progressPoints: Array<{
    date: Date;
    weight: number;
  }>;
  totalChange: number;
  changePercentage: number;
  averageWeeklyChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Enhanced volume analysis data with calculated metrics.
 */
export interface EnhancedVolumeAnalysisData extends VolumeAnalysisData {
  averageVolumePerWorkout: number;
  volumeByMuscleGroup: Record<string, number>;
  volumeProgression: Array<{
    date: Date;
    volume: number;
  }>;
  peakVolumeWeek?: Date;
  volumeConsistency: number;
}

/**
 * Enhanced frequency analysis data with calculated metrics.
 */
export interface EnhancedFrequencyAnalysisData extends FrequencyAnalysisData {
  averageWorkoutsPerWeek: number;
  longestStreak: number;
  currentStreak: number;
  frequencyByDay: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  restDayPattern: 'regular' | 'irregular';
  adherenceScore: number;
}

/**
 * Complete analysis report containing all metrics.
 */
export interface FullAnalysisReport {
  profileId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  strengthProgress: Record<string, EnhancedStrengthProgressData>;
  weightProgress: EnhancedWeightProgressData;
  volumeAnalysis: EnhancedVolumeAnalysisData;
  frequencyAnalysis: EnhancedFrequencyAnalysisData;
  overallSummary: {
    performanceScore: number;
    keyInsights: string[];
    recommendations: string[];
    goals: {
      achieved: number;
      total: number;
    };
  };
  generatedAt: Date;
  processingTime: number;
}

/**
 * React Query mutation hook for generating comprehensive analysis reports.
 *
 * This hook triggers a potentially slow, synchronous task that generates a complete
 * analysis report across multiple metrics. Its `isLoading` state is critical for the UI
 * to display a blocking modal during the long-running operation.
 *
 * The mutation aggregates volume, frequency, weight progress, and strength progress
 * data into a single comprehensive report for the specified time period.
 *
 * @param options Optional React Query mutation configuration options
 * @returns Mutation result with mutate function, loading state, and error information
 */
export function useGenerateFullReport(
  options?: Omit<
    UseMutationOptions<FullAnalysisReport, ApplicationError, GenerateFullReportInput>,
    'mutationFn'
  >
) {
  const analysisQueryService = container.resolve(AnalysisQueryService);

  return useMutation({
    mutationFn: async (input: GenerateFullReportInput): Promise<FullAnalysisReport> => {
      const startTime = Date.now();
      const { profileId, startDate, endDate, exerciseIds = [] } = input;

      // Generate all analysis components in parallel
      const [volumeAnalysis, frequencyAnalysis, weightProgress] = await Promise.all([
        analysisQueryService.getVolumeAnalysis(profileId, startDate, endDate),
        analysisQueryService.getFrequencyAnalysis(profileId, startDate, endDate),
        analysisQueryService.getWeightProgress(profileId, startDate, endDate),
      ]);

      // Generate strength progress for specified exercises
      const strengthProgressList = await Promise.all(
        exerciseIds.map((exerciseId) =>
          analysisQueryService.getStrengthProgress(profileId, exerciseId, startDate, endDate)
        )
      );

      // Enhance all the basic data with calculated metrics
      const enhancedVolumeAnalysis = enhanceVolumeAnalysis(volumeAnalysis);
      const enhancedFrequencyAnalysis = enhanceFrequencyAnalysis(frequencyAnalysis);
      const enhancedWeightProgress = enhanceWeightProgress(weightProgress);

      // Enhance strength progress data and convert to record
      const enhancedStrengthProgressList = strengthProgressList.map(enhanceStrengthProgress);
      const strengthProgress: Record<string, EnhancedStrengthProgressData> = {};
      enhancedStrengthProgressList.forEach((data, index) => {
        strengthProgress[exerciseIds[index]] = data;
      });

      // Generate overall summary based on the enhanced data
      const performanceScore = calculatePerformanceScore(
        enhancedVolumeAnalysis,
        enhancedFrequencyAnalysis,
        enhancedWeightProgress,
        enhancedStrengthProgressList
      );

      const keyInsights = generateKeyInsights(
        enhancedVolumeAnalysis,
        enhancedFrequencyAnalysis,
        enhancedWeightProgress,
        enhancedStrengthProgressList
      );

      const recommendations = generateRecommendations(
        enhancedVolumeAnalysis,
        enhancedFrequencyAnalysis,
        enhancedWeightProgress,
        enhancedStrengthProgressList
      );

      const processingTime = Date.now() - startTime;

      return {
        profileId,
        dateRange: {
          startDate,
          endDate,
        },
        strengthProgress,
        weightProgress: enhancedWeightProgress,
        volumeAnalysis: enhancedVolumeAnalysis,
        frequencyAnalysis: enhancedFrequencyAnalysis,
        overallSummary: {
          performanceScore,
          keyInsights,
          recommendations,
          goals: {
            achieved: Math.floor(performanceScore / 3), // Simple goal calculation
            total: 3,
          },
        },
        generatedAt: new Date(),
        processingTime,
      };
    },
    ...options,
  });
}
