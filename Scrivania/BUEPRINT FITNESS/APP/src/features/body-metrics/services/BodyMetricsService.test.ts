import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { HeightRecordModel } from '@/features/body-metrics/domain/HeightRecordModel';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { WeightRecordModel } from '@/features/body-metrics/domain/WeightRecordModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { createTestHeightRecordModel, createTestWeightRecordModel } from '@/test-factories';

import { BodyMetricsService } from './BodyMetricsService';

describe('BodyMetricsService', () => {
  let bodyMetricsService: BodyMetricsService;
  let mockBodyMetricsRepository: jest.Mocked<IBodyMetricsRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const testProfileId = '550e8400-e29b-41d4-a716-446655440003';
  const testWeight = 75.5;
  const testHeight = 180.0;
  const testDate = new Date('2024-01-15T10:00:00Z');
  const testNotes = 'Test measurement notes';

  const testWeightRecord = createTestWeightRecordModel({
    id: '550e8400-e29b-41d4-a716-446655440004',
    profileId: testProfileId,
    weight: testWeight,
    date: testDate,
    notes: testNotes,
  });

  const testHeightRecord = createTestHeightRecordModel({
    id: '550e8400-e29b-41d4-a716-446655440005',
    profileId: testProfileId,
    height: testHeight,
    date: testDate,
    notes: testNotes,
  });

  beforeEach(() => {
    // Create mocks
    mockBodyMetricsRepository = {
      saveWeight: vi.fn(),
      saveHeight: vi.fn(),
      findWeightHistory: vi.fn(),
      findHeightHistory: vi.fn(),
      findLatestWeight: vi.fn(),
      findWeightById: vi.fn(),
      findHeightById: vi.fn(),
      deleteWeight: vi.fn(),
      deleteHeight: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    bodyMetricsService = new BodyMetricsService(mockBodyMetricsRepository, mockLogger);

    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440006'),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  describe('addWeightRecord', () => {
    it('should successfully add a new weight record', async () => {
      // Arrange
      const expectedRecord = createTestWeightRecordModel({
        id: '550e8400-e29b-41d4-a716-446655440006',
        profileId: testProfileId,
        weight: testWeight,
        date: testDate,
        notes: testNotes,
      });
      mockBodyMetricsRepository.saveWeight.mockResolvedValue(expectedRecord);

      // Act
      const result = await bodyMetricsService.addWeightRecord(
        testProfileId,
        testWeight,
        testDate,
        testNotes
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedRecord);
      expect(mockBodyMetricsRepository.saveWeight).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Adding weight record', {
        profileId: testProfileId,
        weight: testWeight,
        date: testDate.toISOString(),
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Weight record added successfully', {
        recordId: expectedRecord.id,
        profileId: expectedRecord.profileId,
        weight: expectedRecord.weight,
      });
    });

    it('should successfully add a weight record without notes', async () => {
      // Arrange
      const expectedRecord = createTestWeightRecordModel({
        id: '550e8400-e29b-41d4-a716-446655440006',
        profileId: testProfileId,
        weight: testWeight,
        date: testDate,
        notes: undefined,
      });
      mockBodyMetricsRepository.saveWeight.mockResolvedValue(expectedRecord);

      // Act
      const result = await bodyMetricsService.addWeightRecord(testProfileId, testWeight, testDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedRecord);
      expect(mockBodyMetricsRepository.saveWeight).toHaveBeenCalledTimes(1);
    });

    it('should return failure when weight record validation fails', async () => {
      // Arrange
      const invalidWeight = -10; // Negative weight should fail validation
      vi.spyOn(WeightRecordModel.prototype, 'validate').mockReturnValue({
        success: false,
        error: { errors: ['Weight must be positive'] },
      });

      // Act
      const result = await bodyMetricsService.addWeightRecord(
        testProfileId,
        invalidWeight,
        testDate
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Weight record validation failed');
      expect(mockBodyMetricsRepository.saveWeight).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Weight record validation failed',
        undefined,
        expect.objectContaining({
          profileId: testProfileId,
          weight: invalidWeight,
          errors: ['Weight must be positive'],
        })
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockBodyMetricsRepository.saveWeight.mockRejectedValue(repositoryError);

      // Act
      const result = await bodyMetricsService.addWeightRecord(testProfileId, testWeight, testDate);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to add weight record');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to add weight record',
        repositoryError,
        {
          profileId: testProfileId,
          weight: testWeight,
          date: testDate.toISOString(),
        }
      );
    });
  });

  describe('addHeightRecord', () => {
    it('should successfully add a new height record', async () => {
      // Arrange
      const expectedRecord = createTestHeightRecordModel({
        id: '550e8400-e29b-41d4-a716-446655440006',
        profileId: testProfileId,
        height: testHeight,
        date: testDate,
        notes: testNotes,
      });
      mockBodyMetricsRepository.saveHeight.mockResolvedValue(expectedRecord);

      // Act
      const result = await bodyMetricsService.addHeightRecord(
        testProfileId,
        testHeight,
        testDate,
        testNotes
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedRecord);
      expect(mockBodyMetricsRepository.saveHeight).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Adding height record', {
        profileId: testProfileId,
        height: testHeight,
        date: testDate.toISOString(),
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Height record added successfully', {
        recordId: expectedRecord.id,
        profileId: expectedRecord.profileId,
        height: expectedRecord.height,
      });
    });

    it('should return failure when height record validation fails', async () => {
      // Arrange
      const invalidHeight = -50; // Negative height should fail validation
      vi.spyOn(HeightRecordModel.prototype, 'validate').mockReturnValue({
        success: false,
        error: { errors: ['Height must be positive'] },
      });

      // Act
      const result = await bodyMetricsService.addHeightRecord(
        testProfileId,
        invalidHeight,
        testDate
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Height record validation failed');
      expect(mockBodyMetricsRepository.saveHeight).not.toHaveBeenCalled();
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockBodyMetricsRepository.saveHeight.mockRejectedValue(repositoryError);

      // Act
      const result = await bodyMetricsService.addHeightRecord(testProfileId, testHeight, testDate);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to add height record');
    });
  });

  describe('getWeightHistory', () => {
    it('should successfully retrieve weight history', async () => {
      // Arrange
      const weightHistory = [
        testWeightRecord,
        createTestWeightRecordModel({ profileId: testProfileId }),
      ];
      mockBodyMetricsRepository.findWeightHistory.mockResolvedValue(weightHistory);

      // Act
      const result = await bodyMetricsService.getWeightHistory(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(weightHistory);
      expect(mockBodyMetricsRepository.findWeightHistory).toHaveBeenCalledWith(testProfileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving weight history', {
        profileId: testProfileId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Weight history retrieved successfully', {
        profileId: testProfileId,
        recordCount: weightHistory.length,
      });
    });

    it('should return empty array when no weight records exist', async () => {
      // Arrange
      mockBodyMetricsRepository.findWeightHistory.mockResolvedValue([]);

      // Act
      const result = await bodyMetricsService.getWeightHistory(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Weight history retrieved successfully', {
        profileId: testProfileId,
        recordCount: 0,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockBodyMetricsRepository.findWeightHistory.mockRejectedValue(repositoryError);

      // Act
      const result = await bodyMetricsService.getWeightHistory(testProfileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve weight history');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve weight history',
        repositoryError,
        { profileId: testProfileId }
      );
    });
  });

  describe('getHeightHistory', () => {
    it('should successfully retrieve height history', async () => {
      // Arrange
      const heightHistory = [testHeightRecord];
      mockBodyMetricsRepository.findHeightHistory.mockResolvedValue(heightHistory);

      // Act
      const result = await bodyMetricsService.getHeightHistory(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(heightHistory);
      expect(mockBodyMetricsRepository.findHeightHistory).toHaveBeenCalledWith(testProfileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Height history retrieved successfully', {
        profileId: testProfileId,
        recordCount: heightHistory.length,
      });
    });
  });

  describe('getLatestWeight', () => {
    it('should successfully retrieve the latest weight record', async () => {
      // Arrange
      mockBodyMetricsRepository.findLatestWeight.mockResolvedValue(testWeightRecord);

      // Act
      const result = await bodyMetricsService.getLatestWeight(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(testWeightRecord);
      expect(mockBodyMetricsRepository.findLatestWeight).toHaveBeenCalledWith(testProfileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Latest weight retrieved successfully', {
        profileId: testProfileId,
        recordId: testWeightRecord.id,
        weight: testWeightRecord.weight,
      });
    });

    it('should return undefined when no weight records exist', async () => {
      // Arrange
      mockBodyMetricsRepository.findLatestWeight.mockResolvedValue(undefined);

      // Act
      const result = await bodyMetricsService.getLatestWeight(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('No weight records found for profile', {
        profileId: testProfileId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockBodyMetricsRepository.findLatestWeight.mockRejectedValue(repositoryError);

      // Act
      const result = await bodyMetricsService.getLatestWeight(testProfileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve latest weight');
    });
  });

  describe('updateWeightRecord', () => {
    it('should successfully update a weight record', async () => {
      // Arrange
      const recordId = '550e8400-e29b-41d4-a716-446655440004';
      const newWeight = 76.0;
      const newNotes = 'Updated notes';
      const updatedRecord = testWeightRecord
        .cloneWithNewWeight(newWeight)
        .cloneWithNewNotes(newNotes);

      mockBodyMetricsRepository.findWeightById.mockResolvedValue(testWeightRecord);
      mockBodyMetricsRepository.saveWeight.mockResolvedValue(updatedRecord);

      // Act
      const result = await bodyMetricsService.updateWeightRecord(recordId, newWeight, newNotes);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(updatedRecord);
      expect(mockBodyMetricsRepository.saveWeight).toHaveBeenCalledWith(
        expect.any(WeightRecordModel)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Weight record updated successfully', {
        recordId: updatedRecord.id,
        weight: updatedRecord.weight,
      });
    });

    it('should return NotFoundError when weight record does not exist', async () => {
      // Arrange
      const recordId = 'non-existent-record-id';
      mockBodyMetricsRepository.findWeightById.mockResolvedValue(undefined);

      // Act
      const result = await bodyMetricsService.updateWeightRecord(recordId, 80.0);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Weight record not found');
      expect(mockBodyMetricsRepository.saveWeight).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Weight record not found for update', {
        recordId,
      });
    });

    it('should return failure when updated record validation fails', async () => {
      // Arrange
      const recordId = '550e8400-e29b-41d4-a716-446655440004';
      const invalidWeight = -10;

      mockBodyMetricsRepository.findWeightById.mockResolvedValue(testWeightRecord);
      vi.spyOn(WeightRecordModel.prototype, 'validate').mockReturnValue({
        success: false,
        error: { errors: ['Weight must be positive'] },
      });

      // Act
      const result = await bodyMetricsService.updateWeightRecord(recordId, invalidWeight);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Weight record validation failed');
      expect(mockBodyMetricsRepository.saveWeight).not.toHaveBeenCalled();
    });
  });

  describe('deleteWeightRecord', () => {
    it('should successfully delete a weight record', async () => {
      // Arrange
      const recordId = '550e8400-e29b-41d4-a716-446655440004';
      mockBodyMetricsRepository.deleteWeight.mockResolvedValue();

      // Act
      const result = await bodyMetricsService.deleteWeightRecord(recordId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockBodyMetricsRepository.deleteWeight).toHaveBeenCalledWith(recordId);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting weight record', { recordId });
      expect(mockLogger.info).toHaveBeenCalledWith('Weight record deleted successfully', {
        recordId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const recordId = '550e8400-e29b-41d4-a716-446655440004';
      const repositoryError = new Error('Database error');
      mockBodyMetricsRepository.deleteWeight.mockRejectedValue(repositoryError);

      // Act
      const result = await bodyMetricsService.deleteWeightRecord(recordId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to delete weight record');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete weight record',
        repositoryError,
        { recordId }
      );
    });
  });

  describe('deleteHeightRecord', () => {
    it('should successfully delete a height record', async () => {
      // Arrange
      const recordId = '550e8400-e29b-41d4-a716-446655440005';
      mockBodyMetricsRepository.deleteHeight.mockResolvedValue();

      // Act
      const result = await bodyMetricsService.deleteHeightRecord(recordId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockBodyMetricsRepository.deleteHeight).toHaveBeenCalledWith(recordId);
      expect(mockLogger.info).toHaveBeenCalledWith('Height record deleted successfully', {
        recordId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const recordId = '550e8400-e29b-41d4-a716-446655440005';
      const repositoryError = new Error('Database error');
      mockBodyMetricsRepository.deleteHeight.mockRejectedValue(repositoryError);

      // Act
      const result = await bodyMetricsService.deleteHeightRecord(recordId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to delete height record');
    });
  });
});
