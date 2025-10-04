import { Q } from '@nozbe/watermelondb';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/app/db/database';
import { IWorkoutStatePersistence } from '@/features/workout/domain';
import { WorkoutStateData } from '@/shared/types';

/**
 * WatermelonDB-based implementation of workout state persistence.
 * Stores and retrieves XState machine state using a simple key-value approach
 * in the workoutStates table.
 */
export class WatermelonWorkoutStatePersistence implements IWorkoutStatePersistence {
  /**
   * Saves the serialized state of the workout machine for a specific profile.
   * Uses an upsert strategy - creates new record if none exists, updates if found.
   */
  async saveState(profileId: string, state: string): Promise<void> {
    // Use a single database write to make the entire upsert operation atomic
    await db.database.write(async () => {
      // Use WatermelonDB's native collection API instead of collection wrapper
      const collection = db.database.get('workout_states');
      const existingRecords = await collection.query(Q.where('profile_id', profileId)).fetch();
      const existingRecord = existingRecords.length > 0 ? existingRecords[0] : null;

      if (existingRecord) {
        // Update existing state using WatermelonDB native API
        await existingRecord.update((record: any) => {
          record._raw.state = state;
          record._raw.updated_at = new Date().getTime(); // Store as timestamp for LokiJS
        });
      } else {
        // Create new state record using WatermelonDB native API
        await collection.create((record: any) => {
          record._raw.profile_id = profileId;
          record._raw.state = state;
          record._raw.created_at = new Date().getTime(); // Store as timestamp for LokiJS
          record._raw.updated_at = new Date().getTime(); // Store as timestamp for LokiJS
        });
      }
    });
  }

  /**
   * Loads the serialized state of the workout machine for a specific profile.
   * Returns null if no state is found for the given profile.
   */
  async loadState(profileId: string): Promise<string | null> {
    // Use WatermelonDB's native collection API
    const collection = db.database.get('workout_states');
    const stateRecords = await collection.query(Q.where('profile_id', profileId)).fetch();
    const stateRecord = stateRecords.length > 0 ? stateRecords[0] : null;

    return stateRecord?._raw.state ?? null;
  }

  /**
   * Clears the saved state for a specific profile by deleting the record.
   * No-op if no state exists for the given profile.
   */
  async clearState(profileId: string): Promise<void> {
    await db.database.write(async () => {
      // Use WatermelonDB's native collection API
      const collection = db.database.get('workout_states');
      const stateRecords = await collection.query(Q.where('profile_id', profileId)).fetch();
      for (const record of stateRecords) {
        await record.markAsDeleted();
      }
    });
  }
}
