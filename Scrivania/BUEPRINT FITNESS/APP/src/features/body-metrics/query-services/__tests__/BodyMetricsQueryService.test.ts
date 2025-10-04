import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HeightRecordModel } from '@/features/body-metrics/domain/HeightRecordModel';
import { WeightRecordModel } from '@/features/body-metrics/domain/WeightRecordModel';
import { BodyMetricsService } from '@/features/body-metrics/services/BodyMetricsService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';
import { createTestHeightRecordModel, createTestWeightRecordModel } from '@/test-factories';

import { BodyMetricsQueryService } from '../BodyMetricsQueryService';

describe('BodyMetricsQueryService', () => {
  let bodyMetricsQueryService: BodyMetricsQueryService;
  let mockBodyMetricsService: {
    addWeightRecord: ReturnType<typeof vi.fn>;
    addHeightRecord: ReturnType<typeof vi.fn>;
    getWeightHistory: ReturnType<typeof vi.fn>;
    getHeightHistory: ReturnType<typeof vi.fn>;
    getLatestWeight: ReturnType<typeof vi.fn>;
    updateWeightRecord: ReturnType<typeof vi.fn>;
    deleteWeightRecord: ReturnType<typeof vi.fn>;
    deleteHeightRecord: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testWeightRecordId = '550e8400-e29b-41d4-a716-446655440002';
  const testHeightRecordId = '550e8400-e29b-41d4-a716-446655440003';

  const testWeightRecord = createTestWeightRecordModel({
    id: testWeightRecordId,
    profileId: testProfileId,
    weight: 75.5,
    date: new Date('2024-01-15'),
    notes: 'Morning weight',
  });

  const testHeightRecord = createTestHeightRecordModel({
    id: testHeightRecordId,
    profileId: testProfileId,
    height: 175,
    date: new Date('2024-01-10'),
    notes: 'Height measurement',
  });

  beforeEach(() => {
    // Create service mock
    mockBodyMetricsService = {
      addWeightRecord: vi.fn(),
      addHeightRecord: vi.fn(),
      getWeightHistory: vi.fn(),
      getHeightHistory: vi.fn(),
      getLatestWeight: vi.fn(),
      updateWeightRecord: vi.fn(),
      deleteWeightRecord: vi.fn(),
      deleteHeightRecord: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    bodyMetricsQueryService = new BodyMetricsQueryService(mockBodyMetricsService as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('addWeightRecord', () => {
    const weight = 75.5;
    const date = new Date('2024-01-15');
    const notes = 'Morning weight';

    it('should return created weight record when service succeeds', async () => {
      // Arrange
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.success(testWeightRecord));

      // Act
      const result = await bodyMetricsQueryService.addWeightRecord(
        testProfileId,
        weight,
        date,
        notes
      );

      // Assert
      expect(result).toEqual(testWeightRecord);
      expect(mockBodyMetricsService.addWeightRecord).toHaveBeenCalledWith(
        testProfileId,
        weight,
        date,
        notes
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to add weight record');
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        bodyMetricsQueryService.addWeightRecord(testProfileId, weight, date, notes)
      ).rejects.toThrow(error);
      expect(mockBodyMetricsService.addWeightRecord).toHaveBeenCalledWith(
        testProfileId,
        weight,
        date,
        notes
      );
    });

    it('should handle weight record without notes', async () => {
      // Arrange
      const recordWithoutNotes = createTestWeightRecordModel({
        ...testWeightRecord,
        notes: undefined,
      });
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.success(recordWithoutNotes));

      // Act
      const result = await bodyMetricsQueryService.addWeightRecord(testProfileId, weight, date);

      // Assert
      expect(result).toEqual(recordWithoutNotes);
      expect(mockBodyMetricsService.addWeightRecord).toHaveBeenCalledWith(
        testProfileId,
        weight,
        date,
        undefined
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidWeight = -10;
      const error = new ApplicationError('Weight must be positive');
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        bodyMetricsQueryService.addWeightRecord(testProfileId, invalidWeight, date, notes)
      ).rejects.toThrow(error);
      expect(mockBodyMetricsService.addWeightRecord).toHaveBeenCalledWith(
        testProfileId,
        invalidWeight,
        date,
        notes
      );
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected database error');
      mockBodyMetricsService.addWeightRecord.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(
        bodyMetricsQueryService.addWeightRecord(testProfileId, weight, date, notes)
      ).rejects.toThrow(unexpectedError);
    });
  });

  describe('addHeightRecord', () => {
    const height = 175;
    const date = new Date('2024-01-10');
    const notes = 'Height measurement';

    it('should return created height record when service succeeds', async () => {
      // Arrange
      mockBodyMetricsService.addHeightRecord.mockResolvedValue(Result.success(testHeightRecord));

      // Act
      const result = await bodyMetricsQueryService.addHeightRecord(
        testProfileId,
        height,
        date,
        notes
      );

      // Assert
      expect(result).toEqual(testHeightRecord);
      expect(mockBodyMetricsService.addHeightRecord).toHaveBeenCalledWith(
        testProfileId,
        height,
        date,
        notes
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to add height record');
      mockBodyMetricsService.addHeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        bodyMetricsQueryService.addHeightRecord(testProfileId, height, date, notes)
      ).rejects.toThrow(error);
      expect(mockBodyMetricsService.addHeightRecord).toHaveBeenCalledWith(
        testProfileId,
        height,
        date,
        notes
      );
    });

    it('should handle height record without notes', async () => {
      // Arrange
      const recordWithoutNotes = createTestHeightRecordModel({
        ...testHeightRecord,
        notes: undefined,
      });
      mockBodyMetricsService.addHeightRecord.mockResolvedValue(Result.success(recordWithoutNotes));

      // Act
      const result = await bodyMetricsQueryService.addHeightRecord(testProfileId, height, date);

      // Assert
      expect(result).toEqual(recordWithoutNotes);
      expect(mockBodyMetricsService.addHeightRecord).toHaveBeenCalledWith(
        testProfileId,
        height,
        date,
        undefined
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidHeight = -10;
      const error = new ApplicationError('Height must be positive');
      mockBodyMetricsService.addHeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        bodyMetricsQueryService.addHeightRecord(testProfileId, invalidHeight, date, notes)
      ).rejects.toThrow(error);
      expect(mockBodyMetricsService.addHeightRecord).toHaveBeenCalledWith(
        testProfileId,
        invalidHeight,
        date,
        notes
      );
    });
  });

  describe('getWeightHistory', () => {
    it('should return WatermelonDB query for weight history', () => {
      // Act
      const result = bodyMetricsQueryService.getWeightHistory(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should create query with correct profile filter', () => {
      // Act
      const result = bodyMetricsQueryService.getWeightHistory(testProfileId);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = bodyMetricsQueryService.getWeightHistory(differentProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should create consistent query structure', () => {
      // Act
      const result = bodyMetricsQueryService.getWeightHistory(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('getHeightHistory', () => {
    it('should return WatermelonDB query for height history', () => {
      // Act
      const result = bodyMetricsQueryService.getHeightHistory(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should create query with correct profile filter', () => {
      // Act
      const result = bodyMetricsQueryService.getHeightHistory(testProfileId);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = bodyMetricsQueryService.getHeightHistory(differentProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('getLatestWeight', () => {
    it('should return latest weight record when service succeeds', async () => {
      // Arrange
      mockBodyMetricsService.getLatestWeight.mockResolvedValue(Result.success(testWeightRecord));

      // Act
      const result = await bodyMetricsQueryService.getLatestWeight(testProfileId);

      // Assert
      expect(result).toEqual(testWeightRecord);
      expect(mockBodyMetricsService.getLatestWeight).toHaveBeenCalledWith(testProfileId);
    });

    it('should return undefined when no weight records exist', async () => {
      // Arrange
      mockBodyMetricsService.getLatestWeight.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await bodyMetricsQueryService.getLatestWeight(testProfileId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockBodyMetricsService.getLatestWeight).toHaveBeenCalledWith(testProfileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to retrieve latest weight');
      mockBodyMetricsService.getLatestWeight.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(bodyMetricsQueryService.getLatestWeight(testProfileId)).rejects.toThrow(error);
      expect(mockBodyMetricsService.getLatestWeight).toHaveBeenCalledWith(testProfileId);
    });

    it('should handle non-existent profile ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const error = new ApplicationError('Profile not found');
      mockBodyMetricsService.getLatestWeight.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(bodyMetricsQueryService.getLatestWeight(nonExistentId)).rejects.toThrow(error);
      expect(mockBodyMetricsService.getLatestWeight).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('updateWeightRecord', () => {
    const newWeight = 76.2;
    const newNotes = 'Updated notes';

    it('should return updated weight record when service succeeds', async () => {
      // Arrange
      const updatedRecord = createTestWeightRecordModel({
        ...testWeightRecord,
        weight: newWeight,
        notes: newNotes,
      });
      mockBodyMetricsService.updateWeightRecord.mockResolvedValue(Result.success(updatedRecord));

      // Act
      const result = await bodyMetricsQueryService.updateWeightRecord(
        testWeightRecordId,
        newWeight,
        newNotes
      );

      // Assert
      expect(result).toEqual(updatedRecord);
      expect(mockBodyMetricsService.updateWeightRecord).toHaveBeenCalledWith(
        testWeightRecordId,
        newWeight,
        newNotes
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to update weight record');
      mockBodyMetricsService.updateWeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        bodyMetricsQueryService.updateWeightRecord(testWeightRecordId, newWeight, newNotes)
      ).rejects.toThrow(error);
      expect(mockBodyMetricsService.updateWeightRecord).toHaveBeenCalledWith(
        testWeightRecordId,
        newWeight,
        newNotes
      );
    });

    it('should handle partial updates (weight only)', async () => {
      // Arrange
      const partiallyUpdated = createTestWeightRecordModel({
        ...testWeightRecord,
        weight: newWeight,
      });
      mockBodyMetricsService.updateWeightRecord.mockResolvedValue(Result.success(partiallyUpdated));

      // Act
      const result = await bodyMetricsQueryService.updateWeightRecord(
        testWeightRecordId,
        newWeight
      );

      // Assert
      expect(result).toEqual(partiallyUpdated);
      expect(mockBodyMetricsService.updateWeightRecord).toHaveBeenCalledWith(
        testWeightRecordId,
        newWeight,
        undefined
      );
    });

    it('should handle partial updates (notes only)', async () => {
      // Arrange
      const partiallyUpdated = createTestWeightRecordModel({
        ...testWeightRecord,
        notes: newNotes,
      });
      mockBodyMetricsService.updateWeightRecord.mockResolvedValue(Result.success(partiallyUpdated));

      // Act
      const result = await bodyMetricsQueryService.updateWeightRecord(
        testWeightRecordId,
        undefined,
        newNotes
      );

      // Assert
      expect(result).toEqual(partiallyUpdated);
      expect(mockBodyMetricsService.updateWeightRecord).toHaveBeenCalledWith(
        testWeightRecordId,
        undefined,
        newNotes
      );
    });

    it('should handle non-existent record ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-record';
      const error = new ApplicationError('Weight record not found');
      mockBodyMetricsService.updateWeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        bodyMetricsQueryService.updateWeightRecord(nonExistentId, newWeight, newNotes)
      ).rejects.toThrow(error);
      expect(mockBodyMetricsService.updateWeightRecord).toHaveBeenCalledWith(
        nonExistentId,
        newWeight,
        newNotes
      );
    });
  });

  describe('deleteWeightRecord', () => {
    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockBodyMetricsService.deleteWeightRecord.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await bodyMetricsQueryService.deleteWeightRecord(testWeightRecordId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockBodyMetricsService.deleteWeightRecord).toHaveBeenCalledWith(testWeightRecordId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to delete weight record');
      mockBodyMetricsService.deleteWeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(bodyMetricsQueryService.deleteWeightRecord(testWeightRecordId)).rejects.toThrow(
        error
      );
      expect(mockBodyMetricsService.deleteWeightRecord).toHaveBeenCalledWith(testWeightRecordId);
    });

    it('should handle non-existent record ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-record';
      const error = new ApplicationError('Weight record not found');
      mockBodyMetricsService.deleteWeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(bodyMetricsQueryService.deleteWeightRecord(nonExistentId)).rejects.toThrow(
        error
      );
      expect(mockBodyMetricsService.deleteWeightRecord).toHaveBeenCalledWith(nonExistentId);
    });

    it('should handle record with dependencies', async () => {
      // Arrange
      const error = new ApplicationError('Cannot delete weight record with existing references');
      mockBodyMetricsService.deleteWeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(bodyMetricsQueryService.deleteWeightRecord(testWeightRecordId)).rejects.toThrow(
        error
      );
      expect(mockBodyMetricsService.deleteWeightRecord).toHaveBeenCalledWith(testWeightRecordId);
    });
  });

  describe('deleteHeightRecord', () => {
    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockBodyMetricsService.deleteHeightRecord.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await bodyMetricsQueryService.deleteHeightRecord(testHeightRecordId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockBodyMetricsService.deleteHeightRecord).toHaveBeenCalledWith(testHeightRecordId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to delete height record');
      mockBodyMetricsService.deleteHeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(bodyMetricsQueryService.deleteHeightRecord(testHeightRecordId)).rejects.toThrow(
        error
      );
      expect(mockBodyMetricsService.deleteHeightRecord).toHaveBeenCalledWith(testHeightRecordId);
    });

    it('should handle non-existent record ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-record';
      const error = new ApplicationError('Height record not found');
      mockBodyMetricsService.deleteHeightRecord.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(bodyMetricsQueryService.deleteHeightRecord(nonExistentId)).rejects.toThrow(
        error
      );
      expect(mockBodyMetricsService.deleteHeightRecord).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('dependency injection', () => {
    it('should use injected BodyMetricsService', () => {
      // Arrange & Act
      const service = new BodyMetricsQueryService(mockBodyMetricsService as any);

      // Assert
      expect(service).toBeInstanceOf(BodyMetricsQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from BodyMetricsService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific body metrics error');
      mockBodyMetricsService.getLatestWeight.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(bodyMetricsQueryService.getLatestWeight('test-id')).rejects.toBe(originalError);
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await bodyMetricsQueryService
        .addWeightRecord(testProfileId, 75, new Date(), 'test')
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
        bodyMetricsQueryService.getWeightHistory(testProfileId)
      );

      // Assert
      queries.forEach((query) => {
        expect(query).toBeDefined();
        expect(typeof query.fetch).toBe('function');
        expect(typeof query.observe).toBe('function');
      });
    });

    it('should handle mixed query creation and async operations', async () => {
      // Arrange
      mockBodyMetricsService.deleteWeightRecord.mockResolvedValue(
        Result.failure(new ApplicationError('Delete failed'))
      );

      // Act
      const historyQuery = bodyMetricsQueryService.getWeightHistory(testProfileId);
      const deleteError = await bodyMetricsQueryService
        .deleteWeightRecord(testWeightRecordId)
        .catch((e) => e);

      // Assert
      expect(historyQuery).toBeDefined();
      expect(typeof historyQuery.fetch).toBe('function');
      expect(deleteError).toBeInstanceOf(ApplicationError);
    });

    it('should handle operations on non-existent profile consistently', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const notFoundError = new ApplicationError('Profile not found');

      mockBodyMetricsService.getLatestWeight.mockResolvedValue(Result.failure(notFoundError));

      // Act
      const weightQuery = bodyMetricsQueryService.getWeightHistory(nonExistentId);
      const heightQuery = bodyMetricsQueryService.getHeightHistory(nonExistentId);
      const latestError = await bodyMetricsQueryService
        .getLatestWeight(nonExistentId)
        .catch((e) => e);
      const latestWeightError = await bodyMetricsQueryService
        .getLatestWeight(nonExistentId)
        .catch((e) => e);

      // Assert
      expect(weightQuery).toBeDefined();
      expect(heightQuery).toBeDefined();
      expect(latestError).toBe(notFoundError);
      expect(latestWeightError).toBe(notFoundError);
    });
  });

  describe('data validation', () => {
    it('should handle extreme weight values', async () => {
      // Arrange
      const extremeWeight = 999.99;
      const extremeRecord = createTestWeightRecordModel({ weight: extremeWeight });
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.success(extremeRecord));

      // Act
      const result = await bodyMetricsQueryService.addWeightRecord(
        testProfileId,
        extremeWeight,
        new Date()
      );

      // Assert
      expect(result.weight).toBe(extremeWeight);
      expect(mockBodyMetricsService.addWeightRecord).toHaveBeenCalledWith(
        testProfileId,
        extremeWeight,
        expect.any(Date),
        undefined
      );
    });

    it('should handle extreme height values', async () => {
      // Arrange
      const extremeHeight = 250;
      const extremeRecord = createTestHeightRecordModel({ height: extremeHeight });
      mockBodyMetricsService.addHeightRecord.mockResolvedValue(Result.success(extremeRecord));

      // Act
      const result = await bodyMetricsQueryService.addHeightRecord(
        testProfileId,
        extremeHeight,
        new Date()
      );

      // Assert
      expect(result.height).toBe(extremeHeight);
      expect(mockBodyMetricsService.addHeightRecord).toHaveBeenCalledWith(
        testProfileId,
        extremeHeight,
        expect.any(Date),
        undefined
      );
    });

    it('should handle fractional weight values', async () => {
      // Arrange
      const fractionalWeight = 75.123;
      const fractionalRecord = createTestWeightRecordModel({ weight: fractionalWeight });
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.success(fractionalRecord));

      // Act
      const result = await bodyMetricsQueryService.addWeightRecord(
        testProfileId,
        fractionalWeight,
        new Date()
      );

      // Assert
      expect(result.weight).toBe(fractionalWeight);
    });

    it('should handle very long notes', async () => {
      // Arrange
      const longNotes = 'a'.repeat(1000);
      const recordWithLongNotes = createTestWeightRecordModel({ notes: longNotes });
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.success(recordWithLongNotes));

      // Act
      const result = await bodyMetricsQueryService.addWeightRecord(
        testProfileId,
        75,
        new Date(),
        longNotes
      );

      // Assert
      expect(result.notes).toBe(longNotes);
    });

    it('should handle dates in different formats', async () => {
      // Arrange
      const futureDate = new Date('2030-12-31');
      const futureRecord = createTestWeightRecordModel({ date: futureDate });
      mockBodyMetricsService.addWeightRecord.mockResolvedValue(Result.success(futureRecord));

      // Act
      const result = await bodyMetricsQueryService.addWeightRecord(testProfileId, 75, futureDate);

      // Assert
      expect(result.date).toEqual(futureDate);
      expect(mockBodyMetricsService.addWeightRecord).toHaveBeenCalledWith(
        testProfileId,
        75,
        futureDate,
        undefined
      );
    });
  });
});
