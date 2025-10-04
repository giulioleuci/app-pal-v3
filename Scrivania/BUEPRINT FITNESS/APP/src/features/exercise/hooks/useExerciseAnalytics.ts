import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { useAggregateCache } from '@/shared/hooks/useAggregateCache';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import type { ExerciseData } from '@/shared/types';
import { exercisesToDomain } from '@/shared/utils/transformations';

export interface ExerciseStatistics {
  totalExercises: number;
  favoriteCount: number;
  mostUsed: ExerciseData | null;
  muscleGroupDistribution: Record<string, number>;
  equipmentDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  averageUsageFrequency: number;
  lastActivity: Date | null;
}

export interface UsageAnalytics {
  exerciseId: string;
  usageCount: number;
  lastUsed: Date | null;
  frequency: number; // uses per week
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface TrendingExercise extends ExerciseData {
  trendScore: number;
  recentGrowth: number;
  weeklyUsage: number;
}

/**
 * Exercise statistics, usage tracking, and insights.
 *
 * Provides comprehensive analytics for exercise usage patterns,
 * statistics, and trend analysis with intelligent caching.
 *
 * @param profileId - The profile ID to scope analytics
 * @returns Analytics and statistics interface
 */
export function useExerciseAnalytics(profileId: string) {
  const queryService = container.resolve(ExerciseQueryService);
  const { warmCache, invalidatePattern } = useAggregateCache();

  // Get all exercises for analysis
  const exercisesQuery = profileId ? queryService.getAllExercises(profileId) : null;
  const { data: exercises = [] } = useObserveQuery(exercisesQuery, {
    transform: exercisesToDomain,
    enabled: !!profileId,
  });

  // Exercise usage analytics (would come from workout/session data in real app)
  const usageAnalytics = useQuery({
    queryKey: ['exercise-analytics', 'usage', profileId],
    queryFn: async () => {
      // Mock implementation - in real app would query workout sessions
      return exercises.map((exercise) => ({
        exerciseId: exercise.id,
        usageCount: Math.floor(Math.random() * 50),
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        frequency: Math.random() * 3,
        trend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as
          | 'increasing'
          | 'stable'
          | 'decreasing',
      }));
    },
    enabled: !!profileId && exercises.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Comprehensive exercise statistics
  const statistics = useMemo((): ExerciseStatistics => {
    if (!exercises.length) {
      return {
        totalExercises: 0,
        favoriteCount: 0,
        mostUsed: null,
        muscleGroupDistribution: {},
        equipmentDistribution: {},
        categoryDistribution: {},
        difficultyDistribution: {},
        averageUsageFrequency: 0,
        lastActivity: null,
      };
    }

    // Calculate distributions
    const muscleGroups: Record<string, number> = {};
    const equipment: Record<string, number> = {};
    const categories: Record<string, number> = {};
    const difficulties: Record<string, number> = {};

    exercises.forEach((exercise) => {
      // Muscle group distribution
      exercise.primaryMuscleGroups?.forEach((mg) => {
        muscleGroups[mg] = (muscleGroups[mg] || 0) + 1;
      });

      // Equipment distribution
      if (exercise.equipment) {
        equipment[exercise.equipment] = (equipment[exercise.equipment] || 0) + 1;
      }

      // Category distribution
      if (exercise.category) {
        categories[exercise.category] = (categories[exercise.category] || 0) + 1;
      }

      // Difficulty distribution
      if (exercise.difficulty) {
        difficulties[exercise.difficulty] = (difficulties[exercise.difficulty] || 0) + 1;
      }
    });

    // Find most used exercise (mock - would use real usage data)
    const usageData = usageAnalytics.data || [];
    const mostUsedData = usageData.reduce(
      (max, current) => (current.usageCount > max.usageCount ? current : max),
      { usageCount: 0, exerciseId: '' }
    );
    const mostUsed = exercises.find((ex) => ex.id === mostUsedData.exerciseId) || null;

    // Calculate average usage frequency
    const avgFrequency =
      usageData.length > 0
        ? usageData.reduce((sum, usage) => sum + usage.frequency, 0) / usageData.length
        : 0;

    // Find last activity
    const lastActivity = usageData.reduce(
      (latest, usage) => {
        return !latest || (usage.lastUsed && usage.lastUsed > latest) ? usage.lastUsed : latest;
      },
      null as Date | null
    );

    return {
      totalExercises: exercises.length,
      favoriteCount: exercises.filter((ex) => (ex as any).isFavorite).length, // Would be properly typed in real app
      mostUsed,
      muscleGroupDistribution: muscleGroups,
      equipmentDistribution: equipment,
      categoryDistribution: categories,
      difficultyDistribution: difficulties,
      averageUsageFrequency: avgFrequency,
      lastActivity,
    };
  }, [exercises, usageAnalytics.data]);

  // Usage analytics for specific exercise
  const getExerciseUsage = useCallback(
    (exerciseId: string): UsageAnalytics | null => {
      if (!usageAnalytics.data) return null;

      return usageAnalytics.data.find((usage) => usage.exerciseId === exerciseId) || null;
    },
    [usageAnalytics.data]
  );

  // Get usage frequency for specific exercise
  const getUsageFrequency = useCallback(
    (exerciseId: string): number => {
      const usage = getExerciseUsage(exerciseId);
      return usage?.usageCount || 0;
    },
    [getExerciseUsage]
  );

  // Get trending exercises
  const trendingExercises = useMemo((): TrendingExercise[] => {
    if (!usageAnalytics.data || !exercises.length) return [];

    return exercises
      .map((exercise) => {
        const usage = usageAnalytics.data!.find((u) => u.exerciseId === exercise.id);
        if (!usage) return null;

        // Calculate trend score (mock algorithm)
        const trendScore =
          usage.frequency * 2 +
          (usage.trend === 'increasing' ? 10 : usage.trend === 'stable' ? 5 : 0) +
          (usage.usageCount > 10 ? 5 : 0);

        return {
          ...exercise,
          trendScore,
          recentGrowth: usage.trend === 'increasing' ? usage.frequency * 0.3 : 0,
          weeklyUsage: usage.frequency,
        };
      })
      .filter((item): item is TrendingExercise => item !== null)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10);
  }, [exercises, usageAnalytics.data]);

  // Personal best tracking (mock - would integrate with max log data)
  const getPersonalBest = useCallback((exerciseId: string): number | null => {
    // Mock implementation - would query max log data
    return Math.random() > 0.5 ? Math.floor(Math.random() * 200) + 50 : null;
  }, []);

  // Insights generation
  const insights = useMemo(() => {
    const insights = [];

    if (statistics.totalExercises === 0) {
      insights.push({
        type: 'welcome',
        message: 'Start by adding your first exercise!',
        actionable: true,
        action: 'Add Exercise',
      });
    }

    if (statistics.averageUsageFrequency < 1) {
      insights.push({
        type: 'encouragement',
        message: 'Try to use exercises more frequently to build consistency',
        actionable: true,
        action: 'View Recent Exercises',
      });
    }

    if (Object.keys(statistics.muscleGroupDistribution).length < 3) {
      insights.push({
        type: 'suggestion',
        message: 'Consider adding exercises for different muscle groups',
        actionable: true,
        action: 'Browse by Muscle Group',
      });
    }

    if (statistics.mostUsed) {
      insights.push({
        type: 'achievement',
        message: `Your most performed exercise is ${statistics.mostUsed.name}`,
        actionable: false,
      });
    }

    return insights;
  }, [statistics]);

  // Cache warming for analytics data
  const warmAnalyticsCache = useCallback(async () => {
    await warmCache([
      ['exercise-analytics', 'usage', profileId],
      ['exercises', profileId, 'trending'],
      ['exercises', profileId, 'statistics'],
    ]);
  }, [profileId, warmCache]);

  return {
    // Core data
    exercises,
    statistics,
    usageAnalytics: usageAnalytics.data || [],
    trendingExercises,

    // Loading states
    isLoadingAnalytics: usageAnalytics.isLoading,

    // Error states
    analyticsError: usageAnalytics.error,

    // Lookup functions
    getExerciseUsage,
    getUsageFrequency,
    getPersonalBest,

    // Insights
    insights,

    // Operations
    warmCache: warmAnalyticsCache,
    invalidateAnalytics: () => invalidatePattern(['exercise-analytics', profileId]),
    refetch: () => {
      usageAnalytics.refetch();
    },

    // Quick metrics
    hasData: exercises.length > 0,
    isEmpty: exercises.length === 0,
    isActive: statistics.averageUsageFrequency > 1,
  };
}

export type UseExerciseAnalyticsResult = ReturnType<typeof useExerciseAnalytics>;
