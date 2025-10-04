import { describe, expect, it, vi } from 'vitest';

import { UserAge } from '../UserAge';
import { UserDateOfBirth } from '../UserDateOfBirth';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  differenceInYears: vi.fn(),
}));

describe('UserDateOfBirth', () => {
  describe('constructor', () => {
    it('should create UserDateOfBirth with valid date', () => {
      // Arrange
      const birthDate = new Date('1990-06-15');

      // Act
      const userDateOfBirth = new UserDateOfBirth(birthDate);

      // Assert
      expect(userDateOfBirth.value).toBe(birthDate);
    });

    it('should create UserDateOfBirth with current date', () => {
      // Arrange
      const currentDate = new Date();

      // Act
      const userDateOfBirth = new UserDateOfBirth(currentDate);

      // Assert
      expect(userDateOfBirth.value).toBe(currentDate);
    });

    it('should create UserDateOfBirth with very old date', () => {
      // Arrange
      const oldDate = new Date('1920-01-01');

      // Act
      const userDateOfBirth = new UserDateOfBirth(oldDate);

      // Assert
      expect(userDateOfBirth.value).toBe(oldDate);
    });

    it('should create UserDateOfBirth with future date', () => {
      // Arrange
      const futureDate = new Date('2030-12-31');

      // Act
      const userDateOfBirth = new UserDateOfBirth(futureDate);

      // Assert
      expect(userDateOfBirth.value).toBe(futureDate);
    });

    it('should create UserDateOfBirth with date constructed from string', () => {
      // Arrange
      const dateString = '1985-03-22';
      const birthDate = new Date(dateString);

      // Act
      const userDateOfBirth = new UserDateOfBirth(birthDate);

      // Assert
      expect(userDateOfBirth.value).toEqual(birthDate);
    });

    it('should create UserDateOfBirth with date constructed from components', () => {
      // Arrange
      const birthDate = new Date(1992, 8, 10); // September 10, 1992 (month is 0-indexed)

      // Act
      const userDateOfBirth = new UserDateOfBirth(birthDate);

      // Assert
      expect(userDateOfBirth.value).toBe(birthDate);
    });

    it('should freeze the instance after creation', () => {
      // Arrange
      const birthDate = new Date('1988-07-20');

      // Act
      const userDateOfBirth = new UserDateOfBirth(birthDate);

      // Assert
      expect(Object.isFrozen(userDateOfBirth)).toBe(true);
    });

    it('should be immutable', () => {
      // Arrange
      const originalDate = new Date('1995-04-18');
      const userDateOfBirth = new UserDateOfBirth(originalDate);

      // Act & Assert - frozen object throws when trying to modify in strict mode
      expect(() => {
        (userDateOfBirth as any).value = new Date('2000-01-01');
      }).toThrow();
      expect(userDateOfBirth.value).toBe(originalDate); // Value should remain unchanged
    });
  });

  describe('calculateAge', () => {
    it('should calculate age using differenceInYears from date-fns', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);
      mockDifferenceInYears.mockReturnValue(30);

      const birthDate = new Date('1993-05-10');
      const userDateOfBirth = new UserDateOfBirth(birthDate);

      // Act
      const age = userDateOfBirth.calculateAge();

      // Assert
      expect(mockDifferenceInYears).toHaveBeenCalledWith(expect.any(Date), birthDate);
      expect(age).toBeInstanceOf(UserAge);
      expect(age.value).toBe(30);
    });

    it('should calculate age for baby born this year', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);
      mockDifferenceInYears.mockReturnValue(0);

      const thisYearDate = new Date();
      const userDateOfBirth = new UserDateOfBirth(thisYearDate);

      // Act
      const age = userDateOfBirth.calculateAge();

      // Assert
      expect(mockDifferenceInYears).toHaveBeenCalledWith(expect.any(Date), thisYearDate);
      expect(age.value).toBe(0);
    });

    it('should calculate age for elderly person', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);
      mockDifferenceInYears.mockReturnValue(85);

      const oldDate = new Date('1938-12-01');
      const userDateOfBirth = new UserDateOfBirth(oldDate);

      // Act
      const age = userDateOfBirth.calculateAge();

      // Assert
      expect(mockDifferenceInYears).toHaveBeenCalledWith(expect.any(Date), oldDate);
      expect(age.value).toBe(85);
    });

    it('should handle future birth date (negative age)', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);
      mockDifferenceInYears.mockReturnValue(-5); // Future date would result in negative age

      const futureDate = new Date('2030-01-01');
      const userDateOfBirth = new UserDateOfBirth(futureDate);

      // Act & Assert
      // The UserAge constructor will throw an error for negative ages
      expect(() => userDateOfBirth.calculateAge()).toThrow();
    });

    it('should use current date for age calculation', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);
      const mockCurrentDate = new Date('2023-06-15T10:30:00Z');

      // Mock Date constructor
      vi.spyOn(global, 'Date').mockImplementation(() => mockCurrentDate);
      mockDifferenceInYears.mockReturnValue(25);

      const birthDate = new Date('1998-06-15');
      const userDateOfBirth = new UserDateOfBirth(birthDate);

      // Act
      const age = userDateOfBirth.calculateAge();

      // Assert
      expect(mockDifferenceInYears).toHaveBeenCalledWith(mockCurrentDate, birthDate);
      expect(age.value).toBe(25);

      // Cleanup
      vi.restoreAllMocks();
    });

    it('should return different UserAge instances for multiple calls', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);
      mockDifferenceInYears.mockReturnValue(28);

      const birthDate = new Date('1995-09-08');
      const userDateOfBirth = new UserDateOfBirth(birthDate);

      // Act
      const age1 = userDateOfBirth.calculateAge();
      const age2 = userDateOfBirth.calculateAge();

      // Assert
      expect(age1).not.toBe(age2); // Different instances
      expect(age1.value).toBe(age2.value); // Same value
      expect(age1.value).toBe(28);
      expect(age2.value).toBe(28);
    });
  });

  describe('edge cases', () => {
    it('should handle leap year dates', () => {
      // Arrange
      const leapYearDate = new Date('1996-02-29'); // Leap year

      // Act
      const userDateOfBirth = new UserDateOfBirth(leapYearDate);

      // Assert
      expect(userDateOfBirth.value).toBe(leapYearDate);
    });

    it('should handle invalid Date objects', () => {
      // Arrange
      const invalidDate = new Date('invalid-date-string');

      // Act
      const userDateOfBirth = new UserDateOfBirth(invalidDate);

      // Assert
      expect(userDateOfBirth.value).toBe(invalidDate);
      expect(isNaN(userDateOfBirth.value.getTime())).toBe(true);
    });

    it('should handle dates at year boundaries', () => {
      // Arrange
      const newYearDate = new Date('2000-01-01T00:00:00Z');
      const yearEndDate = new Date('1999-12-31T23:59:59Z');

      // Act
      const userDateOfBirth1 = new UserDateOfBirth(newYearDate);
      const userDateOfBirth2 = new UserDateOfBirth(yearEndDate);

      // Assert
      expect(userDateOfBirth1.value).toBe(newYearDate);
      expect(userDateOfBirth2.value).toBe(yearEndDate);
    });

    it('should handle dates with different time zones', () => {
      // Arrange
      const utcDate = new Date('1990-06-15T00:00:00Z');
      const timezoneDate = new Date('1990-06-15T12:00:00+05:00');

      // Act
      const userDateOfBirth1 = new UserDateOfBirth(utcDate);
      const userDateOfBirth2 = new UserDateOfBirth(timezoneDate);

      // Assert
      expect(userDateOfBirth1.value).toBe(utcDate);
      expect(userDateOfBirth2.value).toBe(timezoneDate);
    });
  });

  describe('realistic scenarios', () => {
    it('should handle common birth date formats', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);
      mockDifferenceInYears.mockReturnValue(32);

      const commonFormats = [
        new Date('1991-07-15'),
        new Date('July 15, 1991'),
        new Date(1991, 6, 15), // July is month 6 (0-indexed)
      ];

      commonFormats.forEach((birthDate, index) => {
        // Act
        const userDateOfBirth = new UserDateOfBirth(birthDate);
        const age = userDateOfBirth.calculateAge();

        // Assert
        expect(userDateOfBirth.value).toBe(birthDate);
        expect(age.value).toBe(32);
      });
    });

    it('should work with dates representing different life stages', async () => {
      // Arrange
      const { differenceInYears } = await import('date-fns');
      const mockDifferenceInYears = vi.mocked(differenceInYears);

      const lifeStages = [
        { date: new Date('2020-01-01'), age: 3, stage: 'toddler' },
        { date: new Date('2010-01-01'), age: 13, stage: 'teenager' },
        { date: new Date('1990-01-01'), age: 33, stage: 'adult' },
        { date: new Date('1950-01-01'), age: 73, stage: 'senior' },
      ];

      lifeStages.forEach(({ date, age: expectedAge, stage }) => {
        mockDifferenceInYears.mockReturnValue(expectedAge);

        // Act
        const userDateOfBirth = new UserDateOfBirth(date);
        const calculatedAge = userDateOfBirth.calculateAge();

        // Assert
        expect(calculatedAge.value).toBe(expectedAge);
      });
    });
  });
});
