import { describe, expect, it, vi } from 'vitest';

import { HeightRecordModel } from '@/features/body-metrics/domain/HeightRecordModel';
import { HeightRecordData } from '@/shared/types';
import { createTestHeightRecordData } from '@/test-factories';

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
    heightRecordSchema: {
      safeParse: vi.fn(() => ({ success: true, data: {} })),
    },
  };
});

describe('HeightRecordModel', () => {
  describe('Static factory method', () => {
    it('should create instance via hydrate method', () => {
      const data = createTestHeightRecordData();
      const model = HeightRecordModel.hydrate(data);

      expect(model).toBeInstanceOf(HeightRecordModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.date).toBe(data.date);
      expect(model.height).toBe(data.height);
      expect(model.notes).toBe(data.notes);
    });

    it('should handle missing optional notes', () => {
      const data = createTestHeightRecordData({ notes: undefined });
      const model = HeightRecordModel.hydrate(data);

      expect(model.notes).toBeUndefined();
    });
  });

  describe('Business logic methods', () => {
    describe('isTallerThan', () => {
      it('should return true when this height is greater than other height', () => {
        const tallerModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 180,
          })
        );
        const shorterModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
          })
        );

        expect(tallerModel.isTallerThan(shorterModel)).toBe(true);
      });

      it('should return false when this height is less than other height', () => {
        const shorterModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 170,
          })
        );
        const tallerModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
          })
        );

        expect(shorterModel.isTallerThan(tallerModel)).toBe(false);
      });

      it('should return false when heights are equal', () => {
        const model1 = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
          })
        );
        const model2 = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
          })
        );

        expect(model1.isTallerThan(model2)).toBe(false);
      });

      it('should handle decimal heights', () => {
        const model1 = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175.5,
          })
        );
        const model2 = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175.4,
          })
        );

        expect(model1.isTallerThan(model2)).toBe(true);
      });
    });

    describe('wasRecordedBefore', () => {
      it('should return true when record date is before comparison date', () => {
        const earlierDate = new Date('2023-01-01');
        const laterDate = new Date('2023-02-01');

        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            date: earlierDate,
          })
        );

        expect(model.wasRecordedBefore(laterDate)).toBe(true);
      });

      it('should return false when record date is after comparison date', () => {
        const laterDate = new Date('2023-02-01');
        const earlierDate = new Date('2023-01-01');

        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            date: laterDate,
          })
        );

        expect(model.wasRecordedBefore(earlierDate)).toBe(false);
      });

      it('should return false when dates are equal', () => {
        const sameDate = new Date('2023-01-01');

        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            date: sameDate,
          })
        );

        expect(model.wasRecordedBefore(sameDate)).toBe(false);
      });
    });

    describe('getHeightIn', () => {
      it('should return height in cm when unit is cm', () => {
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
          })
        );

        const heightInCm = model.getHeightIn('cm');

        expect(heightInCm).toBe(175);
      });

      it('should convert height to inches when unit is inches', () => {
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175, // cm
          })
        );

        const heightInInches = model.getHeightIn('inches');
        const expectedInches = 175 / 2.54;

        expect(heightInInches).toBeCloseTo(expectedInches, 5);
      });

      it('should handle decimal heights in conversion', () => {
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 172.5, // cm
          })
        );

        const heightInInches = model.getHeightIn('inches');
        const expectedInches = 172.5 / 2.54;

        expect(heightInInches).toBeCloseTo(expectedInches, 5);
      });

      it('should handle zero height', () => {
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 0,
          })
        );

        expect(model.getHeightIn('cm')).toBe(0);
        expect(model.getHeightIn('inches')).toBe(0);
      });

      it('should provide accurate conversion factor', () => {
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 2.54, // exactly 1 inch in cm
          })
        );

        const heightInInches = model.getHeightIn('inches');

        expect(heightInInches).toBe(1);
      });

      it('should handle common height conversions', () => {
        // Test 6 feet (72 inches) = 182.88 cm
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 182.88,
          })
        );

        const heightInInches = model.getHeightIn('inches');

        expect(heightInInches).toBeCloseTo(72, 1);
      });
    });
  });

  describe('Immutability', () => {
    describe('cloneWithNewHeight', () => {
      it('should create new instance with updated height', () => {
        const originalModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
          })
        );

        const newModel = originalModel.cloneWithNewHeight(180);

        expect(newModel).not.toBe(originalModel);
        expect(newModel.height).toBe(180);
        expect(originalModel.height).toBe(175);
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = HeightRecordModel.hydrate(createTestHeightRecordData());
        const originalUpdatedAt = originalModel.updatedAt;

        // Mock Date.now to ensure different timestamp
        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithNewHeight(180);

        expect(newModel.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

        vi.useRealTimers();
      });

      it('should preserve other properties', () => {
        const originalModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewHeight(180);

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.profileId).toBe(originalModel.profileId);
        expect(newModel.date).toBe(originalModel.date);
        expect(newModel.notes).toBe(originalModel.notes);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });

      it('should handle decimal height values', () => {
        const originalModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
          })
        );

        const newModel = originalModel.cloneWithNewHeight(177.5);

        expect(newModel.height).toBe(177.5);
      });
    });

    describe('cloneWithNewNotes', () => {
      it('should create new instance with updated notes', () => {
        const originalModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewNotes('Updated notes');

        expect(newModel).not.toBe(originalModel);
        expect(newModel.notes).toBe('Updated notes');
        expect(originalModel.notes).toBe('Original notes');
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = HeightRecordModel.hydrate(createTestHeightRecordData());
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
        const originalModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewNotes('Updated notes');

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.profileId).toBe(originalModel.profileId);
        expect(newModel.date).toBe(originalModel.date);
        expect(newModel.height).toBe(originalModel.height);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });

      it('should handle empty notes', () => {
        const originalModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            notes: 'Original notes',
          })
        );

        const newModel = originalModel.cloneWithNewNotes('');

        expect(newModel.notes).toBe('');
      });
    });

    describe('clone', () => {
      it('should create structurally equivalent deep clone', () => {
        const originalModel = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: 175,
            notes: 'Test notes',
          })
        );

        const clonedModel = originalModel.clone();

        expect(clonedModel).not.toBe(originalModel);
        expect(clonedModel.id).toBe(originalModel.id);
        expect(clonedModel.profileId).toBe(originalModel.profileId);
        expect(clonedModel.date).toEqual(originalModel.date);
        expect(clonedModel.height).toBe(originalModel.height);
        expect(clonedModel.notes).toBe(originalModel.notes);
        expect(clonedModel.createdAt).toEqual(originalModel.createdAt);
        expect(clonedModel.updatedAt).toEqual(originalModel.updatedAt);
      });
    });
  });

  describe('Serialization', () => {
    describe('toPlainObject', () => {
      it('should convert model back to plain data object', () => {
        const originalData = createTestHeightRecordData({
          height: 175,
          notes: 'Test notes',
        });
        const model = HeightRecordModel.hydrate(originalData);

        const plainObject = model.toPlainObject();

        expect(plainObject).toEqual(originalData);
      });

      it('should serialize all required properties', () => {
        const model = HeightRecordModel.hydrate(createTestHeightRecordData());

        const plainObject = model.toPlainObject();

        expect(plainObject).toHaveProperty('id');
        expect(plainObject).toHaveProperty('profileId');
        expect(plainObject).toHaveProperty('date');
        expect(plainObject).toHaveProperty('height');
        expect(plainObject).toHaveProperty('createdAt');
        expect(plainObject).toHaveProperty('updatedAt');
      });

      it('should handle optional notes property', () => {
        const modelWithNotes = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            notes: 'Test notes',
          })
        );
        const modelWithoutNotes = HeightRecordModel.hydrate(
          createTestHeightRecordData({
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
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            date: testDate,
            height: 175.5,
          })
        );

        const plainObject = model.toPlainObject();

        expect(plainObject.date).toBeInstanceOf(Date);
        expect(plainObject.height).toBe(175.5);
        expect(typeof plainObject.height).toBe('number');
      });
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should call validation schema safeParse method', () => {
        const model = HeightRecordModel.hydrate(createTestHeightRecordData());

        const result = model.validate();

        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle minimum height values', () => {
      const model = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: 50, // very short height
        })
      );

      expect(model.height).toBe(50);
      expect(model.getHeightIn('cm')).toBe(50);
      expect(model.getHeightIn('inches')).toBeCloseTo(50 / 2.54, 5);
    });

    it('should handle maximum reasonable height values', () => {
      const model = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: 250, // very tall height
        })
      );

      expect(model.height).toBe(250);
      expect(model.getHeightIn('cm')).toBe(250);
      expect(model.getHeightIn('inches')).toBeCloseTo(250 / 2.54, 5);
    });

    it('should handle very precise decimal heights', () => {
      const preciseHeight = 175.123456789;
      const model = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: preciseHeight,
        })
      );

      expect(model.height).toBe(preciseHeight);
      expect(model.getHeightIn('cm')).toBe(preciseHeight);
    });

    it('should handle common imperial heights correctly', () => {
      // Test various common heights
      const testCases = [
        { cm: 152.4, inches: 60 }, // 5'0"
        { cm: 167.64, inches: 66 }, // 5'6"
        { cm: 182.88, inches: 72 }, // 6'0"
        { cm: 193.04, inches: 76 }, // 6'4"
      ];

      testCases.forEach(({ cm, inches }) => {
        const model = HeightRecordModel.hydrate(
          createTestHeightRecordData({
            height: cm,
          })
        );

        expect(model.getHeightIn('inches')).toBeCloseTo(inches, 1);
      });
    });

    it('should handle same-day height records correctly', () => {
      const sameDate = new Date('2023-05-15');
      const model1 = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: 175,
          date: sameDate,
        })
      );
      const model2 = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: 176,
          date: sameDate,
        })
      );

      expect(model1.wasRecordedBefore(sameDate)).toBe(false);
      expect(model2.isTallerThan(model1)).toBe(true);
    });

    it('should maintain consistency in height comparisons', () => {
      const height1 = 175.0;
      const height2 = 175;

      const model1 = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: height1,
        })
      );
      const model2 = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: height2,
        })
      );

      expect(model1.isTallerThan(model2)).toBe(false);
      expect(model2.isTallerThan(model1)).toBe(false);
    });

    it('should handle string-to-Date conversion edge cases', () => {
      const model = HeightRecordModel.hydrate(createTestHeightRecordData());
      const comparisonDate = new Date('invalid-date');

      // Should not throw error even with invalid dates
      expect(() => model.wasRecordedBefore(comparisonDate)).not.toThrow();
    });

    it('should preserve immutability across multiple operations', () => {
      const originalModel = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: 175,
          notes: 'Original',
        })
      );

      const heightUpdatedModel = originalModel.cloneWithNewHeight(180);
      const notesUpdatedModel = originalModel.cloneWithNewNotes('Updated');

      // Original should remain unchanged
      expect(originalModel.height).toBe(175);
      expect(originalModel.notes).toBe('Original');

      // Cloned models should have specific changes
      expect(heightUpdatedModel.height).toBe(180);
      expect(heightUpdatedModel.notes).toBe('Original');
      expect(notesUpdatedModel.height).toBe(175);
      expect(notesUpdatedModel.notes).toBe('Updated');
    });

    it('should handle conversion precision correctly', () => {
      // Test that conversion is reversible within reasonable precision
      const originalHeight = 175.5;
      const model = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: originalHeight,
        })
      );

      const heightInInches = model.getHeightIn('inches');
      const convertedBackToCm = heightInInches * 2.54;

      expect(convertedBackToCm).toBeCloseTo(originalHeight, 10);
    });

    it('should handle measurement system edge cases', () => {
      // Test fractional inch conversions
      const model = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: 177.8, // exactly 70 inches
        })
      );

      const heightInInches = model.getHeightIn('inches');
      expect(heightInInches).toBeCloseTo(70, 1);
    });
  });
});
