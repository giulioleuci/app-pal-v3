import { describe, expect, it, vi } from 'vitest';

import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, MyoRepsParamsData } from '@/shared/types';

import { MyoRepsSetConfiguration } from '../MyoRepsSetConfiguration';

// Mock external dependencies
vi.mock('@/lib', () => ({
  generateId: vi.fn(() => 'mock-id'),
  BASE_SECONDS_PER_SET: 5,
  SECONDS_PER_REP: 3,
}));

describe('MyoRepsSetConfiguration', () => {
  describe('constructor', () => {
    it('should create a MyoRepsSetConfiguration with valid data', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, max: 20, direction: 'asc' },
        miniSets: { min: 3, max: 5, direction: 'asc' },
        miniSetCounts: { min: 3, max: 5, direction: 'asc' },
      };

      // Act
      const config = new MyoRepsSetConfiguration(data);

      // Assert
      expect(config.type).toBe('myoReps');
      expect(config.activationCounts).toEqual({ min: 15, max: 20, direction: 'asc' });
      expect(config.miniSets).toEqual({ min: 3, max: 5, direction: 'asc' });
      expect(config.miniSetCounts).toEqual({ min: 3, max: 5, direction: 'asc' });
      expect(config.rpe).toBeUndefined();
    });

    it('should create a MyoRepsSetConfiguration with RPE', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 4, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };

      // Act
      const config = new MyoRepsSetConfiguration(data);

      // Assert
      expect(config.type).toBe('myoReps');
      expect(config.activationCounts).toEqual({ min: 12, direction: 'asc' });
      expect(config.miniSets).toEqual({ min: 4, direction: 'asc' });
      expect(config.miniSetCounts).toEqual({ min: 3, direction: 'asc' });
      expect(config.rpe).toEqual({ min: 8, max: 10, direction: 'asc' });
    });
  });

  describe('formatRange', () => {
    it('should format range with infinity max value', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, max: Infinity, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('15+ reps, then 3 mini-sets of 3');
    });

    it('should format range with undefined max value', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 4, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12 reps, then 4 mini-sets of 3');
    });

    it('should format range with descending direction', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 10, max: 15, direction: 'desc' },
        miniSets: { min: 2, max: 4, direction: 'desc' },
        miniSetCounts: { min: 3, max: 5, direction: 'desc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('15-10 reps, then 4-2 mini-sets of 5-3');
    });

    it('should format range with ascending direction', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 10, max: 15, direction: 'asc' },
        miniSets: { min: 2, max: 4, direction: 'asc' },
        miniSetCounts: { min: 3, max: 5, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('10-15 reps, then 2-4 mini-sets of 3-5');
    });
  });

  describe('getTotalSets', () => {
    it('should return 1 plus minimum number of mini-sets', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, max: 5, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(4); // 1 + 3
    });

    it('should return correct value for single mini-set', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 20, direction: 'asc' },
        miniSets: { min: 1, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(2); // 1 + 1
    });

    it('should return correct value for multiple mini-sets', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 6, direction: 'asc' },
        miniSetCounts: { min: 2, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(7); // 1 + 6
    });
  });

  describe('getSummary', () => {
    it('should generate summary without RPE', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, max: 20, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 3, max: 5, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('15-20 reps, then 3 mini-sets of 3-5');
    });

    it('should generate summary with RPE', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 4, max: 6, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12 reps, then 4-6 mini-sets of 3 @ RPE 8-10');
    });

    it('should generate summary with single RPE value', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('15 reps, then 3 mini-sets of 4 @ RPE 9');
    });

    it('should generate summary with infinity values', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 10, max: Infinity, direction: 'asc' },
        miniSets: { min: 2, max: Infinity, direction: 'asc' },
        miniSetCounts: { min: 3, max: Infinity, direction: 'asc' },
        rpe: { min: 7, max: Infinity, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('10+ reps, then 2+ mini-sets of 3+ @ RPE 7+');
    });
  });

  describe('getEstimatedDurationSeconds', () => {
    it('should calculate duration with default parameters', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Total reps: 15 + (3 * 4) = 15 + 12 = 27
      // Total sets: 1 + 3 = 4
      // Duration: 27 * 3 + 4 * 5 = 81 + 20 = 101
      expect(duration).toBe(101);
    });

    it('should calculate duration with custom parameters', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 2, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: 2,
        baseTimePerSet: 10,
      });

      // Assert
      // Total reps: 12 + (2 * 3) = 12 + 6 = 18
      // Total sets: 1 + 2 = 3
      // Duration: 18 * 2 + 3 * 10 = 36 + 30 = 66
      expect(duration).toBe(66);
    });

    it('should handle different activation and mini-set combinations', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 20, direction: 'asc' },
        miniSets: { min: 5, direction: 'asc' },
        miniSetCounts: { min: 2, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Total reps: 20 + (5 * 2) = 20 + 10 = 30
      // Total sets: 1 + 5 = 6
      // Duration: 30 * 3 + 6 * 5 = 90 + 30 = 120
      expect(duration).toBe(120);
    });

    it('should handle zero baseTimePerSet', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 10, direction: 'asc' },
        miniSets: { min: 2, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: 4,
        baseTimePerSet: 0,
      });

      // Assert
      // Total reps: 10 + (2 * 5) = 10 + 10 = 20
      // Total sets: 1 + 2 = 3
      // Duration: 20 * 4 + 3 * 0 = 80 + 0 = 80
      expect(duration).toBe(80);
    });
  });

  describe('generateEmptySets', () => {
    it('should generate correct number of empty sets', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'reps';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(4); // 1 + 3 mini-sets
      expect(generateId).toHaveBeenCalledTimes(4);
    });

    it('should generate sets with correct structure and properties', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, max: 15, direction: 'asc' },
        miniSets: { min: 2, direction: 'asc' },
        miniSetCounts: { min: 3, max: 5, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'mins';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(3); // 1 + 2 mini-sets
      emptySets.forEach((set) => {
        expect(set).toEqual({
          id: 'mock-id',
          profileId: 'test-profile',
          counterType: 'mins',
          counts: 0,
          weight: 0,
          completed: false,
          plannedRpe: { min: 8, max: 10, direction: 'asc' },
        });
      });
    });

    it('should generate sets without RPE when not provided', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 10, direction: 'asc' },
        miniSets: { min: 1, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'secs';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(2); // 1 + 1 mini-set
      emptySets.forEach((set) => {
        expect(set).toEqual({
          id: 'mock-id',
          profileId: 'test-profile',
          counterType: 'secs',
          counts: 0,
          weight: 0,
          completed: false,
          plannedRpe: undefined,
        });
      });
    });
  });

  describe('getEstimatedRPECurve', () => {
    it('should return empty array when no RPE is set', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([]);
    });

    it('should return array of RPE values for each set', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 2, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([8, 8, 8]); // 1 activation set + 2 mini-sets
    });

    it('should use minimum RPE value for all sets', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 4, direction: 'asc' },
        miniSetCounts: { min: 3, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([9, 9, 9, 9, 9]); // 1 activation set + 4 mini-sets
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object with all properties', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, max: 20, direction: 'asc' },
        miniSets: { min: 3, max: 5, direction: 'desc' },
        miniSetCounts: { min: 3, max: 5, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'myoReps',
        activationCounts: { min: 15, max: 20, direction: 'asc' },
        miniSets: { min: 3, max: 5, direction: 'desc' },
        miniSetCounts: { min: 3, max: 5, direction: 'asc' },
        sets: { min: 1, direction: 'asc' }, // Base schema requirement
        rpe: { min: 8, max: 10, direction: 'asc' },
      });
    });

    it('should return correct plain object with minimal properties', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'myoReps',
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: undefined,
      });
    });

    it('should return a new object reference', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).not.toBe(config);
      expect(plainObject.activationCounts).not.toBe(config.activationCounts);
      expect(plainObject.miniSets).not.toBe(config.miniSets);
      expect(plainObject.miniSetCounts).not.toBe(config.miniSetCounts);
    });
  });

  describe('clone', () => {
    it('should create a new instance with identical data', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, max: 20, direction: 'asc' },
        miniSets: { min: 3, max: 5, direction: 'desc' },
        miniSetCounts: { min: 3, max: 5, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(MyoRepsSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.activationCounts).toEqual(config.activationCounts);
      expect(clonedConfig.miniSets).toEqual(config.miniSets);
      expect(clonedConfig.miniSetCounts).toEqual(config.miniSetCounts);
      expect(clonedConfig.rpe).toEqual(config.rpe);
    });

    it('should create a new instance with minimal data', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 12, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(MyoRepsSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.activationCounts).toEqual(config.activationCounts);
      expect(clonedConfig.miniSets).toEqual(config.miniSets);
      expect(clonedConfig.miniSetCounts).toEqual(config.miniSetCounts);
      expect(clonedConfig.rpe).toBeUndefined();
    });

    it('should preserve functionality in cloned instance', () => {
      // Arrange
      const data: MyoRepsParamsData = {
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 4, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      };
      const config = new MyoRepsSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig.getTotalSets()).toBe(config.getTotalSets());
      expect(clonedConfig.getSummary()).toBe(config.getSummary());
      expect(clonedConfig.getEstimatedDurationSeconds()).toBe(config.getEstimatedDurationSeconds());
      expect(clonedConfig.getEstimatedRPECurve()).toEqual(config.getEstimatedRPECurve());
    });
  });
});
