import { describe, expect, it, vi } from 'vitest';

import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, RestPauseSetParamsData } from '@/shared/types';

import { RestPauseSetConfiguration } from '../RestPauseSetConfiguration';

// Mock external dependencies
vi.mock('@/lib', () => ({
  generateId: vi.fn(() => 'mock-id'),
  BASE_SECONDS_PER_SET: 5,
  SECONDS_PER_REP: 3,
}));

describe('RestPauseSetConfiguration', () => {
  describe('constructor', () => {
    it('should create a RestPauseSetConfiguration with valid data', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        pauses: { min: 3, max: 5, direction: 'asc' },
      };

      // Act
      const config = new RestPauseSetConfiguration(data);

      // Assert
      expect(config.type).toBe('restPause');
      expect(config.counts).toEqual({ min: 8, max: 12, direction: 'asc' });
      expect(config.pauses).toEqual({ min: 3, max: 5, direction: 'asc' });
      expect(config.rpe).toBeUndefined();
    });

    it('should create a RestPauseSetConfiguration with RPE', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 2, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };

      // Act
      const config = new RestPauseSetConfiguration(data);

      // Assert
      expect(config.type).toBe('restPause');
      expect(config.counts).toEqual({ min: 10, direction: 'asc' });
      expect(config.pauses).toEqual({ min: 2, direction: 'asc' });
      expect(config.rpe).toEqual({ min: 8, max: 10, direction: 'asc' });
    });
  });

  describe('formatRange', () => {
    it('should format range with infinity max value', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, max: Infinity, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('8+ reps with 3 rest-pauses');
    });

    it('should format range with undefined max value', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 4, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('10 reps with 4 rest-pauses');
    });

    it('should format range with descending direction', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'desc' },
        pauses: { min: 2, max: 4, direction: 'desc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12-8 reps with 4-2 rest-pauses');
    });

    it('should format range with ascending direction', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        pauses: { min: 2, max: 4, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('8-12 reps with 2-4 rest-pauses');
    });
  });

  describe('getTotalSets', () => {
    it('should return 1 plus minimum number of pauses', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, max: 5, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(4); // 1 + 3
    });

    it('should return correct value for single pause', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 12, direction: 'asc' },
        pauses: { min: 1, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(2); // 1 + 1
    });

    it('should return correct value for multiple pauses', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
        pauses: { min: 6, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(7); // 1 + 6
    });
  });

  describe('getSummary', () => {
    it('should generate summary without RPE', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, max: 15, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('10-15 reps with 3 rest-pauses');
    });

    it('should generate summary with RPE', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
        pauses: { min: 2, max: 4, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('8 reps with 2-4 rest-pauses @ RPE 8-10');
    });

    it('should generate summary with single RPE value', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 12, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12 reps with 3 rest-pauses @ RPE 9');
    });

    it('should generate summary with infinity values', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 6, max: Infinity, direction: 'asc' },
        pauses: { min: 2, max: Infinity, direction: 'asc' },
        rpe: { min: 7, max: Infinity, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('6+ reps with 2+ rest-pauses @ RPE 7+');
    });
  });

  describe('getEstimatedDurationSeconds', () => {
    it('should calculate duration with default parameters', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Total sets: 1 + 3 = 4
      // Total reps: 10 * 4 = 40
      // Duration: 40 * 3 + 4 * 5 = 120 + 20 = 140
      expect(duration).toBe(140);
    });

    it('should calculate duration with custom parameters', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
        pauses: { min: 2, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: 2,
        baseTimePerSet: 10,
      });

      // Assert
      // Total sets: 1 + 2 = 3
      // Total reps: 8 * 3 = 24
      // Duration: 24 * 2 + 3 * 10 = 48 + 30 = 78
      expect(duration).toBe(78);
    });

    it('should handle different counts and pauses combinations', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 15, direction: 'asc' },
        pauses: { min: 1, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Total sets: 1 + 1 = 2
      // Total reps: 15 * 2 = 30
      // Duration: 30 * 3 + 2 * 5 = 90 + 10 = 100
      expect(duration).toBe(100);
    });

    it('should handle zero baseTimePerSet', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 12, direction: 'asc' },
        pauses: { min: 4, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: 4,
        baseTimePerSet: 0,
      });

      // Assert
      // Total sets: 1 + 4 = 5
      // Total reps: 12 * 5 = 60
      // Duration: 60 * 4 + 5 * 0 = 240 + 0 = 240
      expect(duration).toBe(240);
    });
  });

  describe('generateEmptySets', () => {
    it('should generate correct number of empty sets', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'reps';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(4); // 1 + 3 pauses
      expect(generateId).toHaveBeenCalledTimes(4);
    });

    it('should generate sets with correct structure and properties', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        pauses: { min: 2, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'mins';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(3); // 1 + 2 pauses
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
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 1, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'secs';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(2); // 1 + 1 pause
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
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([]);
    });

    it('should return array of RPE values for each set', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, direction: 'asc' },
        pauses: { min: 2, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([8, 8, 8]); // 1 main set + 2 pauses
    });

    it('should use minimum RPE value for all sets', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 12, direction: 'asc' },
        pauses: { min: 4, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([9, 9, 9, 9, 9]); // 1 main set + 4 pauses
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object with all properties', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        pauses: { min: 2, max: 4, direction: 'desc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'restPause',
        counts: { min: 8, max: 12, direction: 'asc' },
        pauses: { min: 2, max: 4, direction: 'desc' },
        sets: { min: 1, direction: 'asc' }, // Base schema requirement
        rpe: { min: 8, max: 10, direction: 'asc' },
      });
    });

    it('should return correct plain object with minimal properties', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'restPause',
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: undefined,
      });
    });

    it('should return a new object reference', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).not.toBe(config);
      expect(plainObject.counts).not.toBe(config.counts);
      expect(plainObject.pauses).not.toBe(config.pauses);
    });
  });

  describe('clone', () => {
    it('should create a new instance with identical data', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        pauses: { min: 2, max: 4, direction: 'desc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(RestPauseSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.counts).toEqual(config.counts);
      expect(clonedConfig.pauses).toEqual(config.pauses);
      expect(clonedConfig.rpe).toEqual(config.rpe);
    });

    it('should create a new instance with minimal data', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(RestPauseSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.counts).toEqual(config.counts);
      expect(clonedConfig.pauses).toEqual(config.pauses);
      expect(clonedConfig.rpe).toBeUndefined();
    });

    it('should preserve functionality in cloned instance', () => {
      // Arrange
      const data: RestPauseSetParamsData = {
        type: 'restPause',
        sets: { min: 1, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        pauses: { min: 3, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      };
      const config = new RestPauseSetConfiguration(data);

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
