import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, db } from '@/app/db/database';

import { AppliedExerciseModel } from '../domain/AppliedExerciseModel';
import { IAppliedExerciseRepository } from '../domain/IAppliedExerciseRepository';

/**
 * Concrete implementation of IAppliedExerciseRepository using WatermelonDB.
 * Handles persistence and retrieval of AppliedExercise domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class AppliedExerciseRepository implements IAppliedExerciseRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new AppliedExerciseRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(@inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db) {
    this.database = database;
  }

  /**
   * Persists an AppliedExerciseModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param exercise The AppliedExerciseModel instance to save
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving to the saved AppliedExerciseModel
   */
  async save(
    exercise: AppliedExerciseModel,
    inTransaction: boolean = false
  ): Promise<AppliedExerciseModel> {
    const saveOperation = async () => {
      const plainData = exercise.toPlainObject();
      await this.database.appliedExercises.put(plainData);
    };

    if (inTransaction) {
      // Already in a transaction, execute directly
      await saveOperation();
    } else {
      // Start new transaction
      await this.database.write(saveOperation);
    }

    return exercise;
  }

  /**
   * Retrieves an applied exercise by ID and hydrates it into an AppliedExerciseModel
   * using the model's static hydrate method.
   * @param id The applied exercise ID to find
   * @returns Promise resolving to AppliedExerciseModel if found, undefined otherwise
   */
  async findById(id: string): Promise<AppliedExerciseModel | undefined> {
    const plainData = await this.database.appliedExercises.get(id);
    if (!plainData) {
      return undefined;
    }
    return AppliedExerciseModel.hydrate(plainData);
  }

  /**
   * Retrieves multiple applied exercises by their IDs and hydrates them into AppliedExerciseModels
   * using the model's static hydrate method.
   * @param ids Array of applied exercise IDs to find
   * @returns Promise resolving to array of AppliedExerciseModels
   */
  async findByIds(ids: string[]): Promise<AppliedExerciseModel[]> {
    const plainDataArray = await this.database.appliedExercises.bulkGet(ids);
    return plainDataArray
      .filter((data) => data !== undefined)
      .map((data) => AppliedExerciseModel.hydrate(data));
  }

  /**
   * Retrieves all applied exercises for a profile ID and hydrates them into AppliedExerciseModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find applied exercises for
   * @returns Promise resolving to array of AppliedExerciseModels
   */
  async findAll(profileId: string): Promise<AppliedExerciseModel[]> {
    const plainDataArray = await this.database.appliedExercises
      .where('profileId')
      .equals(profileId)
      .toArray();
    return plainDataArray.map((data) => AppliedExerciseModel.hydrate(data));
  }

  /**
   * Deletes an applied exercise by ID from the database.
   * @param id The applied exercise ID to delete
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string, inTransaction: boolean = false): Promise<void> {
    const deleteOperation = async () => {
      await this.database.appliedExercises.delete(id);
    };

    if (inTransaction) {
      // Already in a transaction, execute directly
      await deleteOperation();
    } else {
      // Start new transaction
      await this.database.write(deleteOperation);
    }
  }
}
