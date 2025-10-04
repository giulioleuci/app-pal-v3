import { describe, expect, it, vi } from 'vitest';

import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, StandardSetParamsData } from '@/shared/types';

import { StandardSetConfiguration } from '../StandardSetConfiguration';

// Mock external dependencies
vi.mock('@/lib', () => ({
  generateId: vi.fn(() => 'mock-id'),
  BASE_SECONDS_PER_SET: 5,
  SECONDS_PER_REP: 3,
}));

describe('StandardSetConfiguration', () => {
  describe('constructor', () => {
    it('should create a StandardSetConfiguration with valid data', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
      };

      // Act
      const config = new StandardSetConfiguration(data);

      // Assert
      expect(config.type).toBe('standard');
      expect(config.sets).toEqual({ min: 3, direction: 'asc' });
      expect(config.counts).toEqual({ min: 8, max: 12, direction: 'asc' });
      expect(config.load).toBeUndefined();
      expect(config.percentage).toBeUndefined();
      expect(config.rpe).toBeUndefined();
    });

    it('should create a StandardSetConfiguration with all optional properties', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 4, max: 5, direction: 'asc' },
        counts: { min: 10, max: 15, direction: 'desc' },
        load: { min: 100, max: 120, direction: 'asc' },
        percentage: { min: 70, max: 85, direction: 'asc' },
        rpe: { min: 7, max: 9, direction: 'asc' },
      };

      // Act
      const config = new StandardSetConfiguration(data);

      // Assert
      expect(config.type).toBe('standard');
      expect(config.sets).toEqual({ min: 4, max: 5, direction: 'asc' });
      expect(config.counts).toEqual({ min: 10, max: 15, direction: 'desc' });
      expect(config.load).toEqual({ min: 100, max: 120, direction: 'asc' });
      expect(config.percentage).toEqual({ min: 70, max: 85, direction: 'asc' });
      expect(config.rpe).toEqual({ min: 7, max: 9, direction: 'asc' });
    });
  });

  describe('formatRange', () => {
    it('should format range with infinity max value', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: Infinity, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('3 sets of 8+ reps');
    });

    it('should format range with undefined max value', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('3 sets of 8 reps');
    });

    it('should format range with equal min and max values', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, max: 3, direction: 'asc' },
        counts: { min: 10, max: 10, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('3 sets of 10 reps');
    });

    it('should format range with descending direction', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, max: 5, direction: 'desc' },
        counts: { min: 8, max: 12, direction: 'desc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('5-3 sets of 12-8 reps');
    });

    it('should format range with ascending direction', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, max: 5, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('3-5 sets of 8-12 reps');
    });
  });

  describe('getTotalSets', () => {
    it('should return the minimum number of sets', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 4, max: 6, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(4);
    });

    it('should return correct value when only min is specified', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(3);
    });
  });

  describe('getSummary', () => {
    it('should generate summary without RPE', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('3 sets of 8-12 reps');
    });

    it('should generate summary with RPE', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('3 sets of 8-12 reps @ RPE 7-9');
    });

    it('should generate summary with single RPE value', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 4, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('4 sets of 10 reps @ RPE 8');
    });

    it('should generate summary with infinity values', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, max: Infinity, direction: 'asc' },
        counts: { min: 8, max: Infinity, direction: 'asc' },
        rpe: { min: 7, max: Infinity, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('3+ sets of 8+ reps @ RPE 7+');
    });
  });

  describe('getEstimatedDurationSeconds', () => {
    it('should calculate duration with default parameters', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Average reps: (8 + 12) / 2 = 10
      // Total reps: 3 * 10 = 30
      // Duration: 30 * 3 + 3 * 5 = 90 + 15 = 105
      expect(duration).toBe(105);
    });

    it('should calculate duration with custom parameters', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 4, direction: 'asc' },
        counts: { min: 6, max: 10, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: 2,
        baseTimePerSet: 10,
      });

      // Assert
      // Average reps: (6 + 10) / 2 = 8
      // Total reps: 4 * 8 = 32
      // Duration: 32 * 2 + 4 * 10 = 64 + 40 = 104
      expect(duration).toBe(104);
    });

    it('should handle infinity max counts', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: Infinity, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Max reps becomes Math.max(10, 8 * 1.5) = 12
      // Average reps: (8 + 12) / 2 = 10
      // Total reps: 3 * 10 = 30
      // Duration: 30 * 3 + 3 * 5 = 90 + 15 = 105
      expect(duration).toBe(105);
    });

    it('should handle undefined max counts', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 2, direction: 'asc' },
        counts: { min: 15, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Max reps becomes Math.max(10, 15 * 1.5) = 22.5
      // Average reps: (15 + 22.5) / 2 = 18.75
      // Total reps: 2 * 18.75 = 37.5
      // Duration: 37.5 * 3 + 2 * 5 = 112.5 + 10 = 122.5
      expect(duration).toBe(122.5);
    });

    it('should handle small min counts with infinity', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 5, max: Infinity, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Max reps becomes Math.max(10, 5 * 1.5) = 10
      // Average reps: (5 + 10) / 2 = 7.5
      // Total reps: 3 * 7.5 = 22.5
      // Duration: 22.5 * 3 + 3 * 5 = 67.5 + 15 = 82.5
      expect(duration).toBe(82.5);
    });
  });

  describe('generateEmptySets', () => {
    it('should generate correct number of empty sets', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'reps';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(3);
      expect(generateId).toHaveBeenCalledTimes(3);
    });

    it('should generate sets with correct structure and properties', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 2, direction: 'asc' },
        counts: { min: 10, max: 15, direction: 'asc' },
        rpe: { min: 7, max: 9, direction: 'asc' },
        load: { min: 100, max: 120, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'mins';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(2);
      emptySets.forEach((set) => {
        expect(set).toEqual({
          id: 'mock-id',
          profileId: 'test-profile',
          counterType: 'mins',
          counts: 0,
          weight: 0,
          completed: false,
          plannedRpe: { min: 7, max: 9, direction: 'asc' },
          plannedLoad: { min: 100, max: 120, direction: 'asc' },
          plannedCounts: { min: 10, max: 15, direction: 'asc' },
        });
      });
    });

    it('should generate sets without optional properties when not provided', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 5, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'secs';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(1);
      expect(emptySets[0]).toEqual({
        id: 'mock-id',
        profileId: 'test-profile',
        counterType: 'secs',
        counts: 0,
        weight: 0,
        completed: false,
        plannedRpe: undefined,
        plannedLoad: undefined,
        plannedCounts: { min: 5, direction: 'asc' },
      });
    });
  });

  describe('getEstimatedRPECurve', () => {
    it('should return empty array when no RPE is set', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([]);
    });

    it('should return array of RPE values for each set', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 4, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([7, 7, 7, 7]);
    });

    it('should use minimum RPE value for all sets', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 2, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([8, 8]);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object with all properties', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, max: 5, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'desc' },
        load: { min: 100, max: 120, direction: 'asc' },
        percentage: { min: 70, max: 85, direction: 'asc' },
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'standard',
        sets: { min: 3, max: 5, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'desc' },
        load: { min: 100, max: 120, direction: 'asc' },
        percentage: { min: 70, max: 85, direction: 'asc' },
        rpe: { min: 7, max: 9, direction: 'asc' },
      });
    });

    it('should return correct plain object with minimal properties', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
        load: undefined,
        percentage: undefined,
        rpe: undefined,
      });
    });

    it('should return a new object reference', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).not.toBe(config);
      expect(plainObject.sets).not.toBe(config.sets);
      expect(plainObject.counts).not.toBe(config.counts);
    });
  });

  describe('clone', () => {
    it('should create a new instance with identical data', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, max: 5, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'desc' },
        load: { min: 100, max: 120, direction: 'asc' },
        percentage: { min: 70, max: 85, direction: 'asc' },
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(StandardSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.sets).toEqual(config.sets);
      expect(clonedConfig.counts).toEqual(config.counts);
      expect(clonedConfig.load).toEqual(config.load);
      expect(clonedConfig.percentage).toEqual(config.percentage);
      expect(clonedConfig.rpe).toEqual(config.rpe);
    });

    it('should create a new instance with minimal data', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(StandardSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.sets).toEqual(config.sets);
      expect(clonedConfig.counts).toEqual(config.counts);
      expect(clonedConfig.load).toBeUndefined();
      expect(clonedConfig.percentage).toBeUndefined();
      expect(clonedConfig.rpe).toBeUndefined();
    });

    it('should preserve functionality in cloned instance', () => {
      // Arrange
      const data: StandardSetParamsData = {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        rpe: { min: 7, direction: 'asc' },
      };
      const config = new StandardSetConfiguration(data);

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
