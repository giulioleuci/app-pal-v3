import { describe, expect, it } from 'vitest';

import { AmrapEmomRequiresDurationError } from '@/shared/errors';
import { createTestAppliedExerciseModel, createTestExerciseGroupData } from '@/test-factories';

import { AMRAPGroupModel } from '../AMRAPGroupModel';

describe('AMRAPGroupModel', () => {
  describe('constructor - business rule validation', () => {
    it('should create AMRAPGroupModel with durationMinutes = 1', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 1,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(AMRAPGroupModel);
      expect(model.type).toBe('amrap');
      expect(model.durationMinutes).toBe(1);
      expect(model.appliedExercises).toHaveLength(1);
    });

    it('should create AMRAPGroupModel with durationMinutes = 15', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 15,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(AMRAPGroupModel);
      expect(model.type).toBe('amrap');
      expect(model.durationMinutes).toBe(15);
      expect(model.appliedExercises).toHaveLength(2);
    });

    it('should create AMRAPGroupModel with durationMinutes = 30', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 30,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(AMRAPGroupModel);
      expect(model.durationMinutes).toBe(30);
    });

    it('should inherit all properties from ExerciseGroupModel', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        profileId: 'test-profile-id',
        restTimeSeconds: 90,
        durationMinutes: 20,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe('test-profile-id');
      expect(model.type).toBe('amrap');
      expect(model.restTimeSeconds).toBe(90);
      expect(model.durationMinutes).toBe(20);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is undefined', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: undefined,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new AMRAPGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is 0', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 0,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new AMRAPGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is negative', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: -10,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new AMRAPGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is null', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: null as any,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new AMRAPGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });
  });

  describe('inheritance behavior', () => {
    it('should inherit getExerciseCount method', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 12,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
      ];
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Act
      const count = model.getExerciseCount();

      // Assert
      expect(count).toBe(3);
    });

    it('should inherit getType method', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 18,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Act
      const type = model.getType();

      // Assert
      expect(type).toBe('amrap');
    });

    it('should inherit hasCustomRestTime method', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 25,
        restTimeSeconds: 120,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Act
      const hasCustomRest = model.hasCustomRestTime();

      // Assert
      expect(hasCustomRest).toBe(true);
    });

    it('should inherit hasDuration method and return true for AMRAP', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 22,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Act
      const hasDuration = model.hasDuration();

      // Assert
      expect(hasDuration).toBe(true);
      expect(model.durationMinutes).toBe(22);
    });

    it('should inherit hasRounds method and return false for AMRAP', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 14,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Act
      const hasRounds = model.hasRounds();

      // Assert
      expect(hasRounds).toBe(false);
    });
  });

  describe('error details', () => {
    it('should throw error with correct name, message and type for AMRAP', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 0,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      try {
        new AMRAPGroupModel(data, appliedExercises);
        expect.fail('Expected AmrapEmomRequiresDurationError to be thrown');
      } catch (_error) {
        expect(_error).toBeInstanceOf(AmrapEmomRequiresDurationError);
        expect((_error as AmrapEmomRequiresDurationError).name).toBe('AmrapEmomRequiresDurationError');
        expect((_error as AmrapEmomRequiresDurationError).message).toBe('errors.domain.amrapEmom.durationRequired');
        expect((_error as AmrapEmomRequiresDurationError).type).toBe('AMRAP');
      }
    });
  });

  describe('edge cases', () => {
    it('should work with single exercise in valid AMRAP', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 7,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({
          id: 'exercise-1',
          profileId: 'profile-1',
          exerciseId: 'ex-1',
        }),
      ];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(1);
      expect(model.appliedExercises[0].id).toBe('exercise-1');
      expect(model.appliedExercises[0].exerciseId).toBe('ex-1');
      expect(model.durationMinutes).toBe(7);
    });

    it('should work with multiple exercises in valid AMRAP', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 24,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
        createTestAppliedExerciseModel({ id: 'exercise-4' }),
      ];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(4);
      expect(model.durationMinutes).toBe(24);
    });

    it('should validate duration immediately after construction', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: undefined,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert - test that validation happens immediately, not lazily
      expect(() => new AMRAPGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should support minimum boundary case with durationMinutes = 1', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 1,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert - should not throw
      const model = new AMRAPGroupModel(data, appliedExercises);
      expect(model.durationMinutes).toBe(1);
    });

    it('should support large duration values', () => {
      // Arrange - test with large duration to verify no upper bound issues
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 45,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model.durationMinutes).toBe(45);
      expect(model.type).toBe('amrap');
    });

    it('should work with empty exercises array as long as duration is valid', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'amrap',
        durationMinutes: 16,
      });
      const appliedExercises = [];

      // Act
      const model = new AMRAPGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(0);
      expect(model.durationMinutes).toBe(16);
    });
  });
});
