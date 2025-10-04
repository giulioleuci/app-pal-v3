/**
 * Interface for persisting and retrieving XState workout machine state.
 * This abstraction decouples the XState machine from its storage mechanism,
 * allowing us to easily swap between different database implementations, cloud storage, or other persistence layers.
 */
export interface IWorkoutStatePersistence {
  /**
   * Saves the serialized state of the workout machine.
   * @param profileId - The unique identifier for the user profile
   * @param state - The serialized XState machine state
   * @returns Promise that resolves when the state is successfully saved
   */
  saveState(profileId: string, state: string): Promise<void>;

  /**
   * Loads the serialized state of the workout machine for a specific profile.
   * @param profileId - The unique identifier for the user profile
   * @returns Promise that resolves to the serialized state, or null if no state exists
   */
  loadState(profileId: string): Promise<string | null>;

  /**
   * Clears the saved state for a specific profile.
   * @param profileId - The unique identifier for the user profile
   * @returns Promise that resolves when the state is successfully cleared
   */
  clearState(profileId: string): Promise<void>;
}
