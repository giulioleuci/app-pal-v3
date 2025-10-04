import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, db } from '@/app/db/database';

import { IPerformedSetRepository } from '../domain/IPerformedSetRepository';
import { PerformedSetModel } from '../domain/PerformedSetModel';

/**
 * Concrete implementation of IPerformedSetRepository using WatermelonDB.
 * Handles persistence and retrieval of PerformedSet domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 */
@injectable()
export class PerformedSetRepository implements IPerformedSetRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new PerformedSetRepository instance.
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(@inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db) {
    this.database = database;
  }

  /**
   * Persists a PerformedSetModel to the database by converting it to plain data
   * using the model's toPlainObject method, then returns the saved model.
   * @param set The PerformedSetModel instance to save
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving to the saved PerformedSetModel
   */
  async save(set: PerformedSetModel, inTransaction: boolean = false): Promise<PerformedSetModel> {
    const saveOperation = async () => {
      const plainData = set.toPlainObject();
      await this.database.performedSets.put(plainData);
    };

    if (inTransaction) {
      // Already in a transaction, execute directly
      await saveOperation();
    } else {
      // Start new transaction
      await this.database.write(saveOperation);
    }

    return set;
  }

  /**
   * Retrieves a performed set by ID and hydrates it into a PerformedSetModel
   * using the model's static hydrate method.
   * @param id The performed set ID to find
   * @returns Promise resolving to PerformedSetModel if found, undefined otherwise
   */
  async findById(id: string): Promise<PerformedSetModel | undefined> {
    const plainData = await this.database.performedSets.get(id);
    if (!plainData) {
      return undefined;
    }
    return PerformedSetModel.hydrate(plainData);
  }

  /**
   * Retrieves multiple performed sets by their IDs and hydrates them into PerformedSetModels
   * using the model's static hydrate method.
   * @param ids Array of performed set IDs to find
   * @returns Promise resolving to array of PerformedSetModels
   */
  async findByIds(ids: string[]): Promise<PerformedSetModel[]> {
    const plainDataArray = await this.database.performedSets.bulkGet(ids);
    return plainDataArray
      .filter((data) => data !== undefined)
      .map((data) => PerformedSetModel.hydrate(data));
  }

  /**
   * Retrieves all performed sets for a profile ID and hydrates them into PerformedSetModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find performed sets for
   * @returns Promise resolving to array of PerformedSetModels
   */
  async findAll(profileId: string): Promise<PerformedSetModel[]> {
    const plainDataArray = await this.database.performedSets
      .where('profileId')
      .equals(profileId)
      .toArray();
    return plainDataArray.map((data) => PerformedSetModel.hydrate(data));
  }

  /**
   * Deletes a performed set by ID from the database.
   * @param id The performed set ID to delete
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string, inTransaction: boolean = false): Promise<void> {
    const deleteOperation = async () => {
      await this.database.performedSets.delete(id);
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
