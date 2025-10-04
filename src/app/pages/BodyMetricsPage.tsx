import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { HeightRecordCard } from '@/features/body-metrics/components/HeightRecordCard';
import { WeightRecordCard } from '@/features/body-metrics/components/WeightRecordCard';
import { useBodyMetricsTracking } from '@/features/body-metrics/hooks/useBodyMetricsTracking';
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

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

interface WeightRecordItem {
  id: string;
  profileId: string;
  date: Date;
  weight: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HeightRecordItem {
  id: string;
  profileId: string;
  date: Date;
  height: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

type ActiveTab = 'weight' | 'height';

/**
 * Smart page component for browsing and managing body metrics with virtualization.
 * Uses the useBodyMetricsTracking hook for data fetching and CRUD operations,
 * and the VirtualizedCardList component for efficient rendering.
 *
 * Features:
 * - Tabbed interface for weight and height records
 * - Virtualized rendering for large body metrics databases
 * - Page-level error handling with ErrorDisplay component
 * - Global feedback via snackbar notifications
 * - URL state management for active tab
 * - Floating action button for creating new records
 * - Contextual onboarding via EmptyState component
 * - Search and filter functionality across body metrics fields
 * - Trend analysis and visual indicators
 *
 * Follows the Page-Level Error Handling Protocol and Global Feedback Protocol.
 */
export const BodyMetricsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const activeProfileId = useActiveProfileId();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state management for active tab
  const activeTab = (searchParams.get('tab') as ActiveTab) || 'weight';

  // Set page title
  usePageTitle('bodyMetrics', t('pages.bodyMetrics.title'));

  // Body metrics tracking operations
  const {
    weightHistory,
    heightHistory,
    isLoadingWeights,
    isLoadingHeights,
    weight,
    height,
    progress,
    weightError,
    heightError,
    isAddingWeight,
    isUpdatingWeight,
    isDeletingWeight,
    isAddingHeight,
    isDeletingHeight,
  } = useBodyMetricsTracking(activeProfileId || '');

  // Handle tab change with URL state management
  const handleTabChange = (_event: React.SyntheticEvent, newValue: ActiveTab) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', newValue);
      return newParams;
    });
  };

  // Handle record creation
  const handleCreateRecord = () => {
    navigate(`/body-metrics/create?type=${activeTab}`);
  };

  // Handle view record details
  const handleViewRecordDetails = (recordId: string) => {
    navigate(`/body-metrics/${recordId}?type=${activeTab}`);
  };

  // Handle edit record
  const handleEditRecord = (recordId: string) => {
    navigate(`/body-metrics/edit/${recordId}?type=${activeTab}`);
  };

  // Handle weight record deletion with confirmation
  const handleDeleteWeightRecord = async (recordId: string) => {
    const record = weightHistory.find((r) => r.id === recordId);
    if (!record) return;

    try {
      await weight.delete.mutateAsync(recordId);
      showSuccess(
        t('bodyMetrics.actions.weightDeleted', {
          weight: record.weight,
          date: new Intl.DateTimeFormat().format(record.date),
        })
      );
    } catch (_error) {
      const errorMessage =
        error instanceof Error ? error.message : t('bodyMetrics.actions.deleteError');
      showError(errorMessage);
    }
  };

  // Handle height record deletion with confirmation
  const handleDeleteHeightRecord = async (recordId: string) => {
    const record = heightHistory.find((r) => r.id === recordId);
    if (!record) return;

    try {
      await height.delete.mutateAsync(recordId);
      showSuccess(
        t('bodyMetrics.actions.heightDeleted', {
          height: record.height,
          date: new Intl.DateTimeFormat().format(record.date),
        })
      );
    } catch (_error) {
      const errorMessage =
        error instanceof Error ? error.message : t('bodyMetrics.actions.deleteError');
      showError(errorMessage);
    }
  };

  // Render individual weight record card
  const renderWeightRecordItem = (record: WeightRecordItem, index: number) => {
    return (
      <WeightRecordCard
        key={record.id}
        id={record.id}
        weight={record.weight}
        date={record.date}
        notes={record.notes}
        trend={progress.trend}
        onViewDetails={handleViewRecordDetails}
        onEdit={handleEditRecord}
        onDelete={handleDeleteWeightRecord}
        data-testid={`weight-record-item-${index}`}
      />
    );
  };

  // Render individual height record card
  const renderHeightRecordItem = (record: HeightRecordItem, index: number) => {
    return (
      <HeightRecordCard
        key={record.id}
        id={record.id}
        height={record.height}
        date={record.date}
        notes={record.notes}
        onViewDetails={handleViewRecordDetails}
        onEdit={handleEditRecord}
        onDelete={handleDeleteHeightRecord}
        data-testid={`height-record-item-${index}`}
      />
    );
  };

  // Loading skeleton for VirtualizedCardList
  const renderLoadingSkeleton = () => (
    <Box sx={{ mb: 2 }}>
      <Skeleton variant='rectangular' height={160} sx={{ borderRadius: 2 }} />
    </Box>
  );

  // Empty state component for weight
  const renderWeightEmptyState = () => (
    <EmptyState
      icon='MonitorWeight'
      title={t('bodyMetrics.weight.empty.title')}
      description={t('bodyMetrics.weight.empty.description')}
      actionLabel={t('bodyMetrics.weight.empty.action')}
      onAction={handleCreateRecord}
      data-testid='weight-records-empty-state'
    />
  );

  // Empty state component for height
  const renderHeightEmptyState = () => (
    <EmptyState
      icon='Height'
      title={t('bodyMetrics.height.empty.title')}
      description={t('bodyMetrics.height.empty.description')}
      actionLabel={t('bodyMetrics.height.empty.action')}
      onAction={handleCreateRecord}
      data-testid='height-records-empty-state'
    />
  );

  // Page-level error handling
  const currentError = activeTab === 'weight' ? weightError : heightError;
  if (currentError) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.bodyMetrics.title')}
          subtitle={t('pages.bodyMetrics.subtitle')}
        />
        <ErrorDisplay
          error={currentError}
          onRetry={() => window.location.reload()}
          data-testid='body-metrics-page-error'
        />
      </StyledContainer>
    );
  }

  // Don't render if no active profile
  if (!activeProfileId) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.bodyMetrics.title')}
          subtitle={t('pages.bodyMetrics.subtitle')}
        />
        <ErrorDisplay
          error={new Error(t('profile.noActiveProfile'))}
          data-testid='body-metrics-page-no-profile'
        />
      </StyledContainer>
    );
  }

  const currentData = activeTab === 'weight' ? weightHistory : heightHistory;
  const isCurrentLoading = activeTab === 'weight' ? isLoadingWeights : isLoadingHeights;
  const renderItem = activeTab === 'weight' ? renderWeightRecordItem : renderHeightRecordItem;
  const renderEmptyState = activeTab === 'weight' ? renderWeightEmptyState : renderHeightEmptyState;

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='body-metrics-page'>
        <PageHeader
          title={t('pages.bodyMetrics.title')}
          subtitle={t('pages.bodyMetrics.subtitle')}
          data-testid='body-metrics-page-header'
        />

        <StyledTabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label={t('bodyMetrics.tabs.label')}
          data-testid='body-metrics-page-tabs'
        >
          <Tab
            label={t('bodyMetrics.tabs.weight')}
            value='weight'
            data-testid='body-metrics-weight-tab'
          />
          <Tab
            label={t('bodyMetrics.tabs.height')}
            value='height'
            data-testid='body-metrics-height-tab'
          />
        </StyledTabs>

        <VirtualizedCardList
          data={currentData || []}
          renderItem={renderItem}
          renderLoadingSkeleton={renderLoadingSkeleton}
          renderEmptyState={renderEmptyState}
          isLoading={isCurrentLoading}
          isEmpty={(currentData || []).length === 0}
          searchPlaceholder={t(`bodyMetrics.${activeTab}.search.placeholder`)}
          searchFields={['notes']}
          data-testid={`body-metrics-${activeTab}-list`}
        />
      </StyledContainer>

      {/* Floating Action Button for Creating Records */}
      <StyledFab
        color='primary'
        aria-label={t(`bodyMetrics.${activeTab}.create.button`)}
        onClick={handleCreateRecord}
        data-testid='body-metrics-page-create-fab'
      >
        <AddIcon />
      </StyledFab>
    </>
  );
};
