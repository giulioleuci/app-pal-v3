import { describe, expect, it, vi } from 'vitest';

import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, PyramidalSetParamsData } from '@/shared/types';

import { PyramidalSetConfiguration } from '../PyramidalSetConfiguration';

// Mock external dependencies
vi.mock('@/lib', () => ({
  generateId: vi.fn(() => 'mock-id'),
  BASE_SECONDS_PER_SET: 5,
  SECONDS_PER_REP: 3,
}));

describe('PyramidalSetConfiguration', () => {
  describe('constructor', () => {
    it('should create a PyramidalSetConfiguration with valid data', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };

      // Act
      const config = new PyramidalSetConfiguration(data);

      // Assert
      expect(config.type).toBe('pyramidal');
      expect(config.startCounts).toEqual({ min: 8, direction: 'asc' });
      expect(config.endCounts).toEqual({ min: 12, direction: 'asc' });
      expect(config.step).toEqual({ min: 2, direction: 'asc' });
      expect(config.mode).toBe('ascending');
      expect(config.rpe).toBeUndefined();
    });

    it('should create a PyramidalSetConfiguration with RPE', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 1, direction: 'asc' },
        mode: 'descending',
        rpe: { min: 7, max: 9, direction: 'asc' },
      };

      // Act
      const config = new PyramidalSetConfiguration(data);

      // Assert
      expect(config.type).toBe('pyramidal');
      expect(config.startCounts).toEqual({ min: 6, direction: 'asc' });
      expect(config.endCounts).toEqual({ min: 10, direction: 'asc' });
      expect(config.step).toEqual({ min: 1, direction: 'asc' });
      expect(config.mode).toBe('descending');
      expect(config.rpe).toEqual({ min: 7, max: 9, direction: 'asc' });
    });
  });

  describe('getPyramidSets', () => {
    it('should generate ascending pyramid sets', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      // Pyramid should be: 8, 10, 12
      expect(totalSets).toBe(3);
    });

    it('should generate descending pyramid sets', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 4, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'descending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      // Pyramid should be: 12, 10, 8, 6
      expect(totalSets).toBe(4);
    });

    it('should generate both ascending and descending pyramid sets', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'bothAscendingDescending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      // Pyramid should be: 6, 8, 10 (ascending), then 8, 6 (descending)
      expect(totalSets).toBe(5);
    });

    it('should handle single step pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 1, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      // Pyramid should be: 8, 9, 10, 11, 12
      expect(totalSets).toBe(5);
    });

    it('should handle large step pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 2, direction: 'asc' },
        startCounts: { min: 5, direction: 'asc' },
        endCounts: { min: 15, direction: 'asc' },
        step: { min: 5, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      // Pyramid should be: 5, 10, 15
      expect(totalSets).toBe(3);
    });
  });

  describe('getTotalSets', () => {
    it('should return correct number of sets for ascending mode', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(3); // 8, 10, 12
    });

    it('should return correct number of sets for descending mode', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'descending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(3); // 10, 8, 6
    });

    it('should return correct number of sets for both ascending and descending mode', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'bothAscendingDescending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(5); // 6, 8, 10, 8, 6
    });
  });

  describe('getSummary', () => {
    it('should generate summary for ascending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('Pyramid from 8 to 12 reps');
    });

    it('should generate summary for descending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 4, direction: 'asc' },
        startCounts: { min: 15, direction: 'asc' },
        endCounts: { min: 9, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'descending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('Pyramid from 15 to 9 reps');
    });

    it('should generate summary for both ascending and descending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 1, direction: 'asc' },
        mode: 'bothAscendingDescending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('Pyramid from 6 to 10 reps');
    });
  });

  describe('getEstimatedDurationSeconds', () => {
    it('should calculate duration with default parameters for ascending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Sets: [8, 10, 12]
      // Total reps: 8 + 10 + 12 = 30
      // Duration: 30 * 3 + 3 * 5 = 90 + 15 = 105
      expect(duration).toBe(105);
    });

    it('should calculate duration with custom parameters', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 2, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 8, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: 2,
        baseTimePerSet: 10,
      });

      // Assert
      // Sets: [6, 8]
      // Total reps: 6 + 8 = 14
      // Duration: 14 * 2 + 2 * 10 = 28 + 20 = 48
      expect(duration).toBe(48);
    });

    it('should calculate duration for descending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 8, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'descending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Sets: [12, 10, 8]
      // Total reps: 12 + 10 + 8 = 30
      // Duration: 30 * 3 + 3 * 5 = 90 + 15 = 105
      expect(duration).toBe(105);
    });

    it('should calculate duration for both ascending and descending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'bothAscendingDescending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Sets: [6, 8, 10, 8, 6]
      // Total reps: 6 + 8 + 10 + 8 + 6 = 38
      // Duration: 38 * 3 + 5 * 5 = 114 + 25 = 139
      expect(duration).toBe(139);
    });

    it('should handle single step pyramids', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 1, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Sets: [8, 9, 10, 11, 12]
      // Total reps: 8 + 9 + 10 + 11 + 12 = 50
      // Duration: 50 * 3 + 5 * 5 = 150 + 25 = 175
      expect(duration).toBe(175);
    });
  });

  describe('generateEmptySets', () => {
    it('should generate correct number of empty sets for ascending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'reps';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(3); // [8, 10, 12]
      expect(generateId).toHaveBeenCalledTimes(3);
    });

    it('should generate sets with correct planned counts for each step', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new PyramidalSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'reps';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(3);
      expect(emptySets[0]).toEqual({
        id: 'mock-id',
        profileId: 'test-profile',
        counterType: 'reps',
        counts: 0,
        weight: 0,
        completed: false,
        plannedRpe: { min: 7, max: 9, direction: 'asc' },
        plannedCounts: { min: 8, direction: 'asc' },
      });
      expect(emptySets[1]).toEqual({
        id: 'mock-id',
        profileId: 'test-profile',
        counterType: 'reps',
        counts: 0,
        weight: 0,
        completed: false,
        plannedRpe: { min: 7, max: 9, direction: 'asc' },
        plannedCounts: { min: 10, direction: 'asc' },
      });
      expect(emptySets[2]).toEqual({
        id: 'mock-id',
        profileId: 'test-profile',
        counterType: 'reps',
        counts: 0,
        weight: 0,
        completed: false,
        plannedRpe: { min: 7, max: 9, direction: 'asc' },
        plannedCounts: { min: 12, direction: 'asc' },
      });
    });

    it('should generate sets for descending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 8, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'descending',
      };
      const config = new PyramidalSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'mins';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(3);
      expect(emptySets[0].plannedCounts).toEqual({ min: 12, direction: 'asc' });
      expect(emptySets[1].plannedCounts).toEqual({ min: 10, direction: 'asc' });
      expect(emptySets[2].plannedCounts).toEqual({ min: 8, direction: 'asc' });
    });

    it('should generate sets for both ascending and descending pyramid', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'bothAscendingDescending',
      };
      const config = new PyramidalSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'secs';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(5);
      expect(emptySets[0].plannedCounts).toEqual({ min: 6, direction: 'asc' });
      expect(emptySets[1].plannedCounts).toEqual({ min: 8, direction: 'asc' });
      expect(emptySets[2].plannedCounts).toEqual({ min: 10, direction: 'asc' });
      expect(emptySets[3].plannedCounts).toEqual({ min: 8, direction: 'asc' });
      expect(emptySets[4].plannedCounts).toEqual({ min: 6, direction: 'asc' });
    });

    it('should generate sets without RPE when not provided', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 2, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'reps';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(2);
      emptySets.forEach((set) => {
        expect(set.plannedRpe).toBeUndefined();
      });
    });
  });

  describe('getEstimatedRPECurve', () => {
    it('should return empty array when no RPE is set', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([]);
    });

    it('should return array of RPE values for each set', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([7, 7, 7]); // One RPE value per set
    });

    it('should use minimum RPE value for all sets', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 5, direction: 'asc' },
        startCounts: { min: 6, direction: 'asc' },
        endCounts: { min: 10, direction: 'asc' },
        step: { min: 1, direction: 'asc' },
        mode: 'ascending',
        rpe: { min: 8, direction: 'asc' },
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([8, 8, 8, 8, 8]); // 5 sets
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object with all properties', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, max: 10, direction: 'asc' },
        endCounts: { min: 12, max: 15, direction: 'desc' },
        step: { min: 2, max: 3, direction: 'asc' },
        mode: 'bothAscendingDescending',
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'pyramidal',
        startCounts: { min: 8, max: 10, direction: 'asc' },
        endCounts: { min: 12, max: 15, direction: 'desc' },
        step: { min: 2, max: 3, direction: 'asc' },
        mode: 'bothAscendingDescending',
        sets: { min: config.getTotalSets(), direction: 'asc' }, // Base schema requirement
        rpe: { min: 7, max: 9, direction: 'asc' },
      });
    });

    it('should return correct plain object with minimal properties', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 2, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'pyramidal',
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 3, direction: 'asc' }, // Calculated total sets
        rpe: undefined,
      });
    });

    it('should return a new object reference', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 2, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).not.toBe(config);
      expect(plainObject.startCounts).not.toBe(config.startCounts);
      expect(plainObject.endCounts).not.toBe(config.endCounts);
      expect(plainObject.step).not.toBe(config.step);
    });
  });

  describe('clone', () => {
    it('should create a new instance with identical data', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, max: 10, direction: 'asc' },
        endCounts: { min: 12, max: 15, direction: 'desc' },
        step: { min: 2, max: 3, direction: 'asc' },
        mode: 'bothAscendingDescending',
        rpe: { min: 7, max: 9, direction: 'asc' },
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(PyramidalSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.startCounts).toEqual(config.startCounts);
      expect(clonedConfig.endCounts).toEqual(config.endCounts);
      expect(clonedConfig.step).toEqual(config.step);
      expect(clonedConfig.mode).toBe(config.mode);
      expect(clonedConfig.rpe).toEqual(config.rpe);
    });

    it('should create a new instance with minimal data', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 2, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
      };
      const config = new PyramidalSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(PyramidalSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.startCounts).toEqual(config.startCounts);
      expect(clonedConfig.endCounts).toEqual(config.endCounts);
      expect(clonedConfig.step).toEqual(config.step);
      expect(clonedConfig.mode).toBe(config.mode);
      expect(clonedConfig.rpe).toBeUndefined();
    });

    it('should preserve functionality in cloned instance', () => {
      // Arrange
      const data: PyramidalSetParamsData = {
        type: 'pyramidal',
        sets: { min: 3, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        endCounts: { min: 12, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        rpe: { min: 7, direction: 'asc' },
      };
      const config = new PyramidalSetConfiguration(data);

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
