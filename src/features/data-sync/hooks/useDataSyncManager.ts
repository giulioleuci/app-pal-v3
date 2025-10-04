import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { container } from 'tsyringe';

import { DataSyncService } from '@/features/data-sync/services/DataSyncService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

export interface ImportOptions {
  format: 'json' | 'csv' | 'xml';
  profileId: string;
  validateData?: boolean;
  mergeStrategy?: 'overwrite' | 'merge' | 'skip_duplicates';
  backupBefore?: boolean;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml';
  profileId: string;
  includeMedia?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  dataTypes?: Array<'workouts' | 'exercises' | 'maxLogs' | 'bodyMetrics' | 'trainingPlans'>;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  issues: Array<{
    type: 'missing_reference' | 'data_corruption' | 'orphaned_record' | 'invalid_format';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    table: string;
    recordId?: string;
    fixable: boolean;
  }>;
  summary: {
    totalRecords: number;
    corruptedRecords: number;
    orphanedRecords: number;
    missingReferences: number;
  };
}

/**
 * Comprehensive data synchronization and integrity management aggregate hook.
 *
 * This hook provides a unified interface for:
 * - Data import from various formats (JSON, CSV, XML)
 * - Data export with flexible options and filtering
 * - Data integrity checking and validation
 * - Backup and restore operations
 * - Sync status monitoring and error handling
 *
 * Consolidates 3 data-sync hooks into a single, cohesive API while
 * providing robust error handling and progress tracking.
 *
 * @param profileId - Optional profile ID for scoping operations (defaults to active profile)
 * @returns Comprehensive data sync management interface
 */
export function useDataSyncManager(profileId?: string) {
  const dataSyncService = container.resolve(DataSyncService);
  const activeProfileId = useActiveProfileId();
  const targetProfileId = profileId || activeProfileId;

  const [syncProgress, setSyncProgress] = useState<{
    operation: 'import' | 'export' | 'integrity_check' | null;
    progress: number;
    currentStep: string;
  }>({ operation: null, progress: 0, currentStep: '' });

  // Data integrity status
  const integrityStatus = useQuery({
    queryKey: ['data-sync', 'integrity', targetProfileId],
    queryFn: () => dataSyncService.getIntegrityStatus(targetProfileId!),
    enabled: !!targetProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes - integrity doesn't change often
  });

  // Backup history
  const backupHistory = useQuery({
    queryKey: ['data-sync', 'backups', targetProfileId],
    queryFn: () => dataSyncService.getBackupHistory(targetProfileId!),
    enabled: !!targetProfileId,
  });

  // Data export mutation
  const exportData = useMutation({
    mutationFn: async (options: ExportOptions) => {
      setSyncProgress({ operation: 'export', progress: 0, currentStep: 'Preparing export...' });

      try {
        const result = await dataSyncService.exportData(options, (progress, step) => {
          setSyncProgress({ operation: 'export', progress, currentStep: step });
        });

        setSyncProgress({ operation: null, progress: 100, currentStep: 'Export completed' });
        return result;
      } catch (_error) {
        setSyncProgress({ operation: null, progress: 0, currentStep: 'Export failed' });
        throw error;
      }
    },
  });

  // Data import mutation
  const importData = useMutation({
    mutationFn: async (options: ImportOptions & { file: File }) => {
      setSyncProgress({ operation: 'import', progress: 0, currentStep: 'Validating file...' });

      try {
        const result = await dataSyncService.importData(options, (progress, step) => {
          setSyncProgress({ operation: 'import', progress, currentStep: step });
        });

        setSyncProgress({ operation: null, progress: 100, currentStep: 'Import completed' });

        // Refresh integrity status after import
        integrityStatus.refetch();

        return result;
      } catch (_error) {
        setSyncProgress({ operation: null, progress: 0, currentStep: 'Import failed' });
        throw error;
      }
    },
  });

  // Data integrity check mutation
  const checkIntegrity = useMutation({
    mutationFn: async (options?: { fix?: boolean; skipBackup?: boolean }) => {
      setSyncProgress({
        operation: 'integrity_check',
        progress: 0,
        currentStep: 'Starting integrity check...',
      });

      try {
        const result = await dataSyncService.checkDataIntegrity(
          targetProfileId!,
          options,
          (progress, step) => {
            setSyncProgress({ operation: 'integrity_check', progress, currentStep: step });
          }
        );

        setSyncProgress({
          operation: null,
          progress: 100,
          currentStep: 'Integrity check completed',
        });

        // Refresh integrity status
        integrityStatus.refetch();

        return result;
      } catch (_error) {
        setSyncProgress({ operation: null, progress: 0, currentStep: 'Integrity check failed' });
        throw error;
      }
    },
  });

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: async (options?: { description?: string; includeMedia?: boolean }) => {
      return await dataSyncService.createBackup(targetProfileId!, options);
    },
    onSuccess: () => {
      backupHistory.refetch();
    },
  });

  // Restore from backup mutation
  const restoreBackup = useMutation({
    mutationFn: async (backupId: string) => {
      return await dataSyncService.restoreBackup(backupId);
    },
    onSuccess: () => {
      integrityStatus.refetch();
      backupHistory.refetch();
    },
  });

  // Quick actions and utilities
  const quickActions = useMemo(
    () => ({
      exportAllData: async () => {
        if (!targetProfileId) throw new Error('No profile selected');

        return exportData.mutateAsync({
          format: 'json',
          profileId: targetProfileId,
          includeMedia: true,
          dataTypes: ['workouts', 'exercises', 'maxLogs', 'bodyMetrics', 'trainingPlans'],
        });
      },

      quickIntegrityCheck: async () => {
        if (!targetProfileId) throw new Error('No profile selected');
        return checkIntegrity.mutateAsync({ fix: false });
      },

      createFullBackup: async () => {
        if (!targetProfileId) throw new Error('No profile selected');
        return createBackup.mutateAsync({
          description: `Full backup - ${new Date().toISOString()}`,
          includeMedia: true,
        });
      },

      validateAndFix: async () => {
        if (!targetProfileId) throw new Error('No profile selected');

        // Create backup first
        await createBackup.mutateAsync({
          description: 'Pre-fix backup',
          includeMedia: false,
        });

        // Then run integrity check with fixes
        return checkIntegrity.mutateAsync({ fix: true, skipBackup: true });
      },
    }),
    [targetProfileId, exportData, checkIntegrity, createBackup]
  );

  // Health summary
  const healthSummary = useMemo(() => {
    const status = integrityStatus.data;
    if (!status) return null;

    const criticalIssues = status.issues.filter((i) => i.severity === 'critical').length;
    const highIssues = status.issues.filter((i) => i.severity === 'high').length;
    const mediumIssues = status.issues.filter((i) => i.severity === 'medium').length;
    const lowIssues = status.issues.filter((i) => i.severity === 'low').length;

    let healthScore = 100;
    healthScore -= criticalIssues * 25;
    healthScore -= highIssues * 10;
    healthScore -= mediumIssues * 5;
    healthScore -= lowIssues * 1;
    healthScore = Math.max(0, healthScore);

    let healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (healthScore >= 90) healthGrade = 'A';
    else if (healthScore >= 80) healthGrade = 'B';
    else if (healthScore >= 70) healthGrade = 'C';
    else if (healthScore >= 60) healthGrade = 'D';
    else healthGrade = 'F';

    return {
      score: healthScore,
      grade: healthGrade,
      issues: {
        critical: criticalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues,
        total: status.issues.length,
      },
      needsAttention: criticalIssues > 0 || highIssues > 2,
      summary: status.summary,
    };
  }, [integrityStatus.data]);

  // Format validation utilities
  const validators = useMemo(
    () => ({
      validateImportFile: (file: File, format: 'json' | 'csv' | 'xml') => {
        const errors: string[] = [];

        // Check file type
        const expectedTypes = {
          json: ['application/json', 'text/json'],
          csv: ['text/csv', 'application/csv'],
          xml: ['text/xml', 'application/xml'],
        };

        if (!expectedTypes[format].includes(file.type) && !file.name.endsWith(`.${format}`)) {
          errors.push(`File should be a ${format.toUpperCase()} file`);
        }

        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          errors.push('File size should be less than 50MB');
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },
    }),
    []
  );

  return {
    // Core data
    integrityStatus: integrityStatus.data || null,
    backupHistory: backupHistory.data || [],
    healthSummary,
    syncProgress,

    // Operations
    export: exportData,
    import: importData,
    checkIntegrity,
    createBackup,
    restoreBackup,

    // Quick actions
    quickActions,

    // Utilities
    validators,

    // Loading states
    isLoadingStatus: integrityStatus.isLoading,
    isLoadingBackups: backupHistory.isLoading,
    isExporting: exportData.isPending,
    isImporting: importData.isPending,
    isCheckingIntegrity: checkIntegrity.isPending,
    isCreatingBackup: createBackup.isPending,
    isRestoring: restoreBackup.isPending,

    // Error states
    statusError: integrityStatus.error,
    backupError: backupHistory.error,
    exportError: exportData.error,
    importError: importData.error,
    integrityError: checkIntegrity.error,
    backupOpError: createBackup.error,
    restoreError: restoreBackup.error,

    // Status indicators
    hasIntegrityIssues: !!healthSummary?.issues.total,
    needsUrgentAttention: !!healthSummary?.issues.critical,
    isSyncing: syncProgress.operation !== null,

    // Data refresh
    refresh: useCallback(() => {
      integrityStatus.refetch();
      backupHistory.refetch();
    }, [integrityStatus, backupHistory]),
  };
}

/**
 * Type definition for the useDataSyncManager hook return value
 */
export type UseDataSyncManagerResult = ReturnType<typeof useDataSyncManager>;
