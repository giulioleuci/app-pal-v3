import { Database, Q } from '@nozbe/watermelondb';
import { injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { ExerciseTemplate } from '@/app/db/model/ExerciseTemplate';
import { ExerciseTemplateData } from '@/shared/types';

import { ExerciseTemplateModel } from '../domain/ExerciseTemplateModel';
import { IExerciseTemplateRepository } from '../domain/IExerciseTemplateRepository';

/**
 * Concrete implementation of IExerciseTemplateRepository using WatermelonDB.
 * Handles persistence and retrieval of ExerciseTemplate domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class ExerciseTemplateRepository implements IExerciseTemplateRepository {
  private readonly database: Database;

  /**
   * Creates a new ExerciseTemplateRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(db: Database = database) {
    this.database = db;
  }

  /**
   * Persists an ExerciseTemplateModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param template The ExerciseTemplateModel instance to save
   * @returns Promise resolving to the saved ExerciseTemplateModel
   */
  async save(template: ExerciseTemplateModel): Promise<ExerciseTemplateModel> {
    const plainData = template.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<ExerciseTemplate>('exercise_templates');

      // Try to find existing record
      try {
        const existing = await collection.find(template.id);
        await existing.update((record) => {
          record._raw.name = plainData.name;
          record._raw.exercise_id = plainData.exerciseId;
          record._raw.set_configuration = plainData.setConfiguration;
          record._raw.notes = plainData.notes;
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          record._raw.id = plainData.id;
          record._raw.name = plainData.name;
          record._raw.exercise_id = plainData.exerciseId;
          record._raw.set_configuration = plainData.setConfiguration;
          record._raw.notes = plainData.notes;
          record._raw.created_at = plainData.createdAt.getTime();
          record._raw.updated_at = plainData.updatedAt.getTime();
        });
      }
    });

    return template;
  }

  /**
   * Retrieves an exercise template by its ID and hydrates it into an ExerciseTemplateModel
   * using the model's static hydrate method.
   * @param id The template ID to find
   * @returns Promise resolving to ExerciseTemplateModel if found, undefined otherwise
   */
  async findById(id: string): Promise<ExerciseTemplateModel | undefined> {
    try {
      const collection = this.database.get<ExerciseTemplate>('exercise_templates');
      const record = await collection.find(id);

      const plainData: ExerciseTemplateData = {
        id: record.id,
        name: record._raw.name,
        exerciseId: record._raw.exercise_id,
        setConfiguration: record._raw.set_configuration,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };

      return ExerciseTemplateModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Retrieves all exercise templates for a profile ID and hydrates them into ExerciseTemplateModels
   * using the model's static hydrate method.
   * Note: This implementation filters via the exercises relationship to maintain profile isolation.
   * @param profileId The profile ID to find templates for
   * @returns Promise resolving to array of ExerciseTemplateModels
   */
  async findAll(profileId: string): Promise<ExerciseTemplateModel[]> {
    const collection = this.database.get<ExerciseTemplate>('exercise_templates');
    const exerciseCollection = this.database.get('exercises');

    // First, get all exercises for the profile
    const exercises = await exerciseCollection.query(Q.where('profile_id', profileId)).fetch();

    if (exercises.length === 0) {
      return [];
    }

    const exerciseIds = exercises.map((e) => e.id);

    // Then get all templates that reference these exercises
    const records = await collection.query(Q.where('exercise_id', Q.oneOf(exerciseIds))).fetch();

    return records.map((record) => {
      const plainData: ExerciseTemplateData = {
        id: record.id,
        name: record._raw.name,
        exerciseId: record._raw.exercise_id,
        setConfiguration: record._raw.set_configuration,
        notes: record._raw.notes,
        createdAt: new Date(record._raw.created_at),
        updatedAt: new Date(record._raw.updated_at),
      };
      return ExerciseTemplateModel.hydrate(plainData);
    });
  }

  /**
   * Deletes an exercise template by its ID from the database.
   * @param id The template ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<ExerciseTemplate>('exercise_templates');
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Template doesn't exist, which is fine for delete operation
      }
    });
  }
}
