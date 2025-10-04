import AnalyticsIcon from '@mui/icons-material/Analytics';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import {
  type AnalyticsFilters,
  type DateRange,
  useAnalyticsHub,
} from '@/features/analysis/hooks/useAnalyticsHub';
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

const StyledFilterBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  flexWrap: 'wrap',
}));

const StyledAnalyticsGrid = styled(Grid)(({ theme }) => ({
  flexGrow: 1,
}));

const StyledWidgetCard = styled(Card)(({ theme }) => ({
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

const StyledReportModal = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minWidth: '400px',
    maxWidth: '600px',
  },
}));

const StyledLoadingBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(4),
}));

/**
 * Analysis page component providing comprehensive analytics and reporting interface.
 *
 * This component implements the most data-intensive page in the app, handling
 * long-running analytics tasks with appropriate UI feedback. Features include:
 * - URL-synchronized filter controls
 * - Full-screen blocking modal for report generation
 * - Responsive grid of analysis widgets
 * - Complete error handling and loading states
 *
 * @returns The rendered analysis page
 */
export function AnalysisPage(): React.ReactElement {
  const { t } = useAppTranslation();
  const { showSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProfileId = useActiveProfileId();

  // Set page title
  usePageTitle('analysis', t('pages.analysis.title'));

  // URL State Management: Extract filters from search params
  const urlFilters = useMemo((): AnalyticsFilters | undefined => {
    const dateRangeParam = searchParams.get('dateRange');
    const exerciseIdsParam = searchParams.get('exerciseIds');
    const includeBodyWeightParam = searchParams.get('includeBodyWeight');

    if (!dateRangeParam) return undefined;

    try {
      const [fromStr, toStr] = dateRangeParam.split('|');
      const dateRange: DateRange = {
        from: new Date(fromStr),
        to: new Date(toStr),
      };

      return {
        dateRange,
        exerciseIds: exerciseIdsParam ? exerciseIdsParam.split(',') : undefined,
        includeBodyWeight: includeBodyWeightParam === 'true',
      };
    } catch {
      return undefined;
    }
  }, [searchParams]);

  // Data-First Design Protocol: Analytics hub with comprehensive data interface
  const {
    volume,
    frequency,
    weightProgress,
    charts,
    insights,
    generateReport,
    export: exportData,
    isLoadingAnalysis,
    isGeneratingReport,
    isExporting,
    analysisError,
    reportError,
    exportError,
    refetch,
    warmCache,
    invalidateCache,
  } = useAnalyticsHub(activeProfileId, urlFilters);

  // Update URL when filters change
  const updateFilters = useCallback(
    (newFilters: AnalyticsFilters) => {
      const params = new URLSearchParams();

      // Serialize date range
      const dateRangeStr = `${newFilters.dateRange.from.toISOString()}|${newFilters.dateRange.to.toISOString()}`;
      params.set('dateRange', dateRangeStr);

      // Serialize exercise IDs
      if (newFilters.exerciseIds?.length) {
        params.set('exerciseIds', newFilters.exerciseIds.join(','));
      }

      // Serialize body weight flag
      if (newFilters.includeBodyWeight) {
        params.set('includeBodyWeight', 'true');
      }

      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Handle report generation with user feedback
  const handleGenerateReport = useCallback(async () => {
    try {
      await generateReport.mutateAsync(urlFilters || getDefaultFilters());
      showSnackbar(t('analysis.reportGenerated'), 'success');
    } catch (_error) {
      showSnackbar(t('analysis.reportGenerationFailed'), 'error');
    }
  }, [generateReport, urlFilters, showSnackbar, t]);

  // Handle data export with user feedback
  const handleExport = useCallback(
    async (format: 'csv' | 'pdf' | 'json') => {
      try {
        await exportData.mutateAsync({
          format,
          includeCharts: true,
          includeRawData: true,
          filters: urlFilters,
        });
        showSnackbar(t('analysis.exportCompleted'), 'success');
      } catch (_error) {
        showSnackbar(t('analysis.exportFailed'), 'error');
      }
    },
    [exportData, urlFilters, showSnackbar, t]
  );

  // Warm cache on component mount for better performance
  useEffect(() => {
    if (activeProfileId) {
      warmCache([
        { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }, // 30 days
        { from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), to: new Date() }, // 90 days
      ]);
    }
  }, [activeProfileId, warmCache]);

  // Page-Level Error Handling Protocol
  if (analysisError) {
    return (
      <StyledContainer maxWidth='lg'>
        <ErrorDisplay
          error={analysisError}
          onRetry={refetch}
          title={t('analysis.loadingError')}
          data-testid='analysis-error-display'
        />
      </StyledContainer>
    );
  }

  // Loading state with skeletons
  if (isLoadingAnalysis) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.analysis.title')}
          subtitle={t('pages.analysis.subtitle')}
          icon={<Icon name='analytics' />}
        />

        <StyledFilterBar>
          <Skeleton variant='rectangular' width={200} height={40} />
          <Skeleton variant='rectangular' width={150} height={40} />
          <Skeleton variant='rectangular' width={100} height={40} />
        </StyledFilterBar>

        <StyledAnalyticsGrid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <StyledWidgetCard>
                <CardContent>
                  <Skeleton variant='text' height={32} />
                  <Skeleton variant='rectangular' height={200} />
                  <Skeleton variant='text' height={24} />
                </CardContent>
              </StyledWidgetCard>
            </Grid>
          ))}
        </StyledAnalyticsGrid>
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.analysis.title')}
          subtitle={t('pages.analysis.subtitle')}
          icon={<Icon name='analytics' />}
          data-testid='analysis-page-header'
        />

        {/* Filter Controls - URL State Management */}
        <StyledFilterBar data-testid='analysis-filter-bar'>
          <Icon name='filter' />
          <Typography variant='body2' color='text.secondary'>
            {t('analysis.filters.label')}
          </Typography>

          {urlFilters && (
            <Chip
              label={t('analysis.filters.dateRange', {
                from: urlFilters.dateRange.from.toLocaleDateString(),
                to: urlFilters.dateRange.to.toLocaleDateString(),
              })}
              onDelete={() => setSearchParams({})}
              deleteIcon={<CloseIcon />}
              size='small'
              data-testid='date-range-filter'
            />
          )}

          {urlFilters?.exerciseIds?.length && (
            <Chip
              label={t('analysis.filters.exercises', { count: urlFilters.exerciseIds.length })}
              onDelete={() => updateFilters({ ...urlFilters, exerciseIds: undefined })}
              deleteIcon={<CloseIcon />}
              size='small'
              data-testid='exercises-filter'
            />
          )}

          {urlFilters?.includeBodyWeight && (
            <Chip
              label={t('analysis.filters.bodyWeight')}
              onDelete={() => updateFilters({ ...urlFilters, includeBodyWeight: false })}
              deleteIcon={<CloseIcon />}
              size='small'
              data-testid='body-weight-filter'
            />
          )}

          <Stack direction='row' spacing={1} sx={{ marginLeft: 'auto' }}>
            <Button
              startIcon={<FilterAltIcon />}
              variant='outlined'
              size='small'
              data-testid='open-filter-dialog'
            >
              {t('analysis.filters.configure')}
            </Button>

            <IconButton onClick={refetch} size='small' data-testid='refresh-analysis'>
              <RefreshIcon />
            </IconButton>
          </Stack>
        </StyledFilterBar>

        {/* Action Bar */}
        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button
            startIcon={<AnalyticsIcon />}
            variant='contained'
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            data-testid='generate-report-button'
          >
            {t('analysis.generateReport')}
          </Button>

          <Button
            startIcon={<DownloadIcon />}
            variant='outlined'
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            data-testid='export-pdf-button'
          >
            {t('analysis.exportPdf')}
          </Button>
        </Stack>

        {/* Responsive Analytics Grid */}
        <StyledAnalyticsGrid container spacing={3} data-testid='analytics-grid'>
          {/* Volume Analysis Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <StyledWidgetCard data-testid='volume-analysis-widget'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('analysis.widgets.volume.title')}
                </Typography>
                {volume.isLoading ? (
                  <Skeleton variant='rectangular' height={200} />
                ) : volume.error ? (
                  <ErrorDisplay error={volume.error} onRetry={() => volume.refetch()} compact />
                ) : (
                  <Box sx={{ height: 200 }}>
                    {/* Chart component would go here */}
                    <Typography variant='body2' color='text.secondary'>
                      {t('analysis.widgets.volume.description')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StyledWidgetCard>
          </Grid>

          {/* Frequency Analysis Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <StyledWidgetCard data-testid='frequency-analysis-widget'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('analysis.widgets.frequency.title')}
                </Typography>
                {frequency.isLoading ? (
                  <Skeleton variant='rectangular' height={200} />
                ) : frequency.error ? (
                  <ErrorDisplay
                    error={frequency.error}
                    onRetry={() => frequency.refetch()}
                    compact
                  />
                ) : (
                  <Box sx={{ height: 200 }}>
                    {/* Chart component would go here */}
                    <Typography variant='body2' color='text.secondary'>
                      {t('analysis.widgets.frequency.description')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StyledWidgetCard>
          </Grid>

          {/* Weight Progress Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <StyledWidgetCard data-testid='weight-progress-widget'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('analysis.widgets.weightProgress.title')}
                </Typography>
                {weightProgress.isLoading ? (
                  <Skeleton variant='rectangular' height={200} />
                ) : weightProgress.error ? (
                  <ErrorDisplay
                    error={weightProgress.error}
                    onRetry={() => weightProgress.refetch()}
                    compact
                  />
                ) : (
                  <Box sx={{ height: 200 }}>
                    {/* Chart component would go here */}
                    <Typography variant='body2' color='text.secondary'>
                      {t('analysis.widgets.weightProgress.description')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StyledWidgetCard>
          </Grid>

          {/* Insights Widget */}
          <Grid item xs={12} md={6}>
            <StyledWidgetCard data-testid='insights-widget'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('analysis.widgets.insights.title')}
                </Typography>
                {insights ? (
                  <Stack spacing={2}>
                    <Typography variant='body2'>{insights.overallProgress}</Typography>
                    {insights.recommendations?.map((recommendation, index) => (
                      <Typography key={index} variant='body2' color='text.secondary'>
                        • {recommendation}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Skeleton variant='rectangular' height={150} />
                )}
              </CardContent>
            </StyledWidgetCard>
          </Grid>

          {/* Combined Chart Widget */}
          <Grid item xs={12} md={6}>
            <StyledWidgetCard data-testid='combined-chart-widget'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('analysis.widgets.combined.title')}
                </Typography>
                {charts ? (
                  <Box sx={{ height: 300 }}>
                    {/* Combined chart would go here */}
                    <Typography variant='body2' color='text.secondary'>
                      {t('analysis.widgets.combined.description')}
                    </Typography>
                  </Box>
                ) : (
                  <Skeleton variant='rectangular' height={300} />
                )}
              </CardContent>
            </StyledWidgetCard>
          </Grid>
        </StyledAnalyticsGrid>
      </StyledContainer>

      {/* Full-Screen Report Generation Modal */}
      <StyledReportModal
        open={isGeneratingReport}
        disableEscapeKeyDown
        data-testid='report-generation-modal'
      >
        <DialogTitle>
          <Stack direction='row' alignItems='center' spacing={2}>
            <Icon name='analytics' />
            <Typography variant='h6'>{t('analysis.reportGeneration.title')}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <StyledLoadingBox>
            <LinearProgress sx={{ width: '100%' }} />
            <Typography variant='body1' align='center'>
              {t('analysis.reportGeneration.message')}
            </Typography>
            <Typography variant='body2' color='text.secondary' align='center'>
              {t('analysis.reportGeneration.pleaseWait')}
            </Typography>
          </StyledLoadingBox>

          {reportError && (
            <Box sx={{ mt: 2 }}>
              <ErrorDisplay
                error={reportError}
                onRetry={handleGenerateReport}
                title={t('analysis.reportGeneration.error')}
                compact
              />
            </Box>
          )}
        </DialogContent>
      </StyledReportModal>
    </>
  );
}

// Helper function for default filters
function getDefaultFilters(): AnalyticsFilters {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    dateRange: {
      from: thirtyDaysAgo,
      to: now,
    },
    includeBodyWeight: false,
  };
}
