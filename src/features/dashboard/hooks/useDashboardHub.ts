import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { DashboardService } from '@/features/dashboard/services/DashboardService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';
import { useAggregateCache } from '@/shared/hooks/useAggregateCache';

import { useDashboardData } from './useDashboardData';
import { useWorkoutStreak } from './useWorkoutStreak';
import { useWorkoutSummaryCard } from './useWorkoutSummaryCard';

/**
 * Enhanced dashboard hub that extends the existing useDashboardData with additional capabilities.
 *
 * This hook provides a unified interface for:
 * - Core dashboard metrics, activity, and trends (from existing useDashboardData)
 * - Workout streak tracking
 * - Quick action summaries
 * - Goal progress tracking
 * - Motivational insights and recommendations
 * - Dashboard customization preferences
 *
 * Enhances the existing dashboard aggregate with comprehensive dashboard management
 * while maintaining backward compatibility.
 *
 * @returns Enhanced dashboard interface with all dashboard capabilities
 */
export function useDashboardHub() {
  const dashboardService = container.resolve(DashboardService);
  const activeProfileId = useActiveProfileId();
  const { warmCache, invalidatePattern } = useAggregateCache();

  // Core dashboard data (existing aggregate)
  const baseDashboard = useDashboardData();

  // Workout streak data
  const workoutStreak = useWorkoutStreak(activeProfileId || '', { enabled: !!activeProfileId });

  // Workout summary for quick actions
  const workoutSummary = useWorkoutSummaryCard(activeProfileId || '', {
    enabled: !!activeProfileId,
  });

  // Goal progress tracking with caching
  const goalProgress = useQuery({
    queryKey: ['dashboard', 'goal-progress', activeProfileId],
    queryFn: () => dashboardService.getGoalProgress(activeProfileId!),
    enabled: !!activeProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Weekly summary for insights with caching
  const weeklySummary = useQuery({
    queryKey: ['dashboard', 'weekly-summary', activeProfileId],
    queryFn: () => dashboardService.getWeeklySummary(activeProfileId!),
    enabled: !!activeProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Motivational insights based on data
  const insights = useMemo(() => {
    if (!baseDashboard.data || !workoutStreak.data || !goalProgress.data) {
      return {
        message: 'Welcome to your fitness journey!',
        type: 'welcome' as const,
        actionable: false,
      };
    }

    const streak = workoutStreak.data.currentStreak;
    const metrics = baseDashboard.data.metrics;
    const goals = goalProgress.data;

    // Generate insights based on data
    if (streak >= 7) {
      return {
        message: `Amazing! You're on a ${streak}-day workout streak! Keep the momentum going.`,
        type: 'achievement' as const,
        actionable: true,
        action: "Log today's workout to continue your streak",
      };
    }

    if (goals.completionRate > 0.8) {
      return {
        message: `You're crushing your goals! ${Math.round(goals.completionRate * 100)}% completion rate this month.`,
        type: 'success' as const,
        actionable: false,
      };
    }

    if (metrics && metrics.weeklyWorkouts < 2) {
      return {
        message: "You've got this! Try to add one more workout this week.",
        type: 'encouragement' as const,
        actionable: true,
        action: 'Start a quick workout',
      };
    }

    return {
      message: 'Keep up the great work on your fitness journey!',
      type: 'motivation' as const,
      actionable: false,
    };
  }, [baseDashboard.data, workoutStreak.data, goalProgress.data]);

  // Quick actions based on current state
  const quickActions = useMemo(() => {
    const actions = [];

    // Always available actions
    actions.push({
      id: 'start-workout',
      title: 'Start Workout',
      description: 'Begin a new training session',
      priority: 1,
      category: 'workout',
    });

    actions.push({
      id: 'log-weight',
      title: 'Log Weight',
      description: 'Record your current weight',
      priority: 2,
      category: 'metrics',
    });

    // Conditional actions based on data
    if (workoutSummary.data?.hasRecentWorkout) {
      actions.push({
        id: 'repeat-last',
        title: 'Repeat Last Workout',
        description: 'Do the same workout as last time',
        priority: 1,
        category: 'workout',
      });
    }

    if (baseDashboard.data?.progressTrends?.needsMaxLogUpdate) {
      actions.push({
        id: 'log-pr',
        title: 'Log Personal Record',
        description: 'Record a new max lift',
        priority: 3,
        category: 'progress',
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }, [baseDashboard.data, workoutSummary.data]);

  // Dashboard widgets configuration
  const widgetConfig = useMemo(
    () => ({
      metrics: {
        visible: true,
        order: 1,
        size: 'medium' as const,
      },
      streak: {
        visible: true,
        order: 2,
        size: 'small' as const,
      },
      recentActivity: {
        visible: true,
        order: 3,
        size: 'large' as const,
      },
      progressTrends: {
        visible: true,
        order: 4,
        size: 'medium' as const,
      },
      goalProgress: {
        visible: true,
        order: 5,
        size: 'medium' as const,
      },
      quickActions: {
        visible: true,
        order: 6,
        size: 'small' as const,
      },
    }),
    []
  );

  // Performance summary for the current week
  const weeklyPerformance = useMemo(() => {
    if (!weeklySummary.data) return null;

    const data = weeklySummary.data;
    return {
      workoutsCompleted: data.workoutsThisWeek,
      targetWorkouts: data.plannedWorkoutsThisWeek,
      completionRate: data.workoutsThisWeek / Math.max(data.plannedWorkoutsThisWeek, 1),
      totalVolume: data.totalVolumeThisWeek,
      averageIntensity: data.averageIntensityThisWeek,
      improvement: {
        volume: data.volumeChangeFromLastWeek,
        frequency: data.frequencyChangeFromLastWeek,
      },
    };
  }, [weeklySummary.data]);

  // Background refresh with cache warming
  const backgroundRefresh = useCallback(async () => {
    const cacheKeys = [
      ['dashboard', 'goal-progress', activeProfileId],
      ['dashboard', 'weekly-summary', activeProfileId],
      ['workout-streak', activeProfileId],
      ['workout-summary-card', activeProfileId],
    ];

    await warmCache(cacheKeys);
  }, [activeProfileId, warmCache]);

  // Refresh function for manual data updates
  const refresh = useCallback(() => {
    // Trigger refetch of all data
    workoutStreak.refetch();
    workoutSummary.refetch();
    goalProgress.refetch();
    weeklySummary.refetch();
    // Note: baseDashboard has its own refresh mechanism
  }, [workoutStreak, workoutSummary, goalProgress, weeklySummary]);

  return {
    // Core dashboard data (from existing aggregate)
    ...baseDashboard,

    // Enhanced data
    streak: workoutStreak.data || null,
    workoutSummary: workoutSummary.data || null,
    goalProgress: goalProgress.data || null,
    weeklyPerformance,

    // Insights and recommendations
    insights,
    quickActions,

    // Configuration
    widgets: widgetConfig,

    // Enhanced loading states
    isLoadingEnhanced:
      baseDashboard.isLoading ||
      workoutStreak.isLoading ||
      workoutSummary.isLoading ||
      goalProgress.isLoading ||
      weeklySummary.isLoading,

    // Enhanced error states
    enhancedErrors: {
      base: baseDashboard.error,
      streak: workoutStreak.error,
      summary: workoutSummary.error,
      goals: goalProgress.error,
      weekly: weeklySummary.error,
    },

    // Operations
    refresh,
    backgroundRefresh,

    // Status indicators
    hasCompleteData: !!(baseDashboard.data && workoutStreak.data && goalProgress.data),

    dataFreshness: {
      metrics: baseDashboard.data ? 'fresh' : 'stale',
      streak: workoutStreak.data ? 'fresh' : 'stale',
      goals: goalProgress.data ? 'fresh' : 'stale',
    },

    // Cache operations
    warmCache: useCallback(async () => {
      const cacheKeys = [
        ['dashboard', 'goal-progress', activeProfileId],
        ['dashboard', 'weekly-summary', activeProfileId],
        ['workout-streak', activeProfileId],
        ['workout-summary-card', activeProfileId],
      ];

      await warmCache(cacheKeys);
    }, [activeProfileId, warmCache]),

    invalidateCache: useCallback(() => {
      invalidatePattern(['dashboard', activeProfileId]);
      invalidatePattern(['workout-streak', activeProfileId]);
      invalidatePattern(['workout-summary-card', activeProfileId]);
    }, [activeProfileId, invalidatePattern]),
  };
}

/**
 * Type definition for the enhanced dashboard hub return value
 */
export type UseDashboardHubResult = ReturnType<typeof useDashboardHub>;
