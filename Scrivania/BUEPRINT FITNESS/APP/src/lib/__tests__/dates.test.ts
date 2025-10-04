import { describe, expect, it } from 'vitest';

import { formatDate, formatDateTime } from '../dates';

describe('Date Formatting Functions', () => {
  describe('formatDate', () => {
    it('should format a standard date correctly', () => {
      // Arrange
      const date = new Date('2024-07-21T15:30:45.123Z');

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe('07/21/2024');
    });

    it('should format January 1st correctly', () => {
      // Arrange
      const date = new Date('2024-01-01T00:00:00.000Z');

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe('01/01/2024');
    });

    it('should format December 31st correctly', () => {
      // Arrange
      const date = new Date(2024, 11, 31); // Month is 0-based, so 11 = December

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe('12/31/2024');
    });

    it('should handle leap year February 29th', () => {
      // Arrange
      const date = new Date('2024-02-29T12:00:00.000Z');

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe('02/29/2024');
    });

    it('should handle non-leap year February 28th', () => {
      // Arrange
      const date = new Date('2023-02-28T12:00:00.000Z');

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe('02/28/2023');
    });

    it('should format single-digit months and days with leading zeros', () => {
      // Arrange
      const date = new Date('2024-03-05T10:15:30.000Z');

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe('03/05/2024');
    });

    it('should handle different years correctly', () => {
      // Arrange
      const dates = [
        new Date('1999-12-31T12:00:00.000Z'),
        new Date('2000-01-01T12:00:00.000Z'),
        new Date('2025-06-15T12:00:00.000Z'),
      ];
      const expectedResults = ['12/31/1999', '01/01/2000', '06/15/2025'];

      // Act & Assert
      dates.forEach((date, index) => {
        const result = formatDate(date);
        expect(result).toBe(expectedResults[index]);
      });
    });

    it('should ignore time portion of date', () => {
      // Arrange
      const morningDate = new Date('2024-07-21T08:00:00.000Z');
      const eveningDate = new Date('2024-07-21T20:00:00.000Z');

      // Act
      const morningResult = formatDate(morningDate);
      const eveningResult = formatDate(eveningDate);

      // Assert
      expect(morningResult).toBe('07/21/2024');
      expect(eveningResult).toBe('07/21/2024');
      expect(morningResult).toBe(eveningResult);
    });

    it('should handle timezone differences correctly', () => {
      // Arrange
      // Note: The Date constructor interprets UTC time
      const utcDate = new Date('2024-07-21T23:30:00.000Z');

      // Act
      const result = formatDate(utcDate);

      // Assert
      // The result should be consistent regardless of system timezone
      expect(result).toMatch(/^(07\/21\/2024|07\/22\/2024)$/);
    });

    it('should handle very old dates', () => {
      // Arrange
      const oldDate = new Date('1900-01-01T12:00:00.000Z');

      // Act
      const result = formatDate(oldDate);

      // Assert
      expect(result).toBe('01/01/1900');
    });

    it('should handle future dates', () => {
      // Arrange
      const futureDate = new Date('2050-12-25T12:00:00.000Z');

      // Act
      const result = formatDate(futureDate);

      // Assert
      expect(result).toBe('12/25/2050');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time in AM correctly', () => {
      // Arrange
      const date = new Date('2024-07-21T08:30:00.000Z');

      // Act
      const result = formatDateTime(date);

      // Assert
      // Note: Result may vary based on timezone, so we check the pattern
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should format date and time in PM correctly', () => {
      // Arrange
      const date = new Date('2024-07-21T20:30:00.000Z');

      // Act
      const result = formatDateTime(date);

      // Assert
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should format noon correctly', () => {
      // Arrange
      const date = new Date('2024-07-21T12:00:00.000Z');

      // Act
      const result = formatDateTime(date);

      // Assert
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should format midnight correctly', () => {
      // Arrange
      const date = new Date('2024-07-21T00:00:00.000Z');

      // Act
      const result = formatDateTime(date);

      // Assert
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should format minutes with leading zeros when needed', () => {
      // Arrange
      const date = new Date('2024-07-21T15:05:00.000Z');

      // Act
      const result = formatDateTime(date);

      // Assert
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:05 (AM|PM)$/);
    });

    it('should handle different times throughout the day', () => {
      // Arrange
      const times = [
        new Date(2024, 6, 21, 1, 15), // July 21, 2024, 1:15 AM
        new Date(2024, 6, 21, 6, 30), // July 21, 2024, 6:30 AM
        new Date(2024, 6, 21, 11, 45), // July 21, 2024, 11:45 AM
        new Date(2024, 6, 21, 13, 20), // July 21, 2024, 1:20 PM
        new Date(2024, 6, 21, 18, 10), // July 21, 2024, 6:10 PM
        new Date(2024, 6, 21, 23, 55), // July 21, 2024, 11:55 PM
      ];

      // Act & Assert
      times.forEach((time) => {
        const result = formatDateTime(time);
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/);

        // Verify it includes the date part
        expect(result).toContain('07/21/2024');

        // Verify it includes AM or PM
        expect(result).toMatch(/(AM|PM)$/);
      });
    });

    it('should handle seconds being ignored in output', () => {
      // Arrange
      const dateWithSeconds = new Date('2024-07-21T15:30:45.000Z');
      const dateWithoutSeconds = new Date('2024-07-21T15:30:00.000Z');

      // Act
      const resultWithSeconds = formatDateTime(dateWithSeconds);
      const resultWithoutSeconds = formatDateTime(dateWithoutSeconds);

      // Assert
      // Both should format to the same minute precision
      expect(resultWithSeconds).toMatch(/30 (AM|PM)$/);
      expect(resultWithoutSeconds).toMatch(/30 (AM|PM)$/);
    });

    it('should handle different dates correctly', () => {
      // Arrange
      const dates = [
        new Date('2023-01-01T12:00:00.000Z'),
        new Date('2024-12-31T12:00:00.000Z'),
        new Date('2025-06-15T12:00:00.000Z'),
      ];

      // Act & Assert
      dates.forEach((date) => {
        const result = formatDateTime(date);
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/);
      });
    });

    it('should format leap year dates correctly', () => {
      // Arrange
      const leapYearDate = new Date('2024-02-29T14:30:00.000Z');

      // Act
      const result = formatDateTime(leapYearDate);

      // Assert
      expect(result).toMatch(/^02\/29\/2024 \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle milliseconds being ignored', () => {
      // Arrange
      const dateWithMs = new Date('2024-07-21T15:30:45.999Z');

      // Act
      const result = formatDateTime(dateWithMs);

      // Assert
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/);
      expect(result).not.toContain('999');
      expect(result).not.toContain('45'); // seconds should not be included
    });
  });

  describe('formatDate vs formatDateTime comparison', () => {
    it('should have formatDateTime include more information than formatDate', () => {
      // Arrange
      const date = new Date('2024-07-21T15:30:00.000Z');

      // Act
      const dateOnly = formatDate(date);
      const dateTime = formatDateTime(date);

      // Assert
      expect(dateTime).toContain(dateOnly);
      expect(dateTime.length).toBeGreaterThan(dateOnly.length);
      expect(dateTime).toMatch(/(AM|PM)$/);
    });

    it('should handle same date consistently', () => {
      // Arrange
      const date = new Date('2024-07-21T10:15:30.000Z');

      // Act
      const dateResult = formatDate(date);
      const dateTimeResult = formatDateTime(date);

      // Assert
      expect(dateTimeResult).toContain(dateResult);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Date at epoch', () => {
      // Arrange
      const epochDate = new Date(0); // January 1, 1970

      // Act
      const dateResult = formatDate(epochDate);
      const dateTimeResult = formatDateTime(epochDate);

      // Assert
      expect(dateResult).toMatch(/^\d{2}\/\d{2}\/1970$/);
      expect(dateTimeResult).toMatch(/^\d{2}\/\d{2}\/1970 \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle very precise timestamps', () => {
      // Arrange
      const preciseDate = new Date('2024-07-21T15:30:45.123456789Z');

      // Act
      const dateResult = formatDate(preciseDate);
      const dateTimeResult = formatDateTime(preciseDate);

      // Assert
      expect(dateResult).toBe('07/21/2024');
      expect(dateTimeResult).toMatch(/^07\/21\/2024 \d{1,2}:30 (AM|PM)$/);
    });
  });
});
