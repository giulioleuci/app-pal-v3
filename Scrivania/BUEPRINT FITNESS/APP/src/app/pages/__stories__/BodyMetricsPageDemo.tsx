import AddIcon from '@mui/icons-material/Add';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HeightRecordCard } from '@/features/body-metrics/components/HeightRecordCard';
import { WeightRecordCard } from '@/features/body-metrics/components/WeightRecordCard';
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

interface BodyMetricsPageDemoProps {
  weightHistory?: WeightRecordItem[];
  heightHistory?: HeightRecordItem[];
  isLoadingWeights?: boolean;
  isLoadingHeights?: boolean;
  weightError?: Error | null;
  heightError?: Error | null;
  isEmpty?: boolean;
  activeTab?: ActiveTab;
  weightTrend?: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Demo version of BodyMetricsPage for Storybook that accepts mock data as props.
 * This version doesn't use database hooks and is safe for browser environments.
 */
export const BodyMetricsPageDemo: React.FC<BodyMetricsPageDemoProps> = ({
  weightHistory = [],
  heightHistory = [],
  isLoadingWeights = false,
  isLoadingHeights = false,
  weightError = null,
  heightError = null,
  isEmpty = false,
  activeTab: initialActiveTab = 'weight',
  weightTrend = 'stable',
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<ActiveTab>(initialActiveTab);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: ActiveTab) => {
    setActiveTab(newValue);
  };

  // Handle record creation
  const handleCreateRecord = () => {
    console.log(`Create ${activeTab} record clicked`);
  };

  // Handle view record details
  const handleViewRecordDetails = (recordId: string) => {
    console.log('View record details clicked:', recordId);
  };

  // Handle edit record
  const handleEditRecord = (recordId: string) => {
    console.log('Edit record clicked:', recordId);
  };

  // Handle weight record deletion
  const handleDeleteWeightRecord = (recordId: string) => {
    console.log('Delete weight record clicked:', recordId);
  };

  // Handle height record deletion
  const handleDeleteHeightRecord = (recordId: string) => {
    console.log('Delete height record clicked:', recordId);
  };

  // Render individual weight record card
  const renderWeightRecordItem = (
    record: WeightRecordItem,
    index: number,
    style: React.CSSProperties
  ) => {
    return (
      <div style={style}>
        <WeightRecordCard
          key={record.id}
          id={record.id}
          weight={record.weight}
          date={record.date}
          notes={record.notes}
          trend={weightTrend}
          onViewDetails={handleViewRecordDetails}
          onEdit={handleEditRecord}
          onDelete={handleDeleteWeightRecord}
          data-testid={`weight-record-item-${index}`}
        />
      </div>
    );
  };

  // Render individual height record card
  const renderHeightRecordItem = (
    record: HeightRecordItem,
    index: number,
    style: React.CSSProperties
  ) => {
    return (
      <div style={style}>
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
      </div>
    );
  };

  // Page-level error handling
  const currentError = activeTab === 'weight' ? weightError : heightError;
  if (currentError) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.bodyMetrics.title', 'Body Metrics')}
          subtitle={t('pages.bodyMetrics.subtitle', 'Track your body measurements')}
        />
        <ErrorDisplay
          error={currentError}
          onRetry={() => window.location.reload()}
          data-testid='body-metrics-page-error'
        />
      </StyledContainer>
    );
  }

  const currentData = activeTab === 'weight' ? weightHistory : heightHistory;
  const isCurrentLoading = activeTab === 'weight' ? isLoadingWeights : isLoadingHeights;
  const renderItem = activeTab === 'weight' ? renderWeightRecordItem : renderHeightRecordItem;

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='body-metrics-page'>
        <PageHeader
          title={t('pages.bodyMetrics.title', 'Body Metrics')}
          subtitle={t('pages.bodyMetrics.subtitle', 'Track your body measurements')}
          data-testid='body-metrics-page-header'
        />

        <StyledTabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label={t('bodyMetrics.tabs.label', 'Body metrics tabs')}
          data-testid='body-metrics-page-tabs'
        >
          <Tab
            label={t('bodyMetrics.tabs.weight', 'Weight')}
            value='weight'
            data-testid='body-metrics-weight-tab'
          />
          <Tab
            label={t('bodyMetrics.tabs.height', 'Height')}
            value='height'
            data-testid='body-metrics-height-tab'
          />
        </StyledTabs>

        <VirtualizedCardList
          items={currentData}
          renderCard={renderItem}
          getItemKey={(item) => item.id}
          estimateSize={activeTab === 'weight' ? 180 : 160}
          getSearchableText={(item) =>
            `${item.notes || ''} ${activeTab === 'weight' ? (item as any).weight : (item as any).height}`
          }
          isLoading={isCurrentLoading}
          searchPlaceholder={t(
            `bodyMetrics.${activeTab}.search.placeholder`,
            `Search ${activeTab} records...`
          )}
          emptyState={
            isEmpty || currentData.length === 0
              ? {
                  title: t(`bodyMetrics.${activeTab}.empty.title`, `No ${activeTab} records found`),
                  description: t(
                    `bodyMetrics.${activeTab}.empty.description`,
                    `Start tracking your ${activeTab} to monitor progress`
                  ),
                }
              : undefined
          }
          data-testid={`body-metrics-${activeTab}-list`}
        />
      </StyledContainer>

      {/* Floating Action Button for Creating Records */}
      <StyledFab
        color='primary'
        aria-label={t(`bodyMetrics.${activeTab}.create.button`, `Record ${activeTab}`)}
        onClick={handleCreateRecord}
        data-testid='body-metrics-page-create-fab'
      >
        <AddIcon />
      </StyledFab>
    </>
  );
};
