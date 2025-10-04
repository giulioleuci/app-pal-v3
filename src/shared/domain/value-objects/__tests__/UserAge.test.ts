import { describe, expect, it } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';

import { UserAge } from '../UserAge';

describe('UserAge', () => {
  describe('constructor', () => {
    it('should create UserAge with zero value (newborn)', () => {
      // Arrange & Act
      const userAge = new UserAge(0);

      // Assert
      expect(userAge.value).toBe(0);
    });

    it('should create UserAge with positive integer value', () => {
      // Arrange & Act
      const userAge = new UserAge(25);

      // Assert
      expect(userAge.value).toBe(25);
    });

    it('should create UserAge with typical adult age', () => {
      // Arrange & Act
      const userAge = new UserAge(42);

      // Assert
      expect(userAge.value).toBe(42);
    });

    it('should create UserAge with elderly age', () => {
      // Arrange & Act
      const userAge = new UserAge(85);

      // Assert
      expect(userAge.value).toBe(85);
    });

    it('should create UserAge with very high age', () => {
      // Arrange & Act
      const userAge = new UserAge(120);

      // Assert
      expect(userAge.value).toBe(120);
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(-1)).toThrow(BusinessRuleError);
      expect(() => new UserAge(-1)).toThrow('errors.domain.age.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative large number', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(-100)).toThrow(BusinessRuleError);
      expect(() => new UserAge(-100)).toThrow('errors.domain.age.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is not an integer', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(25.5)).toThrow(BusinessRuleError);
      expect(() => new UserAge(25.5)).toThrow('errors.domain.age.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is decimal close to integer', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(30.1)).toThrow(BusinessRuleError);
      expect(() => new UserAge(30.1)).toThrow('errors.domain.age.invalid');

      expect(() => new UserAge(30.9)).toThrow(BusinessRuleError);
      expect(() => new UserAge(30.9)).toThrow('errors.domain.age.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is NaN', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(NaN)).toThrow(BusinessRuleError);
      expect(() => new UserAge(NaN)).toThrow('errors.domain.age.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is Infinity', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(Infinity)).toThrow(BusinessRuleError);
      expect(() => new UserAge(Infinity)).toThrow('errors.domain.age.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative Infinity', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(-Infinity)).toThrow(BusinessRuleError);
      expect(() => new UserAge(-Infinity)).toThrow('errors.domain.age.invalid');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const userAge = new UserAge(35);

      // Assert
      expect(Object.isFrozen(userAge)).toBe(true);
    });

    it('should be immutable', () => {
      // Arrange
      const userAge = new UserAge(28);

      // Act & Assert - frozen object throws when trying to modify in strict mode
      expect(() => {
        (userAge as any).value = 35;
      }).toThrow();
      expect(userAge.value).toBe(28); // Value should remain unchanged
    });
  });

  describe('boundary values', () => {
    it('should accept zero as minimum valid age', () => {
      // Arrange & Act
      const userAge = new UserAge(0);

      // Assert
      expect(userAge.value).toBe(0);
    });

    it('should reject negative ages', () => {
      // Arrange & Act & Assert
      expect(() => new UserAge(-1)).toThrow(BusinessRuleError);
      expect(() => new UserAge(-0.1)).toThrow(BusinessRuleError);
    });

    it('should accept large but realistic ages', () => {
      // The oldest verified human lived to 122 years
      const veryOldAge = 122;

      // Arrange & Act
      const userAge = new UserAge(veryOldAge);

      // Assert
      expect(userAge.value).toBe(veryOldAge);
    });

    it('should accept unrealistically high ages (no upper limit enforced)', () => {
      // The class doesn't enforce an upper limit, only validates non-negative integers
      const unrealisticAge = 500;

      // Arrange & Act
      const userAge = new UserAge(unrealisticAge);

      // Assert
      expect(userAge.value).toBe(unrealisticAge);
    });
  });

  describe('integer validation', () => {
    it('should accept various valid integer ages', () => {
      const validAges = [0, 1, 5, 10, 16, 18, 21, 25, 30, 40, 50, 65, 75, 90, 100];

      validAges.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });

    it('should reject various non-integer values', () => {
      const invalidAges = [0.5, 1.1, 25.99, 30.01, 65.5, 99.9];

      invalidAges.forEach((age) => {
        // Arrange & Act & Assert
        expect(() => new UserAge(age)).toThrow(BusinessRuleError);
        expect(() => new UserAge(age)).toThrow('errors.domain.age.invalid');
      });
    });

    it('should handle floating point numbers that are effectively integers', () => {
      // These are effectively integers but represented as floats
      const effectiveIntegers = [25.0, 30.0, 65.0];

      effectiveIntegers.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });

    it('should reject floating point results from mathematical operations', () => {
      // Common floating point arithmetic that doesn't result in integers
      const floatResults = [
        0.1 + 0.2, // Often equals 0.30000000000000004
        10 / 3, // 3.3333...
        Math.sqrt(2), // 1.414...
      ];

      floatResults.forEach((age) => {
        // Arrange & Act & Assert
        expect(() => new UserAge(age)).toThrow(BusinessRuleError);
        expect(() => new UserAge(age)).toThrow('errors.domain.age.invalid');
      });
    });
  });

  describe('realistic use cases', () => {
    it('should handle infant and toddler ages', () => {
      const earlyAges = [0, 1, 2, 3, 4];

      earlyAges.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });

    it('should handle childhood ages', () => {
      const childAges = [5, 6, 7, 8, 9, 10, 11, 12];

      childAges.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });

    it('should handle teenage ages', () => {
      const teenAges = [13, 14, 15, 16, 17, 18, 19];

      teenAges.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });

    it('should handle adult ages', () => {
      const adultAges = [20, 25, 30, 35, 40, 45, 50, 55, 60];

      adultAges.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });

    it('should handle senior ages', () => {
      const seniorAges = [65, 70, 75, 80, 85, 90, 95, 100];

      seniorAges.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });

    it('should handle ages for fitness app context', () => {
      // Most fitness app users are likely in these age ranges
      const fitnessAppAges = [16, 18, 22, 25, 28, 32, 35, 40, 45, 50, 55, 60, 65, 70];

      fitnessAppAges.forEach((age) => {
        // Arrange & Act
        const userAge = new UserAge(age);

        // Assert
        expect(userAge.value).toBe(age);
      });
    });
  });

  describe('error message consistency', () => {
    it('should throw same error for all invalid cases', () => {
      const invalidCases = [-1, -10, 25.5, 30.1, NaN, Infinity, -Infinity];

      invalidCases.forEach((invalidAge) => {
        // Arrange & Act & Assert
        expect(() => new UserAge(invalidAge)).toThrow(BusinessRuleError);
        expect(() => new UserAge(invalidAge)).toThrow('errors.domain.age.invalid');
      });
    });
  });
});
