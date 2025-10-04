import { Database, Q } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { TrainingCycle } from '@/app/db/model/TrainingCycle';
import { TrainingCycleData } from '@/shared/types';

import { ITrainingCycleRepository } from '../domain/ITrainingCycleRepository';
import { TrainingCycleModel } from '../domain/TrainingCycleModel';

/**
 * Concrete implementation of ITrainingCycleRepository using WatermelonDB.
 * Handles persistence and retrieval of TrainingCycle domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class TrainingCycleRepository implements ITrainingCycleRepository {
  private readonly database: Database;

  /**
   * Creates a new TrainingCycleRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists a TrainingCycleModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param cycle The TrainingCycleModel instance to save
   * @returns Promise resolving to the saved TrainingCycleModel
   */
  async save(cycle: TrainingCycleModel): Promise<TrainingCycleModel> {
    const plainData = cycle.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<TrainingCycle>('training_cycles');

      // Try to find existing record
      try {
        const existing = await collection.find(cycle.id);
        await existing.update((record) => {
          record._raw.profile_id = plainData.profileId;
          record._raw.name = plainData.name;
          record._raw.start_date = plainData.startDate.getTime();
          record._raw.end_date = plainData.endDate.getTime();
          record._raw.goal = plainData.goal;
          record._raw.notes = plainData.notes;
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          record._raw.id = plainData.id;
          record._raw.profile_id = plainData.profileId;
          record._raw.name = plainData.name;
          record._raw.start_date = plainData.startDate.getTime();
          record._raw.end_date = plainData.endDate.getTime();
          record._raw.goal = plainData.goal;
          record._raw.notes = plainData.notes;
          record._raw.created_at = plainData.createdAt.getTime();
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return cycle;
  }

  /**
   * Retrieves a training cycle by ID and hydrates it into a TrainingCycleModel
   * using the model's static hydrate method.
   * @param id The training cycle ID to find
   * @returns Promise resolving to TrainingCycleModel if found, undefined otherwise
   */
  async findById(id: string): Promise<TrainingCycleModel | undefined> {
    try {
      const collection = this.database.get<TrainingCycle>('training_cycles');
      const record = await collection.find(id);

      // Check if record is soft-deleted (WatermelonDB behavior: find() returns deleted records)
      if (record._raw._status === 'deleted') {
        return undefined;
      }

      const plainData: TrainingCycleData = {
        id: record.id,
        profileId: record._raw.profile_id,
        name: record._raw.name,
        startDate: new Date(record._raw.start_date),
        endDate: new Date(record._raw.end_date),
        goal: record._raw.goal,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return TrainingCycleModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Retrieves all training cycles for a profile ID and hydrates them into TrainingCycleModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find training cycles for
   * @returns Promise resolving to array of TrainingCycleModels
   */
  async findAll(profileId: string): Promise<TrainingCycleModel[]> {
    const collection = this.database.get<TrainingCycle>('training_cycles');
    const records = await collection.query(Q.where('profile_id', profileId)).fetch();

    return records.map((record) => {
      const plainData: TrainingCycleData = {
        id: record.id,
        profileId: record._raw.profile_id,
        name: record._raw.name,
        startDate: new Date(record._raw.start_date),
        endDate: new Date(record._raw.end_date),
        goal: record._raw.goal,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };
      return TrainingCycleModel.hydrate(plainData);
    });
  }

  /**
   * Deletes a training cycle by ID from the database.
   * @param id The training cycle ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<TrainingCycle>('training_cycles');
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Training cycle doesn't exist, which is fine for delete operation
      }
    });
  }
}
