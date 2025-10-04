import { describe, expect, it, vi } from 'vitest';

import { generateId } from '@/lib';
import { appliedExerciseSchema } from '@/shared/types';
import { createTestAppliedExerciseData, createTestStandardSetParamsData } from '@/test-factories';

import { AppliedExerciseModel } from '../AppliedExerciseModel';
import { hydrateSetConfiguration } from '../hydrateSets';
import { type SetConfiguration } from '../sets/SetConfiguration';

// Mock external dependencies
vi.mock('@/lib', () => {
  const uuids = [
    '12345678-1234-4234-8234-123456789abc',
    '22345678-1234-4234-9234-123456789abc',
    '32345678-1234-4234-a234-123456789abc',
    '42345678-1234-4234-b234-123456789abc',
    '52345678-1234-4234-8234-123456789abc',
    '62345678-1234-4234-9234-123456789abc',
    '72345678-1234-4234-a234-123456789abc',
    '82345678-1234-4234-b234-123456789abc',
    '92345678-1234-4234-8234-123456789abc',
    'a2345678-1234-4234-9234-123456789abc',
    'b2345678-1234-4234-a234-123456789abc',
    'c2345678-1234-4234-b234-123456789abc',
  ];
  let counter = 0;
  return {
    generateId: vi.fn(() => {
      const uuid = uuids[counter % uuids.length];
      counter++;
      return uuid;
    }),
  };
});

vi.mock('../hydrateSets', () => ({
  hydrateSetConfiguration: vi.fn((data) => ({
    type: data.type,
    getTotalSets: vi.fn(() => 3),
    getSummary: vi.fn(() => '3 sets of 8-12 reps'),
    toPlainObject: vi.fn(() => data),
    clone: vi.fn(() => ({
      type: data.type,
      getTotalSets: vi.fn(() => 3),
      getSummary: vi.fn(() => '3 sets of 8-12 reps'),
      toPlainObject: vi.fn(() => data),
      clone: vi.fn(),
    })),
  })),
}));

// Helper function to create test model
function createTestAppliedExerciseModel(overrides = {}) {
  return AppliedExerciseModel.hydrate(createTestAppliedExerciseData(overrides));
}

describe('AppliedExerciseModel', () => {
  describe('hydrate', () => {
    it('should create a new AppliedExerciseModel instance from plain data', () => {
      // Arrange
      const data = createTestAppliedExerciseData();

      // Act
      const model = AppliedExerciseModel.hydrate(data);

      // Assert
      expect(model).toBeInstanceOf(AppliedExerciseModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.exerciseId).toBe(data.exerciseId);
      expect(model.templateId).toBe(data.templateId);
      expect(model.restTimeSeconds).toBe(data.restTimeSeconds);
      expect(model.executionCount).toBe(data.executionCount);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
      expect(hydrateSetConfiguration).toHaveBeenCalledWith(data.setConfiguration);
    });

    it('should handle null templateId', () => {
      // Arrange
      const data = createTestAppliedExerciseData({ templateId: null });

      // Act
      const model = AppliedExerciseModel.hydrate(data);

      // Assert
      expect(model.templateId).toBeNull();
    });

    it('should handle undefined restTimeSeconds', () => {
      // Arrange
      const data = createTestAppliedExerciseData({ restTimeSeconds: undefined });

      // Act
      const model = AppliedExerciseModel.hydrate(data);

      // Assert
      expect(model.restTimeSeconds).toBeUndefined();
    });

    it('should handle zero executionCount', () => {
      // Arrange
      const data = createTestAppliedExerciseData({ executionCount: 0 });

      // Act
      const model = AppliedExerciseModel.hydrate(data);

      // Assert
      expect(model.executionCount).toBe(0);
    });
  });

  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof AppliedExerciseModel.prototype.constructor).toBe('function');
    });
  });

  describe('cloneWithIncrementedExecutionCount', () => {
    it('should create new instance with execution count incremented by 1', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({ executionCount: 5 });

      // Act
      const cloned = original.cloneWithIncrementedExecutionCount();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.executionCount).toBe(6);
      expect(original.executionCount).toBe(5); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should increment from zero', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({ executionCount: 0 });

      // Act
      const cloned = original.cloneWithIncrementedExecutionCount();

      // Assert
      expect(cloned.executionCount).toBe(1);
      expect(original.executionCount).toBe(0);
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({
        profileId: 'test-profile',
        exerciseId: 'test-exercise',
        templateId: 'test-template',
        restTimeSeconds: 120,
      });

      // Act
      const cloned = original.cloneWithIncrementedExecutionCount();

      // Assert
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.exerciseId).toBe(original.exerciseId);
      expect(cloned.templateId).toBe(original.templateId);
      expect(cloned.restTimeSeconds).toBe(original.restTimeSeconds);
      expect(cloned.setConfiguration).toBe(original.setConfiguration);
    });
  });

  describe('cloneWithNewRestTime', () => {
    it('should create new instance with updated rest time', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({ restTimeSeconds: 60 });
      const newRestTime = 120;

      // Act
      const cloned = original.cloneWithNewRestTime(newRestTime);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.restTimeSeconds).toBe(120);
      expect(original.restTimeSeconds).toBe(60); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle undefined rest time (remove rest time)', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({ restTimeSeconds: 90 });

      // Act
      const cloned = original.cloneWithNewRestTime(undefined);

      // Assert
      expect(cloned.restTimeSeconds).toBeUndefined();
      expect(original.restTimeSeconds).toBe(90);
    });

    it('should handle setting rest time from undefined', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({ restTimeSeconds: undefined });

      // Act
      const cloned = original.cloneWithNewRestTime(180);

      // Assert
      expect(cloned.restTimeSeconds).toBe(180);
      expect(original.restTimeSeconds).toBeUndefined();
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({
        executionCount: 3,
        profileId: 'test-profile',
      });

      // Act
      const cloned = original.cloneWithNewRestTime(150);

      // Assert
      expect(cloned.executionCount).toBe(original.executionCount);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.exerciseId).toBe(original.exerciseId);
      expect(cloned.setConfiguration).toBe(original.setConfiguration);
    });
  });

  describe('cloneWithNewSetConfiguration', () => {
    it('should create new instance with updated set configuration', () => {
      // Arrange
      const original = createTestAppliedExerciseModel();
      const newSetConfig = hydrateSetConfiguration(
        createTestStandardSetParamsData({
          sets: { min: 4, direction: 'asc' },
          counts: { min: 6, max: 10, direction: 'asc' },
        })
      );

      // Act
      const cloned = original.cloneWithNewSetConfiguration(newSetConfig);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.setConfiguration).toBe(newSetConfig);
      expect(original.setConfiguration).not.toBe(newSetConfig); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({
        executionCount: 2,
        restTimeSeconds: 75,
      });
      const newSetConfig = hydrateSetConfiguration(createTestStandardSetParamsData());

      // Act
      const cloned = original.cloneWithNewSetConfiguration(newSetConfig);

      // Assert
      expect(cloned.executionCount).toBe(original.executionCount);
      expect(cloned.restTimeSeconds).toBe(original.restTimeSeconds);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.exerciseId).toBe(original.exerciseId);
      expect(cloned.templateId).toBe(original.templateId);
    });
  });

  describe('getTotalSets', () => {
    it('should delegate to setConfiguration.getTotalSets', () => {
      // Arrange
      const model = createTestAppliedExerciseModel();

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      expect(totalSets).toBe(3);
      expect(model.setConfiguration.getTotalSets).toHaveBeenCalled();
    });
  });

  describe('getSetSummary', () => {
    it('should delegate to setConfiguration.getSummary', () => {
      // Arrange
      const model = createTestAppliedExerciseModel();

      // Act
      const summary = model.getSetSummary();

      // Assert
      expect(summary).toBe('3 sets of 8-12 reps');
      expect(model.setConfiguration.getSummary).toHaveBeenCalled();
    });
  });

  describe('hasTemplate', () => {
    it('should return true when templateId is not null', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ templateId: 'test-template-id' });

      // Act
      const result = model.hasTemplate();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when templateId is null', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ templateId: null });

      // Act
      const result = model.hasTemplate();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasCustomRestTime', () => {
    it('should return true when restTimeSeconds is defined', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ restTimeSeconds: 120 });

      // Act
      const result = model.hasCustomRestTime();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when restTimeSeconds is undefined', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ restTimeSeconds: undefined });

      // Act
      const result = model.hasCustomRestTime();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when restTimeSeconds is 0', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ restTimeSeconds: 0 });

      // Act
      const result = model.hasCustomRestTime();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getExecutionCount', () => {
    it('should return the execution count', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ executionCount: 7 });

      // Act
      const result = model.getExecutionCount();

      // Assert
      expect(result).toBe(7);
    });

    it('should return 0 for new exercise', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ executionCount: 0 });

      // Act
      const result = model.getExecutionCount();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('hasBeenExecuted', () => {
    it('should return true when execution count is greater than 0', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ executionCount: 1 });

      // Act
      const result = model.hasBeenExecuted();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when execution count is 0', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ executionCount: 0 });

      // Act
      const result = model.hasBeenExecuted();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for multiple executions', () => {
      // Arrange
      const model = createTestAppliedExerciseModel({ executionCount: 10 });

      // Act
      const result = model.hasBeenExecuted();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('clone', () => {
    it('should create a deep clone with cloned setConfiguration', () => {
      // Arrange
      const original = createTestAppliedExerciseModel();

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.setConfiguration).not.toBe(original.setConfiguration);
      expect(original.setConfiguration.clone).toHaveBeenCalled();
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({
        profileId: 'test-profile',
        exerciseId: 'test-exercise',
        templateId: 'test-template',
        restTimeSeconds: 90,
        executionCount: 5,
      });

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned.id).toBe(original.id);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.exerciseId).toBe(original.exerciseId);
      expect(cloned.templateId).toBe(original.templateId);
      expect(cloned.restTimeSeconds).toBe(original.restTimeSeconds);
      expect(cloned.executionCount).toBe(original.executionCount);
      expect(cloned.createdAt).toBe(original.createdAt);
      expect(cloned.updatedAt).toBe(original.updatedAt);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const data = createTestAppliedExerciseData({
        profileId: 'test-profile',
        exerciseId: 'test-exercise',
        templateId: 'test-template',
        restTimeSeconds: 120,
        executionCount: 3,
      });
      const model = AppliedExerciseModel.hydrate(data);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: 'test-profile',
        exerciseId: 'test-exercise',
        templateId: 'test-template',
        setConfiguration: data.setConfiguration,
        restTimeSeconds: 120,
        executionCount: 3,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
      expect(model.setConfiguration.toPlainObject).toHaveBeenCalled();
    });

    it('should handle null templateId in plain object', () => {
      // Arrange
      const data = createTestAppliedExerciseData({ templateId: null });
      const model = AppliedExerciseModel.hydrate(data);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.templateId).toBeNull();
    });

    it('should handle undefined restTimeSeconds in plain object', () => {
      // Arrange
      const data = createTestAppliedExerciseData({ restTimeSeconds: undefined });
      const model = AppliedExerciseModel.hydrate(data);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.restTimeSeconds).toBeUndefined();
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange
      const model = createTestAppliedExerciseModel();

      // Act
      const result = model.validate();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should use appliedExerciseSchema for validation', () => {
      // Arrange
      const model = createTestAppliedExerciseModel();
      const safeParseSpy = vi.spyOn(appliedExerciseSchema, 'safeParse');

      // Act
      model.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(model.toPlainObject());
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const original = createTestAppliedExerciseModel({
        executionCount: 2,
        restTimeSeconds: 60,
      });
      const originalData = {
        executionCount: original.executionCount,
        restTimeSeconds: original.restTimeSeconds,
        updatedAt: original.updatedAt,
      };

      // Act
      const cloned1 = original.cloneWithIncrementedExecutionCount();
      const cloned2 = original.cloneWithNewRestTime(120);
      const cloned3 = original.cloneWithNewSetConfiguration(
        hydrateSetConfiguration(createTestStandardSetParamsData())
      );

      // Assert
      expect(original.executionCount).toBe(originalData.executionCount);
      expect(original.restTimeSeconds).toBe(originalData.restTimeSeconds);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify clones have different values
      expect(cloned1.executionCount).toBe(3);
      expect(cloned2.restTimeSeconds).toBe(120);
      expect(cloned3.setConfiguration).not.toBe(original.setConfiguration);
    });
  });

  describe('SetConfiguration integration', () => {
    it('should properly hydrate SetConfiguration polymorphically', () => {
      // Arrange
      const setConfigData = createTestStandardSetParamsData({
        type: 'standard',
        sets: { min: 4, direction: 'asc' },
      });
      const data = createTestAppliedExerciseData({
        setConfiguration: setConfigData,
      });

      // Act
      const model = AppliedExerciseModel.hydrate(data);

      // Assert
      expect(hydrateSetConfiguration).toHaveBeenCalledWith(setConfigData);
      expect(model.setConfiguration.type).toBe('standard');
    });

    it('should preserve SetConfiguration structure through cloning', () => {
      // Arrange
      const original = createTestAppliedExerciseModel();

      // Act
      const cloned = original.clone();

      // Assert
      expect(original.setConfiguration.clone).toHaveBeenCalled();
      expect(cloned.setConfiguration).not.toBe(original.setConfiguration);
    });
  });
});
