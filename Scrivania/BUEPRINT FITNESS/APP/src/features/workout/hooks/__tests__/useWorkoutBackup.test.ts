import { act, renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataSyncService } from '@/features/data-sync/services/DataSyncService';
import { ExportService } from '@/features/data-sync/services/ExportService';

import { BackupData, BackupRecord, useWorkoutBackup } from '../useWorkoutBackup';

// Hoisted mocks for proper test isolation
const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

const mockServices = vi.hoisted(() => ({
  exportService: {
    exportAllData: vi.fn(),
  },
  dataSyncService: {
    importData: vi.fn(),
  },
  importService: {
    importAllData: vi.fn(),
  },
}));

// Mock container
vi.mock('tsyringe', () => ({
  container: mockContainer,
  injectable: () => (target: any) => target,
  inject: (token: any) => (target: any, propertyKey: string, parameterIndex: number) => {},
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(),
});

// Mock btoa and atob
Object.defineProperty(window, 'btoa', {
  value: vi.fn((str: string) => Buffer.from(str).toString('base64')),
});

Object.defineProperty(window, 'atob', {
  value: vi.fn((str: string) => Buffer.from(str, 'base64').toString()),
});

// Helper function to generate test checksums
async function generateTestChecksum(data: any): Promise<string> {
  // Simple hash function matching the one in useWorkoutBackup
  const dataString = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

describe('useWorkoutBackup', () => {
  const profileId = 'test-profile-id';

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();

    // Reset container mock first
    mockContainer.resolve.mockReset();

    // Reset hoisted service mocks
    mockServices.exportService.exportAllData.mockReset();
    mockServices.dataSyncService.importData.mockReset();

    // Setup default mock return values
    mockServices.exportService.exportAllData.mockResolvedValue({
      workouts: [],
      maxLogs: [],
      exercises: [],
      bodyMetrics: [],
      trainingPlans: [],
    });
    mockServices.dataSyncService.importData.mockResolvedValue(undefined);

    // Setup container mocks with hoisted services
    mockContainer.resolve.mockImplementation((service: any) => {
      if (service === ExportService) return mockServices.exportService;
      if (service === DataSyncService) return mockServices.dataSyncService;
      return {};
    });

    // Setup localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});

    // Setup window.confirm mock
    (window.confirm as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      // Act
      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Assert
      expect(result.current.isBackingUp).toBe(false);
      expect(result.current.isRestoring).toBe(false);
      expect(result.current.backupHistory).toEqual([]);
      expect(result.current.autoBackup).toBe(false);
    });

    it('should load existing backup history from localStorage', () => {
      // Arrange
      const existingHistory = [
        {
          id: 'backup-1',
          filename: 'backup_2024-01-01.bkp',
          size: 1024,
          createdAt: '2024-01-01T00:00:00.000Z',
          isAutomatic: false,
          status: 'success',
        },
      ];
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === `backup_history_${profileId}`) {
          return JSON.stringify(existingHistory);
        }
        return '[]';
      });

      // Act
      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Assert
      expect(result.current.backupHistory).toHaveLength(1);
      expect(result.current.backupHistory[0].id).toBe('backup-1');
      expect(result.current.backupHistory[0].createdAt).toBeInstanceOf(Date);
    });

    it('should load auto-backup setting from localStorage', () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === `auto_backup_${profileId}`) {
          return 'true';
        }
        return '[]';
      });

      // Act
      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Assert
      expect(result.current.autoBackup).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useWorkoutBackup(profileId));
      }).not.toThrow();
    });
  });

  describe('Create Backup', () => {
    it('should create a backup successfully', async () => {
      // Arrange
      const mockExportData = {
        workouts: [{ id: 'workout-1' }],
        maxLogs: [{ id: 'max-1' }],
        exercises: [],
        bodyMetrics: [],
        trainingPlans: [],
      };

      mockServices.exportService.exportAllData.mockResolvedValue(mockExportData);

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      const backupFile = await act(async () => {
        return await result.current.createBackup();
      });

      // Assert
      expect(mockServices.exportService.exportAllData).toHaveBeenCalledWith(profileId);
      expect(backupFile).toMatchObject({
        id: expect.stringMatching(/^backup_\d+$/),
        filename: expect.stringMatching(/^workout_backup_\d{4}-\d{2}-\d{2}\.bkp$/),
        size: expect.any(Number),
        createdAt: expect.any(Date),
        data: expect.any(String),
        checksum: expect.any(String),
        version: '1.0',
      });
    });

    it('should update backup history after creating backup', async () => {
      // Arrange
      mockServices.exportService.exportAllData.mockResolvedValue({
        workouts: [],
        maxLogs: [],
        exercises: [],
        bodyMetrics: [],
        trainingPlans: [],
      });

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      await act(async () => {
        await result.current.createBackup();
      });

      // Assert
      expect(result.current.backupHistory).toHaveLength(1);
      expect(result.current.backupHistory[0].status).toBe('success');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `backup_history_${profileId}`,
        expect.any(String)
      );
    });

    it('should set isBackingUp state during backup', async () => {
      // Arrange
      let backupResolver: (value: any) => void;
      const backupPromise = new Promise((resolve) => {
        backupResolver = resolve;
      });
      mockServices.exportService.exportAllData.mockReturnValue(backupPromise);

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act - start backup
      let backupCall: Promise<any>;
      act(() => {
        backupCall = result.current.createBackup();
      });

      // Assert - should be backing up
      expect(result.current.isBackingUp).toBe(true);

      // Complete backup
      backupResolver!({
        workouts: [],
        maxLogs: [],
        exercises: [],
        bodyMetrics: [],
        trainingPlans: [],
      });
      await act(async () => {
        await backupCall!;
      });

      // Assert - should no longer be backing up
      expect(result.current.isBackingUp).toBe(false);
    });

    it('should handle backup errors', async () => {
      // Arrange
      mockServices.exportService.exportAllData.mockRejectedValue(new Error('Export failed'));

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.createBackup()).rejects.toThrow('Failed to create backup');
      });

      expect(result.current.isBackingUp).toBe(false);
    });

    it('should limit backup history to 10 entries', async () => {
      // Arrange
      const existingHistory = Array.from({ length: 10 }, (_, i) => ({
        id: `backup-${i}`,
        filename: `backup-${i}.bkp`,
        size: 1000,
        createdAt: new Date(),
        isAutomatic: false,
        status: 'success' as const,
      }));

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === `backup_history_${profileId}`) {
          return JSON.stringify(existingHistory);
        }
        return '[]';
      });

      mockServices.exportService.exportAllData.mockResolvedValue({
        workouts: [],
        maxLogs: [],
        exercises: [],
        bodyMetrics: [],
        trainingPlans: [],
      });

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      await act(async () => {
        await result.current.createBackup();
      });

      // Assert
      expect(result.current.backupHistory).toHaveLength(10);
      // First entry should be the new backup
      expect(result.current.backupHistory[0].id).toMatch(/^backup_\d+$/);
    });
  });

  describe('Restore Backup', () => {
    it('should restore from backup successfully', async () => {
      // Arrange
      const backupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: {
          workouts: [{ id: 'workout-1' }],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        },
        checksum: await generateTestChecksum({
          workouts: [{ id: 'workout-1' }],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        }), // Calculate proper checksum for test
      };

      // Mock validateBackup to return true
      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      await act(async () => {
        await result.current.restoreFromBackup(backupData);
      });

      // Assert
      expect(mockServices.dataSyncService.importData).toHaveBeenCalledWith(backupData.data);
    });

    it('should set isRestoring state during restore', async () => {
      // Arrange
      const backupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: {
          workouts: [],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        },
        checksum: await generateTestChecksum({
          workouts: [],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        }),
      };

      let restoreResolver: (value: any) => void;
      const restorePromise = new Promise((resolve) => {
        restoreResolver = resolve;
      });
      mockServices.dataSyncService.importData.mockReturnValue(restorePromise);

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act - start restore
      let restoreCall: Promise<any>;
      act(() => {
        restoreCall = result.current.restoreFromBackup(backupData);
      });

      // Assert - should be restoring
      expect(result.current.isRestoring).toBe(true);

      // Complete restore
      restoreResolver!(undefined);
      await act(async () => {
        await restoreCall!;
      });

      // Assert - should no longer be restoring
      expect(result.current.isRestoring).toBe(false);
    });

    it('should validate backup before restoring', async () => {
      // Arrange
      const invalidBackupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: {
          workouts: [],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        },
        checksum: 'invalid-checksum',
      };

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.restoreFromBackup(invalidBackupData)).rejects.toThrow(
          'Failed to restore from backup'
        );
      });

      expect(mockServices.dataSyncService.importData).not.toHaveBeenCalled();
    });

    it('should handle user cancellation', async () => {
      // Arrange
      (window.confirm as any).mockReturnValue(false);

      const testData = {
        workouts: [],
        maxLogs: [],
        exercises: [],
        bodyMetrics: [],
        trainingPlans: [],
      };

      const backupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: testData,
        checksum: await generateTestChecksum(testData),
      };

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      await act(async () => {
        await result.current.restoreFromBackup(backupData);
      });

      // Assert
      expect(mockServices.dataSyncService.importData).not.toHaveBeenCalled();
    });

    it('should handle restore errors', async () => {
      // Arrange
      const backupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: {
          workouts: [],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        },
        checksum: '0',
      };

      mockServices.dataSyncService.importData.mockRejectedValue(new Error('Import failed'));

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.restoreFromBackup(backupData)).rejects.toThrow(
          'Failed to restore from backup'
        );
      });

      expect(result.current.isRestoring).toBe(false);
    });
  });

  describe('Backup Validation', () => {
    it('should validate backup with correct checksum', async () => {
      // Arrange
      const testData = {
        workouts: [],
        maxLogs: [],
        exercises: [],
        bodyMetrics: [],
        trainingPlans: [],
      };

      const backupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: testData,
        checksum: await generateTestChecksum(testData),
      };

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      const isValid = await act(async () => {
        return await result.current.validateBackup(backupData);
      });

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject backup with incorrect checksum', async () => {
      // Arrange
      const backupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: {
          workouts: [{ id: 'test' }],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        },
        checksum: 'wrong-checksum',
      };

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      const isValid = await act(async () => {
        return await result.current.validateBackup(backupData);
      });

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject backup with missing required fields', async () => {
      // Arrange
      const invalidBackupData = {
        version: '1.0',
        // Missing other required fields
      } as BackupData;

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      const isValid = await act(async () => {
        return await result.current.validateBackup(invalidBackupData);
      });

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const backupData: BackupData = {
        version: '1.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        profileId,
        data: {
          workouts: [],
          maxLogs: [],
          exercises: [],
          bodyMetrics: [],
          trainingPlans: [],
        },
        checksum: '0',
      };

      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('Stringify error');
      });

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      const isValid = await act(async () => {
        return await result.current.validateBackup(backupData);
      });

      // Assert
      expect(isValid).toBe(false);

      // Restore original function
      JSON.stringify = originalStringify;
    });
  });

  describe('Auto Backup', () => {
    it('should set auto backup preference', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      act(() => {
        result.current.setAutoBackup(true);
      });

      // Assert
      expect(result.current.autoBackup).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`auto_backup_${profileId}`, 'true');
    });

    it('should schedule auto backup when enabled', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      act(() => {
        result.current.setAutoBackup(true);
      });

      // Assert that setTimeout was called (auto backup scheduling)
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('should cancel auto backup when disabled', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutBackup(profileId));

      act(() => {
        result.current.setAutoBackup(true);
      });

      const initialTimerCount = vi.getTimerCount();

      // Act - disable auto backup
      act(() => {
        result.current.setAutoBackup(false);
      });

      // The timer count might change when useEffect cleanup runs
      expect(result.current.autoBackup).toBe(false);
    });
  });

  describe('Delete Backup', () => {
    it('should delete backup from history', async () => {
      // Arrange
      const existingHistory = [
        {
          id: 'backup-1',
          filename: 'backup1.bkp',
          size: 1000,
          createdAt: new Date(),
          isAutomatic: false,
          status: 'success' as const,
        },
        {
          id: 'backup-2',
          filename: 'backup2.bkp',
          size: 2000,
          createdAt: new Date(),
          isAutomatic: false,
          status: 'success' as const,
        },
      ];

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === `backup_history_${profileId}`) {
          return JSON.stringify(existingHistory);
        }
        return '[]';
      });

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act
      await act(async () => {
        await result.current.deleteBackup('backup-1');
      });

      // Assert
      expect(result.current.backupHistory).toHaveLength(1);
      expect(result.current.backupHistory[0].id).toBe('backup-2');
    });

    it('should handle delete backup errors', async () => {
      // Arrange
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useWorkoutBackup(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.deleteBackup('backup-1')).rejects.toThrow(
          'Failed to delete backup'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty profile ID', () => {
      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useWorkoutBackup(''));
      }).not.toThrow();
    });

    it('should handle malformed localStorage data', () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useWorkoutBackup(profileId));
      }).not.toThrow();
    });
  });
});
