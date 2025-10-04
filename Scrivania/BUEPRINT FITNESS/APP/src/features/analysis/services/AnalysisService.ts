import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

/**
 * Represents strength progress data for a specific exercise.
 */
export interface StrengthProgressData {
  exerciseId: string;
  exerciseName: string;
  data: Array<{
    date: Date;
    oneRepMax: number;
    estimatedMax: number;
  }>;
}

/**
 * Represents body weight progression over time.
 */
export interface WeightProgressData {
  data: Array<{
    date: Date;
    weight: number;
  }>;
}

/**
 * Represents overall training volume statistics.
 */
export interface VolumeAnalysisData {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  averageSessionDuration: number;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Represents workout frequency analysis by time period.
 */
export interface FrequencyAnalysisData {
  workoutsPerWeek: number;
  workoutsPerMonth: number;
  totalWorkouts: number;
  consistencyScore: number;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Service responsible for generating training and progress analytics.
 * This service provides read-only analysis capabilities for user data,
 * aggregating information from multiple domains to provide insights.
 */
@injectable()
export class AnalysisService {
  constructor(
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('IBodyMetricsRepository')
    private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ITrainingPlanRepository')
    private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Generates strength progress analysis for a specific exercise over a date range.
   * @param profileId The profile ID to analyze
   * @param exerciseId The exercise ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Result containing strength progress data or an error
   */
  async getStrengthProgress(
    profileId: string,
    exerciseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<StrengthProgressData, ApplicationError>> {
    try {
      this.logger.info('Analyzing strength progress', {
        profileId,
        exerciseId,
        startDate,
        endDate,
      });

      const maxLogs = await this.maxLogRepository.findByProfileAndExercise(
        profileId,
        exerciseId,
        startDate,
        endDate
      );
      const workoutLogs = await this.workoutLogRepository.findByProfileAndDateRange(
        profileId,
        startDate,
        endDate
      );

      // Note: exerciseName should be resolved from Exercise repository in a full implementation
      const exerciseName = 'Unknown Exercise'; // TODO: Resolve exercise name from exerciseId

      const strengthData = maxLogs.map((log) => ({
        date: log.date,
        oneRepMax: log.weightEnteredByUser,
        estimatedMax: log.estimated1RM,
      }));

      const result: StrengthProgressData = {
        exerciseId,
        exerciseName,
        data: strengthData,
      };

      this.logger.info('Strength progress analysis completed', {
        profileId,
        exerciseId,
        dataPoints: strengthData.length,
      });

      return Result.success(result);
    } catch (_error) {
      this.logger.error('Failed to analyze strength progress', _error as Error, {
        profileId,
        exerciseId,
        startDate,
        endDate,
      });
      return Result.failure(new ApplicationError('Failed to analyze strength progress', _error));
    }
  }

  /**
   * Generates body weight progression analysis over a date range.
   * @param profileId The profile ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Result containing weight progress data or an error
   */
  async getWeightProgress(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<WeightProgressData, ApplicationError>> {
    try {
      this.logger.info('Analyzing weight progress', { profileId, startDate, endDate });

      const weightRecords = await this.bodyMetricsRepository.findWeightRecordsByProfileAndDateRange(
        profileId,
        startDate,
        endDate
      );

      const weightData = weightRecords.map((record) => ({
        date: record.date,
        weight: record.weight,
      }));

      const result: WeightProgressData = {
        data: weightData,
      };

      this.logger.info('Weight progress analysis completed', {
        profileId,
        dataPoints: weightData.length,
      });

      return Result.success(result);
    } catch (_error) {
      this.logger.error('Failed to analyze weight progress', _error as Error, {
        profileId,
        startDate,
        endDate,
      });
      return Result.failure(new ApplicationError('Failed to analyze weight progress', _error));
    }
  }

  /**
   * Generates training volume analysis over a date range.
   * @param profileId The profile ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Result containing volume analysis data or an error
   */
  async getVolumeAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<VolumeAnalysisData, ApplicationError>> {
    try {
      this.logger.info('Analyzing training volume', { profileId, startDate, endDate });

      const workoutLogs = await this.workoutLogRepository.findByProfileAndDateRange(
        profileId,
        startDate,
        endDate
      );

      let totalSets = 0;
      let totalReps = 0;
      let totalVolume = 0;
      let totalDuration = 0;

      for (const workout of workoutLogs) {
        if (workout.durationSeconds) {
          totalDuration += workout.durationSeconds;
        }

        for (const group of workout.performedGroups) {
          for (const exercise of group.performedExercises) {
            totalSets += exercise.sets.length;

            for (const set of exercise.sets) {
              if (set.counts) {
                totalReps += set.counts;
              }
              if (set.weight && set.counts) {
                totalVolume += set.weight * set.counts;
              }
            }
          }
        }
      }

      const averageSessionDuration =
        workoutLogs.length > 0 ? totalDuration / workoutLogs.length : 0;

      const result: VolumeAnalysisData = {
        totalWorkouts: workoutLogs.length,
        totalSets,
        totalReps,
        totalVolume,
        averageSessionDuration,
        timeRange: {
          startDate,
          endDate,
        },
      };

      this.logger.info('Volume analysis completed', {
        profileId,
        totalWorkouts: result.totalWorkouts,
        totalVolume: result.totalVolume,
      });

      return Result.success(result);
    } catch (_error) {
      this.logger.error('Failed to analyze training volume', _error as Error, {
        profileId,
        startDate,
        endDate,
      });
      return Result.failure(new ApplicationError('Failed to analyze training volume', _error));
    }
  }

  /**
   * Generates workout frequency analysis over a date range.
   * @param profileId The profile ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Result containing frequency analysis data or an error
   */
  async getFrequencyAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<FrequencyAnalysisData, ApplicationError>> {
    try {
      this.logger.info('Analyzing workout frequency', { profileId, startDate, endDate });

      const workoutLogs = await this.workoutLogRepository.findByProfileAndDateRange(
        profileId,
        startDate,
        endDate
      );

      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalWeeks = totalDays / 7;
      const totalMonths = totalDays / 30.44; // Average days per month

      const workoutsPerWeek = totalWeeks > 0 ? workoutLogs.length / totalWeeks : 0;
      const workoutsPerMonth = totalMonths > 0 ? workoutLogs.length / totalMonths : 0;

      // Calculate consistency score based on workout distribution
      const consistencyScore = this.calculateConsistencyScore(workoutLogs, startDate, endDate);

      const result: FrequencyAnalysisData = {
        workoutsPerWeek: Math.round(workoutsPerWeek * 100) / 100,
        workoutsPerMonth: Math.round(workoutsPerMonth * 100) / 100,
        totalWorkouts: workoutLogs.length,
        consistencyScore,
        timeRange: {
          startDate,
          endDate,
        },
      };

      this.logger.info('Frequency analysis completed', {
        profileId,
        workoutsPerWeek: result.workoutsPerWeek,
        consistencyScore: result.consistencyScore,
      });

      return Result.success(result);
    } catch (_error) {
      this.logger.error('Failed to analyze workout frequency', _error as Error, {
        profileId,
        startDate,
        endDate,
      });
      return Result.failure(new ApplicationError('Failed to analyze workout frequency', _error));
    }
  }

  /**
   * Calculates a consistency score based on workout distribution.
   * @private
   */
  private calculateConsistencyScore(workoutLogs: any[], startDate: Date, endDate: Date): number {
    if (workoutLogs.length === 0) return 0;

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.ceil(totalDays / 7);

    if (totalWeeks === 0) return 0;

    // Group workouts by week
    const weeklyWorkouts = new Array(totalWeeks).fill(0);

    for (const workout of workoutLogs) {
      const workoutDate = new Date(workout.startTime);
      const dayFromStart = Math.floor(
        (workoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weekIndex = Math.floor(dayFromStart / 7);

      if (weekIndex >= 0 && weekIndex < totalWeeks) {
        weeklyWorkouts[weekIndex]++;
      }
    }

    // Calculate consistency as the percentage of weeks with at least one workout
    const activeWeeks = weeklyWorkouts.filter((count) => count > 0).length;
    return Math.round((activeWeeks / totalWeeks) * 100);
  }
}
