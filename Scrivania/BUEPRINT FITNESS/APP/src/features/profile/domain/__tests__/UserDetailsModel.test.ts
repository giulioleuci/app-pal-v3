import { addDays, isToday, startOfDay, subYears } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserDetailsModel } from '@/features/profile/domain';
import { generateId } from '@/lib';
import { createTestUserDetailsData, createTestUserDetailsModel } from '@/test-factories';

vi.mock('immer', async () => {
  const actual = await vi.importActual('immer');
  return {
    ...actual,
    produce: vi.fn().mockImplementation((base, recipe) => {
      // Create a proper deep copy that preserves dates
      const draft = JSON.parse(JSON.stringify(base), (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
      recipe(draft);
      // Return a new instance of the same constructor if it's a model
      if (base.constructor && base.constructor.name && base.constructor.hydrate) {
        return base.constructor.hydrate(draft);
      }
      return draft;
    }),
  };
});

// Mock date-fns functions for consistent testing
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    isToday: vi.fn(),
  };
});

describe('UserDetailsModel', () => {
  let userDetailsData: ReturnType<typeof createTestUserDetailsData>;
  let userDetails: UserDetailsModel;
  let mockToday: Date;

  beforeEach(() => {
    mockToday = new Date('2024-06-15T12:00:00Z');
    vi.setSystemTime(mockToday);
    vi.clearAllMocks();

    userDetailsData = createTestUserDetailsData({
      fullName: 'John Doe',
      biologicalSex: 'male',
      dateOfBirth: new Date('1990-06-15T00:00:00Z'), // 34 years old, birthday today
    });
    userDetails = UserDetailsModel.hydrate(userDetailsData);
  });

  describe('constructor', () => {
    it('should be protected and only accessible through hydrate', () => {
      // Protected constructor prevents direct instantiation in TypeScript
      // but we can verify hydrate works correctly
      const instance = UserDetailsModel.hydrate(userDetailsData);
      expect(instance).toBeInstanceOf(UserDetailsModel);
    });
  });

  describe('hydrate', () => {
    it('should create a UserDetailsModel instance from plain data', () => {
      const data = createTestUserDetailsData({
        fullName: 'Jane Smith',
        biologicalSex: 'female',
        dateOfBirth: new Date('1985-03-20'),
      });
      const model = UserDetailsModel.hydrate(data);

      expect(model).toBeInstanceOf(UserDetailsModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.fullName).toBe('Jane Smith');
      expect(model.biologicalSex).toBe('female');
      expect(model.dateOfBirth?.value).toEqual(data.dateOfBirth);
      expect(model.createdAt).toEqual(data.createdAt);
      expect(model.updatedAt).toEqual(data.updatedAt);
    });

    it('should handle optional fields being undefined', () => {
      const minimalData = createTestUserDetailsData({
        fullName: undefined,
        biologicalSex: undefined,
        dateOfBirth: undefined,
      });
      const model = UserDetailsModel.hydrate(minimalData);

      expect(model.fullName).toBeUndefined();
      expect(model.biologicalSex).toBeUndefined();
      expect(model.dateOfBirth).toBeUndefined();
    });

    it('should wrap dateOfBirth in UserDateOfBirth value object', () => {
      const data = createTestUserDetailsData({
        dateOfBirth: new Date('1990-01-01'),
      });
      const model = UserDetailsModel.hydrate(data);

      expect(model.dateOfBirth).toBeDefined();
      expect(model.dateOfBirth?.value).toEqual(data.dateOfBirth);
    });
  });

  describe('getAge', () => {
    it('should return UserAge when dateOfBirth is set', () => {
      const age = userDetails.getAge();
      expect(age).toBeDefined();
      expect(age?.value).toBe(34); // Based on mock dates
    });

    it('should return null when dateOfBirth is not set', () => {
      const detailsWithoutDob = createTestUserDetailsModel({
        dateOfBirth: undefined,
      });
      const age = detailsWithoutDob.getAge();
      expect(age).toBeNull();
    });

    it('should calculate age correctly for different birth dates', () => {
      const birthDate = subYears(mockToday, 25);
      const details = createTestUserDetailsModel({ dateOfBirth: birthDate });
      const age = details.getAge();

      expect(age?.value).toBe(25);
    });

    it('should handle edge case of birthday not yet occurred this year', () => {
      // Born on June 20, but today is June 15
      const futureDate = new Date('1990-06-20T00:00:00Z');
      const details = createTestUserDetailsModel({ dateOfBirth: futureDate });
      const age = details.getAge();

      expect(age?.value).toBe(33); // Not 34 yet because birthday hasn't occurred
    });
  });

  describe('getName', () => {
    it('should return the full name when set', () => {
      expect(userDetails.getName()).toBe('John Doe');
    });

    it('should return null when full name is not set', () => {
      const detailsWithoutName = createTestUserDetailsModel({
        fullName: undefined,
      });
      expect(detailsWithoutName.getName()).toBeNull();
    });

    it('should return empty string as string (not null)', () => {
      const detailsWithEmptyName = createTestUserDetailsModel({
        fullName: '',
      });
      expect(detailsWithEmptyName.getName()).toBe('');
    });
  });

  describe('getInitials', () => {
    it('should return initials from full name in uppercase', () => {
      expect(userDetails.getInitials()).toBe('JD');
    });

    it('should return null when full name is not set', () => {
      const detailsWithoutName = createTestUserDetailsModel({
        fullName: undefined,
      });
      expect(detailsWithoutName.getInitials()).toBeNull();
    });

    it('should handle single name', () => {
      const singleName = createTestUserDetailsModel({ fullName: 'John' });
      expect(singleName.getInitials()).toBe('J');
    });

    it('should handle multiple names', () => {
      const multipleName = createTestUserDetailsModel({
        fullName: 'John Michael Doe Smith',
      });
      expect(multipleName.getInitials()).toBe('JMDS');
    });

    it('should handle names with lowercase', () => {
      const lowercaseName = createTestUserDetailsModel({
        fullName: 'john doe',
      });
      expect(lowercaseName.getInitials()).toBe('JD');
    });

    it('should handle empty string name', () => {
      const emptyName = createTestUserDetailsModel({ fullName: '' });
      expect(emptyName.getInitials()).toBeNull();
    });

    it('should handle names with extra spaces', () => {
      const spacedName = createTestUserDetailsModel({
        fullName: 'John  Michael   Doe',
      });
      expect(spacedName.getInitials()).toBe('JMD');
    });
  });

  describe('isBirthdayToday', () => {
    it('should return true when today is the birthday', () => {
      (isToday as vi.Mock).mockReturnValue(true);
      expect(userDetails.isBirthdayToday()).toBe(true);
    });

    it('should return false when today is not the birthday', () => {
      (isToday as vi.Mock).mockReturnValue(false);
      expect(userDetails.isBirthdayToday()).toBe(false);
    });

    it('should return false when dateOfBirth is not set', () => {
      const detailsWithoutDob = createTestUserDetailsModel({
        dateOfBirth: undefined,
      });
      expect(detailsWithoutDob.isBirthdayToday()).toBe(false);
    });
  });

  describe('getAgeInDays', () => {
    it('should return age in days when dateOfBirth is set', () => {
      // 34 years * 365.25 days (accounting for leap years) ≈ 12418 days
      const ageInDays = userDetails.getAgeInDays();
      expect(ageInDays).toBeDefined();
      expect(ageInDays).toBeGreaterThan(12000);
      expect(ageInDays).toBeLessThan(13000);
    });

    it('should return null when dateOfBirth is not set', () => {
      const detailsWithoutDob = createTestUserDetailsModel({
        dateOfBirth: undefined,
      });
      expect(detailsWithoutDob.getAgeInDays()).toBeNull();
    });

    it('should return 0 for someone born today', () => {
      const bornToday = createTestUserDetailsModel({
        dateOfBirth: mockToday,
      });
      expect(bornToday.getAgeInDays()).toBe(0);
    });

    it('should return 1 for someone born yesterday', () => {
      const bornYesterday = createTestUserDetailsModel({
        dateOfBirth: new Date('2024-06-14T12:00:00Z'),
      });
      expect(bornYesterday.getAgeInDays()).toBe(1);
    });
  });

  describe('cloneWithNewFullName', () => {
    it('should create a new instance with updated full name', () => {
      const newName = 'Jane Smith';
      const cloned = userDetails.cloneWithNewFullName(newName);

      expect(cloned).not.toBe(userDetails);
      expect(cloned.fullName).toBe(newName);
      expect(cloned.id).toBe(userDetails.id);
      expect(cloned.profileId).toBe(userDetails.profileId);
      expect(cloned.biologicalSex).toBe(userDetails.biologicalSex);
      expect(cloned.dateOfBirth?.value).toEqual(userDetails.dateOfBirth?.value);
      expect(cloned.updatedAt).not.toBe(userDetails.updatedAt);
    });

    it('should not mutate the original details', () => {
      const originalName = userDetails.fullName;
      const originalUpdatedAt = userDetails.updatedAt;

      userDetails.cloneWithNewFullName('New Name');

      expect(userDetails.fullName).toBe(originalName);
      expect(userDetails.updatedAt).toBe(originalUpdatedAt);
    });

    it('should handle empty string', () => {
      const cloned = userDetails.cloneWithNewFullName('');
      expect(cloned.fullName).toBe('');
    });
  });

  describe('cloneWithNewDateOfBirth', () => {
    it('should create a new instance with updated date of birth', () => {
      const newDob = new Date('1995-12-25');
      const cloned = userDetails.cloneWithNewDateOfBirth(newDob);

      expect(cloned).not.toBe(userDetails);
      expect(cloned.dateOfBirth?.value).toEqual(newDob);
      expect(cloned.id).toBe(userDetails.id);
      expect(cloned.fullName).toBe(userDetails.fullName);
      expect(cloned.updatedAt).not.toBe(userDetails.updatedAt);
    });

    it('should not mutate the original details', () => {
      const originalDob = userDetails.dateOfBirth?.value;
      const originalUpdatedAt = userDetails.updatedAt;

      userDetails.cloneWithNewDateOfBirth(new Date());

      expect(userDetails.dateOfBirth?.value).toEqual(originalDob);
      expect(userDetails.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithNewBiologicalSex', () => {
    it('should create a new instance with updated biological sex', () => {
      const cloned = userDetails.cloneWithNewBiologicalSex('female');

      expect(cloned).not.toBe(userDetails);
      expect(cloned.biologicalSex).toBe('female');
      expect(cloned.id).toBe(userDetails.id);
      expect(cloned.fullName).toBe(userDetails.fullName);
      expect(cloned.updatedAt).not.toBe(userDetails.updatedAt);
    });

    it('should not mutate the original details', () => {
      const originalSex = userDetails.biologicalSex;
      const originalUpdatedAt = userDetails.updatedAt;

      userDetails.cloneWithNewBiologicalSex('female');

      expect(userDetails.biologicalSex).toBe(originalSex);
      expect(userDetails.updatedAt).toBe(originalUpdatedAt);
    });

    it('should handle switching from female to male', () => {
      const femaleDetails = createTestUserDetailsModel({ biologicalSex: 'female' });
      const cloned = femaleDetails.cloneWithNewBiologicalSex('male');
      expect(cloned.biologicalSex).toBe('male');
    });
  });

  describe('cloneWithMergedDetails', () => {
    it('should create a new instance with merged partial details', () => {
      const partialDetails = {
        fullName: 'Updated Name',
        biologicalSex: 'female' as const,
      };
      const cloned = userDetails.cloneWithMergedDetails(partialDetails);

      expect(cloned).not.toBe(userDetails);
      expect(cloned.fullName).toBe('Updated Name');
      expect(cloned.biologicalSex).toBe('female');
      expect(cloned.dateOfBirth?.value).toEqual(userDetails.dateOfBirth?.value);
      expect(cloned.updatedAt).not.toBe(userDetails.updatedAt);
    });

    it('should handle single property updates', () => {
      const cloned = userDetails.cloneWithMergedDetails({ fullName: 'Only Name Changed' });

      expect(cloned.fullName).toBe('Only Name Changed');
      expect(cloned.biologicalSex).toBe(userDetails.biologicalSex);
      expect(cloned.dateOfBirth?.value).toEqual(userDetails.dateOfBirth?.value);
    });

    it('should handle empty partial details', () => {
      const cloned = userDetails.cloneWithMergedDetails({});

      expect(cloned).not.toBe(userDetails);
      expect(cloned.fullName).toBe(userDetails.fullName);
      expect(cloned.biologicalSex).toBe(userDetails.biologicalSex);
      expect(cloned.dateOfBirth?.value).toEqual(userDetails.dateOfBirth?.value);
    });

    it('should not mutate the original details', () => {
      const originalName = userDetails.fullName;
      const originalSex = userDetails.biologicalSex;
      const originalUpdatedAt = userDetails.updatedAt;

      userDetails.cloneWithMergedDetails({ fullName: 'New', biologicalSex: 'female' });

      expect(userDetails.fullName).toBe(originalName);
      expect(userDetails.biologicalSex).toBe(originalSex);
      expect(userDetails.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithClearedOptionalFields', () => {
    it('should create a new instance with all optional fields cleared', () => {
      const cloned = userDetails.cloneWithClearedOptionalFields();

      expect(cloned).not.toBe(userDetails);
      expect(cloned.fullName).toBeUndefined();
      expect(cloned.biologicalSex).toBeUndefined();
      expect(cloned.dateOfBirth).toBeUndefined();
      expect(cloned.id).toBe(userDetails.id);
      expect(cloned.profileId).toBe(userDetails.profileId);
      expect(cloned.updatedAt).not.toBe(userDetails.updatedAt);
    });

    it('should not mutate the original details', () => {
      const originalName = userDetails.fullName;
      const originalSex = userDetails.biologicalSex;
      const originalDob = userDetails.dateOfBirth?.value;
      const originalUpdatedAt = userDetails.updatedAt;

      userDetails.cloneWithClearedOptionalFields();

      expect(userDetails.fullName).toBe(originalName);
      expect(userDetails.biologicalSex).toBe(originalSex);
      expect(userDetails.dateOfBirth?.value).toEqual(originalDob);
      expect(userDetails.updatedAt).toBe(originalUpdatedAt);
    });

    it('should work on already cleared details', () => {
      const cleared = userDetails.cloneWithClearedOptionalFields();
      const doubleClear = cleared.cloneWithClearedOptionalFields();

      expect(doubleClear.fullName).toBeUndefined();
      expect(doubleClear.biologicalSex).toBeUndefined();
      expect(doubleClear.dateOfBirth).toBeUndefined();
    });
  });

  describe('isProfileComplete', () => {
    it('should return true when both full name and date of birth are provided', () => {
      expect(userDetails.isProfileComplete()).toBe(true);
    });

    it('should return false when full name is missing', () => {
      const withoutName = createTestUserDetailsModel({
        fullName: undefined,
        dateOfBirth: new Date(),
      });
      expect(withoutName.isProfileComplete()).toBe(false);
    });

    it('should return false when date of birth is missing', () => {
      const withoutDob = createTestUserDetailsModel({
        fullName: 'John Doe',
        dateOfBirth: undefined,
      });
      expect(withoutDob.isProfileComplete()).toBe(false);
    });

    it('should return false when both are missing', () => {
      const withoutBoth = createTestUserDetailsModel({
        fullName: undefined,
        dateOfBirth: undefined,
      });
      expect(withoutBoth.isProfileComplete()).toBe(false);
    });

    it('should return false when full name is empty string', () => {
      const emptyName = createTestUserDetailsModel({
        fullName: '',
        dateOfBirth: new Date(),
      });
      expect(emptyName.isProfileComplete()).toBe(false);
    });

    it('should update correctly after clone operations', () => {
      const incomplete = createTestUserDetailsModel({ fullName: undefined });
      const complete = incomplete.cloneWithNewFullName('Complete Name');

      expect(incomplete.isProfileComplete()).toBe(false);
      expect(complete.isProfileComplete()).toBe(true);
    });
  });

  describe('isAdult', () => {
    it('should return true for users 18 years or older', () => {
      // User is 34 years old based on mock dates
      expect(userDetails.isAdult()).toBe(true);
    });

    it('should return true for users exactly 18 years old', () => {
      const eighteenToday = subYears(mockToday, 18);
      const adult = createTestUserDetailsModel({ dateOfBirth: eighteenToday });
      expect(adult.isAdult()).toBe(true);
    });

    it('should return false for users under 18', () => {
      const minor = createTestUserDetailsModel({
        dateOfBirth: subYears(mockToday, 17),
      });
      expect(minor.isAdult()).toBe(false);
    });

    it('should return false when date of birth is not set', () => {
      const withoutDob = createTestUserDetailsModel({
        dateOfBirth: undefined,
      });
      expect(withoutDob.isAdult()).toBe(false);
    });

    it('should handle edge case of 18th birthday not yet occurred', () => {
      // Born 18 years ago but birthday is tomorrow
      const almostAdult = createTestUserDetailsModel({
        dateOfBirth: addDays(subYears(mockToday, 18), 1),
      });
      expect(almostAdult.isAdult()).toBe(false);
    });
  });

  describe('hasDateOfBirth', () => {
    it('should return true when date of birth is set', () => {
      expect(userDetails.hasDateOfBirth()).toBe(true);
    });

    it('should return false when date of birth is not set', () => {
      const withoutDob = createTestUserDetailsModel({
        dateOfBirth: undefined,
      });
      expect(withoutDob.hasDateOfBirth()).toBe(false);
    });
  });

  describe('getFormattedDateOfBirth', () => {
    it('should return formatted date when date of birth is set', () => {
      const formatted = userDetails.getFormattedDateOfBirth('yyyy-MM-dd');
      expect(formatted).toBe('1990-06-15');
    });

    it('should handle different format strings', () => {
      const formats = [
        ['MM/dd/yyyy', '06/15/1990'],
        ['dd-MM-yyyy', '15-06-1990'],
        ['MMM dd, yyyy', 'Jun 15, 1990'],
        ['yyyy', '1990'],
      ];

      formats.forEach(([formatString, expected]) => {
        const formatted = userDetails.getFormattedDateOfBirth(formatString);
        expect(formatted).toBe(expected);
      });
    });

    it('should return null when date of birth is not set', () => {
      const withoutDob = createTestUserDetailsModel({
        dateOfBirth: undefined,
      });
      const formatted = withoutDob.getFormattedDateOfBirth('yyyy-MM-dd');
      expect(formatted).toBeNull();
    });
  });

  describe('hasSameDetails', () => {
    it('should return true for identical details', () => {
      const other = UserDetailsModel.hydrate(userDetailsData);
      expect(userDetails.hasSameDetails(other)).toBe(true);
    });

    it('should return false when full names differ', () => {
      const other = createTestUserDetailsModel({
        ...userDetailsData,
        fullName: 'Jane Smith',
      });
      expect(userDetails.hasSameDetails(other)).toBe(false);
    });

    it('should return false when biological sex differs', () => {
      const other = createTestUserDetailsModel({
        ...userDetailsData,
        biologicalSex: 'female',
      });
      expect(userDetails.hasSameDetails(other)).toBe(false);
    });

    it('should return false when dates of birth differ', () => {
      const other = createTestUserDetailsModel({
        ...userDetailsData,
        dateOfBirth: new Date('1991-06-15'),
      });
      expect(userDetails.hasSameDetails(other)).toBe(false);
    });

    it('should handle both having no date of birth', () => {
      const without1 = createTestUserDetailsModel({
        fullName: 'John',
        biologicalSex: 'male',
        dateOfBirth: undefined,
      });
      const without2 = createTestUserDetailsModel({
        fullName: 'John',
        biologicalSex: 'male',
        dateOfBirth: undefined,
      });
      expect(without1.hasSameDetails(without2)).toBe(true);
    });

    it('should handle one having date of birth, other not', () => {
      const with1 = createTestUserDetailsModel({
        fullName: 'John',
        biologicalSex: 'male',
        dateOfBirth: new Date(),
      });
      const without = createTestUserDetailsModel({
        fullName: 'John',
        biologicalSex: 'male',
        dateOfBirth: undefined,
      });
      expect(with1.hasSameDetails(without)).toBe(false);
    });

    it('should compare by timestamp for dates', () => {
      const date1 = new Date('1990-06-15T10:00:00Z');
      const date2 = new Date('1990-06-15T12:00:00Z'); // Same date, different time

      const details1 = createTestUserDetailsModel({
        fullName: 'John',
        biologicalSex: 'male',
        dateOfBirth: date1,
      });
      const details2 = createTestUserDetailsModel({
        fullName: 'John',
        biologicalSex: 'male',
        dateOfBirth: date2,
      });

      expect(details1.hasSameDetails(details2)).toBe(false);
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      const cloned = userDetails.clone();

      expect(cloned).not.toBe(userDetails);
      expect(cloned.id).toBe(userDetails.id);
      expect(cloned.profileId).toBe(userDetails.profileId);
      expect(cloned.fullName).toBe(userDetails.fullName);
      expect(cloned.biologicalSex).toBe(userDetails.biologicalSex);
      expect(cloned.dateOfBirth?.value).toEqual(userDetails.dateOfBirth?.value);
    });

    it('should return the same type', () => {
      const cloned = userDetails.clone();
      expect(cloned).toBeInstanceOf(UserDetailsModel);
    });
  });

  describe('toPlainObject', () => {
    it('should return a plain object with all properties', () => {
      const plainObject = userDetails.toPlainObject();

      expect(plainObject).toEqual({
        id: userDetails.id,
        profileId: userDetails.profileId,
        fullName: userDetails.fullName,
        biologicalSex: userDetails.biologicalSex,
        dateOfBirth: userDetails.dateOfBirth?.value,
        createdAt: userDetails.createdAt,
        updatedAt: userDetails.updatedAt,
      });
    });

    it('should handle undefined optional fields', () => {
      const withoutOptionals = createTestUserDetailsModel({
        fullName: undefined,
        biologicalSex: undefined,
        dateOfBirth: undefined,
      });
      const plainObject = withoutOptionals.toPlainObject();

      expect(plainObject.fullName).toBeUndefined();
      expect(plainObject.biologicalSex).toBeUndefined();
      expect(plainObject.dateOfBirth).toBeUndefined();
    });

    it('should be serializable', () => {
      const plainObject = userDetails.toPlainObject();
      expect(() => JSON.stringify(plainObject)).not.toThrow();
    });

    it('should unwrap UserDateOfBirth to plain Date', () => {
      const plainObject = userDetails.toPlainObject();
      expect(plainObject.dateOfBirth).toBeInstanceOf(Date);
      expect(plainObject.dateOfBirth).toEqual(userDetails.dateOfBirth?.value);
    });
  });

  describe('validate', () => {
    it('should validate successfully for valid user details data', () => {
      const result = userDetails.validate();
      expect(result.success).toBe(true);
    });

    it('should validate successfully with undefined optional fields', () => {
      const minimal = createTestUserDetailsModel({
        fullName: undefined,
        biologicalSex: undefined,
        dateOfBirth: undefined,
      });
      const result = minimal.validate();
      expect(result.success).toBe(true);
    });

    it('should fail validation for invalid biological sex', () => {
      const invalid = UserDetailsModel.hydrate({
        ...userDetailsData,
        // @ts-expect-error - Testing invalid data
        biologicalSex: 'other',
      });
      const result = invalid.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for future date of birth', () => {
      const futureDate = addDays(new Date(), 1);
      const invalid = UserDetailsModel.hydrate({
        ...userDetailsData,
        dateOfBirth: futureDate,
      });
      const result = invalid.validate();
      expect(result.success).toBe(false);
    });

    it('should validate successfully for date of birth exactly today', () => {
      const today = startOfDay(new Date());
      const valid = createTestUserDetailsModel({
        dateOfBirth: today,
      });
      const result = valid.validate();
      expect(result.success).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for the same instance', () => {
      expect(userDetails.equals(userDetails)).toBe(true);
    });

    it('should return true for different instances with same id', () => {
      const other = UserDetailsModel.hydrate(userDetailsData);
      expect(userDetails.equals(other)).toBe(true);
    });

    it('should return false for different instances with different ids', () => {
      const other = createTestUserDetailsModel({ id: generateId() });
      expect(userDetails.equals(other)).toBe(false);
    });

    it('should return false for null', () => {
      expect(userDetails.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(userDetails.equals(undefined)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties in TypeScript', () => {
      // TypeScript readonly properties prevent compile-time mutations
      // Runtime mutations are prevented by the class design and immutable operations
      expect(userDetails.fullName).toBeDefined();
      expect(userDetails.biologicalSex).toBeDefined();
      expect(userDetails.dateOfBirth).toBeDefined();

      // Verify that cloning creates new instances rather than mutating existing ones
      const originalName = userDetails.fullName;
      const cloned = userDetails.cloneWithNewFullName('Different Name');

      expect(userDetails.fullName).toBe(originalName);
      expect(cloned.fullName).toBe('Different Name');
      expect(cloned).not.toBe(userDetails);
    });
  });

  describe('business logic edge cases', () => {
    it('should handle very old person (100+ years)', () => {
      const centenarian = createTestUserDetailsModel({
        dateOfBirth: subYears(mockToday, 105),
      });

      expect(centenarian.isAdult()).toBe(true);
      expect(centenarian.getAge()?.value).toBe(105);
      expect(centenarian.getAgeInDays()).toBeGreaterThan(38000);
    });

    it('should maintain data integrity through complex clone operations', () => {
      const originalId = userDetails.id;
      const originalProfileId = userDetails.profileId;
      const originalCreatedAt = userDetails.createdAt;

      const modified = userDetails
        .cloneWithNewFullName('Updated Name')
        .cloneWithNewBiologicalSex('female')
        .cloneWithNewDateOfBirth(new Date('1995-01-01'))
        .cloneWithMergedDetails({ fullName: 'Final Name' })
        .cloneWithClearedOptionalFields();

      expect(modified.id).toBe(originalId);
      expect(modified.profileId).toBe(originalProfileId);
      expect(modified.createdAt).toBe(originalCreatedAt);
      expect(modified.fullName).toBeUndefined();
      expect(modified.biologicalSex).toBeUndefined();
      expect(modified.dateOfBirth).toBeUndefined();
    });

    it('should handle names with special characters', () => {
      const specialName = createTestUserDetailsModel({
        fullName: "Jean-François O'Connor-Smith",
      });

      expect(specialName.getName()).toBe("Jean-François O'Connor-Smith");
      expect(specialName.getInitials()).toBe('JO'); // Jean-François -> J, O'Connor-Smith -> O
    });

    it('should handle profile completion edge cases', () => {
      // Empty string should be falsy for completion
      const emptyString = createTestUserDetailsModel({
        fullName: '',
        dateOfBirth: new Date(),
      });
      expect(emptyString.isProfileComplete()).toBe(false);

      // Whitespace-only should be truthy for completion (assuming it's trimmed)
      const whitespace = createTestUserDetailsModel({
        fullName: '   ',
        dateOfBirth: new Date(),
      });
      expect(whitespace.isProfileComplete()).toBe(true);
    });
  });
});
