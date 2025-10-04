import type { Query } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { HeightRecord } from '@/app/db/model/HeightRecord';
import { WeightRecord } from '@/app/db/model/WeightRecord';
import { HeightRecordModel } from '@/features/body-metrics/domain/HeightRecordModel';
import { WeightRecordModel } from '@/features/body-metrics/domain/WeightRecordModel';
import { BodyMetricsService } from '@/features/body-metrics/services/BodyMetricsService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Query service that acts as an adapter between the Body Metrics Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the BodyMetricsService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all body metrics-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class BodyMetricsQueryService {
  constructor(
    @inject(BodyMetricsService) private readonly bodyMetricsService: BodyMetricsService
  ) {}

  /**
   * Adds a new weight record for a user profile.
   * @param profileId The profile ID to associate the weight record with
   * @param weight The weight value in kilograms
   * @param date The date of the measurement
   * @param notes Optional notes about the measurement
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created WeightRecordModel
   */
  async addWeightRecord(
    profileId: string,
    weight: number,
    date: Date,
    notes?: string
  ): Promise<WeightRecordModel> {
    const result = await this.bodyMetricsService.addWeightRecord(profileId, weight, date, notes);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Adds a new height record for a user profile.
   * @param profileId The profile ID to associate the height record with
   * @param height The height value in centimeters
   * @param date The date of the measurement
   * @param notes Optional notes about the measurement
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created HeightRecordModel
   */
  async addHeightRecord(
    profileId: string,
    height: number,
    date: Date,
    notes?: string
  ): Promise<HeightRecordModel> {
    const result = await this.bodyMetricsService.addHeightRecord(profileId, height, date, notes);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves the weight history for a specific profile.
   * @param profileId The profile ID to retrieve weight history for
   * @throws {ApplicationError} When the operation fails
   * @returns Query for WeightRecord models for reactive observation
   */
  getWeightHistory(profileId: string): Query<WeightRecord> {
    const collection = database.get<WeightRecord>('weight_records');
    return collection.query(
      Q.where('profile_id', profileId)
      // Note: Sorting should be handled by the component using .observe() and client-side sorting
      // WatermelonDB queries don't support ORDER BY in the same way as SQL
    );
  }

  /**
   * Retrieves the height history for a specific profile.
   * @param profileId The profile ID to retrieve height history for
   * @throws {ApplicationError} When the operation fails
   * @returns Query for HeightRecord models for reactive observation
   */
  getHeightHistory(profileId: string): Query<HeightRecord> {
    const collection = database.get<HeightRecord>('height_records');
    return collection.query(
      Q.where('profile_id', profileId)
      // Note: Sorting should be handled by the component using .observe() and client-side sorting
      // WatermelonDB queries don't support ORDER BY in the same way as SQL
    );
  }

  /**
   * Retrieves the latest weight record for a specific profile.
   * @param profileId The profile ID to retrieve the latest weight for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the latest WeightRecordModel or undefined
   */
  async getLatestWeight(profileId: string): Promise<WeightRecordModel | undefined> {
    const result = await this.bodyMetricsService.getLatestWeight(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Gets a WatermelonDB query for the latest weight record of a specific profile.
   * @param profileId The profile ID to observe the latest weight for
   * @returns Query for WeightRecord models for reactive observation (sorted by date descending, limit 1)
   */
  getLatestWeightQuery(profileId: string): Query<WeightRecord> {
    const collection = database.get<WeightRecord>('weight_records');
    return collection.query(Q.where('profile_id', profileId), Q.sortBy('date', Q.desc), Q.take(1));
  }

  /**
   * Updates an existing weight record.
   * @param recordId The weight record ID to update
   * @param newWeight The new weight value in kilograms
   * @param newNotes Optional new notes for the record
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated WeightRecordModel
   */
  async updateWeightRecord(
    recordId: string,
    newWeight?: number,
    newNotes?: string
  ): Promise<WeightRecordModel> {
    const result = await this.bodyMetricsService.updateWeightRecord(recordId, newWeight, newNotes);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Deletes a weight record permanently.
   * @param recordId The weight record ID to delete
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteWeightRecord(recordId: string): Promise<void> {
    const result = await this.bodyMetricsService.deleteWeightRecord(recordId);
    if (result.isFailure) {
      throw result.error;
    }
  }

  /**
   * Deletes a height record permanently.
   * @param recordId The height record ID to delete
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteHeightRecord(recordId: string): Promise<void> {
    const result = await this.bodyMetricsService.deleteHeightRecord(recordId);
    if (result.isFailure) {
      throw result.error;
    }
  }
}
