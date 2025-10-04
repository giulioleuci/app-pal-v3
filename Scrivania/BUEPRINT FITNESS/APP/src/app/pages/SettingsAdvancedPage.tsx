import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import WarningIcon from '@mui/icons-material/Warning';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useCallback, useState } from 'react';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { useDataSyncManager } from '@/features/data-sync/hooks/useDataSyncManager';
import { useMaintenanceHub } from '@/features/maintenance/hooks/useMaintenanceHub';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
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

const StyledSectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiCardHeader-root': {
    backgroundColor: theme.palette.grey[50],
  },
}));

const StyledMetricItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  '&:last-child': {
    marginBottom: 0,
  },
}));

const StyledDangerZone = styled(Card)(({ theme }) => ({
  border: `2px solid ${theme.palette.error.main}`,
  '& .MuiCardHeader-root': {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
}));

const StyledConfirmationInput = styled(TextField)(({ theme }) => ({
  marginTop: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
  },
}));

/**
 * Advanced Settings page component providing system maintenance, data synchronization,
 * and administrative controls.
 *
 * This component implements the Data-First Design Protocol by using the
 * useMaintenanceHub and useDataSyncManager hooks to provide comprehensive
 * system administration interfaces.
 *
 * Features:
 * - Data synchronization management and metrics
 * - System maintenance tools and health monitoring
 * - Danger Zone with confirmed bulk data operations
 * - Real-time sync status and progress indicators
 * - Administrative controls with safety mechanisms
 * - Back navigation to settings
 *
 * @returns The rendered advanced settings page
 */
export function SettingsAdvancedPage(): React.ReactElement {
  const { t } = useAppTranslation();
  const { showSnackbar } = useSnackbar();
  const activeProfileId = useActiveProfileId();

  // Local state for danger zone confirmations
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    action: () => void;
    title: string;
    message: string;
    confirmPhrase: string;
  } | null>(null);

  // Set page title
  usePageTitle('settings-advanced', t('pages.settingsAdvanced.title'));

  // Data-First Design Protocol: Maintenance Hub
  const {
    generatedAt,
    systemHealth,
    databaseSize,
    performance,
    storage,
    integrity,
    isLoading: maintenanceLoading,
    error: maintenanceError,
    refetch: refetchMaintenance,
  } = useMaintenanceHub();

  // Data-First Design Protocol: Data Sync Manager
  const {
    score,
    grade,
    issues,
    critical,
    high,
    medium,
    low,
    total,
    isLoading: syncLoading,
    error: syncError,
    refetch: refetchSync,
  } = useDataSyncManager(activeProfileId);

  // Handle confirmed danger zone actions
  const handleDangerZoneAction = useCallback(
    (action: () => void, title: string, message: string, confirmPhrase: string) => {
      setPendingAction({ action, title, message, confirmPhrase });
      setConfirmDialogOpen(true);
      setConfirmationText('');
    },
    []
  );

  // Execute confirmed action
  const executeConfirmedAction = useCallback(async () => {
    if (!pendingAction || confirmationText !== pendingAction.confirmPhrase) {
      showSnackbar(t('pages.settingsAdvanced.dangerZone.confirmationMismatch'), 'error');
      return;
    }

    try {
      pendingAction.action();
      showSnackbar(t('pages.settingsAdvanced.dangerZone.actionCompleted'), 'success');
      setConfirmDialogOpen(false);
      setPendingAction(null);
      setConfirmationText('');
    } catch (_error) {
      showSnackbar(t('pages.settingsAdvanced.dangerZone.actionFailed'), 'error');
    }
  }, [pendingAction, confirmationText, showSnackbar, t]);

  // Handle dialog close
  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialogOpen(false);
    setPendingAction(null);
    setConfirmationText('');
  }, []);

  // Danger zone actions
  const clearAllData = useCallback(() => {
    // In a real implementation, this would call a mutation hook
    console.log('Clearing all data for profile:', activeProfileId);
  }, [activeProfileId]);

  const resetDatabaseSchema = useCallback(() => {
    // In a real implementation, this would call a mutation hook
    console.log('Resetting database schema');
  }, []);

  const purgeOldBackups = useCallback(() => {
    // In a real implementation, this would call a mutation hook
    console.log('Purging old backups');
  }, []);

  // Get health status details
  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return { icon: <CheckCircleIcon />, color: 'success' as const };
      case 'warning':
        return { icon: <WarningIcon />, color: 'warning' as const };
      case 'error':
        return { icon: <ErrorIcon />, color: 'error' as const };
      default:
        return { icon: <WarningIcon />, color: 'warning' as const };
    }
  };

  // Get grade color
  const getGradeColor = (gradeValue: string) => {
    switch (gradeValue) {
      case 'A':
        return 'success';
      case 'B':
        return 'info';
      case 'C':
        return 'warning';
      case 'D':
      case 'F':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <StyledContainer maxWidth='lg'>
      <PageHeader
        title={t('pages.settingsAdvanced.title')}
        subtitle={t('pages.settingsAdvanced.subtitle')}
        showBackButton={true}
        icon={<Icon name='settings' />}
        data-testid='settings-advanced-page-header'
      />

      {/* Data Sync Section */}
      <StyledSectionCard data-testid='data-sync-section'>
        <CardHeader
          title={t('pages.settingsAdvanced.dataSync.title')}
          subheader={t('pages.settingsAdvanced.dataSync.description')}
          avatar={<CloudSyncIcon />}
          action={
            <Button
              startIcon={syncLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={refetchSync}
              disabled={syncLoading}
              data-testid='refresh-sync-data'
            >
              {t('common.refresh')}
            </Button>
          }
        />

        <CardContent>
          {syncError ? (
            <ErrorDisplay
              error={syncError}
              onRetry={refetchSync}
              title={t('pages.settingsAdvanced.dataSync.loadingError')}
              compact
            />
          ) : syncLoading ? (
            <LinearProgress />
          ) : (
            <Stack spacing={2}>
              {/* Sync Score and Grade */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='body1'>
                  {t('pages.settingsAdvanced.dataSync.score')}
                </Typography>
                <Chip
                  label={`${score || 0}%`}
                  color={score >= 90 ? 'success' : score >= 70 ? 'warning' : 'error'}
                />
                <Chip label={`Grade: ${grade || 'N/A'}`} color={getGradeColor(grade || '')} />
              </Box>

              {/* Issue Breakdown */}
              <Box data-testid='sync-issues-breakdown'>
                <Typography variant='subtitle2' gutterBottom>
                  {t('pages.settingsAdvanced.dataSync.issues.title')} ({total || 0})
                </Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap'>
                  <Chip
                    label={t('pages.settingsAdvanced.dataSync.issues.critical', {
                      count: critical || 0,
                    })}
                    size='small'
                    color='error'
                    variant={critical ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label={t('pages.settingsAdvanced.dataSync.issues.high', { count: high || 0 })}
                    size='small'
                    color='warning'
                    variant={high ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label={t('pages.settingsAdvanced.dataSync.issues.medium', {
                      count: medium || 0,
                    })}
                    size='small'
                    color='info'
                    variant={medium ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label={t('pages.settingsAdvanced.dataSync.issues.low', { count: low || 0 })}
                    size='small'
                    color='success'
                    variant={low ? 'filled' : 'outlined'}
                  />
                </Stack>
              </Box>
            </Stack>
          )}
        </CardContent>
      </StyledSectionCard>

      {/* Maintenance Section */}
      <StyledSectionCard data-testid='maintenance-section'>
        <CardHeader
          title={t('pages.settingsAdvanced.maintenance.title')}
          subheader={t('pages.settingsAdvanced.maintenance.description')}
          avatar={<StorageIcon />}
          action={
            <Button
              startIcon={maintenanceLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={refetchMaintenance}
              disabled={maintenanceLoading}
              data-testid='refresh-maintenance-data'
            >
              {t('common.refresh')}
            </Button>
          }
        />

        <CardContent>
          {maintenanceError ? (
            <ErrorDisplay
              error={maintenanceError}
              onRetry={refetchMaintenance}
              title={t('pages.settingsAdvanced.maintenance.loadingError')}
              compact
            />
          ) : maintenanceLoading ? (
            <LinearProgress />
          ) : (
            <Stack spacing={1} data-testid='maintenance-metrics'>
              <StyledMetricItem>
                <Stack direction='row' alignItems='center' spacing={1}>
                  {systemHealth ? getHealthStatus(systemHealth).icon : <WarningIcon />}
                  <Typography variant='body2'>
                    {t('pages.settingsAdvanced.maintenance.systemHealth')}
                  </Typography>
                </Stack>
                <Chip
                  label={systemHealth || 'Unknown'}
                  color={systemHealth ? getHealthStatus(systemHealth).color : 'default'}
                  size='small'
                />
              </StyledMetricItem>

              <StyledMetricItem>
                <Typography variant='body2'>
                  {t('pages.settingsAdvanced.maintenance.databaseSize')}
                </Typography>
                <Typography variant='body2' fontWeight='medium'>
                  {databaseSize || '0 MB'}
                </Typography>
              </StyledMetricItem>

              <StyledMetricItem>
                <Typography variant='body2'>
                  {t('pages.settingsAdvanced.maintenance.performance')}
                </Typography>
                <Typography variant='body2' fontWeight='medium'>
                  {performance || 'N/A'}
                </Typography>
              </StyledMetricItem>

              <StyledMetricItem>
                <Typography variant='body2'>
                  {t('pages.settingsAdvanced.maintenance.storage')}
                </Typography>
                <Typography variant='body2' fontWeight='medium'>
                  {storage || 'N/A'}
                </Typography>
              </StyledMetricItem>

              <StyledMetricItem>
                <Typography variant='body2'>
                  {t('pages.settingsAdvanced.maintenance.integrity')}
                </Typography>
                <Typography variant='body2' fontWeight='medium'>
                  {integrity || 'N/A'}
                </Typography>
              </StyledMetricItem>

              {generatedAt && (
                <Typography variant='caption' color='text.secondary' sx={{ mt: 1 }}>
                  {t('pages.settingsAdvanced.maintenance.lastUpdated')}:{' '}
                  {new Date(generatedAt).toLocaleString()}
                </Typography>
              )}
            </Stack>
          )}
        </CardContent>
      </StyledSectionCard>

      {/* Danger Zone */}
      <StyledDangerZone data-testid='danger-zone-section'>
        <CardHeader
          title={t('pages.settingsAdvanced.dangerZone.title')}
          subheader={t('pages.settingsAdvanced.dangerZone.description')}
          avatar={<SecurityIcon />}
        />

        <CardContent>
          <Stack spacing={2}>
            <Button
              variant='outlined'
              color='error'
              startIcon={<DeleteForeverIcon />}
              onClick={() =>
                handleDangerZoneAction(
                  clearAllData,
                  t('pages.settingsAdvanced.dangerZone.clearData.title'),
                  t('pages.settingsAdvanced.dangerZone.clearData.message'),
                  'DELETE ALL DATA'
                )
              }
              data-testid='clear-all-data-button'
            >
              {t('pages.settingsAdvanced.dangerZone.clearData.button')}
            </Button>

            <Button
              variant='outlined'
              color='error'
              startIcon={<RefreshIcon />}
              onClick={() =>
                handleDangerZoneAction(
                  resetDatabaseSchema,
                  t('pages.settingsAdvanced.dangerZone.resetSchema.title'),
                  t('pages.settingsAdvanced.dangerZone.resetSchema.message'),
                  'RESET SCHEMA'
                )
              }
              data-testid='reset-schema-button'
            >
              {t('pages.settingsAdvanced.dangerZone.resetSchema.button')}
            </Button>

            <Button
              variant='outlined'
              color='error'
              startIcon={<StorageIcon />}
              onClick={() =>
                handleDangerZoneAction(
                  purgeOldBackups,
                  t('pages.settingsAdvanced.dangerZone.purgeBackups.title'),
                  t('pages.settingsAdvanced.dangerZone.purgeBackups.message'),
                  'PURGE BACKUPS'
                )
              }
              data-testid='purge-backups-button'
            >
              {t('pages.settingsAdvanced.dangerZone.purgeBackups.button')}
            </Button>
          </Stack>
        </CardContent>
      </StyledDangerZone>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        variant='danger'
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onClose={handleCloseConfirmDialog}
        onConfirm={executeConfirmedAction}
      />

      {/* Custom Confirmation Dialog for Danger Zone */}
      {confirmDialogOpen && pendingAction && (
        <Box
          component='div'
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
          data-testid='danger-zone-confirmation-overlay'
        >
          <Card sx={{ maxWidth: 500, width: '90%', p: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h6' color='error'>
                  {pendingAction.title}
                </Typography>

                <Typography variant='body1'>{pendingAction.message}</Typography>

                <Divider />

                <Typography variant='body2' color='text.secondary'>
                  {t('pages.settingsAdvanced.dangerZone.confirmationPrompt', {
                    phrase: pendingAction.confirmPhrase,
                  })}
                </Typography>

                <StyledConfirmationInput
                  fullWidth
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={pendingAction.confirmPhrase}
                  error={
                    confirmationText.length > 0 && confirmationText !== pendingAction.confirmPhrase
                  }
                  helperText={
                    confirmationText.length > 0 && confirmationText !== pendingAction.confirmPhrase
                      ? t('pages.settingsAdvanced.dangerZone.confirmationMismatch')
                      : ''
                  }
                  data-testid='confirmation-text-input'
                />

                <Stack direction='row' spacing={2} justifyContent='flex-end'>
                  <Button onClick={handleCloseConfirmDialog} data-testid='cancel-danger-action'>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant='contained'
                    color='error'
                    onClick={executeConfirmedAction}
                    disabled={confirmationText !== pendingAction.confirmPhrase}
                    data-testid='confirm-danger-action'
                  >
                    {t('common.confirm')}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}
    </StyledContainer>
  );
}
