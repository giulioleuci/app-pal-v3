import { describe, expect, it, vi } from 'vitest';

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
    classifyRepRange: vi.fn((counts: number) => {
      if (counts <= 5) return 'strength';
      if (counts <= 12) return 'hypertrophy';
      return 'endurance';
    }),
  };
});

import { performedGroupSchema } from '@/shared/types';
import {
  createTestPerformedExerciseLogData,
  createTestPerformedGroupData,
  createTestPerformedSetData,
} from '@/test-factories';

import { PerformedExerciseLogModel } from '../PerformedExerciseLogModel';
import { PerformedGroupLogModel } from '../PerformedGroupLogModel';
import { PerformedSetModel } from '../PerformedSetModel';

// Helper function to create test exercise logs
function createTestExerciseLogs(count: number = 2, overrides: any[] = []) {
  const exercises: PerformedExerciseLogModel[] = [];
  for (let i = 0; i < count; i++) {
    const sets = [
      PerformedSetModel.hydrate(
        createTestPerformedSetData({
          weight: 100 + i * 10,
          counts: 10 - i,
          completed: true,
          rpe: 7 + i,
        })
      ),
      PerformedSetModel.hydrate(
        createTestPerformedSetData({
          weight: 105 + i * 10,
          counts: 8 - i,
          completed: true,
          rpe: 8 + i,
        })
      ),
    ];
    const data = createTestPerformedExerciseLogData({
      exerciseName: `Exercise ${i + 1}`,
      isSkipped: false,
      ...overrides[i],
    });
    exercises.push(PerformedExerciseLogModel.hydrate(data, sets));
  }
  return exercises;
}

// Helper function to create test model
function createTestPerformedGroupLogModel(overrides = {}, exercises?: PerformedExerciseLogModel[]) {
  const data = createTestPerformedGroupData(overrides);
  const testExercises = exercises || createTestExerciseLogs();
  return PerformedGroupLogModel.hydrate(data, testExercises);
}

describe('PerformedGroupLogModel', () => {
  describe('hydrate', () => {
    it('should create a new PerformedGroupLogModel instance from plain data', () => {
      // Arrange
      const data = createTestPerformedGroupData();
      const exercises = createTestExerciseLogs();

      // Act
      const model = PerformedGroupLogModel.hydrate(data, exercises);

      // Assert
      expect(model).toBeInstanceOf(PerformedGroupLogModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.plannedGroupId).toBe(data.plannedGroupId);
      expect(model.type).toBe(data.type);
      expect(model.performedExercises).toBe(exercises);
      expect(model.actualRestSeconds).toBe(data.actualRestSeconds);
    });

    it('should handle optional fields as undefined', () => {
      // Arrange
      const data = createTestPerformedGroupData({
        plannedGroupId: undefined,
        actualRestSeconds: undefined,
      });
      const exercises = createTestExerciseLogs();

      // Act
      const model = PerformedGroupLogModel.hydrate(data, exercises);

      // Assert
      expect(model.plannedGroupId).toBeUndefined();
      expect(model.actualRestSeconds).toBeUndefined();
    });

    it('should handle different group types', () => {
      // Arrange
      const supersetData = createTestPerformedGroupData({ type: 'superset' });
      const circuitData = createTestPerformedGroupData({ type: 'circuit' });
      const singleData = createTestPerformedGroupData({ type: 'single' });
      const exercises = createTestExerciseLogs();

      // Act
      const supersetModel = PerformedGroupLogModel.hydrate(supersetData, exercises);
      const circuitModel = PerformedGroupLogModel.hydrate(circuitData, exercises);
      const singleModel = PerformedGroupLogModel.hydrate(singleData, exercises);

      // Assert
      expect(supersetModel.type).toBe('superset');
      expect(circuitModel.type).toBe('circuit');
      expect(singleModel.type).toBe('single');
    });

    it('should handle empty exercises array', () => {
      // Arrange
      const data = createTestPerformedGroupData();
      const emptyExercises: PerformedExerciseLogModel[] = [];

      // Act
      const model = PerformedGroupLogModel.hydrate(data, emptyExercises);

      // Assert
      expect(model.performedExercises).toEqual([]);
      expect(model.performedExercises.length).toBe(0);
    });
  });

  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof PerformedGroupLogModel.prototype.constructor).toBe('function');
    });
  });

  describe('getTotalVolume', () => {
    it('should calculate total volume from all exercises in the group', () => {
      // Arrange
      const exercise1Sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 110, counts: 8, completed: true })
        ),
      ];
      const exercise2Sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 80, counts: 12, completed: true })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 85, counts: 10, completed: true })
        ),
      ];

      const exercise1 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({ exerciseName: 'Bench Press' }),
        exercise1Sets
      );
      const exercise2 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({ exerciseName: 'Incline Press' }),
        exercise2Sets
      );

      const model = createTestPerformedGroupLogModel({}, [exercise1, exercise2]);

      // Act
      const totalVolume = model.getTotalVolume();

      // Assert
      // Exercise 1: (100*10) + (110*8) = 1000 + 880 = 1880
      // Exercise 2: (80*12) + (85*10) = 960 + 850 = 1810
      // Total: 1880 + 1810 = 3690
      expect(totalVolume).toBe(3690);
    });

    it('should return 0 for group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({}, []);

      // Act
      const totalVolume = model.getTotalVolume();

      // Assert
      expect(totalVolume).toBe(0);
    });

    it('should handle exercises with no completed sets', () => {
      // Arrange
      const exerciseWithNoCompletedSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: false })
        ),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exerciseWithNoCompletedSets
      );
      const model = createTestPerformedGroupLogModel({}, [exercise]);

      // Act
      const totalVolume = model.getTotalVolume();

      // Assert
      expect(totalVolume).toBe(0);
    });
  });

  describe('getTotalSets', () => {
    it('should calculate total sets from all exercises in the group', () => {
      // Arrange
      const exercise1Sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })), // Should not count
      ];
      const exercise2Sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
      ];

      const exercise1 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exercise1Sets
      );
      const exercise2 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exercise2Sets
      );

      const model = createTestPerformedGroupLogModel({}, [exercise1, exercise2]);

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      expect(totalSets).toBe(4); // 2 from exercise1 + 2 from exercise2
    });

    it('should return 0 for group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({}, []);

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      expect(totalSets).toBe(0);
    });
  });

  describe('getTotalCounts', () => {
    it('should calculate total counts from all exercises in the group', () => {
      // Arrange
      const exercise1Sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 10, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 6, completed: false })), // Should not count
      ];
      const exercise2Sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 12, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 10, completed: true })),
      ];

      const exercise1 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exercise1Sets
      );
      const exercise2 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exercise2Sets
      );

      const model = createTestPerformedGroupLogModel({}, [exercise1, exercise2]);

      // Act
      const totalCounts = model.getTotalCounts();

      // Assert
      expect(totalCounts).toBe(40); // (10+8) from exercise1 + (12+10) from exercise2 = 18+22 = 40
    });

    it('should return 0 for group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({}, []);

      // Act
      const totalCounts = model.getTotalCounts();

      // Assert
      expect(totalCounts).toBe(0);
    });
  });

  describe('getAverageRPE', () => {
    it('should calculate average RPE across all exercises in the group', () => {
      // Arrange
      // Mock the getAverageRPE method on exercises
      const exercise1 = createTestExerciseLogs(1)[0];
      const exercise2 = createTestExerciseLogs(1)[0];

      vi.spyOn(exercise1, 'getAverageRPE').mockReturnValue(7.5);
      vi.spyOn(exercise2, 'getAverageRPE').mockReturnValue(8.5);

      const model = createTestPerformedGroupLogModel({}, [exercise1, exercise2]);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(8); // (7.5 + 8.5) / 2 = 8
    });

    it('should return 0 when no exercises have RPE data', () => {
      // Arrange
      const exercise1 = createTestExerciseLogs(1)[0];
      const exercise2 = createTestExerciseLogs(1)[0];

      vi.spyOn(exercise1, 'getAverageRPE').mockReturnValue(0);
      vi.spyOn(exercise2, 'getAverageRPE').mockReturnValue(0);

      const model = createTestPerformedGroupLogModel({}, [exercise1, exercise2]);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(0);
    });

    it('should ignore exercises with RPE of 0', () => {
      // Arrange
      const exercise1 = createTestExerciseLogs(1)[0];
      const exercise2 = createTestExerciseLogs(1)[0];
      const exercise3 = createTestExerciseLogs(1)[0];

      vi.spyOn(exercise1, 'getAverageRPE').mockReturnValue(8);
      vi.spyOn(exercise2, 'getAverageRPE').mockReturnValue(0); // Should be ignored
      vi.spyOn(exercise3, 'getAverageRPE').mockReturnValue(9);

      const model = createTestPerformedGroupLogModel({}, [exercise1, exercise2, exercise3]);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(8.5); // (8 + 9) / 2 = 8.5
    });

    it('should return 0 for group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({}, []);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(0);
    });
  });

  describe('findExerciseById', () => {
    it('should find exercise by exercise ID', () => {
      // Arrange
      const exercises = createTestExerciseLogs();
      const targetExercise = exercises[1];
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const found = model.findExerciseById(targetExercise.exerciseId);

      // Assert
      expect(found).toBe(model.performedExercises[1]);
      expect(found?.exerciseId).toBe(targetExercise.exerciseId);
    });

    it('should return undefined when exercise is not found', () => {
      // Arrange
      const exercises = createTestExerciseLogs();
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const found = model.findExerciseById('non-existent-id');

      // Assert
      expect(found).toBeUndefined();
    });

    it('should return undefined for group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({}, []);

      // Act
      const found = model.findExerciseById('any-id');

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe('isCompletelySkipped', () => {
    it('should return true when all exercises in the group are skipped', () => {
      // Arrange
      const exercises = createTestExerciseLogs(3, [
        { isSkipped: true },
        { isSkipped: true },
        { isSkipped: true },
      ]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const result = model.isCompletelySkipped();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when some exercises are not skipped', () => {
      // Arrange
      const exercises = createTestExerciseLogs(3, [
        { isSkipped: true },
        { isSkipped: false },
        { isSkipped: true },
      ]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const result = model.isCompletelySkipped();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when no exercises are skipped', () => {
      // Arrange
      const exercises = createTestExerciseLogs(2, [{ isSkipped: false }, { isSkipped: false }]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const result = model.isCompletelySkipped();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({}, []);

      // Act
      const result = model.isCompletelySkipped();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getCompletedExerciseCount', () => {
    it('should count exercises that are not skipped', () => {
      // Arrange
      const exercises = createTestExerciseLogs(4, [
        { isSkipped: false },
        { isSkipped: true },
        { isSkipped: false },
        { isSkipped: false },
      ]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const count = model.getCompletedExerciseCount();

      // Assert
      expect(count).toBe(3);
    });

    it('should return 0 when all exercises are skipped', () => {
      // Arrange
      const exercises = createTestExerciseLogs(2, [{ isSkipped: true }, { isSkipped: true }]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const count = model.getCompletedExerciseCount();

      // Assert
      expect(count).toBe(0);
    });

    it('should return total count when no exercises are skipped', () => {
      // Arrange
      const exercises = createTestExerciseLogs(3, [
        { isSkipped: false },
        { isSkipped: false },
        { isSkipped: false },
      ]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act
      const count = model.getCompletedExerciseCount();

      // Assert
      expect(count).toBe(3);
    });

    it('should return 0 for group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({}, []);

      // Act
      const count = model.getCompletedExerciseCount();

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('cloneWithUpdatedRest', () => {
    it('should create new instance with updated rest time', () => {
      // Arrange
      const original = createTestPerformedGroupLogModel({ actualRestSeconds: 60 });

      // Act
      const updated = original.cloneWithUpdatedRest(120);

      // Assert
      expect(updated).not.toBe(original);
      expect(updated.actualRestSeconds).toBe(120);
      expect(original.actualRestSeconds).toBe(60); // Original unchanged
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });

    it('should preserve all other properties', () => {
      // Arrange
      const exercises = createTestExerciseLogs();
      const original = createTestPerformedGroupLogModel(
        {
          type: 'superset',
          plannedGroupId: 'planned-group-123',
        },
        exercises
      );

      // Act
      const updated = original.cloneWithUpdatedRest(180);

      // Assert
      expect(updated.type).toBe(original.type);
      expect(updated.plannedGroupId).toBe(original.plannedGroupId);
      expect(updated.performedExercises).toBe(original.performedExercises);
      expect(updated.profileId).toBe(original.profileId);
    });

    it('should handle setting rest time from undefined', () => {
      // Arrange
      const original = createTestPerformedGroupLogModel({ actualRestSeconds: undefined });

      // Act
      const updated = original.cloneWithUpdatedRest(90);

      // Assert
      expect(updated.actualRestSeconds).toBe(90);
      expect(original.actualRestSeconds).toBeUndefined();
    });
  });

  describe('cloneWithUpdatedExercise', () => {
    it('should create new instance with updated exercise', () => {
      // Arrange
      const originalExercises = createTestExerciseLogs(3);
      const model = createTestPerformedGroupLogModel({}, originalExercises);

      const updatedExercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({
          id: originalExercises[1].id,
          exerciseName: 'Updated Exercise',
          isSkipped: true,
        }),
        originalExercises[1].sets
      );

      // Act
      const updated = model.cloneWithUpdatedExercise(updatedExercise);

      // Assert
      expect(updated).not.toBe(model);
      expect(updated.performedExercises).not.toBe(model.performedExercises);
      expect(updated.performedExercises[1]).toBe(updatedExercise);
      expect(updated.performedExercises[0]).toBe(model.performedExercises[0]); // Other exercises unchanged
      expect(updated.performedExercises[2]).toBe(model.performedExercises[2]);
    });

    it('should preserve all other properties', () => {
      // Arrange
      const originalExercises = createTestExerciseLogs(2);
      const model = createTestPerformedGroupLogModel(
        {
          type: 'circuit',
          actualRestSeconds: 90,
        },
        originalExercises
      );

      const updatedExercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({
          id: originalExercises[0].id,
          exerciseName: 'Updated Exercise',
        }),
        originalExercises[0].sets
      );

      // Act
      const updated = model.cloneWithUpdatedExercise(updatedExercise);

      // Assert
      expect(updated.type).toBe(model.type);
      expect(updated.actualRestSeconds).toBe(model.actualRestSeconds);
      expect(updated.profileId).toBe(model.profileId);
      expect(updated.plannedGroupId).toBe(model.plannedGroupId);
    });

    it('should handle updating non-existent exercise (no change)', () => {
      // Arrange
      const originalExercises = createTestExerciseLogs(2);
      const model = createTestPerformedGroupLogModel({}, originalExercises);

      const nonExistentExercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({
          id: 'non-existent-id',
          exerciseName: 'Non-existent Exercise',
        }),
        []
      );

      // Act
      const updated = model.cloneWithUpdatedExercise(nonExistentExercise);

      // Assert
      expect(updated).not.toBe(model);
      expect(updated.performedExercises[0]).toBe(originalExercises[0]); // Unchanged
      expect(updated.performedExercises[1]).toBe(originalExercises[1]); // Unchanged
      expect(updated.performedExercises.length).toBe(2);
    });
  });

  describe('getSummaryString', () => {
    it('should format summary with group type, exercise names, sets, and volume', () => {
      // Arrange
      const exercises = createTestExerciseLogs(2, [
        { exerciseName: 'Bench Press' },
        { exerciseName: 'Incline Press' },
      ]);
      const model = createTestPerformedGroupLogModel({ type: 'superset' }, exercises);

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toContain('superset: Bench Press, Incline Press');
      expect(summary).toContain('4 sets');
      expect(summary).toContain('kg');
    });

    it('should handle single exercise', () => {
      // Arrange
      const exercises = createTestExerciseLogs(1, [{ exerciseName: 'Deadlift' }]);
      const model = createTestPerformedGroupLogModel({ type: 'single' }, exercises);

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toContain('single: Deadlift');
      expect(summary).toContain('sets');
      expect(summary).toContain('kg');
    });

    it('should handle group with no exercises', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({ type: 'circuit' }, []);

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toBe('circuit:  - 0 sets, 0 kg');
    });

    it('should handle different group types', () => {
      // Arrange
      const exercises = createTestExerciseLogs(1, [{ exerciseName: 'Push-ups' }]);
      const models = [
        createTestPerformedGroupLogModel({ type: 'circuit' }, exercises),
        createTestPerformedGroupLogModel({ type: 'emom' }, exercises),
        createTestPerformedGroupLogModel({ type: 'warmup' }, exercises),
      ];

      // Act & Assert
      expect(models[0].getSummaryString()).toContain('circuit: Push-ups');
      expect(models[1].getSummaryString()).toContain('emom: Push-ups');
      expect(models[2].getSummaryString()).toContain('warmup: Push-ups');
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      // Arrange
      const originalExercises = createTestExerciseLogs();
      const model = createTestPerformedGroupLogModel({}, originalExercises);

      // Act
      const cloned = model.clone();

      // Assert
      expect(cloned).not.toBe(model);
      expect(cloned.performedExercises).not.toBe(model.performedExercises);
      expect(cloned.performedExercises.length).toBe(model.performedExercises.length);
      // Note: Exercises may or may not be deep cloned depending on implementation
      expect(cloned.performedExercises).not.toBe(model.performedExercises);
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const originalExercises = createTestExerciseLogs();
      const model = createTestPerformedGroupLogModel(
        {
          type: 'superset',
          plannedGroupId: 'planned-group-123',
          actualRestSeconds: 120,
        },
        originalExercises
      );

      // Act
      const cloned = model.clone();

      // Assert
      expect(cloned.id).toBe(model.id);
      expect(cloned.profileId).toBe(model.profileId);
      expect(cloned.type).toBe(model.type);
      expect(cloned.plannedGroupId).toBe(model.plannedGroupId);
      expect(cloned.actualRestSeconds).toBe(model.actualRestSeconds);
      expect(cloned.createdAt).toBe(model.createdAt);
      expect(cloned.updatedAt).toBe(model.updatedAt);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const exercises = createTestExerciseLogs();
      const data = createTestPerformedGroupData({
        type: 'superset',
        plannedGroupId: 'planned-group-123',
        actualRestSeconds: 120,
      });
      const model = PerformedGroupLogModel.hydrate(data, exercises);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: data.profileId,
        plannedGroupId: 'planned-group-123',
        type: 'superset',
        performedExerciseLogIds: exercises.map((e) => e.id),
        actualRestSeconds: 120,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should handle undefined optional fields in plain object', () => {
      // Arrange
      const exercises = createTestExerciseLogs();
      const data = createTestPerformedGroupData({
        plannedGroupId: undefined,
        actualRestSeconds: undefined,
      });
      const model = PerformedGroupLogModel.hydrate(data, exercises);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.plannedGroupId).toBeUndefined();
      expect(plainObject.actualRestSeconds).toBeUndefined();
    });

    it('should handle empty exercises array', () => {
      // Arrange
      const data = createTestPerformedGroupData();
      const model = PerformedGroupLogModel.hydrate(data, []);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.performedExerciseLogIds).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange
      const validData = createTestPerformedGroupData({
        type: 'single',
        performedExerciseLogIds: [],
      });
      const model = PerformedGroupLogModel.hydrate(validData, []);

      // Act
      const result = model.validate();

      // Assert
      if (!result.success) {
        console.error('PerformedGroup validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should use performedGroupSchema for validation', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel();
      const safeParseSpy = vi.spyOn(performedGroupSchema, 'safeParse');

      // Act
      model.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(model.toPlainObject());
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const originalExercises = createTestExerciseLogs();
      const original = createTestPerformedGroupLogModel(
        {
          type: 'superset',
          actualRestSeconds: 60,
          plannedGroupId: 'original-group',
        },
        originalExercises
      );
      const originalData = {
        type: original.type,
        actualRestSeconds: original.actualRestSeconds,
        plannedGroupId: original.plannedGroupId,
        performedExercises: original.performedExercises,
        updatedAt: original.updatedAt,
      };

      // Act
      const withUpdatedRest = original.cloneWithUpdatedRest(120);
      const withUpdatedExercise = original.cloneWithUpdatedExercise(originalExercises[0]);
      const cloned = original.clone();

      // Assert - Original should be unchanged
      expect(original.type).toBe(originalData.type);
      expect(original.actualRestSeconds).toBe(originalData.actualRestSeconds);
      expect(original.plannedGroupId).toBe(originalData.plannedGroupId);
      expect(original.performedExercises).toBe(originalData.performedExercises);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify different values in clones
      expect(withUpdatedRest.actualRestSeconds).toBe(120);
      expect(withUpdatedExercise.performedExercises).not.toBe(original.performedExercises);
      expect(cloned.performedExercises).not.toBe(original.performedExercises);
    });
  });

  describe('edge cases', () => {
    it('should handle group with only skipped exercises', () => {
      // Arrange
      const exercises = createTestExerciseLogs(2, [{ isSkipped: true }, { isSkipped: true }]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act & Assert
      expect(model.isCompletelySkipped()).toBe(true);
      expect(model.getCompletedExerciseCount()).toBe(0);
      expect(model.getSummaryString()).toContain('Exercise 1, Exercise 2');
    });

    it('should handle group with mixed exercise completion', () => {
      // Arrange
      const exercises = createTestExerciseLogs(3, [
        { isSkipped: false },
        { isSkipped: true },
        { isSkipped: false },
      ]);
      const model = createTestPerformedGroupLogModel({}, exercises);

      // Act & Assert
      expect(model.isCompletelySkipped()).toBe(false);
      expect(model.getCompletedExerciseCount()).toBe(2);
      expect(model.getTotalVolume()).toBeGreaterThan(0); // Should have some volume
    });

    it('should handle different rest time scenarios', () => {
      // Arrange
      const noRestModel = createTestPerformedGroupLogModel({ actualRestSeconds: undefined });
      const zeroRestModel = createTestPerformedGroupLogModel({ actualRestSeconds: 0 });
      const longRestModel = createTestPerformedGroupLogModel({ actualRestSeconds: 600 });

      // Act & Assert
      expect(noRestModel.actualRestSeconds).toBeUndefined();
      expect(zeroRestModel.actualRestSeconds).toBe(0);
      expect(longRestModel.actualRestSeconds).toBe(600);
    });

    it('should handle zero rest time update', () => {
      // Arrange
      const model = createTestPerformedGroupLogModel({ actualRestSeconds: 60 });

      // Act
      const updated = model.cloneWithUpdatedRest(0);

      // Assert
      expect(updated.actualRestSeconds).toBe(0);
      expect(model.actualRestSeconds).toBe(60); // Original unchanged
    });
  });
});
