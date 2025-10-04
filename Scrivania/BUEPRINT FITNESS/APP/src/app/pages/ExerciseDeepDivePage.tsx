import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useParams } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useExercisePerformanceOverview } from '@/features/exercise/hooks/useExercisePerformanceOverview';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  minHeight: '100vh',
}));

const StyledExerciseHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
}));

const StyledChartCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledChartContent = styled(CardContent)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
});

const StyledChartArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  minHeight: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  border: `2px dashed ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
}));

const StyledMetricsList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const StyledMetricItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
}));

/**
 * Exercise Deep Dive page component providing comprehensive performance analytics
 * for a specific exercise across time.
 *
 * This component implements the Data-First Design Protocol by using the
 * useExercisePerformanceOverview hook to fetch exercise-specific performance data
 * and renders it in a responsive grid of chart components.
 *
 * Features:
 * - Exercise details display (name, description)
 * - Responsive grid of performance charts
 * - Volume progression over time
 * - Performance metrics analysis
 * - Error handling and loading states
 * - Back navigation to exercise list
 *
 * @returns The rendered exercise deep dive page
 */
export function ExerciseDeepDivePage(): React.ReactElement {
  const { t } = useAppTranslation();
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const activeProfileId = useActiveProfileId();

  // Data-First Design Protocol: Exercise Performance Overview
  const { exerciseDetails, volumeHistory, performanceMetrics, isLoading, isError, error, refetch } =
    useExercisePerformanceOverview(exerciseId!, activeProfileId);

  // Set page title with exercise name when available
  const exerciseName = exerciseDetails?.name || t('pages.exerciseDeepDive.defaultTitle');
  usePageTitle('exercise-deep-dive', exerciseName);

  // Page-Level Error Handling Protocol
  if (isError && error) {
    return (
      <StyledContainer maxWidth='lg'>
        <ErrorDisplay
          error={error}
          onRetry={refetch}
          title={t('pages.exerciseDeepDive.loadingError')}
          data-testid='exercise-deep-dive-error-display'
        />
      </StyledContainer>
    );
  }

  // Loading state with skeletons
  if (isLoading) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.exerciseDeepDive.defaultTitle')}
          showBackButton={true}
          icon={<Icon name='fitness_center' />}
        />

        <StyledExerciseHeader>
          <Skeleton variant='text' width='60%' height={40} />
          <Skeleton variant='text' width='80%' height={24} sx={{ mt: 1 }} />
        </StyledExerciseHeader>

        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((index) => (
            <Grid item xs={12} md={6} key={index}>
              <StyledChartCard>
                <CardContent>
                  <Skeleton variant='text' height={32} />
                  <Skeleton variant='rectangular' height={300} sx={{ mt: 2 }} />
                </CardContent>
              </StyledChartCard>
            </Grid>
          ))}
        </Grid>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth='lg'>
      <PageHeader
        title={exerciseName}
        showBackButton={true}
        icon={<Icon name='fitness_center' />}
        data-testid='exercise-deep-dive-page-header'
      />

      {/* Exercise Details Section */}
      {exerciseDetails && (
        <StyledExerciseHeader data-testid='exercise-details-header'>
          <Typography variant='h4' component='h1' gutterBottom>
            {exerciseDetails.name}
          </Typography>
          {exerciseDetails.description && (
            <Typography variant='body1' color='text.secondary'>
              {exerciseDetails.description}
            </Typography>
          )}
        </StyledExerciseHeader>
      )}

      {/* Responsive Charts Grid */}
      <Grid container spacing={3} data-testid='exercise-charts-grid'>
        {/* Volume History Chart */}
        <Grid item xs={12} md={6}>
          <StyledChartCard data-testid='volume-history-chart'>
            <StyledChartContent>
              <Typography variant='h6' gutterBottom>
                {t('pages.exerciseDeepDive.charts.volumeHistory.title')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('pages.exerciseDeepDive.charts.volumeHistory.description')}
              </Typography>

              <StyledChartArea>
                {volumeHistory ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant='body2' color='text.secondary'>
                      {t('pages.exerciseDeepDive.charts.placeholder.volumeChart')}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    {t('pages.exerciseDeepDive.charts.noData')}
                  </Typography>
                )}
              </StyledChartArea>
            </StyledChartContent>
          </StyledChartCard>
        </Grid>

        {/* Performance Metrics Chart */}
        <Grid item xs={12} md={6}>
          <StyledChartCard data-testid='performance-metrics-chart'>
            <StyledChartContent>
              <Typography variant='h6' gutterBottom>
                {t('pages.exerciseDeepDive.charts.performanceMetrics.title')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('pages.exerciseDeepDive.charts.performanceMetrics.description')}
              </Typography>

              <StyledChartArea>
                {performanceMetrics ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Icon name='analytics' sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                    <Typography variant='body2' color='text.secondary'>
                      {t('pages.exerciseDeepDive.charts.placeholder.performanceChart')}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    {t('pages.exerciseDeepDive.charts.noData')}
                  </Typography>
                )}
              </StyledChartArea>
            </StyledChartContent>
          </StyledChartCard>
        </Grid>

        {/* Strength Progression Chart */}
        <Grid item xs={12} md={6}>
          <StyledChartCard data-testid='strength-progression-chart'>
            <StyledChartContent>
              <Typography variant='h6' gutterBottom>
                {t('pages.exerciseDeepDive.charts.strengthProgression.title')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('pages.exerciseDeepDive.charts.strengthProgression.description')}
              </Typography>

              <StyledChartArea>
                <Box sx={{ textAlign: 'center' }}>
                  <Icon name='trending_up' sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant='body2' color='text.secondary'>
                    {t('pages.exerciseDeepDive.charts.placeholder.strengthChart')}
                  </Typography>
                </Box>
              </StyledChartArea>
            </StyledChartContent>
          </StyledChartCard>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12} md={6}>
          <StyledChartCard data-testid='performance-summary-card'>
            <StyledChartContent>
              <Typography variant='h6' gutterBottom>
                {t('pages.exerciseDeepDive.summary.title')}
              </Typography>

              {performanceMetrics ? (
                <StyledMetricsList data-testid='performance-metrics-list'>
                  <StyledMetricItem>
                    <Typography variant='body2'>
                      {t('pages.exerciseDeepDive.summary.metrics.totalVolume')}
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {performanceMetrics.totalVolume || 0} kg
                    </Typography>
                  </StyledMetricItem>

                  <StyledMetricItem>
                    <Typography variant='body2'>
                      {t('pages.exerciseDeepDive.summary.metrics.personalBest')}
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {performanceMetrics.personalBest || 0} kg
                    </Typography>
                  </StyledMetricItem>

                  <StyledMetricItem>
                    <Typography variant='body2'>
                      {t('pages.exerciseDeepDive.summary.metrics.totalSessions')}
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {performanceMetrics.totalSessions || 0}
                    </Typography>
                  </StyledMetricItem>

                  <StyledMetricItem>
                    <Typography variant='body2'>
                      {t('pages.exerciseDeepDive.summary.metrics.averageVolume')}
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {performanceMetrics.averageVolume || 0} kg
                    </Typography>
                  </StyledMetricItem>
                </StyledMetricsList>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  {t('pages.exerciseDeepDive.summary.noMetrics')}
                </Typography>
              )}
            </StyledChartContent>
          </StyledChartCard>
        </Grid>
      </Grid>
    </StyledContainer>
  );
}
