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
import { MaxLogCard } from '@/features/max-log/components/MaxLogCard';
import { useMaxLogTracking } from '@/features/max-log/hooks/useMaxLogTracking';
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

interface MaxLogItem {
  id: string;
  profileId: string;
  exerciseId: string;
  weightEnteredByUser: number;
  date: Date;
  reps: number;
  estimated1RM: number;
  notes?: string;
  maxBrzycki?: number;
  maxBaechle?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Smart page component for browsing and managing max log records with virtualization.
 * Uses the useMaxLogTracking hook for data fetching and CRUD operations,
 * and the VirtualizedCardList component for efficient rendering.
 *
 * Features:
 * - Virtualized rendering for large max log databases
 * - Page-level error handling with ErrorDisplay component
 * - Global feedback via snackbar notifications
 * - Floating action button for creating new max logs
 * - Contextual onboarding via EmptyState component
 * - Search and filter functionality across max log fields
 * - Visual representation of 1RM calculations and personal records
 * - Exercise name resolution for display
 *
 * Follows the Page-Level Error Handling Protocol and Global Feedback Protocol.
 */
export const MaxLogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const activeProfileId = useActiveProfileId();

  // Set page title
  usePageTitle('maxLog', t('pages.maxLog.title'));

  // Max log tracking operations
  const {
    maxLogs,
    isLoading,
    error,
    create: createMaxLog,
    update: updateMaxLog,
    delete: deleteMaxLog,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  } = useMaxLogTracking(activeProfileId || '');

  // Handle max log creation
  const handleCreateMaxLog = () => {
    navigate('/max-logs/create');
  };

  // Handle view max log details
  const handleViewMaxLogDetails = (maxLogId: string) => {
    navigate(`/max-logs/${maxLogId}`);
  };

  // Handle edit max log
  const handleEditMaxLog = (maxLogId: string) => {
    navigate(`/max-logs/edit/${maxLogId}`);
  };

  // Handle max log deletion with confirmation
  const handleDeleteMaxLog = async (maxLogId: string) => {
    const maxLog = maxLogs.find((log) => log.id === maxLogId);
    if (!maxLog) return;

    try {
      await deleteMaxLog(maxLogId);
      showSuccess(
        t('maxLog.actions.deleted', {
          exerciseName: maxLog.exerciseId,
          weight: maxLog.weightEnteredByUser,
        })
      );
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : t('maxLog.actions.deleteError');
      showError(errorMessage);
    }
  };

  // Render individual max log card
  const renderMaxLogItem = (maxLog: MaxLogItem, index: number) => {
    return (
      <MaxLogCard
        key={maxLog.id}
        id={maxLog.id}
        exerciseId={maxLog.exerciseId}
        exerciseName={maxLog.exerciseId} // TODO: Resolve exercise name from exerciseId
        weightEnteredByUser={maxLog.weightEnteredByUser}
        reps={maxLog.reps}
        estimated1RM={maxLog.estimated1RM}
        date={maxLog.date}
        notes={maxLog.notes}
        onViewDetails={handleViewMaxLogDetails}
        onEdit={handleEditMaxLog}
        onDelete={handleDeleteMaxLog}
        data-testid={`max-log-item-${index}`}
      />
    );
  };

  // Loading skeleton for VirtualizedCardList
  const renderLoadingSkeleton = () => (
    <Box sx={{ mb: 2 }}>
      <Skeleton variant='rectangular' height={180} sx={{ borderRadius: 2 }} />
    </Box>
  );

  // Empty state component
  const renderEmptyState = () => (
    <EmptyState
      icon='FitnessCenter'
      title={t('maxLog.empty.title')}
      description={t('maxLog.empty.description')}
      actionLabel={t('maxLog.empty.action')}
      onAction={handleCreateMaxLog}
      data-testid='max-logs-empty-state'
    />
  );

  // Page-level error handling
  if (error) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.maxLog.title')} subtitle={t('pages.maxLog.subtitle')} />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='max-logs-page-error'
        />
      </StyledContainer>
    );
  }

  // Don't render if no active profile
  if (!activeProfileId) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.maxLog.title')} subtitle={t('pages.maxLog.subtitle')} />
        <ErrorDisplay
          error={new Error(t('profile.noActiveProfile'))}
          data-testid='max-logs-page-no-profile'
        />
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='max-logs-page'>
        <PageHeader
          title={t('pages.maxLog.title')}
          subtitle={t('pages.maxLog.subtitle')}
          data-testid='max-logs-page-header'
        />

        <VirtualizedCardList
          data={maxLogs || []}
          renderItem={renderMaxLogItem}
          renderLoadingSkeleton={renderLoadingSkeleton}
          renderEmptyState={renderEmptyState}
          isLoading={isLoading}
          isEmpty={(maxLogs || []).length === 0}
          searchPlaceholder={t('maxLog.search.placeholder')}
          searchFields={['exerciseId', 'notes']}
          data-testid='max-logs-page-list'
        />
      </StyledContainer>

      {/* Floating Action Button for Creating Max Logs */}
      <StyledFab
        color='primary'
        aria-label={t('maxLog.create.button')}
        onClick={handleCreateMaxLog}
        data-testid='max-logs-page-create-fab'
      >
        <AddIcon />
      </StyledFab>
    </>
  );
};
