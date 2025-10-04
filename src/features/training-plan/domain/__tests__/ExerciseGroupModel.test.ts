import { describe, expect, it, vi } from 'vitest';

import { generateId } from '@/lib';
import { exerciseGroupSchema } from '@/shared/types';
import {
  createTestAppliedExerciseData,
  createTestAppliedExerciseModel,
  createTestExerciseGroupData,
  createTestExerciseGroupModel,
} from '@/test-factories';

import { AppliedExerciseModel } from '../AppliedExerciseModel';
import { ExerciseGroupModel } from '../ExerciseGroupModel';
import { AMRAPGroupModel, CircuitGroupModel, EMOMGroupModel, SupersetGroupModel } from '../groups';

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

vi.mock('../groups', () => ({
  SupersetGroupModel: vi.fn().mockImplementation((props, appliedExercises) => {
    return { type: 'superset', props, appliedExercises };
  }),
  CircuitGroupModel: vi.fn().mockImplementation((props, appliedExercises) => {
    return { type: 'circuit', props, appliedExercises };
  }),
  EMOMGroupModel: vi.fn().mockImplementation((props, appliedExercises) => {
    return { type: 'emom', props, appliedExercises };
  }),
  AMRAPGroupModel: vi.fn().mockImplementation((props, appliedExercises) => {
    return { type: 'amrap', props, appliedExercises };
  }),
}));

describe('ExerciseGroupModel', () => {
  describe('constructor', () => {
    it('should create ExerciseGroupModel with basic properties', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'single' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = new ExerciseGroupModel(data, appliedExercises);

      // Assert
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.type).toBe('single');
      expect(model.appliedExercises).toBe(appliedExercises);
      expect(model.restTimeSeconds).toBe(data.restTimeSeconds);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle EMOM group with durationMinutes', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 15,
      });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = new ExerciseGroupModel(data, appliedExercises);

      // Assert
      expect(model.type).toBe('emom');
      expect(model.durationMinutes).toBe(15);
    });

    it('should handle Circuit group with rounds', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'circuit',
        rounds: { min: 3, max: 5, direction: 'asc' },
      });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = new ExerciseGroupModel(data, appliedExercises);

      // Assert
      expect(model.type).toBe('circuit');
      expect(model.rounds).toEqual({ min: 3, max: 5, direction: 'asc' });
    });

    it('should handle optional restTimeSeconds', () => {
      // Arrange
      const data = createTestExerciseGroupData({ restTimeSeconds: undefined });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = new ExerciseGroupModel(data, appliedExercises);

      // Assert
      expect(model.restTimeSeconds).toBeUndefined();
    });
  });

  describe('hydrate - polymorphic factory', () => {
    it('should create base ExerciseGroupModel for superset type', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = ExerciseGroupModel.hydrate(data, appliedExercises);

      // Assert - simplified factory returns base class for now
      expect(model).toBeInstanceOf(ExerciseGroupModel);
      expect(model.type).toBe('superset');
    });

    it('should create base ExerciseGroupModel for circuit type', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = ExerciseGroupModel.hydrate(data, appliedExercises);

      // Assert - simplified factory returns base class for now
      expect(model).toBeInstanceOf(ExerciseGroupModel);
      expect(model.type).toBe('circuit');
    });

    it('should create base ExerciseGroupModel for emom type', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'emom' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = ExerciseGroupModel.hydrate(data, appliedExercises);

      // Assert - simplified factory returns base class for now
      expect(model).toBeInstanceOf(ExerciseGroupModel);
      expect(model.type).toBe('emom');
    });

    it('should create base ExerciseGroupModel for amrap type', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'amrap' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = ExerciseGroupModel.hydrate(data, appliedExercises);

      // Assert - simplified factory returns base class for now
      expect(model).toBeInstanceOf(ExerciseGroupModel);
      expect(model.type).toBe('amrap');
    });

    it('should create base ExerciseGroupModel for single type', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'single' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = ExerciseGroupModel.hydrate(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(ExerciseGroupModel);
      expect(model.type).toBe('single');
    });

    it('should create base ExerciseGroupModel for stretching type', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'stretching' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = ExerciseGroupModel.hydrate(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(ExerciseGroupModel);
      expect(model.type).toBe('stretching');
    });

    it('should create base ExerciseGroupModel for warmup type', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'warmup' });
      const appliedExercises = [createTestAppliedExerciseModel()];

      // Act
      const model = ExerciseGroupModel.hydrate(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(ExerciseGroupModel);
      expect(model.type).toBe('warmup');
    });

    it('should create base ExerciseGroupModel for any type with simplified factory', () => {
      // Arrange - test with all valid exercise group types
      const validTypes: ExerciseGroupData['type'][] = [
        'single',
        'superset',
        'circuit',
        'emom',
        'amrap',
        'warmup',
        'stretching',
      ];

      validTypes.forEach((type) => {
        const data = createTestExerciseGroupData({ type });
        const appliedExercises = [createTestAppliedExerciseModel()];

        // Act
        const model = ExerciseGroupModel.hydrate(data, appliedExercises);

        // Assert - simplified factory always succeeds and returns base class
        expect(model).toBeInstanceOf(ExerciseGroupModel);
        expect(model.type).toBe(type);
      });
    });
  });

  describe('cloneWithReorderedExercise', () => {
    it('should reorder exercise up when direction is up', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const exercise3 = createTestAppliedExerciseModel({ id: 'exercise-3' });
      const original = createTestExerciseGroupModel({}, [exercise1, exercise2, exercise3]);

      // Act
      const cloned = original.cloneWithReorderedExercise('exercise-2', 'up');

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.appliedExercises).toHaveLength(3);
      expect(cloned.appliedExercises[0].id).toBe('exercise-2'); // Moved up
      expect(cloned.appliedExercises[1].id).toBe('exercise-1');
      expect(cloned.appliedExercises[2].id).toBe('exercise-3');
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should reorder exercise down when direction is down', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const exercise3 = createTestAppliedExerciseModel({ id: 'exercise-3' });
      const original = createTestExerciseGroupModel({}, [exercise1, exercise2, exercise3]);

      // Act
      const cloned = original.cloneWithReorderedExercise('exercise-1', 'down');

      // Assert
      expect(cloned.appliedExercises[0].id).toBe('exercise-2');
      expect(cloned.appliedExercises[1].id).toBe('exercise-1'); // Moved down
      expect(cloned.appliedExercises[2].id).toBe('exercise-3');
    });

    it('should not reorder if exercise is not found', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const original = createTestExerciseGroupModel({}, [exercise1]);

      // Act
      const cloned = original.cloneWithReorderedExercise('non-existent', 'up');

      // Assert
      expect(cloned.appliedExercises).toEqual(original.appliedExercises);
    });

    it('should not reorder if already at top and moving up', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const original = createTestExerciseGroupModel({}, [exercise1, exercise2]);

      // Act
      const cloned = original.cloneWithReorderedExercise('exercise-1', 'up');

      // Assert
      expect(cloned.appliedExercises[0].id).toBe('exercise-1'); // Unchanged
      expect(cloned.appliedExercises[1].id).toBe('exercise-2');
    });

    it('should not reorder if already at bottom and moving down', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const original = createTestExerciseGroupModel({}, [exercise1, exercise2]);

      // Act
      const cloned = original.cloneWithReorderedExercise('exercise-2', 'down');

      // Assert
      expect(cloned.appliedExercises[0].id).toBe('exercise-1');
      expect(cloned.appliedExercises[1].id).toBe('exercise-2'); // Unchanged
    });
  });

  describe('cloneWithAddedExercise', () => {
    it('should add exercise to the group', () => {
      // Arrange
      const original = createTestExerciseGroupModel();
      const newExercise = createTestAppliedExerciseModel({ id: 'new-exercise' });

      // Act
      const cloned = original.cloneWithAddedExercise(newExercise);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.appliedExercises).toHaveLength(original.appliedExercises.length + 1);
      expect(cloned.appliedExercises).toContain(newExercise);
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should preserve original exercises when adding new one', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const original = createTestExerciseGroupModel({}, [exercise1]);
      const newExercise = createTestAppliedExerciseModel({ id: 'new-exercise' });

      // Act
      const cloned = original.cloneWithAddedExercise(newExercise);

      // Assert
      expect(cloned.appliedExercises).toHaveLength(2);
      expect(cloned.appliedExercises[0]).toBe(exercise1);
      expect(cloned.appliedExercises[1]).toBe(newExercise);
      expect(original.appliedExercises).toHaveLength(1); // Original unchanged
    });
  });

  describe('cloneWithRemovedExercise', () => {
    it('should remove exercise from the group', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const original = createTestExerciseGroupModel({}, [exercise1, exercise2]);

      // Act
      const cloned = original.cloneWithRemovedExercise('exercise-1');

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.appliedExercises).toHaveLength(1);
      expect(cloned.appliedExercises[0].id).toBe('exercise-2');
      expect(original.appliedExercises).toHaveLength(2); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle removing non-existent exercise', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const original = createTestExerciseGroupModel({}, [exercise1]);

      // Act
      const cloned = original.cloneWithRemovedExercise('non-existent');

      // Assert
      expect(cloned.appliedExercises).toHaveLength(1);
      expect(cloned.appliedExercises[0].id).toBe('exercise-1');
    });

    it('should handle removing all exercises', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const original = createTestExerciseGroupModel({}, [exercise1]);

      // Act
      const cloned = original.cloneWithRemovedExercise('exercise-1');

      // Assert
      expect(cloned.appliedExercises).toHaveLength(0);
    });
  });

  describe('cloneWithNewRestTime', () => {
    it('should update rest time', () => {
      // Arrange
      const original = createTestExerciseGroupModel({ restTimeSeconds: 60 });

      // Act
      const cloned = original.cloneWithNewRestTime(120);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.restTimeSeconds).toBe(120);
      expect(original.restTimeSeconds).toBe(60); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle removing rest time by setting undefined', () => {
      // Arrange
      const original = createTestExerciseGroupModel({ restTimeSeconds: 90 });

      // Act
      const cloned = original.cloneWithNewRestTime(undefined);

      // Assert
      expect(cloned.restTimeSeconds).toBeUndefined();
      expect(original.restTimeSeconds).toBe(90);
    });
  });

  describe('getExerciseCount', () => {
    it('should return the number of applied exercises', () => {
      // Arrange
      const exercises = [
        createTestAppliedExerciseModel(),
        createTestAppliedExerciseModel(),
        createTestAppliedExerciseModel(),
      ];
      const model = createTestExerciseGroupModel({}, exercises);

      // Act
      const count = model.getExerciseCount();

      // Assert
      expect(count).toBe(3);
    });

    it('should return 0 for empty exercise list', () => {
      // Arrange
      const model = createTestExerciseGroupModel({}, []);

      // Act
      const count = model.getExerciseCount();

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('getEstimatedDurationSeconds', () => {
    it('should calculate duration based on exercises and rest time', () => {
      // Arrange
      const exercises = [
        createTestAppliedExerciseModel(), // 3 sets * 60 seconds = 180
        createTestAppliedExerciseModel(), // 3 sets * 60 seconds = 180
      ];
      const model = createTestExerciseGroupModel({ restTimeSeconds: 120 }, exercises);

      // Act
      const duration = model.getEstimatedDurationSeconds();

      // Assert
      expect(duration).toBe(480); // (3*60*2) + 120 = 360 + 120 = 480
    });

    it('should handle undefined rest time', () => {
      // Arrange
      const exercises = [createTestAppliedExerciseModel()]; // 3 sets * 60 seconds = 180
      const model = createTestExerciseGroupModel({ restTimeSeconds: undefined }, exercises);

      // Act
      const duration = model.getEstimatedDurationSeconds();

      // Assert
      expect(duration).toBe(180); // 3*60 + 0 = 180
    });

    it('should handle empty exercise list', () => {
      // Arrange
      const model = createTestExerciseGroupModel({ restTimeSeconds: 60 }, []);

      // Act
      const duration = model.getEstimatedDurationSeconds();

      // Assert
      expect(duration).toBe(60); // 0 + 60 = 60
    });
  });

  describe('hasCustomRestTime', () => {
    it('should return true when restTimeSeconds is defined', () => {
      // Arrange
      const model = createTestExerciseGroupModel({ restTimeSeconds: 90 });

      // Act
      const result = model.hasCustomRestTime();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when restTimeSeconds is undefined', () => {
      // Arrange
      const model = createTestExerciseGroupModel({ restTimeSeconds: undefined });

      // Act
      const result = model.hasCustomRestTime();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when restTimeSeconds is 0', () => {
      // Arrange
      const model = createTestExerciseGroupModel({ restTimeSeconds: 0 });

      // Act
      const result = model.hasCustomRestTime();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('hasDuration', () => {
    it('should return true when durationMinutes is defined', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'emom', durationMinutes: 10 });
      const model = new ExerciseGroupModel(data, []);

      // Act
      const result = model.hasDuration();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when durationMinutes is undefined', () => {
      // Arrange
      const model = createTestExerciseGroupModel({ type: 'single' });

      // Act
      const result = model.hasDuration();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasRounds', () => {
    it('should return true when rounds is defined', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'circuit',
        rounds: { min: 3, max: 5, direction: 'asc' },
      });
      const model = new ExerciseGroupModel(data, []);

      // Act
      const result = model.hasRounds();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when rounds is undefined', () => {
      // Arrange
      const model = createTestExerciseGroupModel({ type: 'single' });

      // Act
      const result = model.hasRounds();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getType', () => {
    it('should return the group type', () => {
      // Arrange
      const model = createTestExerciseGroupModel({ type: 'superset' });

      // Act
      const type = model.getType();

      // Assert
      expect(type).toBe('superset');
    });

    it('should return correct type for different group types', () => {
      // Arrange
      const types = ['single', 'circuit', 'emom', 'amrap', 'warmup', 'stretching'] as const;

      types.forEach((type) => {
        // Act
        const model = createTestExerciseGroupModel({ type });
        const result = model.getType();

        // Assert
        expect(result).toBe(type);
      });
    });
  });

  describe('clone', () => {
    it('should create deep clone with cloned applied exercises', () => {
      // Arrange
      const original = createTestExerciseGroupModel();

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.appliedExercises).not.toBe(original.appliedExercises);
      original.appliedExercises.forEach((exercise) => {
        expect(exercise.clone).toHaveBeenCalled();
      });
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const original = createTestExerciseGroupModel({
        profileId: 'test-profile',
        type: 'circuit',
        restTimeSeconds: 120,
      });

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned.id).toBe(original.id);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.type).toBe(original.type);
      expect(cloned.restTimeSeconds).toBe(original.restTimeSeconds);
      expect(cloned.createdAt).toBe(original.createdAt);
      expect(cloned.updatedAt).toBe(original.updatedAt);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object for basic group', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const data = createTestExerciseGroupData({
        profileId: 'test-profile',
        type: 'single',
        restTimeSeconds: 90,
      });
      const model = new ExerciseGroupModel(data, [exercise1, exercise2]);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: 'test-profile',
        type: 'single',
        appliedExerciseIds: ['exercise-1', 'exercise-2'],
        restTimeSeconds: 90,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should include durationMinutes for EMOM groups', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 15,
      });
      const model = new ExerciseGroupModel(data, []);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.durationMinutes).toBe(15);
    });

    it('should include rounds for Circuit groups', () => {
      // Arrange
      const rounds = { min: 3, max: 5, direction: 'asc' as const };
      const data = createTestExerciseGroupData({
        type: 'circuit',
        rounds,
      });
      const model = new ExerciseGroupModel(data, []);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.rounds).toEqual(rounds);
    });

    it('should handle undefined optional properties', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'single',
        restTimeSeconds: undefined,
      });
      const model = new ExerciseGroupModel(data, []);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.restTimeSeconds).toBeUndefined();
      expect('durationMinutes' in plainObject).toBe(false);
      expect('rounds' in plainObject).toBe(false);
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange - use single group type with only one exercise (as per business rule)
      const singleAppliedExercise = createTestAppliedExerciseModel();
      const model = createTestExerciseGroupModel({ type: 'single' }, [singleAppliedExercise]);

      // Act
      const result = model.validate();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should use exerciseGroupSchema for validation', () => {
      // Arrange
      const model = createTestExerciseGroupModel();
      const safeParseSpy = vi.spyOn(exerciseGroupSchema, 'safeParse');

      // Act
      model.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(model.toPlainObject());
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const original = createTestExerciseGroupModel(
        {
          restTimeSeconds: 90,
        },
        [exercise1, exercise2]
      );
      const originalData = {
        exerciseCount: original.appliedExercises.length,
        restTimeSeconds: original.restTimeSeconds,
        updatedAt: original.updatedAt,
      };

      // Act
      const cloned1 = original.cloneWithReorderedExercise('exercise-2', 'up');
      const cloned2 = original.cloneWithAddedExercise(
        createTestAppliedExerciseModel({ id: 'new-exercise' })
      );
      const cloned3 = original.cloneWithRemovedExercise('exercise-1');
      const cloned4 = original.cloneWithNewRestTime(120);

      // Assert
      expect(original.appliedExercises.length).toBe(originalData.exerciseCount);
      expect(original.restTimeSeconds).toBe(originalData.restTimeSeconds);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify clones have different values
      expect(cloned1.appliedExercises[0].id).toBe('exercise-2'); // Reordered
      expect(cloned2.appliedExercises.length).toBe(3); // Added exercise
      expect(cloned3.appliedExercises.length).toBe(1); // Removed exercise
      expect(cloned4.restTimeSeconds).toBe(120); // Changed rest time
    });
  });

  describe('applied exercise management', () => {
    it('should maintain correct exercise-to-group relationship', () => {
      // Arrange
      const exercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1', profileId: 'profile-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2', profileId: 'profile-1' }),
      ];
      const data = createTestExerciseGroupData({ profileId: 'profile-1' });

      // Act
      const model = new ExerciseGroupModel(data, exercises);

      // Assert
      expect(model.appliedExercises).toBe(exercises);
      expect(model.appliedExercises).toHaveLength(2);
      expect(model.getExerciseCount()).toBe(2);
    });

    it('should handle complex exercise manipulations', () => {
      // Arrange
      const exercise1 = createTestAppliedExerciseModel({ id: 'exercise-1' });
      const exercise2 = createTestAppliedExerciseModel({ id: 'exercise-2' });
      const exercise3 = createTestAppliedExerciseModel({ id: 'exercise-3' });
      let model = createTestExerciseGroupModel({}, [exercise1, exercise2]);

      // Act: Add, reorder, then remove
      model = model.cloneWithAddedExercise(exercise3); // [1, 2, 3]
      model = model.cloneWithReorderedExercise('exercise-3', 'up'); // [1, 3, 2]
      model = model.cloneWithRemovedExercise('exercise-1'); // [3, 2]

      // Assert
      expect(model.appliedExercises).toHaveLength(2);
      expect(model.appliedExercises[0].id).toBe('exercise-3');
      expect(model.appliedExercises[1].id).toBe('exercise-2');
    });
  });

  describe('edge cases', () => {
    it('should handle empty applied exercises array', () => {
      // Arrange
      const data = createTestExerciseGroupData();

      // Act
      const model = new ExerciseGroupModel(data, []);

      // Assert
      expect(model.appliedExercises).toHaveLength(0);
      expect(model.getExerciseCount()).toBe(0);
      expect(model.getEstimatedDurationSeconds()).toBeGreaterThanOrEqual(0);
    });

    it('should handle single exercise operations', () => {
      // Arrange
      const exercise = createTestAppliedExerciseModel({ id: 'single-exercise' });
      const model = createTestExerciseGroupModel({}, [exercise]);

      // Act & Assert - reordering should not change anything
      const reordered = model.cloneWithReorderedExercise('single-exercise', 'up');
      expect(reordered.appliedExercises[0].id).toBe('single-exercise');

      // Act & Assert - can still add/remove
      const withAdded = model.cloneWithAddedExercise(
        createTestAppliedExerciseModel({ id: 'new-exercise' })
      );
      expect(withAdded.appliedExercises).toHaveLength(2);

      const withRemoved = model.cloneWithRemovedExercise('single-exercise');
      expect(withRemoved.appliedExercises).toHaveLength(0);
    });
  });
});
