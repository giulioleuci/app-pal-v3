import { Database, Q } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { MaxLog } from '@/app/db/model/MaxLog';
import { MaxLogData } from '@/shared/types';

import { IMaxLogRepository } from '../domain/IMaxLogRepository';
import { MaxLogModel } from '../domain/MaxLogModel';

/**
 * Concrete implementation of IMaxLogRepository using WatermelonDB.
 * Handles persistence and retrieval of MaxLog domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class MaxLogRepository implements IMaxLogRepository {
  private readonly database: Database;

  /**
   * Creates a new MaxLogRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists a MaxLogModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param log The MaxLogModel instance to save
   * @returns Promise resolving to the saved MaxLogModel
   */
  async save(log: MaxLogModel): Promise<MaxLogModel> {
    const plainData = log.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<MaxLog>('max_logs');

      // Try to find existing record
      try {
        const existing = await collection.find(log.id);
        await existing.update((record) => {
          record._raw.profile_id = plainData.profileId;
          record._raw.exercise_id = plainData.exerciseId;
          record._raw.weight_entered_by_user = plainData.weightEnteredByUser;
          record._raw.date = plainData.date.getTime();
          record._raw.reps = plainData.reps;
          record._raw.notes = plainData.notes;
          record._raw.estimated_1rm = plainData.estimated1RM;
          record._raw.max_brzycki = plainData.maxBrzycki || plainData.estimated1RM;
          record._raw.max_baechle = plainData.maxBaechle || plainData.estimated1RM;
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          // Set all fields including the specific ID we want
          record._raw.id = plainData.id;
          record._raw.profile_id = plainData.profileId;
          record._raw.exercise_id = plainData.exerciseId;
          record._raw.weight_entered_by_user = plainData.weightEnteredByUser;
          record._raw.date = plainData.date.getTime();
          record._raw.reps = plainData.reps;
          record._raw.notes = plainData.notes;
          record._raw.estimated_1rm = plainData.estimated1RM;
          record._raw.max_brzycki = plainData.maxBrzycki || plainData.estimated1RM;
          record._raw.max_baechle = plainData.maxBaechle || plainData.estimated1RM;
          record._raw.created_at = plainData.createdAt.getTime();
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return log;
  }

  /**
   * Retrieves a max log by ID and hydrates it into a MaxLogModel
   * using the model's static hydrate method.
   * @param id The ID of the max log to find
   * @returns Promise resolving to MaxLogModel if found, undefined otherwise
   */
  async findById(id: string): Promise<MaxLogModel | undefined> {
    try {
      const collection = this.database.get<MaxLog>('max_logs');
      const record = await collection.find(id);

      const plainData: MaxLogData = {
        id: record.id,
        profileId: record._raw.profile_id,
        exerciseId: record._raw.exercise_id,
        weightEnteredByUser: record._raw.weight_entered_by_user,
        date: new Date(record._raw.date),
        reps: record._raw.reps,
        notes: record._raw.notes || undefined,
        estimated1RM: record._raw.estimated_1rm,
        maxBrzycki: record._raw.max_brzycki,
        maxBaechle: record._raw.max_baechle,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return MaxLogModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Retrieves all max logs for a given profile ID and hydrates them into MaxLogModel instances
   * using the model's static hydrate method.
   * @param profileId The profile ID to find max logs for
   * @returns Promise resolving to an array of MaxLogModel instances
   */
  async findAll(profileId: string): Promise<MaxLogModel[]> {
    const collection = this.database.get<MaxLog>('max_logs');
    const records = await collection.query(Q.where('profile_id', profileId)).fetch();

    return records.map((record) => {
      const plainData: MaxLogData = {
        id: record.id,
        profileId: record._raw.profile_id,
        exerciseId: record._raw.exercise_id,
        weightEnteredByUser: record._raw.weight_entered_by_user,
        date: new Date(record._raw.date),
        reps: record._raw.reps,
        notes: record._raw.notes || undefined,
        estimated1RM: record._raw.estimated_1rm,
        maxBrzycki: record._raw.max_brzycki,
        maxBaechle: record._raw.max_baechle,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };
      return MaxLogModel.hydrate(plainData);
    });
  }

  /**
   * Retrieves the latest max log for each exercise for a given profile ID.
   * Returns a Map where keys are exercise IDs and values are the most recent MaxLogModel for that exercise.
   * @param profileId The profile ID to find latest max logs for
   * @returns Promise resolving to a Map of exercise ID to latest MaxLogModel
   */
  async findLatestByExercise(profileId: string): Promise<Map<string, MaxLogModel>> {
    const allLogs = await this.findAll(profileId);
    const latestByExercise = new Map<string, MaxLogModel>();

    for (const log of allLogs) {
      const existing = latestByExercise.get(log.exerciseId);
      if (!existing || log.date > existing.date) {
        latestByExercise.set(log.exerciseId, log);
      }
    }

    return latestByExercise;
  }

  /**
   * Deletes a max log by ID from the database.
   * @param id The ID of the max log to delete
   * @returns Promise that resolves when the deletion is complete
   */
  async delete(id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<MaxLog>('max_logs');
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Max log doesn't exist, which is fine for delete operation
      }
    });
  }
}
