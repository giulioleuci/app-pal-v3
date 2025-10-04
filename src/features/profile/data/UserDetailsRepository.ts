import { Database, Q } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { UserDetails } from '@/app/db/model/UserDetails';
import { UserDetailsData } from '@/shared/types';

import { IUserDetailsRepository } from '../domain/IUserDetailsRepository';
import { UserDetailsModel } from '../domain/UserDetailsModel';

/**
 * Concrete implementation of IUserDetailsRepository using WatermelonDB.
 * Handles persistence and retrieval of UserDetails domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class UserDetailsRepository implements IUserDetailsRepository {
  private readonly database: Database;

  /**
   * Creates a new UserDetailsRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists a UserDetailsModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param details The UserDetailsModel instance to save
   * @returns Promise resolving to the saved UserDetailsModel
   */
  async save(details: UserDetailsModel): Promise<UserDetailsModel> {
    const plainData = details.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<UserDetails>('user_details');

      // Try to find existing record
      try {
        const existing = await collection.find(details.id);
        await existing.update((record) => {
          record._raw.profile_id = plainData.profileId;
          record._raw.full_name = plainData.fullName;
          record._raw.biological_sex = plainData.biologicalSex;
          record._raw.date_of_birth = plainData.dateOfBirth?.getTime();
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          record._raw.id = plainData.id;
          record._raw.profile_id = plainData.profileId;
          record._raw.full_name = plainData.fullName;
          record._raw.biological_sex = plainData.biologicalSex;
          record._raw.date_of_birth = plainData.dateOfBirth?.getTime();
          record._raw.created_at = plainData.createdAt.getTime();
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return details;
  }

  /**
   * Retrieves user details by profile ID and hydrates it into a UserDetailsModel
   * using the model's static hydrate method.
   * @param profileId The profile ID to find details for
   * @returns Promise resolving to UserDetailsModel if found, undefined otherwise
   */
  async findByProfileId(profileId: string): Promise<UserDetailsModel | undefined> {
    try {
      const collection = this.database.get<UserDetails>('user_details');
      const records = await collection.query(Q.where('profile_id', profileId)).fetch();

      if (records.length === 0) {
        return undefined;
      }

      const record = records[0];
      const plainData: UserDetailsData = {
        id: record.id,
        profileId: record._raw.profile_id,
        fullName: record._raw.full_name,
        biologicalSex: record._raw.biological_sex,
        dateOfBirth: record._raw.date_of_birth ? new Date(record._raw.date_of_birth) : undefined,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return UserDetailsModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }
}
