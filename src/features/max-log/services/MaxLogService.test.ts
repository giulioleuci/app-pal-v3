import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { createTestMaxLogData, createTestMaxLogModel } from '@/test-factories';

import { MaxLogService } from './MaxLogService';

describe('MaxLogService', () => {
  let maxLogService: MaxLogService;
  let mockMaxLogRepository: jest.Mocked<IMaxLogRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const testMaxLog = createTestMaxLogModel({
    id: '550e8400-e29b-41d4-a716-446655440001',
    profileId: '550e8400-e29b-41d4-a716-446655440003',
    exerciseId: '550e8400-e29b-41d4-a716-446655440004',
    weightEnteredByUser: 100,
    reps: 5,
    notes: 'Test max log',
  });

  const testMaxLogData = createTestMaxLogData({
    profileId: '550e8400-e29b-41d4-a716-446655440003',
    exerciseId: '550e8400-e29b-41d4-a716-446655440004',
    weightEnteredByUser: 100,
    reps: 5,
    notes: 'Test max log',
  });

  beforeEach(() => {
    // Create mocks
    mockMaxLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findLatestByExercise: vi.fn(),
      delete: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    maxLogService = new MaxLogService(mockMaxLogRepository, mockLogger);

    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  describe('createMaxLog', () => {
    it('should successfully create a new max log', async () => {
      // Arrange
      const inputData = {
        profileId: '550e8400-e29b-41d4-a716-446655440001',
        exerciseId: '550e8400-e29b-41d4-a716-446655440002',
        weightEnteredByUser: 100,
        reps: 5,
        date: new Date(),
        notes: 'Test max log',
      };
      const expectedMaxLog = createTestMaxLogModel({
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...inputData,
      });
      mockMaxLogRepository.save.mockResolvedValue(expectedMaxLog);

      // Act
      const result = await maxLogService.createMaxLog(inputData);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedMaxLog);
      expect(mockMaxLogRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new max log entry', {
        profileId: inputData.profileId,
        exerciseId: inputData.exerciseId,
        weight: inputData.weightEnteredByUser,
        reps: inputData.reps,
        date: inputData.date,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Max log created successfully', {
        maxLogId: expectedMaxLog.id,
        profileId: expectedMaxLog.profileId,
        exerciseId: expectedMaxLog.exerciseId,
        estimated1RM: expectedMaxLog.estimated1RM,
        isDirect1RM: expectedMaxLog.isDirect1RM(),
      });
    });

    it('should return failure when max log validation fails', async () => {
      // Arrange
      const invalidData = {
        profileId: '',
        exerciseId: '550e8400-e29b-41d4-a716-446655440004',
        weightEnteredByUser: -10, // Invalid negative weight
        reps: 0, // Invalid zero reps
        date: new Date(),
      };
      vi.spyOn(MaxLogModel.prototype, 'validate').mockReturnValue({
        success: false,
        error: {
          errors: ['Profile ID is required', 'Weight must be positive', 'Reps must be positive'],
        },
      });

      // Act
      const result = await maxLogService.createMaxLog(invalidData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Max log validation failed');
      expect(mockMaxLogRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Max log validation failed',
        undefined,
        expect.objectContaining({
          profileId: invalidData.profileId,
          exerciseId: invalidData.exerciseId,
          weight: invalidData.weightEnteredByUser,
          reps: invalidData.reps,
          errors: ['Profile ID is required', 'Weight must be positive', 'Reps must be positive'],
        })
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const inputData = {
        profileId: '550e8400-e29b-41d4-a716-446655440003',
        exerciseId: '550e8400-e29b-41d4-a716-446655440004',
        weightEnteredByUser: 100,
        reps: 5,
        date: new Date(),
      };
      const repositoryError = new Error('Database connection failed');
      mockMaxLogRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.createMaxLog(inputData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to create max log');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create max log', repositoryError, {
        profileId: inputData.profileId,
        exerciseId: inputData.exerciseId,
        weight: inputData.weightEnteredByUser,
        reps: inputData.reps,
      });
    });

    it('should create max log with calculated 1RM estimates', async () => {
      // Arrange
      const inputData = {
        profileId: '550e8400-e29b-41d4-a716-446655440003',
        exerciseId: '550e8400-e29b-41d4-a716-446655440004',
        weightEnteredByUser: 100,
        reps: 5,
        date: new Date(),
      };
      const expectedMaxLog = createTestMaxLogModel({ ...inputData });
      mockMaxLogRepository.save.mockResolvedValue(expectedMaxLog);

      // Act
      const result = await maxLogService.createMaxLog(inputData);

      // Assert
      expect(result.isSuccess).toBe(true);
      const savedMaxLog = result.getValue() as MaxLogModel;
      expect(savedMaxLog.estimated1RM).toBeGreaterThan(0);
      expect(savedMaxLog.maxBrzycki).toBeGreaterThan(0);
      expect(savedMaxLog.maxBaechle).toBeGreaterThan(0);
      expect(mockMaxLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId: inputData.profileId,
          exerciseId: inputData.exerciseId,
          weightEnteredByUser: inputData.weightEnteredByUser,
          reps: inputData.reps,
        })
      );
    });
  });

  describe('getMaxLog', () => {
    it('should successfully retrieve a max log by ID', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);

      // Act
      const result = await maxLogService.getMaxLog(maxLogId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(testMaxLog);
      expect(mockMaxLogRepository.findById).toHaveBeenCalledWith(maxLogId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving max log', { maxLogId });
      expect(mockLogger.info).toHaveBeenCalledWith('Max log retrieved successfully', { maxLogId });
    });

    it('should return NotFoundError when max log does not exist', async () => {
      // Arrange
      const maxLogId = 'non-existent-id';
      mockMaxLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await maxLogService.getMaxLog(maxLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Max log not found');
      expect(mockLogger.warn).toHaveBeenCalledWith('Max log not found', { maxLogId });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.getMaxLog(maxLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve max log');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to retrieve max log', repositoryError, {
        maxLogId,
      });
    });
  });

  describe('getAllMaxLogs', () => {
    it('should successfully retrieve all max logs for a profile', async () => {
      // Arrange
      const profileId = 'profile-1';
      const maxLogs = [
        testMaxLog,
        createTestMaxLogModel({ id: '550e8400-e29b-41d4-a716-446655440006', profileId }),
      ];
      mockMaxLogRepository.findAll.mockResolvedValue(maxLogs);

      // Act
      const result = await maxLogService.getAllMaxLogs(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(maxLogs);
      expect(mockMaxLogRepository.findAll).toHaveBeenCalledWith(profileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving all max logs for profile', {
        profileId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('All max logs retrieved successfully', {
        profileId,
        count: maxLogs.length,
      });
    });

    it('should return empty array when no max logs exist', async () => {
      // Arrange
      const profileId = 'profile-with-no-logs';
      mockMaxLogRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await maxLogService.getAllMaxLogs(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('All max logs retrieved successfully', {
        profileId,
        count: 0,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileId = 'profile-1';
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findAll.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.getAllMaxLogs(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve all max logs');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve all max logs',
        repositoryError,
        {
          profileId,
        }
      );
    });
  });

  describe('getLatestMaxLogsByExercise', () => {
    it('should successfully retrieve latest max logs by exercise', async () => {
      // Arrange
      const profileId = 'profile-1';
      const latestMaxLogs = new Map([
        ['exercise-1', testMaxLog],
        [
          '550e8400-e29b-41d4-a716-446655440007',
          createTestMaxLogModel({
            id: '550e8400-e29b-41d4-a716-446655440006',
            exerciseId: '550e8400-e29b-41d4-a716-446655440007',
          }),
        ],
      ]);
      mockMaxLogRepository.findLatestByExercise.mockResolvedValue(latestMaxLogs);

      // Act
      const result = await maxLogService.getLatestMaxLogsByExercise(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(latestMaxLogs);
      expect(mockMaxLogRepository.findLatestByExercise).toHaveBeenCalledWith(profileId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Retrieving latest max logs by exercise for profile',
        {
          profileId,
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Latest max logs by exercise retrieved successfully',
        {
          profileId,
          exerciseCount: latestMaxLogs.size,
        }
      );
    });

    it('should return empty map when no max logs exist', async () => {
      // Arrange
      const profileId = 'profile-with-no-logs';
      const emptyMap = new Map<string, MaxLogModel>();
      mockMaxLogRepository.findLatestByExercise.mockResolvedValue(emptyMap);

      // Act
      const result = await maxLogService.getLatestMaxLogsByExercise(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(emptyMap);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Latest max logs by exercise retrieved successfully',
        {
          profileId,
          exerciseCount: 0,
        }
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileId = 'profile-1';
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findLatestByExercise.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.getLatestMaxLogsByExercise(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve latest max logs by exercise');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve latest max logs by exercise',
        repositoryError,
        { profileId }
      );
    });
  });

  describe('updateMaxLog', () => {
    it('should successfully update max log details', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const updates = {
        weight: 110,
        reps: 3,
        notes: 'Updated notes',
        date: new Date(),
      };
      const updatedMaxLog = testMaxLog.cloneWithUpdatedDetails(updates);

      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      mockMaxLogRepository.save.mockResolvedValue(updatedMaxLog);

      // Act
      const result = await maxLogService.updateMaxLog(maxLogId, updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(updatedMaxLog);
      expect(mockMaxLogRepository.findById).toHaveBeenCalledWith(maxLogId);
      expect(mockMaxLogRepository.save).toHaveBeenCalledWith(expect.any(MaxLogModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Updating max log', { maxLogId, updates });
      expect(mockLogger.info).toHaveBeenCalledWith('Max log updated successfully', {
        maxLogId: updatedMaxLog.id,
        estimated1RM: updatedMaxLog.estimated1RM,
        isDirect1RM: updatedMaxLog.isDirect1RM(),
      });
    });

    it('should return NotFoundError when max log does not exist', async () => {
      // Arrange
      const maxLogId = 'non-existent-id';
      const updates = { weight: 110 };
      mockMaxLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await maxLogService.updateMaxLog(maxLogId, updates);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Max log not found');
      expect(mockMaxLogRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Max log not found for update', { maxLogId });
    });

    it('should return failure when updated max log validation fails', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const invalidUpdates = { weight: -10 }; // Invalid negative weight

      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      vi.spyOn(MaxLogModel.prototype, 'validate').mockReturnValue({
        success: false,
        error: { errors: ['Weight must be positive'] },
      });

      // Act
      const result = await maxLogService.updateMaxLog(maxLogId, invalidUpdates);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Max log validation failed');
      expect(mockMaxLogRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Updated max log validation failed',
        undefined,
        expect.objectContaining({
          maxLogId,
          updates: invalidUpdates,
          errors: ['Weight must be positive'],
        })
      );
    });

    it('should return failure when repository throws error during findById', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const updates = { weight: 110 };
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.updateMaxLog(maxLogId, updates);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to update max log');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update max log', repositoryError, {
        maxLogId,
        updates,
      });
    });

    it('should return failure when repository throws error during save', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const updates = { weight: 110 };
      const repositoryError = new Error('Save operation failed');

      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      mockMaxLogRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.updateMaxLog(maxLogId, updates);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to update max log');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update max log', repositoryError, {
        maxLogId,
        updates,
      });
    });

    it('should recalculate 1RM when weight or reps are updated', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const updates = { weight: 120, reps: 1 }; // Direct 1RM attempt
      const updatedMaxLog = createTestMaxLogModel({
        ...testMaxLog.toPlainObject(),
        weightEnteredByUser: 120,
        reps: 1,
      });

      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      mockMaxLogRepository.save.mockResolvedValue(updatedMaxLog);

      // Act
      const result = await maxLogService.updateMaxLog(maxLogId, updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      const resultMaxLog = result.getValue() as MaxLogModel;
      expect(resultMaxLog.isDirect1RM()).toBe(true);
      expect(resultMaxLog.estimated1RM).toBe(120); // Direct 1RM should equal the weight
    });
  });

  describe('compareMaxLogPerformance', () => {
    it('should successfully compare performance between two max logs', async () => {
      // Arrange
      const maxLogId1 = '550e8400-e29b-41d4-a716-446655440005';
      const maxLogId2 = '550e8400-e29b-41d4-a716-446655440006';
      const maxLog1 = createTestMaxLogModel({ id: maxLogId1, weightEnteredByUser: 120, reps: 1 });
      const maxLog2 = createTestMaxLogModel({ id: maxLogId2, weightEnteredByUser: 100, reps: 1 });

      mockMaxLogRepository.findById.mockResolvedValueOnce(maxLog1).mockResolvedValueOnce(maxLog2);

      // Act
      const result = await maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);

      // Assert
      expect(result.isSuccess).toBe(true);
      const comparison = result.getValue() as {
        differenceKg: number;
        percentageImprovement: number;
      };
      expect(comparison.differenceKg).toBeCloseTo(20, 1); // 120 - 100
      expect(comparison.percentageImprovement).toBeCloseTo(20, 1); // (20/100) * 100
      expect(mockMaxLogRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Comparing max log performance', {
        maxLogId1,
        maxLogId2,
      });
    });

    it('should return NotFoundError when first max log does not exist', async () => {
      // Arrange
      const maxLogId1 = 'non-existent-id';
      const maxLogId2 = '550e8400-e29b-41d4-a716-446655440006';

      mockMaxLogRepository.findById
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(testMaxLog);

      // Act
      const result = await maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('First max log not found');
      expect(mockLogger.warn).toHaveBeenCalledWith('First max log not found', { maxLogId1 });
    });

    it('should return NotFoundError when second max log does not exist', async () => {
      // Arrange
      const maxLogId1 = '550e8400-e29b-41d4-a716-446655440005';
      const maxLogId2 = 'non-existent-id';

      mockMaxLogRepository.findById
        .mockResolvedValueOnce(testMaxLog)
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Second max log not found');
      expect(mockLogger.warn).toHaveBeenCalledWith('Second max log not found', { maxLogId2 });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const maxLogId1 = '550e8400-e29b-41d4-a716-446655440005';
      const maxLogId2 = '550e8400-e29b-41d4-a716-446655440006';
      const repositoryError = new Error('Database error');

      mockMaxLogRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to compare max log performance');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to compare max log performance',
        repositoryError,
        { maxLogId1, maxLogId2 }
      );
    });

    it('should calculate negative improvement correctly for performance decline', async () => {
      // Arrange
      const maxLogId1 = '550e8400-e29b-41d4-a716-446655440005';
      const maxLogId2 = '550e8400-e29b-41d4-a716-446655440006';
      const maxLog1 = createTestMaxLogModel({ id: maxLogId1, weightEnteredByUser: 80, reps: 1 });
      const maxLog2 = createTestMaxLogModel({ id: maxLogId2, weightEnteredByUser: 100, reps: 1 });

      mockMaxLogRepository.findById.mockResolvedValueOnce(maxLog1).mockResolvedValueOnce(maxLog2);

      // Act
      const result = await maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);

      // Assert
      expect(result.isSuccess).toBe(true);
      const comparison = result.getValue() as {
        differenceKg: number;
        percentageImprovement: number;
      };
      expect(comparison.differenceKg).toBeCloseTo(-20, 1); // 80 - 100
      expect(comparison.percentageImprovement).toBeCloseTo(-20, 1); // (-20/100) * 100
    });
  });

  describe('calculateBodyweightRatio', () => {
    it('should successfully calculate bodyweight ratio', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const bodyweightKg = 80;
      const maxLogWithKnownEstimate = createTestMaxLogModel({
        id: maxLogId,
        weightEnteredByUser: 120,
        reps: 1, // Direct 1RM
      });

      mockMaxLogRepository.findById.mockResolvedValue(maxLogWithKnownEstimate);

      // Act
      const result = await maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);

      // Assert
      expect(result.isSuccess).toBe(true);
      const ratio = result.getValue() as number;
      expect(ratio).toBeCloseTo(1.5, 2); // 120kg / 80kg = 1.5x bodyweight
      expect(mockLogger.info).toHaveBeenCalledWith('Calculating bodyweight ratio for max log', {
        maxLogId,
        bodyweightKg,
      });
    });

    it('should return failure when bodyweight is zero', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const bodyweightKg = 0;

      // Act
      const result = await maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Bodyweight must be greater than zero');
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid bodyweight provided', {
        maxLogId,
        bodyweightKg,
      });
      expect(mockMaxLogRepository.findById).not.toHaveBeenCalled();
    });

    it('should return failure when bodyweight is negative', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const bodyweightKg = -70;

      // Act
      const result = await maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Bodyweight must be greater than zero');
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid bodyweight provided', {
        maxLogId,
        bodyweightKg,
      });
    });

    it('should return NotFoundError when max log does not exist', async () => {
      // Arrange
      const maxLogId = 'non-existent-id';
      const bodyweightKg = 80;
      mockMaxLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Max log not found');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Max log not found for bodyweight ratio calculation',
        {
          maxLogId,
        }
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const bodyweightKg = 80;
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to calculate bodyweight ratio');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to calculate bodyweight ratio',
        repositoryError,
        {
          maxLogId,
          bodyweightKg,
        }
      );
    });
  });

  describe('getMaxLogsOlderThan', () => {
    it('should successfully retrieve max logs older than specified date', async () => {
      // Arrange
      const profileId = 'profile-1';
      const cutoffDate = new Date('2024-01-15');
      const oldMaxLog = createTestMaxLogModel({
        id: 'old-max-log',
        date: new Date('2024-01-01'), // Older than cutoff
      });
      const newMaxLog = createTestMaxLogModel({
        id: 'new-max-log',
        date: new Date('2024-01-20'), // Newer than cutoff
      });
      const allMaxLogs = [oldMaxLog, newMaxLog];

      mockMaxLogRepository.findAll.mockResolvedValue(allMaxLogs);

      // Act
      const result = await maxLogService.getMaxLogsOlderThan(profileId, cutoffDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const olderMaxLogs = result.getValue() as MaxLogModel[];
      expect(olderMaxLogs).toHaveLength(1);
      expect(olderMaxLogs[0].id).toBe('old-max-log');
      expect(mockMaxLogRepository.findAll).toHaveBeenCalledWith(profileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving max logs older than date', {
        profileId,
        date: cutoffDate,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Max logs older than date retrieved successfully',
        {
          profileId,
          date: cutoffDate,
          totalCount: 2,
          olderCount: 1,
        }
      );
    });

    it('should return empty array when no max logs are older than date', async () => {
      // Arrange
      const profileId = 'profile-1';
      const cutoffDate = new Date('2023-01-01'); // Very old date
      const allMaxLogs = [
        createTestMaxLogModel({ date: new Date('2024-01-15') }),
        createTestMaxLogModel({ date: new Date('2024-01-20') }),
      ];

      mockMaxLogRepository.findAll.mockResolvedValue(allMaxLogs);

      // Act
      const result = await maxLogService.getMaxLogsOlderThan(profileId, cutoffDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const olderMaxLogs = result.getValue() as MaxLogModel[];
      expect(olderMaxLogs).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Max logs older than date retrieved successfully',
        {
          profileId,
          date: cutoffDate,
          totalCount: 2,
          olderCount: 0,
        }
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileId = 'profile-1';
      const cutoffDate = new Date('2024-01-15');
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findAll.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.getMaxLogsOlderThan(profileId, cutoffDate);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve max logs older than date');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve max logs older than date',
        repositoryError,
        { profileId, date: cutoffDate }
      );
    });
  });

  describe('getMaxLogSummary', () => {
    it('should successfully generate max log summary', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const maxLogForSummary = createTestMaxLogModel({
        id: maxLogId,
        weightEnteredByUser: 100,
        reps: 5,
      });
      const expectedSummary = maxLogForSummary.getSummaryString();

      mockMaxLogRepository.findById.mockResolvedValue(maxLogForSummary);

      // Act
      const result = await maxLogService.getMaxLogSummary(maxLogId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(expectedSummary);
      expect(result.getValue()).toContain('100kg x 5 reps');
      expect(result.getValue()).toContain('e1RM:');
      expect(mockMaxLogRepository.findById).toHaveBeenCalledWith(maxLogId);
      expect(mockLogger.info).toHaveBeenCalledWith('Generating max log summary', { maxLogId });
      expect(mockLogger.info).toHaveBeenCalledWith('Max log summary generated successfully', {
        maxLogId,
        summary: expectedSummary,
      });
    });

    it('should return NotFoundError when max log does not exist', async () => {
      // Arrange
      const maxLogId = 'non-existent-id';
      mockMaxLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await maxLogService.getMaxLogSummary(maxLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Max log not found');
      expect(mockLogger.warn).toHaveBeenCalledWith('Max log not found for summary generation', {
        maxLogId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.getMaxLogSummary(maxLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to generate max log summary');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate max log summary',
        repositoryError,
        {
          maxLogId,
        }
      );
    });
  });

  describe('deleteMaxLog', () => {
    it('should successfully delete a max log', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';

      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      mockMaxLogRepository.delete.mockResolvedValue();

      // Act
      const result = await maxLogService.deleteMaxLog(maxLogId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockMaxLogRepository.findById).toHaveBeenCalledWith(maxLogId);
      expect(mockMaxLogRepository.delete).toHaveBeenCalledWith(maxLogId);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting max log permanently', { maxLogId });
      expect(mockLogger.info).toHaveBeenCalledWith('Max log deleted successfully', { maxLogId });
    });

    it('should return NotFoundError when max log does not exist', async () => {
      // Arrange
      const maxLogId = 'non-existent-id';
      mockMaxLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await maxLogService.deleteMaxLog(maxLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Max log not found');
      expect(mockMaxLogRepository.delete).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Max log not found for deletion', { maxLogId });
    });

    it('should return failure when repository throws error during findById', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');
      mockMaxLogRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.deleteMaxLog(maxLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to delete max log');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete max log', repositoryError, {
        maxLogId,
      });
    });

    it('should return failure when repository throws error during delete', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Delete operation failed');

      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      mockMaxLogRepository.delete.mockRejectedValue(repositoryError);

      // Act
      const result = await maxLogService.deleteMaxLog(maxLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to delete max log');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete max log', repositoryError, {
        maxLogId,
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    describe('1RM calculation edge cases', () => {
      it('should handle direct 1RM attempts correctly', async () => {
        // Arrange
        const inputData = {
          profileId: '550e8400-e29b-41d4-a716-446655440003',
          exerciseId: '550e8400-e29b-41d4-a716-446655440004',
          weightEnteredByUser: 150,
          reps: 1, // Direct 1RM
          date: new Date(),
        };
        const expectedMaxLog = createTestMaxLogModel({ ...inputData });
        mockMaxLogRepository.save.mockResolvedValue(expectedMaxLog);

        // Act
        const result = await maxLogService.createMaxLog(inputData);

        // Assert
        expect(result.isSuccess).toBe(true);
        const maxLog = result.getValue() as MaxLogModel;
        expect(maxLog.isDirect1RM()).toBe(true);
        expect(maxLog.estimated1RM).toBe(150); // Should equal the weight for 1 rep
      });

      it('should handle high rep attempts with estimation', async () => {
        // Arrange
        const inputData = {
          profileId: '550e8400-e29b-41d4-a716-446655440003',
          exerciseId: '550e8400-e29b-41d4-a716-446655440004',
          weightEnteredByUser: 60,
          reps: 15, // High rep range
          date: new Date(),
        };
        const expectedMaxLog = createTestMaxLogModel({ ...inputData });
        mockMaxLogRepository.save.mockResolvedValue(expectedMaxLog);

        // Act
        const result = await maxLogService.createMaxLog(inputData);

        // Assert
        expect(result.isSuccess).toBe(true);
        const maxLog = result.getValue() as MaxLogModel;
        expect(maxLog.isDirect1RM()).toBe(false);
        expect(maxLog.estimated1RM).toBeGreaterThan(60); // Estimate should be higher than actual weight
      });
    });

    describe('performance comparison edge cases', () => {
      it('should handle comparison with zero baseline correctly', async () => {
        // Arrange
        const maxLogId1 = '550e8400-e29b-41d4-a716-446655440005';
        const maxLogId2 = '550e8400-e29b-41d4-a716-446655440006';
        const maxLog1 = createTestMaxLogModel({ id: maxLogId1, weightEnteredByUser: 100, reps: 1 });
        const maxLog2 = createTestMaxLogModel({
          id: maxLogId2,
          weightEnteredByUser: 0, // Edge case: zero weight
          reps: 1,
        });

        mockMaxLogRepository.findById.mockResolvedValueOnce(maxLog1).mockResolvedValueOnce(maxLog2);

        // Act
        const result = await maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);

        // Assert
        expect(result.isSuccess).toBe(true);
        const comparison = result.getValue() as {
          differenceKg: number;
          percentageImprovement: number;
        };
        expect(comparison.percentageImprovement).toBe(0); // Should handle division by zero
      });

      it('should handle identical performance comparison', async () => {
        // Arrange
        const maxLogId1 = '550e8400-e29b-41d4-a716-446655440005';
        const maxLogId2 = '550e8400-e29b-41d4-a716-446655440006';
        const identicalData = { weightEnteredByUser: 100, reps: 5 };
        const maxLog1 = createTestMaxLogModel({ id: maxLogId1, ...identicalData });
        const maxLog2 = createTestMaxLogModel({ id: maxLogId2, ...identicalData });

        mockMaxLogRepository.findById.mockResolvedValueOnce(maxLog1).mockResolvedValueOnce(maxLog2);

        // Act
        const result = await maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);

        // Assert
        expect(result.isSuccess).toBe(true);
        const comparison = result.getValue() as {
          differenceKg: number;
          percentageImprovement: number;
        };
        expect(comparison.differenceKg).toBeCloseTo(0, 2);
        expect(comparison.percentageImprovement).toBeCloseTo(0, 2);
      });
    });

    describe('bodyweight ratio edge cases', () => {
      it('should handle extremely light max log weights', async () => {
        // Arrange
        const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
        const bodyweightKg = 80;
        const lightMaxLog = createTestMaxLogModel({
          id: maxLogId,
          weightEnteredByUser: 5, // Very light weight
          reps: 20,
        });

        mockMaxLogRepository.findById.mockResolvedValue(lightMaxLog);

        // Act
        const result = await maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);

        // Assert
        expect(result.isSuccess).toBe(true);
        const ratio = result.getValue() as number;
        expect(ratio).toBeLessThan(1); // Should be less than bodyweight
        expect(ratio).toBeGreaterThan(0);
      });

      it('should handle extremely heavy max log weights', async () => {
        // Arrange
        const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
        const bodyweightKg = 70;
        const heavyMaxLog = createTestMaxLogModel({
          id: maxLogId,
          weightEnteredByUser: 300, // Very heavy weight
          reps: 1,
        });

        mockMaxLogRepository.findById.mockResolvedValue(heavyMaxLog);

        // Act
        const result = await maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);

        // Assert
        expect(result.isSuccess).toBe(true);
        const ratio = result.getValue() as number;
        expect(ratio).toBeGreaterThan(4); // Should be much greater than bodyweight
      });
    });

    describe('date filtering edge cases', () => {
      it('should handle edge case where max log date equals cutoff date', async () => {
        // Arrange
        const profileId = 'profile-1';
        const cutoffDate = new Date('2024-01-15T10:00:00Z');
        const exactDateMaxLog = createTestMaxLogModel({
          id: 'exact-date-max-log',
          date: new Date('2024-01-15T10:00:00Z'), // Exact same date/time
        });
        const allMaxLogs = [exactDateMaxLog];

        mockMaxLogRepository.findAll.mockResolvedValue(allMaxLogs);

        // Act
        const result = await maxLogService.getMaxLogsOlderThan(profileId, cutoffDate);

        // Assert
        expect(result.isSuccess).toBe(true);
        const olderMaxLogs = result.getValue() as MaxLogModel[];
        expect(olderMaxLogs).toHaveLength(0); // Equal dates should not be considered "older"
      });
    });
  });

  describe('immutability tests', () => {
    it('should not mutate original max log when updating', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const originalWeight = testMaxLog.weightEnteredByUser;
      const originalReps = testMaxLog.reps;
      const updates = { weight: 110, reps: 3 };

      const updatedMaxLog = testMaxLog.cloneWithUpdatedDetails(updates);
      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      mockMaxLogRepository.save.mockResolvedValue(updatedMaxLog);

      // Act
      await maxLogService.updateMaxLog(maxLogId, updates);

      // Assert
      // Original max log should remain unchanged
      expect(testMaxLog.weightEnteredByUser).toBe(originalWeight);
      expect(testMaxLog.reps).toBe(originalReps);
    });

    it('should create new instance when cloning with updated details', async () => {
      // Arrange
      const maxLogId = '550e8400-e29b-41d4-a716-446655440001';
      const updates = { weight: 110, notes: 'Updated notes' };
      const updatedMaxLog = testMaxLog.cloneWithUpdatedDetails(updates);

      mockMaxLogRepository.findById.mockResolvedValue(testMaxLog);
      mockMaxLogRepository.save.mockResolvedValue(updatedMaxLog);

      // Act
      const result = await maxLogService.updateMaxLog(maxLogId, updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      const resultMaxLog = result.getValue() as MaxLogModel;
      expect(resultMaxLog).not.toBe(testMaxLog); // Should be different instance
      expect(resultMaxLog.weightEnteredByUser).toBe(110);
      expect(resultMaxLog.notes).toBe('Updated notes');
      expect(resultMaxLog.updatedAt).not.toEqual(testMaxLog.updatedAt);
    });
  });
});
