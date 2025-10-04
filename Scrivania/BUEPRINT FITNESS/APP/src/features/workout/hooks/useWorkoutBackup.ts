import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from 'tsyringe';

import { DataSyncService } from '@/features/data-sync/services/DataSyncService';
import { ExportService } from '@/features/data-sync/services/ExportService';

export interface BackupFile {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  data: string; // Base64 encoded backup data
  checksum: string;
  version: string;
}

export interface BackupData {
  version: string;
  createdAt: string;
  profileId: string;
  data: {
    workouts: any[];
    maxLogs: any[];
    exercises: any[];
    bodyMetrics: any[];
    trainingPlans: any[];
  };
  checksum: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  isAutomatic: boolean;
  status: 'success' | 'failed' | 'corrupted';
}

interface UseWorkoutBackupResult {
  createBackup: () => Promise<BackupFile>;
  restoreFromBackup: (backupData: BackupData) => Promise<void>;
  backupHistory: BackupRecord[];
  autoBackup: boolean;
  setAutoBackup: (enabled: boolean) => void;
  deleteBackup: (backupId: string) => Promise<void>;
  validateBackup: (backupData: BackupData) => Promise<boolean>;
  isBackingUp: boolean;
  isRestoring: boolean;
}

/**
 * Hook for automated workout data backup and restore functionality.
 *
 * Provides comprehensive backup and restore capabilities using existing export/import
 * services. Ensures data safety through automated backups, integrity validation,
 * and reliable restore functionality without requiring cloud storage.
 *
 * @param profileId The profile ID to backup data for
 * @returns Object with backup/restore functions and configuration
 *
 * @example
 * ```typescript
 * const {
 *   createBackup,
 *   restoreFromBackup,
 *   backupHistory,
 *   autoBackup,
 *   setAutoBackup
 * } = useWorkoutBackup(profileId);
 *
 * // Create manual backup
 * const handleCreateBackup = async () => {
 *   const backup = await createBackup();
 *   console.log('Backup created:', backup.filename);
 * };
 *
 * // Restore from backup
 * const handleRestore = async (backupData: BackupData) => {
 *   await restoreFromBackup(backupData);
 *   alert('Data restored successfully!');
 * };
 *
 * // Enable automatic backups
 * const handleToggleAutoBackup = () => {
 *   setAutoBackup(!autoBackup);
 * };
 * ```
 */
export function useWorkoutBackup(profileId: string): UseWorkoutBackupResult {
  const exportService = useMemo(() => {
    try {
      return container.resolve(ExportService);
    } catch (_error) {
      console.error('Failed to resolve ExportService:', _error);
      return null;
    }
  }, []);

  const dataSyncService = useMemo(() => {
    try {
      return container.resolve(DataSyncService);
    } catch (_error) {
      console.error('Failed to resolve DataSyncService:', _error);
      return null;
    }
  }, []);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [autoBackup, setAutoBackupState] = useState(false);

  /**
   * Creates a backup file with all user data
   */
  const createBackup = useCallback(async (): Promise<BackupFile> => {
    if (!exportService) {
      throw new Error('Export service not available');
    }

    setIsBackingUp(true);

    try {
      // Export all data using the existing export service
      const exportData = await exportService.exportAllData(profileId);

      // Create backup metadata
      const backupData: BackupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        profileId,
        data: exportData,
        checksum: '', // Will be calculated
      };

      // Calculate checksum for data integrity
      const dataString = JSON.stringify(backupData.data);
      const checksum = await generateChecksum(dataString);
      backupData.checksum = checksum;

      // Encode backup data
      const backupString = JSON.stringify(backupData);
      const encodedData = btoa(backupString); // Base64 encode

      // Create backup file
      const backupFile: BackupFile = {
        id: `backup_${Date.now()}`,
        filename: `workout_backup_${new Date().toISOString().split('T')[0]}.bkp`,
        size: encodedData.length,
        createdAt: new Date(),
        data: encodedData,
        checksum,
        version: '1.0',
      };

      // Store backup record
      const newRecord: BackupRecord = {
        id: backupFile.id,
        filename: backupFile.filename,
        size: backupFile.size,
        createdAt: backupFile.createdAt,
        isAutomatic: false, // Manual backup for now
        status: 'success',
      };

      const updatedHistory = [newRecord, ...backupHistory].slice(0, 10); // Keep last 10 backups
      setBackupHistory(updatedHistory);

      // Save backup history to localStorage
      localStorage.setItem(`backup_history_${profileId}`, JSON.stringify(updatedHistory));

      return backupFile;
    } catch (_error) {
      console.error('Error creating backup:', _error);
      throw new Error('Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  }, [profileId, exportService, backupHistory]);

  /**
   * Restores data from a backup file
   */
  const restoreFromBackup = useCallback(
    async (backupData: BackupData): Promise<void> => {
      if (!dataSyncService) {
        throw new Error('Data sync service not available');
      }

      setIsRestoring(true);

      try {
        // Validate backup integrity
        const isValid = await validateBackup(backupData);
        if (!isValid) {
          throw new Error('Backup file is corrupted or invalid');
        }

        // Confirm with user (this would typically be handled by the UI)
        const confirmed = confirm(
          'This will replace all current data with the backup. Are you sure you want to continue?'
        );
        if (!confirmed) {
          return;
        }

        // Restore data using the import service
        await dataSyncService.importData(backupData.data);

        console.log('Data restored successfully from backup');
      } catch (_error) {
        console.error('Error restoring from backup:', _error);
        throw new Error('Failed to restore from backup');
      } finally {
        setIsRestoring(false);
      }
    },
    [profileId, dataSyncService]
  );

  /**
   * Validates backup file integrity
   */
  const validateBackup = useCallback(async (backupData: BackupData): Promise<boolean> => {
    try {
      // Check required fields
      if (!backupData.version || !backupData.data || !backupData.checksum) {
        return false;
      }

      // Verify checksum
      const dataString = JSON.stringify(backupData.data);
      const calculatedChecksum = await generateChecksum(dataString);

      return calculatedChecksum === backupData.checksum;
    } catch (_error) {
      console.error('Error validating backup:', _error);
      return false;
    }
  }, []);

  /**
   * Deletes a backup from history
   */
  const deleteBackup = useCallback(
    async (backupId: string): Promise<void> => {
      try {
        const updatedHistory = backupHistory.filter((record) => record.id !== backupId);
        setBackupHistory(updatedHistory);

        // Update localStorage
        localStorage.setItem(`backup_history_${profileId}`, JSON.stringify(updatedHistory));
      } catch (_error) {
        console.error('Error deleting backup:', _error);
        throw new Error('Failed to delete backup');
      }
    },
    [backupHistory, profileId]
  );

  /**
   * Sets auto-backup preference
   */
  const setAutoBackup = useCallback(
    (enabled: boolean) => {
      setAutoBackupState(enabled);
      localStorage.setItem(`auto_backup_${profileId}`, JSON.stringify(enabled));
    },
    [profileId]
  );

  // Load backup settings and history on mount
  useEffect(() => {
    const loadBackupSettings = async () => {
      try {
        // Load auto-backup setting
        const autoBackupSetting = localStorage.getItem(`auto_backup_${profileId}`);
        if (autoBackupSetting !== null) {
          setAutoBackupState(JSON.parse(autoBackupSetting));
        }

        // Load backup history
        const historyData = localStorage.getItem(`backup_history_${profileId}`);
        if (historyData !== null) {
          const history = JSON.parse(historyData);
          setBackupHistory(
            history.map((record: any) => ({
              ...record,
              createdAt: new Date(record.createdAt),
            }))
          );
        }
      } catch (_error) {
        console.error('Error loading backup settings:', _error);
      }
    };

    loadBackupSettings();
  }, [profileId]);

  // Auto-backup scheduler
  useEffect(() => {
    if (!autoBackup) return;

    const scheduleNextBackup = () => {
      const now = new Date();
      const nextBackup = new Date(now);
      nextBackup.setDate(nextBackup.getDate() + 7); // Weekly backups
      nextBackup.setHours(2, 0, 0, 0); // 2 AM

      const timeUntilBackup = nextBackup.getTime() - now.getTime();

      return setTimeout(async () => {
        try {
          await createBackup();
          scheduleNextBackup(); // Schedule the next backup
        } catch (_error) {
          console.error('Auto-backup failed:', _error);
        }
      }, timeUntilBackup);
    };

    const timeoutId = scheduleNextBackup();
    return () => clearTimeout(timeoutId);
  }, [autoBackup, profileId, createBackup]);

  return {
    createBackup,
    restoreFromBackup,
    backupHistory,
    autoBackup,
    setAutoBackup,
    deleteBackup,
    validateBackup,
    isBackingUp,
    isRestoring,
  };
}

/**
 * Generates a simple checksum for data integrity validation
 */
async function generateChecksum(data: string): Promise<string> {
  // Simple hash function for demonstration
  // In production, you might want to use crypto.subtle.digest for better security
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
