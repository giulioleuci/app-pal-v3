import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DashboardData,
  DashboardMetrics,
  DashboardService,
  ProgressTrends,
  RecentActivity,
} from '@/features/dashboard/services/DashboardService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { DashboardQueryService } from '../DashboardQueryService';

describe('DashboardQueryService', () => {
  let dashboardQueryService: DashboardQueryService;
  let mockDashboardService: {
    getDashboardData: ReturnType<typeof vi.fn>;
    generateDashboardMetrics: ReturnType<typeof vi.fn>;
    generateRecentActivity: ReturnType<typeof vi.fn>;
    generateProgressTrends: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';

  const testDashboardMetrics: DashboardMetrics = {
    totalWorkouts: 42,
    totalVolume: 125000,
    averageWorkoutDuration: 75,
    personalRecords: 8,
    currentStreak: 7,
    longestStreak: 14,
    weeklyFrequency: 4.5,
    mostActiveDay: 'monday',
    favoriteExercise: 'Bench Press',
    volumeThisWeek: 15000,
    volumeLastWeek: 12000,
    strengthGains: 15.5,
    consistency: 0.85,
  };

  const testRecentActivity: RecentActivity = {
    recentWorkouts: [
      {
        id: 'workout-1',
        date: new Date('2024-01-20T18:00:00Z'),
        name: 'Push Day',
        duration: 75,
        volume: 12000,
        exerciseCount: 6,
        personalRecords: 1,
      },
      {
        id: 'workout-2',
        date: new Date('2024-01-18T19:00:00Z'),
        name: 'Pull Day',
        duration: 80,
        volume: 13500,
        exerciseCount: 7,
        personalRecords: 0,
      },
    ],
    recentPersonalRecords: [
      {
        id: 'pr-1',
        exerciseName: 'Bench Press',
        newMax: 115,
        previousMax: 110,
        improvement: 5,
        achievedAt: new Date('2024-01-20T18:30:00Z'),
      },
    ],
    upcomingWorkouts: [
      {
        scheduledFor: new Date('2024-01-22T18:00:00Z'),
        planName: 'Leg Day',
        estimatedDuration: 90,
        exerciseCount: 8,
      },
    ],
    streakStatus: {
      current: 7,
      target: 10,
      daysUntilTarget: 3,
      isOnTrack: true,
    },
  };

  const testProgressTrends: ProgressTrends = {
    strengthTrend: {
      period: '3months',
      dataPoints: [
        { date: new Date('2023-11-01'), value: 95, label: 'Nov' },
        { date: new Date('2023-12-01'), value: 105, label: 'Dec' },
        { date: new Date('2024-01-01'), value: 115, label: 'Jan' },
      ],
      trend: 'increasing',
      changePercentage: 21.1,
    },
    volumeTrend: {
      period: '6weeks',
      dataPoints: [
        { date: new Date('2024-01-01'), value: 10000, label: 'Week 1' },
        { date: new Date('2024-01-08'), value: 12000, label: 'Week 2' },
        { date: new Date('2024-01-15'), value: 13000, label: 'Week 3' },
      ],
      trend: 'increasing',
      changePercentage: 30.0,
    },
    bodyWeightTrend: {
      period: '3months',
      dataPoints: [
        { date: new Date('2023-11-01'), value: 76.0, label: 'Nov' },
        { date: new Date('2023-12-01'), value: 75.5, label: 'Dec' },
        { date: new Date('2024-01-01'), value: 75.0, label: 'Jan' },
      ],
      trend: 'decreasing',
      changePercentage: -1.3,
    },
    frequencyTrend: {
      period: '4weeks',
      dataPoints: [
        { date: new Date('2024-01-01'), value: 4, label: 'Week 1' },
        { date: new Date('2024-01-08'), value: 5, label: 'Week 2' },
        { date: new Date('2024-01-15'), value: 4, label: 'Week 3' },
      ],
      trend: 'stable',
      changePercentage: 0.0,
    },
  };

  const testDashboardData: DashboardData = {
    metrics: testDashboardMetrics,
    recentActivity: testRecentActivity,
    progressTrends: testProgressTrends,
    lastUpdated: new Date('2024-01-21T10:00:00Z'),
    cacheExpiry: new Date('2024-01-21T11:00:00Z'),
  };

  beforeEach(() => {
    // Create service mock
    mockDashboardService = {
      getDashboardData: vi.fn(),
      generateDashboardMetrics: vi.fn(),
      generateRecentActivity: vi.fn(),
      generateProgressTrends: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    dashboardQueryService = new DashboardQueryService(mockDashboardService as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data when service succeeds', async () => {
      // Arrange
      mockDashboardService.getDashboardData.mockResolvedValue(Result.success(testDashboardData));

      // Act
      const result = await dashboardQueryService.getDashboardData(testProfileId);

      // Assert
      expect(result).toEqual(testDashboardData);
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(testProfileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate dashboard data');
      mockDashboardService.getDashboardData.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dashboardQueryService.getDashboardData(testProfileId)).rejects.toThrow(error);
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(testProfileId);
    });

    it('should handle empty dashboard data', async () => {
      // Arrange
      const emptyDashboardData: DashboardData = {
        metrics: {
          ...testDashboardMetrics,
          totalWorkouts: 0,
          totalVolume: 0,
          personalRecords: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        recentActivity: {
          recentWorkouts: [],
          recentPersonalRecords: [],
          upcomingWorkouts: [],
          streakStatus: {
            current: 0,
            target: 10,
            daysUntilTarget: 10,
            isOnTrack: false,
          },
        },
        progressTrends: {
          strengthTrend: {
            period: '3months',
            dataPoints: [],
            trend: 'stable',
            changePercentage: 0,
          },
          volumeTrend: {
            period: '6weeks',
            dataPoints: [],
            trend: 'stable',
            changePercentage: 0,
          },
          bodyWeightTrend: {
            period: '3months',
            dataPoints: [],
            trend: 'stable',
            changePercentage: 0,
          },
          frequencyTrend: {
            period: '4weeks',
            dataPoints: [],
            trend: 'stable',
            changePercentage: 0,
          },
        },
        lastUpdated: new Date(),
        cacheExpiry: new Date(),
      };
      mockDashboardService.getDashboardData.mockResolvedValue(Result.success(emptyDashboardData));

      // Act
      const result = await dashboardQueryService.getDashboardData(testProfileId);

      // Assert
      expect(result).toEqual(emptyDashboardData);
      expect(result.metrics.totalWorkouts).toBe(0);
      expect(result.recentActivity.recentWorkouts.length).toBe(0);
    });

    it('should handle invalid profile ID', async () => {
      // Arrange
      const invalidId = 'invalid-profile-id';
      const error = new ApplicationError('Profile not found');
      mockDashboardService.getDashboardData.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dashboardQueryService.getDashboardData(invalidId)).rejects.toThrow(error);
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(invalidId);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected dashboard error');
      mockDashboardService.getDashboardData.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(dashboardQueryService.getDashboardData(testProfileId)).rejects.toThrow(
        unexpectedError
      );
    });
  });

  describe('generateDashboardMetrics', () => {
    it('should return dashboard metrics when service succeeds', async () => {
      // Arrange
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(
        Result.success(testDashboardMetrics)
      );

      // Act
      const result = await dashboardQueryService.generateDashboardMetrics(testProfileId);

      // Assert
      expect(result).toEqual(testDashboardMetrics);
      expect(mockDashboardService.generateDashboardMetrics).toHaveBeenCalledWith(testProfileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate dashboard metrics');
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dashboardQueryService.generateDashboardMetrics(testProfileId)).rejects.toThrow(
        error
      );
      expect(mockDashboardService.generateDashboardMetrics).toHaveBeenCalledWith(testProfileId);
    });

    it('should handle metrics with extreme values', async () => {
      // Arrange
      const extremeMetrics: DashboardMetrics = {
        ...testDashboardMetrics,
        totalWorkouts: 1000,
        totalVolume: 5000000,
        personalRecords: 100,
        longestStreak: 365,
        strengthGains: 200.5,
      };
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(
        Result.success(extremeMetrics)
      );

      // Act
      const result = await dashboardQueryService.generateDashboardMetrics(testProfileId);

      // Assert
      expect(result).toEqual(extremeMetrics);
      expect(result.totalWorkouts).toBe(1000);
      expect(result.strengthGains).toBe(200.5);
    });

    it('should handle zero metrics', async () => {
      // Arrange
      const zeroMetrics: DashboardMetrics = {
        ...testDashboardMetrics,
        totalWorkouts: 0,
        totalVolume: 0,
        averageWorkoutDuration: 0,
        personalRecords: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyFrequency: 0,
        volumeThisWeek: 0,
        volumeLastWeek: 0,
        strengthGains: 0,
        consistency: 0,
      };
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(Result.success(zeroMetrics));

      // Act
      const result = await dashboardQueryService.generateDashboardMetrics(testProfileId);

      // Assert
      expect(result).toEqual(zeroMetrics);
      expect(result.totalWorkouts).toBe(0);
    });
  });

  describe('generateRecentActivity', () => {
    it('should return recent activity when service succeeds', async () => {
      // Arrange
      mockDashboardService.generateRecentActivity.mockResolvedValue(
        Result.success(testRecentActivity)
      );

      // Act
      const result = await dashboardQueryService.generateRecentActivity(testProfileId);

      // Assert
      expect(result).toEqual(testRecentActivity);
      expect(mockDashboardService.generateRecentActivity).toHaveBeenCalledWith(testProfileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate recent activity');
      mockDashboardService.generateRecentActivity.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dashboardQueryService.generateRecentActivity(testProfileId)).rejects.toThrow(
        error
      );
      expect(mockDashboardService.generateRecentActivity).toHaveBeenCalledWith(testProfileId);
    });

    it('should handle large activity lists', async () => {
      // Arrange
      const largeActivity: RecentActivity = {
        recentWorkouts: Array.from({ length: 50 }, (_, i) => ({
          id: `workout-${i}`,
          date: new Date(`2024-01-${String(20 - i).padStart(2, '0')}T18:00:00Z`),
          name: `Workout ${i}`,
          duration: 60 + i,
          volume: 10000 + i * 100,
          exerciseCount: 5 + (i % 3),
          personalRecords: i % 5 === 0 ? 1 : 0,
        })),
        recentPersonalRecords: Array.from({ length: 20 }, (_, i) => ({
          id: `pr-${i}`,
          exerciseName: `Exercise ${i}`,
          newMax: 100 + i,
          previousMax: 90 + i,
          improvement: 10,
          achievedAt: new Date(`2024-01-${String(20 - i).padStart(2, '0')}T18:00:00Z`),
        })),
        upcomingWorkouts: testRecentActivity.upcomingWorkouts,
        streakStatus: testRecentActivity.streakStatus,
      };
      mockDashboardService.generateRecentActivity.mockResolvedValue(Result.success(largeActivity));

      // Act
      const result = await dashboardQueryService.generateRecentActivity(testProfileId);

      // Assert
      expect(result).toEqual(largeActivity);
      expect(result.recentWorkouts.length).toBe(50);
      expect(result.recentPersonalRecords.length).toBe(20);
    });

    it('should handle empty recent activity', async () => {
      // Arrange
      const emptyActivity: RecentActivity = {
        recentWorkouts: [],
        recentPersonalRecords: [],
        upcomingWorkouts: [],
        streakStatus: {
          current: 0,
          target: 10,
          daysUntilTarget: 10,
          isOnTrack: false,
        },
      };
      mockDashboardService.generateRecentActivity.mockResolvedValue(Result.success(emptyActivity));

      // Act
      const result = await dashboardQueryService.generateRecentActivity(testProfileId);

      // Assert
      expect(result).toEqual(emptyActivity);
      expect(result.recentWorkouts.length).toBe(0);
    });
  });

  describe('generateProgressTrends', () => {
    it('should return progress trends when service succeeds', async () => {
      // Arrange
      mockDashboardService.generateProgressTrends.mockResolvedValue(
        Result.success(testProgressTrends)
      );

      // Act
      const result = await dashboardQueryService.generateProgressTrends(testProfileId);

      // Assert
      expect(result).toEqual(testProgressTrends);
      expect(mockDashboardService.generateProgressTrends).toHaveBeenCalledWith(testProfileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate progress trends');
      mockDashboardService.generateProgressTrends.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(dashboardQueryService.generateProgressTrends(testProfileId)).rejects.toThrow(
        error
      );
      expect(mockDashboardService.generateProgressTrends).toHaveBeenCalledWith(testProfileId);
    });

    it('should handle trends with many data points', async () => {
      // Arrange
      const detailedTrends: ProgressTrends = {
        ...testProgressTrends,
        strengthTrend: {
          period: '12months',
          dataPoints: Array.from({ length: 365 }, (_, i) => ({
            date: new Date(2023, 0, i + 1),
            value: 90 + i * 0.1,
            label: `Day ${i + 1}`,
          })),
          trend: 'increasing',
          changePercentage: 36.5,
        },
      };
      mockDashboardService.generateProgressTrends.mockResolvedValue(Result.success(detailedTrends));

      // Act
      const result = await dashboardQueryService.generateProgressTrends(testProfileId);

      // Assert
      expect(result).toEqual(detailedTrends);
      expect(result.strengthTrend.dataPoints.length).toBe(365);
    });

    it('should handle flat/no progress trends', async () => {
      // Arrange
      const flatTrends: ProgressTrends = {
        strengthTrend: {
          period: '3months',
          dataPoints: [
            { date: new Date('2023-11-01'), value: 100, label: 'Nov' },
            { date: new Date('2023-12-01'), value: 100, label: 'Dec' },
            { date: new Date('2024-01-01'), value: 100, label: 'Jan' },
          ],
          trend: 'stable',
          changePercentage: 0.0,
        },
        volumeTrend: {
          period: '6weeks',
          dataPoints: [],
          trend: 'stable',
          changePercentage: 0.0,
        },
        bodyWeightTrend: {
          period: '3months',
          dataPoints: [],
          trend: 'stable',
          changePercentage: 0.0,
        },
        frequencyTrend: {
          period: '4weeks',
          dataPoints: [],
          trend: 'stable',
          changePercentage: 0.0,
        },
      };
      mockDashboardService.generateProgressTrends.mockResolvedValue(Result.success(flatTrends));

      // Act
      const result = await dashboardQueryService.generateProgressTrends(testProfileId);

      // Assert
      expect(result).toEqual(flatTrends);
      expect(result.strengthTrend.changePercentage).toBe(0.0);
    });
  });

  describe('dependency injection', () => {
    it('should use injected DashboardService', () => {
      // Arrange & Act
      const service = new DashboardQueryService(mockDashboardService as any);

      // Assert
      expect(service).toBeInstanceOf(DashboardQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from DashboardService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific dashboard error');
      mockDashboardService.getDashboardData.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(dashboardQueryService.getDashboardData(testProfileId)).rejects.toBe(
        originalError
      );
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(
        Result.failure(originalError)
      );

      // Act
      const thrownError = await dashboardQueryService
        .generateDashboardMetrics(testProfileId)
        .catch((error) => error);

      // Assert
      expect(thrownError).toBe(originalError);
      expect(thrownError.stack).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent calls to different methods', async () => {
      // Arrange
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(
        Result.success(testDashboardMetrics)
      );
      mockDashboardService.generateRecentActivity.mockResolvedValue(
        Result.success(testRecentActivity)
      );
      mockDashboardService.generateProgressTrends.mockResolvedValue(
        Result.success(testProgressTrends)
      );

      // Act
      const [metricsResult, activityResult, trendsResult] = await Promise.all([
        dashboardQueryService.generateDashboardMetrics(testProfileId),
        dashboardQueryService.generateRecentActivity(testProfileId),
        dashboardQueryService.generateProgressTrends(testProfileId),
      ]);

      // Assert
      expect(metricsResult).toEqual(testDashboardMetrics);
      expect(activityResult).toEqual(testRecentActivity);
      expect(trendsResult).toEqual(testProgressTrends);
      expect(mockDashboardService.generateDashboardMetrics).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.generateRecentActivity).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.generateProgressTrends).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(
        Result.success(testDashboardMetrics)
      );
      mockDashboardService.generateRecentActivity.mockResolvedValue(
        Result.failure(new ApplicationError('Recent activity failed'))
      );

      // Act
      const metricsResult = await dashboardQueryService.generateDashboardMetrics(testProfileId);
      const activityError = await dashboardQueryService
        .generateRecentActivity(testProfileId)
        .catch((e) => e);

      // Assert
      expect(metricsResult).toEqual(testDashboardMetrics);
      expect(activityError).toBeInstanceOf(ApplicationError);
    });

    it('should handle operations on non-existent profile consistently', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const notFoundError = new ApplicationError('Profile not found');

      mockDashboardService.getDashboardData.mockResolvedValue(Result.failure(notFoundError));
      mockDashboardService.generateDashboardMetrics.mockResolvedValue(
        Result.failure(notFoundError)
      );
      mockDashboardService.generateRecentActivity.mockResolvedValue(Result.failure(notFoundError));
      mockDashboardService.generateProgressTrends.mockResolvedValue(Result.failure(notFoundError));

      // Act
      const dashboardError = await dashboardQueryService
        .getDashboardData(nonExistentId)
        .catch((e) => e);
      const metricsError = await dashboardQueryService
        .generateDashboardMetrics(nonExistentId)
        .catch((e) => e);
      const activityError = await dashboardQueryService
        .generateRecentActivity(nonExistentId)
        .catch((e) => e);
      const trendsError = await dashboardQueryService
        .generateProgressTrends(nonExistentId)
        .catch((e) => e);

      // Assert
      expect(dashboardError).toBe(notFoundError);
      expect(metricsError).toBe(notFoundError);
      expect(activityError).toBe(notFoundError);
      expect(trendsError).toBe(notFoundError);
    });
  });

  describe('data validation edge cases', () => {
    it('should handle dashboard data with null/undefined fields', async () => {
      // Arrange
      const partialDashboardData: DashboardData = {
        ...testDashboardData,
        metrics: {
          ...testDashboardMetrics,
          mostActiveDay: undefined as any,
          favoriteExercise: undefined as any,
        },
      };
      mockDashboardService.getDashboardData.mockResolvedValue(Result.success(partialDashboardData));

      // Act
      const result = await dashboardQueryService.getDashboardData(testProfileId);

      // Assert
      expect(result).toEqual(partialDashboardData);
      expect(result.metrics.mostActiveDay).toBeUndefined();
      expect(result.metrics.favoriteExercise).toBeUndefined();
    });

    it('should handle negative trend values', async () => {
      // Arrange
      const negativeTrends: ProgressTrends = {
        ...testProgressTrends,
        strengthTrend: {
          ...testProgressTrends.strengthTrend,
          trend: 'decreasing',
          changePercentage: -25.5,
        },
        volumeTrend: {
          ...testProgressTrends.volumeTrend,
          trend: 'decreasing',
          changePercentage: -40.2,
        },
      };
      mockDashboardService.generateProgressTrends.mockResolvedValue(Result.success(negativeTrends));

      // Act
      const result = await dashboardQueryService.generateProgressTrends(testProfileId);

      // Assert
      expect(result).toEqual(negativeTrends);
      expect(result.strengthTrend.changePercentage).toBe(-25.5);
      expect(result.volumeTrend.changePercentage).toBe(-40.2);
    });

    it('should handle future dates in activity data', async () => {
      // Arrange
      const futureDate = new Date('2030-12-31T18:00:00Z');
      const futureActivity: RecentActivity = {
        ...testRecentActivity,
        upcomingWorkouts: [
          {
            scheduledFor: futureDate,
            planName: 'Future Workout',
            estimatedDuration: 60,
            exerciseCount: 5,
          },
        ],
      };
      mockDashboardService.generateRecentActivity.mockResolvedValue(Result.success(futureActivity));

      // Act
      const result = await dashboardQueryService.generateRecentActivity(testProfileId);

      // Assert
      expect(result).toEqual(futureActivity);
      expect(result.upcomingWorkouts[0].scheduledFor).toEqual(futureDate);
    });
  });
});
