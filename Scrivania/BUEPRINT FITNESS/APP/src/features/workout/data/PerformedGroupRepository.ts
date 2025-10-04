import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, db } from '@/app/db/database';

import { IPerformedExerciseRepository } from '../domain/IPerformedExerciseRepository';
import { IPerformedGroupRepository } from '../domain/IPerformedGroupRepository';
import { PerformedGroupLogModel } from '../domain/PerformedGroupLogModel';

/**
 * Concrete implementation of IPerformedGroupRepository using WatermelonDB.
 * Handles persistence and retrieval of PerformedGroup domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 * Self-assembles the full aggregate by injecting child repository interfaces.
 */
@injectable()
export class PerformedGroupRepository implements IPerformedGroupRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new PerformedGroupRepository instance.
   * @param performedExerciseRepo Repository for fetching performed exercises
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(
    @inject('IPerformedExerciseRepository')
    private performedExerciseRepo: IPerformedExerciseRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  ) {
    this.database = database;
  }

  /**
   * Persists a PerformedGroupLogModel to the database by converting it to plain data
   * using the model's toPlainObject method. Also persists all child entities
   * (performed exercises) in an atomic transaction.
   * @param group The PerformedGroupLogModel instance to save
   * @returns Promise resolving to the saved PerformedGroupLogModel
   */
  async save(
    group: PerformedGroupLogModel,
    inTransaction: boolean = false
  ): Promise<PerformedGroupLogModel> {
    const saveOperation = async () => {
      // Save the group
      const groupData = group.toPlainObject();
      await this.database.performedGroups.put(groupData);

      // Save all performed exercises - pass transaction context to avoid nested writes
      for (const performedExercise of group.performedExercises) {
        await this.performedExerciseRepo.save(performedExercise, true);
      }
    };

    if (inTransaction) {
      // Already in a transaction, execute directly
      await saveOperation();
    } else {
      // Start new transaction
      await this.database.write(saveOperation);
    }

    return group;
  }

  /**
   * Retrieves a performed group by ID and hydrates it into a PerformedGroupLogModel
   * using the model's static hydrate method. Fetches and assembles all child entities.
   * @param id The performed group ID to find
   * @returns Promise resolving to PerformedGroupLogModel if found, undefined otherwise
   */
  async findById(id: string): Promise<PerformedGroupLogModel | undefined> {
    const groupData = await this.database.performedGroups.get(id);
    if (!groupData) {
      return undefined;
    }

    // Fetch all performed exercises for this group
    const performedExercises = await this.performedExerciseRepo.findByIds(
      groupData.performedExerciseLogIds
    );

    return PerformedGroupLogModel.hydrate(groupData, performedExercises);
  }

  /**
   * Retrieves multiple performed groups by their IDs and hydrates them into PerformedGroupLogModels
   * using the model's static hydrate method.
   * @param ids Array of performed group IDs to find
   * @returns Promise resolving to array of PerformedGroupLogModels
   */
  async findByIds(ids: string[]): Promise<PerformedGroupLogModel[]> {
    const groupsData = await this.database.performedGroups.bulkGet(ids);
    const validGroupsData = groupsData.filter((data) => data !== undefined);

    if (validGroupsData.length === 0) {
      return [];
    }

    // Collect all performed exercise IDs from all groups
    const allPerformedExerciseIds = validGroupsData.flatMap(
      (group) => group.performedExerciseLogIds
    );
    const allPerformedExercises =
      await this.performedExerciseRepo.findByIds(allPerformedExerciseIds);

    // Group the performed exercises by their IDs for quick lookup
    const performedExercisesById = new Map(
      allPerformedExercises.map((exercise) => [exercise.id, exercise])
    );

    // Hydrate each group with its corresponding performed exercises
    return validGroupsData.map((groupData) => {
      const groupPerformedExercises = groupData.performedExerciseLogIds
        .map((exerciseId) => performedExercisesById.get(exerciseId))
        .filter((exercise) => exercise !== undefined);

      return PerformedGroupLogModel.hydrate(groupData, groupPerformedExercises);
    });
  }

  /**
   * Retrieves all performed groups for a profile ID and hydrates them into PerformedGroupLogModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find performed groups for
   * @returns Promise resolving to array of PerformedGroupLogModels
   */
  async findAll(profileId: string): Promise<PerformedGroupLogModel[]> {
    const groupsData = await this.database.performedGroups
      .where('profileId')
      .equals(profileId)
      .toArray();

    if (groupsData.length === 0) {
      return [];
    }

    // Collect all performed exercise IDs from all groups
    const allPerformedExerciseIds = groupsData.flatMap((group) => group.performedExerciseLogIds);
    const allPerformedExercises =
      await this.performedExerciseRepo.findByIds(allPerformedExerciseIds);

    // Group the performed exercises by their IDs for quick lookup
    const performedExercisesById = new Map(
      allPerformedExercises.map((exercise) => [exercise.id, exercise])
    );

    // Hydrate each group with its corresponding performed exercises
    return groupsData.map((groupData) => {
      const groupPerformedExercises = groupData.performedExerciseLogIds
        .map((exerciseId) => performedExercisesById.get(exerciseId))
        .filter((exercise) => exercise !== undefined);

      return PerformedGroupLogModel.hydrate(groupData, groupPerformedExercises);
    });
  }

  /**
   * Deletes a performed group by ID from the database, along with all its child entities.
   * @param id The performed group ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string, inTransaction: boolean = false): Promise<void> {
    const group = await this.findById(id);
    if (!group) {
      return;
    }

    const deleteOperation = async () => {
      // Delete all performed exercises first - pass transaction context to avoid nested writes
      for (const performedExercise of group.performedExercises) {
        await this.performedExerciseRepo.delete(performedExercise.id, true);
      }

      // Delete the group
      await this.database.performedGroups.delete(id);
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
