import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { PageHeader } from '@/shared/components/PageHeader';
import { VirtualizedCardList } from '@/shared/components/VirtualizedCardList';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(8), // Space for FAB
  minHeight: '100vh',
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: theme.zIndex.speedDial,
}));

const WorkoutCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

interface WorkoutHistoryItem {
  id: string;
  trainingPlanName: string;
  sessionName: string;
  startTime: number;
  endTime?: number;
  durationSeconds?: number;
  totalVolume?: number;
  notes?: string;
  userRating?: number;
  createdAt: number;
  updatedAt: number;
}

interface HistoryPageDemoProps {
  workouts?: WorkoutHistoryItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
}

/**
 * Demo version of HistoryPage for Storybook that accepts mock data as props.
 * This version doesn't use database hooks and is safe for browser environments.
 */
export const HistoryPageDemo: React.FC<HistoryPageDemoProps> = ({
  workouts = [],
  isLoading = false,
  isError = false,
  error = null,
  isEmpty = false,
}) => {
  const { t } = useTranslation();

  // Handle workout creation
  const handleStartWorkout = () => {
    console.log('Start workout clicked');
  };

  // Handle workout item click
  const handleWorkoutClick = (workout: WorkoutHistoryItem) => {
    console.log('Workout clicked:', workout.id);
  };

  // Render individual workout card
  const renderWorkoutItem = (workout: WorkoutHistoryItem, index: number) => {
    const startDate = new Date(workout.startTime);
    const duration = workout.durationSeconds
      ? `${Math.floor(workout.durationSeconds / 60)}m ${workout.durationSeconds % 60}s`
      : t('workout.inProgress', 'In Progress');

    return (
      <WorkoutCard
        key={workout.id}
        onClick={() => handleWorkoutClick(workout)}
        data-testid={`workout-history-item-${index}`}
        sx={{ cursor: 'pointer' }}
      >
        <CardContent>
          <Typography variant='h6' component='h3' gutterBottom>
            {workout.sessionName}
          </Typography>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            {workout.trainingPlanName}
          </Typography>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}
          >
            <Typography variant='caption' color='text.secondary'>
              {startDate.toLocaleDateString()}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {duration}
            </Typography>
          </Box>
          {workout.totalVolume && (
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
              {t('workout.totalVolume', 'Total Volume')}: {workout.totalVolume}kg
            </Typography>
          )}
          {workout.userRating && (
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
              {t('workout.rating', 'Rating')}:{' '}
              {Array.from({ length: workout.userRating }, (_, i) => '⭐').join('')}
            </Typography>
          )}
        </CardContent>
      </WorkoutCard>
    );
  };

  // Loading skeleton for VirtualizedCardList
  const renderLoadingSkeleton = () => (
    <Box sx={{ mb: 2 }}>
      <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 2 }} />
    </Box>
  );

  // Empty state component
  const renderEmptyState = () => (
    <EmptyState
      icon='FitnessCenter'
      title={t('history.empty.title', 'No workout history')}
      description={t(
        'history.empty.description',
        'Start your first workout to see your progress here'
      )}
      actionLabel={t('history.empty.action', 'Start Workout')}
      onAction={handleStartWorkout}
      data-testid='history-empty-state'
    />
  );

  // Page-level error handling
  if (isError && error) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.history.title', 'Workout History')}
          subtitle={t('pages.history.subtitle', 'Track your fitness journey')}
        />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='history-page-error'
        />
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='history-page'>
        <PageHeader
          title={t('pages.history.title', 'Workout History')}
          subtitle={t('pages.history.subtitle', 'Track your fitness journey')}
          data-testid='history-page-header'
        />

        <VirtualizedCardList
          items={workouts}
          renderCard={renderWorkoutItem}
          getItemKey={(item) => item.id}
          estimateSize={150}
          getSearchableText={(item) =>
            `${item.sessionName} ${item.trainingPlanName} ${item.notes || ''}`
          }
          isLoading={isLoading}
          searchPlaceholder={t('history.search.placeholder', 'Search workout history...')}
          emptyState={
            isEmpty || workouts.length === 0
              ? {
                  title: t('history.empty.title', 'No workout history'),
                  description: t(
                    'history.empty.description',
                    'Start your first workout to see your progress here'
                  ),
                  action: undefined,
                }
              : undefined
          }
          data-testid='history-page-list'
        />
      </StyledContainer>

      {/* Floating Action Button for Starting Workouts */}
      <StyledFab
        color='primary'
        aria-label={t('workout.start.button', 'Start Workout')}
        onClick={handleStartWorkout}
        data-testid='history-page-start-fab'
      >
        <AddIcon />
      </StyledFab>
    </>
  );
};
