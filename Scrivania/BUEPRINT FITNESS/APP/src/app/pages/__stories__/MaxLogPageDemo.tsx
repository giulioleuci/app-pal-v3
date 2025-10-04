import AddIcon from '@mui/icons-material/Add';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { MaxLogCard } from '@/features/max-log/components/MaxLogCard';
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

interface MaxLogItem {
  id: string;
  profileId: string;
  exerciseId: string;
  exerciseName?: string;
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

interface MaxLogPageDemoProps {
  maxLogs?: MaxLogItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
}

/**
 * Demo version of MaxLogPage for Storybook that accepts mock data as props.
 * This version doesn't use database hooks and is safe for browser environments.
 */
export const MaxLogPageDemo: React.FC<MaxLogPageDemoProps> = ({
  maxLogs = [],
  isLoading = false,
  isError = false,
  error = null,
  isEmpty = false,
}) => {
  const { t } = useTranslation();

  // Handle max log creation
  const handleCreateMaxLog = () => {
    console.log('Create max log clicked');
  };

  // Handle view max log details
  const handleViewMaxLogDetails = (maxLogId: string) => {
    console.log('View max log details clicked:', maxLogId);
  };

  // Handle edit max log
  const handleEditMaxLog = (maxLogId: string) => {
    console.log('Edit max log clicked:', maxLogId);
  };

  // Handle max log deletion
  const handleDeleteMaxLog = (maxLogId: string) => {
    console.log('Delete max log clicked:', maxLogId);
  };

  // Render individual max log card
  const renderMaxLogItem = (maxLog: MaxLogItem, index: number, style: React.CSSProperties) => {
    return (
      <div style={style}>
        <MaxLogCard
          key={maxLog.id}
          id={maxLog.id}
          exerciseId={maxLog.exerciseId}
          exerciseName={maxLog.exerciseName || 'Unknown Exercise'}
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
      </div>
    );
  };

  // Page-level error handling
  if (isError && error) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.maxLog.title', 'Max Log')}
          subtitle={t('pages.maxLog.subtitle', 'Track your personal records')}
        />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='max-logs-page-error'
        />
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='max-logs-page'>
        <PageHeader
          title={t('pages.maxLog.title', 'Max Log')}
          subtitle={t('pages.maxLog.subtitle', 'Track your personal records')}
          data-testid='max-logs-page-header'
        />

        <VirtualizedCardList
          items={maxLogs}
          renderCard={renderMaxLogItem}
          getItemKey={(item) => item.id}
          estimateSize={200}
          getSearchableText={(item) =>
            `${item.exerciseName || ''} ${item.notes || ''} ${item.weightEnteredByUser} ${item.reps}`
          }
          isLoading={isLoading}
          searchPlaceholder={t('maxLog.search.placeholder', 'Search max logs...')}
          emptyState={
            isEmpty || maxLogs.length === 0
              ? {
                  title: t('maxLog.empty.title', 'No max logs found'),
                  description: t(
                    'maxLog.empty.description',
                    'Record your first max lift to start tracking progress'
                  ),
                }
              : undefined
          }
          data-testid='max-logs-page-list'
        />
      </StyledContainer>

      {/* Floating Action Button for Creating Max Logs */}
      <StyledFab
        color='primary'
        aria-label={t('maxLog.create.button', 'Record Max Lift')}
        onClick={handleCreateMaxLog}
        data-testid='max-logs-page-create-fab'
      >
        <AddIcon />
      </StyledFab>
    </>
  );
};
