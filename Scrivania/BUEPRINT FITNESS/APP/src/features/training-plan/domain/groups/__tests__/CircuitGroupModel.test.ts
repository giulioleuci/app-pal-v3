import { describe, expect, it } from 'vitest';

import { CircuitRequiresMultipleExercisesError } from '@/shared/errors';
import { createTestAppliedExerciseModel, createTestExerciseGroupData } from '@/test-factories';

import { CircuitGroupModel } from '../CircuitGroupModel';

describe('CircuitGroupModel', () => {
  describe('constructor - business rule validation', () => {
    it('should create CircuitGroupModel with exactly 2 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];

      // Act
      const model = new CircuitGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(CircuitGroupModel);
      expect(model.type).toBe('circuit');
      expect(model.appliedExercises).toHaveLength(2);
      expect(model.appliedExercises[0].id).toBe('exercise-1');
      expect(model.appliedExercises[1].id).toBe('exercise-2');
    });

    it('should create CircuitGroupModel with 3 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
      ];

      // Act
      const model = new CircuitGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(CircuitGroupModel);
      expect(model.type).toBe('circuit');
      expect(model.appliedExercises).toHaveLength(3);
      expect(model.appliedExercises[0].id).toBe('exercise-1');
      expect(model.appliedExercises[1].id).toBe('exercise-2');
      expect(model.appliedExercises[2].id).toBe('exercise-3');
    });

    it('should create CircuitGroupModel with 4 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
        createTestAppliedExerciseModel({ id: 'exercise-4' }),
      ];

      // Act
      const model = new CircuitGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(CircuitGroupModel);
      expect(model.type).toBe('circuit');
      expect(model.appliedExercises).toHaveLength(4);
    });

    it('should create CircuitGroupModel with 5 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
        createTestAppliedExerciseModel({ id: 'exercise-4' }),
        createTestAppliedExerciseModel({ id: 'exercise-5' }),
      ];

      // Act
      const model = new CircuitGroupModel(data, appliedExercises);

      // Assert
      expect(model).toBeInstanceOf(CircuitGroupModel);
      expect(model.appliedExercises).toHaveLength(5);
    });

    it('should inherit all properties from ExerciseGroupModel', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'circuit',
        profileId: 'test-profile-id',
        restTimeSeconds: 60,
        rounds: { min: 3, max: 5, direction: 'asc' },
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];

      // Act
      const model = new CircuitGroupModel(data, appliedExercises);

      // Assert
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe('test-profile-id');
      expect(model.type).toBe('circuit');
      expect(model.restTimeSeconds).toBe(60);
      expect(model.rounds).toEqual({ min: 3, max: 5, direction: 'asc' });
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should throw CircuitRequiresMultipleExercisesError with 0 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [];

      // Act & Assert
      expect(() => new CircuitGroupModel(data, appliedExercises)).toThrow(
        CircuitRequiresMultipleExercisesError
      );
    });

    it('should throw CircuitRequiresMultipleExercisesError with 1 exercise', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      expect(() => new CircuitGroupModel(data, appliedExercises)).toThrow(
        CircuitRequiresMultipleExercisesError
      );
    });
  });

  describe('inheritance behavior', () => {
    it('should inherit getExerciseCount method', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
        createTestAppliedExerciseModel({ id: 'exercise-3' }),
      ];
      const model = new CircuitGroupModel(data, appliedExercises);

      // Act
      const count = model.getExerciseCount();

      // Assert
      expect(count).toBe(3);
    });

    it('should inherit getType method', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new CircuitGroupModel(data, appliedExercises);

      // Act
      const type = model.getType();

      // Assert
      expect(type).toBe('circuit');
    });

    it('should inherit hasCustomRestTime method', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit', restTimeSeconds: 45 });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new CircuitGroupModel(data, appliedExercises);

      // Act
      const hasCustomRest = model.hasCustomRestTime();

      // Assert
      expect(hasCustomRest).toBe(true);
    });

    it('should inherit hasDuration method and return false for circuit', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new CircuitGroupModel(data, appliedExercises);

      // Act
      const hasDuration = model.hasDuration();

      // Assert
      expect(hasDuration).toBe(false);
    });

    it('should inherit hasRounds method and return true when rounds are specified', () => {
      // Arrange
      const data = createTestExerciseGroupData({
        type: 'circuit',
        rounds: { min: 2, max: 4, direction: 'desc' },
      });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];
      const model = new CircuitGroupModel(data, appliedExercises);

      // Act
      const hasRounds = model.hasRounds();

      // Assert
      expect(hasRounds).toBe(true);
      expect(model.rounds).toEqual({ min: 2, max: 4, direction: 'desc' });
    });
  });

  describe('error details', () => {
    it('should throw error with correct name and message', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [createTestAppliedExerciseModel({ id: 'exercise-1' })];

      // Act & Assert
      try {
        new CircuitGroupModel(data, appliedExercises);
        expect.fail('Expected CircuitRequiresMultipleExercisesError to be thrown');
      } catch (_error) {
        expect(_error).toBeInstanceOf(CircuitRequiresMultipleExercisesError);
        expect((_error as CircuitRequiresMultipleExercisesError).name).toBe('CircuitRequiresMultipleExercisesError');
        expect((_error as CircuitRequiresMultipleExercisesError).message).toBe('errors.domain.circuit.invalidExerciseCount');
      }
    });
  });

  describe('edge cases', () => {
    it('should work with different exercise configurations in valid circuit', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
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
        createTestAppliedExerciseModel({
          id: 'exercise-3',
          profileId: 'profile-1',
          exerciseId: 'ex-3',
        }),
      ];

      // Act
      const model = new CircuitGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(3);
      expect(model.appliedExercises[0].id).toBe('exercise-1');
      expect(model.appliedExercises[0].exerciseId).toBe('ex-1');
      expect(model.appliedExercises[1].id).toBe('exercise-2');
      expect(model.appliedExercises[1].exerciseId).toBe('ex-2');
      expect(model.appliedExercises[2].id).toBe('exercise-3');
      expect(model.appliedExercises[2].exerciseId).toBe('ex-3');
    });

    it('should validate exercise count immediately after construction', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });

      // Act & Assert - test that validation happens immediately, not lazily
      expect(() => new CircuitGroupModel(data, [])).toThrow(CircuitRequiresMultipleExercisesError);
    });

    it('should support minimum boundary case with exactly 2 exercises', () => {
      // Arrange
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = [
        createTestAppliedExerciseModel({ id: 'exercise-1' }),
        createTestAppliedExerciseModel({ id: 'exercise-2' }),
      ];

      // Act & Assert - should not throw
      const model = new CircuitGroupModel(data, appliedExercises);
      expect(model.appliedExercises).toHaveLength(2);
    });

    it('should support many exercises in circuit', () => {
      // Arrange - create circuit with 6 exercises to test upper boundaries
      const data = createTestExerciseGroupData({ type: 'circuit' });
      const appliedExercises = Array.from({ length: 6 }, (_, i) =>
        createTestAppliedExerciseModel({ id: `exercise-${i + 1}` })
      );

      // Act
      const model = new CircuitGroupModel(data, appliedExercises);

      // Assert
      expect(model.appliedExercises).toHaveLength(6);
      expect(model.type).toBe('circuit');
    });
  });
});
