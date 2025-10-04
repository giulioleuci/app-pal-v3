import { describe, expect, it } from 'vitest';

import { SupersetRequiresMultipleExercisesError } from '@/shared/errors';
import { createTestAppliedExerciseModel, createTestExerciseGroupData } from '@/test-factories';

import { SupersetGroupModel } from '../SupersetGroupModel';

describe('SupersetGroupModel', () => {
  describe('constructor - business rule validation', () => {
    it('should create SupersetGroupModel with exactly 2 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];

      // Act
      const model = new SupersetGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(SupersetGroupModel);
      expect(model.type).toBe('superset');
      expect(model.appliedExercises).toHaveLength(2);
      expect(model.appliedExercises[0].id).toBe('exercise-1');
      expect(model.appliedExercises[1].id).toBe('exercise-2');
    });

    it('should inherit all properties from ExerciseGroupModel', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'superset',
        profileId: 'test-profile-id',
        restTimeSeconds: 90,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];

      // Act
      const model = new SupersetGroupModel(data, appliedExercises);

      // Assert
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe('test-profile-id');
      expect(model.type).toBe('superset');
      expect(model.restTimeSeconds).toBe(90);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should throw SupersetRequiresMultipleExercisesError with 0 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [];

      // Act & Assert
      expect(() => new SupersetGroupModel(data, appliedExercises)).toThrow(
        SupersetRequiresMultipleExercisesError
      );
    });

    it('should throw SupersetRequiresMultipleExercisesError with 1 exercise', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new SupersetGroupModel(data, appliedExercises)).toThrow(
        SupersetRequiresMultipleExercisesError
      );
    });

    it('should throw SupersetRequiresMultipleExercisesError with 3 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
      ];

      // Act & Assert
      expect(() => new SupersetGroupModel(data, appliedExercises)).toThrow(
        SupersetRequiresMultipleExercisesError
      );
    });

    it('should throw SupersetRequiresMultipleExercisesError with 4 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
        createTestAppliedExerciseModel({ id: 'exercise-4' }),
      ];

      // Act & Assert
      expect(() => new SupersetGroupModel(data, appliedExercises)).toThrow(
        SupersetRequiresMultipleExercisesError
      );
    });
  });

  describe('inheritance behavior', () => {
    it('should inherit getExerciseCount method', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new SupersetGroupModel(data, appliedExercises);

      // Act
      const count = model.getExerciseCount();

      // Assert
      expect(count).toBe(2);
    });

    it('should inherit getType method', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new SupersetGroupModel(data, appliedExercises);

      // Act
      const type = model.getType();

      // Assert
      expect(type).toBe('superset');
    });

    it('should inherit hasCustomRestTime method', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset', restTimeSeconds: 120 });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new SupersetGroupModel(data, appliedExercises);

      // Act
      const hasCustomRest = model.hasCustomRestTime();

      // Assert
      expect(hasCustomRest).toBe(true);
    });

    it('should inherit hasDuration method and return false for superset', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new SupersetGroupModel(data, appliedExercises);

      // Act
      const hasDuration = model.hasDuration();

      // Assert
      expect(hasDuration).toBe(false);
    });

    it('should inherit hasRounds method and return false for superset', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new SupersetGroupModel(data, appliedExercises);

      // Act
      const hasRounds = model.hasRounds();

      // Assert
      expect(hasRounds).toBe(false);
    });
  });

  describe('error details', () => {
    it('should throw error with correct name and message', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      try {
        new SupersetGroupModel(data, appliedExercises);
        expect.fail('Expected SupersetRequiresMultipleExercisesError to be thrown');
      } catch (_error) {
        expect(_error).toBeInstanceOf(SupersetRequiresMultipleExercisesError);
        expect((_error as SupersetRequiresMultipleExercisesError).name).toBe('SupersetRequiresMultipleExercisesError');
        expect((_error as SupersetRequiresMultipleExercisesError).message).toBe('errors.domain.superset.invalidExerciseCount');
      }
    });
  });

  describe('edge cases', () => {
    it('should work with different exercise configurations in valid superset', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });
      const appliedExercises = [
        createTestAppliedExerciseModel({
          id: 'exercise-1',
          profileId: 'profile-1',
          exerciseId: 'ex-1',
        }),
        createTestAppliedExerciseModel({
          id: 'exercise-2',
          profileId: 'profile-1',
          exerciseId: 'ex-2',
        }),
      ];

      // Act
      const model = new SupersetGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(2);
      expect(model.appliedExercises[0].id).toBe('exercise-1');
      expect(model.appliedExercises[0].exerciseId).toBe('ex-1');
      expect(model.appliedExercises[1].id).toBe('exercise-2');
      expect(model.appliedExercises[1].exerciseId).toBe('ex-2');
    });

    it('should validate exercise count immediately after construction', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'superset' });

      // Act & Assert - test that validation happens immediately, not lazily
      expect(() => new SupersetGroupModel(data, [])).toThrow(
        SupersetRequiresMultipleExercisesError
      );
    });
  });
});
