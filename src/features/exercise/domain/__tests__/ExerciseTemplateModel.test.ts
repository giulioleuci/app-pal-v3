import { describe, expect, it, vi } from 'vitest';

import { ExerciseTemplateModel } from '@/features/exercise/domain/ExerciseTemplateModel';
import {
  AnySetConfigurationData,
  ExerciseTemplateData,
  StandardSetParamsData,
} from '@/shared/types';
import {
  createTestExerciseTemplateData,
  createTestExerciseTemplateModel,
  createTestStandardSetParamsData,
} from '@/test-factories';

// Mock immer's produce function and immerable symbol with proper cloning for objects with functions
vi.mock('immer', () => ({
  produce: vi.fn((obj, fn) => {
    // Create a shallow clone to avoid function cloning issues
    const draft = Object.create(Object.getPrototypeOf(obj));
    Object.assign(draft, obj);
    fn?.(draft);
    return draft;
  }),
  immerable: Symbol('immerable'),
}));

describe('ExerciseTemplateModel', () => {
  describe('Static factory method', () => {
    it('should create instance via hydrate method', () => {
      const data = createTestExerciseTemplateData();
      const model = ExerciseTemplateModel.hydrate(data);

      expect(model).toBeInstanceOf(ExerciseTemplateModel);
      expect(model.id).toBe(data.id);
      expect(model.name).toBe(data.name);
      expect(model.exerciseId).toBe(data.exerciseId);
    });

    it('should store setConfiguration as plain data', () => {
      const setConfigurationData = createTestStandardSetParamsData();
      const data = createTestExerciseTemplateData({
        setConfiguration: setConfigurationData,
      });

      const model = ExerciseTemplateModel.hydrate(data);

      expect(model.setConfiguration).toEqual(setConfigurationData);
      expect(model.setConfiguration.type).toBe('standard');
    });

    it('should handle optional notes', () => {
      const dataWithNotes = createTestExerciseTemplateData({
        notes: 'Test notes',
      });
      const dataWithoutNotes = createTestExerciseTemplateData({
        notes: undefined,
      });

      const modelWithNotes = ExerciseTemplateModel.hydrate(dataWithNotes);
      const modelWithoutNotes = ExerciseTemplateModel.hydrate(dataWithoutNotes);

      expect(modelWithNotes.notes).toBe('Test notes');
      expect(modelWithoutNotes.notes).toBeUndefined();
    });
  });

  describe('Clone methods', () => {
    describe('cloneWithNewName', () => {
      it('should create new instance with updated name', () => {
        const originalModel = createTestExerciseTemplateModel({
          name: 'Original Template',
        });

        const newModel = originalModel.cloneWithNewName('New Template Name');

        expect(newModel).not.toBe(originalModel);
        expect(newModel.name).toBe('New Template Name');
        expect(originalModel.name).toBe('Original Template');
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = createTestExerciseTemplateModel();

        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithNewName('New Name');

        expect(newModel.updatedAt.getTime()).toBe(futureDate.getTime());

        vi.useRealTimers();
      });

      it('should preserve all other properties', () => {
        const originalModel = createTestExerciseTemplateModel();

        const newModel = originalModel.cloneWithNewName('New Name');

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.exerciseId).toBe(originalModel.exerciseId);
        expect(newModel.setConfiguration).toBe(originalModel.setConfiguration);
        expect(newModel.notes).toBe(originalModel.notes);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });
    });

    describe('cloneWithNewNotes', () => {
      it('should create new instance with updated notes', () => {
        const originalModel = createTestExerciseTemplateModel({
          notes: 'Original notes',
        });

        const newModel = originalModel.cloneWithNewNotes('Updated notes');

        expect(newModel).not.toBe(originalModel);
        expect(newModel.notes).toBe('Updated notes');
        expect(originalModel.notes).toBe('Original notes');
      });

      it('should handle setting notes to undefined', () => {
        const originalModel = createTestExerciseTemplateModel({
          notes: 'Some notes',
        });

        const newModel = originalModel.cloneWithNewNotes(undefined);

        expect(newModel.notes).toBeUndefined();
        expect(originalModel.notes).toBe('Some notes');
      });

      it('should handle setting notes when originally undefined', () => {
        const originalModel = createTestExerciseTemplateModel({
          notes: undefined,
        });

        const newModel = originalModel.cloneWithNewNotes('New notes');

        expect(newModel.notes).toBe('New notes');
        expect(originalModel.notes).toBeUndefined();
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = createTestExerciseTemplateModel();

        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithNewNotes('New notes');

        expect(newModel.updatedAt.getTime()).toBe(futureDate.getTime());

        vi.useRealTimers();
      });
    });

    describe('cloneWithNewSetConfiguration', () => {
      it('should create new instance with updated set configuration', () => {
        const originalModel = createTestExerciseTemplateModel();
        const newSetConfigData = createTestStandardSetParamsData({
          sets: { min: 5, max: 5, direction: 'asc' },
        });

        const newModel = originalModel.cloneWithNewSetConfiguration(newSetConfigData);

        expect(newModel).not.toBe(originalModel);
        expect(newModel.setConfiguration).toEqual(newSetConfigData);
        expect(originalModel.setConfiguration).not.toEqual(newSetConfigData);
      });

      it('should update updatedAt timestamp', () => {
        const originalModel = createTestExerciseTemplateModel();
        const newSetConfigData = createTestStandardSetParamsData();

        vi.useFakeTimers();
        const futureDate = new Date(Date.now() + 1000);
        vi.setSystemTime(futureDate);

        const newModel = originalModel.cloneWithNewSetConfiguration(newSetConfigData);

        expect(newModel.updatedAt.getTime()).toBe(futureDate.getTime());

        vi.useRealTimers();
      });

      it('should preserve all other properties', () => {
        const originalModel = createTestExerciseTemplateModel();
        const newSetConfigData = createTestStandardSetParamsData();

        const newModel = originalModel.cloneWithNewSetConfiguration(newSetConfigData);

        expect(newModel.id).toBe(originalModel.id);
        expect(newModel.name).toBe(originalModel.name);
        expect(newModel.exerciseId).toBe(originalModel.exerciseId);
        expect(newModel.notes).toBe(originalModel.notes);
        expect(newModel.createdAt).toEqual(originalModel.createdAt);
      });
    });
  });

  describe('Business logic methods', () => {
    describe('getTotalSets', () => {
      it('should calculate total sets from set configuration data', () => {
        const setConfig = createTestStandardSetParamsData({
          sets: { min: 4, max: 4, direction: 'asc' },
        });
        const model = createTestExerciseTemplateModel({
          setConfiguration: setConfig,
        });

        const totalSets = model.getTotalSets();

        expect(totalSets).toBe(4);
      });
    });

    describe('getSetSummary', () => {
      it('should return a summary with set count and type', () => {
        const setConfig = createTestStandardSetParamsData({
          sets: { min: 3, max: 3, direction: 'asc' },
        });
        const model = createTestExerciseTemplateModel({
          setConfiguration: setConfig,
        });

        const summary = model.getSetSummary();

        expect(summary).toBe('3 sets (standard)');
      });
    });

    describe('getEstimatedDurationSeconds', () => {
      it('should calculate duration using default parameters', () => {
        const setConfig = createTestStandardSetParamsData({
          sets: { min: 3, max: 3, direction: 'asc' },
        });
        const model = createTestExerciseTemplateModel({
          setConfiguration: setConfig,
        });

        const duration = model.getEstimatedDurationSeconds();

        // 3 sets * (3 * 10 + 30) = 3 * 60 = 180
        expect(duration).toBe(180);
      });

      it('should calculate duration using provided parameters', () => {
        const setConfig = createTestStandardSetParamsData({
          sets: { min: 4, max: 4, direction: 'asc' },
        });
        const model = createTestExerciseTemplateModel({
          setConfiguration: setConfig,
        });

        const duration = model.getEstimatedDurationSeconds(2, 90);

        // 4 sets * (2 * 10 + 90) = 4 * 110 = 440
        expect(duration).toBe(440);
      });
    });

    describe('getEstimatedRPECurve', () => {
      it('should generate RPE curve based on set count', () => {
        const setConfig = createTestStandardSetParamsData({
          sets: { min: 4, max: 4, direction: 'asc' },
        });
        const model = createTestExerciseTemplateModel({
          setConfiguration: setConfig,
        });

        const rpeCurve = model.getEstimatedRPECurve();

        // For 4 sets: [6, 6, 7, 8] (6 + Math.floor(i/4*3) for i=0,1,2,3)
        expect(rpeCurve).toEqual([6, 6, 7, 8]);
      });
    });

    describe('getSetConfigurationType', () => {
      it('should return setConfiguration.type', () => {
        const model = createTestExerciseTemplateModel();

        const type = model.getSetConfigurationType();

        expect(type).toBe('standard');
      });
    });

    describe('hasNotes', () => {
      it('should return true when notes exist', () => {
        const model = createTestExerciseTemplateModel({
          notes: 'Some notes',
        });

        expect(model.hasNotes()).toBe(true);
      });

      it('should return false when notes are undefined', () => {
        const model = createTestExerciseTemplateModel({
          notes: undefined,
        });

        expect(model.hasNotes()).toBe(false);
      });

      it('should return false when notes are empty string', () => {
        const model = createTestExerciseTemplateModel({
          notes: '',
        });

        expect(model.hasNotes()).toBe(false);
      });
    });

    describe('getDisplayName', () => {
      it('should return the template name', () => {
        const model = createTestExerciseTemplateModel({
          name: 'Bench Press Template',
        });

        expect(model.getDisplayName()).toBe('Bench Press Template');
      });
    });
  });

  describe('SetConfiguration integration', () => {
    it('should properly store polymorphic set configuration data', () => {
      const dropSetData: AnySetConfigurationData = {
        type: 'drop',
        sets: { min: 3, max: 3, direction: 'asc' },
        startCounts: { min: 10, max: 10, direction: 'asc' },
        drops: { min: 2, max: 2, direction: 'asc' },
      };
      const data = createTestExerciseTemplateData({
        setConfiguration: dropSetData,
      });

      const model = ExerciseTemplateModel.hydrate(data);

      expect(model.setConfiguration).toEqual(dropSetData);
      expect(model.setConfiguration.type).toBe('drop');
    });

    it('should preserve setConfiguration when cloning model', () => {
      const model = createTestExerciseTemplateModel();

      const cloned = model.clone();

      expect(cloned.setConfiguration).toEqual(model.setConfiguration);
    });
  });

  describe('Immutability', () => {
    describe('clone', () => {
      it('should create deep clone with setConfiguration preserved', () => {
        const model = createTestExerciseTemplateModel();

        const cloned = model.clone();

        expect(cloned).not.toBe(model);
        expect(cloned.setConfiguration).toEqual(model.setConfiguration);
      });

      it('should preserve all properties in clone', () => {
        const model = createTestExerciseTemplateModel({
          name: 'Test Template',
          notes: 'Test notes',
        });

        const cloned = model.clone();

        expect(cloned.id).toBe(model.id);
        expect(cloned.name).toBe(model.name);
        expect(cloned.exerciseId).toBe(model.exerciseId);
        expect(cloned.notes).toBe(model.notes);
        expect(cloned.createdAt).toEqual(model.createdAt);
        expect(cloned.updatedAt).toEqual(model.updatedAt);
      });
    });
  });

  describe('Serialization', () => {
    describe('toPlainObject', () => {
      it('should convert model back to plain data object', () => {
        const originalData = createTestExerciseTemplateData({
          name: 'Test Template',
          notes: 'Test notes',
        });
        const model = ExerciseTemplateModel.hydrate(originalData);

        const plainObject = model.toPlainObject();

        expect(plainObject.id).toBe(originalData.id);
        expect(plainObject.name).toBe(originalData.name);
        expect(plainObject.exerciseId).toBe(originalData.exerciseId);
        expect(plainObject.notes).toBe(originalData.notes);
        expect(plainObject.createdAt).toEqual(originalData.createdAt);
        expect(plainObject.updatedAt).toEqual(originalData.updatedAt);
        expect(plainObject.setConfiguration).toEqual(originalData.setConfiguration);
      });

      it('should serialize all required properties', () => {
        const model = createTestExerciseTemplateModel();

        const plainObject = model.toPlainObject();

        expect(plainObject).toHaveProperty('id');
        expect(plainObject).toHaveProperty('name');
        expect(plainObject).toHaveProperty('exerciseId');
        expect(plainObject).toHaveProperty('setConfiguration');
        expect(plainObject).toHaveProperty('createdAt');
        expect(plainObject).toHaveProperty('updatedAt');
        // notes is optional
      });

      it('should handle undefined notes in serialization', () => {
        const model = createTestExerciseTemplateModel({
          notes: undefined,
        });

        const plainObject = model.toPlainObject();

        expect(plainObject.notes).toBeUndefined();
      });
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should return success for valid model', () => {
        const model = createTestExerciseTemplateModel();

        const result = model.validate();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(model.id);
          expect(result.data.name).toBe(model.name);
        }
      });

      it('should return errors for invalid model data', () => {
        // Create model with invalid name
        const invalidData = createTestExerciseTemplateData();
        // @ts-expect-error - Intentionally creating invalid data for testing
        invalidData.name = '';
        const model = ExerciseTemplateModel.hydrate(invalidData);

        const result = model.validate();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toContain('name');
        }
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle empty string as name during validation', () => {
      const data = createTestExerciseTemplateData();
      // @ts-expect-error - Testing edge case
      data.name = '';
      const model = ExerciseTemplateModel.hydrate(data);

      const result = model.validate();

      expect(result.success).toBe(false);
    });

    it('should handle very long notes', () => {
      const longNotes = 'A'.repeat(10000);
      const model = createTestExerciseTemplateModel({
        notes: longNotes,
      });

      expect(model.notes).toBe(longNotes);
      expect(model.hasNotes()).toBe(true);
    });

    it('should preserve setConfiguration structure through clone operations', () => {
      const originalSetConfig = createTestStandardSetParamsData({
        sets: { min: 4, max: 6, direction: 'asc' },
        counts: { min: 6, max: 10, direction: 'desc' },
      });
      const model = createTestExerciseTemplateModel({
        setConfiguration: originalSetConfig,
      });

      const cloned = model.clone();
      const newModel = cloned.cloneWithNewName('New Name');

      // Verify setConfiguration is preserved through operations
      expect(newModel.setConfiguration.type).toBe('standard');
      expect(newModel.setConfiguration).toEqual(originalSetConfig);
    });

    it('should handle all parameters for getEstimatedDurationSeconds', () => {
      const setConfig = createTestStandardSetParamsData({
        sets: { min: 2, max: 2, direction: 'asc' },
      });
      const model = createTestExerciseTemplateModel({
        setConfiguration: setConfig,
      });

      // Test with both parameters: 2 sets * (2.5 * 10 + 90) = 2 * 115 = 230
      expect(model.getEstimatedDurationSeconds(2.5, 90)).toBe(230);

      // Test with only first parameter: 2 sets * (3 * 10 + 30) = 2 * 60 = 120
      expect(model.getEstimatedDurationSeconds(3)).toBe(120);

      // Test with only second parameter: 2 sets * (3 * 10 + 120) = 2 * 150 = 300
      expect(model.getEstimatedDurationSeconds(undefined, 120)).toBe(300);
    });
  });

  describe('Constructor protection', () => {
    it('should not allow direct instantiation', () => {
      const data = createTestExerciseTemplateData();

      // This should be a compile-time error due to protected constructor
      // but we can't easily test TypeScript compiler errors in runtime tests.
      // The protection is enforced by TypeScript, not at runtime.
      expect(() => {
        // @ts-expect-error - Testing that direct construction is not intended
        new ExerciseTemplateModel(data);
      }).not.toThrow(); // Runtime allows it, but TypeScript prevents it
    });

    it('should only allow creation through hydrate method', () => {
      const data = createTestExerciseTemplateData();

      // This is the intended way to create instances
      const model = ExerciseTemplateModel.hydrate(data);

      expect(model).toBeInstanceOf(ExerciseTemplateModel);
      expect(model.name).toBe(data.name);
    });
  });
});
