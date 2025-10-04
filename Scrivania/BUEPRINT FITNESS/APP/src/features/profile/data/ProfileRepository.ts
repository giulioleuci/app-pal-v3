import { Database } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { Profile } from '@/app/db/model/Profile';
import { ProfileData } from '@/shared/types';

import { IProfileRepository } from '../domain/IProfileRepository';
import { ProfileModel } from '../domain/ProfileModel';

/**
 * Concrete implementation of IProfileRepository using WatermelonDB.
 * Handles persistence and retrieval of Profile domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class ProfileRepository implements IProfileRepository {
  private readonly database: Database;

  /**
   * Creates a new ProfileRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists a ProfileModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param profile The ProfileModel instance to save
   * @returns Promise resolving to the saved ProfileModel
   */
  async save(profile: ProfileModel): Promise<ProfileModel> {
    const plainData = profile.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<Profile>('profiles');

      // Try to find existing record
      try {
        const existing = await collection.find(profile.id);
        await existing.update((record) => {
          record._raw.name = plainData.name;
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          record._raw.id = plainData.id;
          record._raw.name = plainData.name;
          record._raw.created_at = plainData.createdAt.getTime();
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return profile;
  }

  /**
   * Retrieves a profile by its ID and hydrates it into a ProfileModel
   * using the model's static hydrate method.
   * @param id The profile ID to find
   * @returns Promise resolving to ProfileModel if found, undefined otherwise
   */
  async findById(id: string): Promise<ProfileModel | undefined> {
    try {
      const collection = this.database.get<Profile>('profiles');
      const record = await collection.find(id);

      const plainData: ProfileData = {
        id: record.id,
        name: record._raw.name,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return ProfileModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Retrieves multiple profiles by their IDs and hydrates them into ProfileModels
   * using the model's static hydrate method.
   * @param ids Array of profile IDs to find
   * @returns Promise resolving to array of ProfileModels
   */
  async findByIds(ids: string[]): Promise<ProfileModel[]> {
    const collection = this.database.get<Profile>('profiles');
    const records = await collection.query().fetch();

    const filteredRecords = records.filter((record) => ids.includes(record.id));

    return filteredRecords.map((record) => {
      const plainData: ProfileData = {
        id: record.id,
        name: record._raw.name,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };
      return ProfileModel.hydrate(plainData);
    });
  }

  /**
   * Retrieves all profiles from the database and hydrates them into ProfileModels
   * using the model's static hydrate method.
   * @returns Promise resolving to array of all ProfileModels
   */
  async findAll(): Promise<ProfileModel[]> {
    const collection = this.database.get<Profile>('profiles');
    const records = await collection.query().fetch();

    return records.map((record) => {
      const plainData: ProfileData = {
        id: record.id,
        name: record._raw.name,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };
      return ProfileModel.hydrate(plainData);
    });
  }

  /**
   * Deletes a profile by its ID from the database.
   * @param id The profile ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<Profile>('profiles');
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Profile doesn't exist, which is fine for delete operation
      }
    });
  }
}
