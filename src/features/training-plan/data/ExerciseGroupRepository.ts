import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, db } from '@/app/db/database';

import { ExerciseGroupModel } from '../domain/ExerciseGroupModel';
import { IAppliedExerciseRepository } from '../domain/IAppliedExerciseRepository';
import { IExerciseGroupRepository } from '../domain/IExerciseGroupRepository';

/**
 * Concrete implementation of IExerciseGroupRepository using WatermelonDB.
 * Handles persistence and retrieval of ExerciseGroup domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 * Self-assembles the full aggregate by injecting child repository interfaces.
 */
@injectable()
export class ExerciseGroupRepository implements IExerciseGroupRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new ExerciseGroupRepository instance.
   * @param appliedExerciseRepo Repository for fetching applied exercises
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(
    @inject('IAppliedExerciseRepository') private appliedExerciseRepo: IAppliedExerciseRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  ) {
    this.database = database;
  }

  /**
   * Persists an ExerciseGroupModel to the database by converting it to plain data
   * using the model's toPlainObject method. Also persists all child entities
   * (applied exercises) in an atomic transaction.
   * @param group The ExerciseGroupModel instance to save
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving to the saved ExerciseGroupModel
   */
  async save(
    group: ExerciseGroupModel,
    inTransaction: boolean = false
  ): Promise<ExerciseGroupModel> {
    const saveOperation = async () => {
      // Save the group
      const groupData = group.toPlainObject();
      await this.database.exerciseGroups.put(groupData);

      // Save all applied exercises - pass transaction context to avoid nested writes
      for (const appliedExercise of group.appliedExercises) {
        await this.appliedExerciseRepo.save(appliedExercise, true);
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
   * Retrieves an exercise group by ID and hydrates it into an ExerciseGroupModel
   * using the model's static hydrate method. Fetches and assembles all child entities.
   * @param id The group ID to find
   * @returns Promise resolving to ExerciseGroupModel if found, undefined otherwise
   */
  async findById(id: string): Promise<ExerciseGroupModel | undefined> {
    const groupData = await this.database.exerciseGroups.get(id);
    if (!groupData) {
      return undefined;
    }

    // Fetch all applied exercises for this group
    const appliedExercises = await this.appliedExerciseRepo.findByIds(
      groupData.appliedExerciseIds || []
    );

    return ExerciseGroupModel.hydrate(groupData, appliedExercises);
  }

  /**
   * Retrieves multiple exercise groups by their IDs and hydrates them into ExerciseGroupModels
   * using the model's static hydrate method.
   * @param ids Array of group IDs to find
   * @returns Promise resolving to array of ExerciseGroupModels
   */
  async findByIds(ids: string[]): Promise<ExerciseGroupModel[]> {
    const groupsData = await this.database.exerciseGroups.bulkGet(ids);
    const validGroupsData = groupsData.filter((data) => data !== undefined);

    if (validGroupsData.length === 0) {
      return [];
    }

    // Collect all applied exercise IDs from all groups
    const allAppliedExerciseIds = validGroupsData.flatMap(
      (group) => group.appliedExerciseIds || []
    );
    const allAppliedExercises = await this.appliedExerciseRepo.findByIds(allAppliedExerciseIds);

    // Group the applied exercises by their IDs for quick lookup
    const appliedExercisesById = new Map(
      allAppliedExercises.map((exercise) => [exercise.id, exercise])
    );

    // Hydrate each group with its corresponding applied exercises
    return validGroupsData.map((groupData) => {
      const groupAppliedExercises = (groupData.appliedExerciseIds || [])
        .map((exerciseId) => appliedExercisesById.get(exerciseId))
        .filter((exercise) => exercise !== undefined);

      return ExerciseGroupModel.hydrate(groupData, groupAppliedExercises);
    });
  }

  /**
   * Retrieves all exercise groups for a profile ID and hydrates them into ExerciseGroupModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find groups for
   * @returns Promise resolving to array of ExerciseGroupModels
   */
  async findAll(profileId: string): Promise<ExerciseGroupModel[]> {
    const groupsData = await this.database.exerciseGroups
      .where('profileId')
      .equals(profileId)
      .toArray();

    if (groupsData.length === 0) {
      return [];
    }

    // Collect all applied exercise IDs from all groups
    const allAppliedExerciseIds = groupsData.flatMap((group) => group.appliedExerciseIds);
    const allAppliedExercises = await this.appliedExerciseRepo.findByIds(allAppliedExerciseIds);

    // Group the applied exercises by their IDs for quick lookup
    const appliedExercisesById = new Map(
      allAppliedExercises.map((exercise) => [exercise.id, exercise])
    );

    // Hydrate each group with its corresponding applied exercises
    return groupsData.map((groupData) => {
      const groupAppliedExercises = groupData.appliedExerciseIds
        .map((exerciseId) => appliedExercisesById.get(exerciseId))
        .filter((exercise) => exercise !== undefined);

      return ExerciseGroupModel.hydrate(groupData, groupAppliedExercises);
    });
  }

  /**
   * Deletes an exercise group by ID from the database, along with all its child entities.
   * @param id The group ID to delete
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string, inTransaction: boolean = false): Promise<void> {
    const group = await this.findById(id);
    if (!group) {
      return;
    }

    const deleteOperation = async () => {
      // Delete all applied exercises first - pass transaction context to avoid nested writes
      for (const appliedExercise of group.appliedExercises) {
        await this.appliedExerciseRepo.delete(appliedExercise.id, true);
      }

      // Delete the group
      await this.database.exerciseGroups.delete(id);
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
