import type { Query } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { MaxLog } from '@/app/db/model/MaxLog';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogService } from '@/features/max-log/services/MaxLogService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { type MaxLogData } from '@/shared/types';

/**
 * Query service that acts as an adapter between the Max Log Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the MaxLogService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all max log-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class MaxLogQueryService {
  constructor(@inject(MaxLogService) private readonly maxLogService: MaxLogService) {}

  /**
   * Creates a new max log entry for tracking a personal record.
   * @param maxLogData The max log data to create (without id, createdAt, updatedAt, estimated1RM, maxBrzycki, maxBaechle)
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created MaxLogModel
   */
  async createMaxLog(
    maxLogData: Omit<
      MaxLogData,
      'id' | 'createdAt' | 'updatedAt' | 'estimated1RM' | 'maxBrzycki' | 'maxBaechle'
    >
  ): Promise<MaxLogModel> {
    const result = await this.maxLogService.createMaxLog(maxLogData);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves a max log by its ID.
   * @param maxLogId The max log ID to retrieve
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the MaxLogModel
   */
  async getMaxLog(maxLogId: string): Promise<MaxLogModel> {
    const result = await this.maxLogService.getMaxLog(maxLogId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves all max logs for a specific profile.
   * @param profileId The profile ID
   * @throws {ApplicationError} When the operation fails
   * @returns Query for MaxLog models for reactive observation
   */
  getAllMaxLogs(profileId: string): Query<MaxLog> {
    const collection = database.get<MaxLog>('max_logs');
    return collection.query(Q.where('profile_id', profileId));
  }

  /**
   * Retrieves the latest max log for each exercise for a profile.
   * @param profileId The profile ID
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to a Map of exercise IDs to their latest MaxLogModel
   */
  async getLatestMaxLogsByExercise(profileId: string): Promise<Map<string, MaxLogModel>> {
    const result = await this.maxLogService.getLatestMaxLogsByExercise(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Updates an existing max log entry.
   * @param maxLogId The max log ID to update
   * @param updates The updates to apply to the max log
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated MaxLogModel
   */
  async updateMaxLog(
    maxLogId: string,
    updates: Partial<{ weight: number; reps: number; notes: string; date: Date }>
  ): Promise<MaxLogModel> {
    const result = await this.maxLogService.updateMaxLog(maxLogId, updates);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Compares performance between two max log entries.
   * @param maxLogId1 The first max log ID
   * @param maxLogId2 The second max log ID
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to performance comparison metrics
   */
  async compareMaxLogPerformance(
    maxLogId1: string,
    maxLogId2: string
  ): Promise<{ differenceKg: number; percentageImprovement: number }> {
    const result = await this.maxLogService.compareMaxLogPerformance(maxLogId1, maxLogId2);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Calculates the lift-to-bodyweight ratio for a max log.
   * @param maxLogId The max log ID
   * @param bodyweightKg The user's bodyweight in kilograms
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the bodyweight ratio
   */
  async calculateBodyweightRatio(maxLogId: string, bodyweightKg: number): Promise<number> {
    const result = await this.maxLogService.calculateBodyweightRatio(maxLogId, bodyweightKg);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves max logs that are older than a specific date.
   * @param profileId The profile ID
   * @param date The cutoff date
   * @throws {ApplicationError} When the operation fails
   * @returns Query for MaxLog models for reactive observation
   */
  getMaxLogsOlderThan(profileId: string, date: Date): Query<MaxLog> {
    const dateTime = date.getTime();
    if (isNaN(dateTime)) {
      throw new ApplicationError('Invalid date provided');
    }

    const collection = database.get<MaxLog>('max_logs');
    return collection.query(Q.where('profile_id', profileId), Q.where('date', Q.lt(dateTime)));
  }

  /**
   * Retrieves max logs within a specific date range.
   * @param profileId The profile ID
   * @param fromDate The start date of the range
   * @param toDate The end date of the range
   * @throws {ApplicationError} When the operation fails
   * @returns Query for MaxLog models for reactive observation
   */
  getMaxLogsInDateRange(profileId: string, fromDate: Date, toDate: Date): Query<MaxLog> {
    const fromTime = fromDate.getTime();
    const toTime = toDate.getTime();

    if (isNaN(fromTime) || isNaN(toTime)) {
      throw new ApplicationError('Invalid date provided');
    }

    const collection = database.get<MaxLog>('max_logs');
    return collection.query(
      Q.where('profile_id', profileId),
      Q.where('date', Q.gte(fromTime)),
      Q.where('date', Q.lte(toTime))
    );
  }

  /**
   * Retrieves max logs for specific exercises within a date range.
   * @param profileId The profile ID
   * @param exerciseIds Array of exercise IDs to filter by
   * @param dateRange The date range to filter by
   * @throws {ApplicationError} When the operation fails
   * @returns Query for MaxLog models for reactive observation
   */
  getMaxLogsByExercisesInDateRange(
    profileId: string,
    exerciseIds: string[],
    dateRange: { from: Date; to: Date }
  ): Query<MaxLog> {
    const fromTime = dateRange.from.getTime();
    const toTime = dateRange.to.getTime();

    if (isNaN(fromTime) || isNaN(toTime)) {
      throw new ApplicationError('Invalid date provided');
    }

    const collection = database.get<MaxLog>('max_logs');
    return collection.query(
      Q.where('profile_id', profileId),
      Q.where('exercise_id', Q.oneOf(exerciseIds)),
      Q.where('date', Q.gte(fromTime)),
      Q.where('date', Q.lte(toTime))
    );
  }

  /**
   * Generates a summary string for a max log.
   * @param maxLogId The max log ID
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the summary string
   */
  async getMaxLogSummary(maxLogId: string): Promise<string> {
    const result = await this.maxLogService.getMaxLogSummary(maxLogId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Permanently deletes a max log from the system.
   * @param maxLogId The max log ID to delete
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteMaxLog(maxLogId: string): Promise<void> {
    const result = await this.maxLogService.deleteMaxLog(maxLogId);
    if (result.isFailure) {
      throw result.error;
    }
  }
}
