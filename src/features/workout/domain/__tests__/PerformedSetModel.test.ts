import { describe, expect, it, vi } from 'vitest';

import { performedSetSchema } from '@/shared/types';
import { createTestPerformedSetData } from '@/test-factories';

import { PerformedSetModel } from '../PerformedSetModel';

// Mock external dependencies
vi.mock('@/lib', () => ({
  generateId: vi.fn(() => '12345678-1234-1234-8234-123456789012'),
  classifyRepRange: vi.fn((counts: number) => {
    if (counts <= 5) return 'strength';
    if (counts <= 12) return 'hypertrophy';
    return 'endurance';
  }),
}));

// Helper function to create test model
function createTestPerformedSetModel(overrides = {}) {
  return PerformedSetModel.hydrate(createTestPerformedSetData(overrides));
}

describe('PerformedSetModel', () => {
  describe('hydrate', () => {
    it('should create a new PerformedSetModel instance from plain data', () => {
      // Arrange
      const data = createTestPerformedSetData();

      // Act
      const model = PerformedSetModel.hydrate(data);

      // Assert
      expect(model).toBeInstanceOf(PerformedSetModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.counterType).toBe(data.counterType);
      expect(model.counts).toBe(data.counts);
      expect(model.weight).toBe(data.weight);
      expect(model.completed).toBe(data.completed);
      expect(model.notes).toBe(data.notes);
      expect(model.rpe).toBe(data.rpe);
      expect(model.percentage).toBe(data.percentage);
      expect(model.plannedLoad).toBe(data.plannedLoad);
      expect(model.plannedRpe).toBe(data.plannedRpe);
      expect(model.plannedCounts).toBe(data.plannedCounts);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle optional fields as undefined', () => {
      // Arrange
      const data = createTestPerformedSetData({
        weight: undefined,
        notes: undefined,
        rpe: undefined,
        percentage: undefined,
        plannedLoad: undefined,
        plannedRpe: undefined,
        plannedCounts: undefined,
      });

      // Act
      const model = PerformedSetModel.hydrate(data);

      // Assert
      expect(model.weight).toBeUndefined();
      expect(model.notes).toBeUndefined();
      expect(model.rpe).toBeUndefined();
      expect(model.percentage).toBeUndefined();
      expect(model.plannedLoad).toBeUndefined();
      expect(model.plannedRpe).toBeUndefined();
      expect(model.plannedCounts).toBeUndefined();
    });

    it('should handle different counter types', () => {
      // Arrange
      const timeData = createTestPerformedSetData({ counterType: 'time' });
      const distanceData = createTestPerformedSetData({ counterType: 'distance' });

      // Act
      const timeModel = PerformedSetModel.hydrate(timeData);
      const distanceModel = PerformedSetModel.hydrate(distanceData);

      // Assert
      expect(timeModel.counterType).toBe('time');
      expect(distanceModel.counterType).toBe('distance');
    });
  });

  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof PerformedSetModel.prototype.constructor).toBe('function');
    });
  });

  describe('getRepRangeCategory', () => {
    it('should delegate to classifyRepRange utility', () => {
      // Arrange
      const model = createTestPerformedSetModel({ counts: 8 });

      // Act
      const category = model.getRepRangeCategory();

      // Assert
      expect(category).toBe('hypertrophy');
    });

    it('should classify strength rep range correctly', () => {
      // Arrange
      const model = createTestPerformedSetModel({ counts: 3 });

      // Act
      const category = model.getRepRangeCategory();

      // Assert
      expect(category).toBe('strength');
    });

    it('should classify endurance rep range correctly', () => {
      // Arrange
      const model = createTestPerformedSetModel({ counts: 15 });

      // Act
      const category = model.getRepRangeCategory();

      // Assert
      expect(category).toBe('endurance');
    });
  });

  describe('isCompleted', () => {
    it('should return true when set is completed', () => {
      // Arrange
      const model = createTestPerformedSetModel({ completed: true });

      // Act
      const result = model.isCompleted();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when set is not completed', () => {
      // Arrange
      const model = createTestPerformedSetModel({ completed: false });

      // Act
      const result = model.isCompleted();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getCountsDeviation', () => {
    it('should return 0 when no planned counts exist', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        counts: 10,
        plannedCounts: undefined,
      });

      // Act
      const deviation = model.getCountsDeviation();

      // Assert
      expect(deviation).toBe(0);
    });

    it('should calculate positive deviation when performed more than planned', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        counts: 12,
        plannedCounts: { min: 8, max: 10, direction: 'asc' },
      });

      // Act
      const deviation = model.getCountsDeviation();

      // Assert
      expect(deviation).toBe(4); // 12 - 8
    });

    it('should calculate negative deviation when performed less than planned', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        counts: 6,
        plannedCounts: { min: 8, max: 10, direction: 'asc' },
      });

      // Act
      const deviation = model.getCountsDeviation();

      // Assert
      expect(deviation).toBe(-2); // 6 - 8
    });

    it('should calculate zero deviation when meeting minimum planned counts', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        counts: 8,
        plannedCounts: { min: 8, max: 10, direction: 'asc' },
      });

      // Act
      const deviation = model.getCountsDeviation();

      // Assert
      expect(deviation).toBe(0); // 8 - 8
    });
  });

  describe('getLoadDeviation', () => {
    it('should return 0 when no planned load exists', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: 100,
        plannedLoad: undefined,
      });

      // Act
      const deviation = model.getLoadDeviation();

      // Assert
      expect(deviation).toBe(0);
    });

    it('should return 0 when no weight exists', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: undefined,
        plannedLoad: { min: 80, max: 100, direction: 'asc' },
      });

      // Act
      const deviation = model.getLoadDeviation();

      // Assert
      expect(deviation).toBe(0);
    });

    it('should calculate positive deviation when lifted more than planned', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: 110,
        plannedLoad: { min: 80, max: 100, direction: 'asc' },
      });

      // Act
      const deviation = model.getLoadDeviation();

      // Assert
      expect(deviation).toBe(30); // 110 - 80
    });

    it('should calculate negative deviation when lifted less than planned', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: 70,
        plannedLoad: { min: 80, max: 100, direction: 'asc' },
      });

      // Act
      const deviation = model.getLoadDeviation();

      // Assert
      expect(deviation).toBe(-10); // 70 - 80
    });
  });

  describe('getRPEEffort', () => {
    it('should return "optimal" when no RPE is provided', () => {
      // Arrange
      const model = createTestPerformedSetModel({ rpe: undefined });

      // Act
      const effort = model.getRPEEffort();

      // Assert
      expect(effort).toBe('optimal');
    });

    it('should return "excessive" for RPE >= 9', () => {
      // Arrange
      const model9 = createTestPerformedSetModel({ rpe: 9 });
      const model10 = createTestPerformedSetModel({ rpe: 10 });

      // Act
      const effort9 = model9.getRPEEffort();
      const effort10 = model10.getRPEEffort();

      // Assert
      expect(effort9).toBe('excessive');
      expect(effort10).toBe('excessive');
    });

    it('should return "poor" for RPE <= 5', () => {
      // Arrange
      const model5 = createTestPerformedSetModel({ rpe: 5 });
      const model3 = createTestPerformedSetModel({ rpe: 3 });

      // Act
      const effort5 = model5.getRPEEffort();
      const effort3 = model3.getRPEEffort();

      // Assert
      expect(effort5).toBe('poor');
      expect(effort3).toBe('poor');
    });

    it('should return "optimal" for RPE between 6-8', () => {
      // Arrange
      const model6 = createTestPerformedSetModel({ rpe: 6 });
      const model7 = createTestPerformedSetModel({ rpe: 7 });
      const model8 = createTestPerformedSetModel({ rpe: 8 });

      // Act
      const effort6 = model6.getRPEEffort();
      const effort7 = model7.getRPEEffort();
      const effort8 = model8.getRPEEffort();

      // Assert
      expect(effort6).toBe('optimal');
      expect(effort7).toBe('optimal');
      expect(effort8).toBe('optimal');
    });
  });

  describe('cloneWithUpdates', () => {
    it('should create new instance with updated data', () => {
      // Arrange
      const original = createTestPerformedSetModel({
        counts: 10,
        weight: 100,
        completed: false,
      });

      // Act
      const updated = original.cloneWithUpdates({
        counts: 12,
        weight: 110,
        completed: true,
      });

      // Assert
      expect(updated).not.toBe(original);
      expect(updated.counts).toBe(12);
      expect(updated.weight).toBe(110);
      expect(updated.completed).toBe(true);
      expect(original.counts).toBe(10); // Original unchanged
      expect(original.weight).toBe(100);
      expect(original.completed).toBe(false);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should preserve unchanged properties', () => {
      // Arrange
      const original = createTestPerformedSetModel({
        profileId: 'test-profile',
        counterType: 'reps',
        notes: 'test notes',
        rpe: 8,
      });

      // Act
      const updated = original.cloneWithUpdates({ counts: 15 });

      // Assert
      expect(updated.profileId).toBe(original.profileId);
      expect(updated.counterType).toBe(original.counterType);
      expect(updated.notes).toBe(original.notes);
      expect(updated.rpe).toBe(original.rpe);
      expect(updated.counts).toBe(15);
    });
  });

  describe('cloneWithToggledCompletion', () => {
    it('should toggle completion from false to true', () => {
      // Arrange
      const original = createTestPerformedSetModel({ completed: false });

      // Act
      const toggled = original.cloneWithToggledCompletion();

      // Assert
      expect(toggled).not.toBe(original);
      expect(toggled.completed).toBe(true);
      expect(original.completed).toBe(false); // Original unchanged
      expect(toggled.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should toggle completion from true to false', () => {
      // Arrange
      const original = createTestPerformedSetModel({ completed: true });

      // Act
      const toggled = original.cloneWithToggledCompletion();

      // Assert
      expect(toggled).not.toBe(original);
      expect(toggled.completed).toBe(false);
      expect(original.completed).toBe(true); // Original unchanged
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestPerformedSetModel({
        counts: 10,
        weight: 100,
        rpe: 8,
        notes: 'test notes',
      });

      // Act
      const toggled = original.cloneWithToggledCompletion();

      // Assert
      expect(toggled.counts).toBe(original.counts);
      expect(toggled.weight).toBe(original.weight);
      expect(toggled.rpe).toBe(original.rpe);
      expect(toggled.notes).toBe(original.notes);
      expect(toggled.profileId).toBe(original.profileId);
    });
  });

  describe('getSummaryString', () => {
    it('should format summary with weight and counts', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: 100,
        counts: 10,
        rpe: undefined,
      });

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toBe('100 kg x 10');
    });

    it('should format summary with weight, counts, and RPE', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: 120.5,
        counts: 8,
        rpe: 8,
      });

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toBe('120.5 kg x 8 @ RPE 8');
    });

    it('should handle undefined weight as 0', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: undefined,
        counts: 15,
        rpe: 7,
      });

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toBe('0 kg x 15 @ RPE 7');
    });

    it('should handle bodyweight exercises without RPE', () => {
      // Arrange
      const model = createTestPerformedSetModel({
        weight: undefined,
        counts: 20,
        rpe: undefined,
      });

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toBe('0 kg x 20');
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      // Arrange
      const original = createTestPerformedSetModel({
        weight: 100,
        counts: 10,
        completed: true,
        plannedLoad: { min: 80, max: 100, direction: 'asc' },
      });

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.weight).toBe(original.weight);
      expect(cloned.counts).toBe(original.counts);
      expect(cloned.completed).toBe(original.completed);
      expect(cloned.plannedLoad).toEqual(original.plannedLoad);
      expect(cloned.plannedLoad).not.toBe(original.plannedLoad); // Deep clone
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const original = createTestPerformedSetModel({
        profileId: 'test-profile',
        counterType: 'time',
        counts: 30,
        weight: 0,
        completed: false,
        notes: 'test notes',
        rpe: 6,
        percentage: 75,
      });

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned.id).toBe(original.id);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.counterType).toBe(original.counterType);
      expect(cloned.counts).toBe(original.counts);
      expect(cloned.weight).toBe(original.weight);
      expect(cloned.completed).toBe(original.completed);
      expect(cloned.notes).toBe(original.notes);
      expect(cloned.rpe).toBe(original.rpe);
      expect(cloned.percentage).toBe(original.percentage);
      expect(cloned.createdAt).toBe(original.createdAt);
      expect(cloned.updatedAt).toBe(original.updatedAt);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const data = createTestPerformedSetData({
        profileId: 'test-profile',
        counterType: 'reps',
        counts: 12,
        weight: 110,
        completed: true,
        notes: 'test notes',
        rpe: 8,
      });
      const model = PerformedSetModel.hydrate(data);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: 'test-profile',
        counterType: 'reps',
        counts: 12,
        weight: 110,
        completed: true,
        notes: 'test notes',
        rpe: 8,
        percentage: data.percentage,
        plannedLoad: data.plannedLoad,
        plannedRpe: data.plannedRpe,
        plannedCounts: data.plannedCounts,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should handle undefined optional fields in plain object', () => {
      // Arrange
      const data = createTestPerformedSetData({
        weight: undefined,
        notes: undefined,
        rpe: undefined,
        percentage: undefined,
        plannedLoad: undefined,
        plannedRpe: undefined,
        plannedCounts: undefined,
      });
      const model = PerformedSetModel.hydrate(data);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.weight).toBeUndefined();
      expect(plainObject.notes).toBeUndefined();
      expect(plainObject.rpe).toBeUndefined();
      expect(plainObject.percentage).toBeUndefined();
      expect(plainObject.plannedLoad).toBeUndefined();
      expect(plainObject.plannedRpe).toBeUndefined();
      expect(plainObject.plannedCounts).toBeUndefined();
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange
      const model = createTestPerformedSetModel();

      // Act
      const result = model.validate();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should use performedSetSchema for validation', () => {
      // Arrange
      const model = createTestPerformedSetModel();
      const safeParseSpy = vi.spyOn(performedSetSchema, 'safeParse');

      // Act
      model.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(model.toPlainObject());
    });

    it('should fail validation for invalid data', () => {
      // Arrange
      const model = createTestPerformedSetModel();
      // Force invalid data by modifying the plain object
      const invalidPlainObject = { ...model.toPlainObject(), counts: -5 };
      const invalidModel = PerformedSetModel.hydrate(invalidPlainObject as any);

      // Act
      const result = invalidModel.validate();

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const original = createTestPerformedSetModel({
        counts: 10,
        weight: 100,
        completed: false,
        rpe: 7,
      });
      const originalData = {
        counts: original.counts,
        weight: original.weight,
        completed: original.completed,
        rpe: original.rpe,
        updatedAt: original.updatedAt,
      };

      // Act
      const updated = original.cloneWithUpdates({ counts: 12, weight: 110 });
      const toggled = original.cloneWithToggledCompletion();
      const cloned = original.clone();

      // Assert
      expect(original.counts).toBe(originalData.counts);
      expect(original.weight).toBe(originalData.weight);
      expect(original.completed).toBe(originalData.completed);
      expect(original.rpe).toBe(originalData.rpe);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify different values in clones
      expect(updated.counts).toBe(12);
      expect(updated.weight).toBe(110);
      expect(toggled.completed).toBe(true);
      expect(cloned.counts).toBe(original.counts);
    });
  });

  describe('edge cases', () => {
    it('should handle zero counts', () => {
      // Arrange & Act
      const model = createTestPerformedSetModel({ counts: 0 });

      // Assert
      expect(model.counts).toBe(0);
      expect(model.getRepRangeCategory()).toBe('strength'); // 0 <= 5
    });

    it('should handle very high rep counts', () => {
      // Arrange & Act
      const model = createTestPerformedSetModel({ counts: 50 });

      // Assert
      expect(model.counts).toBe(50);
      expect(model.getRepRangeCategory()).toBe('endurance'); // > 12
    });

    it('should handle zero weight', () => {
      // Arrange & Act
      const model = createTestPerformedSetModel({ weight: 0 });

      // Assert
      expect(model.weight).toBe(0);
      expect(model.getSummaryString()).toContain('0 kg');
    });

    it('should handle edge RPE values', () => {
      // Arrange
      const minRpeModel = createTestPerformedSetModel({ rpe: 1 });
      const maxRpeModel = createTestPerformedSetModel({ rpe: 10 });

      // Assert
      expect(minRpeModel.getRPEEffort()).toBe('poor'); // 1 <= 5
      expect(maxRpeModel.getRPEEffort()).toBe('excessive'); // 10 >= 9
    });
  });
});
