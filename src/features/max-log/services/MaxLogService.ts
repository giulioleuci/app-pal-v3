import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { type MaxLogData } from '@/shared/types';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating max log operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to personal record tracking and 1-Rep Max calculations.
 */
@injectable()
export class MaxLogService {
  constructor(
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Creates a new max log entry for tracking a personal record.
   * @param maxLogData The max log data to create
   * @returns A Result containing the created MaxLogModel or an error
   */
  async createMaxLog(
    maxLogData: Omit<
      MaxLogData,
      'id' | 'createdAt' | 'updatedAt' | 'estimated1RM' | 'maxBrzycki' | 'maxBaechle'
    >
  ): Promise<Result<MaxLogModel, ApplicationError>> {
    try {
      this.logger.info('Creating new max log entry', {
        profileId: maxLogData.profileId,
        exerciseId: maxLogData.exerciseId,
        weight: maxLogData.weightEnteredByUser,
        reps: maxLogData.reps,
        date: maxLogData.date,
      });

      // Create the domain model first, which will calculate the 1RM values
      const tempMaxLogData: MaxLogData = {
        ...maxLogData,
        id: crypto.randomUUID(),
        estimated1RM: 1, // Temporary positive value for schema validation
        maxBrzycki: 1, // Temporary positive value for schema validation
        maxBaechle: 1, // Temporary positive value for schema validation
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const maxLog = MaxLogModel.hydrate(tempMaxLogData);
      const validation = maxLog.validate();

      if (!validation.success) {
        this.logger.error('Max log validation failed', undefined, {
          profileId: maxLogData.profileId,
          exerciseId: maxLogData.exerciseId,
          weight: maxLogData.weightEnteredByUser,
          reps: maxLogData.reps,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Max log validation failed', validation.error.errors)
        );
      }

      const savedMaxLog = await this.maxLogRepository.save(maxLog);

      this.logger.info('Max log created successfully', {
        maxLogId: savedMaxLog.id,
        profileId: savedMaxLog.profileId,
        exerciseId: savedMaxLog.exerciseId,
        estimated1RM: savedMaxLog.estimated1RM,
        isDirect1RM: savedMaxLog.isDirect1RM(),
      });

      return Result.success(savedMaxLog);
    } catch (_error) {
      this.logger.error('Failed to create max log', _error as Error, {
        profileId: maxLogData.profileId,
        exerciseId: maxLogData.exerciseId,
        weight: maxLogData.weightEnteredByUser,
        reps: maxLogData.reps,
      });
      return Result.failure(new ApplicationError('Failed to create max log', _error));
    }
  }

  /**
   * Retrieves a max log by its ID.
   * @param maxLogId The max log ID to search for
   * @returns A Result containing the MaxLogModel or an error
   */
  async getMaxLog(maxLogId: string): Promise<Result<MaxLogModel, ApplicationError>> {
    try {
      this.logger.info('Retrieving max log', { maxLogId });

      const maxLog = await this.maxLogRepository.findById(maxLogId);
      if (!maxLog) {
        this.logger.warn('Max log not found', { maxLogId });
        return Result.failure(new NotFoundError('Max log not found'));
      }

      this.logger.info('Max log retrieved successfully', { maxLogId });
      return Result.success(maxLog);
    } catch (_error) {
      this.logger.error('Failed to retrieve max log', _error as Error, { maxLogId });
      return Result.failure(new ApplicationError('Failed to retrieve max log', _error));
    }
  }

  /**
   * Retrieves all max logs for a specific profile.
   * @param profileId The profile ID
   * @returns A Result containing an array of MaxLogModels or an error
   */
  async getAllMaxLogs(profileId: string): Promise<Result<MaxLogModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving all max logs for profile', { profileId });

      const maxLogs = await this.maxLogRepository.findAll(profileId);

      this.logger.info('All max logs retrieved successfully', {
        profileId,
        count: maxLogs.length,
      });

      return Result.success(maxLogs);
    } catch (_error) {
      this.logger.error('Failed to retrieve all max logs', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve all max logs', _error));
    }
  }

  /**
   * Retrieves the latest max log for each exercise for a profile.
   * @param profileId The profile ID
   * @returns A Result containing a Map of exercise IDs to their latest MaxLogModel or an error
   */
  async getLatestMaxLogsByExercise(
    profileId: string
  ): Promise<Result<Map<string, MaxLogModel>, ApplicationError>> {
    try {
      this.logger.info('Retrieving latest max logs by exercise for profile', { profileId });

      const latestMaxLogs = await this.maxLogRepository.findLatestByExercise(profileId);

      this.logger.info('Latest max logs by exercise retrieved successfully', {
        profileId,
        exerciseCount: latestMaxLogs.size,
      });

      return Result.success(latestMaxLogs);
    } catch (_error) {
      this.logger.error('Failed to retrieve latest max logs by exercise', _error as Error, {
        profileId,
      });
      return Result.failure(
        new ApplicationError('Failed to retrieve latest max logs by exercise', _error)
      );
    }
  }

  /**
   * Updates an existing max log entry.
   * @param maxLogId The max log ID to update
   * @param updates The updates to apply to the max log
   * @returns A Result containing the updated MaxLogModel or an error
   */
  async updateMaxLog(
    maxLogId: string,
    updates: Partial<{ weight: number; reps: number; notes: string; date: Date }>
  ): Promise<Result<MaxLogModel, ApplicationError>> {
    try {
      this.logger.info('Updating max log', { maxLogId, updates });

      const maxLog = await this.maxLogRepository.findById(maxLogId);
      if (!maxLog) {
        this.logger.warn('Max log not found for update', { maxLogId });
        return Result.failure(new NotFoundError('Max log not found'));
      }

      const updatedMaxLog = maxLog.cloneWithUpdatedDetails(updates);
      const validation = updatedMaxLog.validate();

      if (!validation.success) {
        this.logger.error('Updated max log validation failed', undefined, {
          maxLogId,
          updates,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Max log validation failed', validation.error.errors)
        );
      }

      const savedMaxLog = await this.maxLogRepository.save(updatedMaxLog);

      this.logger.info('Max log updated successfully', {
        maxLogId: savedMaxLog.id,
        estimated1RM: savedMaxLog.estimated1RM,
        isDirect1RM: savedMaxLog.isDirect1RM(),
      });

      return Result.success(savedMaxLog);
    } catch (_error) {
      this.logger.error('Failed to update max log', _error as Error, {
        maxLogId,
        updates,
      });
      return Result.failure(new ApplicationError('Failed to update max log', _error));
    }
  }

  /**
   * Compares performance between two max log entries.
   * @param maxLogId1 The first max log ID
   * @param maxLogId2 The second max log ID
   * @returns A Result containing performance comparison metrics or an error
   */
  async compareMaxLogPerformance(
    maxLogId1: string,
    maxLogId2: string
  ): Promise<Result<{ differenceKg: number; percentageImprovement: number }, ApplicationError>> {
    try {
      this.logger.info('Comparing max log performance', { maxLogId1, maxLogId2 });

      const [maxLog1, maxLog2] = await Promise.all([
        this.maxLogRepository.findById(maxLogId1),
        this.maxLogRepository.findById(maxLogId2),
      ]);

      if (!maxLog1) {
        this.logger.warn('First max log not found', { maxLogId1 });
        return Result.failure(new NotFoundError('First max log not found'));
      }

      if (!maxLog2) {
        this.logger.warn('Second max log not found', { maxLogId2 });
        return Result.failure(new NotFoundError('Second max log not found'));
      }

      const comparison = maxLog1.comparePerformance(maxLog2);

      this.logger.info('Max log performance comparison completed', {
        maxLogId1,
        maxLogId2,
        differenceKg: comparison.differenceKg,
        percentageImprovement: comparison.percentageImprovement,
      });

      return Result.success(comparison);
    } catch (_error) {
      this.logger.error('Failed to compare max log performance', _error as Error, {
        maxLogId1,
        maxLogId2,
      });
      return Result.failure(new ApplicationError('Failed to compare max log performance', _error));
    }
  }

  /**
   * Calculates the lift-to-bodyweight ratio for a max log.
   * @param maxLogId The max log ID
   * @param bodyweightKg The user's bodyweight in kilograms
   * @returns A Result containing the bodyweight ratio or an error
   */
  async calculateBodyweightRatio(
    maxLogId: string,
    bodyweightKg: number
  ): Promise<Result<number, ApplicationError>> {
    try {
      this.logger.info('Calculating bodyweight ratio for max log', { maxLogId, bodyweightKg });

      if (bodyweightKg <= 0) {
        this.logger.warn('Invalid bodyweight provided', { maxLogId, bodyweightKg });
        return Result.failure(new ApplicationError('Bodyweight must be greater than zero'));
      }

      const maxLog = await this.maxLogRepository.findById(maxLogId);
      if (!maxLog) {
        this.logger.warn('Max log not found for bodyweight ratio calculation', { maxLogId });
        return Result.failure(new NotFoundError('Max log not found'));
      }

      const ratio = maxLog.calculateBodyweightRatio(bodyweightKg);

      this.logger.info('Bodyweight ratio calculated successfully', {
        maxLogId,
        bodyweightKg,
        ratio,
        estimated1RM: maxLog.estimated1RM,
      });

      return Result.success(ratio);
    } catch (_error) {
      this.logger.error('Failed to calculate bodyweight ratio', _error as Error, {
        maxLogId,
        bodyweightKg,
      });
      return Result.failure(new ApplicationError('Failed to calculate bodyweight ratio', _error));
    }
  }

  /**
   * Retrieves max logs that are older than a specific date.
   * @param profileId The profile ID
   * @param date The cutoff date
   * @returns A Result containing an array of older MaxLogModels or an error
   */
  async getMaxLogsOlderThan(
    profileId: string,
    date: Date
  ): Promise<Result<MaxLogModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving max logs older than date', { profileId, date });

      const allMaxLogs = await this.maxLogRepository.findAll(profileId);
      const olderMaxLogs = allMaxLogs.filter((maxLog) => maxLog.isOlderThan(date));

      this.logger.info('Max logs older than date retrieved successfully', {
        profileId,
        date,
        totalCount: allMaxLogs.length,
        olderCount: olderMaxLogs.length,
      });

      return Result.success(olderMaxLogs);
    } catch (_error) {
      this.logger.error('Failed to retrieve max logs older than date', _error as Error, {
        profileId,
        date,
      });
      return Result.failure(
        new ApplicationError('Failed to retrieve max logs older than date', _error)
      );
    }
  }

  /**
   * Generates a summary string for a max log.
   * @param maxLogId The max log ID
   * @returns A Result containing the summary string or an error
   */
  async getMaxLogSummary(maxLogId: string): Promise<Result<string, ApplicationError>> {
    try {
      this.logger.info('Generating max log summary', { maxLogId });

      const maxLog = await this.maxLogRepository.findById(maxLogId);
      if (!maxLog) {
        this.logger.warn('Max log not found for summary generation', { maxLogId });
        return Result.failure(new NotFoundError('Max log not found'));
      }

      const summary = maxLog.getSummaryString();

      this.logger.info('Max log summary generated successfully', { maxLogId, summary });
      return Result.success(summary);
    } catch (_error) {
      this.logger.error('Failed to generate max log summary', _error as Error, { maxLogId });
      return Result.failure(new ApplicationError('Failed to generate max log summary', _error));
    }
  }

  /**
   * Permanently deletes a max log from the system.
   * @param maxLogId The max log ID to delete
   * @returns A Result indicating success or failure
   */
  async deleteMaxLog(maxLogId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting max log permanently', { maxLogId });

      const maxLog = await this.maxLogRepository.findById(maxLogId);
      if (!maxLog) {
        this.logger.warn('Max log not found for deletion', { maxLogId });
        return Result.failure(new NotFoundError('Max log not found'));
      }

      await this.maxLogRepository.delete(maxLogId);

      this.logger.info('Max log deleted successfully', { maxLogId });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete max log', _error as Error, { maxLogId });
      return Result.failure(new ApplicationError('Failed to delete max log', _error));
    }
  }
}
