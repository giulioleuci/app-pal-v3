import { ExerciseGroupModel } from './ExerciseGroupModel';

/**
 * Defines the contract for exercise group data persistence.
 * Manages the persistence of exercise groups within workout sessions.
 */
export interface IExerciseGroupRepository {
  /**
   * Persists an exercise group to the database.
   * @param group The ExerciseGroupModel instance to save
   * @returns Promise resolving to the saved ExerciseGroupModel
   */
  save(group: ExerciseGroupModel): Promise<ExerciseGroupModel>;

  /**
   * Retrieves an exercise group by ID.
   * @param id The group ID to find
   * @returns Promise resolving to ExerciseGroupModel if found, undefined otherwise
   */
  findById(id: string): Promise<ExerciseGroupModel | undefined>;

  /**
   * Retrieves multiple exercise groups by their IDs.
   * @param ids Array of group IDs to find
   * @returns Promise resolving to array of ExerciseGroupModels
   */
  findByIds(ids: string[]): Promise<ExerciseGroupModel[]>;

  /**
   * Retrieves all exercise groups for a profile.
   * @param profileId The profile ID to find groups for
   * @returns Promise resolving to array of ExerciseGroupModels
   */
  findAll(profileId: string): Promise<ExerciseGroupModel[]>;

  /**
   * Deletes an exercise group by ID.
   * @param id The group ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
