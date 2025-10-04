import { describe, expect, it, vi } from 'vitest';

import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { DropSetParamsData, ExerciseCounter } from '@/shared/types';

import { DropSetConfiguration } from '../DropSetConfiguration';

// Mock external dependencies
vi.mock('@/lib', () => ({
  generateId: vi.fn(() => 'mock-id'),
  BASE_SECONDS_PER_SET: 5,
  SECONDS_PER_REP: 3,
}));

describe('DropSetConfiguration', () => {
  describe('constructor', () => {
    it('should create a DropSetConfiguration with valid data', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, max: 15, direction: 'asc' },
        drops: { min: 2, max: 4, direction: 'asc' },
      };

      // Act
      const config = new DropSetConfiguration(data);

      // Assert
      expect(config.type).toBe('drop');
      expect(config.startCounts).toEqual({ min: 12, max: 15, direction: 'asc' });
      expect(config.drops).toEqual({ min: 2, max: 4, direction: 'asc' });
      expect(config.rpe).toBeUndefined();
    });

    it('should create a DropSetConfiguration with RPE', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };

      // Act
      const config = new DropSetConfiguration(data);

      // Assert
      expect(config.type).toBe('drop');
      expect(config.startCounts).toEqual({ min: 10, direction: 'asc' });
      expect(config.drops).toEqual({ min: 3, direction: 'asc' });
      expect(config.rpe).toEqual({ min: 8, max: 10, direction: 'asc' });
    });
  });

  describe('formatRange', () => {
    it('should format range with infinity max value', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, max: Infinity, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12+ reps, then 2 drops');
    });

    it('should format range with undefined max value', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('10 reps, then 3 drops');
    });

    it('should format range with descending direction', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 8, max: 12, direction: 'desc' },
        drops: { min: 2, max: 4, direction: 'desc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12-8 reps, then 4-2 drops');
    });

    it('should format range with ascending direction', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 8, max: 12, direction: 'asc' },
        drops: { min: 2, max: 4, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('8-12 reps, then 2-4 drops');
    });
  });

  describe('getTotalSets', () => {
    it('should return 1 plus minimum number of drops', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 3, max: 5, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(4); // 1 + 3
    });

    it('should return correct value for single drop', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 1, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(2); // 1 + 1
    });

    it('should return correct value for multiple drops', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 15, direction: 'asc' },
        drops: { min: 5, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const totalSets = config.getTotalSets();

      // Assert
      expect(totalSets).toBe(6); // 1 + 5
    });
  });

  describe('getSummary', () => {
    it('should generate summary without RPE', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, max: 15, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12-15 reps, then 3 drops');
    });

    it('should generate summary with RPE', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 2, max: 4, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('10 reps, then 2-4 drops to RPE 8-10');
    });

    it('should generate summary with single RPE value', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('12 reps, then 3 drops to RPE 9');
    });

    it('should generate summary with infinity values', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 8, max: Infinity, direction: 'asc' },
        drops: { min: 2, max: Infinity, direction: 'asc' },
        rpe: { min: 7, max: Infinity, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const summary = config.getSummary();

      // Assert
      expect(summary).toBe('8+ reps, then 2+ drops to RPE 7+');
    });
  });

  describe('getEstimatedDurationSeconds', () => {
    it('should calculate duration with default parameters', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Total reps: 12 + (3 * (12 / 2)) = 12 + 18 = 30
      // Duration: 30 * (3 * 0.8) + 5 = 30 * 2.4 + 5 = 72 + 5 = 77
      expect(duration).toBe(77);
    });

    it('should calculate duration with custom parameters', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: 2,
        baseTimePerSet: 10,
      });

      // Assert
      // Total reps: 10 + (2 * (10 / 2)) = 10 + 10 = 20
      // Duration: 20 * (2 * 0.8) + 10 = 20 * 1.6 + 10 = 32 + 10 = 42
      expect(duration).toBe(42);
    });

    it('should apply fatigue factor (0.8) to time per rep', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 4, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);
      const customTimePerRep = 4;

      // Act
      const duration = config.getEstimatedDurationSeconds({
        timePerRep: customTimePerRep,
        baseTimePerSet: 0,
      });

      // Assert
      // Total reps: 8 + (4 * (8 / 2)) = 8 + 16 = 24
      // Duration: 24 * (4 * 0.8) + 0 = 24 * 3.2 = 76.8
      expect(duration).toBe(76.8);
    });

    it('should handle different start counts and drops combinations', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 20, direction: 'asc' },
        drops: { min: 1, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const duration = config.getEstimatedDurationSeconds();

      // Assert
      // Total reps: 20 + (1 * (20 / 2)) = 20 + 10 = 30
      // Duration: 30 * (3 * 0.8) + 5 = 30 * 2.4 + 5 = 72 + 5 = 77
      expect(duration).toBe(77);
    });
  });

  describe('generateEmptySets', () => {
    it('should generate correct number of empty sets', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'reps';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(4); // 1 + 3 drops
      expect(generateId).toHaveBeenCalledTimes(4);
    });

    it('should generate sets with correct structure and properties', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, max: 15, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'mins';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(3); // 1 + 2 drops
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
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 1, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);
      const profileId = 'test-profile';
      const counterType: ExerciseCounter = 'secs';

      // Act
      const emptySets = config.generateEmptySets(profileId, counterType);

      // Assert
      expect(emptySets).toHaveLength(2); // 1 + 1 drop
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
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([]);
    });

    it('should return array of RPE values for each set', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([8, 8, 8]); // 1 main set + 2 drops
    });

    it('should use minimum RPE value for all sets', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 4, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const rpeCurve = config.getEstimatedRPECurve();

      // Assert
      expect(rpeCurve).toEqual([9, 9, 9, 9, 9]); // 1 main set + 4 drops
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object with all properties', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, max: 15, direction: 'asc' },
        drops: { min: 2, max: 4, direction: 'desc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'drop',
        startCounts: { min: 12, max: 15, direction: 'asc' },
        drops: { min: 2, max: 4, direction: 'desc' },
        sets: { min: 1, direction: 'asc' }, // Base schema requirement
        rpe: { min: 8, max: 10, direction: 'asc' },
      });
    });

    it('should return correct plain object with minimal properties', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        type: 'drop',
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
        rpe: undefined,
      });
    });

    it('should return a new object reference', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const plainObject = config.toPlainObject();

      // Assert
      expect(plainObject).not.toBe(config);
      expect(plainObject.startCounts).not.toBe(config.startCounts);
      expect(plainObject.drops).not.toBe(config.drops);
    });
  });

  describe('clone', () => {
    it('should create a new instance with identical data', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, max: 15, direction: 'asc' },
        drops: { min: 2, max: 4, direction: 'desc' },
        rpe: { min: 8, max: 10, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(DropSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.startCounts).toEqual(config.startCounts);
      expect(clonedConfig.drops).toEqual(config.drops);
      expect(clonedConfig.rpe).toEqual(config.rpe);
    });

    it('should create a new instance with minimal data', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

      // Act
      const clonedConfig = config.clone();

      // Assert
      expect(clonedConfig).toBeInstanceOf(DropSetConfiguration);
      expect(clonedConfig).not.toBe(config);
      expect(clonedConfig.type).toBe(config.type);
      expect(clonedConfig.startCounts).toEqual(config.startCounts);
      expect(clonedConfig.drops).toEqual(config.drops);
      expect(clonedConfig.rpe).toBeUndefined();
    });

    it('should preserve functionality in cloned instance', () => {
      // Arrange
      const data: DropSetParamsData = {
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 12, direction: 'asc' },
        drops: { min: 3, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      };
      const config = new DropSetConfiguration(data);

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
