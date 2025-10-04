import { Database, Q } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { HeightRecord } from '@/app/db/model/HeightRecord';
import { WeightRecord } from '@/app/db/model/WeightRecord';
import { HeightRecordData, WeightRecordData } from '@/shared/types';

import { HeightRecordModel } from '../domain/HeightRecordModel';
import { IBodyMetricsRepository } from '../domain/IBodyMetricsRepository';
import { WeightRecordModel } from '../domain/WeightRecordModel';

/**
 * Concrete implementation of IBodyMetricsRepository using WatermelonDB.
 * Handles persistence and retrieval of WeightRecord and HeightRecord domain models
 * by delegating hydration to the models' static hydrate methods and dehydration to toPlainObject.
 */
@injectable()
export class BodyMetricsRepository implements IBodyMetricsRepository {
  private readonly database: Database;

  /**
   * Creates a new BodyMetricsRepository instance.
   * @param database Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists a WeightRecordModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param record The WeightRecordModel instance to save
   * @returns Promise resolving to the saved WeightRecordModel
   */
  async saveWeight(record: WeightRecordModel): Promise<WeightRecordModel> {
    const plainData = record.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<WeightRecord>('weight_records');

      // Try to find existing record
      try {
        const existing = await collection.find(record.id);
        await existing.update((rec) => {
          rec._raw.profile_id = plainData.profileId;
          rec._raw.date = plainData.date.getTime();
          rec._raw.weight = plainData.weight;
          rec._raw.notes = plainData.notes;
          rec._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((rec) => {
          rec._raw.id = plainData.id;
          rec._raw.profile_id = plainData.profileId;
          rec._raw.date = plainData.date.getTime();
          rec._raw.weight = plainData.weight;
          rec._raw.notes = plainData.notes;
          rec._raw.created_at = plainData.createdAt.getTime();
          rec._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return record;
  }

  /**
   * Persists a HeightRecordModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param record The HeightRecordModel instance to save
   * @returns Promise resolving to the saved HeightRecordModel
   */
  async saveHeight(record: HeightRecordModel): Promise<HeightRecordModel> {
    const plainData = record.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<HeightRecord>('height_records');

      // Try to find existing record
      try {
        const existing = await collection.find(record.id);
        await existing.update((rec) => {
          rec._raw.profile_id = plainData.profileId;
          rec._raw.date = plainData.date.getTime();
          rec._raw.height = plainData.height;
          rec._raw.notes = plainData.notes;
          rec._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((rec) => {
          rec._raw.id = plainData.id;
          rec._raw.profile_id = plainData.profileId;
          rec._raw.date = plainData.date.getTime();
          rec._raw.height = plainData.height;
          rec._raw.notes = plainData.notes;
          rec._raw.created_at = plainData.createdAt.getTime();
          rec._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return record;
  }

  /**
   * Retrieves all weight records for a given profile ID and hydrates them into WeightRecordModel instances
   * using the model's static hydrate method, ordered by date descending.
   * @param profileId The profile ID to find weight records for
   * @returns Promise resolving to an array of WeightRecordModel instances
   */
  async findWeightHistory(profileId: string): Promise<WeightRecordModel[]> {
    const collection = this.database.get<WeightRecord>('weight_records');
    const records = await collection
      .query(Q.where('profile_id', profileId), Q.sortBy('date', Q.desc))
      .fetch();

    return records.map((record) => {
      const plainData: WeightRecordData = {
        id: record.id,
        profileId: record._raw.profile_id,
        date: new Date(record._raw.date),
        weight: record._raw.weight,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };
      return WeightRecordModel.hydrate(plainData);
    });
  }

  /**
   * Retrieves all height records for a given profile ID and hydrates them into HeightRecordModel instances
   * using the model's static hydrate method, ordered by date descending.
   * @param profileId The profile ID to find height records for
   * @returns Promise resolving to an array of HeightRecordModel instances
   */
  async findHeightHistory(profileId: string): Promise<HeightRecordModel[]> {
    const collection = this.database.get<HeightRecord>('height_records');
    const records = await collection
      .query(Q.where('profile_id', profileId), Q.sortBy('date', Q.desc))
      .fetch();

    return records.map((record) => {
      const plainData: HeightRecordData = {
        id: record.id,
        profileId: record._raw.profile_id,
        date: new Date(record._raw.date),
        height: record._raw.height,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };
      return HeightRecordModel.hydrate(plainData);
    });
  }

  /**
   * Retrieves the most recent weight record for a given profile ID and hydrates it
   * into a WeightRecordModel using the model's static hydrate method.
   * @param profileId The profile ID to find the latest weight record for
   * @returns Promise resolving to the latest WeightRecordModel if found, undefined otherwise
   */
  async findLatestWeight(profileId: string): Promise<WeightRecordModel | undefined> {
    const collection = this.database.get<WeightRecord>('weight_records');
    const records = await collection
      .query(Q.where('profile_id', profileId), Q.sortBy('date', Q.desc), Q.take(1))
      .fetch();

    if (records.length === 0) {
      return undefined;
    }

    const record = records[0];
    const plainData: WeightRecordData = {
      id: record.id,
      profileId: record._raw.profile_id,
      date: new Date(record._raw.date),
      weight: record._raw.weight,
      notes: record._raw.notes,
      createdAt: new Date(record._raw.created_at),
      updatedAt: new Date(record._raw.updated_at),
    };

    return WeightRecordModel.hydrate(plainData);
  }

  /**
   * Retrieves a weight record by its ID and hydrates it into a WeightRecordModel instance.
   * @param recordId The ID of the weight record to find
   * @returns Promise resolving to the WeightRecordModel if found, undefined otherwise
   */
  async findWeightById(recordId: string): Promise<WeightRecordModel | undefined> {
    try {
      const collection = this.database.get<WeightRecord>('weight_records');
      const record = await collection.find(recordId);

      const plainData: WeightRecordData = {
        id: record.id,
        profileId: record._raw.profile_id,
        date: new Date(record._raw.date),
        weight: record._raw.weight,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return WeightRecordModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Retrieves a height record by its ID and hydrates it into a HeightRecordModel instance.
   * @param recordId The ID of the height record to find
   * @returns Promise resolving to the HeightRecordModel if found, undefined otherwise
   */
  async findHeightById(recordId: string): Promise<HeightRecordModel | undefined> {
    try {
      const collection = this.database.get<HeightRecord>('height_records');
      const record = await collection.find(recordId);

      const plainData: HeightRecordData = {
        id: record.id,
        profileId: record._raw.profile_id,
        date: new Date(record._raw.date),
        height: record._raw.height,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return HeightRecordModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Deletes a weight record by ID from the database.
   * @param id The ID of the weight record to delete
   * @returns Promise that resolves when the deletion is complete
   */
  async deleteWeight(id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<WeightRecord>('weight_records');
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Weight record doesn't exist, which is fine for delete operation
      }
    });
  }

  /**
   * Deletes a height record by ID from the database.
   * @param id The ID of the height record to delete
   * @returns Promise that resolves when the deletion is complete
   */
  async deleteHeight(id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<HeightRecord>('height_records');
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Height record doesn't exist, which is fine for delete operation
      }
    });
  }
}
