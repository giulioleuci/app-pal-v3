import { describe, expect, it } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';

import { Weight } from '../Weight';

describe('Weight', () => {
  describe('constructor', () => {
    it('should create a Weight with valid kg value', () => {
      // Arrange & Act
      const weight = new Weight(100, 'kg');

      // Assert
      expect(weight.value).toBe(100);
      expect(weight.unit).toBe('kg');
    });

    it('should create a Weight with valid lbs value', () => {
      // Arrange & Act
      const weight = new Weight(220, 'lbs');

      // Assert
      expect(weight.value).toBe(220);
      expect(weight.unit).toBe('lbs');
    });

    it('should create a Weight with zero value', () => {
      // Arrange & Act
      const weight = new Weight(0, 'kg');

      // Assert
      expect(weight.value).toBe(0);
      expect(weight.unit).toBe('kg');
    });

    it('should create a Weight with decimal value', () => {
      // Arrange & Act
      const weight = new Weight(52.5, 'kg');

      // Assert
      expect(weight.value).toBe(52.5);
      expect(weight.unit).toBe('kg');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative', () => {
      // Arrange & Act & Assert
      expect(() => new Weight(-10, 'kg')).toThrow(BusinessRuleError);
      expect(() => new Weight(-10, 'kg')).toThrow('errors.domain.weight.negative');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative decimal', () => {
      // Arrange & Act & Assert
      expect(() => new Weight(-0.5, 'lbs')).toThrow(BusinessRuleError);
      expect(() => new Weight(-0.5, 'lbs')).toThrow('errors.domain.weight.negative');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const weight = new Weight(75, 'kg');

      // Assert
      expect(Object.isFrozen(weight)).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true when comparing identical weights', () => {
      // Arrange
      const weight1 = new Weight(100, 'kg');
      const weight2 = new Weight(100, 'kg');

      // Act & Assert
      expect(weight1.equals(weight2)).toBe(true);
    });

    it('should return false when comparing weights with different values', () => {
      // Arrange
      const weight1 = new Weight(100, 'kg');
      const weight2 = new Weight(150, 'kg');

      // Act & Assert
      expect(weight1.equals(weight2)).toBe(false);
    });

    it('should return false when comparing weights with different units', () => {
      // Arrange
      const weight1 = new Weight(100, 'kg');
      const weight2 = new Weight(100, 'lbs');

      // Act & Assert
      expect(weight1.equals(weight2)).toBe(false);
    });

    it('should return false when comparing weights with different values and units', () => {
      // Arrange
      const weight1 = new Weight(100, 'kg');
      const weight2 = new Weight(220, 'lbs');

      // Act & Assert
      expect(weight1.equals(weight2)).toBe(false);
    });

    it('should return true when comparing zero weights with same unit', () => {
      // Arrange
      const weight1 = new Weight(0, 'kg');
      const weight2 = new Weight(0, 'kg');

      // Act & Assert
      expect(weight1.equals(weight2)).toBe(true);
    });

    it('should return true when comparing decimal weights', () => {
      // Arrange
      const weight1 = new Weight(72.5, 'kg');
      const weight2 = new Weight(72.5, 'kg');

      // Act & Assert
      expect(weight1.equals(weight2)).toBe(true);
    });
  });

  describe('toPlainObject', () => {
    it('should return plain object with kg unit', () => {
      // Arrange
      const weight = new Weight(85, 'kg');

      // Act
      const result = weight.toPlainObject();

      // Assert
      expect(result).toEqual({ value: 85, unit: 'kg' });
    });

    it('should return plain object with lbs unit', () => {
      // Arrange
      const weight = new Weight(187.4, 'lbs');

      // Act
      const result = weight.toPlainObject();

      // Assert
      expect(result).toEqual({ value: 187.4, unit: 'lbs' });
    });

    it('should return plain object with zero value', () => {
      // Arrange
      const weight = new Weight(0, 'kg');

      // Act
      const result = weight.toPlainObject();

      // Assert
      expect(result).toEqual({ value: 0, unit: 'kg' });
    });

    it('should return plain object that is not the same reference as the Weight instance', () => {
      // Arrange
      const weight = new Weight(100, 'kg');

      // Act
      const result = weight.toPlainObject();

      // Assert
      expect(result).not.toBe(weight);
    });
  });
});
