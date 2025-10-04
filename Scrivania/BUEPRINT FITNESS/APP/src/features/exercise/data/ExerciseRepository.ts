import { Database } from '@nozbe/watermelondb';
import Q from '@nozbe/watermelondb/QueryDescription';
import { injectable } from 'tsyringe';

import { db } from '@/app/db/database';
import { Exercise } from '@/app/db/model/Exercise';
import { ExerciseData } from '@/shared/types';

import { ExerciseModel } from '../domain/ExerciseModel';
import { IExerciseRepository } from '../domain/IExerciseRepository';

/**
 * Concrete implementation of IExerciseRepository using WatermelonDB.
 * Handles persistence and retrieval of Exercise domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class ExerciseRepository implements IExerciseRepository {
  private readonly database: Database;

  /**
   * Creates a new ExerciseRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(database: Database = db) {
    this.database = database;
  }

  /**
   * Persists an ExerciseModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param exercise The ExerciseModel instance to save
   * @returns Promise resolving to the saved ExerciseModel
   */
  async save(exercise: ExerciseModel): Promise<ExerciseModel> {
    const plainData = exercise.toPlainObject();

    await this.database.write(async () => {
      const collection = this.database.get<Exercise>('exercises');

      try {
        // Try to find existing record
        const existingRecord = await collection.find(exercise.id);
        // Update existing record
        await existingRecord.update((record) => {
          record._raw.profile_id = plainData.profileId;
          record._raw.name = plainData.name;
          record._raw.description = plainData.description;
          record._raw.category = plainData.category;
          record._raw.movement_type = plainData.movementType;
          record._raw.movement_pattern = plainData.movementPattern;
          record._raw.difficulty = plainData.difficulty;
          record._raw.equipment = JSON.stringify(plainData.equipment);
          record._raw.muscle_activation = JSON.stringify(plainData.muscleActivation);
          record._raw.counter_type = plainData.counterType;
          record._raw.joint_type = plainData.jointType;
          record._raw.notes = plainData.notes;
          record._raw.substitutions = JSON.stringify(plainData.substitutions);
          record._raw.created_at = plainData.createdAt;
          record._raw.updated_at = plainData.updatedAt;
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((record) => {
          record._raw.id = plainData.id;
          record._raw.profile_id = plainData.profileId;
          record._raw.name = plainData.name;
          record._raw.description = plainData.description;
          record._raw.category = plainData.category;
          record._raw.movement_type = plainData.movementType;
          record._raw.movement_pattern = plainData.movementPattern;
          record._raw.difficulty = plainData.difficulty;
          record._raw.equipment = JSON.stringify(plainData.equipment);
          record._raw.muscle_activation = JSON.stringify(plainData.muscleActivation);
          record._raw.counter_type = plainData.counterType;
          record._raw.joint_type = plainData.jointType;
          record._raw.notes = plainData.notes;
          record._raw.substitutions = JSON.stringify(plainData.substitutions);
          record._raw.created_at = plainData.createdAt;
          record._raw.updated_at = plainData.updatedAt;
        });
      }
    });

    return exercise;
  }

  /**
   * Persists multiple ExerciseModels to the database in a single transaction
   * by converting them to plain data using each model's toPlainObject method.
   * @param exercises Array of ExerciseModel instances to save
   * @returns Promise resolving when all exercises are saved
   */
  async saveBulk(exercises: ExerciseModel[]): Promise<void> {
    if (exercises.length === 0) return;

    const plainDataArray = exercises.map((exercise) => exercise.toPlainObject());

    await this.database.write(async () => {
      const collection = this.database.get<Exercise>('exercises');
      const preparedRecords = plainDataArray.map((plainData) =>
        collection.prepareCreate((record) => {
          record._raw.id = plainData.id;
          record._raw.profile_id = plainData.profileId;
          record._raw.name = plainData.name;
          record._raw.description = plainData.description;
          record._raw.category = plainData.category;
          record._raw.movement_type = plainData.movementType;
          record._raw.movement_pattern = plainData.movementPattern;
          record._raw.difficulty = plainData.difficulty;
          record._raw.equipment = JSON.stringify(plainData.equipment);
          record._raw.muscle_activation = JSON.stringify(plainData.muscleActivation);
          record._raw.counter_type = plainData.counterType;
          record._raw.joint_type = plainData.jointType;
          record._raw.notes = plainData.notes;
          record._raw.substitutions = JSON.stringify(plainData.substitutions);
          record._raw.created_at = plainData.createdAt;
          record._raw.updated_at = plainData.updatedAt;
        })
      );

      await this.database.batch(...preparedRecords);
    });
  }

  /**
   * Retrieves an exercise by profile ID and exercise ID, and hydrates it into an ExerciseModel
   * using the model's static hydrate method.
   * @param profileId The profile ID the exercise belongs to
   * @param id The exercise ID to find
   * @returns Promise resolving to ExerciseModel if found, undefined otherwise
   */
  async findById(profileId: string, id: string): Promise<ExerciseModel | undefined> {
    try {
      const collection = this.database.get<Exercise>('exercises');
      const record = await collection.find(id);

      if (!record || record._raw.profile_id !== profileId || record._raw._status === 'deleted') {
        return undefined;
      }

      const plainData: ExerciseData = {
        id: record.id,
        profileId: record._raw.profile_id,
        name: record._raw.name,
        description: record._raw.description,
        category: record._raw.category,
        movementType: record._raw.movement_type,
        movementPattern: record._raw.movement_pattern,
        difficulty: record._raw.difficulty,
        equipment: JSON.parse(record._raw.equipment || '[]'),
        muscleActivation: JSON.parse(record._raw.muscle_activation || '{}'),
        counterType: record._raw.counter_type,
        jointType: record._raw.joint_type,
        notes: record._raw.notes || '',
        substitutions: JSON.parse(record._raw.substitutions || '[]'),
        createdAt: record._raw.created_at,
        updatedAt: record._raw.updated_at,
      };

      return ExerciseModel.hydrate(plainData);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Retrieves multiple exercises by profile ID and exercise IDs, and hydrates them into ExerciseModels
   * using the model's static hydrate method.
   * @param profileId The profile ID the exercises belong to
   * @param ids Array of exercise IDs to find
   * @returns Promise resolving to array of ExerciseModels
   */
  async findByIds(profileId: string, ids: string[]): Promise<ExerciseModel[]> {
    if (ids.length === 0) return [];

    const collection = this.database.get<Exercise>('exercises');
    const records = await collection
      .query(Q.where('profile_id', profileId), Q.where('id', Q.oneOf(ids)))
      .fetch();

    return records.map((record) => {
      const plainData: ExerciseData = {
        id: record.id,
        profileId: record._raw.profile_id,
        name: record._raw.name,
        description: record._raw.description,
        category: record._raw.category,
        movementType: record._raw.movement_type,
        movementPattern: record._raw.movement_pattern,
        difficulty: record._raw.difficulty,
        equipment: JSON.parse(record._raw.equipment || '[]'),
        muscleActivation: JSON.parse(record._raw.muscle_activation || '{}'),
        counterType: record._raw.counter_type,
        jointType: record._raw.joint_type,
        notes: record._raw.notes || '',
        substitutions: JSON.parse(record._raw.substitutions || '[]'),
        createdAt: record._raw.created_at,
        updatedAt: record._raw.updated_at,
      };
      return ExerciseModel.hydrate(plainData);
    });
  }

  /**
   * Retrieves all exercises for a profile ID and hydrates them into ExerciseModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find exercises for
   * @returns Promise resolving to array of ExerciseModels
   */
  async findAll(profileId: string): Promise<ExerciseModel[]> {
    const collection = this.database.get<Exercise>('exercises');
    const records = await collection.query(Q.where('profile_id', profileId)).fetch();

    return records.map((record) => {
      const plainData: ExerciseData = {
        id: record.id,
        profileId: record._raw.profile_id,
        name: record._raw.name,
        description: record._raw.description,
        category: record._raw.category,
        movementType: record._raw.movement_type,
        movementPattern: record._raw.movement_pattern,
        difficulty: record._raw.difficulty,
        equipment: JSON.parse(record._raw.equipment || '[]'),
        muscleActivation: JSON.parse(record._raw.muscle_activation || '{}'),
        counterType: record._raw.counter_type,
        jointType: record._raw.joint_type,
        notes: record._raw.notes || '',
        substitutions: JSON.parse(record._raw.substitutions || '[]'),
        createdAt: record._raw.created_at,
        updatedAt: record._raw.updated_at,
      };
      return ExerciseModel.hydrate(plainData);
    });
  }

  /**
   * Deletes an exercise by profile ID and exercise ID from the database.
   * @param profileId The profile ID the exercise belongs to
   * @param id The exercise ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(profileId: string, id: string): Promise<void> {
    await this.database.write(async () => {
      try {
        const collection = this.database.get<Exercise>('exercises');
        const record = await collection.find(id);

        if (record && record._raw.profile_id === profileId) {
          await record.markAsDeleted();
        }
      } catch (_error) {
        // Record doesn't exist, which is fine for deletion
      }
    });
  }
}
