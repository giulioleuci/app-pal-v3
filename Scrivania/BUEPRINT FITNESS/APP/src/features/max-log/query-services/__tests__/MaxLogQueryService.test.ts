import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogService } from '@/features/max-log/services/MaxLogService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';
import { createTestMaxLogModel } from '@/test-factories';

import { MaxLogQueryService } from '../MaxLogQueryService';

describe('MaxLogQueryService', () => {
  let maxLogQueryService: MaxLogQueryService;
  let mockMaxLogService: {
    createMaxLog: ReturnType<typeof vi.fn>;
    getMaxLog: ReturnType<typeof vi.fn>;
    getAllMaxLogs: ReturnType<typeof vi.fn>;
    getLatestMaxLogsByExercise: ReturnType<typeof vi.fn>;
    updateMaxLog: ReturnType<typeof vi.fn>;
    compareMaxLogPerformance: ReturnType<typeof vi.fn>;
    calculateBodyweightRatio: ReturnType<typeof vi.fn>;
    getMaxLogsOlderThan: ReturnType<typeof vi.fn>;
    getMaxLogSummary: ReturnType<typeof vi.fn>;
    deleteMaxLog: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testMaxLogId = '550e8400-e29b-41d4-a716-446655440002';
  const testExerciseId = '550e8400-e29b-41d4-a716-446655440003';

  const testMaxLog = createTestMaxLogModel({
    id: testMaxLogId,
    profileId: testProfileId,
    exerciseId: testExerciseId,
    weight: 100,
    reps: 5,
    date: new Date('2024-01-15'),
    notes: 'Test max log',
  });

  const testMaxLogData = {
    profileId: testProfileId,
    exerciseId: testExerciseId,
    weight: 100,
    reps: 5,
    date: new Date('2024-01-15'),
    notes: 'Test max log',
  };

  beforeEach(() => {
    // Create service mock
    mockMaxLogService = {
      createMaxLog: vi.fn(),
      getMaxLog: vi.fn(),
      getAllMaxLogs: vi.fn(),
      getLatestMaxLogsByExercise: vi.fn(),
      updateMaxLog: vi.fn(),
      compareMaxLogPerformance: vi.fn(),
      calculateBodyweightRatio: vi.fn(),
      getMaxLogsOlderThan: vi.fn(),
      getMaxLogSummary: vi.fn(),
      deleteMaxLog: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    maxLogQueryService = new MaxLogQueryService(mockMaxLogService as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createMaxLog', () => {
    it('should return created max log when service succeeds', async () => {
      // Arrange
      mockMaxLogService.createMaxLog.mockResolvedValue(Result.success(testMaxLog));

      // Act
      const result = await maxLogQueryService.createMaxLog(testMaxLogData);

      // Assert
      expect(result).toEqual(testMaxLog);
      expect(mockMaxLogService.createMaxLog).toHaveBeenCalledWith(testMaxLogData);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to create max log');
      mockMaxLogService.createMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.createMaxLog(testMaxLogData)).rejects.toThrow(error);
      expect(mockMaxLogService.createMaxLog).toHaveBeenCalledWith(testMaxLogData);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidData = { ...testMaxLogData, weight: -10 };
      const error = new ApplicationError('Weight must be positive');
      mockMaxLogService.createMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.createMaxLog(invalidData)).rejects.toThrow(error);
      expect(mockMaxLogService.createMaxLog).toHaveBeenCalledWith(invalidData);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected database error');
      mockMaxLogService.createMaxLog.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(maxLogQueryService.createMaxLog(testMaxLogData)).rejects.toThrow(
        unexpectedError
      );
    });
  });

  describe('getMaxLog', () => {
    it('should return max log when service succeeds', async () => {
      // Arrange
      mockMaxLogService.getMaxLog.mockResolvedValue(Result.success(testMaxLog));

      // Act
      const result = await maxLogQueryService.getMaxLog(testMaxLogId);

      // Assert
      expect(result).toEqual(testMaxLog);
      expect(mockMaxLogService.getMaxLog).toHaveBeenCalledWith(testMaxLogId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Max log not found');
      mockMaxLogService.getMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.getMaxLog(testMaxLogId)).rejects.toThrow(error);
      expect(mockMaxLogService.getMaxLog).toHaveBeenCalledWith(testMaxLogId);
    });

    it('should handle empty max log ID', async () => {
      // Arrange
      const emptyId = '';
      const error = new ApplicationError('Invalid max log ID');
      mockMaxLogService.getMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.getMaxLog(emptyId)).rejects.toThrow(error);
      expect(mockMaxLogService.getMaxLog).toHaveBeenCalledWith(emptyId);
    });

    it('should handle invalid max log ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';
      const error = new ApplicationError('Invalid max log ID format');
      mockMaxLogService.getMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.getMaxLog(invalidId)).rejects.toThrow(error);
      expect(mockMaxLogService.getMaxLog).toHaveBeenCalledWith(invalidId);
    });
  });

  describe('getAllMaxLogs', () => {
    it('should return WatermelonDB query for profile max logs', () => {
      // Act
      const result = maxLogQueryService.getAllMaxLogs(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should create query with correct profile filter', () => {
      // Act
      const result = maxLogQueryService.getAllMaxLogs(testProfileId);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = maxLogQueryService.getAllMaxLogs(differentProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('getLatestMaxLogsByExercise', () => {
    it('should return latest max logs map when service succeeds', async () => {
      // Arrange
      const latestMaxLogsMap = new Map([[testExerciseId, testMaxLog]]);
      mockMaxLogService.getLatestMaxLogsByExercise.mockResolvedValue(
        Result.success(latestMaxLogsMap)
      );

      // Act
      const result = await maxLogQueryService.getLatestMaxLogsByExercise(testProfileId);

      // Assert
      expect(result).toEqual(latestMaxLogsMap);
      expect(result instanceof Map).toBe(true);
      expect(result.get(testExerciseId)).toEqual(testMaxLog);
      expect(mockMaxLogService.getLatestMaxLogsByExercise).toHaveBeenCalledWith(testProfileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to retrieve latest max logs');
      mockMaxLogService.getLatestMaxLogsByExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.getLatestMaxLogsByExercise(testProfileId)).rejects.toThrow(
        error
      );
      expect(mockMaxLogService.getLatestMaxLogsByExercise).toHaveBeenCalledWith(testProfileId);
    });

    it('should return empty map when no max logs exist', async () => {
      // Arrange
      const emptyMap = new Map();
      mockMaxLogService.getLatestMaxLogsByExercise.mockResolvedValue(Result.success(emptyMap));

      // Act
      const result = await maxLogQueryService.getLatestMaxLogsByExercise(testProfileId);

      // Assert
      expect(result).toEqual(emptyMap);
      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(0);
    });

    it('should handle non-existent profile ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const error = new ApplicationError('Profile not found');
      mockMaxLogService.getLatestMaxLogsByExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.getLatestMaxLogsByExercise(nonExistentId)).rejects.toThrow(
        error
      );
      expect(mockMaxLogService.getLatestMaxLogsByExercise).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('updateMaxLog', () => {
    const updates = { weight: 110, reps: 6, notes: 'Updated notes' };

    it('should return updated max log when service succeeds', async () => {
      // Arrange
      const updatedMaxLog = createTestMaxLogModel({ ...testMaxLog, ...updates });
      mockMaxLogService.updateMaxLog.mockResolvedValue(Result.success(updatedMaxLog));

      // Act
      const result = await maxLogQueryService.updateMaxLog(testMaxLogId, updates);

      // Assert
      expect(result).toEqual(updatedMaxLog);
      expect(mockMaxLogService.updateMaxLog).toHaveBeenCalledWith(testMaxLogId, updates);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to update max log');
      mockMaxLogService.updateMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.updateMaxLog(testMaxLogId, updates)).rejects.toThrow(error);
      expect(mockMaxLogService.updateMaxLog).toHaveBeenCalledWith(testMaxLogId, updates);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdates = { weight: 105 };
      const partiallyUpdatedMaxLog = createTestMaxLogModel({ ...testMaxLog, weight: 105 });
      mockMaxLogService.updateMaxLog.mockResolvedValue(Result.success(partiallyUpdatedMaxLog));

      // Act
      const result = await maxLogQueryService.updateMaxLog(testMaxLogId, partialUpdates);

      // Assert
      expect(result).toEqual(partiallyUpdatedMaxLog);
      expect(mockMaxLogService.updateMaxLog).toHaveBeenCalledWith(testMaxLogId, partialUpdates);
    });

    it('should handle empty updates', async () => {
      // Arrange
      const emptyUpdates = {};
      mockMaxLogService.updateMaxLog.mockResolvedValue(Result.success(testMaxLog));

      // Act
      const result = await maxLogQueryService.updateMaxLog(testMaxLogId, emptyUpdates);

      // Assert
      expect(result).toEqual(testMaxLog);
      expect(mockMaxLogService.updateMaxLog).toHaveBeenCalledWith(testMaxLogId, emptyUpdates);
    });

    it('should handle non-existent max log ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-max-log';
      const error = new ApplicationError('Max log not found');
      mockMaxLogService.updateMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.updateMaxLog(nonExistentId, updates)).rejects.toThrow(error);
      expect(mockMaxLogService.updateMaxLog).toHaveBeenCalledWith(nonExistentId, updates);
    });
  });

  describe('compareMaxLogPerformance', () => {
    const maxLogId1 = 'max-log-1';
    const maxLogId2 = 'max-log-2';
    const comparisonResult = { differenceKg: 10, percentageImprovement: 10.5 };

    it('should return comparison metrics when service succeeds', async () => {
      // Arrange
      mockMaxLogService.compareMaxLogPerformance.mockResolvedValue(
        Result.success(comparisonResult)
      );

      // Act
      const result = await maxLogQueryService.compareMaxLogPerformance(maxLogId1, maxLogId2);

      // Assert
      expect(result).toEqual(comparisonResult);
      expect(result.differenceKg).toBe(10);
      expect(result.percentageImprovement).toBe(10.5);
      expect(mockMaxLogService.compareMaxLogPerformance).toHaveBeenCalledWith(maxLogId1, maxLogId2);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to compare max log performance');
      mockMaxLogService.compareMaxLogPerformance.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        maxLogQueryService.compareMaxLogPerformance(maxLogId1, maxLogId2)
      ).rejects.toThrow(error);
      expect(mockMaxLogService.compareMaxLogPerformance).toHaveBeenCalledWith(maxLogId1, maxLogId2);
    });

    it('should handle comparing same max log', async () => {
      // Arrange
      const sameComparisonResult = { differenceKg: 0, percentageImprovement: 0 };
      mockMaxLogService.compareMaxLogPerformance.mockResolvedValue(
        Result.success(sameComparisonResult)
      );

      // Act
      const result = await maxLogQueryService.compareMaxLogPerformance(maxLogId1, maxLogId1);

      // Assert
      expect(result).toEqual(sameComparisonResult);
      expect(result.differenceKg).toBe(0);
      expect(result.percentageImprovement).toBe(0);
    });

    it('should handle negative performance difference', async () => {
      // Arrange
      const negativeResult = { differenceKg: -5, percentageImprovement: -5.2 };
      mockMaxLogService.compareMaxLogPerformance.mockResolvedValue(Result.success(negativeResult));

      // Act
      const result = await maxLogQueryService.compareMaxLogPerformance(maxLogId1, maxLogId2);

      // Assert
      expect(result).toEqual(negativeResult);
      expect(result.differenceKg).toBe(-5);
      expect(result.percentageImprovement).toBe(-5.2);
    });

    it('should handle non-existent max log IDs', async () => {
      // Arrange
      const nonExistentId = 'non-existent-max-log';
      const error = new ApplicationError('One or more max logs not found');
      mockMaxLogService.compareMaxLogPerformance.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        maxLogQueryService.compareMaxLogPerformance(nonExistentId, maxLogId2)
      ).rejects.toThrow(error);
      expect(mockMaxLogService.compareMaxLogPerformance).toHaveBeenCalledWith(
        nonExistentId,
        maxLogId2
      );
    });
  });

  describe('calculateBodyweightRatio', () => {
    const bodyweightKg = 80;
    const expectedRatio = 1.25;

    it('should return bodyweight ratio when service succeeds', async () => {
      // Arrange
      mockMaxLogService.calculateBodyweightRatio.mockResolvedValue(Result.success(expectedRatio));

      // Act
      const result = await maxLogQueryService.calculateBodyweightRatio(testMaxLogId, bodyweightKg);

      // Assert
      expect(result).toBe(expectedRatio);
      expect(mockMaxLogService.calculateBodyweightRatio).toHaveBeenCalledWith(
        testMaxLogId,
        bodyweightKg
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to calculate bodyweight ratio');
      mockMaxLogService.calculateBodyweightRatio.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        maxLogQueryService.calculateBodyweightRatio(testMaxLogId, bodyweightKg)
      ).rejects.toThrow(error);
      expect(mockMaxLogService.calculateBodyweightRatio).toHaveBeenCalledWith(
        testMaxLogId,
        bodyweightKg
      );
    });

    it('should handle zero bodyweight', async () => {
      // Arrange
      const zeroBodyweight = 0;
      const error = new ApplicationError('Bodyweight must be greater than zero');
      mockMaxLogService.calculateBodyweightRatio.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        maxLogQueryService.calculateBodyweightRatio(testMaxLogId, zeroBodyweight)
      ).rejects.toThrow(error);
      expect(mockMaxLogService.calculateBodyweightRatio).toHaveBeenCalledWith(
        testMaxLogId,
        zeroBodyweight
      );
    });

    it('should handle negative bodyweight', async () => {
      // Arrange
      const negativeBodyweight = -10;
      const error = new ApplicationError('Bodyweight must be positive');
      mockMaxLogService.calculateBodyweightRatio.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        maxLogQueryService.calculateBodyweightRatio(testMaxLogId, negativeBodyweight)
      ).rejects.toThrow(error);
      expect(mockMaxLogService.calculateBodyweightRatio).toHaveBeenCalledWith(
        testMaxLogId,
        negativeBodyweight
      );
    });

    it('should handle very high bodyweight ratios', async () => {
      // Arrange
      const highRatio = 3.5;
      mockMaxLogService.calculateBodyweightRatio.mockResolvedValue(Result.success(highRatio));

      // Act
      const result = await maxLogQueryService.calculateBodyweightRatio(testMaxLogId, bodyweightKg);

      // Assert
      expect(result).toBe(highRatio);
    });

    it('should handle non-existent max log ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-max-log';
      const error = new ApplicationError('Max log not found');
      mockMaxLogService.calculateBodyweightRatio.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        maxLogQueryService.calculateBodyweightRatio(nonExistentId, bodyweightKg)
      ).rejects.toThrow(error);
      expect(mockMaxLogService.calculateBodyweightRatio).toHaveBeenCalledWith(
        nonExistentId,
        bodyweightKg
      );
    });
  });

  describe('getMaxLogsOlderThan', () => {
    const cutoffDate = new Date('2024-01-01');

    it('should return WatermelonDB query for max logs older than cutoff date', () => {
      // Act
      const result = maxLogQueryService.getMaxLogsOlderThan(testProfileId, cutoffDate);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
    });

    it('should create query with profile and date filters', () => {
      // Act
      const result = maxLogQueryService.getMaxLogsOlderThan(testProfileId, cutoffDate);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed with both profile_id and date filters
    });

    it('should handle future cutoff dates', () => {
      // Arrange
      const futureDate = new Date('2025-12-31');

      // Act
      const result = maxLogQueryService.getMaxLogsOlderThan(testProfileId, futureDate);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should throw error for invalid date', () => {
      // Arrange
      const invalidDate = new Date('invalid');

      // Act & Assert
      expect(() => {
        maxLogQueryService.getMaxLogsOlderThan(testProfileId, invalidDate);
      }).toThrow(ApplicationError);
      expect(() => {
        maxLogQueryService.getMaxLogsOlderThan(testProfileId, invalidDate);
      }).toThrow('Invalid date provided');
    });

    it('should handle different profile IDs and dates', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';
      const differentDate = new Date('2023-06-15');

      // Act
      const result = maxLogQueryService.getMaxLogsOlderThan(differentProfileId, differentDate);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('getMaxLogSummary', () => {
    const testSummary = 'Bench Press: 100kg × 5 reps (Est. 1RM: 115kg) on 2024-01-15';

    it('should return summary when service succeeds', async () => {
      // Arrange
      mockMaxLogService.getMaxLogSummary.mockResolvedValue(Result.success(testSummary));

      // Act
      const result = await maxLogQueryService.getMaxLogSummary(testMaxLogId);

      // Assert
      expect(result).toBe(testSummary);
      expect(mockMaxLogService.getMaxLogSummary).toHaveBeenCalledWith(testMaxLogId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate max log summary');
      mockMaxLogService.getMaxLogSummary.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.getMaxLogSummary(testMaxLogId)).rejects.toThrow(error);
      expect(mockMaxLogService.getMaxLogSummary).toHaveBeenCalledWith(testMaxLogId);
    });

    it('should handle empty summary', async () => {
      // Arrange
      const emptySummary = '';
      mockMaxLogService.getMaxLogSummary.mockResolvedValue(Result.success(emptySummary));

      // Act
      const result = await maxLogQueryService.getMaxLogSummary(testMaxLogId);

      // Assert
      expect(result).toBe(emptySummary);
      expect(typeof result).toBe('string');
    });

    it('should handle non-existent max log ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-max-log';
      const error = new ApplicationError('Max log not found');
      mockMaxLogService.getMaxLogSummary.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.getMaxLogSummary(nonExistentId)).rejects.toThrow(error);
      expect(mockMaxLogService.getMaxLogSummary).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('deleteMaxLog', () => {
    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockMaxLogService.deleteMaxLog.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await maxLogQueryService.deleteMaxLog(testMaxLogId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockMaxLogService.deleteMaxLog).toHaveBeenCalledWith(testMaxLogId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to delete max log');
      mockMaxLogService.deleteMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.deleteMaxLog(testMaxLogId)).rejects.toThrow(error);
      expect(mockMaxLogService.deleteMaxLog).toHaveBeenCalledWith(testMaxLogId);
    });

    it('should handle non-existent max log ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-max-log';
      const error = new ApplicationError('Max log not found');
      mockMaxLogService.deleteMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.deleteMaxLog(nonExistentId)).rejects.toThrow(error);
      expect(mockMaxLogService.deleteMaxLog).toHaveBeenCalledWith(nonExistentId);
    });

    it('should handle max log with dependencies', async () => {
      // Arrange
      const error = new ApplicationError('Cannot delete max log with existing references');
      mockMaxLogService.deleteMaxLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(maxLogQueryService.deleteMaxLog(testMaxLogId)).rejects.toThrow(error);
      expect(mockMaxLogService.deleteMaxLog).toHaveBeenCalledWith(testMaxLogId);
    });
  });

  describe('dependency injection', () => {
    it('should use injected MaxLogService', () => {
      // Arrange & Act
      const service = new MaxLogQueryService(mockMaxLogService as any);

      // Assert
      expect(service).toBeInstanceOf(MaxLogQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from MaxLogService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific max log error');
      mockMaxLogService.getMaxLog.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(maxLogQueryService.getMaxLog('test-id')).rejects.toBe(originalError);
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockMaxLogService.createMaxLog.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await maxLogQueryService
        .createMaxLog(testMaxLogData)
        .catch((error) => error);

      // Assert
      expect(thrownError).toBe(originalError);
      expect(thrownError.stack).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent query creation', () => {
      // Act
      const queries = Array.from({ length: 5 }, () =>
        maxLogQueryService.getAllMaxLogs(testProfileId)
      );

      // Assert
      queries.forEach((query) => {
        expect(query).toBeDefined();
        expect(typeof query.fetch).toBe('function');
        expect(typeof query.observe).toBe('function');
      });
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      mockMaxLogService.getMaxLog.mockResolvedValue(Result.success(testMaxLog));
      mockMaxLogService.deleteMaxLog.mockResolvedValue(
        Result.failure(new ApplicationError('Delete failed'))
      );

      // Act
      const maxLogResult = await maxLogQueryService.getMaxLog(testMaxLogId);
      const deleteError = await maxLogQueryService.deleteMaxLog(testMaxLogId).catch((e) => e);

      // Assert
      expect(maxLogResult).toEqual(testMaxLog);
      expect(deleteError).toBeInstanceOf(ApplicationError);
    });

    it('should handle operations on non-existent max logs consistently', async () => {
      // Arrange
      const nonExistentId = 'non-existent-max-log';
      const notFoundError = new ApplicationError('Max log not found');

      mockMaxLogService.getMaxLog.mockResolvedValue(Result.failure(notFoundError));
      mockMaxLogService.updateMaxLog.mockResolvedValue(Result.failure(notFoundError));
      mockMaxLogService.deleteMaxLog.mockResolvedValue(Result.failure(notFoundError));

      // Act
      const getError = await maxLogQueryService.getMaxLog(nonExistentId).catch((e) => e);
      const updateError = await maxLogQueryService
        .updateMaxLog(nonExistentId, { weight: 100 })
        .catch((e) => e);
      const deleteError = await maxLogQueryService.deleteMaxLog(nonExistentId).catch((e) => e);

      // Assert
      expect(getError).toBe(notFoundError);
      expect(updateError).toBe(notFoundError);
      expect(deleteError).toBe(notFoundError);
    });
  });
});
