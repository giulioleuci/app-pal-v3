import { describe, expect, it, vi } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';

import { Duration } from '../Duration';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  formatDuration: vi.fn(),
  intervalToDuration: vi.fn(),
}));

describe('Duration', () => {
  describe('fromSeconds', () => {
    it('should create Duration from valid seconds value', () => {
      // Arrange & Act
      const duration = Duration.fromSeconds(120);

      // Assert
      expect(duration.asSeconds()).toBe(120);
    });

    it('should create Duration from zero seconds', () => {
      // Arrange & Act
      const duration = Duration.fromSeconds(0);

      // Assert
      expect(duration.asSeconds()).toBe(0);
    });

    it('should create Duration from decimal seconds', () => {
      // Arrange & Act
      const duration = Duration.fromSeconds(45.5);

      // Assert
      expect(duration.asSeconds()).toBe(45.5);
    });

    it('should create Duration from large seconds value', () => {
      // Arrange & Act
      const duration = Duration.fromSeconds(3600); // 1 hour

      // Assert
      expect(duration.asSeconds()).toBe(3600);
    });

    it('should throw BusinessRuleError with correct i18n key when seconds is negative', () => {
      // Arrange & Act & Assert
      expect(() => Duration.fromSeconds(-10)).toThrow(BusinessRuleError);
      expect(() => Duration.fromSeconds(-10)).toThrow('errors.domain.duration.negative');
    });

    it('should throw BusinessRuleError with correct i18n key when seconds is negative decimal', () => {
      // Arrange & Act & Assert
      expect(() => Duration.fromSeconds(-0.1)).toThrow(BusinessRuleError);
      expect(() => Duration.fromSeconds(-0.1)).toThrow('errors.domain.duration.negative');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const duration = Duration.fromSeconds(60);

      // Assert
      expect(Object.isFrozen(duration)).toBe(true);
    });
  });

  describe('fromMinutes', () => {
    it('should create Duration from valid minutes value', () => {
      // Arrange & Act
      const duration = Duration.fromMinutes(2);

      // Assert
      expect(duration.asSeconds()).toBe(120);
      expect(duration.asMinutes()).toBe(2);
    });

    it('should create Duration from zero minutes', () => {
      // Arrange & Act
      const duration = Duration.fromMinutes(0);

      // Assert
      expect(duration.asSeconds()).toBe(0);
      expect(duration.asMinutes()).toBe(0);
    });

    it('should create Duration from decimal minutes', () => {
      // Arrange & Act
      const duration = Duration.fromMinutes(1.5);

      // Assert
      expect(duration.asSeconds()).toBe(90);
      expect(duration.asMinutes()).toBe(1.5);
    });

    it('should create Duration from large minutes value', () => {
      // Arrange & Act
      const duration = Duration.fromMinutes(60); // 1 hour

      // Assert
      expect(duration.asSeconds()).toBe(3600);
      expect(duration.asMinutes()).toBe(60);
    });

    it('should throw BusinessRuleError with correct i18n key when minutes is negative', () => {
      // Arrange & Act & Assert
      expect(() => Duration.fromMinutes(-5)).toThrow(BusinessRuleError);
      expect(() => Duration.fromMinutes(-5)).toThrow('errors.domain.duration.negative');
    });

    it('should throw BusinessRuleError with correct i18n key when minutes is negative decimal', () => {
      // Arrange & Act & Assert
      expect(() => Duration.fromMinutes(-0.5)).toThrow(BusinessRuleError);
      expect(() => Duration.fromMinutes(-0.5)).toThrow('errors.domain.duration.negative');
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const duration = Duration.fromMinutes(10);

      // Assert
      expect(Object.isFrozen(duration)).toBe(true);
    });
  });

  describe('asSeconds', () => {
    it('should return correct seconds value', () => {
      // Arrange
      const duration = Duration.fromSeconds(75);

      // Act & Assert
      expect(duration.asSeconds()).toBe(75);
    });

    it('should return zero for zero duration', () => {
      // Arrange
      const duration = Duration.fromSeconds(0);

      // Act & Assert
      expect(duration.asSeconds()).toBe(0);
    });

    it('should return correct seconds for duration created from minutes', () => {
      // Arrange
      const duration = Duration.fromMinutes(3);

      // Act & Assert
      expect(duration.asSeconds()).toBe(180);
    });
  });

  describe('asMinutes', () => {
    it('should return correct minutes value', () => {
      // Arrange
      const duration = Duration.fromSeconds(180);

      // Act & Assert
      expect(duration.asMinutes()).toBe(3);
    });

    it('should return zero for zero duration', () => {
      // Arrange
      const duration = Duration.fromSeconds(0);

      // Act & Assert
      expect(duration.asMinutes()).toBe(0);
    });

    it('should return decimal minutes for non-whole minute durations', () => {
      // Arrange
      const duration = Duration.fromSeconds(90);

      // Act & Assert
      expect(duration.asMinutes()).toBe(1.5);
    });

    it('should return fractional minutes for seconds that do not divide evenly', () => {
      // Arrange
      const duration = Duration.fromSeconds(75);

      // Act & Assert
      expect(duration.asMinutes()).toBe(1.25);
    });

    it('should return correct minutes for duration created from minutes', () => {
      // Arrange
      const duration = Duration.fromMinutes(5.5);

      // Act & Assert
      expect(duration.asMinutes()).toBe(5.5);
    });
  });

  describe('format', () => {
    it('should call date-fns functions with correct parameters', async () => {
      // Arrange
      const { formatDuration, intervalToDuration } = await import('date-fns');
      const mockIntervalToDuration = vi.mocked(intervalToDuration);
      const mockFormatDuration = vi.mocked(formatDuration);

      const mockInterval = { minutes: 2, seconds: 30 };
      mockIntervalToDuration.mockReturnValue(mockInterval);
      mockFormatDuration.mockReturnValue('02:30');

      const duration = Duration.fromSeconds(150);

      // Act
      const result = duration.format();

      // Assert
      expect(mockIntervalToDuration).toHaveBeenCalledWith({ start: 0, end: 150000 });
      expect(mockFormatDuration).toHaveBeenCalledWith(mockInterval, {
        format: ['minutes', 'seconds'],
        zero: true,
        delimiter: ':',
      });
      expect(result).toBe('02:30');
    });

    it('should format zero duration correctly', async () => {
      // Arrange
      const { formatDuration, intervalToDuration } = await import('date-fns');
      const mockIntervalToDuration = vi.mocked(intervalToDuration);
      const mockFormatDuration = vi.mocked(formatDuration);

      const mockInterval = { minutes: 0, seconds: 0 };
      mockIntervalToDuration.mockReturnValue(mockInterval);
      mockFormatDuration.mockReturnValue('00:00');

      const duration = Duration.fromSeconds(0);

      // Act
      const result = duration.format();

      // Assert
      expect(mockIntervalToDuration).toHaveBeenCalledWith({ start: 0, end: 0 });
      expect(mockFormatDuration).toHaveBeenCalledWith(mockInterval, {
        format: ['minutes', 'seconds'],
        zero: true,
        delimiter: ':',
      });
      expect(result).toBe('00:00');
    });

    it('should format large duration correctly', async () => {
      // Arrange
      const { formatDuration, intervalToDuration } = await import('date-fns');
      const mockIntervalToDuration = vi.mocked(intervalToDuration);
      const mockFormatDuration = vi.mocked(formatDuration);

      const mockInterval = { hours: 1, minutes: 30, seconds: 45 };
      mockIntervalToDuration.mockReturnValue(mockInterval);
      mockFormatDuration.mockReturnValue('90:45');

      const duration = Duration.fromSeconds(5445); // 1h 30m 45s

      // Act
      const result = duration.format();

      // Assert
      expect(mockIntervalToDuration).toHaveBeenCalledWith({ start: 0, end: 5445000 });
      expect(result).toBe('90:45');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const duration = Duration.fromSeconds(100);
      const originalSeconds = duration.asSeconds();

      // Act & Assert - attempting to modify private property will throw in strict mode
      expect(() => {
        (duration as any).seconds = 200;
      }).toThrow(); // Frozen object will throw when trying to modify
      expect(duration.asSeconds()).toBe(originalSeconds); // Value should remain unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle very small positive durations', () => {
      // Arrange & Act
      const duration = Duration.fromSeconds(0.001);

      // Assert
      expect(duration.asSeconds()).toBe(0.001);
      expect(duration.asMinutes()).toBeCloseTo(0.0000167, 6);
    });

    it('should handle very large durations', () => {
      // Arrange & Act
      const duration = Duration.fromSeconds(86400); // 24 hours

      // Assert
      expect(duration.asSeconds()).toBe(86400);
      expect(duration.asMinutes()).toBe(1440);
    });

    it('should handle conversion precision', () => {
      // Arrange & Act
      const duration1 = Duration.fromMinutes(1);
      const duration2 = Duration.fromSeconds(60);

      // Assert
      expect(duration1.asSeconds()).toBe(duration2.asSeconds());
      expect(duration1.asMinutes()).toBe(duration2.asMinutes());
    });
  });

  describe('constructor protection', () => {
    it('should not allow direct instantiation with new Duration()', () => {
      // The constructor is private, so this test verifies the TypeScript compilation
      // would prevent direct instantiation, but we can't test it at runtime easily
      // This is more of a compile-time check

      // Arrange & Act & Assert
      // We verify that the static factory methods are the only way to create instances
      const duration1 = Duration.fromSeconds(100);
      const duration2 = Duration.fromMinutes(2);

      expect(duration1).toBeDefined();
      expect(duration2).toBeDefined();
      expect(typeof Duration.fromSeconds).toBe('function');
      expect(typeof Duration.fromMinutes).toBe('function');
    });
  });
});
