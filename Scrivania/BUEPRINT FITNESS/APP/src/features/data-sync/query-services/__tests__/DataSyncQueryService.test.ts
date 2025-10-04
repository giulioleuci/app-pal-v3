import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DataSyncService,
  ExportData,
  ExportStatus,
  ImportStatus,
} from '@/features/data-sync/services/DataSyncService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { ConflictError } from '@/shared/errors/ConflictError';
import { Result } from '@/shared/utils/Result';

import { DataSyncQueryService } from '../DataSyncQueryService';

describe('DataSyncQueryService', () => {
  let dataSyncQueryService: DataSyncQueryService;
  let mockDataSyncService: {
    exportData: ReturnType<typeof vi.fn>;
    importData: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';

  const testExportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date('2024-01-15T10:30:00Z'),
    profileId: testProfileId,
    profile: {
      id: testProfileId,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z'),
    },
    exercises: [
      {
        id: 'exercise-1',
        name: 'Bench Press',
        category: 'chest',
        equipment: 'barbell',
      },
      {
        id: 'exercise-2',
        name: 'Squat',
        category: 'legs',
        equipment: 'barbell',
      },
    ],
    workoutLogs: [
      {
        id: 'workout-1',
        date: new Date('2024-01-10T18:00:00Z'),
        duration: 3600,
        totalVolume: 15000,
      },
    ],
    bodyMetrics: [
      {
        id: 'weight-1',
        type: 'weight',
        value: 75.5,
        date: new Date('2024-01-01T08:00:00Z'),
      },
    ],
    trainingPlans: [],
    maxLogs: [],
  };

  const testExportStatus: ExportStatus = {
    phase: 'exporting_workouts',
    progress: 0.75,
    currentItem: 'Workout logs',
    totalItems: 150,
    completedItems: 112,
  };

  const testImportStatus: ImportStatus = {
    phase: 'importing_exercises',
    progress: 0.5,
    currentItem: 'Exercises',
    totalItems: 50,
    completedItems: 25,
    conflictsDetected: 0,
    itemsSkipped: 0,
    itemsImported: 25,
  };

  beforeEach(() => {
    // Create service mock
    mockDataSyncService = {
      exportData: vi.fn(),
      importData: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    dataSyncQueryService = new DataSyncQueryService(mockDataSyncService as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('exportData', () => {
    it('should return export data when service succeeds', async () => {
      // Arrange
      mockDataSyncService.exportData.mockResolvedValue(Result.success(testExportData));

      // Act
      const result = await dataSyncQueryService.exportData(testProfileId);

      // Assert
      expect(result).toEqual(testExportData);
      expect(mockDataSyncService.exportData).toHaveBeenCalledWith(testProfileId, undefined);
    });

    it('should handle export with progress callback', async () => {
      // Arrange
      const onProgress = vi.fn();
      mockDataSyncService.exportData.mockImplementation(async (profileId, progressCallback) => {
        // Simulate progress updates
        if (progressCallback) {
          progressCallback({ ...testExportStatus, progress: 0.25 });
          progressCallback({ ...testExportStatus, progress: 0.5 });
          progressCallback({ ...testExportStatus, progress: 0.75 });
          progressCallback({ ...testExportStatus, progress: 1.0 });
        }
        return Result.success(testExportData);
      });

      // Act
      const result = await dataSyncQueryService.exportData(testProfileId, onProgress);

      // Assert
      expect(result).toEqual(testExportData);
      expect(mockDataSyncService.exportData).toHaveBeenCalledWith(testProfileId, onProgress);
      expect(onProgress).toHaveBeenCalledTimes(4);
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ progress: 1.0 }));
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to export data');
      mockDataSyncService.exportData.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dataSyncQueryService.exportData(testProfileId)).rejects.toThrow(error);
      expect(mockDataSyncService.exportData).toHaveBeenCalledWith(testProfileId, undefined);
    });

    it('should handle large data export', async () => {
      // Arrange
      const largeExportData: ExportData = {
        ...testExportData,
        workoutLogs: Array.from({ length: 1000 }, (_, i) => ({
          id: `workout-${i}`,
          date: new Date(`2024-01-${String((i % 31) + 1).padStart(2, '0')}T18:00:00Z`),
          duration: 3600 + i * 60,
          totalVolume: 15000 + i * 100,
        })),
        exercises: Array.from({ length: 200 }, (_, i) => ({
          id: `exercise-${i}`,
          name: `Exercise ${i}`,
          category: i % 2 === 0 ? 'chest' : 'back',
          equipment: i % 3 === 0 ? 'barbell' : 'dumbbell',
        })),
      };
      mockDataSyncService.exportData.mockResolvedValue(Result.success(largeExportData));

      // Act
      const result = await dataSyncQueryService.exportData(testProfileId);

      // Assert
      expect(result).toEqual(largeExportData);
      expect(result.workoutLogs.length).toBe(1000);
      expect(result.exercises.length).toBe(200);
    });

    it('should handle empty profile data export', async () => {
      // Arrange
      const emptyExportData: ExportData = {
        ...testExportData,
        exercises: [],
        workoutLogs: [],
        bodyMetrics: [],
        trainingPlans: [],
        maxLogs: [],
      };
      mockDataSyncService.exportData.mockResolvedValue(Result.success(emptyExportData));

      // Act
      const result = await dataSyncQueryService.exportData(testProfileId);

      // Assert
      expect(result).toEqual(emptyExportData);
      expect(result.exercises.length).toBe(0);
      expect(result.workoutLogs.length).toBe(0);
    });

    it('should handle invalid profile ID', async () => {
      // Arrange
      const invalidId = 'invalid-profile-id';
      const error = new ApplicationError('Profile not found');
      mockDataSyncService.exportData.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dataSyncQueryService.exportData(invalidId)).rejects.toThrow(error);
      expect(mockDataSyncService.exportData).toHaveBeenCalledWith(invalidId, undefined);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected export error');
      mockDataSyncService.exportData.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(dataSyncQueryService.exportData(testProfileId)).rejects.toThrow(unexpectedError);
    });
  });

  describe('importData', () => {
    it('should return import status when service succeeds', async () => {
      // Arrange
      const finalStatus: ImportStatus = {
        ...testImportStatus,
        phase: 'completed',
        progress: 1.0,
        currentItem: 'Import complete',
        completedItems: 50,
        itemsImported: 50,
      };
      mockDataSyncService.importData.mockResolvedValue(Result.success(finalStatus));

      // Act
      const result = await dataSyncQueryService.importData(testExportData);

      // Assert
      expect(result).toEqual(finalStatus);
      expect(mockDataSyncService.importData).toHaveBeenCalledWith(testExportData, undefined);
    });

    it('should handle import with progress callback', async () => {
      // Arrange
      const onProgress = vi.fn();
      const finalStatus: ImportStatus = {
        ...testImportStatus,
        phase: 'completed',
        progress: 1.0,
        itemsImported: 50,
      };
      mockDataSyncService.importData.mockImplementation(async (importData, progressCallback) => {
        // Simulate progress updates
        if (progressCallback) {
          progressCallback({ ...testImportStatus, progress: 0.25 });
          progressCallback({ ...testImportStatus, progress: 0.5 });
          progressCallback({ ...testImportStatus, progress: 0.75 });
          progressCallback({ ...testImportStatus, progress: 1.0 });
        }
        return Result.success(finalStatus);
      });

      // Act
      const result = await dataSyncQueryService.importData(testExportData, onProgress);

      // Assert
      expect(result).toEqual(finalStatus);
      expect(mockDataSyncService.importData).toHaveBeenCalledWith(testExportData, onProgress);
      expect(onProgress).toHaveBeenCalledTimes(4);
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ progress: 1.0 }));
    });

    it('should throw ApplicationError when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to import data');
      mockDataSyncService.importData.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dataSyncQueryService.importData(testExportData)).rejects.toThrow(error);
      expect(mockDataSyncService.importData).toHaveBeenCalledWith(testExportData, undefined);
    });

    it('should throw ConflictError when conflicts are detected', async () => {
      // Arrange
      const conflictError = new ConflictError('import.conflicts.detected' as any);
      mockDataSyncService.importData.mockResolvedValue(Result.failure(conflictError));

      // Act & Assert
      await expect(dataSyncQueryService.importData(testExportData)).rejects.toThrow(conflictError);
      expect(mockDataSyncService.importData).toHaveBeenCalledWith(testExportData, undefined);
    });

    it('should handle import with conflicts in status', async () => {
      // Arrange
      const statusWithConflicts: ImportStatus = {
        ...testImportStatus,
        phase: 'completed',
        progress: 1.0,
        conflictsDetected: 5,
        itemsSkipped: 3,
        itemsImported: 47,
      };
      mockDataSyncService.importData.mockResolvedValue(Result.success(statusWithConflicts));

      // Act
      const result = await dataSyncQueryService.importData(testExportData);

      // Assert
      expect(result).toEqual(statusWithConflicts);
      expect(result.conflictsDetected).toBe(5);
      expect(result.itemsSkipped).toBe(3);
    });

    it('should handle large data import', async () => {
      // Arrange
      const largeImportData: ExportData = {
        ...testExportData,
        workoutLogs: Array.from({ length: 5000 }, (_, i) => ({
          id: `workout-${i}`,
          date: new Date('2024-01-01T18:00:00Z'),
          duration: 3600,
          totalVolume: 15000,
        })),
      };
      const largeImportStatus: ImportStatus = {
        ...testImportStatus,
        phase: 'completed',
        progress: 1.0,
        totalItems: 5050,
        completedItems: 5050,
        itemsImported: 5050,
      };
      mockDataSyncService.importData.mockResolvedValue(Result.success(largeImportStatus));

      // Act
      const result = await dataSyncQueryService.importData(largeImportData);

      // Assert
      expect(result).toEqual(largeImportStatus);
      expect(result.totalItems).toBe(5050);
    });

    it('should handle empty import data', async () => {
      // Arrange
      const emptyImportData: ExportData = {
        ...testExportData,
        exercises: [],
        workoutLogs: [],
        bodyMetrics: [],
        trainingPlans: [],
        maxLogs: [],
      };
      const emptyImportStatus: ImportStatus = {
        ...testImportStatus,
        phase: 'completed',
        progress: 1.0,
        totalItems: 0,
        completedItems: 0,
        itemsImported: 0,
      };
      mockDataSyncService.importData.mockResolvedValue(Result.success(emptyImportStatus));

      // Act
      const result = await dataSyncQueryService.importData(emptyImportData);

      // Assert
      expect(result).toEqual(emptyImportStatus);
      expect(result.itemsImported).toBe(0);
    });

    it('should handle invalid import data format', async () => {
      // Arrange
      const invalidData = { invalid: 'format' } as any;
      const error = new ApplicationError('Invalid import data format');
      mockDataSyncService.importData.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dataSyncQueryService.importData(invalidData)).rejects.toThrow(error);
    });

    it('should handle version mismatch in import data', async () => {
      // Arrange
      const outdatedData: ExportData = {
        ...testExportData,
        version: '0.5.0',
      };
      const error = new ApplicationError('Unsupported data version');
      mockDataSyncService.importData.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dataSyncQueryService.importData(outdatedData)).rejects.toThrow(error);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected import error');
      mockDataSyncService.importData.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(dataSyncQueryService.importData(testExportData)).rejects.toThrow(
        unexpectedError
      );
    });
  });

  describe('dependency injection', () => {
    it('should use injected DataSyncService', () => {
      // Arrange & Act
      const service = new DataSyncQueryService(mockDataSyncService as any);

      // Assert
      expect(service).toBeInstanceOf(DataSyncQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from DataSyncService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific data sync error');
      mockDataSyncService.exportData.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(dataSyncQueryService.exportData(testProfileId)).rejects.toBe(originalError);
    });

    it('should preserve ConflictError instances', async () => {
      // Arrange
      const conflictError = new ConflictError('import.conflicts.detected' as any);
      mockDataSyncService.importData.mockResolvedValue(Result.failure(conflictError));

      // Act & Assert
      await expect(dataSyncQueryService.importData(testExportData)).rejects.toBe(conflictError);
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockDataSyncService.exportData.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await dataSyncQueryService
        .exportData(testProfileId)
        .catch((error) => error);

      // Assert
      expect(thrownError).toBe(originalError);
      expect(thrownError.stack).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent export operations', async () => {
      // Arrange
      mockDataSyncService.exportData.mockResolvedValue(Result.success(testExportData));

      // Act
      const promises = Array.from({ length: 3 }, () =>
        dataSyncQueryService.exportData(testProfileId)
      );
      const results = await Promise.all(promises);

      // Assert
      results.forEach((result) => {
        expect(result).toEqual(testExportData);
      });
      expect(mockDataSyncService.exportData).toHaveBeenCalledTimes(3);
    });

    it('should handle export followed by import', async () => {
      // Arrange
      const finalImportStatus: ImportStatus = {
        ...testImportStatus,
        phase: 'completed',
        progress: 1.0,
        itemsImported: 50,
      };
      mockDataSyncService.exportData.mockResolvedValue(Result.success(testExportData));
      mockDataSyncService.importData.mockResolvedValue(Result.success(finalImportStatus));

      // Act
      const exportResult = await dataSyncQueryService.exportData(testProfileId);
      const importResult = await dataSyncQueryService.importData(exportResult);

      // Assert
      expect(exportResult).toEqual(testExportData);
      expect(importResult).toEqual(finalImportStatus);
      expect(mockDataSyncService.exportData).toHaveBeenCalledWith(testProfileId, undefined);
      expect(mockDataSyncService.importData).toHaveBeenCalledWith(exportResult, undefined);
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      mockDataSyncService.exportData.mockResolvedValue(Result.success(testExportData));
      mockDataSyncService.importData.mockResolvedValue(
        Result.failure(new ApplicationError('Import failed'))
      );

      // Act
      const exportResult = await dataSyncQueryService.exportData(testProfileId);
      const importError = await dataSyncQueryService.importData(testExportData).catch((e) => e);

      // Assert
      expect(exportResult).toEqual(testExportData);
      expect(importError).toBeInstanceOf(ApplicationError);
    });
  });

  describe('chunking and performance', () => {
    it('should handle chunked export operations', async () => {
      // Arrange
      const onProgress = vi.fn();
      mockDataSyncService.exportData.mockImplementation(async (profileId, progressCallback) => {
        // Simulate chunked processing with multiple progress updates
        const chunks = 10;
        for (let i = 1; i <= chunks; i++) {
          if (progressCallback) {
            progressCallback({
              ...testExportStatus,
              progress: i / chunks,
              completedItems: Math.floor((i / chunks) * testExportStatus.totalItems),
            });
          }
        }
        return Result.success(testExportData);
      });

      // Act
      const result = await dataSyncQueryService.exportData(testProfileId, onProgress);

      // Assert
      expect(result).toEqual(testExportData);
      expect(onProgress).toHaveBeenCalledTimes(10);
      expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ progress: 1.0 }));
    });

    it('should handle chunked import operations', async () => {
      // Arrange
      const onProgress = vi.fn();
      const finalStatus: ImportStatus = {
        ...testImportStatus,
        phase: 'completed',
        progress: 1.0,
      };
      mockDataSyncService.importData.mockImplementation(async (importData, progressCallback) => {
        // Simulate chunked processing
        const chunks = 5;
        for (let i = 1; i <= chunks; i++) {
          if (progressCallback) {
            progressCallback({
              ...testImportStatus,
              progress: i / chunks,
              completedItems: Math.floor((i / chunks) * testImportStatus.totalItems),
            });
          }
        }
        return Result.success(finalStatus);
      });

      // Act
      const result = await dataSyncQueryService.importData(testExportData, onProgress);

      // Assert
      expect(result).toEqual(finalStatus);
      expect(onProgress).toHaveBeenCalledTimes(5);
      expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ progress: 1.0 }));
    });
  });
});
