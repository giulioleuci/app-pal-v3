import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AnalysisService,
  FrequencyAnalysisData,
  StrengthProgressData,
  VolumeAnalysisData,
  WeightProgressData,
} from '@/features/analysis/services/AnalysisService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { AnalysisQueryService } from '../AnalysisQueryService';

describe('AnalysisQueryService', () => {
  let analysisQueryService: AnalysisQueryService;
  let mockAnalysisService: {
    getStrengthProgress: ReturnType<typeof vi.fn>;
    getWeightProgress: ReturnType<typeof vi.fn>;
    getVolumeAnalysis: ReturnType<typeof vi.fn>;
    getFrequencyAnalysis: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testExerciseId = '550e8400-e29b-41d4-a716-446655440002';
  const testStartDate = new Date('2024-01-01');
  const testEndDate = new Date('2024-01-31');

  const testStrengthProgressData: StrengthProgressData = {
    exerciseId: testExerciseId,
    exerciseName: 'Bench Press',
    progressPoints: [
      { date: new Date('2024-01-01'), value: 100, volume: 1000 },
      { date: new Date('2024-01-15'), value: 110, volume: 1100 },
      { date: new Date('2024-01-31'), value: 115, volume: 1200 },
    ],
    totalImprovement: 15,
    improvementPercentage: 15.0,
    averageVolumeIncrease: 100,
    consistencyScore: 0.85,
  };

  const testWeightProgressData: WeightProgressData = {
    progressPoints: [
      { date: new Date('2024-01-01'), weight: 75.0 },
      { date: new Date('2024-01-15'), weight: 74.5 },
      { date: new Date('2024-01-31'), weight: 74.0 },
    ],
    totalChange: -1.0,
    changePercentage: -1.33,
    averageWeeklyChange: -0.25,
    trend: 'decreasing',
  };

  const testVolumeAnalysisData: VolumeAnalysisData = {
    totalVolume: 50000,
    averageVolumePerWorkout: 2500,
    volumeByMuscleGroup: {
      chest: 15000,
      back: 12000,
      legs: 18000,
      shoulders: 5000,
    },
    volumeProgression: [
      { date: new Date('2024-01-01'), volume: 2000 },
      { date: new Date('2024-01-15'), volume: 2500 },
      { date: new Date('2024-01-31'), volume: 3000 },
    ],
    peakVolumeWeek: new Date('2024-01-29'),
    volumeConsistency: 0.8,
  };

  const testFrequencyAnalysisData: FrequencyAnalysisData = {
    totalWorkouts: 20,
    averageWorkoutsPerWeek: 5,
    longestStreak: 14,
    currentStreak: 7,
    frequencyByDay: {
      monday: 4,
      tuesday: 3,
      wednesday: 4,
      thursday: 3,
      friday: 4,
      saturday: 2,
      sunday: 0,
    },
    restDayPattern: 'regular',
    adherenceScore: 0.9,
  };

  beforeEach(() => {
    // Create service mock
    mockAnalysisService = {
      getStrengthProgress: vi.fn(),
      getWeightProgress: vi.fn(),
      getVolumeAnalysis: vi.fn(),
      getFrequencyAnalysis: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    analysisQueryService = new AnalysisQueryService(mockAnalysisService as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getStrengthProgress', () => {
    it('should return strength progress data when service succeeds', async () => {
      // Arrange
      mockAnalysisService.getStrengthProgress.mockResolvedValue(
        Result.success(testStrengthProgressData)
      );

      // Act
      const result = await analysisQueryService.getStrengthProgress(
        testProfileId,
        testExerciseId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(testStrengthProgressData);
      expect(mockAnalysisService.getStrengthProgress).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testStartDate,
        testEndDate
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate strength progress analysis');
      mockAnalysisService.getStrengthProgress.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        analysisQueryService.getStrengthProgress(
          testProfileId,
          testExerciseId,
          testStartDate,
          testEndDate
        )
      ).rejects.toThrow(error);
      expect(mockAnalysisService.getStrengthProgress).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testStartDate,
        testEndDate
      );
    });

    it('should handle invalid exercise ID', async () => {
      // Arrange
      const invalidExerciseId = 'invalid-exercise-id';
      const error = new ApplicationError('Exercise not found');
      mockAnalysisService.getStrengthProgress.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        analysisQueryService.getStrengthProgress(
          testProfileId,
          invalidExerciseId,
          testStartDate,
          testEndDate
        )
      ).rejects.toThrow(error);
      expect(mockAnalysisService.getStrengthProgress).toHaveBeenCalledWith(
        testProfileId,
        invalidExerciseId,
        testStartDate,
        testEndDate
      );
    });

    it('should handle invalid date range', async () => {
      // Arrange
      const endBeforeStart = new Date('2023-12-01');
      const error = new ApplicationError('Invalid date range');
      mockAnalysisService.getStrengthProgress.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        analysisQueryService.getStrengthProgress(
          testProfileId,
          testExerciseId,
          testStartDate,
          endBeforeStart
        )
      ).rejects.toThrow(error);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected database error');
      mockAnalysisService.getStrengthProgress.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(
        analysisQueryService.getStrengthProgress(
          testProfileId,
          testExerciseId,
          testStartDate,
          testEndDate
        )
      ).rejects.toThrow(unexpectedError);
    });
  });

  describe('getWeightProgress', () => {
    it('should return weight progress data when service succeeds', async () => {
      // Arrange
      mockAnalysisService.getWeightProgress.mockResolvedValue(
        Result.success(testWeightProgressData)
      );

      // Act
      const result = await analysisQueryService.getWeightProgress(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(testWeightProgressData);
      expect(mockAnalysisService.getWeightProgress).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate weight progress analysis');
      mockAnalysisService.getWeightProgress.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        analysisQueryService.getWeightProgress(testProfileId, testStartDate, testEndDate)
      ).rejects.toThrow(error);
      expect(mockAnalysisService.getWeightProgress).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
    });

    it('should handle no weight data available', async () => {
      // Arrange
      const emptyProgressData: WeightProgressData = {
        progressPoints: [],
        totalChange: 0,
        changePercentage: 0,
        averageWeeklyChange: 0,
        trend: 'stable',
      };
      mockAnalysisService.getWeightProgress.mockResolvedValue(Result.success(emptyProgressData));

      // Act
      const result = await analysisQueryService.getWeightProgress(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(emptyProgressData);
      expect(result.progressPoints.length).toBe(0);
    });

    it('should handle invalid profile ID', async () => {
      // Arrange
      const invalidProfileId = 'invalid-profile-id';
      const error = new ApplicationError('Profile not found');
      mockAnalysisService.getWeightProgress.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        analysisQueryService.getWeightProgress(invalidProfileId, testStartDate, testEndDate)
      ).rejects.toThrow(error);
    });
  });

  describe('getVolumeAnalysis', () => {
    it('should return volume analysis data when service succeeds', async () => {
      // Arrange
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(
        Result.success(testVolumeAnalysisData)
      );

      // Act
      const result = await analysisQueryService.getVolumeAnalysis(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(testVolumeAnalysisData);
      expect(mockAnalysisService.getVolumeAnalysis).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate volume analysis');
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        analysisQueryService.getVolumeAnalysis(testProfileId, testStartDate, testEndDate)
      ).rejects.toThrow(error);
      expect(mockAnalysisService.getVolumeAnalysis).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
    });

    it('should handle zero volume scenario', async () => {
      // Arrange
      const zeroVolumeData: VolumeAnalysisData = {
        totalVolume: 0,
        averageVolumePerWorkout: 0,
        volumeByMuscleGroup: {},
        volumeProgression: [],
        peakVolumeWeek: undefined,
        volumeConsistency: 0,
      };
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(Result.success(zeroVolumeData));

      // Act
      const result = await analysisQueryService.getVolumeAnalysis(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(zeroVolumeData);
      expect(result.totalVolume).toBe(0);
    });

    it('should handle large volume datasets', async () => {
      // Arrange
      const largeVolumeData: VolumeAnalysisData = {
        totalVolume: 1000000,
        averageVolumePerWorkout: 5000,
        volumeByMuscleGroup: {
          chest: 300000,
          back: 250000,
          legs: 350000,
          shoulders: 100000,
        },
        volumeProgression: Array.from({ length: 200 }, (_, i) => ({
          date: new Date(2024, 0, i + 1),
          volume: 5000 + i * 10,
        })),
        peakVolumeWeek: new Date('2024-07-15'),
        volumeConsistency: 0.95,
      };
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(Result.success(largeVolumeData));

      // Act
      const result = await analysisQueryService.getVolumeAnalysis(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(largeVolumeData);
      expect(result.volumeProgression.length).toBe(200);
    });
  });

  describe('getFrequencyAnalysis', () => {
    it('should return frequency analysis data when service succeeds', async () => {
      // Arrange
      mockAnalysisService.getFrequencyAnalysis.mockResolvedValue(
        Result.success(testFrequencyAnalysisData)
      );

      // Act
      const result = await analysisQueryService.getFrequencyAnalysis(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(testFrequencyAnalysisData);
      expect(mockAnalysisService.getFrequencyAnalysis).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate frequency analysis');
      mockAnalysisService.getFrequencyAnalysis.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        analysisQueryService.getFrequencyAnalysis(testProfileId, testStartDate, testEndDate)
      ).rejects.toThrow(error);
      expect(mockAnalysisService.getFrequencyAnalysis).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
    });

    it('should handle no workout data scenario', async () => {
      // Arrange
      const noWorkoutData: FrequencyAnalysisData = {
        totalWorkouts: 0,
        averageWorkoutsPerWeek: 0,
        longestStreak: 0,
        currentStreak: 0,
        frequencyByDay: {
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
        },
        restDayPattern: 'irregular',
        adherenceScore: 0,
      };
      mockAnalysisService.getFrequencyAnalysis.mockResolvedValue(Result.success(noWorkoutData));

      // Act
      const result = await analysisQueryService.getFrequencyAnalysis(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(noWorkoutData);
      expect(result.totalWorkouts).toBe(0);
    });

    it('should handle perfect consistency scenario', async () => {
      // Arrange
      const perfectConsistencyData: FrequencyAnalysisData = {
        totalWorkouts: 28,
        averageWorkoutsPerWeek: 7,
        longestStreak: 28,
        currentStreak: 28,
        frequencyByDay: {
          monday: 4,
          tuesday: 4,
          wednesday: 4,
          thursday: 4,
          friday: 4,
          saturday: 4,
          sunday: 4,
        },
        restDayPattern: 'none',
        adherenceScore: 1.0,
      };
      mockAnalysisService.getFrequencyAnalysis.mockResolvedValue(
        Result.success(perfectConsistencyData)
      );

      // Act
      const result = await analysisQueryService.getFrequencyAnalysis(
        testProfileId,
        testStartDate,
        testEndDate
      );

      // Assert
      expect(result).toEqual(perfectConsistencyData);
      expect(result.adherenceScore).toBe(1.0);
    });
  });

  describe('dependency injection', () => {
    it('should use injected AnalysisService', () => {
      // Arrange & Act
      const service = new AnalysisQueryService(mockAnalysisService as any);

      // Assert
      expect(service).toBeInstanceOf(AnalysisQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from AnalysisService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific analysis error');
      mockAnalysisService.getStrengthProgress.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(
        analysisQueryService.getStrengthProgress(
          testProfileId,
          testExerciseId,
          testStartDate,
          testEndDate
        )
      ).rejects.toBe(originalError);
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await analysisQueryService
        .getVolumeAnalysis(testProfileId, testStartDate, testEndDate)
        .catch((error) => error);

      // Assert
      expect(thrownError).toBe(originalError);
      expect(thrownError.stack).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent calls to same method', async () => {
      // Arrange
      mockAnalysisService.getWeightProgress.mockResolvedValue(
        Result.success(testWeightProgressData)
      );

      // Act
      const promises = Array.from({ length: 5 }, () =>
        analysisQueryService.getWeightProgress(testProfileId, testStartDate, testEndDate)
      );
      const results = await Promise.all(promises);

      // Assert
      results.forEach((result) => {
        expect(result).toEqual(testWeightProgressData);
      });
      expect(mockAnalysisService.getWeightProgress).toHaveBeenCalledTimes(5);
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      mockAnalysisService.getStrengthProgress.mockResolvedValue(
        Result.success(testStrengthProgressData)
      );
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(
        Result.failure(new ApplicationError('Volume analysis failed'))
      );

      // Act
      const strengthResult = await analysisQueryService.getStrengthProgress(
        testProfileId,
        testExerciseId,
        testStartDate,
        testEndDate
      );
      const volumeError = await analysisQueryService
        .getVolumeAnalysis(testProfileId, testStartDate, testEndDate)
        .catch((e) => e);

      // Assert
      expect(strengthResult).toEqual(testStrengthProgressData);
      expect(volumeError).toBeInstanceOf(ApplicationError);
    });

    it('should handle operations on non-existent profile consistently', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const notFoundError = new ApplicationError('Profile not found');

      mockAnalysisService.getStrengthProgress.mockResolvedValue(Result.failure(notFoundError));
      mockAnalysisService.getWeightProgress.mockResolvedValue(Result.failure(notFoundError));
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(Result.failure(notFoundError));
      mockAnalysisService.getFrequencyAnalysis.mockResolvedValue(Result.failure(notFoundError));

      // Act
      const strengthError = await analysisQueryService
        .getStrengthProgress(nonExistentId, testExerciseId, testStartDate, testEndDate)
        .catch((e) => e);
      const weightError = await analysisQueryService
        .getWeightProgress(nonExistentId, testStartDate, testEndDate)
        .catch((e) => e);
      const volumeError = await analysisQueryService
        .getVolumeAnalysis(nonExistentId, testStartDate, testEndDate)
        .catch((e) => e);
      const frequencyError = await analysisQueryService
        .getFrequencyAnalysis(nonExistentId, testStartDate, testEndDate)
        .catch((e) => e);

      // Assert
      expect(strengthError).toBe(notFoundError);
      expect(weightError).toBe(notFoundError);
      expect(volumeError).toBe(notFoundError);
      expect(frequencyError).toBe(notFoundError);
    });
  });

  describe('date handling edge cases', () => {
    it('should handle extreme date ranges', async () => {
      // Arrange
      const veryEarlyDate = new Date('1900-01-01');
      const veryFutureDate = new Date('2100-12-31');
      mockAnalysisService.getWeightProgress.mockResolvedValue(
        Result.success(testWeightProgressData)
      );

      // Act
      const result = await analysisQueryService.getWeightProgress(
        testProfileId,
        veryEarlyDate,
        veryFutureDate
      );

      // Assert
      expect(result).toEqual(testWeightProgressData);
      expect(mockAnalysisService.getWeightProgress).toHaveBeenCalledWith(
        testProfileId,
        veryEarlyDate,
        veryFutureDate
      );
    });

    it('should handle same start and end date', async () => {
      // Arrange
      const sameDate = new Date('2024-01-15');
      const singleDayData: FrequencyAnalysisData = {
        ...testFrequencyAnalysisData,
        totalWorkouts: 1,
        averageWorkoutsPerWeek: 7,
      };
      mockAnalysisService.getFrequencyAnalysis.mockResolvedValue(Result.success(singleDayData));

      // Act
      const result = await analysisQueryService.getFrequencyAnalysis(
        testProfileId,
        sameDate,
        sameDate
      );

      // Assert
      expect(result).toEqual(singleDayData);
      expect(mockAnalysisService.getFrequencyAnalysis).toHaveBeenCalledWith(
        testProfileId,
        sameDate,
        sameDate
      );
    });

    it('should handle timezone differences in dates', async () => {
      // Arrange
      const utcStartDate = new Date('2024-01-01T00:00:00Z');
      const localEndDate = new Date('2024-01-31T23:59:59');
      mockAnalysisService.getVolumeAnalysis.mockResolvedValue(
        Result.success(testVolumeAnalysisData)
      );

      // Act
      const result = await analysisQueryService.getVolumeAnalysis(
        testProfileId,
        utcStartDate,
        localEndDate
      );

      // Assert
      expect(result).toEqual(testVolumeAnalysisData);
      expect(mockAnalysisService.getVolumeAnalysis).toHaveBeenCalledWith(
        testProfileId,
        utcStartDate,
        localEndDate
      );
    });
  });
});
