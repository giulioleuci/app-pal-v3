import { describe, expect, it, vi } from 'vitest';

import {
  BrzyckiFormula,
  EpleyFormula,
  IOneRepMaxFormula,
  LanderFormula,
} from '@/features/max-log/domain/IOneRepMaxFormula';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogData } from '@/shared/types';
import { createTestMaxLogData } from '@/test-factories';

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
    maxLogSchema: {
      safeParse: vi.fn(() => ({ success: true, data: {} })),
    },
  };
});

describe('MaxLogModel', () => {
  describe('Static factory method', () => {
    it('should create instance via hydrate method with default formulas', () => {
      const data = createTestMaxLogData();
      const model = MaxLogModel.hydrate(data);

      expect(model).toBeInstanceOf(MaxLogModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.exerciseId).toBe(data.exerciseId);
      expect(model.weightEnteredByUser).toBe(data.weightEnteredByUser);
      expect(model.reps).toBe(data.reps);
      expect(model.date).toBe(data.date);
      expect(model.notes).toBe(data.notes);
    });

    it('should create instance with custom formulas', () => {
      const data = createTestMaxLogData();
      const customFormulas: IOneRepMaxFormula[] = [new LanderFormula()];
      const model = MaxLogModel.hydrate(data, customFormulas);

      expect(model).toBeInstanceOf(MaxLogModel);
      expect(model.estimated1RM).toBeGreaterThan(0);
    });

    it('should calculate estimated1RM as average of provided formulas', () => {
      const data = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 5,
      });

      const brzyckiFormula = new BrzyckiFormula();
      const epleyFormula = new EpleyFormula();
      const customFormulas = [brzyckiFormula, epleyFormula];

      const model = MaxLogModel.hydrate(data, customFormulas);

      const brzyckiResult = brzyckiFormula.calculate(100, 5);
      const epleyResult = epleyFormula.calculate(100, 5);
      const expectedAverage = (brzyckiResult + epleyResult) / 2;

      expect(model.estimated1RM).toBeCloseTo(expectedAverage, 2);
    });

    it('should store specific formula results for compatibility', () => {
      const data = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 5,
      });

      const model = MaxLogModel.hydrate(data);

      const brzyckiExpected = new BrzyckiFormula().calculate(100, 5);
      const epleyExpected = new EpleyFormula().calculate(100, 5);

      expect(model.maxBrzycki).toBeCloseTo(brzyckiExpected, 2);
      expect(model.maxBaechle).toBeCloseTo(epleyExpected, 2);
    });

    it('should handle empty formulas array', () => {
      const data = createTestMaxLogData();
      const model = MaxLogModel.hydrate(data, []);

      expect(model.estimated1RM).toBe(0);
    });
  });

  describe('Business logic methods', () => {
    describe('isDirect1RM', () => {
      it('should return true when reps equals 1', () => {
        const model = MaxLogModel.hydrate(createTestMaxLogData({ reps: 1 }));

        expect(model.isDirect1RM()).toBe(true);
      });

      it('should return false when reps is greater than 1', () => {
        const model = MaxLogModel.hydrate(createTestMaxLogData({ reps: 5 }));

        expect(model.isDirect1RM()).toBe(false);
      });

      it('should return false when reps is 0', () => {
        const model = MaxLogModel.hydrate(createTestMaxLogData({ reps: 0 }));

        expect(model.isDirect1RM()).toBe(false);
      });
    });

    describe('getPrimaryEstimate', () => {
      it('should return the estimated1RM value', () => {
        const data = createTestMaxLogData({
          weightEnteredByUser: 100,
          reps: 3,
        });
        const model = MaxLogModel.hydrate(data);

        expect(model.getPrimaryEstimate()).toBe(model.estimated1RM);
        expect(model.getPrimaryEstimate()).toBeGreaterThan(100);
      });
    });

    describe('comparePerformance', () => {
      it('should calculate performance difference correctly', () => {
        const model1 = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 1,
          })
        );
        const model2 = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 90,
            reps: 1,
          })
        );

        const comparison = model1.comparePerformance(model2);

        expect(comparison.differenceKg).toBe(10);
        expect(comparison.percentageImprovement).toBeCloseTo(11.11, 2);
      });

      it('should handle zero baseline performance', () => {
        const model1 = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 1,
          })
        );

        // Create a model with 0 estimated1RM
        const model2 = MaxLogModel.hydrate(createTestMaxLogData(), []);

        const comparison = model1.comparePerformance(model2);

        expect(comparison.differenceKg).toBe(100);
        expect(comparison.percentageImprovement).toBe(0);
      });

      it('should calculate negative improvement for regression', () => {
        const model1 = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 90,
            reps: 1,
          })
        );
        const model2 = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 1,
          })
        );

        const comparison = model1.comparePerformance(model2);

        expect(comparison.differenceKg).toBe(-10);
        expect(comparison.percentageImprovement).toBe(-10);
      });
    });

    describe('calculateBodyweightRatio', () => {
      it('should calculate lift-to-bodyweight ratio correctly', () => {
        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 1,
          })
        );

        const ratio = model.calculateBodyweightRatio(80);

        expect(ratio).toBe(1.25);
      });

      it('should return 0 for zero or negative bodyweight', () => {
        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 1,
          })
        );

        expect(model.calculateBodyweightRatio(0)).toBe(0);
        expect(model.calculateBodyweightRatio(-70)).toBe(0);
      });

      it('should handle decimal bodyweight', () => {
        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 120,
            reps: 1,
          })
        );

        const ratio = model.calculateBodyweightRatio(75.5);

        expect(ratio).toBeCloseTo(1.59, 2);
      });
    });

    describe('getSummaryString', () => {
      it('should generate human-readable summary', () => {
        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 5,
          })
        );

        const summary = model.getSummaryString();

        expect(summary).toMatch(/100kg x 5 reps \(e1RM: \d+\.\d+kg\)/);
        expect(summary).toContain('100kg x 5 reps');
        expect(summary).toContain('e1RM:');
      });

      it('should format estimated 1RM to one decimal place', () => {
        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 3,
          })
        );

        const summary = model.getSummaryString();
        const match = summary.match(/e1RM: (\d+\.\d)kg/);

        expect(match).toBeTruthy();
        expect(match![1]).toMatch(/^\d+\.\d$/);
      });
    });

    describe('isOlderThan', () => {
      it('should return true when log date is before comparison date', () => {
        const oldDate = new Date('2023-01-01');
        const newDate = new Date('2023-02-01');

        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            date: oldDate,
          })
        );

        expect(model.isOlderThan(newDate)).toBe(true);
      });

      it('should return false when log date is after comparison date', () => {
        const newDate = new Date('2023-02-01');
        const oldDate = new Date('2023-01-01');

        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            date: newDate,
          })
        );

        expect(model.isOlderThan(oldDate)).toBe(false);
      });

      it('should return false when dates are equal', () => {
        const sameDate = new Date('2023-01-01');

        const model = MaxLogModel.hydrate(
          createTestMaxLogData({
            date: sameDate,
          })
        );

        expect(model.isOlderThan(sameDate)).toBe(false);
      });
    });
  });

  describe('Strategy pattern integration', () => {
    it('should use injected strategies correctly for calculation', () => {
      const mockFormula1: IOneRepMaxFormula = {
        calculate: vi.fn(() => 110),
      };
      const mockFormula2: IOneRepMaxFormula = {
        calculate: vi.fn(() => 120),
      };

      const data = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 5,
      });

      const model = MaxLogModel.hydrate(data, [mockFormula1, mockFormula2]);

      expect(mockFormula1.calculate).toHaveBeenCalledWith(100, 5);
      expect(mockFormula2.calculate).toHaveBeenCalledWith(100, 5);
      expect(model.estimated1RM).toBe(115); // Average of 110 and 120
    });

    it('should handle single formula strategy', () => {
      const mockFormula: IOneRepMaxFormula = {
        calculate: vi.fn(() => 125),
      };

      const data = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 3,
      });

      const model = MaxLogModel.hydrate(data, [mockFormula]);

      expect(model.estimated1RM).toBe(125);
    });

    it('should work with mixed formula types', () => {
      const brzyckiFormula = new BrzyckiFormula();
      const customFormula: IOneRepMaxFormula = {
        calculate: vi.fn(() => 130),
      };

      const data = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 5,
      });

      const model = MaxLogModel.hydrate(data, [brzyckiFormula, customFormula]);

      const brzyckiResult = brzyckiFormula.calculate(100, 5);
      const expectedAverage = (brzyckiResult + 130) / 2;

      expect(model.estimated1RM).toBeCloseTo(expectedAverage, 2);
    });
  });

  describe('Immutability', () => {
    describe('cloneWithUpdatedDetails', () => {
      it('should create new instance with updated weight', () => {
        const originalModel = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 5,
          })
        );

        const newModel = originalModel.cloneWithUpdatedDetails({
          weight: 110,
        });

        expect(newModel).not.toBe(originalModel);
        expect(newModel.weightEnteredByUser).toBe(110);
        expect(originalModel.weightEnteredByUser).toBe(100);
      });

      it('should create new instance with updated reps', () => {
        const originalModel = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 5,
          })
        );

        const newModel = originalModel.cloneWithUpdatedDetails({
          reps: 8,
        });

        expect(newModel).not.toBe(originalModel);
        expect(newModel.reps).toBe(8);
        expect(originalModel.reps).toBe(5);
      });

      it('should create new instance with updated date', () => {
        const originalDate = new Date('2023-01-01');
        const newDate = new Date('2023-02-01');

        const originalModel = MaxLogModel.hydrate(
          createTestMaxLogData({
            date: originalDate,
          })
        );

        const newModel = originalModel.cloneWithUpdatedDetails({
          date: newDate,
        });

        expect(newModel).not.toBe(originalModel);
        expect(newModel.date).toBe(newDate);
        expect(originalModel.date).toBe(originalDate);
      });

      it('should create new instance with updated notes', () => {
        const originalModel = MaxLogModel.hydrate(
          createTestMaxLogData({
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithUpdatedDetails({
          notes: 'Updated notes',
        });

        expect(newModel).not.toBe(originalModel);
        expect(newModel.notes).toBe('Updated notes');
        expect(originalModel.notes).toBe('Original notes');
      });

      it('should handle multiple updates simultaneously', () => {
        const originalModel = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 5,
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithUpdatedDetails({
          weight: 110,
          reps: 8,
          notes: 'Updated notes',
        });

        expect(newModel).not.toBe(originalModel);
        expect(newModel.weightEnteredByUser).toBe(110);
        expect(newModel.reps).toBe(8);
        expect(newModel.notes).toBe('Updated notes');
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = MaxLogModel.hydrate(createTestMaxLogData());
        const originalUpdatedAt = originalModel.updatedAt;

        // Mock Date.now to ensure different timestamp
        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithUpdatedDetails({
          weight: 110,
        });

        expect(newModel.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

        vi.useRealTimers();
      });

      it('should preserve id, profileId, exerciseId, and createdAt', () => {
        const originalModel = MaxLogModel.hydrate(createTestMaxLogData());

        const newModel = originalModel.cloneWithUpdatedDetails({
          weight: 110,
        });

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.profileId).toBe(originalModel.profileId);
        expect(newModel.exerciseId).toBe(originalModel.exerciseId);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });
    });

    describe('clone', () => {
      it('should create structurally equivalent deep clone', () => {
        const originalModel = MaxLogModel.hydrate(
          createTestMaxLogData({
            weightEnteredByUser: 100,
            reps: 5,
            notes: 'Test notes',
          })
        );

        const clonedModel = originalModel.clone();

        expect(clonedModel).not.toBe(originalModel);
        expect(clonedModel.id).toBe(originalModel.id);
        expect(clonedModel.profileId).toBe(originalModel.profileId);
        expect(clonedModel.exerciseId).toBe(originalModel.exerciseId);
        expect(clonedModel.weightEnteredByUser).toBe(originalModel.weightEnteredByUser);
        expect(clonedModel.reps).toBe(originalModel.reps);
        expect(clonedModel.notes).toBe(originalModel.notes);
        expect(clonedModel.estimated1RM).toBe(originalModel.estimated1RM);
      });
    });
  });

  describe('Serialization', () => {
    describe('toPlainObject', () => {
      it('should convert model back to plain data object', () => {
        const originalData = createTestMaxLogData({
          weightEnteredByUser: 100,
          reps: 5,
          notes: 'Test notes',
        });
        const model = MaxLogModel.hydrate(originalData);

        const plainObject = model.toPlainObject();

        expect(plainObject.id).toBe(originalData.id);
        expect(plainObject.profileId).toBe(originalData.profileId);
        expect(plainObject.exerciseId).toBe(originalData.exerciseId);
        expect(plainObject.weightEnteredByUser).toBe(originalData.weightEnteredByUser);
        expect(plainObject.reps).toBe(originalData.reps);
        expect(plainObject.notes).toBe(originalData.notes);
        expect(plainObject.createdAt).toBe(originalData.createdAt);
        expect(plainObject.updatedAt).toBe(originalData.updatedAt);
      });

      it('should serialize all required properties', () => {
        const model = MaxLogModel.hydrate(createTestMaxLogData());

        const plainObject = model.toPlainObject();

        expect(plainObject).toHaveProperty('id');
        expect(plainObject).toHaveProperty('profileId');
        expect(plainObject).toHaveProperty('exerciseId');
        expect(plainObject).toHaveProperty('weightEnteredByUser');
        expect(plainObject).toHaveProperty('date');
        expect(plainObject).toHaveProperty('reps');
        expect(plainObject).toHaveProperty('estimated1RM');
        expect(plainObject).toHaveProperty('maxBrzycki');
        expect(plainObject).toHaveProperty('maxBaechle');
        expect(plainObject).toHaveProperty('createdAt');
        expect(plainObject).toHaveProperty('updatedAt');
      });

      it('should handle optional notes property', () => {
        const modelWithNotes = MaxLogModel.hydrate(
          createTestMaxLogData({
            notes: 'Test notes',
          })
        );
        const modelWithoutNotes = MaxLogModel.hydrate(
          createTestMaxLogData({
            notes: undefined,
          })
        );

        const plainObjectWithNotes = modelWithNotes.toPlainObject();
        const plainObjectWithoutNotes = modelWithoutNotes.toPlainObject();

        expect(plainObjectWithNotes.notes).toBe('Test notes');
        expect(plainObjectWithoutNotes.notes).toBeUndefined();
      });
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should call validation schema safeParse method', () => {
        const model = MaxLogModel.hydrate(createTestMaxLogData());

        const result = model.validate();

        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle zero weight with formulas', () => {
      const model = MaxLogModel.hydrate(
        createTestMaxLogData({
          weightEnteredByUser: 0,
          reps: 5,
        })
      );

      expect(model.estimated1RM).toBe(0);
      expect(model.maxBrzycki).toBe(0);
      expect(model.maxBaechle).toBe(0);
    });

    it('should handle zero reps with formulas', () => {
      const model = MaxLogModel.hydrate(
        createTestMaxLogData({
          weightEnteredByUser: 100,
          reps: 0,
        })
      );

      expect(model.estimated1RM).toBe(0);
      expect(model.maxBrzycki).toBe(0);
      expect(model.maxBaechle).toBe(0);
    });

    it('should handle 1RM correctly (reps = 1)', () => {
      const model = MaxLogModel.hydrate(
        createTestMaxLogData({
          weightEnteredByUser: 100,
          reps: 1,
        })
      );

      expect(model.estimated1RM).toBe(100);
      expect(model.maxBrzycki).toBe(100);
      expect(model.maxBaechle).toBe(100);
      expect(model.isDirect1RM()).toBe(true);
    });

    it('should handle high rep ranges', () => {
      const model = MaxLogModel.hydrate(
        createTestMaxLogData({
          weightEnteredByUser: 50,
          reps: 20,
        })
      );

      expect(model.estimated1RM).toBeGreaterThan(50);
      expect(model.maxBrzycki).toBeGreaterThan(0);
      expect(model.maxBaechle).toBeGreaterThan(0);
    });

    it('should handle decimal weights and reps', () => {
      const model = MaxLogModel.hydrate(
        createTestMaxLogData({
          weightEnteredByUser: 87.5,
          reps: 6,
        })
      );

      expect(model.estimated1RM).toBeGreaterThan(87.5);
      expect(typeof model.estimated1RM).toBe('number');
    });

    it('should maintain consistency between strategy calculations', () => {
      const data = createTestMaxLogData({
        weightEnteredByUser: 100,
        reps: 5,
      });

      const model1 = MaxLogModel.hydrate(data);
      const model2 = MaxLogModel.hydrate(data);

      expect(model1.estimated1RM).toBe(model2.estimated1RM);
      expect(model1.maxBrzycki).toBe(model2.maxBrzycki);
      expect(model1.maxBaechle).toBe(model2.maxBaechle);
    });
  });
});
