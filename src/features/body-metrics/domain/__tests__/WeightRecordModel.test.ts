import { describe, expect, it, vi } from 'vitest';

import { WeightRecordModel } from '@/features/body-metrics/domain/WeightRecordModel';
import { WeightRecordData } from '@/shared/types';
import { createTestWeightRecordData } from '@/test-factories';

// Mock immer's produce function
vi.mock('immer', async () => {
  const actual = await vi.importActual('immer');
  return {
    ...actual,
    produce: vi.fn((obj, fn) => {
      const draft = structuredClone(obj);
      fn?.(draft);
      return draft;
    }),
  };
});

// Mock date-fns
vi.mock('date-fns', () => ({
  isBefore: vi.fn((date1: Date, date2: Date) => date1.getTime() < date2.getTime()),
}));

// Mock external dependencies
vi.mock('@/shared/domain', () => ({
  BaseModel: class {
    constructor(props: any) {
      Object.assign(this, props);
    }
  },
}));

vi.mock('@/shared/types', async () => {
  const actual = await vi.importActual('@/shared/types');
  return {
    ...actual,
    weightRecordSchema: {
      safeParse: vi.fn(() => ({ success: true, data: {} })),
    },
  };
});

describe('WeightRecordModel', () => {
  describe('Static factory method', () => {
    it('should create instance via hydrate method', () => {
      const data = createTestWeightRecordData();
      const model = WeightRecordModel.hydrate(data);

      expect(model).toBeInstanceOf(WeightRecordModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.date).toBe(data.date);
      expect(model.weight).toBe(data.weight);
      expect(model.notes).toBe(data.notes);
    });

    it('should handle missing optional notes', () => {
      const data = createTestWeightRecordData({ notes: undefined });
      const model = WeightRecordModel.hydrate(data);

      expect(model.notes).toBeUndefined();
    });
  });

  describe('Business logic methods', () => {
    describe('isHeavierThan', () => {
      it('should return true when this weight is greater than other weight', () => {
        const heavierModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 80,
          })
        );
        const lighterModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
          })
        );

        expect(heavierModel.isHeavierThan(lighterModel)).toBe(true);
      });

      it('should return false when this weight is less than other weight', () => {
        const lighterModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 70,
          })
        );
        const heavierModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
          })
        );

        expect(lighterModel.isHeavierThan(heavierModel)).toBe(false);
      });

      it('should return false when weights are equal', () => {
        const model1 = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
          })
        );
        const model2 = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
          })
        );

        expect(model1.isHeavierThan(model2)).toBe(false);
      });

      it('should handle decimal weights', () => {
        const model1 = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75.5,
          })
        );
        const model2 = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75.4,
          })
        );

        expect(model1.isHeavierThan(model2)).toBe(true);
      });
    });

    describe('wasRecordedBefore', () => {
      it('should return true when record date is before comparison date', () => {
        const earlierDate = new Date('2023-01-01');
        const laterDate = new Date('2023-02-01');

        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            date: earlierDate,
          })
        );

        expect(model.wasRecordedBefore(laterDate)).toBe(true);
      });

      it('should return false when record date is after comparison date', () => {
        const laterDate = new Date('2023-02-01');
        const earlierDate = new Date('2023-01-01');

        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            date: laterDate,
          })
        );

        expect(model.wasRecordedBefore(earlierDate)).toBe(false);
      });

      it('should return false when dates are equal', () => {
        const sameDate = new Date('2023-01-01');

        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            date: sameDate,
          })
        );

        expect(model.wasRecordedBefore(sameDate)).toBe(false);
      });
    });

    describe('getWeightIn', () => {
      it('should return weight in kg when unit is kg', () => {
        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
          })
        );

        const weightInKg = model.getWeightIn('kg');

        expect(weightInKg).toBe(75);
      });

      it('should convert weight to lbs when unit is lbs', () => {
        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75, // kg
          })
        );

        const weightInLbs = model.getWeightIn('lbs');
        const expectedLbs = 75 * 2.20462;

        expect(weightInLbs).toBeCloseTo(expectedLbs, 5);
      });

      it('should handle decimal weights in conversion', () => {
        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 72.5, // kg
          })
        );

        const weightInLbs = model.getWeightIn('lbs');
        const expectedLbs = 72.5 * 2.20462;

        expect(weightInLbs).toBeCloseTo(expectedLbs, 5);
      });

      it('should handle zero weight', () => {
        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 0,
          })
        );

        expect(model.getWeightIn('kg')).toBe(0);
        expect(model.getWeightIn('lbs')).toBe(0);
      });

      it('should provide accurate conversion factor', () => {
        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 1,
          })
        );

        const weightInLbs = model.getWeightIn('lbs');

        expect(weightInLbs).toBe(2.20462);
      });
    });
  });

  describe('Immutability', () => {
    describe('cloneWithNewWeight', () => {
      it('should create new instance with updated weight', () => {
        const originalModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
          })
        );

        const newModel = originalModel.cloneWithNewWeight(80);

        expect(newModel).not.toBe(originalModel);
        expect(newModel.weight).toBe(80);
        expect(originalModel.weight).toBe(75);
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = WeightRecordModel.hydrate(createTestWeightRecordData());
        const originalUpdatedAt = originalModel.updatedAt;

        // Mock Date.now to ensure different timestamp
        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithNewWeight(80);

        expect(newModel.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

        vi.useRealTimers();
      });

      it('should preserve other properties', () => {
        const originalModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewWeight(80);

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.profileId).toBe(originalModel.profileId);
        expect(newModel.date).toBe(originalModel.date);
        expect(newModel.notes).toBe(originalModel.notes);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });

      it('should handle decimal weight values', () => {
        const originalModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
          })
        );

        const newModel = originalModel.cloneWithNewWeight(77.5);

        expect(newModel.weight).toBe(77.5);
      });
    });

    describe('cloneWithNewNotes', () => {
      it('should create new instance with updated notes', () => {
        const originalModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewNotes('Updated notes');

        expect(newModel).not.toBe(originalModel);
        expect(newModel.notes).toBe('Updated notes');
        expect(originalModel.notes).toBe('Original notes');
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = WeightRecordModel.hydrate(createTestWeightRecordData());
        const originalUpdatedAt = originalModel.updatedAt;

        // Mock Date.now to ensure different timestamp
        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithNewNotes('Updated notes');

        expect(newModel.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

        vi.useRealTimers();
      });

      it('should preserve other properties', () => {
        const originalModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewNotes('Updated notes');

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.profileId).toBe(originalModel.profileId);
        expect(newModel.date).toBe(originalModel.date);
        expect(newModel.weight).toBe(originalModel.weight);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });

      it('should handle empty notes', () => {
        const originalModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewNotes('');

        expect(newModel.notes).toBe('');
      });
    });

    describe('clone', () => {
      it('should create structurally equivalent deep clone', () => {
        const originalModel = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            weight: 75,
            notes: 'Test notes',
          })
        );

        const clonedModel = originalModel.clone();

        expect(clonedModel).not.toBe(originalModel);
        expect(clonedModel.id).toBe(originalModel.id);
        expect(clonedModel.profileId).toBe(originalModel.profileId);
        expect(clonedModel.date).toEqual(originalModel.date);
        expect(clonedModel.weight).toBe(originalModel.weight);
        expect(clonedModel.notes).toBe(originalModel.notes);
        expect(clonedModel.createdAt).toEqual(originalModel.createdAt);
        expect(clonedModel.updatedAt).toEqual(originalModel.updatedAt);
      });
    });
  });

  describe('Serialization', () => {
    describe('toPlainObject', () => {
      it('should convert model back to plain data object', () => {
        const originalData = createTestWeightRecordData({
          weight: 75,
          notes: 'Test notes',
        });
        const model = WeightRecordModel.hydrate(originalData);

        const plainObject = model.toPlainObject();

        expect(plainObject).toEqual(originalData);
      });

      it('should serialize all required properties', () => {
        const model = WeightRecordModel.hydrate(createTestWeightRecordData());

        const plainObject = model.toPlainObject();

        expect(plainObject).toHaveProperty('id');
        expect(plainObject).toHaveProperty('profileId');
        expect(plainObject).toHaveProperty('date');
        expect(plainObject).toHaveProperty('weight');
        expect(plainObject).toHaveProperty('createdAt');
        expect(plainObject).toHaveProperty('updatedAt');
      });

      it('should handle optional notes property', () => {
        const modelWithNotes = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            notes: 'Test notes',
          })
        );
        const modelWithoutNotes = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            notes: undefined,
          })
        );

        const plainObjectWithNotes = modelWithNotes.toPlainObject();
        const plainObjectWithoutNotes = modelWithoutNotes.toPlainObject();

        expect(plainObjectWithNotes.notes).toBe('Test notes');
        expect(plainObjectWithoutNotes.notes).toBeUndefined();
      });

      it('should maintain data types in serialization', () => {
        const testDate = new Date('2023-05-15');
        const model = WeightRecordModel.hydrate(
          createTestWeightRecordData({
            date: testDate,
            weight: 75.5,
          })
        );

        const plainObject = model.toPlainObject();

        expect(plainObject.date).toBeInstanceOf(Date);
        expect(plainObject.weight).toBe(75.5);
        expect(typeof plainObject.weight).toBe('number');
      });
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should call validation schema safeParse method', () => {
        const model = WeightRecordModel.hydrate(createTestWeightRecordData());

        const result = model.validate();

        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle minimum weight values', () => {
      const model = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: 0.1,
        })
      );

      expect(model.weight).toBe(0.1);
      expect(model.getWeightIn('kg')).toBe(0.1);
      expect(model.getWeightIn('lbs')).toBeCloseTo(0.1 * 2.20462, 5);
    });

    it('should handle maximum reasonable weight values', () => {
      const model = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: 300,
        })
      );

      expect(model.weight).toBe(300);
      expect(model.getWeightIn('kg')).toBe(300);
      expect(model.getWeightIn('lbs')).toBeCloseTo(300 * 2.20462, 5);
    });

    it('should handle very precise decimal weights', () => {
      const preciseWeight = 75.123456789;
      const model = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: preciseWeight,
        })
      );

      expect(model.weight).toBe(preciseWeight);
      expect(model.getWeightIn('kg')).toBe(preciseWeight);
    });

    it('should handle same-day weight records correctly', () => {
      const sameDate = new Date('2023-05-15');
      const model1 = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: 75,
          date: sameDate,
        })
      );
      const model2 = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: 76,
          date: sameDate,
        })
      );

      expect(model1.wasRecordedBefore(sameDate)).toBe(false);
      expect(model2.isHeavierThan(model1)).toBe(true);
    });

    it('should maintain consistency in weight comparisons', () => {
      const weight1 = 75.0;
      const weight2 = 75;

      const model1 = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: weight1,
        })
      );
      const model2 = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: weight2,
        })
      );

      expect(model1.isHeavierThan(model2)).toBe(false);
      expect(model2.isHeavierThan(model1)).toBe(false);
    });

    it('should handle string-to-Date conversion edge cases', () => {
      const model = WeightRecordModel.hydrate(createTestWeightRecordData());
      const comparisonDate = new Date('invalid-date');

      // Should not throw error even with invalid dates
      expect(() => model.wasRecordedBefore(comparisonDate)).not.toThrow();
    });

    it('should preserve immutability across multiple operations', () => {
      const originalModel = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: 75,
          notes: 'Original',
        })
      );

      const weightUpdatedModel = originalModel.cloneWithNewWeight(80);
      const notesUpdatedModel = originalModel.cloneWithNewNotes('Updated');

      // Original should remain unchanged
      expect(originalModel.weight).toBe(75);
      expect(originalModel.notes).toBe('Original');

      // Cloned models should have specific changes
      expect(weightUpdatedModel.weight).toBe(80);
      expect(weightUpdatedModel.notes).toBe('Original');
      expect(notesUpdatedModel.weight).toBe(75);
      expect(notesUpdatedModel.notes).toBe('Updated');
    });
  });
});
