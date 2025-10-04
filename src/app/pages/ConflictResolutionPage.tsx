import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { AccordionGroup } from '@/shared/components/AccordionGroup';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { isConflictError } from '@/shared/errors/guards';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  minHeight: '100vh',
}));

const StyledConflictOverview = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
}));

const StyledConflictItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(1),
}));

const StyledConflictDetails = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StyledValueComparison = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: theme.spacing(2),
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
}));

const StyledActionButtons = styled(Stack)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

interface ConflictData {
  entityType: string;
  conflicts: {
    id: string;
    field: string;
    localValue: unknown;
    remoteValue: unknown;
    entityId: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

interface ConflictError extends Error {
  conflicts: ConflictData[];
  conflictCount: number;
}

/**
 * Conflict Resolution page component for handling data synchronization conflicts.
 *
 * This component implements the Data-First Design Protocol by safely accessing
 * conflict data from the route state using the isConflictError type guard.
 * It groups conflicts by entity type using the AccordionGroup component and
 * provides detailed resolution interfaces for each conflict.
 *
 * Features:
 * - Safe conflict error handling with type guards
 * - Grouped conflict display by entity type
 * - Detailed value comparison interface
 * - Batch resolution actions
 * - Individual conflict resolution
 * - Navigation back to source page
 *
 * @returns The rendered conflict resolution page
 */
export function ConflictResolutionPage(): React.ReactElement {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();

  // Set page title
  usePageTitle('conflict-resolution', t('pages.conflictResolution.title'));

  // Safe conflict data extraction using type guard
  const conflictData = useMemo(() => {
    const routeError = location.state?.error;

    if (!routeError || !isConflictError(routeError)) {
      return null;
    }

    return routeError as ConflictError;
  }, [location.state]);

  // Group conflicts by entity type
  const groupedConflicts = useMemo(() => {
    if (!conflictData) return {};

    const groups: Record<string, ConflictData['conflicts']> = {};

    conflictData.conflicts.forEach((conflict) => {
      if (!groups[conflict.conflicts[0]?.entityType || 'unknown']) {
        groups[conflict.conflicts[0]?.entityType || 'unknown'] = [];
      }
      groups[conflict.conflicts[0]?.entityType || 'unknown'].push(...conflict.conflicts);
    });

    return groups;
  }, [conflictData]);

  // Get severity icon and color
  const getSeverityDetails = (severity: string) => {
    switch (severity) {
      case 'high':
        return { icon: <ErrorIcon />, color: 'error' as const };
      case 'medium':
        return { icon: <WarningIcon />, color: 'warning' as const };
      case 'low':
        return { icon: <CheckCircleIcon />, color: 'success' as const };
      default:
        return { icon: <WarningIcon />, color: 'warning' as const };
    }
  };

  // Handle individual conflict resolution
  const handleResolveConflict = useCallback(
    (conflictId: string, resolution: 'local' | 'remote') => {
      // In a real implementation, this would call a mutation hook
      showSnackbar(
        t('pages.conflictResolution.actions.resolveSuccess', {
          resolution: resolution === 'local' ? t('common.local') : t('common.remote'),
        }),
        'success'
      );
    },
    [showSnackbar, t]
  );

  // Handle batch resolution
  const handleBatchResolve = useCallback(
    (resolution: 'local' | 'remote') => {
      // In a real implementation, this would call a mutation hook
      const resolutionText = resolution === 'local' ? t('common.local') : t('common.remote');
      showSnackbar(
        t('pages.conflictResolution.actions.batchResolveSuccess', { resolution: resolutionText }),
        'success'
      );

      // Navigate back after successful resolution
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    },
    [showSnackbar, t, navigate]
  );

  // If no conflict data found, show error
  if (!conflictData) {
    return (
      <StyledContainer maxWidth='lg'>
        <ErrorDisplay
          error={new Error('No conflict data available')}
          onRetry={() => navigate(-1)}
          title={t('pages.conflictResolution.noDataError')}
          data-testid='conflict-resolution-no-data-error'
        />
      </StyledContainer>
    );
  }

  const totalConflicts = Object.values(groupedConflicts).reduce(
    (sum, conflicts) => sum + conflicts.length,
    0
  );

  return (
    <StyledContainer maxWidth='lg'>
      <PageHeader
        title={t('pages.conflictResolution.title')}
        subtitle={t('pages.conflictResolution.subtitle')}
        showBackButton={true}
        icon={<Icon name='sync_problem' />}
        data-testid='conflict-resolution-page-header'
      />

      {/* Conflict Overview */}
      <StyledConflictOverview data-testid='conflict-overview'>
        <Stack direction='row' alignItems='center' spacing={2} sx={{ mb: 2 }}>
          <Icon name='warning' color='warning' />
          <Typography variant='h6'>{t('pages.conflictResolution.overview.title')}</Typography>
        </Stack>

        <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
          {t('pages.conflictResolution.overview.description', { count: totalConflicts })}
        </Typography>

        <Stack direction='row' spacing={1} flexWrap='wrap'>
          {Object.entries(groupedConflicts).map(([entityType, conflicts]) => (
            <Chip
              key={entityType}
              label={t('pages.conflictResolution.overview.entityChip', {
                type: entityType,
                count: conflicts.length,
              })}
              variant='outlined'
              size='small'
            />
          ))}
        </Stack>
      </StyledConflictOverview>

      {/* Grouped Conflicts */}
      <AccordionGroup allowMultiple data-testid='conflicts-accordion-group'>
        {Object.entries(groupedConflicts).map(([entityType, conflicts]) => (
          <AccordionGroup.Item
            key={entityType}
            id={`conflicts-${entityType}`}
            title={t('pages.conflictResolution.entityGroup.title', { type: entityType })}
            subtitle={t('pages.conflictResolution.entityGroup.subtitle', {
              count: conflicts.length,
            })}
            icon={<Icon name='folder' />}
            data-testid={`conflicts-group-${entityType}`}
          >
            <StyledConflictDetails>
              {conflicts.map((conflict) => {
                const severityDetails = getSeverityDetails(conflict.severity);

                return (
                  <StyledConflictItem
                    key={conflict.id}
                    data-testid={`conflict-item-${conflict.id}`}
                  >
                    <Stack direction='row' alignItems='center' spacing={2} sx={{ mb: 2 }}>
                      {severityDetails.icon}
                      <Typography variant='subtitle1' fontWeight='medium'>
                        {t('pages.conflictResolution.conflict.fieldTitle', {
                          field: conflict.field,
                        })}
                      </Typography>
                      <Chip label={conflict.severity} size='small' color={severityDetails.color} />
                    </Stack>

                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      {t('pages.conflictResolution.conflict.description')}
                    </Typography>

                    {/* Value Comparison */}
                    <StyledValueComparison data-testid={`conflict-comparison-${conflict.id}`}>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          {t('pages.conflictResolution.conflict.localValue')}
                        </Typography>
                        <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                          {JSON.stringify(conflict.localValue, null, 2)}
                        </Typography>
                      </Box>

                      <Icon name='compare_arrows' color='primary' />

                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          {t('pages.conflictResolution.conflict.remoteValue')}
                        </Typography>
                        <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                          {JSON.stringify(conflict.remoteValue, null, 2)}
                        </Typography>
                      </Box>
                    </StyledValueComparison>

                    {/* Individual Resolution Actions */}
                    <Stack direction='row' spacing={2} justifyContent='flex-end' sx={{ mt: 2 }}>
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => handleResolveConflict(conflict.id, 'local')}
                        data-testid={`resolve-local-${conflict.id}`}
                      >
                        {t('pages.conflictResolution.conflict.actions.useLocal')}
                      </Button>
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => handleResolveConflict(conflict.id, 'remote')}
                        data-testid={`resolve-remote-${conflict.id}`}
                      >
                        {t('pages.conflictResolution.conflict.actions.useRemote')}
                      </Button>
                    </Stack>
                  </StyledConflictItem>
                );
              })}
            </StyledConflictDetails>
          </AccordionGroup.Item>
        ))}
      </AccordionGroup>

      {/* Batch Resolution Actions */}
      <StyledActionButtons
        direction='row'
        spacing={2}
        justifyContent='flex-end'
        data-testid='batch-resolution-actions'
      >
        <Typography variant='body2' color='text.secondary' sx={{ flexGrow: 1 }}>
          {t('pages.conflictResolution.batchActions.description')}
        </Typography>

        <Button
          variant='outlined'
          color='primary'
          onClick={() => handleBatchResolve('local')}
          data-testid='batch-resolve-local'
        >
          {t('pages.conflictResolution.batchActions.useAllLocal')}
        </Button>

        <Button
          variant='contained'
          color='primary'
          onClick={() => handleBatchResolve('remote')}
          data-testid='batch-resolve-remote'
        >
          {t('pages.conflictResolution.batchActions.useAllRemote')}
        </Button>
      </StyledActionButtons>
    </StyledContainer>
  );
}
