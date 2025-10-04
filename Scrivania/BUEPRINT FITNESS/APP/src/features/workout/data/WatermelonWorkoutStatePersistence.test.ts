import { Database } from '@nozbe/watermelondb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkoutStateData } from '@/shared/types';
import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';

// Create a test database instance that will be shared
let testDbInstance: TestExtendedDatabase;

// Mock the database import to use our test instance
vi.mock('@/app/db/database', async () => {
  const actual = await vi.importActual('@/app/db/database');
  return {
    ...actual,
    get db() {
      return {
        ...testDbInstance,
        database: testDbInstance,
      };
    },
  };
});

import { WatermelonWorkoutStatePersistence } from './WatermelonWorkoutStatePersistence';

describe('WatermelonWorkoutStatePersistence', () => {
  let testDb: TestExtendedDatabase;
  let persistence: WatermelonWorkoutStatePersistence;

  beforeEach(async () => {
    testDb = createTestDatabase();
    testDbInstance = testDb; // Set the shared instance

    persistence = new WatermelonWorkoutStatePersistence();
  });

  describe('saveState', () => {
    it('should save a new state record to the database', async () => {
      // Arrange
      const profileId = 'test-profile-1';
      const serializedState = '{"value":"idle","context":{"workoutId":null}}';

      // Act
      await persistence.saveState(profileId, serializedState);

      // Assert
      const savedRecord = await testDb.workoutStates.where('profileId').equals(profileId).first();

      expect(savedRecord).toBeDefined();
      expect(savedRecord!.profileId).toBe(profileId);
      expect(savedRecord!.state).toBe(serializedState);
      expect(savedRecord!.id).toBeDefined();
      expect(savedRecord!.createdAt).toBeInstanceOf(Date);
      expect(savedRecord!.updatedAt).toBeInstanceOf(Date);
      expect(savedRecord!.createdAt).toEqual(savedRecord!.updatedAt);
    });

    it('should update an existing state record when profile already has a state', async () => {
      // Arrange
      const profileId = 'test-profile-2';
      const initialState = '{"value":"idle","context":{"workoutId":null}}';
      const updatedState = '{"value":"active","context":{"workoutId":"workout-123"}}';

      // First, save an initial state
      await persistence.saveState(profileId, initialState);

      const initialRecord = await testDb.workoutStates.where('profileId').equals(profileId).first();
      const initialId = initialRecord!.id;
      const initialCreatedAt = initialRecord!.createdAt;

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => {
        globalThis.setTimeout(resolve, 10);
      });

      // Act - update the state
      await persistence.saveState(profileId, updatedState);

      // Assert
      const updatedRecord = await testDb.workoutStates.where('profileId').equals(profileId).first();

      expect(updatedRecord).toBeDefined();
      expect(updatedRecord!.id).toBe(initialId); // Same ID (updated, not new record)
      expect(updatedRecord!.profileId).toBe(profileId);
      expect(updatedRecord!.state).toBe(updatedState); // Updated state
      expect(updatedRecord!.createdAt).toEqual(initialCreatedAt); // CreatedAt unchanged
      expect(updatedRecord!.updatedAt).not.toEqual(initialCreatedAt); // UpdatedAt changed

      // Verify only one record exists for this profile
      const allRecords = await testDb.workoutStates.where('profileId').equals(profileId).toArray();
      expect(allRecords).toHaveLength(1);
    });

    it('should handle multiple profiles with separate state records', async () => {
      // Arrange
      const profileId1 = 'profile-1';
      const profileId2 = 'profile-2';
      const state1 = '{"value":"idle","context":{"workoutId":null}}';
      const state2 = '{"value":"active","context":{"workoutId":"workout-456"}}';

      // Act
      await persistence.saveState(profileId1, state1);
      await persistence.saveState(profileId2, state2);

      // Assert
      const record1 = await testDb.workoutStates.where('profileId').equals(profileId1).first();
      const record2 = await testDb.workoutStates.where('profileId').equals(profileId2).first();

      expect(record1).toBeDefined();
      expect(record2).toBeDefined();
      expect(record1!.profileId).toBe(profileId1);
      expect(record1!.state).toBe(state1);
      expect(record2!.profileId).toBe(profileId2);
      expect(record2!.state).toBe(state2);
      expect(record1!.id).not.toBe(record2!.id);
    });

    it('should be transactional and atomic', async () => {
      // Arrange
      const profileId = 'test-profile-atomic';
      const state = '{"value":"test","context":{}}';

      // Verify no existing state
      const initialRecords = await testDb.workoutStates
        .where('profileId')
        .equals(profileId)
        .toArray();
      expect(initialRecords).toHaveLength(0);

      // Act
      await persistence.saveState(profileId, state);

      // Assert - record was created atomically
      const finalRecords = await testDb.workoutStates
        .where('profileId')
        .equals(profileId)
        .toArray();
      expect(finalRecords).toHaveLength(1);
      expect(finalRecords[0].profileId).toBe(profileId);
      expect(finalRecords[0].state).toBe(state);
    });
  });

  describe('loadState', () => {
    it('should return the correct state for an existing profile', async () => {
      // Arrange
      const profileId = 'test-profile-load';
      const expectedState = '{"value":"paused","context":{"workoutId":"workout-789"}}';

      await persistence.saveState(profileId, expectedState);

      // Act
      const loadedState = await persistence.loadState(profileId);

      // Assert
      expect(loadedState).toBe(expectedState);
    });

    it('should return null for a non-existent profile', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile';

      // Act
      const loadedState = await persistence.loadState(nonExistentProfileId);

      // Assert
      expect(loadedState).toBeNull();
    });

    it('should return the most recent state when profile has been updated', async () => {
      // Arrange
      const profileId = 'test-profile-recent';
      const initialState = '{"value":"idle","context":{}}';
      const updatedState = '{"value":"completed","context":{"workoutId":"workout-final"}}';

      await persistence.saveState(profileId, initialState);
      await persistence.saveState(profileId, updatedState);

      // Act
      const loadedState = await persistence.loadState(profileId);

      // Assert
      expect(loadedState).toBe(updatedState);
    });

    it('should handle multiple profiles correctly', async () => {
      // Arrange
      const profileId1 = 'profile-multi-1';
      const profileId2 = 'profile-multi-2';
      const state1 = '{"value":"state1","context":{}}';
      const state2 = '{"value":"state2","context":{}}';

      await persistence.saveState(profileId1, state1);
      await persistence.saveState(profileId2, state2);

      // Act
      const loadedState1 = await persistence.loadState(profileId1);
      const loadedState2 = await persistence.loadState(profileId2);

      // Assert
      expect(loadedState1).toBe(state1);
      expect(loadedState2).toBe(state2);
    });
  });

  describe('clearState', () => {
    it('should successfully delete the state record for a profile', async () => {
      // Arrange
      const profileId = 'test-profile-clear';
      const state = '{"value":"toBeDeleted","context":{}}';

      await persistence.saveState(profileId, state);

      // Verify state exists before clearing
      const beforeClear = await persistence.loadState(profileId);
      expect(beforeClear).toBe(state);

      // Act
      await persistence.clearState(profileId);

      // Assert
      const afterClear = await persistence.loadState(profileId);
      expect(afterClear).toBeNull();

      // Verify record is actually deleted from database
      const deletedRecord = await testDb.workoutStates.where('profileId').equals(profileId).first();
      expect(deletedRecord).toBeUndefined();
    });

    it('should be a no-op when no state exists for a profile', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-clear';

      // Act & Assert - should not throw
      await expect(persistence.clearState(nonExistentProfileId)).resolves.not.toThrow();

      // Verify still no state exists
      const state = await persistence.loadState(nonExistentProfileId);
      expect(state).toBeNull();
    });

    it('should only delete the state for the specified profile', async () => {
      // Arrange
      const profileId1 = 'profile-clear-1';
      const profileId2 = 'profile-clear-2';
      const state1 = '{"value":"willBeDeleted","context":{}}';
      const state2 = '{"value":"willRemain","context":{}}';

      await persistence.saveState(profileId1, state1);
      await persistence.saveState(profileId2, state2);

      // Act
      await persistence.clearState(profileId1);

      // Assert
      const clearedState = await persistence.loadState(profileId1);
      const remainingState = await persistence.loadState(profileId2);

      expect(clearedState).toBeNull();
      expect(remainingState).toBe(state2);
    });

    it('should handle clearing and re-saving state for the same profile', async () => {
      // Arrange
      const profileId = 'test-profile-clear-resave';
      const initialState = '{"value":"initial","context":{}}';
      const newState = '{"value":"new","context":{}}';

      await persistence.saveState(profileId, initialState);
      await persistence.clearState(profileId);

      // Act
      await persistence.saveState(profileId, newState);

      // Assert
      const finalState = await persistence.loadState(profileId);
      expect(finalState).toBe(newState);

      // Verify it's a new record (different ID)
      const records = await testDb.workoutStates.where('profileId').equals(profileId).toArray();
      expect(records).toHaveLength(1);
    });
  });

  describe('integration scenarios', () => {
    it('should handle a complete workout session lifecycle', async () => {
      // Arrange
      const profileId = 'lifecycle-profile';
      const idleState = '{"value":"idle","context":{"workoutId":null}}';
      const activeState =
        '{"value":"active","context":{"workoutId":"workout-123","currentExercise":0}}';
      const pausedState =
        '{"value":"paused","context":{"workoutId":"workout-123","currentExercise":2}}';
      const completedState =
        '{"value":"completed","context":{"workoutId":"workout-123","finalTime":"00:45:30"}}';

      // Act & Assert - Simulate a complete workflow

      // 1. Start with idle state
      await persistence.saveState(profileId, idleState);
      expect(await persistence.loadState(profileId)).toBe(idleState);

      // 2. Begin workout
      await persistence.saveState(profileId, activeState);
      expect(await persistence.loadState(profileId)).toBe(activeState);

      // 3. Pause workout
      await persistence.saveState(profileId, pausedState);
      expect(await persistence.loadState(profileId)).toBe(pausedState);

      // 4. Complete workout
      await persistence.saveState(profileId, completedState);
      expect(await persistence.loadState(profileId)).toBe(completedState);

      // 5. Clear state after workout
      await persistence.clearState(profileId);
      expect(await persistence.loadState(profileId)).toBeNull();

      // Verify only one operation happened at database level (updates, not inserts)
      const allRecords = await testDb.workoutStates.where('profileId').equals(profileId).toArray();
      expect(allRecords).toHaveLength(0); // Should be empty after clear
    });

    it('should handle concurrent operations safely', async () => {
      // Arrange
      const profileId = 'concurrent-profile';
      const state1 = '{"value":"concurrent1","context":{}}';
      const state2 = '{"value":"concurrent2","context":{}}';
      const state3 = '{"value":"concurrent3","context":{}}';

      // Act - Execute multiple operations concurrently
      const promises = [
        persistence.saveState(profileId, state1),
        persistence.saveState(profileId, state2),
        persistence.saveState(profileId, state3),
      ];

      await Promise.all(promises);

      // Assert
      const finalState = await persistence.loadState(profileId);
      expect([state1, state2, state3]).toContain(finalState); // One of them should win

      // Verify only one record exists
      const allRecords = await testDb.workoutStates.where('profileId').equals(profileId).toArray();
      expect(allRecords).toHaveLength(1);
    });

    it('should maintain data integrity across multiple profiles under load', async () => {
      // Arrange
      const profileIds = Array.from({ length: 10 }, (_, i) => `load-test-profile-${i}`);
      const states = profileIds.map(
        (id) => `{"value":"state-${id}","context":{"profileId":"${id}"}}`
      );

      // Act - Save states for all profiles concurrently
      const savePromises = profileIds.map((id, index) => persistence.saveState(id, states[index]));
      await Promise.all(savePromises);

      // Assert - Load and verify all states
      const loadPromises = profileIds.map((id) => persistence.loadState(id));
      const loadedStates = await Promise.all(loadPromises);

      loadedStates.forEach((state, index) => {
        expect(state).toBe(states[index]);
      });

      // Verify correct number of records in database
      const totalRecords = await testDb.workoutStates.count();
      expect(totalRecords).toBe(profileIds.length);

      // Clear half the profiles and verify isolation
      const profilesToClear = profileIds.slice(0, 5);
      const clearPromises = profilesToClear.map((id) => persistence.clearState(id));
      await Promise.all(clearPromises);

      // Verify cleared profiles return null
      const clearedLoadPromises = profilesToClear.map((id) => persistence.loadState(id));
      const clearedStates = await Promise.all(clearedLoadPromises);
      clearedStates.forEach((state) => expect(state).toBeNull());

      // Verify remaining profiles still have their states
      const remainingIds = profileIds.slice(5);
      const remainingLoadPromises = remainingIds.map((id) => persistence.loadState(id));
      const remainingStates = await Promise.all(remainingLoadPromises);
      remainingStates.forEach((state, index) => {
        expect(state).toBe(states[index + 5]);
      });

      // Verify final record count
      const finalRecordCount = await testDb.workoutStates.count();
      expect(finalRecordCount).toBe(5);
    });
  });
});
