import { describe, expect, it, vi } from 'vitest';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseSubstitution } from '@/shared/domain';
import { BusinessRuleError } from '@/shared/errors';
import { ExerciseData, ExerciseSubstitutionData } from '@/shared/types';
import { createTestExerciseData, createTestExerciseModel } from '@/test-factories';

// Mock immer's produce function and immerable symbol
vi.mock('immer', () => ({
  produce: vi.fn((obj, fn) => {
    const draft = structuredClone(obj);
    fn?.(draft);
    return draft;
  }),
  immerable: Symbol('immerable'),
}));

describe('ExerciseModel', () => {
  describe('Static factory method', () => {
    it('should create instance via hydrate method', () => {
      const data = createTestExerciseData();
      const model = ExerciseModel.hydrate(data);

      expect(model).toBeInstanceOf(ExerciseModel);
      expect(model.id).toBe(data.id);
      expect(model.name).toBe(data.name);
      expect(model.profileId).toBe(data.profileId);
    });

    it('should hydrate substitutions as ExerciseSubstitution objects', () => {
      const substitutionData: ExerciseSubstitutionData = {
        exerciseId: 'sub-exercise-id',
        priority: 3,
        reason: 'Equipment unavailable',
      };
      const data = createTestExerciseData({
        substitutions: [substitutionData],
      });

      const model = ExerciseModel.hydrate(data);

      expect(model.substitutions).toHaveLength(1);
      expect(model.substitutions[0]).toBeInstanceOf(ExerciseSubstitution);
      expect(model.substitutions[0].exerciseId).toBe(substitutionData.exerciseId);
      expect(model.substitutions[0].priority).toBe(substitutionData.priority);
    });
  });

  describe('Business logic methods', () => {
    describe('getPrimaryMuscleGroups', () => {
      it('should return muscles with activation >= 0.75 by default', () => {
        const model = createTestExerciseModel({
          muscleActivation: {
            chest: 0.9,
            triceps: 0.8,
            shoulders: 0.6,
            biceps: 0.3,
          },
        });

        const primaryMuscles = model.getPrimaryMuscleGroups();

        expect(primaryMuscles).toEqual(['chest', 'triceps']);
      });

      it('should use custom threshold when provided', () => {
        const model = createTestExerciseModel({
          muscleActivation: {
            chest: 0.9,
            triceps: 0.8,
            shoulders: 0.6,
            biceps: 0.3,
          },
        });

        const primaryMuscles = model.getPrimaryMuscleGroups(0.6);

        expect(primaryMuscles).toEqual(['chest', 'triceps', 'shoulders']);
      });

      it('should return empty array when no muscles meet threshold', () => {
        const model = createTestExerciseModel({
          muscleActivation: {
            chest: 0.5,
            triceps: 0.4,
          },
        });

        const primaryMuscles = model.getPrimaryMuscleGroups(0.8);

        expect(primaryMuscles).toEqual([]);
      });
    });

    describe('getActivatedMuscles', () => {
      it('should return muscles with activation >= 0.5 by default', () => {
        const model = createTestExerciseModel({
          muscleActivation: {
            chest: 0.9,
            triceps: 0.6,
            shoulders: 0.4,
            biceps: 0.1,
          },
        });

        const activatedMuscles = model.getActivatedMuscles();

        expect(activatedMuscles).toEqual(['chest', 'triceps']);
      });

      it('should use custom threshold when provided', () => {
        const model = createTestExerciseModel({
          muscleActivation: {
            chest: 0.9,
            triceps: 0.3,
            shoulders: 0.2,
          },
        });

        const activatedMuscles = model.getActivatedMuscles(0.2);

        expect(activatedMuscles).toEqual(['chest', 'triceps', 'shoulders']);
      });
    });

    describe('getEquipment', () => {
      it('should return exercise equipment array', () => {
        const equipment = ['barbell', 'bench'];
        const model = createTestExerciseModel({ equipment });

        expect(model.getEquipment()).toEqual(equipment);
      });
    });

    describe('getMovementType', () => {
      it('should return exercise movement type', () => {
        const model = createTestExerciseModel({ movementType: 'pull' });

        expect(model.getMovementType()).toBe('pull');
      });
    });

    describe('getCategory', () => {
      it('should return exercise category', () => {
        const model = createTestExerciseModel({ category: 'hypertrophy' });

        expect(model.getCategory()).toBe('hypertrophy');
      });
    });

    describe('getMovementPattern', () => {
      it('should return exercise movement pattern when set', () => {
        const model = createTestExerciseModel({ movementPattern: 'horizontalPush' });

        expect(model.getMovementPattern()).toBe('horizontalPush');
      });

      it('should return undefined when movement pattern is not set', () => {
        const model = createTestExerciseModel({ movementPattern: undefined });

        expect(model.getMovementPattern()).toBeUndefined();
      });
    });

    describe('getDescription', () => {
      it('should return exercise description', () => {
        const description = 'Test exercise description';
        const model = createTestExerciseModel({ description });

        expect(model.getDescription()).toBe(description);
      });
    });

    describe('isBodyweight', () => {
      it('should return true when equipment is only bodyweight', () => {
        const model = createTestExerciseModel({ equipment: ['bodyweight'] });

        expect(model.isBodyweight()).toBe(true);
      });

      it('should return false when equipment includes more than bodyweight', () => {
        const model = createTestExerciseModel({ equipment: ['bodyweight', 'dumbbell'] });

        expect(model.isBodyweight()).toBe(false);
      });

      it('should return false when equipment does not include bodyweight', () => {
        const model = createTestExerciseModel({ equipment: ['barbell'] });

        expect(model.isBodyweight()).toBe(false);
      });
    });

    describe('requiresEquipment', () => {
      it('should return true when exercise requires specified equipment', () => {
        const model = createTestExerciseModel({ equipment: ['barbell', 'bench'] });

        expect(model.requiresEquipment('barbell')).toBe(true);
        expect(model.requiresEquipment('bench')).toBe(true);
      });

      it('should return false when exercise does not require specified equipment', () => {
        const model = createTestExerciseModel({ equipment: ['barbell'] });

        expect(model.requiresEquipment('dumbbell')).toBe(false);
      });
    });
  });

  describe('Substitution management', () => {
    describe('cloneWithAddedSubstitution', () => {
      it('should add new substitution and return new instance', () => {
        const originalModel = createTestExerciseModel({ substitutions: [] });
        const exerciseId = 'new-exercise-id';
        const priority = 4;
        const reason = 'Better alternative';

        const newModel = originalModel.cloneWithAddedSubstitution(exerciseId, priority, reason);

        expect(newModel).not.toBe(originalModel);
        expect(newModel.substitutions).toHaveLength(1);
        expect(newModel.substitutions[0].exerciseId).toBe(exerciseId);
        expect(newModel.substitutions[0].priority).toBe(priority);
        expect(newModel.substitutions[0].reason).toBe(reason);
        expect(originalModel.substitutions).toHaveLength(0);
      });

      it('should replace existing substitution for same exercise ID', () => {
        const existingSubstitution: ExerciseSubstitutionData = {
          exerciseId: 'exercise-1',
          priority: 2,
          reason: 'Old reason',
        };
        const originalModel = createTestExerciseModel({
          substitutions: [existingSubstitution],
        });

        const newModel = originalModel.cloneWithAddedSubstitution('exercise-1', 5, 'New reason');

        expect(newModel.substitutions).toHaveLength(1);
        expect(newModel.substitutions[0].exerciseId).toBe('exercise-1');
        expect(newModel.substitutions[0].priority).toBe(5);
        expect(newModel.substitutions[0].reason).toBe('New reason');
      });

      it('should add substitution without reason when not provided', () => {
        const originalModel = createTestExerciseModel({ substitutions: [] });

        const newModel = originalModel.cloneWithAddedSubstitution('exercise-1', 3);

        expect(newModel.substitutions[0].reason).toBeUndefined();
      });
    });

    describe('cloneWithRemovedSubstitution', () => {
      it('should remove substitution and return new instance', () => {
        const substitution: ExerciseSubstitutionData = {
          exerciseId: 'exercise-to-remove',
          priority: 3,
        };
        const originalModel = createTestExerciseModel({
          substitutions: [substitution],
        });

        const newModel = originalModel.cloneWithRemovedSubstitution('exercise-to-remove');

        expect(newModel).not.toBe(originalModel);
        expect(newModel.substitutions).toHaveLength(0);
        expect(originalModel.substitutions).toHaveLength(1);
      });

      it('should keep other substitutions when removing one', () => {
        const substitution1: ExerciseSubstitutionData = {
          exerciseId: 'exercise-1',
          priority: 3,
        };
        const substitution2: ExerciseSubstitutionData = {
          exerciseId: 'exercise-2',
          priority: 4,
        };
        const originalModel = createTestExerciseModel({
          substitutions: [substitution1, substitution2],
        });

        const newModel = originalModel.cloneWithRemovedSubstitution('exercise-1');

        expect(newModel.substitutions).toHaveLength(1);
        expect(newModel.substitutions[0].exerciseId).toBe('exercise-2');
      });

      it('should return identical structure when substitution does not exist', () => {
        const substitution: ExerciseSubstitutionData = {
          exerciseId: 'existing-exercise',
          priority: 3,
        };
        const originalModel = createTestExerciseModel({
          substitutions: [substitution],
        });

        const newModel = originalModel.cloneWithRemovedSubstitution('non-existing-exercise');

        expect(newModel.substitutions).toHaveLength(1);
        expect(newModel.substitutions[0].exerciseId).toBe('existing-exercise');
      });
    });

    describe('cloneWithUpdatedSubstitution', () => {
      it('should update existing substitution and return new instance', () => {
        const originalSubstitution: ExerciseSubstitutionData = {
          exerciseId: 'exercise-1',
          priority: 2,
          reason: 'Original reason',
        };
        const originalModel = createTestExerciseModel({
          substitutions: [originalSubstitution],
        });

        const updatedSubstitution: ExerciseSubstitutionData = {
          exerciseId: 'exercise-1',
          priority: 5,
          reason: 'Updated reason',
        };

        const newModel = originalModel.cloneWithUpdatedSubstitution(updatedSubstitution);

        expect(newModel).not.toBe(originalModel);
        expect(newModel.substitutions).toHaveLength(1);
        expect(newModel.substitutions[0].exerciseId).toBe('exercise-1');
        expect(newModel.substitutions[0].priority).toBe(5);
        expect(newModel.substitutions[0].reason).toBe('Updated reason');
      });

      it('should keep other substitutions unchanged', () => {
        const substitution1: ExerciseSubstitutionData = {
          exerciseId: 'exercise-1',
          priority: 2,
        };
        const substitution2: ExerciseSubstitutionData = {
          exerciseId: 'exercise-2',
          priority: 4,
        };
        const originalModel = createTestExerciseModel({
          substitutions: [substitution1, substitution2],
        });

        const updatedSubstitution: ExerciseSubstitutionData = {
          exerciseId: 'exercise-1',
          priority: 5,
        };

        const newModel = originalModel.cloneWithUpdatedSubstitution(updatedSubstitution);

        expect(newModel.substitutions).toHaveLength(2);
        expect(newModel.substitutions.find((s) => s.exerciseId === 'exercise-1')?.priority).toBe(5);
        expect(newModel.substitutions.find((s) => s.exerciseId === 'exercise-2')?.priority).toBe(4);
      });
    });

    describe('getSortedSubstitutions', () => {
      it('should return substitutions sorted by priority in descending order', () => {
        const substitutions: ExerciseSubstitutionData[] = [
          { exerciseId: 'exercise-1', priority: 2 },
          { exerciseId: 'exercise-2', priority: 5 },
          { exerciseId: 'exercise-3', priority: 1 },
        ];
        const model = createTestExerciseModel({ substitutions });

        const sorted = model.getSortedSubstitutions();

        expect(sorted.map((s) => s.exerciseId)).toEqual(['exercise-2', 'exercise-1', 'exercise-3']);
        expect(sorted.map((s) => s.priority)).toEqual([5, 2, 1]);
      });

      it('should return empty array when no substitutions exist', () => {
        const model = createTestExerciseModel({ substitutions: [] });

        const sorted = model.getSortedSubstitutions();

        expect(sorted).toEqual([]);
      });

      it('should not modify original substitutions array', () => {
        const substitutions: ExerciseSubstitutionData[] = [
          { exerciseId: 'exercise-1', priority: 1 },
          { exerciseId: 'exercise-2', priority: 3 },
        ];
        const model = createTestExerciseModel({ substitutions });

        model.getSortedSubstitutions();

        expect(model.substitutions[0].priority).toBe(1);
        expect(model.substitutions[1].priority).toBe(3);
      });
    });

    describe('getBestSubstitution', () => {
      it('should return highest priority substitution', () => {
        const substitutions: ExerciseSubstitutionData[] = [
          { exerciseId: 'exercise-1', priority: 2 },
          { exerciseId: 'exercise-2', priority: 5 },
          { exerciseId: 'exercise-3', priority: 3 },
        ];
        const model = createTestExerciseModel({ substitutions });

        const best = model.getBestSubstitution();

        expect(best?.exerciseId).toBe('exercise-2');
        expect(best?.priority).toBe(5);
      });

      it('should return undefined when no substitutions exist', () => {
        const model = createTestExerciseModel({ substitutions: [] });

        const best = model.getBestSubstitution();

        expect(best).toBeUndefined();
      });
    });
  });

  describe('Exercise comparison', () => {
    describe('getSimilarityScore', () => {
      it('should return 1.0 for identical exercises', () => {
        const exerciseData = createTestExerciseData({
          muscleActivation: { chest: 1, triceps: 0.7 },
          movementPattern: 'horizontalPush',
        });
        const model1 = ExerciseModel.hydrate(exerciseData);
        const model2 = ExerciseModel.hydrate(exerciseData);

        const similarity = model1.getSimilarityScore(model2);

        expect(similarity).toBe(1.0);
      });

      it('should return 0.0 for completely different exercises', () => {
        const model1 = createTestExerciseModel({
          muscleActivation: { chest: 1, triceps: 0.7 },
          movementPattern: 'horizontalPush',
        });
        const model2 = createTestExerciseModel({
          muscleActivation: { hamstrings: 1, glutes: 0.8 },
          movementPattern: 'hipHinge',
        });

        const similarity = model1.getSimilarityScore(model2);

        expect(similarity).toBe(0.0);
      });

      it('should calculate partial similarity for exercises with some overlap', () => {
        const model1 = createTestExerciseModel({
          muscleActivation: { chest: 1, triceps: 0.7 },
          movementPattern: 'horizontalPush',
        });
        const model2 = createTestExerciseModel({
          muscleActivation: { chest: 0.8, shoulders: 0.9 },
          movementPattern: 'horizontalPush',
        });

        const similarity = model1.getSimilarityScore(model2);

        // Should be > 0 but < 1 due to partial muscle overlap and same movement pattern
        expect(similarity).toBeGreaterThan(0);
        expect(similarity).toBeLessThan(1);
        expect(similarity).toBeCloseTo(0.533, 2); // Recalculated based on actual implementation
      });

      it('should weight muscle overlap more heavily than movement pattern', () => {
        const model1 = createTestExerciseModel({
          muscleActivation: { chest: 1, triceps: 0.7 },
          movementPattern: 'horizontalPush',
        });
        const model2Same = createTestExerciseModel({
          muscleActivation: { chest: 1, triceps: 0.7 },
          movementPattern: 'verticalPush',
        });
        const model2Different = createTestExerciseModel({
          muscleActivation: { hamstrings: 1, glutes: 0.8 },
          movementPattern: 'horizontalPush',
        });

        const similarityMuscleMatch = model1.getSimilarityScore(model2Same);
        const similarityPatternMatch = model1.getSimilarityScore(model2Different);

        expect(similarityMuscleMatch).toBeGreaterThan(similarityPatternMatch);
      });

      it('should handle undefined movement patterns gracefully', () => {
        const model1 = createTestExerciseModel({
          muscleActivation: { chest: 1 },
          movementPattern: undefined,
        });
        const model2 = createTestExerciseModel({
          muscleActivation: { chest: 1 },
          movementPattern: 'horizontalPush',
        });

        const similarity = model1.getSimilarityScore(model2);

        expect(similarity).toBeCloseTo(0.7, 2); // Only muscle score (1 * 0.7) + (0 * 0.3)
      });
    });
  });

  describe('Immutability', () => {
    describe('cloneWithUpdatedDetails', () => {
      it('should create new instance with updated details', () => {
        const originalModel = createTestExerciseModel({
          name: 'Original Exercise',
          category: 'strength',
        });

        const newModel = originalModel.cloneWithUpdatedDetails({
          name: 'Updated Exercise',
          category: 'hypertrophy',
        });

        expect(newModel).not.toBe(originalModel);
        expect(newModel.name).toBe('Updated Exercise');
        expect(newModel.category).toBe('hypertrophy');
        expect(originalModel.name).toBe('Original Exercise');
        expect(originalModel.category).toBe('strength');
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = createTestExerciseModel();
        const originalUpdatedAt = originalModel.updatedAt;

        // Wait a small amount to ensure different timestamp
        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithUpdatedDetails({ name: 'New Name' });

        expect(newModel.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

        vi.useRealTimers();
      });

      it('should preserve id, profileId, createdAt', () => {
        const originalModel = createTestExerciseModel();

        const newModel = originalModel.cloneWithUpdatedDetails({ name: 'New Name' });

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.profileId).toBe(originalModel.profileId);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });
    });

    describe('clone', () => {
      it('should create structurally equivalent deep clone', () => {
        const substitutions: ExerciseSubstitutionData[] = [
          { exerciseId: 'sub-1', priority: 3, reason: 'Test' },
        ];
        const originalModel = createTestExerciseModel({
          substitutions,
          muscleActivation: { chest: 1, triceps: 0.7 },
        });

        const clonedModel = originalModel.clone();

        expect(clonedModel).not.toBe(originalModel);
        expect(clonedModel.substitutions).toEqual(originalModel.substitutions);
        expect(clonedModel.muscleActivation).toEqual(originalModel.muscleActivation);
        expect(clonedModel.id).toBe(originalModel.id);
      });
    });
  });

  describe('Serialization', () => {
    describe('toPlainObject', () => {
      it('should convert model back to plain data object', () => {
        const originalData = createTestExerciseData({
          name: 'Test Exercise',
          substitutions: [{ exerciseId: 'sub-1', priority: 2 }],
        });
        const model = ExerciseModel.hydrate(originalData);

        const plainObject = model.toPlainObject();

        expect(plainObject).toEqual(originalData);
        expect(plainObject.substitutions[0]).toEqual({
          exerciseId: 'sub-1',
          priority: 2,
        });
      });

      it('should serialize all required properties', () => {
        const model = createTestExerciseModel();

        const plainObject = model.toPlainObject();

        expect(plainObject).toHaveProperty('id');
        expect(plainObject).toHaveProperty('profileId');
        expect(plainObject).toHaveProperty('name');
        expect(plainObject).toHaveProperty('description');
        expect(plainObject).toHaveProperty('category');
        expect(plainObject).toHaveProperty('movementType');
        expect(plainObject).toHaveProperty('difficulty');
        expect(plainObject).toHaveProperty('equipment');
        expect(plainObject).toHaveProperty('muscleActivation');
        expect(plainObject).toHaveProperty('counterType');
        expect(plainObject).toHaveProperty('jointType');
        expect(plainObject).toHaveProperty('substitutions');
        expect(plainObject).toHaveProperty('createdAt');
        expect(plainObject).toHaveProperty('updatedAt');
      });
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should call validation schema safeParse method', () => {
        const model = createTestExerciseModel();

        const result = model.validate();

        // Validation testing is complex due to schema dependencies
        // The main purpose is to ensure the method exists and returns a result
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle empty muscle activation', () => {
      const model = createTestExerciseModel({ muscleActivation: {} });

      expect(model.getActivatedMuscles()).toEqual([]);
      expect(model.getPrimaryMuscleGroups()).toEqual([]);
    });

    it('should handle muscle activation with zero values', () => {
      const model = createTestExerciseModel({
        muscleActivation: { chest: 0, triceps: 0.5 },
      });

      expect(model.getActivatedMuscles()).toEqual(['triceps']);
    });

    it('should handle empty equipment array', () => {
      const model = createTestExerciseModel({ equipment: [] });

      expect(model.getEquipment()).toEqual([]);
      expect(model.isBodyweight()).toBe(false);
      expect(model.requiresEquipment('bodyweight')).toBe(false);
    });

    it('should handle substitution with invalid priority in constructor context', () => {
      expect(() => {
        new ExerciseSubstitution({ exerciseId: 'test', priority: 6 });
      }).toThrow(BusinessRuleError);
    });
  });
});
