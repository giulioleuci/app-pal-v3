import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import {
  createTestMaxLogModel,
  createTestPerformedExerciseLogModel,
  createTestPerformedGroupLogModel,
  createTestPerformedSetModel,
  createTestWeightRecordModel,
  createTestWorkoutLogModel,
} from '@/test-factories';

import { AnalysisService } from './AnalysisService';

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  let mockWorkoutLogRepository: jest.Mocked<IWorkoutLogRepository>;
  let mockMaxLogRepository: jest.Mocked<IMaxLogRepository>;
  let mockBodyMetricsRepository: jest.Mocked<IBodyMetricsRepository>;
  let mockTrainingPlanRepository: jest.Mocked<ITrainingPlanRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const profileId = '550e8400-e29b-41d4-a716-446655440001';
  const exerciseId = 'exercise-1';
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');

  beforeEach(() => {
    // Create mocks
    mockWorkoutLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findByProfile: vi.fn(),
      findByProfileAndDateRange: vi.fn(),
    };

    mockMaxLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findByProfile: vi.fn(),
      findByProfileAndExercise: vi.fn(),
    };

    mockBodyMetricsRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findWeightRecordsByProfile: vi.fn(),
      findWeightRecordsByProfileAndDateRange: vi.fn(),
      findHeightRecordsByProfile: vi.fn(),
      findHeightRecordsByProfileAndDateRange: vi.fn(),
    };

    mockTrainingPlanRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findByProfile: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    analysisService = new AnalysisService(
      mockWorkoutLogRepository,
      mockMaxLogRepository,
      mockBodyMetricsRepository,
      mockTrainingPlanRepository,
      mockLogger
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getStrengthProgress', () => {
    it('should successfully analyze strength progress', async () => {
      // Arrange
      const maxLogs = [
        createTestMaxLogModel({
          id: 'max-1',
          profileId,
          exerciseId,
          weightEnteredByUser: 100,
          date: new Date('2024-06-01'),
          reps: 1, // 1RM so estimated = actual
          estimated1RM: 100,
        }),
        createTestMaxLogModel({
          id: 'max-2',
          profileId,
          exerciseId,
          weightEnteredByUser: 110,
          date: new Date('2024-08-01'),
          reps: 1, // 1RM so estimated = actual
          estimated1RM: 110,
        }),
      ];

      mockMaxLogRepository.findByProfileAndExercise.mockResolvedValue(maxLogs);
      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue([]);

      // Act
      const result = await analysisService.getStrengthProgress(
        profileId,
        exerciseId,
        startDate,
        endDate
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.exerciseId).toBe(exerciseId);
      expect(data.exerciseName).toBe('Unknown Exercise'); // TODO: Will be resolved from Exercise service
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toEqual({
        date: new Date('2024-06-01'),
        oneRepMax: 100,
        estimatedMax: 100,
      });
      expect(data.data[1]).toEqual({
        date: new Date('2024-08-01'),
        oneRepMax: 110,
        estimatedMax: 110,
      });

      expect(mockMaxLogRepository.findByProfileAndExercise).toHaveBeenCalledWith(
        profileId,
        exerciseId,
        startDate,
        endDate
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Analyzing strength progress', {
        profileId,
        exerciseId,
        startDate,
        endDate,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Strength progress analysis completed', {
        profileId,
        exerciseId,
        dataPoints: 2,
      });
    });

    it('should handle no max logs found', async () => {
      // Arrange
      mockMaxLogRepository.findByProfileAndExercise.mockResolvedValue([]);
      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue([]);

      // Act
      const result = await analysisService.getStrengthProgress(
        profileId,
        exerciseId,
        startDate,
        endDate
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.exerciseId).toBe(exerciseId);
      expect(data.exerciseName).toBe('Unknown Exercise');
      expect(data.data).toHaveLength(0);
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockMaxLogRepository.findByProfileAndExercise.mockRejectedValue(repositoryError);

      // Act
      const result = await analysisService.getStrengthProgress(
        profileId,
        exerciseId,
        startDate,
        endDate
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to analyze strength progress');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to analyze strength progress',
        repositoryError,
        {
          profileId,
          exerciseId,
          startDate,
          endDate,
        }
      );
    });
  });

  describe('getWeightProgress', () => {
    it('should successfully analyze weight progress', async () => {
      // Arrange
      const weightRecords = [
        createTestWeightRecordModel({
          id: 'weight-1',
          profileId,
          weight: 75.5,
          date: new Date('2024-03-01'),
        }),
        createTestWeightRecordModel({
          id: 'weight-2',
          profileId,
          weight: 74.2,
          date: new Date('2024-06-01'),
        }),
      ];

      mockBodyMetricsRepository.findWeightRecordsByProfileAndDateRange.mockResolvedValue(
        weightRecords
      );

      // Act
      const result = await analysisService.getWeightProgress(profileId, startDate, endDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toEqual({
        date: new Date('2024-03-01'),
        weight: 75.5,
      });
      expect(data.data[1]).toEqual({
        date: new Date('2024-06-01'),
        weight: 74.2,
      });

      expect(mockBodyMetricsRepository.findWeightRecordsByProfileAndDateRange).toHaveBeenCalledWith(
        profileId,
        startDate,
        endDate
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Analyzing weight progress', {
        profileId,
        startDate,
        endDate,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Weight progress analysis completed', {
        profileId,
        dataPoints: 2,
      });
    });

    it('should handle no weight records found', async () => {
      // Arrange
      mockBodyMetricsRepository.findWeightRecordsByProfileAndDateRange.mockResolvedValue([]);

      // Act
      const result = await analysisService.getWeightProgress(profileId, startDate, endDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.data).toHaveLength(0);
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockBodyMetricsRepository.findWeightRecordsByProfileAndDateRange.mockRejectedValue(
        repositoryError
      );

      // Act
      const result = await analysisService.getWeightProgress(profileId, startDate, endDate);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to analyze weight progress');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to analyze weight progress',
        repositoryError,
        {
          profileId,
          startDate,
          endDate,
        }
      );
    });
  });

  describe('getVolumeAnalysis', () => {
    it('should successfully analyze training volume', async () => {
      // Arrange
      const workoutLogs = [
        createTestWorkoutLogModel(
          {
            id: 'workout-1',
            profileId,
            durationSeconds: 3600, // 60 minutes
          },
          [
            createTestPerformedGroupLogModel(
              {
                id: 'group-1',
              },
              [
                createTestPerformedExerciseLogModel(
                  {
                    id: 'exercise-1',
                  },
                  [
                    createTestPerformedSetModel({ counts: 10, weight: 100 }),
                    createTestPerformedSetModel({ counts: 8, weight: 105 }),
                  ]
                ),
              ]
            ),
          ]
        ),
        createTestWorkoutLogModel(
          {
            id: 'workout-2',
            profileId,
            durationSeconds: 4200, // 70 minutes
          },
          [
            createTestPerformedGroupLogModel(
              {
                id: 'group-2',
              },
              [
                createTestPerformedExerciseLogModel(
                  {
                    id: 'exercise-2',
                  },
                  [createTestPerformedSetModel({ counts: 12, weight: 80 })]
                ),
              ]
            ),
          ]
        ),
      ];

      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue(workoutLogs);

      // Act
      const result = await analysisService.getVolumeAnalysis(profileId, startDate, endDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.totalWorkouts).toBe(2);
      expect(data.totalSets).toBe(3);
      expect(data.totalReps).toBe(30); // 10 + 8 + 12
      expect(data.totalVolume).toBe(2800); // (10*100) + (8*105) + (12*80)
      expect(data.averageSessionDuration).toBe(3900); // (3600 + 4200) / 2
      expect(data.timeRange).toEqual({
        startDate,
        endDate,
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Volume analysis completed', {
        profileId,
        totalWorkouts: 2,
        totalVolume: 2800,
      });
    });

    it('should handle workouts with missing data', async () => {
      // Arrange
      const workoutLogs = [
        createTestWorkoutLogModel(
          {
            id: 'workout-1',
            profileId,
            durationSeconds: undefined,
          },
          [
            createTestPerformedGroupLogModel(
              {
                id: 'group-1',
              },
              [
                createTestPerformedExerciseLogModel(
                  {
                    id: 'exercise-1',
                  },
                  [
                    createTestPerformedSetModel({ counts: undefined, weight: 100 }),
                    createTestPerformedSetModel({ counts: 8, weight: undefined }),
                  ]
                ),
              ]
            ),
          ]
        ),
      ];

      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue(workoutLogs);

      // Act
      const result = await analysisService.getVolumeAnalysis(profileId, startDate, endDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.totalWorkouts).toBe(1);
      expect(data.totalSets).toBe(2);
      expect(data.totalReps).toBe(8); // Only one set has reps
      expect(data.totalVolume).toBe(0); // No complete weight/reps pairs
      expect(data.averageSessionDuration).toBe(0);
    });

    it('should handle empty workout logs', async () => {
      // Arrange
      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue([]);

      // Act
      const result = await analysisService.getVolumeAnalysis(profileId, startDate, endDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.totalWorkouts).toBe(0);
      expect(data.totalSets).toBe(0);
      expect(data.totalReps).toBe(0);
      expect(data.totalVolume).toBe(0);
      expect(data.averageSessionDuration).toBe(0);
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findByProfileAndDateRange.mockRejectedValue(repositoryError);

      // Act
      const result = await analysisService.getVolumeAnalysis(profileId, startDate, endDate);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to analyze training volume');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to analyze training volume',
        repositoryError,
        {
          profileId,
          startDate,
          endDate,
        }
      );
    });
  });

  describe('getFrequencyAnalysis', () => {
    it('should successfully analyze workout frequency', async () => {
      // Arrange
      const workoutLogs = [
        createTestWorkoutLogModel({
          id: 'workout-1',
          profileId,
          startTime: new Date('2024-01-07'), // Week 1
        }),
        createTestWorkoutLogModel({
          id: 'workout-2',
          profileId,
          startTime: new Date('2024-01-10'), // Week 2
        }),
        createTestWorkoutLogModel({
          id: 'workout-3',
          profileId,
          startTime: new Date('2024-01-17'), // Week 3
        }),
      ];

      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue(workoutLogs);

      // Act
      const result = await analysisService.getFrequencyAnalysis(profileId, startDate, endDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.totalWorkouts).toBe(3);
      expect(data.workoutsPerWeek).toBeGreaterThan(0);
      expect(data.workoutsPerMonth).toBeGreaterThan(0);
      expect(data.consistencyScore).toBeGreaterThan(0);
      expect(data.timeRange).toEqual({
        startDate,
        endDate,
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Frequency analysis completed', {
        profileId,
        workoutsPerWeek: data.workoutsPerWeek,
        consistencyScore: data.consistencyScore,
      });
    });

    it('should handle empty workout logs', async () => {
      // Arrange
      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue([]);

      // Act
      const result = await analysisService.getFrequencyAnalysis(profileId, startDate, endDate);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.totalWorkouts).toBe(0);
      expect(data.workoutsPerWeek).toBe(0);
      expect(data.workoutsPerMonth).toBe(0);
      expect(data.consistencyScore).toBe(0);
    });

    it('should calculate consistency score correctly', async () => {
      // Arrange - workouts in 3 out of 4 weeks should give 75% consistency
      const workoutLogs = [
        createTestWorkoutLogModel({
          id: 'workout-1',
          profileId,
          startTime: new Date('2024-01-03'), // Week 1
        }),
        createTestWorkoutLogModel({
          id: 'workout-2',
          profileId,
          startTime: new Date('2024-01-15'), // Week 3
        }),
        createTestWorkoutLogModel({
          id: 'workout-3',
          profileId,
          startTime: new Date('2024-01-22'), // Week 4
        }),
      ];

      const customStartDate = new Date('2024-01-01');
      const customEndDate = new Date('2024-01-28'); // Exactly 4 weeks

      mockWorkoutLogRepository.findByProfileAndDateRange.mockResolvedValue(workoutLogs);

      // Act
      const result = await analysisService.getFrequencyAnalysis(
        profileId,
        customStartDate,
        customEndDate
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue()!;
      expect(data.consistencyScore).toBe(75); // 3 active weeks out of 4 weeks
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findByProfileAndDateRange.mockRejectedValue(repositoryError);

      // Act
      const result = await analysisService.getFrequencyAnalysis(profileId, startDate, endDate);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to analyze workout frequency');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to analyze workout frequency',
        repositoryError,
        {
          profileId,
          startDate,
          endDate,
        }
      );
    });
  });
});
