import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BulkDeleteOptions,
  CleanupResult,
  MaintenanceService,
  MaintenanceStatus,
} from '@/features/maintenance/services/MaintenanceService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { MaintenanceQueryService } from '../MaintenanceQueryService';

describe('MaintenanceQueryService', () => {
  let maintenanceQueryService: MaintenanceQueryService;
  let mockMaintenanceService: {
    bulkDelete: ReturnType<typeof vi.fn>;
    optimizeDatabase: ReturnType<typeof vi.fn>;
    validateDataIntegrity: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testCleanupResult: CleanupResult = {
    totalItemsDeleted: 150,
    categoriesProcessed: ['expired_sessions', 'orphaned_sets', 'old_logs'],
    deletedByCategory: {
      expired_sessions: 50,
      orphaned_sets: 75,
      old_logs: 25,
    },
    spaceFreed: 2048000, // 2MB in bytes
    processingTime: 1250, // milliseconds
    completedAt: new Date('2024-01-21T10:30:00Z'),
  };

  const testMaintenanceStatus: MaintenanceStatus = {
    phase: 'cleaning_orphaned_data',
    progress: 0.65,
    currentCategory: 'orphaned_sets',
    totalCategories: 4,
    completedCategories: 2,
    currentCategoryProgress: 0.8,
    itemsProcessed: 98,
    totalItems: 150,
    estimatedTimeRemaining: 300000, // 5 minutes in milliseconds
  };

  const testOptimizationResult = {
    message: 'Database optimization completed successfully',
    operationsPerformed: [
      'Rebuilt indexes on workout_logs table',
      'Analyzed table statistics',
      'Cleaned up temporary files',
      'Optimized query cache',
    ],
  };

  const testValidationResult = {
    isValid: true,
    issues: [] as string[],
    totalRecordsChecked: 25000,
  };

  beforeEach(() => {
    // Create service mock
    mockMaintenanceService = {
      bulkDelete: vi.fn(),
      optimizeDatabase: vi.fn(),
      validateDataIntegrity: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    maintenanceQueryService = new MaintenanceQueryService(mockMaintenanceService as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('bulkDelete', () => {
    it('should return cleanup results when service succeeds', async () => {
      // Arrange
      const deleteOption: BulkDeleteOptions = 'orphaned_data';
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.success(testCleanupResult));

      // Act
      const result = await maintenanceQueryService.bulkDelete(deleteOption);

      // Assert
      expect(result).toEqual(testCleanupResult);
      expect(mockMaintenanceService.bulkDelete).toHaveBeenCalledWith(deleteOption, undefined);
    });

    it('should handle bulk delete with progress callback', async () => {
      // Arrange
      const deleteOption: BulkDeleteOptions = 'old_workout_logs';
      const onProgress = vi.fn();
      mockMaintenanceService.bulkDelete.mockImplementation(async (option, progressCallback) => {
        // Simulate progress updates
        if (progressCallback) {
          progressCallback({ ...testMaintenanceStatus, progress: 0.25 });
          progressCallback({ ...testMaintenanceStatus, progress: 0.5 });
          progressCallback({ ...testMaintenanceStatus, progress: 0.75 });
          progressCallback({ ...testMaintenanceStatus, progress: 1.0, phase: 'completed' });
        }
        return Result.success(testCleanupResult);
      });

      // Act
      const result = await maintenanceQueryService.bulkDelete(deleteOption, onProgress);

      // Assert
      expect(result).toEqual(testCleanupResult);
      expect(mockMaintenanceService.bulkDelete).toHaveBeenCalledWith(deleteOption, onProgress);
      expect(onProgress).toHaveBeenCalledTimes(4);
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ progress: 1.0 }));
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const deleteOption: BulkDeleteOptions = 'expired_sessions';
      const error = new ApplicationError('Failed to perform bulk delete operation');
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maintenanceQueryService.bulkDelete(deleteOption)).rejects.toThrow(error);
      expect(mockMaintenanceService.bulkDelete).toHaveBeenCalledWith(deleteOption, undefined);
    });

    it('should handle different bulk delete options', async () => {
      // Arrange
      const deleteOptions: BulkDeleteOptions[] = [
        'orphaned_data',
        'old_workout_logs',
        'expired_sessions',
        'temporary_files',
      ];
      const results = deleteOptions.map((option, index) => ({
        ...testCleanupResult,
        totalItemsDeleted: (index + 1) * 50,
        categoriesProcessed: [`category_${index}`],
      }));

      deleteOptions.forEach((option, index) => {
        mockMaintenanceService.bulkDelete.mockResolvedValueOnce(Result.success(results[index]));
      });

      // Act & Assert
      for (let i = 0; i < deleteOptions.length; i++) {
        const result = await maintenanceQueryService.bulkDelete(deleteOptions[i]);
        expect(result).toEqual(results[i]);
      }

      expect(mockMaintenanceService.bulkDelete).toHaveBeenCalledTimes(4);
    });

    it('should handle zero items deleted scenario', async () => {
      // Arrange
      const deleteOption: BulkDeleteOptions = 'orphaned_data';
      const emptyResult: CleanupResult = {
        totalItemsDeleted: 0,
        categoriesProcessed: [],
        deletedByCategory: {},
        spaceFreed: 0,
        processingTime: 50,
        completedAt: new Date(),
      };
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.success(emptyResult));

      // Act
      const result = await maintenanceQueryService.bulkDelete(deleteOption);

      // Assert
      expect(result).toEqual(emptyResult);
      expect(result.totalItemsDeleted).toBe(0);
      expect(result.spaceFreed).toBe(0);
    });

    it('should handle large scale deletion', async () => {
      // Arrange
      const deleteOption: BulkDeleteOptions = 'old_workout_logs';
      const largeResult: CleanupResult = {
        totalItemsDeleted: 100000,
        categoriesProcessed: [
          'workout_logs_2020',
          'workout_logs_2021',
          'workout_logs_2022',
          'orphaned_sets',
          'temporary_data',
        ],
        deletedByCategory: {
          workout_logs_2020: 25000,
          workout_logs_2021: 30000,
          workout_logs_2022: 35000,
          orphaned_sets: 8000,
          temporary_data: 2000,
        },
        spaceFreed: 1073741824, // 1GB in bytes
        processingTime: 300000, // 5 minutes
        completedAt: new Date(),
      };
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.success(largeResult));

      // Act
      const result = await maintenanceQueryService.bulkDelete(deleteOption);

      // Assert
      expect(result).toEqual(largeResult);
      expect(result.totalItemsDeleted).toBe(100000);
      expect(result.spaceFreed).toBe(1073741824);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const deleteOption: BulkDeleteOptions = 'orphaned_data';
      const unexpectedError = new Error('Unexpected bulk delete error');
      mockMaintenanceService.bulkDelete.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(maintenanceQueryService.bulkDelete(deleteOption)).rejects.toThrow(
        unexpectedError
      );
    });
  });

  describe('optimizeDatabase', () => {
    it('should return optimization results when service succeeds', async () => {
      // Arrange
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(
        Result.success(testOptimizationResult)
      );

      // Act
      const result = await maintenanceQueryService.optimizeDatabase();

      // Assert
      expect(result).toEqual(testOptimizationResult);
      expect(mockMaintenanceService.optimizeDatabase).toHaveBeenCalledWith();
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to optimize database');
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maintenanceQueryService.optimizeDatabase()).rejects.toThrow(error);
      expect(mockMaintenanceService.optimizeDatabase).toHaveBeenCalledWith();
    });

    it('should handle comprehensive optimization results', async () => {
      // Arrange
      const comprehensiveResult = {
        message: 'Complete database optimization finished',
        operationsPerformed: [
          'Rebuilt primary indexes on all tables',
          'Updated table statistics',
          'Defragmented data files',
          'Optimized query execution plans',
          'Cleaned up transaction logs',
          'Reorganized clustered indexes',
          'Updated column statistics',
          'Cleaned temporary workspace',
        ],
      };
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(
        Result.success(comprehensiveResult)
      );

      // Act
      const result = await maintenanceQueryService.optimizeDatabase();

      // Assert
      expect(result).toEqual(comprehensiveResult);
      expect(result.operationsPerformed.length).toBe(8);
    });

    it('should handle minimal optimization results', async () => {
      // Arrange
      const minimalResult = {
        message: 'No optimization needed',
        operationsPerformed: [],
      };
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(Result.success(minimalResult));

      // Act
      const result = await maintenanceQueryService.optimizeDatabase();

      // Assert
      expect(result).toEqual(minimalResult);
      expect(result.operationsPerformed.length).toBe(0);
    });

    it('should handle database lock errors', async () => {
      // Arrange
      const error = new ApplicationError('Database is locked by another process');
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maintenanceQueryService.optimizeDatabase()).rejects.toThrow(error);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected optimization error');
      mockMaintenanceService.optimizeDatabase.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(maintenanceQueryService.optimizeDatabase()).rejects.toThrow(unexpectedError);
    });
  });

  describe('validateDataIntegrity', () => {
    it('should return validation results when service succeeds with no issues', async () => {
      // Arrange
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(
        Result.success(testValidationResult)
      );

      // Act
      const result = await maintenanceQueryService.validateDataIntegrity();

      // Assert
      expect(result).toEqual(testValidationResult);
      expect(mockMaintenanceService.validateDataIntegrity).toHaveBeenCalledWith();
    });

    it('should return validation results with issues detected', async () => {
      // Arrange
      const resultWithIssues = {
        isValid: false,
        issues: [
          'Orphaned workout sets detected in workout_sets table',
          'Missing foreign key references in max_logs table',
          'Duplicate entries found in body_metrics table',
          'Invalid date ranges in training_cycles table',
        ],
        totalRecordsChecked: 50000,
      };
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(
        Result.success(resultWithIssues)
      );

      // Act
      const result = await maintenanceQueryService.validateDataIntegrity();

      // Assert
      expect(result).toEqual(resultWithIssues);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBe(4);
      expect(result.totalRecordsChecked).toBe(50000);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to validate data integrity');
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maintenanceQueryService.validateDataIntegrity()).rejects.toThrow(error);
      expect(mockMaintenanceService.validateDataIntegrity).toHaveBeenCalledWith();
    });

    it('should handle large-scale validation', async () => {
      // Arrange
      const largeScaleResult = {
        isValid: true,
        issues: [],
        totalRecordsChecked: 1000000,
      };
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(
        Result.success(largeScaleResult)
      );

      // Act
      const result = await maintenanceQueryService.validateDataIntegrity();

      // Assert
      expect(result).toEqual(largeScaleResult);
      expect(result.totalRecordsChecked).toBe(1000000);
    });

    it('should handle empty database validation', async () => {
      // Arrange
      const emptyDbResult = {
        isValid: true,
        issues: [],
        totalRecordsChecked: 0,
      };
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(Result.success(emptyDbResult));

      // Act
      const result = await maintenanceQueryService.validateDataIntegrity();

      // Assert
      expect(result).toEqual(emptyDbResult);
      expect(result.totalRecordsChecked).toBe(0);
    });

    it('should handle critical integrity issues', async () => {
      // Arrange
      const criticalIssuesResult = {
        isValid: false,
        issues: [
          'CRITICAL: Primary key violations detected',
          'CRITICAL: Foreign key constraints broken',
          'WARNING: Some records have null required fields',
          'INFO: Minor timestamp inconsistencies found',
        ],
        totalRecordsChecked: 75000,
      };
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(
        Result.success(criticalIssuesResult)
      );

      // Act
      const result = await maintenanceQueryService.validateDataIntegrity();

      // Assert
      expect(result).toEqual(criticalIssuesResult);
      expect(result.issues.some((issue) => issue.includes('CRITICAL'))).toBe(true);
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const error = new ApplicationError('Cannot connect to database for validation');
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maintenanceQueryService.validateDataIntegrity()).rejects.toThrow(error);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected validation error');
      mockMaintenanceService.validateDataIntegrity.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(maintenanceQueryService.validateDataIntegrity()).rejects.toThrow(
        unexpectedError
      );
    });
  });

  describe('dependency injection', () => {
    it('should use injected MaintenanceService', () => {
      // Arrange & Act
      const service = new MaintenanceQueryService(mockMaintenanceService as any);

      // Assert
      expect(service).toBeInstanceOf(MaintenanceQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from MaintenanceService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific maintenance error');
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(maintenanceQueryService.bulkDelete('orphaned_data')).rejects.toBe(originalError);
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await maintenanceQueryService.optimizeDatabase().catch((error) => error);

      // Assert
      expect(thrownError).toBe(originalError);
      expect(thrownError.stack).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent maintenance operations', async () => {
      // Arrange
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.success(testCleanupResult));
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(
        Result.success(testOptimizationResult)
      );
      mockMaintenanceService.validateDataIntegrity.mockResolvedValue(
        Result.success(testValidationResult)
      );

      // Act
      const [cleanupResult, optimizeResult, validationResult] = await Promise.all([
        maintenanceQueryService.bulkDelete('orphaned_data'),
        maintenanceQueryService.optimizeDatabase(),
        maintenanceQueryService.validateDataIntegrity(),
      ]);

      // Assert
      expect(cleanupResult).toEqual(testCleanupResult);
      expect(optimizeResult).toEqual(testOptimizationResult);
      expect(validationResult).toEqual(testValidationResult);
      expect(mockMaintenanceService.bulkDelete).toHaveBeenCalledTimes(1);
      expect(mockMaintenanceService.optimizeDatabase).toHaveBeenCalledTimes(1);
      expect(mockMaintenanceService.validateDataIntegrity).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.success(testCleanupResult));
      mockMaintenanceService.optimizeDatabase.mockResolvedValue(
        Result.failure(new ApplicationError('Optimization failed'))
      );

      // Act
      const cleanupResult = await maintenanceQueryService.bulkDelete('orphaned_data');
      const optimizeError = await maintenanceQueryService.optimizeDatabase().catch((e) => e);

      // Assert
      expect(cleanupResult).toEqual(testCleanupResult);
      expect(optimizeError).toBeInstanceOf(ApplicationError);
    });

    it('should handle sequential maintenance workflow', async () => {
      // Arrange - Setup a typical maintenance workflow
      const validationWithIssues = {
        isValid: false,
        issues: ['Orphaned data detected'],
        totalRecordsChecked: 10000,
      };
      mockMaintenanceService.validateDataIntegrity.mockResolvedValueOnce(
        Result.success(validationWithIssues)
      );
      mockMaintenanceService.bulkDelete.mockResolvedValueOnce(Result.success(testCleanupResult));
      mockMaintenanceService.optimizeDatabase.mockResolvedValueOnce(
        Result.success(testOptimizationResult)
      );
      mockMaintenanceService.validateDataIntegrity.mockResolvedValueOnce(
        Result.success(testValidationResult)
      );

      // Act - Execute maintenance workflow
      const initialValidation = await maintenanceQueryService.validateDataIntegrity();
      const cleanup = await maintenanceQueryService.bulkDelete('orphaned_data');
      const optimization = await maintenanceQueryService.optimizeDatabase();
      const finalValidation = await maintenanceQueryService.validateDataIntegrity();

      // Assert
      expect(initialValidation.isValid).toBe(false);
      expect(cleanup.totalItemsDeleted).toBeGreaterThan(0);
      expect(optimization.operationsPerformed.length).toBeGreaterThan(0);
      expect(finalValidation.isValid).toBe(true);
    });
  });

  describe('chunking and performance handling', () => {
    it('should handle chunked bulk delete with progress tracking', async () => {
      // Arrange
      const onProgress = vi.fn();
      mockMaintenanceService.bulkDelete.mockImplementation(async (option, progressCallback) => {
        // Simulate chunked processing with detailed progress updates
        const chunks = 10;
        for (let i = 1; i <= chunks; i++) {
          if (progressCallback) {
            progressCallback({
              ...testMaintenanceStatus,
              progress: i / chunks,
              itemsProcessed: Math.floor((i / chunks) * testMaintenanceStatus.totalItems),
              estimatedTimeRemaining: Math.floor((chunks - i) * 30000), // 30 seconds per chunk
            });
          }
        }
        return Result.success(testCleanupResult);
      });

      // Act
      const result = await maintenanceQueryService.bulkDelete('old_workout_logs', onProgress);

      // Assert
      expect(result).toEqual(testCleanupResult);
      expect(onProgress).toHaveBeenCalledTimes(10);
      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({ progress: 1.0, estimatedTimeRemaining: 0 })
      );
    });

    it('should handle long-running maintenance operations', async () => {
      // Arrange
      const longRunningResult: CleanupResult = {
        ...testCleanupResult,
        processingTime: 1800000, // 30 minutes
        totalItemsDeleted: 500000,
      };
      mockMaintenanceService.bulkDelete.mockResolvedValue(Result.success(longRunningResult));

      // Act
      const result = await maintenanceQueryService.bulkDelete('old_workout_logs');

      // Assert
      expect(result).toEqual(longRunningResult);
      expect(result.processingTime).toBe(1800000);
      expect(result.totalItemsDeleted).toBe(500000);
    });
  });
});
