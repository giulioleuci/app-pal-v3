import { PerformedGroupLogModel } from './PerformedGroupLogModel';

/**
 * Defines the contract for performed group data persistence.
 * Manages the persistence of performed groups within workout logs.
 */
export interface IPerformedGroupRepository {
  /**
   * Persists a performed group to the database.
   * @param group The PerformedGroupLogModel instance to save
   * @returns Promise resolving to the saved PerformedGroupLogModel
   */
  save(group: PerformedGroupLogModel): Promise<PerformedGroupLogModel>;

  /**
   * Retrieves a performed group by ID.
   * @param id The performed group ID to find
   * @returns Promise resolving to PerformedGroupLogModel if found, undefined otherwise
   */
  findById(id: string): Promise<PerformedGroupLogModel | undefined>;

  /**
   * Retrieves multiple performed groups by their IDs.
   * @param ids Array of performed group IDs to find
   * @returns Promise resolving to array of PerformedGroupLogModels
   */
  findByIds(ids: string[]): Promise<PerformedGroupLogModel[]>;

  /**
   * Retrieves all performed groups for a profile.
   * @param profileId The profile ID to find performed groups for
   * @returns Promise resolving to array of PerformedGroupLogModels
   */
  findAll(profileId: string): Promise<PerformedGroupLogModel[]>;

  /**
   * Deletes a performed group by ID.
   * @param id The performed group ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
