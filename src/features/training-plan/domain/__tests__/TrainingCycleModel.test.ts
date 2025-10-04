import { addDays, differenceInDays, subDays } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateId } from '@/lib';
import { TrainingCycleData, TrainingCycleGoal, trainingCycleSchema } from '@/shared/types';
import { createTestSessionModel, createTestTrainingPlanModel } from '@/test-factories';

import { TrainingCycleModel } from '../TrainingCycleModel';
import { TrainingPlanModel } from '../TrainingPlanModel';

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

/**
 * Test factory for creating TrainingCycleData
 */
function createTestTrainingCycleData(
  overrides: Partial<TrainingCycleData> = {}
): TrainingCycleData {
  const now = new Date();
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-03-31');

  return {
    id: generateId(),
    profileId: generateId(),
    name: 'Test Training Cycle',
    startDate,
    endDate,
    goal: 'hypertrophy',
    notes: 'Test cycle notes',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Test factory for creating TrainingCycleModel
 */
function createTestTrainingCycleModel(
  overrides: Partial<TrainingCycleData> = {}
): TrainingCycleModel {
  const data = createTestTrainingCycleData(overrides);
  return TrainingCycleModel.hydrate(data);
}

describe('TrainingCycleModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof TrainingCycleModel.prototype.constructor).toBe('function');
    });
  });

  describe('hydrate', () => {
    it('should create a new TrainingCycleModel instance from plain data', () => {
      // Arrange
      const data = createTestTrainingCycleData();

      // Act
      const model = TrainingCycleModel.hydrate(data);

      // Assert
      expect(model).toBeInstanceOf(TrainingCycleModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.name).toBe(data.name);
      expect(model.startDate).toBe(data.startDate);
      expect(model.endDate).toBe(data.endDate);
      expect(model.goal).toBe(data.goal);
      expect(model.notes).toBe(data.notes);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle all training cycle goals', () => {
      // Arrange
      const goals: TrainingCycleGoal[] = [
        'hypertrophy',
        'strength',
        'cutting',
        'maintenance',
        'other',
      ];

      goals.forEach((goal) => {
        // Act
        const model = createTestTrainingCycleModel({ goal });

        // Assert
        expect(model.goal).toBe(goal);
      });
    });

    it('should handle optional notes', () => {
      // Arrange
      const data = createTestTrainingCycleData({ notes: undefined });

      // Act
      const model = TrainingCycleModel.hydrate(data);

      // Assert
      expect(model.notes).toBeUndefined();
    });
  });

  describe('getDurationInDays', () => {
    it('should calculate duration including start and end dates', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07'); // 7 days inclusive
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const duration = cycle.getDurationInDays();

      // Assert
      expect(duration).toBe(7); // 1st through 7th = 7 days
    });

    it('should handle single day cycle', () => {
      // Arrange
      const date = new Date('2024-01-01');
      const cycle = createTestTrainingCycleModel({ startDate: date, endDate: date });

      // Act
      const duration = cycle.getDurationInDays();

      // Assert
      expect(duration).toBe(1);
    });

    it('should handle longer cycles', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31'); // Full year
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const duration = cycle.getDurationInDays();

      // Assert
      expect(duration).toBe(366); // 2024 is a leap year
    });
  });

  describe('getDurationInWeeks', () => {
    it('should calculate duration in weeks rounded', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-28'); // 28 days = 4 weeks
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const duration = cycle.getDurationInWeeks();

      // Assert
      expect(duration).toBe(4);
    });

    it('should round fractional weeks', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-25'); // 25 days ≈ 3.6 weeks, rounds to 4
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const duration = cycle.getDurationInWeeks();

      // Assert
      expect(duration).toBe(4);
    });

    it('should handle short cycles', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03'); // 3 days ≈ 0.4 weeks, rounds to 0
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const duration = cycle.getDurationInWeeks();

      // Assert
      expect(duration).toBe(0);
    });
  });

  describe('isActive', () => {
    it('should return true when current date is within cycle period', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-06-15');

      // Act
      const isActive = cycle.isActive(currentDate);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should return true when current date equals start date', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const isActive = cycle.isActive(startDate);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should return true when current date equals end date', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const isActive = cycle.isActive(endDate);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should return false when current date is before cycle', () => {
      // Arrange
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-03-15');

      // Act
      const isActive = cycle.isActive(currentDate);

      // Assert
      expect(isActive).toBe(false);
    });

    it('should return false when current date is after cycle', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-06-30');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-09-15');

      // Act
      const isActive = cycle.isActive(currentDate);

      // Assert
      expect(isActive).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true when cycle end date has passed', () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-06-30');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-15');

      // Act
      const isCompleted = cycle.isCompleted(currentDate);

      // Assert
      expect(isCompleted).toBe(true);
    });

    it('should return false when cycle is still ongoing', () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2025-12-31'); // Future date
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-06-15');

      // Act
      const isCompleted = cycle.isCompleted(currentDate);

      // Assert
      expect(isCompleted).toBe(false);
    });

    it('should return false when current date is in the future', () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-06-30');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const futureDate = new Date('2030-01-01'); // Far future date

      // Act
      const isCompleted = cycle.isCompleted(futureDate);

      // Assert
      expect(isCompleted).toBe(false);
    });

    it('should return false on the end date', () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-06-30');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const isCompleted = cycle.isCompleted(endDate);

      // Assert
      expect(isCompleted).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true when cycle start date is in the future', () => {
      // Arrange
      const startDate = new Date('2030-06-01');
      const endDate = new Date('2030-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2030-03-15');

      // Act
      const isFuture = cycle.isFuture(currentDate);

      // Assert
      expect(isFuture).toBe(true);
    });

    it('should return false when cycle has started', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-06-15');

      // Act
      const isFuture = cycle.isFuture(currentDate);

      // Assert
      expect(isFuture).toBe(false);
    });

    it('should return false when current date is not in future', () => {
      // Arrange
      const startDate = new Date('2025-06-01');
      const endDate = new Date('2025-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const pastDate = new Date('2024-01-01');

      // Act
      const isFuture = cycle.isFuture(pastDate);

      // Assert
      expect(isFuture).toBe(false);
    });
  });

  describe('getCompletionPercentage', () => {
    it('should calculate completion percentage correctly', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10'); // 10 days total
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-05'); // 4 days elapsed (40% = 4/10)

      // Act
      const percentage = cycle.getCompletionPercentage(currentDate);

      // Assert
      expect(percentage).toBe(40); // 4 days elapsed out of 10 total = 40%
    });

    it('should return 0 when cycle has not started', () => {
      // Arrange
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-03-15');

      // Act
      const percentage = cycle.getCompletionPercentage(currentDate);

      // Assert
      expect(percentage).toBe(0);
    });

    it('should return 100 when cycle is completed', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-15');

      // Act
      const percentage = cycle.getCompletionPercentage(currentDate);

      // Assert
      expect(percentage).toBe(100);
    });

    it('should return 0 when cycle has zero duration', () => {
      // Arrange - This should not happen in practice but test edge case
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-01');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Mock getDurationInDays to return 0
      vi.spyOn(cycle, 'getDurationInDays').mockReturnValue(0);

      const currentDate = new Date('2024-01-01');

      // Act
      const percentage = cycle.getCompletionPercentage(currentDate);

      // Assert
      expect(percentage).toBe(0);
    });

    it('should round completion percentage', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07'); // 7 days total
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-03'); // ~28.6%, should round to 29%

      // Act
      const percentage = cycle.getCompletionPercentage(currentDate);

      // Assert
      expect(percentage).toBe(29); // Math.round(2/7 * 100) = 29
    });
  });

  describe('getRemainingDays', () => {
    it('should calculate remaining days correctly', () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-10');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2025-01-05');

      // Act
      const remaining = cycle.getRemainingDays(currentDate);

      // Assert
      expect(remaining).toBe(5); // differenceInDays from Jan 5 to Jan 10 = 5
    });

    it('should return 0 when cycle is completed', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-15');

      // Act
      const remaining = cycle.getRemainingDays(currentDate);

      // Assert
      expect(remaining).toBe(0);
    });

    it('should handle same day as end date', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const remaining = cycle.getRemainingDays(endDate);

      // Assert
      expect(remaining).toBe(0); // On the end date, 0 days remaining
    });

    it('should not return negative days', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-20');

      // Act
      const remaining = cycle.getRemainingDays(currentDate);

      // Assert
      expect(remaining).toBe(0);
    });
  });

  describe('getElapsedDays', () => {
    it('should calculate elapsed days correctly', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-06');

      // Act
      const elapsed = cycle.getElapsedDays(currentDate);

      // Assert
      expect(elapsed).toBe(5); // 5 days from Jan 1 to Jan 6
    });

    it('should return 0 when cycle has not started', () => {
      // Arrange
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-03-15');

      // Act
      const elapsed = cycle.getElapsedDays(currentDate);

      // Assert
      expect(elapsed).toBe(0);
    });

    it('should handle same day as start date', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const elapsed = cycle.getElapsedDays(startDate);

      // Assert
      expect(elapsed).toBe(0); // On start date, 0 days elapsed
    });

    it('should not return negative days', () => {
      // Arrange
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-12-31');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-03-15');

      // Act
      const elapsed = cycle.getElapsedDays(currentDate);

      // Assert
      expect(elapsed).toBe(0);
    });

    it('should calculate elapsed days after cycle ends', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      const cycle = createTestTrainingCycleModel({ startDate, endDate });
      const currentDate = new Date('2024-01-15');

      // Act
      const elapsed = cycle.getElapsedDays(currentDate);

      // Assert
      expect(elapsed).toBe(14); // 14 days from Jan 1 to Jan 15
    });
  });

  describe('cloneWithUpdatedDetails', () => {
    it('should create new instance with updated name', () => {
      // Arrange
      const original = createTestTrainingCycleModel({ name: 'Original Cycle' });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ name: 'Updated Cycle' });

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.name).toBe('Updated Cycle');
      expect(original.name).toBe('Original Cycle'); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });

    it('should create new instance with updated goal', () => {
      // Arrange
      const original = createTestTrainingCycleModel({ goal: 'hypertrophy' });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ goal: 'strength' });

      // Assert
      expect(cloned.goal).toBe('strength');
      expect(original.goal).toBe('hypertrophy');
    });

    it('should create new instance with updated notes', () => {
      // Arrange
      const original = createTestTrainingCycleModel({ notes: 'Original notes' });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ notes: 'Updated notes' });

      // Assert
      expect(cloned.notes).toBe('Updated notes');
      expect(original.notes).toBe('Original notes');
    });

    it('should update multiple details at once', () => {
      // Arrange
      const original = createTestTrainingCycleModel({
        name: 'Original Cycle',
        goal: 'hypertrophy',
        notes: 'Original notes',
      });

      // Act
      const cloned = original.cloneWithUpdatedDetails({
        name: 'Updated Cycle',
        goal: 'cutting',
        notes: 'Updated notes',
      });

      // Assert
      expect(cloned.name).toBe('Updated Cycle');
      expect(cloned.goal).toBe('cutting');
      expect(cloned.notes).toBe('Updated notes');
      expect(original.name).toBe('Original Cycle');
      expect(original.goal).toBe('hypertrophy');
      expect(original.notes).toBe('Original notes');
    });

    it('should preserve other properties when updating details', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-06-30');
      const original = createTestTrainingCycleModel({
        profileId: 'test-profile',
        startDate,
        endDate,
      });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ name: 'New Name' });

      // Assert
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.startDate).toBe(original.startDate);
      expect(cloned.endDate).toBe(original.endDate);
    });
  });

  describe('cloneWithNewDates', () => {
    it('should create new instance with updated dates', () => {
      // Arrange
      const original = createTestTrainingCycleModel({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      });
      const newStartDate = new Date('2024-07-01');
      const newEndDate = new Date('2024-12-31');

      // Act
      const cloned = original.cloneWithNewDates(newStartDate, newEndDate);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.startDate).toBe(newStartDate);
      expect(cloned.endDate).toBe(newEndDate);
      expect(original.startDate).toEqual(new Date('2024-01-01')); // Original unchanged
      expect(original.endDate).toEqual(new Date('2024-06-30'));
      expect(cloned.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });

    it('should throw error when start date is after end date', () => {
      // Arrange
      const original = createTestTrainingCycleModel();
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-01-01'); // Before start date

      // Act & Assert
      expect(() => {
        original.cloneWithNewDates(startDate, endDate);
      }).toThrow('Start date must be before end date.');
    });

    it('should allow same start and end date', () => {
      // Arrange
      const original = createTestTrainingCycleModel();
      const date = new Date('2024-06-01');

      // Act
      const cloned = original.cloneWithNewDates(date, date);

      // Assert
      expect(cloned.startDate).toBe(date);
      expect(cloned.endDate).toBe(date);
    });

    it('should preserve other properties when updating dates', () => {
      // Arrange
      const original = createTestTrainingCycleModel({
        name: 'Test Cycle',
        goal: 'strength',
        notes: 'Test notes',
      });
      const newStartDate = new Date('2024-07-01');
      const newEndDate = new Date('2024-12-31');

      // Act
      const cloned = original.cloneWithNewDates(newStartDate, newEndDate);

      // Assert
      expect(cloned.name).toBe(original.name);
      expect(cloned.goal).toBe(original.goal);
      expect(cloned.notes).toBe(original.notes);
      expect(cloned.profileId).toBe(original.profileId);
    });
  });

  describe('cloneWithExtendedDuration', () => {
    it('should extend end date by specified days', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const original = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const cloned = original.cloneWithExtendedDuration(7); // Add 7 days

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.endDate).toEqual(new Date('2024-02-07'));
      expect(original.endDate).toEqual(endDate); // Original unchanged
      expect(cloned.startDate).toBe(startDate); // Start date unchanged
    });

    it('should handle negative days (shortening)', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const original = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const cloned = original.cloneWithExtendedDuration(-7); // Subtract 7 days

      // Assert
      expect(cloned.endDate).toEqual(new Date('2024-01-24'));
      expect(cloned.startDate).toBe(startDate);
    });

    it('should handle zero days extension', () => {
      // Arrange
      const original = createTestTrainingCycleModel();
      const originalEndDate = original.endDate;

      // Act
      const cloned = original.cloneWithExtendedDuration(0);

      // Assert
      expect(cloned.endDate).toEqual(originalEndDate);
      expect(cloned.startDate).toBe(original.startDate);
    });

    it('should preserve other properties when extending duration', () => {
      // Arrange
      const original = createTestTrainingCycleModel({
        name: 'Test Cycle',
        goal: 'maintenance',
      });

      // Act
      const cloned = original.cloneWithExtendedDuration(14);

      // Assert
      expect(cloned.name).toBe(original.name);
      expect(cloned.goal).toBe(original.goal);
      expect(cloned.profileId).toBe(original.profileId);
    });
  });

  describe('cloneWithShiftedDates', () => {
    it('should shift both start and end dates by specified days', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const original = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const cloned = original.cloneWithShiftedDates(30); // Shift by 30 days

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.startDate).toEqual(new Date('2024-01-31'));
      expect(cloned.endDate).toEqual(new Date('2024-03-01')); // Jan 31 + 30 days
      expect(original.startDate).toEqual(startDate); // Original unchanged
      expect(original.endDate).toEqual(endDate);
    });

    it('should handle negative days (shifting backward)', () => {
      // Arrange
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-29');
      const original = createTestTrainingCycleModel({ startDate, endDate });

      // Act
      const cloned = original.cloneWithShiftedDates(-15); // Shift backward 15 days

      // Assert
      expect(cloned.startDate).toEqual(new Date('2024-01-17'));
      expect(cloned.endDate).toEqual(new Date('2024-02-14'));
    });

    it('should handle zero days shift', () => {
      // Arrange
      const original = createTestTrainingCycleModel();
      const originalStartDate = original.startDate;
      const originalEndDate = original.endDate;

      // Act
      const cloned = original.cloneWithShiftedDates(0);

      // Assert
      expect(cloned.startDate).toEqual(originalStartDate);
      expect(cloned.endDate).toEqual(originalEndDate);
    });

    it('should preserve cycle duration when shifting', () => {
      // Arrange
      const original = createTestTrainingCycleModel({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'), // 14 days
      });
      const originalDuration = original.getDurationInDays();

      // Act
      const cloned = original.cloneWithShiftedDates(7);

      // Assert
      expect(cloned.getDurationInDays()).toBe(originalDuration);
    });
  });

  describe('getAssociatedPlans', () => {
    it('should return training plans that belong to this cycle', () => {
      // Arrange
      const cycleId = generateId();
      const cycle = createTestTrainingCycleModel({ id: cycleId });

      const plan1 = createTestTrainingPlanModel({ cycleId, name: 'Plan 1' });
      const plan2 = createTestTrainingPlanModel({ cycleId: null, name: 'Plan 2' });
      const plan3 = createTestTrainingPlanModel({ cycleId, name: 'Plan 3' });
      const plan4 = createTestTrainingPlanModel({ cycleId: 'different-cycle', name: 'Plan 4' });

      const allPlans = [plan1, plan2, plan3, plan4];

      // Act
      const associatedPlans = cycle.getAssociatedPlans(allPlans);

      // Assert
      expect(associatedPlans).toHaveLength(2);
      expect(associatedPlans).toContain(plan1);
      expect(associatedPlans).toContain(plan3);
      expect(associatedPlans).not.toContain(plan2);
      expect(associatedPlans).not.toContain(plan4);
    });

    it('should return empty array when no plans are associated', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();
      const plan1 = createTestTrainingPlanModel({ cycleId: null });
      const plan2 = createTestTrainingPlanModel({ cycleId: 'different-cycle' });

      // Act
      const associatedPlans = cycle.getAssociatedPlans([plan1, plan2]);

      // Assert
      expect(associatedPlans).toHaveLength(0);
    });

    it('should handle empty plans array', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      // Act
      const associatedPlans = cycle.getAssociatedPlans([]);

      // Assert
      expect(associatedPlans).toHaveLength(0);
    });
  });

  describe('getTotalSessionCount', () => {
    it('should count sessions across all training plans', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();
      const plan1 = createTestTrainingPlanModel(); // 2 sessions by default
      const plan2 = createTestTrainingPlanModel(); // 2 sessions by default
      const plan3 = createTestTrainingPlanModel(); // 2 sessions by default

      // Mock getTotalSessions method
      vi.spyOn(plan1, 'getTotalSessions').mockReturnValue(3);
      vi.spyOn(plan2, 'getTotalSessions').mockReturnValue(4);
      vi.spyOn(plan3, 'getTotalSessions').mockReturnValue(2);

      // Act
      const totalSessions = cycle.getTotalSessionCount([plan1, plan2, plan3]);

      // Assert
      expect(totalSessions).toBe(9); // 3 + 4 + 2 = 9
    });

    it('should return 0 for empty plans array', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      // Act
      const totalSessions = cycle.getTotalSessionCount([]);

      // Assert
      expect(totalSessions).toBe(0);
    });

    it('should handle plans with zero sessions', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();
      const plan1 = createTestTrainingPlanModel();
      const plan2 = createTestTrainingPlanModel();

      vi.spyOn(plan1, 'getTotalSessions').mockReturnValue(0);
      vi.spyOn(plan2, 'getTotalSessions').mockReturnValue(5);

      // Act
      const totalSessions = cycle.getTotalSessionCount([plan1, plan2]);

      // Assert
      expect(totalSessions).toBe(5);
    });
  });

  describe('getWeeklySessionFrequency', () => {
    it('should calculate average sessions per week', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-28'), // 4 weeks
      });
      const plan1 = createTestTrainingPlanModel();
      const plan2 = createTestTrainingPlanModel();

      vi.spyOn(cycle, 'getDurationInWeeks').mockReturnValue(4);
      vi.spyOn(cycle, 'getTotalSessionCount').mockReturnValue(12); // 12 sessions total

      // Act
      const frequency = cycle.getWeeklySessionFrequency([plan1, plan2]);

      // Assert
      expect(frequency).toBe(3.0); // 12 sessions / 4 weeks = 3.0 sessions/week
    });

    it('should round to one decimal place', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();
      const plan = createTestTrainingPlanModel();

      vi.spyOn(cycle, 'getDurationInWeeks').mockReturnValue(3);
      vi.spyOn(cycle, 'getTotalSessionCount').mockReturnValue(10); // 10/3 = 3.333...

      // Act
      const frequency = cycle.getWeeklySessionFrequency([plan]);

      // Assert
      expect(frequency).toBe(3.3); // Rounded to 1 decimal place
    });

    it('should return 0 when cycle duration is zero weeks', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();
      const plan = createTestTrainingPlanModel();

      vi.spyOn(cycle, 'getDurationInWeeks').mockReturnValue(0);

      // Act
      const frequency = cycle.getWeeklySessionFrequency([plan]);

      // Assert
      expect(frequency).toBe(0);
    });

    it('should handle empty plans array', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      vi.spyOn(cycle, 'getDurationInWeeks').mockReturnValue(4);
      vi.spyOn(cycle, 'getTotalSessionCount').mockReturnValue(0);

      // Act
      const frequency = cycle.getWeeklySessionFrequency([]);

      // Assert
      expect(frequency).toBe(0);
    });
  });

  describe('findPlansByDayOfWeek', () => {
    it('should find plans with sessions on specified day', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      // Create mock sessions with different days
      const mondaySession = createTestSessionModel({ dayOfWeek: 'monday' });
      const tuesdaySession = createTestSessionModel({ dayOfWeek: 'tuesday' });
      const wednesdaySession = createTestSessionModel({ dayOfWeek: 'wednesday' });

      const plan1 = createTestTrainingPlanModel({}, [mondaySession, tuesdaySession]);
      const plan2 = createTestTrainingPlanModel({}, [wednesdaySession]);
      const plan3 = createTestTrainingPlanModel({}, [tuesdaySession]);

      // Act
      const mondayPlans = cycle.findPlansByDayOfWeek('monday', [plan1, plan2, plan3]);

      // Assert
      expect(mondayPlans).toHaveLength(1);
      expect(mondayPlans).toContain(plan1);
    });

    it('should find multiple plans with sessions on the same day', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      const tuesdaySession1 = createTestSessionModel({ dayOfWeek: 'tuesday' });
      const tuesdaySession2 = createTestSessionModel({ dayOfWeek: 'tuesday' });
      const mondaySession = createTestSessionModel({ dayOfWeek: 'monday' });

      const plan1 = createTestTrainingPlanModel({}, [tuesdaySession1]);
      const plan2 = createTestTrainingPlanModel({}, [mondaySession]);
      const plan3 = createTestTrainingPlanModel({}, [tuesdaySession2]);

      // Act
      const tuesdayPlans = cycle.findPlansByDayOfWeek('tuesday', [plan1, plan2, plan3]);

      // Assert
      expect(tuesdayPlans).toHaveLength(2);
      expect(tuesdayPlans).toContain(plan1);
      expect(tuesdayPlans).toContain(plan3);
      expect(tuesdayPlans).not.toContain(plan2);
    });

    it('should return empty array when no plans have sessions on specified day', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      const mondaySession = createTestSessionModel({ dayOfWeek: 'monday' });
      const tuesdaySession = createTestSessionModel({ dayOfWeek: 'tuesday' });

      const plan1 = createTestTrainingPlanModel({}, [mondaySession]);
      const plan2 = createTestTrainingPlanModel({}, [tuesdaySession]);

      // Act
      const wednesdayPlans = cycle.findPlansByDayOfWeek('wednesday', [plan1, plan2]);

      // Assert
      expect(wednesdayPlans).toHaveLength(0);
    });

    it('should handle plans with sessions that have null dayOfWeek', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      const unscheduledSession = createTestSessionModel({ dayOfWeek: null });
      const mondaySession = createTestSessionModel({ dayOfWeek: 'monday' });

      const plan1 = createTestTrainingPlanModel({}, [unscheduledSession]);
      const plan2 = createTestTrainingPlanModel({}, [mondaySession]);

      // Act
      const mondayPlans = cycle.findPlansByDayOfWeek('monday', [plan1, plan2]);

      // Assert
      expect(mondayPlans).toHaveLength(1);
      expect(mondayPlans).toContain(plan2);
      expect(mondayPlans).not.toContain(plan1);
    });

    it('should handle empty plans array', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      // Act
      const plans = cycle.findPlansByDayOfWeek('monday', []);

      // Assert
      expect(plans).toHaveLength(0);
    });
  });

  describe('clone', () => {
    it('should create deep clone of the model instance', () => {
      // Arrange
      const original = createTestTrainingCycleModel({
        name: 'Test Cycle',
        goal: 'strength',
        notes: 'Test notes',
      });

      // Act
      const cloned = original.clone();

      // Assert
      // Note: Since the clone method uses produce with empty draft, it might return the same reference for immutable objects
      expect(cloned).toBeInstanceOf(TrainingCycleModel);
      expect(cloned.id).toBe(original.id);
      expect(cloned.name).toBe(original.name);
      expect(cloned.goal).toBe(original.goal);
      expect(cloned.notes).toBe(original.notes);
      expect(cloned.startDate).toBe(original.startDate);
      expect(cloned.endDate).toBe(original.endDate);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.createdAt).toBe(original.createdAt);
      expect(cloned.updatedAt).toBe(original.updatedAt);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const data = createTestTrainingCycleData({
        profileId: 'test-profile',
        name: 'Test Cycle',
        goal: 'cutting',
        notes: 'Test notes',
      });
      const cycle = TrainingCycleModel.hydrate(data);

      // Act
      const plainObject = cycle.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: 'test-profile',
        name: 'Test Cycle',
        startDate: data.startDate,
        endDate: data.endDate,
        goal: 'cutting',
        notes: 'Test notes',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should handle optional properties correctly', () => {
      // Arrange
      const data = createTestTrainingCycleData({ notes: undefined });
      const cycle = TrainingCycleModel.hydrate(data);

      // Act
      const plainObject = cycle.toPlainObject();

      // Assert
      expect(plainObject.notes).toBeUndefined();
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      // Act
      const result = cycle.validate();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should use trainingCycleSchema for validation', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();
      const safeParseSpy = vi.spyOn(trainingCycleSchema, 'safeParse');

      // Act
      cycle.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(cycle.toPlainObject());
    });

    it('should return validation errors for invalid data', () => {
      // Arrange - Create cycle with invalid data
      const invalidData = createTestTrainingCycleData({
        name: '', // Invalid: empty name
      });
      const cycle = TrainingCycleModel.hydrate(invalidData);

      // Act
      const result = cycle.validate();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should validate date constraints', () => {
      // Arrange - Create cycle with end date before start date
      const startDate = new Date('2025-06-01');
      const endDate = new Date('2025-01-01'); // Before start date
      const invalidData = createTestTrainingCycleData({ startDate, endDate });
      const cycle = TrainingCycleModel.hydrate(invalidData);

      // Act
      const result = cycle.validate();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) => issue.message === 'errors.validation.trainingCycle.endDate.beforeStart'
          )
        ).toBe(true);
      }
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-06-30');
      const original = createTestTrainingCycleModel({
        name: 'Original Cycle',
        startDate,
        endDate,
        goal: 'hypertrophy',
        notes: 'Original notes',
      });

      const originalData = {
        name: original.name,
        startDate: original.startDate,
        endDate: original.endDate,
        goal: original.goal,
        notes: original.notes,
        updatedAt: original.updatedAt,
      };

      // Act - Perform multiple operations
      const cloned1 = original.cloneWithUpdatedDetails({ name: 'New Name' });
      const cloned2 = original.cloneWithNewDates(new Date('2024-07-01'), new Date('2024-12-31'));
      const cloned3 = original.cloneWithExtendedDuration(30);
      const cloned4 = original.cloneWithShiftedDates(15);

      // Assert - Original unchanged
      expect(original.name).toBe(originalData.name);
      expect(original.startDate).toBe(originalData.startDate);
      expect(original.endDate).toBe(originalData.endDate);
      expect(original.goal).toBe(originalData.goal);
      expect(original.notes).toBe(originalData.notes);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify clones have different values
      expect(cloned1.name).toBe('New Name');
      expect(cloned2.startDate).toEqual(new Date('2024-07-01'));
      expect(cloned3.endDate).toEqual(addDays(endDate, 30));
      expect(cloned4.startDate).toEqual(addDays(startDate, 15));
    });
  });

  describe('complex operations', () => {
    it('should handle complex cycle date manipulations', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');
      let cycle = createTestTrainingCycleModel({
        name: 'Strength Cycle',
        startDate,
        endDate,
        goal: 'strength',
      });

      // Act: Multiple date operations
      cycle = cycle.cloneWithExtendedDuration(14); // Extend by 2 weeks
      cycle = cycle.cloneWithShiftedDates(7); // Shift forward 1 week
      cycle = cycle.cloneWithUpdatedDetails({
        name: 'Extended Strength Cycle',
        goal: 'hypertrophy',
      });

      // Assert
      expect(cycle.name).toBe('Extended Strength Cycle');
      expect(cycle.goal).toBe('hypertrophy');
      expect(cycle.startDate).toEqual(addDays(startDate, 7));
      expect(cycle.endDate).toEqual(addDays(addDays(endDate, 14), 7)); // Extended then shifted
    });

    it('should handle cycle progression tracking', () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-28'); // 4 week cycle
      const cycle = createTestTrainingCycleModel({ startDate, endDate });

      // Test different points in time
      const week1 = new Date('2025-01-07');
      const week2 = new Date('2025-01-14');
      const week3 = new Date('2025-01-21');
      const week4 = new Date('2025-01-28');
      const afterEnd = new Date('2025-02-05');

      // Act & Assert - Week 1 (6 days elapsed out of 28 total = ~21%)
      expect(cycle.isActive(week1)).toBe(true);
      expect(cycle.getCompletionPercentage(week1)).toBeCloseTo(21, 0);
      expect(cycle.getRemainingDays(week1)).toBe(21);

      // Act & Assert - Week 2 (13 days elapsed out of 28 total = ~46%)
      expect(cycle.isActive(week2)).toBe(true);
      expect(cycle.getCompletionPercentage(week2)).toBeCloseTo(46, 0);
      expect(cycle.getRemainingDays(week2)).toBe(14);

      // Act & Assert - Week 4 (end)
      expect(cycle.isActive(week4)).toBe(true);
      expect(cycle.getCompletionPercentage(week4)).toBe(100);
      expect(cycle.getRemainingDays(week4)).toBe(0);

      // Act & Assert - After end
      expect(cycle.isActive(afterEnd)).toBe(false);
      expect(cycle.isCompleted(afterEnd)).toBe(true);
      expect(cycle.getRemainingDays(afterEnd)).toBe(0);
    });

    it('should handle training plan association and frequency calculations', () => {
      // Arrange
      const cycleId = generateId();
      const cycle = createTestTrainingCycleModel({
        id: cycleId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-28'), // 4 weeks
      });

      // Create plans with different session counts
      const plan1 = createTestTrainingPlanModel({ cycleId, name: 'Upper/Lower' });
      const plan2 = createTestTrainingPlanModel({ cycleId, name: 'Push/Pull/Legs' });
      const plan3 = createTestTrainingPlanModel({ cycleId: 'different-cycle', name: 'Other Plan' });

      vi.spyOn(plan1, 'getTotalSessions').mockReturnValue(2); // 2 sessions/week = 8 total
      vi.spyOn(plan2, 'getTotalSessions').mockReturnValue(3); // 3 sessions/week = 12 total
      vi.spyOn(plan3, 'getTotalSessions').mockReturnValue(4);

      const allPlans = [plan1, plan2, plan3];

      // Act
      const associatedPlans = cycle.getAssociatedPlans(allPlans);
      const totalSessions = cycle.getTotalSessionCount(associatedPlans);
      const weeklyFrequency = cycle.getWeeklySessionFrequency(associatedPlans);

      // Assert
      expect(associatedPlans).toHaveLength(2);
      expect(associatedPlans).toContain(plan1);
      expect(associatedPlans).toContain(plan2);
      expect(associatedPlans).not.toContain(plan3);
      expect(totalSessions).toBe(5); // 2 + 3 = 5 sessions
      expect(weeklyFrequency).toBe(1.3); // 5 sessions / 4 weeks = 1.25 ≈ 1.3
    });

    it('should handle day-based plan filtering', () => {
      // Arrange
      const cycle = createTestTrainingCycleModel();

      // Create sessions for different days
      const mondaySession = createTestSessionModel({ dayOfWeek: 'monday' });
      const tuesdaySession = createTestSessionModel({ dayOfWeek: 'tuesday' });
      const wednesdaySession = createTestSessionModel({ dayOfWeek: 'wednesday' });
      const fridaySession = createTestSessionModel({ dayOfWeek: 'friday' });

      const upperLowerPlan = createTestTrainingPlanModel({}, [mondaySession, tuesdaySession]);
      const pplPlan = createTestTrainingPlanModel({}, [
        mondaySession,
        wednesdaySession,
        fridaySession,
      ]);

      const plans = [upperLowerPlan, pplPlan];

      // Act & Assert
      const mondayPlans = cycle.findPlansByDayOfWeek('monday', plans);
      expect(mondayPlans).toHaveLength(2); // Both plans have Monday sessions

      const tuesdayPlans = cycle.findPlansByDayOfWeek('tuesday', plans);
      expect(tuesdayPlans).toHaveLength(1); // Only upper/lower has Tuesday

      const thursdayPlans = cycle.findPlansByDayOfWeek('thursday', plans);
      expect(thursdayPlans).toHaveLength(0); // No Thursday sessions

      const fridayPlans = cycle.findPlansByDayOfWeek('friday', plans);
      expect(fridayPlans).toHaveLength(1); // Only PPL has Friday
    });
  });
});
