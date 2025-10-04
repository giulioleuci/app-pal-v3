import { PerformedSetModel } from './PerformedSetModel';

/**
 * Defines the contract for performed set data persistence.
 * Manages the persistence of performed sets within performed exercises.
 */
export interface IPerformedSetRepository {
  /**
   * Persists a performed set to the database.
   * @param set The PerformedSetModel instance to save
   * @returns Promise resolving to the saved PerformedSetModel
   */
  save(set: PerformedSetModel): Promise<PerformedSetModel>;

  /**
   * Retrieves a performed set by ID.
   * @param id The performed set ID to find
   * @returns Promise resolving to PerformedSetModel if found, undefined otherwise
   */
  findById(id: string): Promise<PerformedSetModel | undefined>;

  /**
   * Retrieves multiple performed sets by their IDs.
   * @param ids Array of performed set IDs to find
   * @returns Promise resolving to array of PerformedSetModels
   */
  findByIds(ids: string[]): Promise<PerformedSetModel[]>;

  /**
   * Retrieves all performed sets for a profile.
   * @param profileId The profile ID to find performed sets for
   * @returns Promise resolving to array of PerformedSetModels
   */
  findAll(profileId: string): Promise<PerformedSetModel[]>;

  /**
   * Deletes a performed set by ID.
   * @param id The performed set ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
