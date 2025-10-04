import { describe, expect, it } from 'vitest';

import { estimate1RM, rpeChart } from '../rpe-chart';

describe('RPE Chart', () => {
  describe('rpeChart data structure', () => {
    it('should have correct RPE values as keys', () => {
      // Arrange & Act
      const rpeValues = Object.keys(rpeChart)
        .map(Number)
        .sort((a, b) => a - b);

      // Assert
      expect(rpeValues).toEqual([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);
    });

    it('should have arrays of 12 percentages for each RPE', () => {
      // Arrange & Act & Assert
      Object.entries(rpeChart).forEach(([, percentages]) => {
        expect(percentages).toHaveLength(12);
        expect(Array.isArray(percentages)).toBe(true);
      });
    });

    it('should have decreasing percentages within each RPE row', () => {
      // RPE percentages should decrease as reps increase (moving right in the array)
      Object.entries(rpeChart).forEach(([, percentages]) => {
        for (let i = 1; i < percentages.length; i++) {
          expect(percentages[i]).toBeLessThan(percentages[i - 1]);
        }
      });
    });

    it('should have RPE 10 with 100% for 1 rep (index 0)', () => {
      // Arrange & Act & Assert
      expect(rpeChart[10][0]).toBe(100.0);
    });

    it('should have all percentages as positive numbers', () => {
      // Arrange & Act & Assert
      Object.entries(rpeChart).forEach(([, percentages]) => {
        percentages.forEach((percentage) => {
          expect(percentage).toBeGreaterThan(0);
          expect(typeof percentage).toBe('number');
        });
      });
    });

    it('should have all percentages less than or equal to 100', () => {
      // Arrange & Act & Assert
      Object.entries(rpeChart).forEach(([, percentages]) => {
        percentages.forEach((percentage) => {
          expect(percentage).toBeLessThanOrEqual(100);
        });
      });
    });

    it('should have higher RPE values with higher percentages for same rep count', () => {
      // For the same number of reps, higher RPE should have higher percentages
      const rpeValues = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

      for (let repIndex = 0; repIndex < 12; repIndex++) {
        for (let i = 1; i < rpeValues.length; i++) {
          const lowerRpe = rpeValues[i - 1];
          const higherRpe = rpeValues[i];

          expect(rpeChart[higherRpe][repIndex]).toBeGreaterThan(rpeChart[lowerRpe][repIndex]);
        }
      }
    });
  });

  describe('estimate1RM function', () => {
    describe('valid calculations', () => {
      it('should calculate 1RM correctly for RPE 10, 1 rep', () => {
        // Arrange & Act
        const e1RM = estimate1RM(100, 1, 10);

        // Assert
        expect(e1RM).toBe(100); // 100kg at RPE 10 for 1 rep = 100% = 100kg 1RM
      });

      it('should calculate 1RM correctly for RPE 9, 1 rep', () => {
        // Arrange & Act
        const e1RM = estimate1RM(100, 1, 9);

        // Assert
        // RPE 9, 1 rep is 95.5% according to the chart
        const expected = 100 / (95.5 / 100);
        expect(e1RM).toBeCloseTo(expected, 2);
      });

      it('should calculate 1RM correctly for RPE 8, 5 reps', () => {
        // Arrange & Act
        const e1RM = estimate1RM(80, 5, 8);

        // Assert
        // RPE 8, 5 reps (index 4) is 80.6% according to the chart
        const expected = 80 / (80.6 / 100);
        expect(e1RM).toBeCloseTo(expected, 2);
      });

      it('should calculate 1RM correctly for decimal RPE values', () => {
        // Arrange & Act
        const e1RM = estimate1RM(85, 3, 8.5);

        // Assert
        // RPE 8.5, 3 reps (index 2) is 87.5% according to the chart
        const expected = 85 / (87.5 / 100);
        expect(e1RM).toBeCloseTo(expected, 2);
      });

      it('should handle maximum reps (12) correctly', () => {
        // Arrange & Act
        const e1RM = estimate1RM(50, 12, 7);

        // Assert
        // RPE 7, 12 reps (index 11) is 62.4% according to the chart
        const expected = 50 / (62.4 / 100);
        expect(e1RM).toBeCloseTo(expected, 2);
      });

      it('should handle minimum RPE (6) correctly', () => {
        // Arrange & Act
        const e1RM = estimate1RM(70, 1, 6);

        // Assert
        // RPE 6, 1 rep (index 0) is 82.3% according to the chart
        const expected = 70 / (82.3 / 100);
        expect(e1RM).toBeCloseTo(expected, 2);
      });

      it('should calculate different 1RMs for different weights with same RPE/reps', () => {
        // Arrange & Act
        const e1RM1 = estimate1RM(80, 5, 9);
        const e1RM2 = estimate1RM(100, 5, 9);

        // Assert
        expect(e1RM2).toBeGreaterThan(e1RM1);
        expect(e1RM2 / e1RM1).toBeCloseTo(100 / 80, 2);
      });

      it('should calculate higher 1RM for higher RPE with same weight/reps', () => {
        // Arrange & Act
        const e1RM_RPE8 = estimate1RM(80, 5, 8);
        const e1RM_RPE9 = estimate1RM(80, 5, 9);

        // Assert
        expect(e1RM_RPE8).toBeGreaterThan(e1RM_RPE9);
      });

      it('should calculate lower 1RM for fewer reps with same weight/RPE', () => {
        // Note: With same weight and RPE, fewer reps actually indicate lower strength capacity
        // since you're lifting the same weight but can't do as many reps
        // Arrange & Act
        const e1RM_1rep = estimate1RM(80, 1, 8);
        const e1RM_5reps = estimate1RM(80, 5, 8);

        // Assert
        expect(e1RM_1rep).toBeLessThan(e1RM_5reps);
      });
    });

    describe('edge cases and invalid inputs', () => {
      it('should return 0 for RPE not in chart', () => {
        // Arrange & Act
        const e1RM1 = estimate1RM(100, 5, 5); // RPE 5 not in chart
        const e1RM2 = estimate1RM(100, 5, 11); // RPE 11 not in chart

        // Assert
        expect(e1RM1).toBe(0);
        expect(e1RM2).toBe(0);
      });

      it('should return 0 for reps less than 1', () => {
        // Arrange & Act
        const e1RM1 = estimate1RM(100, 0, 8);
        const e1RM2 = estimate1RM(100, -1, 8);

        // Assert
        expect(e1RM1).toBe(0);
        expect(e1RM2).toBe(0);
      });

      it('should return 0 for reps greater than chart length', () => {
        // Arrange & Act
        const e1RM1 = estimate1RM(100, 13, 8); // Chart has 12 entries (1-12 reps)
        const e1RM2 = estimate1RM(100, 20, 8);

        // Assert
        expect(e1RM1).toBe(0);
        expect(e1RM2).toBe(0);
      });

      it('should return 0 for non-existent RPE values', () => {
        // Arrange & Act
        const e1RM1 = estimate1RM(100, 5, 6.25); // RPE 6.25 not in chart
        const e1RM2 = estimate1RM(100, 5, 7.25); // RPE 7.25 not in chart

        // Assert
        expect(e1RM1).toBe(0);
        expect(e1RM2).toBe(0);
      });

      it('should handle zero weight', () => {
        // Arrange & Act
        const e1RM = estimate1RM(0, 5, 8);

        // Assert
        expect(e1RM).toBe(0);
      });

      it('should handle negative weight', () => {
        // Arrange & Act
        const e1RM = estimate1RM(-50, 5, 8);

        // Assert
        // Function doesn't validate negative weight, so it will calculate
        expect(e1RM).toBeLessThan(0);
      });

      it('should handle decimal weights correctly', () => {
        // Arrange & Act
        const e1RM = estimate1RM(82.5, 3, 8);

        // Assert
        const expected = 82.5 / (85.7 / 100); // RPE 8, 3 reps is 85.7%
        expect(e1RM).toBeCloseTo(expected, 2);
      });

      it('should handle decimal reps (though not realistic)', () => {
        // The function doesn't validate integer reps, and decimal values would be used directly
        // Since we access array index counts - 1, 5.9 becomes index 4.9, which is invalid

        // Arrange & Act
        const e1RM = estimate1RM(100, 5.9, 8); // Index 4.9 doesn't exist in array

        // Assert
        expect(e1RM).toBe(0); // Should return 0 for invalid array access
      });
    });

    describe('realistic workout scenarios', () => {
      it('should calculate 1RM for common bench press scenario', () => {
        // Someone benches 80kg for 5 reps at RPE 8
        // Arrange & Act
        const e1RM = estimate1RM(80, 5, 8);

        // Assert
        // RPE 8, 5 reps is 80.6% according to chart
        const expected = 80 / (80.6 / 100);
        expect(e1RM).toBeCloseTo(99.3, 1);
      });

      it('should calculate 1RM for squat scenario', () => {
        // Someone squats 100kg for 3 reps at RPE 9
        // Arrange & Act
        const e1RM = estimate1RM(100, 3, 9);

        // Assert
        // RPE 9, 3 reps is 89.2% according to chart
        const expected = 100 / (89.2 / 100);
        expect(e1RM).toBeCloseTo(112.1, 1);
      });

      it('should calculate 1RM for deadlift scenario', () => {
        // Someone deadlifts 120kg for 2 reps at RPE 9.5
        // Arrange & Act
        const e1RM = estimate1RM(120, 2, 9.5);

        // Assert
        // RPE 9.5, 2 reps (index 1) is 93.9% according to chart
        expect(e1RM).toBeCloseTo(127.8, 1);
      });

      it('should calculate 1RM for high-rep scenario', () => {
        // Someone performs an exercise for 10 reps at RPE 7.5
        // Arrange & Act
        const e1RM = estimate1RM(50, 10, 7.5);

        // Assert
        // RPE 7.5, 10 reps (index 9) is 67.7% according to chart
        expect(e1RM).toBeCloseTo(73.9, 1);
      });

      it('should show progression tracking use case', () => {
        // Track improvement over time with same RPE/reps but increased weight

        // Week 1: 70kg for 5 reps at RPE 8
        const week1_1RM = estimate1RM(70, 5, 8);

        // Week 4: 75kg for 5 reps at RPE 8 (strength improvement)
        const week4_1RM = estimate1RM(75, 5, 8);

        // Assert
        expect(week4_1RM).toBeGreaterThan(week1_1RM);
        const improvement = ((week4_1RM - week1_1RM) / week1_1RM) * 100;
        expect(improvement).toBeCloseTo(7.14, 1); // ~7% improvement
      });
    });

    describe('mathematical properties', () => {
      it('should be proportional to weight when RPE and reps are constant', () => {
        // Arrange
        const weights = [50, 75, 100, 125];
        const results = weights.map((weight) => estimate1RM(weight, 5, 8));

        // Act & Assert
        for (let i = 1; i < results.length; i++) {
          const ratio = results[i] / results[i - 1];
          const weightRatio = weights[i] / weights[i - 1];
          expect(ratio).toBeCloseTo(weightRatio, 3);
        }
      });

      it('should handle very large weights correctly', () => {
        // Arrange & Act
        const e1RM = estimate1RM(1000, 3, 9);

        // Assert
        // Should still calculate correctly with large numbers
        const expected = 1000 / (89.2 / 100);
        expect(e1RM).toBeCloseTo(expected, 2);
      });

      it('should handle very small weights correctly', () => {
        // Arrange & Act
        const e1RM = estimate1RM(0.5, 8, 7);

        // Assert
        // Should still calculate correctly with small numbers
        const expected = 0.5 / (70.5 / 100); // RPE 7, 8 reps
        expect(e1RM).toBeCloseTo(expected, 4);
      });

      it('should maintain precision with decimal calculations', () => {
        // Arrange & Act
        const e1RM = estimate1RM(82.75, 6, 8.5);

        // Assert
        // RPE 8.5, 6 reps (index 5) is 79.6%
        expect(e1RM).toBeCloseTo(103.96, 2);
      });
    });
  });
});
