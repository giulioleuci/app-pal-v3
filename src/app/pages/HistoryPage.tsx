import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { WorkoutCard } from '@/features/workout/components/WorkoutCard';
import { WorkoutDetailDialog } from '@/features/workout/components/WorkoutDetailDialog';
import { useInfiniteWorkoutHistory } from '@/features/workout/hooks/useInfiniteWorkoutHistory';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { PageHeader } from '@/shared/components/PageHeader';
import { VirtualizedCardList } from '@/shared/components/VirtualizedCardList';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

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

/**
 * Smart page component for browsing workout history with infinite scrolling.
 * Uses the useInfiniteWorkoutHistory hook for data fetching and the VirtualizedCardList
 * component for efficient rendering of large datasets.
 *
 * Features:
 * - Infinite scrolling with virtualization for performance
 * - Page-level error handling with ErrorDisplay component
 * - Global feedback via snackbar notifications
 * - Floating action button for starting new workouts
 * - Contextual onboarding via EmptyState component
 * - Search and filter functionality
 *
 * Follows the Page-Level Error Handling Protocol and Global Feedback Protocol.
 */
export const HistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const activeProfileId = useActiveProfileId();

  // State for workout detail dialog
  const [selectedWorkoutId, setSelectedWorkoutId] = React.useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);

  // Set page title
  usePageTitle('history', t('pages.history.title'));

  // Workout history data fetching
  const {
    data: historyPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteWorkoutHistory(activeProfileId || '', 20);

  // Flatten paginated data for VirtualizedCardList
  const workouts = React.useMemo(() => {
    return historyPages?.pages.flatMap((page) => page.workouts) || [];
  }, [historyPages]);

  // Handle workout creation
  const handleStartWorkout = () => {
    navigate('/workout/start');
    showSuccess(t('workout.actions.started'));
  };

  // Handle view workout details
  const handleViewWorkoutDetails = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setIsDetailDialogOpen(true);
  };

  // Handle edit workout
  const handleEditWorkout = (workoutId: string) => {
    navigate(`/workout/edit/${workoutId}`);
  };

  // Handle close detail dialog
  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedWorkoutId(null);
  };

  // Render individual workout card
  const renderWorkoutItem = (workout: WorkoutHistoryItem, index: number) => {
    return (
      <WorkoutCard
        key={workout.id}
        id={workout.id}
        trainingPlanName={workout.trainingPlanName}
        sessionName={workout.sessionName}
        startTime={workout.startTime}
        endTime={workout.endTime}
        durationSeconds={workout.durationSeconds}
        totalVolume={workout.totalVolume}
        notes={workout.notes}
        userRating={workout.userRating}
        createdAt={workout.createdAt}
        updatedAt={workout.updatedAt}
        onViewDetails={handleViewWorkoutDetails}
        onEditWorkout={handleEditWorkout}
        data-testid={`workout-history-item-${index}`}
      />
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
      title={t('history.empty.title')}
      description={t('history.empty.description')}
      actionLabel={t('history.empty.action')}
      onAction={handleStartWorkout}
      data-testid='history-empty-state'
    />
  );

  // Page-level error handling
  if (isError && error) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.history.title')} subtitle={t('pages.history.subtitle')} />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='history-page-error'
        />
      </StyledContainer>
    );
  }

  // Don't render if no active profile
  if (!activeProfileId) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.history.title')} subtitle={t('pages.history.subtitle')} />
        <ErrorDisplay
          error={new Error(t('profile.noActiveProfile'))}
          data-testid='history-page-no-profile'
        />
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='history-page'>
        <PageHeader
          title={t('pages.history.title')}
          subtitle={t('pages.history.subtitle')}
          data-testid='history-page-header'
        />

        <VirtualizedCardList
          data={workouts}
          renderItem={renderWorkoutItem}
          renderLoadingSkeleton={renderLoadingSkeleton}
          renderEmptyState={renderEmptyState}
          isLoading={isLoading}
          isEmpty={workouts.length === 0}
          searchPlaceholder={t('history.search.placeholder')}
          searchFields={['sessionName', 'trainingPlanName', 'notes']}
          onLoadMore={hasNextPage ? fetchNextPage : undefined}
          isLoadingMore={isFetchingNextPage}
          data-testid='history-page-list'
        />
      </StyledContainer>

      {/* Floating Action Button for Starting Workouts */}
      <StyledFab
        color='primary'
        aria-label={t('workout.start.button')}
        onClick={handleStartWorkout}
        data-testid='history-page-start-fab'
      >
        <AddIcon />
      </StyledFab>

      {/* Workout Detail Dialog */}
      {selectedWorkoutId && (
        <WorkoutDetailDialog
          open={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          sessionName={workouts.find((w) => w.id === selectedWorkoutId)?.sessionName || ''}
          trainingPlanName={
            workouts.find((w) => w.id === selectedWorkoutId)?.trainingPlanName || ''
          }
          startTime={workouts.find((w) => w.id === selectedWorkoutId)?.startTime || 0}
          durationSeconds={workouts.find((w) => w.id === selectedWorkoutId)?.durationSeconds}
          totalVolume={workouts.find((w) => w.id === selectedWorkoutId)?.totalVolume}
          userRating={workouts.find((w) => w.id === selectedWorkoutId)?.userRating}
          notes={workouts.find((w) => w.id === selectedWorkoutId)?.notes}
          exercises={[]} // TODO: Implement exercise fetching based on selectedWorkoutId
          data-testid='history-page-detail-dialog'
        />
      )}
    </>
  );
};
