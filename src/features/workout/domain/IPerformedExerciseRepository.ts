import { PerformedExerciseLogModel } from './PerformedExerciseLogModel';

/**
 * Defines the contract for performed exercise data persistence.
 * Manages the persistence of performed exercises within performed groups.
 */
export interface IPerformedExerciseRepository {
  /**
   * Persists a performed exercise to the database.
   * @param exercise The PerformedExerciseLogModel instance to save
   * @returns Promise resolving to the saved PerformedExerciseLogModel
   */
  save(exercise: PerformedExerciseLogModel): Promise<PerformedExerciseLogModel>;

  /**
   * Retrieves a performed exercise by ID.
   * @param id The performed exercise ID to find
   * @returns Promise resolving to PerformedExerciseLogModel if found, undefined otherwise
   */
  findById(id: string): Promise<PerformedExerciseLogModel | undefined>;

  /**
   * Retrieves multiple performed exercises by their IDs.
   * @param ids Array of performed exercise IDs to find
   * @returns Promise resolving to array of PerformedExerciseLogModels
   */
  findByIds(ids: string[]): Promise<PerformedExerciseLogModel[]>;

  /**
   * Retrieves all performed exercises for a profile.
   * @param profileId The profile ID to find performed exercises for
   * @returns Promise resolving to array of PerformedExerciseLogModels
   */
  findAll(profileId: string): Promise<PerformedExerciseLogModel[]>;

  /**
   * Deletes a performed exercise by ID.
   * @param id The performed exercise ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
