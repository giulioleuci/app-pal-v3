import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { IProfileRepository } from '@/features/profile/domain/IProfileRepository';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import {
  createTestMaxLogModel,
  createTestProfileModel,
  createTestWeightRecordModel,
  createTestWorkoutLogModel,
} from '@/test-factories';

import { DashboardService } from './DashboardService';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockWorkoutLogRepository: jest.Mocked<IWorkoutLogRepository>;
  let mockMaxLogRepository: jest.Mocked<IMaxLogRepository>;
  let mockBodyMetricsRepository: jest.Mocked<IBodyMetricsRepository>;
  let mockTrainingPlanRepository: jest.Mocked<ITrainingPlanRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const profileId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    // Create mocks
    mockProfileRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

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

    dashboardService = new DashboardService(
      mockProfileRepository,
      mockWorkoutLogRepository,
      mockMaxLogRepository,
      mockBodyMetricsRepository,
      mockTrainingPlanRepository,
      mockLogger
    );

    // Mock current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-15T12:00:00Z')); // Monday
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe('getDashboardData', () => {
    it('should successfully generate complete dashboard data', async () => {
      // Arrange
      const testProfile = createTestProfileModel({ id: profileId });
      const workoutLogs = [
        createTestWorkoutLogModel({
          id: 'workout-1',
          profileId,
          sessionName: 'Test Workout 1',
          startTime: new Date('2024-07-14T10:00:00Z'),
          endTime: new Date('2024-07-14T11:00:00Z'),
          durationSeconds: 3600, // 60 minutes
          groups: [
            {
              id: 'group-1',
              exercises: [
                {
                  id: 'exercise-1',
                  sets: [
                    { reps: 10, weight: 100 },
                    { reps: 8, weight: 105 },
                  ],
                },
              ],
            },
          ],
        }),
        createTestWorkoutLogModel({
          id: 'workout-2',
          profileId,
          sessionName: 'Test Workout 2',
          startTime: new Date('2024-07-10T15:00:00Z'),
          endTime: new Date('2024-07-10T16:10:00Z'),
          durationSeconds: 4200, // 70 minutes
          groups: [
            {
              id: 'group-2',
              exercises: [
                {
                  id: 'exercise-2',
                  sets: [{ reps: 12, weight: 80 }],
                },
              ],
            },
          ],
        }),
      ];

      const maxLogs = [
        createTestMaxLogModel({
          id: 'max-1',
          profileId,
          exerciseId: 'exercise-1',
          estimated1RM: 120,
          date: new Date('2024-06-01T12:00:00Z'), // More than 30 days ago
        }),
        createTestMaxLogModel({
          id: 'max-2',
          profileId,
          exerciseId: 'exercise-1',
          estimated1RM: 125,
          date: new Date('2024-07-10T12:00:00Z'),
        }),
      ];

      const weightRecords = [
        createTestWeightRecordModel({
          id: 'weight-1',
          profileId,
          weight: 75.0,
          date: new Date('2024-07-01T08:00:00Z'),
        }),
        createTestWeightRecordModel({
          id: 'weight-2',
          profileId,
          weight: 74.5,
          date: new Date('2024-07-10T08:00:00Z'),
        }),
      ];

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockWorkoutLogRepository.findByProfile.mockResolvedValue(workoutLogs);
      mockMaxLogRepository.findByProfile.mockResolvedValue(maxLogs);
      mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue(weightRecords);

      // Act
      const result = await dashboardService.getDashboardData(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const dashboardData = result.getValue()!;

      expect(dashboardData.metrics.totalWorkouts).toBe(2);
      expect(dashboardData.metrics.totalWorkoutTime).toBe(130); // (3600 + 4200) / 60
      expect(dashboardData.metrics.averageWorkoutDuration).toBe(65); // 130 / 2
      expect(dashboardData.metrics.workoutsThisWeek).toBe(1); // Only workout-1 is this week
      expect(dashboardData.metrics.totalPersonalRecords).toBe(2);

      expect(dashboardData.recentActivity.recentWorkouts).toHaveLength(2);
      expect(dashboardData.recentActivity.recentWorkouts[0].name).toBe('Test Workout 1');
      expect(dashboardData.recentActivity.recentPersonalRecords).toHaveLength(1); // Only max-2 is recent

      expect(dashboardData.progressTrends.workoutFrequency).toHaveLength(12);
      expect(dashboardData.progressTrends.bodyWeightTrend).toHaveLength(2);
      expect(dashboardData.progressTrends.strengthProgress).toHaveLength(1);

      expect(dashboardData.generatedAt).toBeInstanceOf(Date);

      expect(mockLogger.info).toHaveBeenCalledWith('Generating dashboard data', { profileId });
      expect(mockLogger.info).toHaveBeenCalledWith('Dashboard data generated successfully', {
        profileId,
        totalWorkouts: 2,
        recentWorkouts: 2,
        recentPRs: 1,
      });
    });

    it('should return failure when profile not found', async () => {
      // Arrange
      mockProfileRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await dashboardService.getDashboardData(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Profile not found');
    });

    it('should return failure when dashboard generation throws error', async () => {
      // Arrange
      const testProfile = createTestProfileModel({ id: profileId });
      const repositoryError = new Error('Repository error');

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockWorkoutLogRepository.findByProfile.mockRejectedValue(repositoryError);

      // Act
      const result = await dashboardService.getDashboardData(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to generate dashboard data');
      // The service actually logs specific error messages for each failed component
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate dashboard metrics',
        repositoryError,
        { profileId }
      );
    });
  });

  describe('generateDashboardMetrics', () => {
    it('should calculate metrics correctly with complete data', async () => {
      // Arrange
      const workoutLogs = [
        createTestWorkoutLogModel({
          id: 'workout-1',
          profileId,
          startTime: new Date('2024-07-14T10:00:00Z'),
          endTime: new Date('2024-07-14T11:00:00Z'), // This week
          durationSeconds: 3600, // 60 minutes
        }),
        createTestWorkoutLogModel({
          id: 'workout-2',
          profileId,
          startTime: new Date('2024-07-15T08:00:00Z'), // Same day (Monday) to ensure it's this week
          endTime: new Date('2024-07-15T09:20:00Z'), // This week
          durationSeconds: 4800, // 80 minutes
        }),
        createTestWorkoutLogModel({
          id: 'workout-3',
          profileId,
          startTime: new Date('2024-07-01T10:00:00Z'),
          endTime: new Date('2024-07-01T10:50:00Z'), // This month, not this week
          durationSeconds: 3000, // 50 minutes
        }),
      ];

      const maxLogs = [
        createTestMaxLogModel({
          id: 'max-1',
          profileId,
          date: new Date('2024-06-01T12:00:00Z'), // Not recent
        }),
        createTestMaxLogModel({
          id: 'max-2',
          profileId,
          date: new Date('2024-07-10T12:00:00Z'), // Recent (within 30 days)
        }),
      ];

      mockWorkoutLogRepository.findByProfile.mockResolvedValue(workoutLogs);
      mockMaxLogRepository.findByProfile.mockResolvedValue(maxLogs);

      // Act
      const result = await dashboardService.generateDashboardMetrics(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const metrics = result.getValue()!;

      expect(metrics.totalWorkouts).toBe(3);
      expect(metrics.totalWorkoutTime).toBe(190); // (3600 + 4800 + 3000) / 60
      expect(metrics.averageWorkoutDuration).toBe(63); // 190 / 3
      expect(metrics.workoutsThisWeek).toBe(2); // Both workouts are now in the current week
      expect(metrics.workoutsThisMonth).toBe(3);
      expect(metrics.totalPersonalRecords).toBe(2);
      expect(metrics.recentPersonalRecords).toBe(1); // Only max-2 is within 30 days
    });

    it('should handle empty data gracefully', async () => {
      // Arrange
      mockWorkoutLogRepository.findByProfile.mockResolvedValue([]);
      mockMaxLogRepository.findByProfile.mockResolvedValue([]);

      // Act
      const result = await dashboardService.generateDashboardMetrics(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const metrics = result.getValue()!;

      expect(metrics.totalWorkouts).toBe(0);
      expect(metrics.totalWorkoutTime).toBe(0);
      expect(metrics.averageWorkoutDuration).toBe(0);
      expect(metrics.workoutsThisWeek).toBe(0);
      expect(metrics.workoutsThisMonth).toBe(0);
      expect(metrics.currentStreak).toBe(0);
      expect(metrics.longestStreak).toBe(0);
      expect(metrics.totalPersonalRecords).toBe(0);
      expect(metrics.recentPersonalRecords).toBe(0);
    });

    it('should calculate workout streaks correctly', async () => {
      // Arrange - Create consecutive workouts
      const workoutLogs = [
        createTestWorkoutLogModel({
          id: 'workout-1',
          profileId,
          startTime: new Date('2024-07-15T10:00:00Z'),
          endTime: new Date('2024-07-15T11:00:00Z'), // Today
        }),
        createTestWorkoutLogModel({
          id: 'workout-2',
          profileId,
          startTime: new Date('2024-07-14T10:00:00Z'),
          endTime: new Date('2024-07-14T11:00:00Z'), // Yesterday
        }),
        createTestWorkoutLogModel({
          id: 'workout-3',
          profileId,
          startTime: new Date('2024-07-13T10:00:00Z'),
          endTime: new Date('2024-07-13T11:00:00Z'), // Day before
        }),
        createTestWorkoutLogModel({
          id: 'workout-4',
          profileId,
          startTime: new Date('2024-07-10T10:00:00Z'),
          endTime: new Date('2024-07-10T11:00:00Z'), // Gap - different streak
        }),
        createTestWorkoutLogModel({
          id: 'workout-5',
          profileId,
          startTime: new Date('2024-07-09T10:00:00Z'),
          endTime: new Date('2024-07-09T11:00:00Z'), // Consecutive with workout-4
        }),
      ];

      mockWorkoutLogRepository.findByProfile.mockResolvedValue(workoutLogs);
      mockMaxLogRepository.findByProfile.mockResolvedValue([]);

      // Act
      const result = await dashboardService.generateDashboardMetrics(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const metrics = result.getValue()!;

      expect(metrics.currentStreak).toBe(3); // Last 3 consecutive days
      expect(metrics.longestStreak).toBe(3); // Same as current in this case
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findByProfile.mockRejectedValue(repositoryError);

      // Act
      const result = await dashboardService.generateDashboardMetrics(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to generate dashboard metrics');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate dashboard metrics',
        repositoryError,
        { profileId }
      );
    });
  });

  describe('generateRecentActivity', () => {
    it('should generate recent activity correctly', async () => {
      // Arrange
      const workoutLogs = [
        {
          id: 'workout-1',
          profileId,
          sessionName: 'Recent Workout 1',
          startTime: new Date('2024-07-15T10:00:00Z'),
          endTime: new Date('2024-07-15T11:00:00Z'),
          durationSeconds: 3600,
          performedGroupIds: ['group-1', 'group-2'], // Ensure 2 groups
          trainingPlanId: null,
          trainingPlanName: null,
          sessionId: null,
          totalVolume: null,
          notes: null,
          userRating: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        {
          id: 'workout-2',
          profileId,
          sessionName: 'Recent Workout 2',
          startTime: new Date('2024-07-14T10:00:00Z'),
          endTime: new Date('2024-07-14T11:10:00Z'),
          durationSeconds: 4200,
          performedGroupIds: ['group-3'], // 1 group
          trainingPlanId: null,
          trainingPlanName: null,
          sessionId: null,
          totalVolume: null,
          notes: null,
          userRating: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      const maxLogs = [
        createTestMaxLogModel({
          id: 'max-1',
          profileId,
          exerciseId: 'exercise-1',
          weightEnteredByUser: 120,
          reps: 1,
          estimated1RM: 120,
          date: new Date('2024-06-01T12:00:00Z'), // Not recent
        }),
        createTestMaxLogModel({
          id: 'max-2',
          profileId,
          exerciseId: 'exercise-1',
          weightEnteredByUser: 125,
          reps: 1,
          estimated1RM: 125,
          date: new Date('2024-07-10T12:00:00Z'), // Recent
        }),
      ];

      mockWorkoutLogRepository.findByProfile.mockResolvedValue(workoutLogs);
      mockMaxLogRepository.findByProfile.mockResolvedValue(maxLogs);

      // Act
      const result = await dashboardService.generateRecentActivity(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const activity = result.getValue()!;

      expect(activity.recentWorkouts).toHaveLength(2);
      expect(activity.recentWorkouts[0].name).toBe('Recent Workout 1');
      expect(activity.recentWorkouts[0].duration).toBe(60); // 3600 / 60
      expect(activity.recentWorkouts[0].exerciseCount).toBe(2); // performedGroupIds.length should be 2
      expect(activity.recentWorkouts[0].setCount).toBe(0); // Service hardcodes this to 0 as noted in implementation

      expect(activity.recentPersonalRecords).toHaveLength(1);
      expect(activity.recentPersonalRecords[0].exerciseName).toBe('Exercise exercise-1'); // Service generates this pattern
      expect(activity.recentPersonalRecords[0].oneRepMax).toBe(125);
      expect(activity.recentPersonalRecords[0].previousMax).toBe(120);
      expect(activity.recentPersonalRecords[0].improvement).toBe(5);
    });

    it('should handle workouts without names', async () => {
      // Arrange
      const workoutLogs = [
        createTestWorkoutLogModel({
          id: 'workout-1',
          profileId,
          sessionName: undefined, // This will trigger 'Untitled Workout' fallback
          startTime: new Date('2024-07-15T10:00:00Z'),
          endTime: new Date('2024-07-15T11:00:00Z'),
          durationSeconds: 3600,
          performedGroupIds: [],
        }),
      ];

      mockWorkoutLogRepository.findByProfile.mockResolvedValue(workoutLogs);
      mockMaxLogRepository.findByProfile.mockResolvedValue([]);

      // Act
      const result = await dashboardService.generateRecentActivity(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const activity = result.getValue()!;

      expect(activity.recentWorkouts).toHaveLength(1);
      expect(activity.recentWorkouts[0].name).toBe('Untitled Workout');
    });

    it('should handle personal records without previous maxes', async () => {
      // Arrange
      const maxLogs = [
        createTestMaxLogModel({
          id: 'max-1',
          profileId,
          exerciseId: 'exercise-1',
          weightEnteredByUser: 100,
          reps: 1, // This will make estimated1RM = 100
          estimated1RM: 100,
          date: new Date('2024-07-10T12:00:00Z'), // Recent, first PR
        }),
      ];

      mockWorkoutLogRepository.findByProfile.mockResolvedValue([]);
      mockMaxLogRepository.findByProfile.mockResolvedValue(maxLogs);

      // Act
      const result = await dashboardService.generateRecentActivity(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const activity = result.getValue()!;

      expect(activity.recentPersonalRecords).toHaveLength(1);
      expect(activity.recentPersonalRecords[0].exerciseName).toBe('Exercise exercise-1'); // Service generates this pattern
      expect(activity.recentPersonalRecords[0].oneRepMax).toBe(100);
      expect(activity.recentPersonalRecords[0].previousMax).toBeNull();
      expect(activity.recentPersonalRecords[0].improvement).toBe(100);
    });

    it('should limit results to 5 items each', async () => {
      // Arrange
      const workoutLogs = Array.from({ length: 10 }, (_, i) =>
        createTestWorkoutLogModel({
          id: `workout-${i}`,
          profileId,
          sessionName: `Workout ${i}`, // Use sessionName instead of name
          startTime: new Date(`2024-07-${15 - i}T10:00:00Z`), // Descending dates
          endTime: new Date(`2024-07-${15 - i}T11:00:00Z`),
          durationSeconds: 3600,
          performedGroupIds: [],
        })
      );

      const maxLogs = Array.from({ length: 10 }, (_, i) =>
        createTestMaxLogModel({
          id: `max-${i}`,
          profileId,
          exerciseId: `exercise-${i}`,
          estimated1RM: 100 + i,
          date: new Date(`2024-07-${15 - i}T12:00:00Z`), // Recent dates (all within 30 days)
        })
      );

      mockWorkoutLogRepository.findByProfile.mockResolvedValue(workoutLogs);
      mockMaxLogRepository.findByProfile.mockResolvedValue(maxLogs);

      // Act
      const result = await dashboardService.generateRecentActivity(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const activity = result.getValue()!;

      expect(activity.recentWorkouts).toHaveLength(5);
      expect(activity.recentPersonalRecords).toHaveLength(5); // Limited to 5 most recent

      // Verify they're in descending order by date
      expect(activity.recentWorkouts[0].name).toBe('Workout 0');
      expect(activity.recentWorkouts[4].name).toBe('Workout 4');
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findByProfile.mockRejectedValue(repositoryError);

      // Act
      const result = await dashboardService.generateRecentActivity(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to generate recent activity');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate recent activity',
        repositoryError,
        { profileId }
      );
    });
  });

  describe('generateProgressTrends', () => {
    it('should generate progress trends correctly', async () => {
      // Arrange
      const workoutLogs = [
        createTestWorkoutLogModel({
          id: 'workout-1',
          profileId,
          completedAt: new Date('2024-07-15T10:00:00Z'),
        }),
        createTestWorkoutLogModel({
          id: 'workout-2',
          profileId,
          completedAt: new Date('2024-07-08T10:00:00Z'),
        }),
        createTestWorkoutLogModel({
          id: 'workout-3',
          profileId,
          completedAt: new Date('2024-07-01T10:00:00Z'),
        }),
      ];

      const maxLogs = [
        createTestMaxLogModel({
          id: 'max-1',
          profileId,
          exerciseId: 'exercise-1',
          weightEnteredByUser: 120,
          reps: 1,
          estimated1RM: 120,
          date: new Date('2024-06-01T12:00:00Z'),
        }),
        createTestMaxLogModel({
          id: 'max-2',
          profileId,
          exerciseId: 'exercise-1',
          weightEnteredByUser: 125,
          reps: 1,
          estimated1RM: 125,
          date: new Date('2024-07-01T12:00:00Z'),
        }),
        createTestMaxLogModel({
          id: 'max-3',
          profileId,
          exerciseId: 'exercise-2',
          weightEnteredByUser: 150,
          reps: 1,
          estimated1RM: 150,
          date: new Date('2024-07-01T12:00:00Z'),
        }),
      ];

      const weightRecords = [
        createTestWeightRecordModel({
          id: 'weight-1',
          profileId,
          weight: 75.0,
          date: new Date('2024-06-01T08:00:00Z'), // Use date instead of recordedAt
        }),
        createTestWeightRecordModel({
          id: 'weight-2',
          profileId,
          weight: 74.5,
          date: new Date('2024-07-01T08:00:00Z'), // Use date instead of recordedAt
        }),
      ];

      mockWorkoutLogRepository.findByProfile.mockResolvedValue(workoutLogs);
      mockMaxLogRepository.findByProfile.mockResolvedValue(maxLogs);
      mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue(weightRecords);

      // Act
      const result = await dashboardService.generateProgressTrends(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const trends = result.getValue()!;

      expect(trends.workoutFrequency).toHaveLength(12); // 12 weeks
      expect(trends.workoutFrequency[0].date).toBeInstanceOf(Date);
      expect(trends.workoutFrequency[0].count).toBeGreaterThanOrEqual(0);

      expect(trends.strengthProgress).toHaveLength(2); // Bench Press and Squat
      expect(trends.strengthProgress[0].exerciseName).toBe('Exercise exercise-1'); // Service generates this pattern
      expect(trends.strengthProgress[0].data).toHaveLength(2);
      expect(trends.strengthProgress[0].data[0].oneRepMax).toBe(120);
      expect(trends.strengthProgress[0].data[1].oneRepMax).toBe(125);

      expect(trends.bodyWeightTrend).toHaveLength(2);
      // Body weight trend is sorted by date ascending, so first record (2024-07-01) should have weight 75.0
      expect(trends.bodyWeightTrend[0].weight).toBe(75.0); // 2024-07-01
      expect(trends.bodyWeightTrend[1].weight).toBe(74.5); // 2024-07-10
    });

    it('should handle empty data gracefully', async () => {
      // Arrange
      mockWorkoutLogRepository.findByProfile.mockResolvedValue([]);
      mockMaxLogRepository.findByProfile.mockResolvedValue([]);
      mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue([]);

      // Act
      const result = await dashboardService.generateProgressTrends(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const trends = result.getValue()!;

      expect(trends.workoutFrequency).toHaveLength(12); // Always 12 weeks
      expect(trends.workoutFrequency.every((week) => week.count === 0)).toBe(true);
      expect(trends.strengthProgress).toHaveLength(0);
      expect(trends.bodyWeightTrend).toHaveLength(0);
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findByProfile.mockRejectedValue(repositoryError);

      // Act
      const result = await dashboardService.generateProgressTrends(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to generate progress trends');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate progress trends',
        repositoryError,
        { profileId }
      );
    });
  });
});
