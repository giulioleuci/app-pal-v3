import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, db } from '@/app/db/database';

import { IPerformedExerciseRepository } from '../domain/IPerformedExerciseRepository';
import { IPerformedSetRepository } from '../domain/IPerformedSetRepository';
import { PerformedExerciseLogModel } from '../domain/PerformedExerciseLogModel';

/**
 * Concrete implementation of IPerformedExerciseRepository using WatermelonDB.
 * Handles persistence and retrieval of PerformedExercise domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 * Self-assembles the full aggregate by injecting child repository interfaces.
 */
@injectable()
export class PerformedExerciseRepository implements IPerformedExerciseRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new PerformedExerciseRepository instance.
   * @param performedSetRepo Repository for fetching performed sets
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(
    @inject('IPerformedSetRepository') private performedSetRepo: IPerformedSetRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  ) {
    this.database = database;
  }

  /**
   * Persists a PerformedExerciseLogModel to the database by converting it to plain data
   * using the model's toPlainObject method. Also persists all child entities
   * (performed sets) in an atomic transaction.
   * @param exercise The PerformedExerciseLogModel instance to save
   * @returns Promise resolving to the saved PerformedExerciseLogModel
   */
  async save(
    exercise: PerformedExerciseLogModel,
    inTransaction: boolean = false
  ): Promise<PerformedExerciseLogModel> {
    const saveOperation = async () => {
      // Save the exercise
      const exerciseData = exercise.toPlainObject();
      await this.database.performedExercises.put(exerciseData);

      // Save all performed sets - pass transaction context to avoid nested writes
      for (const performedSet of exercise.sets) {
        await this.performedSetRepo.save(performedSet, true);
      }
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
   * Retrieves a performed exercise by ID and hydrates it into a PerformedExerciseLogModel
   * using the model's static hydrate method. Fetches and assembles all child entities.
   * @param id The performed exercise ID to find
   * @returns Promise resolving to PerformedExerciseLogModel if found, undefined otherwise
   */
  async findById(id: string): Promise<PerformedExerciseLogModel | undefined> {
    const exerciseData = await this.database.performedExercises.get(id);
    if (!exerciseData) {
      return undefined;
    }

    // Fetch all performed sets for this exercise
    const performedSets = await this.performedSetRepo.findByIds(exerciseData.setIds);

    return PerformedExerciseLogModel.hydrate(exerciseData, performedSets);
  }

  /**
   * Retrieves multiple performed exercises by their IDs and hydrates them into PerformedExerciseLogModels
   * using the model's static hydrate method.
   * @param ids Array of performed exercise IDs to find
   * @returns Promise resolving to array of PerformedExerciseLogModels
   */
  async findByIds(ids: string[]): Promise<PerformedExerciseLogModel[]> {
    const exercisesData = await this.database.performedExercises.bulkGet(ids);
    const validExercisesData = exercisesData.filter((data) => data !== undefined);

    if (validExercisesData.length === 0) {
      return [];
    }

    // Collect all performed set IDs from all exercises
    const allPerformedSetIds = validExercisesData.flatMap((exercise) => exercise.setIds);
    const allPerformedSets = await this.performedSetRepo.findByIds(allPerformedSetIds);

    // Group the performed sets by their IDs for quick lookup
    const performedSetsById = new Map(allPerformedSets.map((set) => [set.id, set]));

    // Hydrate each exercise with its corresponding performed sets
    return validExercisesData.map((exerciseData) => {
      const exercisePerformedSets = exerciseData.setIds
        .map((setId) => performedSetsById.get(setId))
        .filter((set) => set !== undefined);

      return PerformedExerciseLogModel.hydrate(exerciseData, exercisePerformedSets);
    });
  }

  /**
   * Retrieves all performed exercises for a profile ID and hydrates them into PerformedExerciseLogModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find performed exercises for
   * @returns Promise resolving to array of PerformedExerciseLogModels
   */
  async findAll(profileId: string): Promise<PerformedExerciseLogModel[]> {
    const exercisesData = await this.database.performedExercises
      .where('profileId')
      .equals(profileId)
      .toArray();

    if (exercisesData.length === 0) {
      return [];
    }

    // Collect all performed set IDs from all exercises
    const allPerformedSetIds = exercisesData.flatMap((exercise) => exercise.setIds);
    const allPerformedSets = await this.performedSetRepo.findByIds(allPerformedSetIds);

    // Group the performed sets by their IDs for quick lookup
    const performedSetsById = new Map(allPerformedSets.map((set) => [set.id, set]));

    // Hydrate each exercise with its corresponding performed sets
    return exercisesData.map((exerciseData) => {
      const exercisePerformedSets = exerciseData.setIds
        .map((setId) => performedSetsById.get(setId))
        .filter((set) => set !== undefined);

      return PerformedExerciseLogModel.hydrate(exerciseData, exercisePerformedSets);
    });
  }

  /**
   * Deletes a performed exercise by ID from the database, along with all its child entities.
   * @param id The performed exercise ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string, inTransaction: boolean = false): Promise<void> {
    const exercise = await this.findById(id);
    if (!exercise) {
      return;
    }

    const deleteOperation = async () => {
      // Delete all performed sets first - pass transaction context to avoid nested writes
      for (const performedSet of exercise.sets) {
        await this.performedSetRepo.delete(performedSet.id, true);
      }

      // Delete the exercise
      await this.database.performedExercises.delete(id);
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
