import { describe, expect, it } from 'vitest';

import type { RepRangeCategory } from '@/shared/types';

import {
  baechle,
  brzycki,
  calculateBMIClassic,
  calculateBMINew,
  classifyRepRange,
} from '../calculations';

describe('BMI Calculations', () => {
  describe('calculateBMIClassic', () => {
    it('should calculate correct BMI for normal values', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = 175;
      const expectedBMI = 70 / (1.75 * 1.75); // 22.86

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should handle edge case of very low weight', () => {
      // Arrange
      const weightKg = 1;
      const heightCm = 160;
      const expectedBMI = 1 / (1.6 * 1.6); // 0.39

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should handle edge case of very high weight', () => {
      // Arrange
      const weightKg = 300;
      const heightCm = 200;
      const expectedBMI = 300 / (2.0 * 2.0); // 75

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should return 0 when height is zero (division by zero protection)', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = 0;

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when height is negative', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = -10;

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle zero weight', () => {
      // Arrange
      const weightKg = 0;
      const heightCm = 175;
      const expectedBMI = 0;

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBe(expectedBMI);
    });

    it('should handle negative weight', () => {
      // Arrange
      const weightKg = -50;
      const heightCm = 175;
      const expectedBMI = -50 / (1.75 * 1.75);

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should handle decimal values correctly', () => {
      // Arrange
      const weightKg = 72.5;
      const heightCm = 178.2;
      const heightM = 178.2 / 100;
      const expectedBMI = 72.5 / (heightM * heightM);

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should handle very small height values', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = 0.1;
      const heightM = 0.1 / 100;
      const expectedBMI = 70 / (heightM * heightM);

      // Act
      const result = calculateBMIClassic(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });
  });

  describe('calculateBMINew', () => {
    it('should calculate correct BMI using new formula for normal values', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = 175;
      const heightM = 175 / 100;
      const expectedBMI = 1.3 * (70 / Math.pow(heightM, 2.5));

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should handle edge case of very low weight', () => {
      // Arrange
      const weightKg = 1;
      const heightCm = 160;
      const heightM = 160 / 100;
      const expectedBMI = 1.3 * (1 / Math.pow(heightM, 2.5));

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should handle edge case of very high weight', () => {
      // Arrange
      const weightKg = 300;
      const heightCm = 200;
      const heightM = 200 / 100;
      const expectedBMI = 1.3 * (300 / Math.pow(heightM, 2.5));

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should return 0 when height is zero (division by zero protection)', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = 0;

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when height is negative', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = -10;

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle zero weight', () => {
      // Arrange
      const weightKg = 0;
      const heightCm = 175;
      const expectedBMI = 0;

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBe(expectedBMI);
    });

    it('should handle negative weight', () => {
      // Arrange
      const weightKg = -50;
      const heightCm = 175;
      const heightM = 175 / 100;
      const expectedBMI = 1.3 * (-50 / Math.pow(heightM, 2.5));

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should handle decimal values correctly', () => {
      // Arrange
      const weightKg = 72.5;
      const heightCm = 178.2;
      const heightM = 178.2 / 100;
      const expectedBMI = 1.3 * (72.5 / Math.pow(heightM, 2.5));

      // Act
      const result = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(result).toBeCloseTo(expectedBMI, 2);
    });

    it('should produce different results from classic BMI', () => {
      // Arrange
      const weightKg = 70;
      const heightCm = 175;

      // Act
      const classicBMI = calculateBMIClassic(weightKg, heightCm);
      const newBMI = calculateBMINew(weightKg, heightCm);

      // Assert
      expect(newBMI).not.toBe(classicBMI);
    });
  });
});

describe('1RM Formulas', () => {
  describe('brzycki', () => {
    it('should calculate correct 1RM for typical rep ranges', () => {
      // Arrange
      const weight = 100;
      const reps = 5;
      const expectedOneRM = 100 / (1.0278 - 0.0278 * 5); // ≈ 115.89

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle 1 rep (return the same weight)', () => {
      // Arrange
      const weight = 100;
      const reps = 1;
      const expectedOneRM = 100 / (1.0278 - 0.0278 * 1); // ≈ 100

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle high rep ranges', () => {
      // Arrange
      const weight = 50;
      const reps = 20;
      const expectedOneRM = 50 / (1.0278 - 0.0278 * 20);

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should return 0 when reps is zero (non-positive reps protection)', () => {
      // Arrange
      const weight = 100;
      const reps = 0;

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when reps is negative', () => {
      // Arrange
      const weight = 100;
      const reps = -5;

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle zero weight', () => {
      // Arrange
      const weight = 0;
      const reps = 5;
      const expectedOneRM = 0;

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBe(expectedOneRM);
    });

    it('should handle negative weight', () => {
      // Arrange
      const weight = -100;
      const reps = 5;
      const expectedOneRM = -100 / (1.0278 - 0.0278 * 5);

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle decimal weight and reps', () => {
      // Arrange
      const weight = 87.5;
      const reps = 3.5;
      const expectedOneRM = 87.5 / (1.0278 - 0.0278 * 3.5);

      // Act
      const result = brzycki(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle boundary condition near formula breakdown', () => {
      // Arrange
      // The formula breaks down when 1.0278 - 0.0278 * reps approaches 0
      // This happens around reps ≈ 37
      const weight = 100;
      const reps = 35; // Close to but not at breakdown

      // Act & Assert
      expect(() => brzycki(weight, reps)).not.toThrow();
      const result = brzycki(weight, reps);
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  describe('baechle', () => {
    it('should calculate correct 1RM for typical rep ranges', () => {
      // Arrange
      const weight = 100;
      const reps = 5;
      const expectedOneRM = 100 * (1 + 0.0333 * 5); // ≈ 116.65

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle 1 rep (return the same weight)', () => {
      // Arrange
      const weight = 100;
      const reps = 1;
      const expectedOneRM = 100 * (1 + 0.0333 * 1); // ≈ 103.33

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle high rep ranges', () => {
      // Arrange
      const weight = 50;
      const reps = 20;
      const expectedOneRM = 50 * (1 + 0.0333 * 20); // ≈ 83.3

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should return 0 when reps is zero (non-positive reps protection)', () => {
      // Arrange
      const weight = 100;
      const reps = 0;

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when reps is negative', () => {
      // Arrange
      const weight = 100;
      const reps = -5;

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle zero weight', () => {
      // Arrange
      const weight = 0;
      const reps = 5;
      const expectedOneRM = 0;

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBe(expectedOneRM);
    });

    it('should handle negative weight', () => {
      // Arrange
      const weight = -100;
      const reps = 5;
      const expectedOneRM = -100 * (1 + 0.0333 * 5);

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle decimal weight and reps', () => {
      // Arrange
      const weight = 87.5;
      const reps = 3.5;
      const expectedOneRM = 87.5 * (1 + 0.0333 * 3.5);

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
    });

    it('should handle very high rep counts', () => {
      // Arrange
      const weight = 50;
      const reps = 100;
      const expectedOneRM = 50 * (1 + 0.0333 * 100); // ≈ 216.5

      // Act
      const result = baechle(weight, reps);

      // Assert
      expect(result).toBeCloseTo(expectedOneRM, 2);
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  describe('brzycki vs baechle comparison', () => {
    it('should produce different results for the same inputs', () => {
      // Arrange
      const weight = 100;
      const reps = 5;

      // Act
      const brzyckiResult = brzycki(weight, reps);
      const baechleResult = baechle(weight, reps);

      // Assert
      expect(brzyckiResult).not.toBe(baechleResult);
    });

    it('should both handle edge cases consistently', () => {
      // Arrange
      const weight = 100;
      const reps = 0;

      // Act
      const brzyckiResult = brzycki(weight, reps);
      const baechleResult = baechle(weight, reps);

      // Assert
      expect(brzyckiResult).toBe(0);
      expect(baechleResult).toBe(0);
    });
  });
});

describe('Rep Range Classification', () => {
  describe('classifyRepRange', () => {
    it('should classify low reps as strength', () => {
      // Arrange & Act & Assert
      expect(classifyRepRange(1)).toBe('strength');
      expect(classifyRepRange(3)).toBe('strength');
      expect(classifyRepRange(5)).toBe('strength');
    });

    it('should classify boundary rep count at strength threshold', () => {
      // Arrange & Act & Assert
      expect(classifyRepRange(5)).toBe('strength');
      expect(classifyRepRange(6)).toBe('hypertrophy');
    });

    it('should classify medium reps as hypertrophy', () => {
      // Arrange & Act & Assert
      expect(classifyRepRange(6)).toBe('hypertrophy');
      expect(classifyRepRange(10)).toBe('hypertrophy');
      expect(classifyRepRange(12)).toBe('hypertrophy');
      expect(classifyRepRange(15)).toBe('hypertrophy');
    });

    it('should classify boundary rep count at hypertrophy threshold', () => {
      // Arrange & Act & Assert
      expect(classifyRepRange(15)).toBe('hypertrophy');
      expect(classifyRepRange(16)).toBe('endurance');
    });

    it('should classify high reps as endurance', () => {
      // Arrange & Act & Assert
      expect(classifyRepRange(16)).toBe('endurance');
      expect(classifyRepRange(20)).toBe('endurance');
      expect(classifyRepRange(50)).toBe('endurance');
    });

    it('should handle zero reps as strength', () => {
      // Arrange & Act
      const result = classifyRepRange(0);

      // Assert
      expect(result).toBe('strength');
    });

    it('should handle negative reps as strength', () => {
      // Arrange & Act
      const result = classifyRepRange(-5);

      // Assert
      expect(result).toBe('strength');
    });

    it('should handle decimal reps correctly', () => {
      // Arrange & Act & Assert
      expect(classifyRepRange(4.9)).toBe('strength');
      expect(classifyRepRange(5.1)).toBe('hypertrophy');
      expect(classifyRepRange(14.9)).toBe('hypertrophy');
      expect(classifyRepRange(15.1)).toBe('endurance');
    });

    it('should handle very large rep counts as endurance', () => {
      // Arrange & Act
      const result = classifyRepRange(1000);

      // Assert
      expect(result).toBe('endurance');
    });

    it('should return correct type', () => {
      // Arrange
      const repCounts = [1, 5, 6, 15, 16, 20];
      const expectedTypes: RepRangeCategory[] = [
        'strength',
        'strength',
        'hypertrophy',
        'hypertrophy',
        'endurance',
        'endurance',
      ];

      // Act & Assert
      repCounts.forEach((reps, index) => {
        const result = classifyRepRange(reps);
        expect(result).toBe(expectedTypes[index]);

        // Type assertion to ensure correct typing
        const validCategories: RepRangeCategory[] = ['strength', 'hypertrophy', 'endurance'];
        expect(validCategories).toContain(result);
      });
    });
  });
});
