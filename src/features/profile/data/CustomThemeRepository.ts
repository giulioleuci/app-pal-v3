import { Database, Q } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { CustomTheme } from '@/app/db/model/CustomTheme';
import { CustomThemeData } from '@/shared/types';

import { CustomThemeModel } from '../domain/CustomThemeModel';
import { ICustomThemeRepository } from '../domain/ICustomThemeRepository';

/**
 * Concrete implementation of ICustomThemeRepository using WatermelonDB.
 * Handles persistence and retrieval of CustomTheme domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class CustomThemeRepository implements ICustomThemeRepository {
  private readonly database: Database;

  /**
   * Creates a new CustomThemeRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists a CustomThemeModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param theme The CustomThemeModel instance to save
   * @returns Promise resolving to the saved CustomThemeModel
   */
  async save(theme: CustomThemeModel): Promise<CustomThemeModel> {
    const plainData = theme.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<CustomTheme>('custom_themes');

      // Try to find existing record
      try {
        const existing = await collection.find(theme.id);
        await existing.update((record) => {
          record._raw.profile_id = plainData.profileId;
          record._raw.name = plainData.name;
          record._raw.mode = plainData.mode;
          record._raw.primary_color = plainData.primaryColor;
          record._raw.secondary_color = plainData.secondaryColor;
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          record._raw.id = plainData.id;
          record._raw.profile_id = plainData.profileId;
          record._raw.name = plainData.name;
          record._raw.mode = plainData.mode;
          record._raw.primary_color = plainData.primaryColor;
          record._raw.secondary_color = plainData.secondaryColor;
        });
      }
    });

    return theme;
  }

  /**
   * Retrieves a custom theme by its ID and hydrates it into a CustomThemeModel
   * using the model's static hydrate method.
   * @param id The theme ID to find
   * @returns Promise resolving to CustomThemeModel if found, undefined otherwise
   */
  async findById(id: string): Promise<CustomThemeModel | undefined> {
    try {
      const collection = this.database.get<CustomTheme>('custom_themes');
      const record = await collection.find(id);

      const plainData: CustomThemeData = {
        id: record.id,
        profileId: record._raw.profile_id,
        name: record._raw.name,
        mode: record._raw.mode,
        primaryColor: record._raw.primary_color,
        secondaryColor: record._raw.secondary_color,
      };

      return CustomThemeModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Retrieves all custom themes for a profile ID and hydrates them into CustomThemeModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find themes for
   * @returns Promise resolving to array of CustomThemeModels
   */
  async findByProfileId(profileId: string): Promise<CustomThemeModel[]> {
    const collection = this.database.get<CustomTheme>('custom_themes');
    const records = await collection.query(Q.where('profile_id', profileId)).fetch();

    return records.map((record) => {
      const plainData: CustomThemeData = {
        id: record.id,
        profileId: record._raw.profile_id,
        name: record._raw.name,
        mode: record._raw.mode,
        primaryColor: record._raw.primary_color,
        secondaryColor: record._raw.secondary_color,
      };
      return CustomThemeModel.hydrate(plainData);
    });
  }

  /**
   * Deletes a custom theme by its ID from the database.
   * @param id The theme ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<CustomTheme>('custom_themes');
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Theme doesn't exist, which is fine for delete operation
      }
    });
  }
}
