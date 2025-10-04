import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  DashboardMetrics,
  ProgressTrends,
  RecentActivity,
} from '@/features/dashboard/services/DashboardService';

/**
 * Props for the DashboardOverview component
 */
export interface DashboardOverviewProps {
  /** Dashboard metrics (workouts, streaks, PRs) */
  metrics?: DashboardMetrics;
  /** Recent activity data (recent workouts and PRs) */
  recentActivity?: RecentActivity;
  /** Progress trends (frequency, strength progress, body weight) */
  progressTrends?: ProgressTrends;
  /** Workout streak data */
  streak?: {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: Date | null;
  } | null;
  /** Weekly performance summary */
  weeklyPerformance?: {
    workoutsCompleted: number;
    targetWorkouts: number;
    completionRate: number;
    totalVolume: number;
    averageIntensity: number;
  } | null;
  /** Motivational insights */
  insights?: {
    message: string;
    type: 'welcome' | 'achievement' | 'success' | 'encouragement' | 'motivation';
    actionable: boolean;
    action?: string;
  };
  /** Quick action buttons */
  quickActions?: Array<{
    id: string;
    title: string;
    description: string;
    priority: number;
    category: string;
  }>;
  /** Loading state */
  isLoading?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Main dashboard overview component.
 * Displays metrics, recent activity, progress trends, and insights.
 * This is a "dumb" component that receives all data via props.
 */
export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  recentActivity,
  progressTrends,
  streak,
  weeklyPerformance,
  insights,
  quickActions,
  isLoading = false,
  'data-testid': testId = 'dashboard-overview',
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Stack spacing={3} data-testid={`${testId}-loading`}>
        <Skeleton variant='rectangular' height={120} />
        <Skeleton variant='rectangular' height={120} />
        <Skeleton variant='rectangular' height={200} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3} data-testid={testId}>
      {/* Insights Section */}
      {insights && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
          data-testid='dashboard-insights'
        >
          <Typography variant='body1' color='text.primary'>
            {insights.message}
          </Typography>
          {insights.actionable && insights.action && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              {insights.action}
            </Typography>
          )}
        </Box>
      )}

      {/* Metrics Section */}
      {metrics && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
          data-testid='dashboard-metrics'
        >
          <Typography variant='h6' gutterBottom>
            {t('dashboard.metrics.title')}
          </Typography>
          <Stack spacing={2} direction='row' flexWrap='wrap'>
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('dashboard.metrics.totalWorkouts')}
              </Typography>
              <Typography variant='h5'>{metrics.totalWorkouts}</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('dashboard.metrics.weeklyWorkouts')}
              </Typography>
              <Typography variant='h5'>{metrics.workoutsThisWeek}</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('dashboard.metrics.currentStreak')}
              </Typography>
              <Typography variant='h5'>{metrics.currentStreak}</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('dashboard.metrics.personalRecords')}
              </Typography>
              <Typography variant='h5'>{metrics.totalPersonalRecords}</Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Streak Section */}
      {streak && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
          data-testid='dashboard-streak'
        >
          <Typography variant='h6' gutterBottom>
            {t('dashboard.streak.title')}
          </Typography>
          <Typography variant='h3' color='primary'>
            {streak.currentStreak}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('dashboard.streak.days')}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            {t('dashboard.streak.longest')}: {streak.longestStreak}
          </Typography>
        </Box>
      )}

      {/* Recent Activity Section */}
      {recentActivity && recentActivity.recentWorkouts.length > 0 && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
          data-testid='dashboard-recent-activity'
        >
          <Typography variant='h6' gutterBottom>
            {t('dashboard.recentActivity.title')}
          </Typography>
          {recentActivity.recentWorkouts.slice(0, 3).map((workout) => (
            <Box
              key={workout.id}
              sx={{
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0 },
              }}
              data-testid='dashboard-workout-item'
            >
              <Typography variant='body1'>{workout.name}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {new Date(workout.startTime).toLocaleDateString()} • {workout.duration} min
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Quick Actions Section */}
      {quickActions && quickActions.length > 0 && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
          data-testid='dashboard-quick-actions'
        >
          <Typography variant='h6' gutterBottom>
            {t('dashboard.quickActions.title')}
          </Typography>
          <Stack spacing={2}>
            {quickActions.slice(0, 4).map((action) => (
              <Box
                key={action.id}
                sx={{
                  p: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                data-testid={`dashboard-quick-action-${action.id}`}
              >
                <Typography variant='body1'>{action.title}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {action.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Weekly Performance Section */}
      {weeklyPerformance && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
          data-testid='dashboard-weekly-performance'
        >
          <Typography variant='h6' gutterBottom>
            {t('dashboard.weeklyPerformance.title')}
          </Typography>
          <Stack spacing={2} direction='row' flexWrap='wrap'>
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('dashboard.weeklyPerformance.completed')}
              </Typography>
              <Typography variant='h6'>
                {weeklyPerformance.workoutsCompleted}/{weeklyPerformance.targetWorkouts}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('dashboard.weeklyPerformance.completionRate')}
              </Typography>
              <Typography variant='h6'>
                {Math.round(weeklyPerformance.completionRate * 100)}%
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('dashboard.weeklyPerformance.totalVolume')}
              </Typography>
              <Typography variant='h6'>{weeklyPerformance.totalVolume}kg</Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};
