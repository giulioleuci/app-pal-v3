import { describe, expect, it } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';

import { Percentage } from '../Percentage';

describe('Percentage', () => {
  describe('constructor', () => {
    it('should create Percentage with minimum valid value', () => {
      // Arrange & Act
      const percentage = new Percentage(0);

      // Assert
      expect(percentage.value).toBe(0);
    });

    it('should create Percentage with maximum valid value', () => {
      // Arrange & Act
      const percentage = new Percentage(100);

      // Assert
      expect(percentage.value).toBe(100);
    });

    it('should create Percentage with intermediate valid value', () => {
      // Arrange & Act
      const percentage = new Percentage(50);

      // Assert
      expect(percentage.value).toBe(50);
    });

    it('should create Percentage with decimal valid values', () => {
      // Arrange & Act
      const percentage1 = new Percentage(25.5);
      const percentage2 = new Percentage(75.25);
      const percentage3 = new Percentage(99.9);

      // Assert
      expect(percentage1.value).toBe(25.5);
      expect(percentage2.value).toBe(75.25);
      expect(percentage3.value).toBe(99.9);
    });

    it('should create Percentage with common percentage values', () => {
      // Common percentage values
      const commonValues = [
        0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
      ];

      commonValues.forEach((value) => {
        // Arrange & Act
        const percentage = new Percentage(value);

        // Assert
        expect(percentage.value).toBe(value);
      });
    });

    it('should create Percentage with precise decimal values', () => {
      // Arrange & Act
      const percentage1 = new Percentage(33.33);
      const percentage2 = new Percentage(66.67);
      const percentage3 = new Percentage(12.345);

      // Assert
      expect(percentage1.value).toBe(33.33);
      expect(percentage2.value).toBe(66.67);
      expect(percentage3.value).toBe(12.345);
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(-1)).toThrow(BusinessRuleError);
      expect(() => new Percentage(-1)).toThrow('errors.domain.percentage.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is below zero', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(-0.1)).toThrow(BusinessRuleError);
      expect(() => new Percentage(-0.1)).toThrow('errors.domain.percentage.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is above maximum', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(101)).toThrow(BusinessRuleError);
      expect(() => new Percentage(101)).toThrow('errors.domain.percentage.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is above 100', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(100.1)).toThrow(BusinessRuleError);
      expect(() => new Percentage(100.1)).toThrow('errors.domain.percentage.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is way above maximum', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(500)).toThrow(BusinessRuleError);
      expect(() => new Percentage(500)).toThrow('errors.domain.percentage.invalidRange');
    });

    it('should create Percentage with NaN value (validation limitation)', () => {
      // Note: NaN comparisons always return false, so NaN passes current validation
      // This is a known limitation of the current implementation
      // Arrange & Act
      const percentage = new Percentage(NaN);

      // Assert
      expect(percentage.value).toBeNaN();
    });

    it('should throw BusinessRuleError with correct i18n key when value is Infinity', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(Infinity)).toThrow(BusinessRuleError);
      expect(() => new Percentage(Infinity)).toThrow('errors.domain.percentage.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative Infinity', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(-Infinity)).toThrow(BusinessRuleError);
      expect(() => new Percentage(-Infinity)).toThrow('errors.domain.percentage.invalidRange');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const percentage = new Percentage(75);

      // Assert
      expect(Object.isFrozen(percentage)).toBe(true);
    });

    it('should be immutable', () => {
      // Arrange
      const percentage = new Percentage(50);

      // Act & Assert - frozen object throws when trying to modify in strict mode
      expect(() => {
        (percentage as any).value = 80;
      }).toThrow();
      expect(percentage.value).toBe(50); // Value should remain unchanged
    });
  });

  describe('boundary values', () => {
    it('should accept exact boundary values', () => {
      // Arrange & Act
      const minPercentage = new Percentage(0);
      const maxPercentage = new Percentage(100);

      // Assert
      expect(minPercentage.value).toBe(0);
      expect(maxPercentage.value).toBe(100);
    });

    it('should reject values just outside boundaries', () => {
      // Arrange & Act & Assert
      expect(() => new Percentage(-0.00001)).toThrow(BusinessRuleError);
      expect(() => new Percentage(100.00001)).toThrow(BusinessRuleError);
    });

    it('should accept values very close to boundaries', () => {
      // Arrange & Act
      const nearZero = new Percentage(0.00001);
      const nearHundred = new Percentage(99.99999);

      // Assert
      expect(nearZero.value).toBe(0.00001);
      expect(nearHundred.value).toBe(99.99999);
    });
  });

  describe('realistic use cases', () => {
    it('should handle workout intensity percentages', () => {
      // Common workout intensities as percentages of 1RM
      const intensities = [50, 60, 65, 70, 75, 80, 85, 90, 95, 100];

      intensities.forEach((intensity) => {
        // Arrange & Act
        const percentage = new Percentage(intensity);

        // Assert
        expect(percentage.value).toBe(intensity);
      });
    });

    it('should handle body fat percentages', () => {
      // Realistic body fat percentage ranges
      const bodyFatValues = [8.5, 12.0, 15.5, 18.2, 22.1, 25.7, 30.0];

      bodyFatValues.forEach((bodyFat) => {
        // Arrange & Act
        const percentage = new Percentage(bodyFat);

        // Assert
        expect(percentage.value).toBe(bodyFat);
      });
    });

    it('should handle completion percentages', () => {
      // Progress tracking percentages
      const completionValues = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

      completionValues.forEach((completion) => {
        // Arrange & Act
        const percentage = new Percentage(completion);

        // Assert
        expect(percentage.value).toBe(completion);
      });
    });

    it('should handle very precise measurements', () => {
      // High-precision percentage values
      const preciseValues = [0.001, 33.333, 66.666, 99.999];

      preciseValues.forEach((precise) => {
        // Arrange & Act
        const percentage = new Percentage(precise);

        // Assert
        expect(percentage.value).toBe(precise);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle floating point precision issues', () => {
      // Arrange & Act
      const percentage1 = new Percentage(0.1 + 0.2); // Often equals 0.30000000000000004
      const percentage2 = new Percentage(99.9999999999);

      // Assert
      expect(percentage1.value).toBeCloseTo(0.3);
      expect(percentage2.value).toBeCloseTo(99.9999999999);
    });

    it('should handle repeated decimal operations', () => {
      // Arrange & Act
      const baseValue = 33.333333;
      const percentage = new Percentage(baseValue);

      // Assert
      expect(percentage.value).toBe(baseValue);
    });

    it('should maintain precision with very small values', () => {
      // Arrange & Act
      const verySmall = 0.000001;
      const percentage = new Percentage(verySmall);

      // Assert
      expect(percentage.value).toBe(verySmall);
    });

    it('should maintain precision with values very close to 100', () => {
      // Arrange & Act
      const nearMax = 99.999999;
      const percentage = new Percentage(nearMax);

      // Assert
      expect(percentage.value).toBe(nearMax);
    });
  });
});
