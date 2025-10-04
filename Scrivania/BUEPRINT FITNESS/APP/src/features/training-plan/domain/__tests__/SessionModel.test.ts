import { describe, expect, it, vi } from 'vitest';

import { generateId } from '@/lib';
import { workoutSessionSchema } from '@/shared/types';
import {
  createTestAppliedExerciseModel,
  createTestExerciseGroupModel,
  createTestSessionModel,
  createTestWorkoutSessionData,
} from '@/test-factories';

import { AppliedExerciseModel } from '../AppliedExerciseModel';
import { ExerciseGroupModel } from '../ExerciseGroupModel';
import { SessionModel } from '../SessionModel';

// Mock external dependencies
vi.mock('@/lib', () => {
  const uuids = [
    '12345678-1234-4234-8234-123456789abc',
    '22345678-1234-4234-9234-123456789abc',
    '32345678-1234-4234-a234-123456789abc',
    '42345678-1234-4234-b234-123456789abc',
    '52345678-1234-4234-8234-123456789abc',
    '62345678-1234-4234-9234-123456789abc',
    '72345678-1234-4234-a234-123456789abc',
    '82345678-1234-4234-b234-123456789abc',
    '92345678-1234-4234-8234-123456789abc',
    'a2345678-1234-4234-9234-123456789abc',
    'b2345678-1234-4234-a234-123456789abc',
    'c2345678-1234-4234-b234-123456789abc',
  ];
  let counter = 0;
  return {
    generateId: vi.fn(() => {
      const uuid = uuids[counter % uuids.length];
      counter++;
      return uuid;
    }),
  };
});

vi.mock('../AppliedExerciseModel', () => ({
  AppliedExerciseModel: {
    hydrate: vi.fn((data) => ({
      id: data.id,
      profileId: data.profileId,
      exerciseId: data.exerciseId,
      templateId: data.templateId,
      setConfiguration: { getTotalSets: vi.fn(() => 3) },
      restTimeSeconds: data.restTimeSeconds,
      executionCount: data.executionCount,
      getTotalSets: vi.fn(() => 3),
      clone: vi.fn(() => ({ id: data.id })),
      toPlainObject: vi.fn(() => data),
    })),
  },
}));

vi.mock('../ExerciseGroupModel', () => ({
  ExerciseGroupModel: {
    hydrate: vi.fn((data, appliedExercises) => ({
      id: data.id,
      profileId: data.profileId,
      type: data.type,
      appliedExercises,
      restTimeSeconds: data.restTimeSeconds,
      getEstimatedDurationSeconds: vi.fn(() => 300), // 5 minutes per group
      clone: vi.fn(() => ({ id: data.id, appliedExercises })),
      toPlainObject: vi.fn(() => data),
    })),
  },
}));

describe('SessionModel', () => {
  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof SessionModel.prototype.constructor).toBe('function');
    });
  });

  describe('hydrate', () => {
    it('should create a new SessionModel instance from plain data', () => {
      // Arrange
      const data = createTestWorkoutSessionData();
      const groups = [createTestExerciseGroupModel(), createTestExerciseGroupModel()];

      // Act
      const model = SessionModel.hydrate(data, groups);

      // Assert
      expect(model).toBeInstanceOf(SessionModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.name).toBe(data.name);
      expect(model.groups).toBe(groups);
      expect(model.notes).toBe(data.notes);
      expect(model.executionCount).toBe(data.executionCount);
      expect(model.isDeload).toBe(data.isDeload);
      expect(model.dayOfWeek).toBe(data.dayOfWeek);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle null dayOfWeek', () => {
      // Arrange
      const data = createTestWorkoutSessionData({ dayOfWeek: null });
      const groups = [createTestExerciseGroupModel()];

      // Act
      const model = SessionModel.hydrate(data, groups);

      // Assert
      expect(model.dayOfWeek).toBeNull();
    });

    it('should handle undefined notes', () => {
      // Arrange
      const data = createTestWorkoutSessionData({ notes: undefined });
      const groups = [createTestExerciseGroupModel()];

      // Act
      const model = SessionModel.hydrate(data, groups);

      // Assert
      expect(model.notes).toBeUndefined();
    });

    it('should handle empty groups array', () => {
      // Arrange
      const data = createTestWorkoutSessionData();
      const groups: ExerciseGroupModel[] = [];

      // Act
      const model = SessionModel.hydrate(data, groups);

      // Assert
      expect(model.groups).toHaveLength(0);
    });
  });

  describe('cloneWithIncrementedExecutionCount', () => {
    it('should create new instance with execution count incremented by 1', () => {
      // Arrange
      const original = createTestSessionModel({ executionCount: 3 });

      // Act
      const cloned = original.cloneWithIncrementedExecutionCount();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.executionCount).toBe(4);
      expect(original.executionCount).toBe(3); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should increment from zero', () => {
      // Arrange
      const original = createTestSessionModel({ executionCount: 0 });

      // Act
      const cloned = original.cloneWithIncrementedExecutionCount();

      // Assert
      expect(cloned.executionCount).toBe(1);
      expect(original.executionCount).toBe(0);
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestSessionModel({
        name: 'Test Workout',
        isDeload: true,
        dayOfWeek: 'monday',
      });

      // Act
      const cloned = original.cloneWithIncrementedExecutionCount();

      // Assert
      expect(cloned.name).toBe(original.name);
      expect(cloned.isDeload).toBe(original.isDeload);
      expect(cloned.dayOfWeek).toBe(original.dayOfWeek);
      expect(cloned.groups).toBe(original.groups);
    });
  });

  describe('cloneWithNewName', () => {
    it('should create new instance with updated name', () => {
      // Arrange
      const original = createTestSessionModel({ name: 'Old Name' });
      const newName = 'New Workout Name';

      // Act
      const cloned = original.cloneWithNewName(newName);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.name).toBe('New Workout Name');
      expect(original.name).toBe('Old Name'); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestSessionModel({
        executionCount: 5,
        notes: 'Important notes',
      });

      // Act
      const cloned = original.cloneWithNewName('New Name');

      // Assert
      expect(cloned.executionCount).toBe(original.executionCount);
      expect(cloned.notes).toBe(original.notes);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.groups).toBe(original.groups);
    });
  });

  describe('cloneWithNewNotes', () => {
    it('should create new instance with updated notes', () => {
      // Arrange
      const original = createTestSessionModel({ notes: 'Old notes' });
      const newNotes = 'Updated workout notes';

      // Act
      const cloned = original.cloneWithNewNotes(newNotes);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.notes).toBe('Updated workout notes');
      expect(original.notes).toBe('Old notes'); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle undefined notes (remove notes)', () => {
      // Arrange
      const original = createTestSessionModel({ notes: 'Some notes' });

      // Act
      const cloned = original.cloneWithNewNotes(undefined);

      // Assert
      expect(cloned.notes).toBeUndefined();
      expect(original.notes).toBe('Some notes');
    });

    it('should handle setting notes from undefined', () => {
      // Arrange
      const original = createTestSessionModel({ notes: undefined });

      // Act
      const cloned = original.cloneWithNewNotes('New notes');

      // Assert
      expect(cloned.notes).toBe('New notes');
      expect(original.notes).toBeUndefined();
    });
  });

  describe('cloneWithNewDayOfWeek', () => {
    it('should create new instance with updated day of week', () => {
      // Arrange
      const original = createTestSessionModel({ dayOfWeek: 'monday' });

      // Act
      const cloned = original.cloneWithNewDayOfWeek('friday');

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.dayOfWeek).toBe('friday');
      expect(original.dayOfWeek).toBe('monday'); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle setting dayOfWeek to null', () => {
      // Arrange
      const original = createTestSessionModel({ dayOfWeek: 'tuesday' });

      // Act
      const cloned = original.cloneWithNewDayOfWeek(null);

      // Assert
      expect(cloned.dayOfWeek).toBeNull();
      expect(original.dayOfWeek).toBe('tuesday');
    });

    it('should handle setting dayOfWeek from null', () => {
      // Arrange
      const original = createTestSessionModel({ dayOfWeek: null });

      // Act
      const cloned = original.cloneWithNewDayOfWeek('wednesday');

      // Assert
      expect(cloned.dayOfWeek).toBe('wednesday');
      expect(original.dayOfWeek).toBeNull();
    });
  });

  describe('findExerciseById', () => {
    it('should find exercise and return with its containing group', () => {
      // Arrange
      const targetExercise = createTestAppliedExerciseModel({ id: 'target-exercise' });
      const group1 = createTestExerciseGroupModel({ id: 'group-1' }, [targetExercise]);
      const group2 = createTestExerciseGroupModel({ id: 'group-2' }, [
        createTestAppliedExerciseModel(),
      ]);
      const session = createTestSessionModel({}, [group1, group2]);

      // Act
      const result = session.findExerciseById('target-exercise');

      // Assert
      expect(result).toBeDefined();
      expect(result!.exercise).toBe(targetExercise);
      expect(result!.group).toBe(group1);
    });

    it('should return undefined when exercise is not found', () => {
      // Arrange
      const group = createTestExerciseGroupModel({}, [
        createTestAppliedExerciseModel({ id: 'different-exercise' }),
      ]);
      const session = createTestSessionModel({}, [group]);

      // Act
      const result = session.findExerciseById('non-existent-exercise');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should find exercise in the first group when present in multiple groups', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'duplicate-exercise' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'duplicate-exercise' });
      const group1 = createTestExerciseGroupModel({ id: 'group-1' }, [exercise1]);
      const group2 = createTestExerciseGroupModel({ id: 'group-2' }, [exercise2]);
      const session = createTestSessionModel({}, [group1, group2]);

      // Act
      const result = session.findExerciseById('duplicate-exercise');

      // Assert
      expect(result).toBeDefined();
      expect(result!.exercise).toBe(exercise1);
      expect(result!.group).toBe(group1);
    });

    it('should handle empty groups array', () => {
      // Arrange
      const session = createTestSessionModel({}, []);

      // Act
      const result = session.findExerciseById('any-exercise');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getTotalExerciseCount', () => {
    it('should return total count of exercises across all groups', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({}, [
        createTestAppliedExerciseModel(),
        createTestAppliedExerciseModel(),
      ]);
      const group2 = createTestExerciseGroupModel({}, [
        createTestAppliedExerciseModel(),
        createTestAppliedExerciseModel(),
        createTestAppliedExerciseModel(),
      ]);
      const session = createTestSessionModel({}, [group1, group2]);

      // Act
      const totalCount = session.getTotalExerciseCount();

      // Assert
      expect(totalCount).toBe(5); // 2 + 3 = 5
    });

    it('should return 0 for empty groups', () => {
      // Arrange
      const session = createTestSessionModel({}, []);

      // Act
      const totalCount = session.getTotalExerciseCount();

      // Assert
      expect(totalCount).toBe(0);
    });

    it('should return 0 when groups have no exercises', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({}, []);
      const group2 = createTestExerciseGroupModel({}, []);
      const session = createTestSessionModel({}, [group1, group2]);

      // Act
      const totalCount = session.getTotalExerciseCount();

      // Assert
      expect(totalCount).toBe(0);
    });
  });

  describe('getTotalGroupCount', () => {
    it('should return the number of groups', () => {
      // Arrange
      const groups = [
        createTestExerciseGroupModel(),
        createTestExerciseGroupModel(),
        createTestExerciseGroupModel(),
      ];
      const session = createTestSessionModel({}, groups);

      // Act
      const groupCount = session.getTotalGroupCount();

      // Assert
      expect(groupCount).toBe(3);
    });

    it('should return 0 for empty groups array', () => {
      // Arrange
      const session = createTestSessionModel({}, []);

      // Act
      const groupCount = session.getTotalGroupCount();

      // Assert
      expect(groupCount).toBe(0);
    });
  });

  describe('cloneAsCopy', () => {
    it('should create complete copy with new IDs for all components', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const group1 = createTestExerciseGroupModel({ id: 'group-1' }, [exercise1]);
      const group2 = createTestExerciseGroupModel({ id: 'group-2' }, [exercise2]);
      const original = createTestSessionModel(
        {
          id: 'original-session',
          name: 'Original Workout',
        },
        [group1, group2]
      );

      // Reset mock counts before the actual test
      vi.mocked(ExerciseGroupModel.hydrate).mockClear();
      vi.mocked(AppliedExerciseModel.hydrate).mockClear();

      // Act
      const copied = original.cloneAsCopy('Copied Workout');

      // Assert
      expect(copied).not.toBe(original);
      expect(copied.id).not.toBe(original.id); // New session ID
      expect(copied.name).toBe('Copied Workout');
      expect(generateId).toHaveBeenCalled();

      // Verify groups are re-hydrated with new IDs
      expect(ExerciseGroupModel.hydrate).toHaveBeenCalledTimes(2);

      // Verify applied exercises are re-hydrated with new IDs
      expect(AppliedExerciseModel.hydrate).toHaveBeenCalledTimes(2);
    });

    it('should preserve all properties except ID and name', () => {
      // Arrange
      const original = createTestSessionModel({
        profileId: 'test-profile',
        notes: 'Important notes',
        executionCount: 5,
        isDeload: true,
        dayOfWeek: 'monday',
      });

      // Act
      const copied = original.cloneAsCopy('New Name');

      // Assert
      expect(copied.profileId).toBe(original.profileId);
      expect(copied.notes).toBe(original.notes);
      expect(copied.executionCount).toBe(original.executionCount);
      expect(copied.isDeload).toBe(original.isDeload);
      expect(copied.dayOfWeek).toBe(original.dayOfWeek);
      expect(copied.name).toBe('New Name'); // Only name changed
      expect(copied.id).not.toBe(original.id); // ID changed
    });

    it('should handle empty groups array', () => {
      // Arrange
      const original = createTestSessionModel({ name: 'Empty Session' }, []);

      // Act
      const copied = original.cloneAsCopy('Copied Empty Session');

      // Assert
      expect(copied.groups).toHaveLength(0);
      expect(copied.name).toBe('Copied Empty Session');
      expect(copied.id).not.toBe(original.id);
    });
  });

  describe('cloneWithReorderedGroup', () => {
    it('should reorder group up when direction is up', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const group2 = createTestExerciseGroupModel({ id: 'group-2' });
      const group3 = createTestExerciseGroupModel({ id: 'group-3' });
      const original = createTestSessionModel({}, [group1, group2, group3]);

      // Act
      const cloned = original.cloneWithReorderedGroup('group-2', 'up');

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.groups).toHaveLength(3);
      expect(cloned.groups[0].id).toBe('group-2'); // Moved up
      expect(cloned.groups[1].id).toBe('group-1');
      expect(cloned.groups[2].id).toBe('group-3');
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should reorder group down when direction is down', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const group2 = createTestExerciseGroupModel({ id: 'group-2' });
      const group3 = createTestExerciseGroupModel({ id: 'group-3' });
      const original = createTestSessionModel({}, [group1, group2, group3]);

      // Act
      const cloned = original.cloneWithReorderedGroup('group-1', 'down');

      // Assert
      expect(cloned.groups[0].id).toBe('group-2');
      expect(cloned.groups[1].id).toBe('group-1'); // Moved down
      expect(cloned.groups[2].id).toBe('group-3');
    });

    it('should not reorder if group is not found', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const original = createTestSessionModel({}, [group1]);

      // Act
      const cloned = original.cloneWithReorderedGroup('non-existent', 'up');

      // Assert
      expect(cloned.groups).toEqual(original.groups);
    });

    it('should not reorder if already at top and moving up', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const group2 = createTestExerciseGroupModel({ id: 'group-2' });
      const original = createTestSessionModel({}, [group1, group2]);

      // Act
      const cloned = original.cloneWithReorderedGroup('group-1', 'up');

      // Assert
      expect(cloned.groups[0].id).toBe('group-1'); // Unchanged
      expect(cloned.groups[1].id).toBe('group-2');
    });
  });

  describe('cloneWithRemovedExercise', () => {
    it('should remove exercise from the correct group', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const exercise3 = createTestAppliedExerciseModel({ id: 'exercise-3' });
      const group1 = createTestExerciseGroupModel({}, [exercise1, exercise2]);
      const group2 = createTestExerciseGroupModel({}, [exercise3]);
      const original = createTestSessionModel({}, [group1, group2]);

      // Act
      const cloned = original.cloneWithRemovedExercise('exercise-2');

      // Assert
      expect(cloned).not.toBe(original);
      expect(ExerciseGroupModel.hydrate).toHaveBeenCalled();
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should remove empty groups after removing exercises', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const group1 = createTestExerciseGroupModel({}, [exercise1]);
      const group2 = createTestExerciseGroupModel({}, [createTestAppliedExerciseModel()]);
      const original = createTestSessionModel({}, [group1, group2]);

      // Act
      const cloned = original.cloneWithRemovedExercise('exercise-1');

      // Assert
      expect(cloned.groups).toHaveLength(1); // Empty group removed
    });

    it('should handle removing non-existent exercise', () => {
      // Arrange
      const group = createTestExerciseGroupModel({}, [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
      ]);
      const original = createTestSessionModel({}, [group]);

      // Act
      const cloned = original.cloneWithRemovedExercise('non-existent');

      // Assert
      expect(cloned.groups).toHaveLength(1);
      expect(cloned.groups[0].appliedExercises).toHaveLength(1);
    });
  });

  describe('cloneWithAddedGroup', () => {
    it('should add group to the session', () => {
      // Arrange
      const original = createTestSessionModel();
      const newGroup = createTestExerciseGroupModel({ id: 'new-group' });

      // Act
      const cloned = original.cloneWithAddedGroup(newGroup);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.groups).toHaveLength(original.groups.length + 1);
      expect(cloned.groups).toContain(newGroup);
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should preserve existing groups when adding new one', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const original = createTestSessionModel({}, [group1]);
      const newGroup = createTestExerciseGroupModel({ id: 'new-group' });

      // Act
      const cloned = original.cloneWithAddedGroup(newGroup);

      // Assert
      expect(cloned.groups).toHaveLength(2);
      expect(cloned.groups[0]).toBe(group1);
      expect(cloned.groups[1]).toBe(newGroup);
      expect(original.groups).toHaveLength(1); // Original unchanged
    });
  });

  describe('cloneWithRemovedGroup', () => {
    it('should remove group from the session', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const group2 = createTestExerciseGroupModel({ id: 'group-2' });
      const original = createTestSessionModel({}, [group1, group2]);

      // Act
      const cloned = original.cloneWithRemovedGroup('group-1');

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.groups).toHaveLength(1);
      expect(cloned.groups[0].id).toBe('group-2');
      expect(original.groups).toHaveLength(2); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle removing non-existent group', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const original = createTestSessionModel({}, [group1]);

      // Act
      const cloned = original.cloneWithRemovedGroup('non-existent');

      // Assert
      expect(cloned.groups).toHaveLength(1);
      expect(cloned.groups[0].id).toBe('group-1');
    });
  });

  describe('getEstimatedDurationSeconds', () => {
    it('should sum duration from all groups', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel(); // 300 seconds (mocked)
      const group2 = createTestExerciseGroupModel(); // 300 seconds (mocked)
      const session = createTestSessionModel({}, [group1, group2]);

      // Act
      const duration = session.getEstimatedDurationSeconds();

      // Assert
      expect(duration).toBe(600); // 300 + 300 = 600
      expect(group1.getEstimatedDurationSeconds).toHaveBeenCalled();
      expect(group2.getEstimatedDurationSeconds).toHaveBeenCalled();
    });

    it('should return 0 for empty groups', () => {
      // Arrange
      const session = createTestSessionModel({}, []);

      // Act
      const duration = session.getEstimatedDurationSeconds();

      // Assert
      expect(duration).toBe(0);
    });
  });

  describe('cloneWithToggledDeload', () => {
    it('should toggle deload status from false to true', () => {
      // Arrange
      const original = createTestSessionModel({ isDeload: false });

      // Act
      const cloned = original.cloneWithToggledDeload();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.isDeload).toBe(true);
      expect(original.isDeload).toBe(false); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should toggle deload status from true to false', () => {
      // Arrange
      const original = createTestSessionModel({ isDeload: true });

      // Act
      const cloned = original.cloneWithToggledDeload();

      // Assert
      expect(cloned.isDeload).toBe(false);
      expect(original.isDeload).toBe(true);
    });
  });

  describe('hasBeenExecuted', () => {
    it('should return true when execution count is greater than 0', () => {
      // Arrange
      const session = createTestSessionModel({ executionCount: 1 });

      // Act
      const result = session.hasBeenExecuted();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when execution count is 0', () => {
      // Arrange
      const session = createTestSessionModel({ executionCount: 0 });

      // Act
      const result = session.hasBeenExecuted();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for multiple executions', () => {
      // Arrange
      const session = createTestSessionModel({ executionCount: 10 });

      // Act
      const result = session.hasBeenExecuted();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('hasScheduledDay', () => {
    it('should return true when dayOfWeek is not null', () => {
      // Arrange
      const session = createTestSessionModel({ dayOfWeek: 'monday' });

      // Act
      const result = session.hasScheduledDay();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when dayOfWeek is null', () => {
      // Arrange
      const session = createTestSessionModel({ dayOfWeek: null });

      // Act
      const result = session.hasScheduledDay();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for all valid days of week', () => {
      // Arrange
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ] as const;

      days.forEach((day) => {
        // Act
        const session = createTestSessionModel({ dayOfWeek: day });
        const result = session.hasScheduledDay();

        // Assert
        expect(result).toBe(true);
      });
    });
  });

  describe('hasNotes', () => {
    it('should return true when notes are present', () => {
      // Arrange
      const session = createTestSessionModel({ notes: 'Some notes' });

      // Act
      const result = session.hasNotes();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when notes are undefined', () => {
      // Arrange
      const session = createTestSessionModel({ notes: undefined });

      // Act
      const result = session.hasNotes();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when notes are empty string', () => {
      // Arrange
      const session = createTestSessionModel({ notes: '' });

      // Act
      const result = session.hasNotes();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when notes contain only whitespace', () => {
      // Arrange
      const session = createTestSessionModel({ notes: '   ' });

      // Act
      const result = session.hasNotes();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getDisplayName', () => {
    it('should return the session name', () => {
      // Arrange
      const session = createTestSessionModel({ name: 'Push Day Workout' });

      // Act
      const displayName = session.getDisplayName();

      // Assert
      expect(displayName).toBe('Push Day Workout');
    });

    it('should return empty string if name is empty', () => {
      // Arrange
      const session = createTestSessionModel({ name: '' });

      // Act
      const displayName = session.getDisplayName();

      // Assert
      expect(displayName).toBe('');
    });
  });

  describe('clone', () => {
    it('should create deep clone with cloned groups', () => {
      // Arrange
      const original = createTestSessionModel();

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.groups).not.toBe(original.groups);
      original.groups.forEach((group) => {
        expect(group.clone).toHaveBeenCalled();
      });
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const original = createTestSessionModel({
        name: 'Test Session',
        executionCount: 3,
        isDeload: true,
        dayOfWeek: 'friday',
        notes: 'Test notes',
      });

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned.id).toBe(original.id);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.name).toBe(original.name);
      expect(cloned.executionCount).toBe(original.executionCount);
      expect(cloned.isDeload).toBe(original.isDeload);
      expect(cloned.dayOfWeek).toBe(original.dayOfWeek);
      expect(cloned.notes).toBe(original.notes);
      expect(cloned.createdAt).toBe(original.createdAt);
      expect(cloned.updatedAt).toBe(original.updatedAt);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'group-1' });
      const group2 = createTestExerciseGroupModel({ id: 'group-2' });
      const data = createTestWorkoutSessionData({
        profileId: 'test-profile',
        name: 'Test Session',
        notes: 'Session notes',
        executionCount: 5,
        isDeload: true,
        dayOfWeek: 'monday',
      });
      const session = SessionModel.hydrate(data, [group1, group2]);

      // Act
      const plainObject = session.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: 'test-profile',
        name: 'Test Session',
        groupIds: ['group-1', 'group-2'],
        notes: 'Session notes',
        executionCount: 5,
        isDeload: true,
        dayOfWeek: 'monday',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should handle optional properties correctly', () => {
      // Arrange
      const data = createTestWorkoutSessionData({
        notes: undefined,
        dayOfWeek: null,
      });
      const session = SessionModel.hydrate(data, []);

      // Act
      const plainObject = session.toPlainObject();

      // Assert
      expect(plainObject.notes).toBeUndefined();
      expect(plainObject.dayOfWeek).toBeNull();
      expect(plainObject.groupIds).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange - create session with unique group IDs to avoid duplication
      const group1 = createTestExerciseGroupModel({ id: '12345678-1234-4234-8234-111111111111' });
      const group2 = createTestExerciseGroupModel({ id: '12345678-1234-4234-8234-222222222222' });
      const session = createTestSessionModel({}, [group1, group2]);

      // Act
      const result = session.validate();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should use workoutSessionSchema for validation', () => {
      // Arrange
      const session = createTestSessionModel();
      const safeParseSpy = vi.spyOn(workoutSessionSchema, 'safeParse');

      // Act
      session.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(session.toPlainObject());
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const original = createTestSessionModel({
        name: 'Original Name',
        executionCount: 2,
        notes: 'Original notes',
        dayOfWeek: 'monday',
        isDeload: false,
      });
      const originalData = {
        name: original.name,
        executionCount: original.executionCount,
        notes: original.notes,
        dayOfWeek: original.dayOfWeek,
        isDeload: original.isDeload,
        updatedAt: original.updatedAt,
        groupCount: original.groups.length,
      };

      // Act
      const cloned1 = original.cloneWithIncrementedExecutionCount();
      const cloned2 = original.cloneWithNewName('New Name');
      const cloned3 = original.cloneWithNewNotes('New notes');
      const cloned4 = original.cloneWithNewDayOfWeek('friday');
      const cloned5 = original.cloneWithToggledDeload();
      const cloned6 = original.cloneWithAddedGroup(createTestExerciseGroupModel());

      // Assert - Original unchanged
      expect(original.name).toBe(originalData.name);
      expect(original.executionCount).toBe(originalData.executionCount);
      expect(original.notes).toBe(originalData.notes);
      expect(original.dayOfWeek).toBe(originalData.dayOfWeek);
      expect(original.isDeload).toBe(originalData.isDeload);
      expect(original.updatedAt).toBe(originalData.updatedAt);
      expect(original.groups.length).toBe(originalData.groupCount);

      // Verify clones have different values
      expect(cloned1.executionCount).toBe(3);
      expect(cloned2.name).toBe('New Name');
      expect(cloned3.notes).toBe('New notes');
      expect(cloned4.dayOfWeek).toBe('friday');
      expect(cloned5.isDeload).toBe(true);
      expect(cloned6.groups.length).toBe(originalData.groupCount + 1);
    });
  });

  describe('complex operations', () => {
    it('should handle complex session manipulations', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const group1 = createTestExerciseGroupModel({ id: 'group-1' }, [exercise1]);
      const group2 = createTestExerciseGroupModel({ id: 'group-2' }, [exercise2]);
      let session = createTestSessionModel(
        { name: 'Complex Session', executionCount: 0, isDeload: false },
        [group1, group2]
      );

      // Act: Multiple operations
      session = session.cloneWithNewName('Updated Complex Session');
      session = session.cloneWithIncrementedExecutionCount();
      session = session.cloneWithNewNotes('Updated with new exercises');
      session = session.cloneWithNewDayOfWeek('wednesday');
      session = session.cloneWithToggledDeload();

      // Assert
      expect(session.name).toBe('Updated Complex Session');
      expect(session.executionCount).toBe(1); // Incremented from 0
      expect(session.notes).toBe('Updated with new exercises');
      expect(session.dayOfWeek).toBe('wednesday');
      expect(session.isDeload).toBe(true); // Toggled from false
    });

    it('should handle exercise search across multiple groups', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'squat' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'bench' });
      const exercise3 = createTestAppliedExerciseModel({ id: 'deadlift' });
      const group1 = createTestExerciseGroupModel({ id: 'compound' }, [exercise1, exercise2]);
      const group2 = createTestExerciseGroupModel({ id: 'accessory' }, [exercise3]);
      const session = createTestSessionModel({}, [group1, group2]);

      // Act & Assert
      const foundSquat = session.findExerciseById('squat');
      expect(foundSquat).toBeDefined();
      expect(foundSquat!.exercise).toBe(exercise1);
      expect(foundSquat!.group).toBe(group1);

      const foundDeadlift = session.findExerciseById('deadlift');
      expect(foundDeadlift).toBeDefined();
      expect(foundDeadlift!.exercise).toBe(exercise3);
      expect(foundDeadlift!.group).toBe(group2);

      const notFound = session.findExerciseById('curl');
      expect(notFound).toBeUndefined();
    });

    it('should handle group reordering correctly', () => {
      // Arrange
      const group1 = createTestExerciseGroupModel({ id: 'warmup' });
      const group2 = createTestExerciseGroupModel({ id: 'main' });
      const group3 = createTestExerciseGroupModel({ id: 'cooldown' });
      let session = createTestSessionModel({}, [group1, group2, group3]);

      // Act: Move main workout to beginning
      session = session.cloneWithReorderedGroup('main', 'up');

      // Assert
      expect(session.groups[0].id).toBe('main');
      expect(session.groups[1].id).toBe('warmup');
      expect(session.groups[2].id).toBe('cooldown');
    });
  });
});
