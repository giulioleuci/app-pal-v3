import { SessionModel } from './SessionModel';

/**
 * Defines the contract for workout session data persistence.
 * Manages the persistence of individual workout sessions within training plans.
 */
export interface IWorkoutSessionRepository {
  /**
   * Persists a workout session to the database.
   * @param session The SessionModel instance to save
   * @returns Promise resolving to the saved SessionModel
   */
  save(session: SessionModel): Promise<SessionModel>;

  /**
   * Retrieves a workout session by ID.
   * @param id The session ID to find
   * @returns Promise resolving to SessionModel if found, undefined otherwise
   */
  findById(id: string): Promise<SessionModel | undefined>;

  /**
   * Retrieves multiple workout sessions by their IDs.
   * @param ids Array of session IDs to find
   * @returns Promise resolving to array of SessionModels
   */
  findByIds(ids: string[]): Promise<SessionModel[]>;

  /**
   * Retrieves all workout sessions for a profile.
   * @param profileId The profile ID to find sessions for
   * @returns Promise resolving to array of SessionModels
   */
  findAll(profileId: string): Promise<SessionModel[]>;

  /**
   * Deletes a workout session by ID.
   * @param id The session ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
