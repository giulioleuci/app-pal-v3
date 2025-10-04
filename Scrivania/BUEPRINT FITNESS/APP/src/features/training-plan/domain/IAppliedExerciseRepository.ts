import { AppliedExerciseModel } from './AppliedExerciseModel';

/**
 * Defines the contract for applied exercise data persistence.
 * Manages the persistence of applied exercises within exercise groups.
 */
export interface IAppliedExerciseRepository {
  /**
   * Persists an applied exercise to the database.
   * @param exercise The AppliedExerciseModel instance to save
   * @returns Promise resolving to the saved AppliedExerciseModel
   */
  save(exercise: AppliedExerciseModel): Promise<AppliedExerciseModel>;

  /**
   * Retrieves an applied exercise by ID.
   * @param id The applied exercise ID to find
   * @returns Promise resolving to AppliedExerciseModel if found, undefined otherwise
   */
  findById(id: string): Promise<AppliedExerciseModel | undefined>;

  /**
   * Retrieves multiple applied exercises by their IDs.
   * @param ids Array of applied exercise IDs to find
   * @returns Promise resolving to array of AppliedExerciseModels
   */
  findByIds(ids: string[]): Promise<AppliedExerciseModel[]>;

  /**
   * Retrieves all applied exercises for a profile.
   * @param profileId The profile ID to find applied exercises for
   * @returns Promise resolving to array of AppliedExerciseModels
   */
  findAll(profileId: string): Promise<AppliedExerciseModel[]>;

  /**
   * Deletes an applied exercise by ID.
   * @param id The applied exercise ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
