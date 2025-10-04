import { describe, expect, it } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';

import { Counter, MinutesCounter, RepsCounter, SecondsCounter } from '../Counter';

describe('Counter Base Class', () => {
  describe('RepsCounter', () => {
    it('should create a RepsCounter with valid value', () => {
      // Arrange & Act
      const counter = new RepsCounter(10);

      // Assert
      expect(counter.value).toBe(10);
      expect(counter.type).toBe('reps');
    });

    it('should create a RepsCounter with zero value', () => {
      // Arrange & Act
      const counter = new RepsCounter(0);

      // Assert
      expect(counter.value).toBe(0);
      expect(counter.type).toBe('reps');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative', () => {
      // Arrange & Act & Assert
      expect(() => new RepsCounter(-1)).toThrow(BusinessRuleError);
      expect(() => new RepsCounter(-1)).toThrow('errors.domain.counter.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is not an integer', () => {
      // Arrange & Act & Assert
      expect(() => new RepsCounter(5.5)).toThrow(BusinessRuleError);
      expect(() => new RepsCounter(5.5)).toThrow('errors.domain.counter.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is NaN', () => {
      // Arrange & Act & Assert
      expect(() => new RepsCounter(NaN)).toThrow(BusinessRuleError);
      expect(() => new RepsCounter(NaN)).toThrow('errors.domain.counter.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is Infinity', () => {
      // Arrange & Act & Assert
      expect(() => new RepsCounter(Infinity)).toThrow(BusinessRuleError);
      expect(() => new RepsCounter(Infinity)).toThrow('errors.domain.counter.invalid');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const counter = new RepsCounter(15);

      // Assert
      expect(Object.isFrozen(counter)).toBe(true);
    });
  });

  describe('SecondsCounter', () => {
    it('should create a SecondsCounter with valid value', () => {
      // Arrange & Act
      const counter = new SecondsCounter(45);

      // Assert
      expect(counter.value).toBe(45);
      expect(counter.type).toBe('secs');
    });

    it('should create a SecondsCounter with zero value', () => {
      // Arrange & Act
      const counter = new SecondsCounter(0);

      // Assert
      expect(counter.value).toBe(0);
      expect(counter.type).toBe('secs');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative', () => {
      // Arrange & Act & Assert
      expect(() => new SecondsCounter(-5)).toThrow(BusinessRuleError);
      expect(() => new SecondsCounter(-5)).toThrow('errors.domain.counter.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is not an integer', () => {
      // Arrange & Act & Assert
      expect(() => new SecondsCounter(30.7)).toThrow(BusinessRuleError);
      expect(() => new SecondsCounter(30.7)).toThrow('errors.domain.counter.invalid');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const counter = new SecondsCounter(120);

      // Assert
      expect(Object.isFrozen(counter)).toBe(true);
    });
  });

  describe('MinutesCounter', () => {
    it('should create a MinutesCounter with valid value', () => {
      // Arrange & Act
      const counter = new MinutesCounter(5);

      // Assert
      expect(counter.value).toBe(5);
      expect(counter.type).toBe('mins');
    });

    it('should create a MinutesCounter with zero value', () => {
      // Arrange & Act
      const counter = new MinutesCounter(0);

      // Assert
      expect(counter.value).toBe(0);
      expect(counter.type).toBe('mins');
    });

    it('should throw BusinessRuleError with correct i18n key when value is negative', () => {
      // Arrange & Act & Assert
      expect(() => new MinutesCounter(-2)).toThrow(BusinessRuleError);
      expect(() => new MinutesCounter(-2)).toThrow('errors.domain.counter.invalid');
    });

    it('should throw BusinessRuleError with correct i18n key when value is not an integer', () => {
      // Arrange & Act & Assert
      expect(() => new MinutesCounter(3.14)).toThrow(BusinessRuleError);
      expect(() => new MinutesCounter(3.14)).toThrow('errors.domain.counter.invalid');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const counter = new MinutesCounter(8);

      // Assert
      expect(Object.isFrozen(counter)).toBe(true);
    });
  });

  describe('Counter.create factory method', () => {
    it('should create RepsCounter when type is "reps"', () => {
      // Arrange & Act
      const counter = Counter.create(12, 'reps');

      // Assert
      expect(counter).toBeInstanceOf(RepsCounter);
      expect(counter.value).toBe(12);
      expect(counter.type).toBe('reps');
    });

    it('should create SecondsCounter when type is "secs"', () => {
      // Arrange & Act
      const counter = Counter.create(60, 'secs');

      // Assert
      expect(counter).toBeInstanceOf(SecondsCounter);
      expect(counter.value).toBe(60);
      expect(counter.type).toBe('secs');
    });

    it('should create MinutesCounter when type is "mins"', () => {
      // Arrange & Act
      const counter = Counter.create(10, 'mins');

      // Assert
      expect(counter).toBeInstanceOf(MinutesCounter);
      expect(counter.value).toBe(10);
      expect(counter.type).toBe('mins');
    });

    it('should throw BusinessRuleError with correct i18n key when type is invalid', () => {
      // Arrange & Act & Assert
      expect(() => Counter.create(5, 'invalid' as any)).toThrow(BusinessRuleError);
      expect(() => Counter.create(5, 'invalid' as any)).toThrow('errors.domain.counter.invalid');
    });

    it('should enforce validation rules through factory method', () => {
      // Arrange & Act & Assert
      expect(() => Counter.create(-1, 'reps')).toThrow(BusinessRuleError);
      expect(() => Counter.create(5.5, 'secs')).toThrow(BusinessRuleError);
      expect(() => Counter.create(NaN, 'mins')).toThrow(BusinessRuleError);
    });

    it('should create valid counters with edge case values', () => {
      // Arrange & Act
      const repsCounter = Counter.create(0, 'reps');
      const secsCounter = Counter.create(0, 'secs');
      const minsCounter = Counter.create(0, 'mins');

      // Assert
      expect(repsCounter.value).toBe(0);
      expect(secsCounter.value).toBe(0);
      expect(minsCounter.value).toBe(0);
    });

    it('should create counters with large valid values', () => {
      // Arrange & Act
      const repsCounter = Counter.create(1000, 'reps');
      const secsCounter = Counter.create(3600, 'secs');
      const minsCounter = Counter.create(180, 'mins');

      // Assert
      expect(repsCounter.value).toBe(1000);
      expect(secsCounter.value).toBe(3600);
      expect(minsCounter.value).toBe(180);
    });
  });
});
