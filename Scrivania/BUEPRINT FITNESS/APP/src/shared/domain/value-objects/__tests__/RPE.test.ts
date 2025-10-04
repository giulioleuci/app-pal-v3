import { describe, expect, it } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';

import { RPE } from '../RPE';

describe('RPE', () => {
  describe('constructor', () => {
    it('should create RPE with minimum valid value', () => {
      // Arrange & Act
      const rpe = new RPE(1);

      // Assert
      expect(rpe.value).toBe(1);
    });

    it('should create RPE with maximum valid value', () => {
      // Arrange & Act
      const rpe = new RPE(10);

      // Assert
      expect(rpe.value).toBe(10);
    });

    it('should create RPE with intermediate valid value', () => {
      // Arrange & Act
      const rpe = new RPE(7.5);

      // Assert
      expect(rpe.value).toBe(7.5);
    });

    it('should create RPE with decimal valid values', () => {
      // Arrange & Act
      const rpe1 = new RPE(6.5);
      const rpe2 = new RPE(8.5);
      const rpe3 = new RPE(9.5);

      // Assert
      expect(rpe1.value).toBe(6.5);
      expect(rpe2.value).toBe(8.5);
      expect(rpe3.value).toBe(9.5);
    });

    it('should create RPE with all common valid integer values', () => {
      // Arrange & Act
      for (let i = 1; i <= 10; i++) {
        const rpe = new RPE(i);

        // Assert
        expect(rpe.value).toBe(i);
      }
    });

    it('should throw BusinessRuleError with correct i18n key when value is below minimum', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(0)).toThrow(BusinessRuleError);
      expect(() => new RPE(0)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(-1)).toThrow(BusinessRuleError);
      expect(() => new RPE(-1)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is above maximum', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(11)).toThrow(BusinessRuleError);
      expect(() => new RPE(11)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is way above maximum', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(100)).toThrow(BusinessRuleError);
      expect(() => new RPE(100)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is 0.9', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(0.9)).toThrow(BusinessRuleError);
      expect(() => new RPE(0.9)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is 10.1', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(10.1)).toThrow(BusinessRuleError);
      expect(() => new RPE(10.1)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should create RPE with NaN value (validation limitation)', () => {
      // Note: NaN comparisons always return false, so NaN passes current validation
      // This is a known limitation of the current implementation
      // Arrange & Act
      const rpe = new RPE(NaN);

      // Assert
      expect(rpe.value).toBeNaN();
    });

    it('should throw BusinessRuleError with correct i18n key when value is Infinity', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(Infinity)).toThrow(BusinessRuleError);
      expect(() => new RPE(Infinity)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative Infinity', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(-Infinity)).toThrow(BusinessRuleError);
      expect(() => new RPE(-Infinity)).toThrow('errors.domain.rpe.invalidRange');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const rpe = new RPE(8);

      // Assert
      expect(Object.isFrozen(rpe)).toBe(true);
    });

    it('should be immutable', () => {
      // Arrange
      const rpe = new RPE(6);

      // Act & Assert - frozen object throws when trying to modify in strict mode
      expect(() => {
        (rpe as any).value = 9;
      }).toThrow();
      expect(rpe.value).toBe(6); // Value should remain unchanged
    });
  });

  describe('boundary values', () => {
    it('should accept exact boundary values', () => {
      // Arrange & Act
      const minRpe = new RPE(1);
      const maxRpe = new RPE(10);

      // Assert
      expect(minRpe.value).toBe(1);
      expect(maxRpe.value).toBe(10);
    });

    it('should reject values just outside boundaries', () => {
      // Arrange & Act & Assert
      expect(() => new RPE(0.99999)).toThrow(BusinessRuleError);
      expect(() => new RPE(10.00001)).toThrow(BusinessRuleError);
    });

    it('should accept common RPE scale values', () => {
      // Common RPE values used in training
      const commonValues = [
        1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
      ];

      // Arrange & Act & Assert
      commonValues.forEach((value) => {
        const rpe = new RPE(value);
        expect(rpe.value).toBe(value);
      });
    });
  });
});
