import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { HeightRecordModel } from '@/features/body-metrics/domain/HeightRecordModel';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { WeightRecordModel } from '@/features/body-metrics/domain/WeightRecordModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating body metrics operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to weight and height tracking.
 */
@injectable()
export class BodyMetricsService {
  constructor(
    @inject('IBodyMetricsRepository')
    private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Adds a new weight record for a user profile.
   * @param profileId The profile ID to associate the weight record with
   * @param weight The weight value in kilograms
   * @param date The date of the measurement
   * @param notes Optional notes about the measurement
   * @returns A Result containing the created WeightRecordModel or an error
   */
  async addWeightRecord(
    profileId: string,
    weight: number,
    date: Date,
    notes?: string
  ): Promise<Result<WeightRecordModel, ApplicationError>> {
    try {
      this.logger.info('Adding weight record', { profileId, weight, date: date.toISOString() });

      const weightRecordData = {
        id: crypto.randomUUID(),
        profileId,
        weight,
        date,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const weightRecord = WeightRecordModel.hydrate(weightRecordData);
      const validation = weightRecord.validate();

      if (!validation.success) {
        this.logger.error('Weight record validation failed', undefined, {
          profileId,
          weight,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Weight record validation failed', validation.error.errors)
        );
      }

      const savedRecord = await this.bodyMetricsRepository.saveWeight(weightRecord);

      this.logger.info('Weight record added successfully', {
        recordId: savedRecord.id,
        profileId: savedRecord.profileId,
        weight: savedRecord.weight,
      });

      return Result.success(savedRecord);
    } catch (_error) {
      this.logger.error('Failed to add weight record', _error as Error, {
        profileId,
        weight,
        date: date.toISOString(),
      });
      return Result.failure(new ApplicationError('Failed to add weight record', _error));
    }
  }

  /**
   * Adds a new height record for a user profile.
   * @param profileId The profile ID to associate the height record with
   * @param height The height value in centimeters
   * @param date The date of the measurement
   * @param notes Optional notes about the measurement
   * @returns A Result containing the created HeightRecordModel or an error
   */
  async addHeightRecord(
    profileId: string,
    height: number,
    date: Date,
    notes?: string
  ): Promise<Result<HeightRecordModel, ApplicationError>> {
    try {
      this.logger.info('Adding height record', { profileId, height, date: date.toISOString() });

      const heightRecordData = {
        id: crypto.randomUUID(),
        profileId,
        height,
        date,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const heightRecord = HeightRecordModel.hydrate(heightRecordData);
      const validation = heightRecord.validate();

      if (!validation.success) {
        this.logger.error('Height record validation failed', undefined, {
          profileId,
          height,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Height record validation failed', validation.error.errors)
        );
      }

      const savedRecord = await this.bodyMetricsRepository.saveHeight(heightRecord);

      this.logger.info('Height record added successfully', {
        recordId: savedRecord.id,
        profileId: savedRecord.profileId,
        height: savedRecord.height,
      });

      return Result.success(savedRecord);
    } catch (_error) {
      this.logger.error('Failed to add height record', _error as Error, {
        profileId,
        height,
        date: date.toISOString(),
      });
      return Result.failure(new ApplicationError('Failed to add height record', _error));
    }
  }

  /**
   * Retrieves the weight history for a specific profile.
   * @param profileId The profile ID to retrieve weight history for
   * @returns A Result containing an array of WeightRecordModels or an error
   */
  async getWeightHistory(
    profileId: string
  ): Promise<Result<WeightRecordModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving weight history', { profileId });

      const weightHistory = await this.bodyMetricsRepository.findWeightHistory(profileId);

      this.logger.info('Weight history retrieved successfully', {
        profileId,
        recordCount: weightHistory.length,
      });

      return Result.success(weightHistory);
    } catch (_error) {
      this.logger.error('Failed to retrieve weight history', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve weight history', _error));
    }
  }

  /**
   * Retrieves the height history for a specific profile.
   * @param profileId The profile ID to retrieve height history for
   * @returns A Result containing an array of HeightRecordModels or an error
   */
  async getHeightHistory(
    profileId: string
  ): Promise<Result<HeightRecordModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving height history', { profileId });

      const heightHistory = await this.bodyMetricsRepository.findHeightHistory(profileId);

      this.logger.info('Height history retrieved successfully', {
        profileId,
        recordCount: heightHistory.length,
      });

      return Result.success(heightHistory);
    } catch (_error) {
      this.logger.error('Failed to retrieve height history', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve height history', _error));
    }
  }

  /**
   * Retrieves the latest weight record for a specific profile.
   * @param profileId The profile ID to retrieve the latest weight for
   * @returns A Result containing the latest WeightRecordModel or an error
   */
  async getLatestWeight(
    profileId: string
  ): Promise<Result<WeightRecordModel | undefined, ApplicationError>> {
    try {
      this.logger.info('Retrieving latest weight', { profileId });

      const latestWeight = await this.bodyMetricsRepository.findLatestWeight(profileId);

      if (latestWeight) {
        this.logger.info('Latest weight retrieved successfully', {
          profileId,
          recordId: latestWeight.id,
          weight: latestWeight.weight,
        });
      } else {
        this.logger.info('No weight records found for profile', { profileId });
      }

      return Result.success(latestWeight);
    } catch (_error) {
      this.logger.error('Failed to retrieve latest weight', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve latest weight', _error));
    }
  }

  /**
   * Updates an existing weight record.
   * @param recordId The weight record ID to update
   * @param newWeight The new weight value in kilograms
   * @param newNotes Optional new notes for the record
   * @returns A Result containing the updated WeightRecordModel or an error
   */
  async updateWeightRecord(
    recordId: string,
    newWeight?: number,
    newNotes?: string
  ): Promise<Result<WeightRecordModel, ApplicationError>> {
    try {
      this.logger.info('Updating weight record', { recordId, newWeight, newNotes });

      const existingRecord = await this.bodyMetricsRepository.findWeightById(recordId);

      if (!existingRecord) {
        this.logger.warn('Weight record not found for update', { recordId });
        return Result.failure(new NotFoundError('Weight record not found'));
      }

      // Apply updates using domain methods
      let updatedRecord = existingRecord;
      if (newWeight !== undefined) {
        updatedRecord = updatedRecord.cloneWithNewWeight(newWeight);
      }
      if (newNotes !== undefined) {
        updatedRecord = updatedRecord.cloneWithNewNotes(newNotes);
      }

      const validation = updatedRecord.validate();
      if (!validation.success) {
        this.logger.error('Updated weight record validation failed', undefined, {
          recordId,
          newWeight,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Weight record validation failed', validation.error.errors)
        );
      }

      const savedRecord = await this.bodyMetricsRepository.saveWeight(updatedRecord);

      this.logger.info('Weight record updated successfully', {
        recordId: savedRecord.id,
        weight: savedRecord.weight,
      });

      return Result.success(savedRecord);
    } catch (_error) {
      this.logger.error('Failed to update weight record', _error as Error, {
        recordId,
        newWeight,
      });
      return Result.failure(new ApplicationError('Failed to update weight record', _error));
    }
  }

  /**
   * Deletes a weight record permanently.
   * @param recordId The weight record ID to delete
   * @returns A Result indicating success or failure
   */
  async deleteWeightRecord(recordId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting weight record', { recordId });

      await this.bodyMetricsRepository.deleteWeight(recordId);

      this.logger.info('Weight record deleted successfully', { recordId });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete weight record', _error as Error, { recordId });
      return Result.failure(new ApplicationError('Failed to delete weight record', _error));
    }
  }

  /**
   * Deletes a height record permanently.
   * @param recordId The height record ID to delete
   * @returns A Result indicating success or failure
   */
  async deleteHeightRecord(recordId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting height record', { recordId });

      await this.bodyMetricsRepository.deleteHeight(recordId);

      this.logger.info('Height record deleted successfully', { recordId });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete height record', _error as Error, { recordId });
      return Result.failure(new ApplicationError('Failed to delete height record', _error));
    }
  }
}
