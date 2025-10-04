import { describe, expect, it } from 'vitest';

import { AmrapEmomRequiresDurationError } from '@/shared/errors';
import { createTestAppliedExerciseModel, createTestExerciseGroupData } from '@/test-factories';

import { EMOMGroupModel } from '../EMOMGroupModel';

describe('EMOMGroupModel', () => {
  describe('constructor - business rule validation', () => {
    it('should create EMOMGroupModel with durationMinutes = 1', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 1,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(EMOMGroupModel);
      expect(model.type).toBe('emom');
      expect(model.durationMinutes).toBe(1);
      expect(model.appliedExercises).toHaveLength(1);
    });

    it('should create EMOMGroupModel with durationMinutes = 10', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 10,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(EMOMGroupModel);
      expect(model.type).toBe('emom');
      expect(model.durationMinutes).toBe(10);
      expect(model.appliedExercises).toHaveLength(2);
    });

    it('should create EMOMGroupModel with durationMinutes = 20', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 20,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(EMOMGroupModel);
      expect(model.durationMinutes).toBe(20);
    });

    it('should inherit all properties from ExerciseGroupModel', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        profileId: 'test-profile-id',
        restTimeSeconds: 30,
        durationMinutes: 12,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe('test-profile-id');
      expect(model.type).toBe('emom');
      expect(model.restTimeSeconds).toBe(30);
      expect(model.durationMinutes).toBe(12);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is undefined', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: undefined,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new EMOMGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is 0', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 0,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new EMOMGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is negative', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: -5,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new EMOMGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should throw AmrapEmomRequiresDurationError when durationMinutes is null', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: null as any,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new EMOMGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });
  });

  describe('inheritance behavior', () => {
    it('should inherit getExerciseCount method', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 8,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new EMOMGroupModel(data, appliedExercises);

      // Act
      const count = model.getExerciseCount();

      // Assert
      expect(count).toBe(2);
    });

    it('should inherit getType method', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 15,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new EMOMGroupModel(data, appliedExercises);

      // Act
      const type = model.getType();

      // Assert
      expect(type).toBe('emom');
    });

    it('should inherit hasCustomRestTime method', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 10,
        restTimeSeconds: 60,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new EMOMGroupModel(data, appliedExercises);

      // Act
      const hasCustomRest = model.hasCustomRestTime();

      // Assert
      expect(hasCustomRest).toBe(true);
    });

    it('should inherit hasDuration method and return true for EMOM', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 12,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new EMOMGroupModel(data, appliedExercises);

      // Act
      const hasDuration = model.hasDuration();

      // Assert
      expect(hasDuration).toBe(true);
      expect(model.durationMinutes).toBe(12);
    });

    it('should inherit hasRounds method and return false for EMOM', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 8,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];
      const model = new EMOMGroupModel(data, appliedExercises);

      // Act
      const hasRounds = model.hasRounds();

      // Assert
      expect(hasRounds).toBe(false);
    });
  });

  describe('error details', () => {
    it('should throw error with correct name, message and type for EMOM', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 0,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      try {
        new EMOMGroupModel(data, appliedExercises);
        expect.fail('Expected AmrapEmomRequiresDurationError to be thrown');
      } catch (_error) {
        expect(_error).toBeInstanceOf(AmrapEmomRequiresDurationError);
        expect((_error as AmrapEmomRequiresDurationError).name).toBe('AmrapEmomRequiresDurationError');
        expect((_error as AmrapEmomRequiresDurationError).message).toBe('errors.domain.amrapEmom.durationRequired');
        expect((_error as AmrapEmomRequiresDurationError).type).toBe('EMOM');
      }
    });
  });

  describe('edge cases', () => {
    it('should work with single exercise in valid EMOM', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 5,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({
          id: 'exercise-1',
          profileId: 'profile-1',
          exerciseId: 'ex-1',
        }),
      ];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(1);
      expect(model.appliedExercises[0].id).toBe('exercise-1');
      expect(model.appliedExercises[0].exerciseId).toBe('ex-1');
      expect(model.durationMinutes).toBe(5);
    });

    it('should work with multiple exercises in valid EMOM', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 18,
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
      ];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(3);
      expect(model.durationMinutes).toBe(18);
    });

    it('should validate duration immediately after construction', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: undefined,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert - test that validation happens immediately, not lazily
      expect(() => new EMOMGroupModel(data, appliedExercises)).toThrow(
        AmrapEmomRequiresDurationError
      );
    });

    it('should support minimum boundary case with durationMinutes = 1', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 1,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert - should not throw
      const model = new EMOMGroupModel(data, appliedExercises);
      expect(model.durationMinutes).toBe(1);
    });

    it('should support large duration values', () => {
      // Arrange - test with large duration to verify no upper bound issues
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 60,
      });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model.durationMinutes).toBe(60);
      expect(model.type).toBe('emom');
    });

    it('should work with empty exercises array as long as duration is valid', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'emom',
        durationMinutes: 10,
      });
      const appliedExercises = [];

      // Act
      const model = new EMOMGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(0);
      expect(model.durationMinutes).toBe(10);
    });
  });
});
