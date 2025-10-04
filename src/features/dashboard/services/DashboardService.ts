import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { IProfileRepository } from '@/features/profile/domain/IProfileRepository';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

/**
 * Represents key metrics for the dashboard overview.
 */
export interface DashboardMetrics {
  totalWorkouts: number;
  totalWorkoutTime: number; // in minutes
  averageWorkoutDuration: number; // in minutes
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number; // days
  longestStreak: number; // days
  totalPersonalRecords: number;
  recentPersonalRecords: number; // in last 30 days
}

/**
 * Represents recent activity for dashboard display.
 */
export interface RecentActivity {
  recentWorkouts: Array<{
    id: string;
    name: string;
    startTime: Date;
    duration?: number;
    exerciseCount: number;
    setCount: number;
  }>;
  recentPersonalRecords: Array<{
    id: string;
    exerciseName: string;
    oneRepMax: number;
    previousMax: number | null;
    improvement: number;
    date: Date;
  }>;
}

/**
 * Represents progress trends for dashboard charts.
 */
export interface ProgressTrends {
  workoutFrequency: Array<{
    date: Date;
    count: number;
  }>;
  strengthProgress: Array<{
    exerciseName: string;
    data: Array<{
      date: Date;
      oneRepMax: number;
    }>;
  }>;
  bodyWeightTrend: Array<{
    date: Date;
    weight: number;
  }>;
}

/**
 * Represents complete dashboard data.
 */
export interface DashboardData {
  metrics: DashboardMetrics;
  recentActivity: RecentActivity;
  progressTrends: ProgressTrends;
  generatedAt: Date;
}

/**
 * Service responsible for generating dashboard data and analytics.
 * This service aggregates data from multiple domains to provide
 * comprehensive overview information for users.
 */
@injectable()
export class DashboardService {
  constructor(
    @inject('IProfileRepository') private readonly profileRepository: IProfileRepository,
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('IBodyMetricsRepository')
    private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ITrainingPlanRepository')
    private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Generates complete dashboard data for a profile.
   * @param profileId The profile ID to generate dashboard for
   * @returns Result containing dashboard data or an error
   */
  async getDashboardData(profileId: string): Promise<Result<DashboardData, ApplicationError>> {
    try {
      this.logger.info('Generating dashboard data', { profileId });

      // Verify profile exists
      const profile = await this.profileRepository.findById(profileId);
      if (!profile) {
        return Result.failure(new ApplicationError('Profile not found'));
      }

      // Generate dashboard components
      const [metrics, recentActivity, progressTrends] = await Promise.all([
        this.generateDashboardMetrics(profileId),
        this.generateRecentActivity(profileId),
        this.generateProgressTrends(profileId),
      ]);

      const dashboardData: DashboardData = {
        metrics: metrics.getValue()!,
        recentActivity: recentActivity.getValue()!,
        progressTrends: progressTrends.getValue()!,
        generatedAt: new Date(),
      };

      this.logger.info('Dashboard data generated successfully', {
        profileId,
        totalWorkouts: dashboardData.metrics.totalWorkouts,
        recentWorkouts: dashboardData.recentActivity.recentWorkouts.length,
        recentPRs: dashboardData.recentActivity.recentPersonalRecords.length,
      });

      return Result.success(dashboardData);
    } catch (_error) {
      this.logger.error('Failed to generate dashboard data', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to generate dashboard data', _error));
    }
  }

  /**
   * Generates key metrics for the dashboard.
   * @param profileId The profile ID to generate metrics for
   * @returns Result containing dashboard metrics or an error
   */
  async generateDashboardMetrics(
    profileId: string
  ): Promise<Result<DashboardMetrics, ApplicationError>> {
    try {
      this.logger.info('Generating dashboard metrics', { profileId });

      const workoutLogs = await this.workoutLogRepository.findByProfile(profileId);
      const maxLogs = await this.maxLogRepository.findByProfile(profileId);

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      // Calculate workout metrics
      const totalWorkouts = workoutLogs.length;
      const totalWorkoutTime =
        workoutLogs.reduce((sum, workout) => sum + (workout.durationSeconds || 0), 0) / 60; // Convert to minutes
      const averageWorkoutDuration = totalWorkouts > 0 ? totalWorkoutTime / totalWorkouts : 0;

      const workoutsThisWeek = workoutLogs.filter(
        (workout) => workout.startTime && workout.startTime >= startOfWeek
      ).length;

      const workoutsThisMonth = workoutLogs.filter(
        (workout) => workout.startTime && workout.startTime >= startOfMonth
      ).length;

      // Calculate streaks
      const { currentStreak, longestStreak } = this.calculateWorkoutStreaks(workoutLogs);

      // Calculate personal record metrics
      const totalPersonalRecords = maxLogs.length;
      const recentPersonalRecords = maxLogs.filter(
        (log) => log.date && log.date >= thirtyDaysAgo
      ).length;

      const metrics: DashboardMetrics = {
        totalWorkouts,
        totalWorkoutTime: Math.round(totalWorkoutTime),
        averageWorkoutDuration: Math.round(averageWorkoutDuration),
        workoutsThisWeek,
        workoutsThisMonth,
        currentStreak,
        longestStreak,
        totalPersonalRecords,
        recentPersonalRecords,
      };

      return Result.success(metrics);
    } catch (_error) {
      this.logger.error('Failed to generate dashboard metrics', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to generate dashboard metrics', _error));
    }
  }

  /**
   * Generates recent activity data for the dashboard.
   * @param profileId The profile ID to generate activity for
   * @returns Result containing recent activity or an error
   */
  async generateRecentActivity(
    profileId: string
  ): Promise<Result<RecentActivity, ApplicationError>> {
    try {
      this.logger.info('Generating recent activity', { profileId });

      const [workoutLogs, maxLogs] = await Promise.all([
        this.workoutLogRepository.findByProfile(profileId),
        this.maxLogRepository.findByProfile(profileId),
      ]);

      // Get recent workouts (last 5)
      const recentWorkouts = workoutLogs
        .sort((a, b) => {
          const aDate = a.endTime || a.startTime;
          const bDate = b.endTime || b.startTime;
          return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
        })
        .slice(0, 5)
        .map((workout) => ({
          id: workout.id,
          name: workout.sessionName || 'Untitled Workout',
          startTime: workout.startTime || new Date(),
          duration: workout.durationSeconds ? Math.round(workout.durationSeconds / 60) : undefined,
          exerciseCount: workout.performedGroupIds?.length || 0,
          setCount: 0, // Would need to calculate from performed groups - simplified for now
        }));

      // Get recent personal records (last 30 days, up to 5)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMaxLogs = maxLogs
        .filter((log) => log.date && log.date >= thirtyDaysAgo)
        .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
        .slice(0, 5);

      const recentPersonalRecords = await Promise.all(
        recentMaxLogs.map(async (log) => {
          // Find previous max for improvement calculation
          const previousMaxLogs = maxLogs
            .filter(
              (prevLog) =>
                prevLog.exerciseId === log.exerciseId &&
                prevLog.date &&
                log.date &&
                prevLog.date < log.date
            )
            .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

          const previousMax = previousMaxLogs.length > 0 ? previousMaxLogs[0].estimated1RM : null;
          const improvement = previousMax ? log.estimated1RM - previousMax : log.estimated1RM;

          return {
            id: log.id,
            exerciseName: `Exercise ${log.exerciseId}`, // Would need to look up exercise name
            oneRepMax: log.estimated1RM,
            previousMax,
            improvement: Math.round(improvement * 100) / 100, // Round to 2 decimal places
            date: log.date || new Date(),
          };
        })
      );

      const activity: RecentActivity = {
        recentWorkouts,
        recentPersonalRecords,
      };

      return Result.success(activity);
    } catch (_error) {
      this.logger.error('Failed to generate recent activity', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to generate recent activity', _error));
    }
  }

  /**
   * Generates progress trends for dashboard charts.
   * @param profileId The profile ID to generate trends for
   * @returns Result containing progress trends or an error
   */
  async generateProgressTrends(
    profileId: string
  ): Promise<Result<ProgressTrends, ApplicationError>> {
    try {
      this.logger.info('Generating progress trends', { profileId });

      const [workoutLogs, maxLogs] = await Promise.all([
        this.workoutLogRepository.findByProfile(profileId),
        this.maxLogRepository.findByProfile(profileId),
        this.bodyMetricsRepository.findWeightRecordsByProfile(profileId),
      ]);

      const bodyWeightRecords =
        await this.bodyMetricsRepository.findWeightRecordsByProfile(profileId);

      // Generate workout frequency trend (last 12 weeks)
      const workoutFrequency = this.generateWorkoutFrequencyTrend(workoutLogs);

      // Generate strength progress for top 3 exercises by PR count
      const strengthProgress = this.generateStrengthProgressTrend(maxLogs);

      // Generate body weight trend
      const bodyWeightTrend = bodyWeightRecords
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((record) => ({
          date: record.date,
          weight: record.weight,
        }));

      const trends: ProgressTrends = {
        workoutFrequency,
        strengthProgress,
        bodyWeightTrend,
      };

      return Result.success(trends);
    } catch (_error) {
      this.logger.error('Failed to generate progress trends', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to generate progress trends', _error));
    }
  }

  /**
   * Calculates current and longest workout streaks.
   * @private
   */
  private calculateWorkoutStreaks(workoutLogs: any[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (workoutLogs.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort workouts by date (newest first) - use endTime or startTime
    const sortedWorkouts = workoutLogs
      .filter((workout) => workout.endTime || workout.startTime)
      .sort((a, b) => {
        const aDate = a.endTime || a.startTime;
        const bDate = b.endTime || b.startTime;
        return bDate.getTime() - aDate.getTime();
      });

    if (sortedWorkouts.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // End of today

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.endTime || workout.startTime);
      const daysDiff = Math.floor(
        (currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        // Today or yesterday
        currentStreak++;
        currentDate = new Date(workoutDate);
        currentDate.setDate(currentDate.getDate() - 1); // Look for previous day
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    const lastWorkout = sortedWorkouts[sortedWorkouts.length - 1];
    let previousDate = new Date(lastWorkout.endTime || lastWorkout.startTime);

    for (let i = sortedWorkouts.length - 2; i >= 0; i--) {
      const currentWorkout = sortedWorkouts[i];
      const currentWorkoutDate = new Date(currentWorkout.endTime || currentWorkout.startTime);
      const daysDiff = Math.floor(
        (currentWorkoutDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      previousDate = currentWorkoutDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  /**
   * Generates workout frequency trend for the last 12 weeks.
   * @private
   */
  private generateWorkoutFrequencyTrend(workoutLogs: any[]): Array<{ date: Date; count: number }> {
    const trend: Array<{ date: Date; count: number }> = [];
    const now = new Date();

    // Generate 12 weeks of data
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const workoutsInWeek = workoutLogs.filter((workout) => {
        const workoutDate = workout.endTime || workout.startTime;
        return workoutDate && workoutDate >= weekStart && workoutDate <= weekEnd;
      }).length;

      trend.push({
        date: new Date(weekStart),
        count: workoutsInWeek,
      });
    }

    return trend;
  }

  /**
   * Generates strength progress trend for top exercises.
   * @private
   */
  private generateStrengthProgressTrend(maxLogs: any[]): Array<{
    exerciseName: string;
    data: Array<{ date: Date; oneRepMax: number }>;
  }> {
    // Group max logs by exercise
    const exerciseGroups: { [exerciseId: string]: any[] } = {};
    for (const log of maxLogs) {
      if (!exerciseGroups[log.exerciseId]) {
        exerciseGroups[log.exerciseId] = [];
      }
      exerciseGroups[log.exerciseId].push(log);
    }

    // Get top 3 exercises by number of records
    const topExercises = Object.entries(exerciseGroups)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 3);

    return topExercises.map(([exerciseId, logs]) => ({
      exerciseName: `Exercise ${exerciseId}`, // Would need to look up exercise name
      data: logs
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((log) => ({
          date: log.date,
          oneRepMax: log.estimated1RM,
        })),
    }));
  }
}
