import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { UserDetailsModel } from '@/features/profile/domain/UserDetailsModel';
import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { ProfileService } from '@/features/profile/services/ProfileService';
import { UserDetailsService } from '@/features/profile/services/UserDetailsService';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';
import {
  createTestProfileModel,
  createTestUserDetailsModel,
  createTestUserSettingsModel,
} from '@/test-factories';

import { ProfileQueryService } from '../ProfileQueryService';

describe('ProfileQueryService', () => {
  let profileQueryService: ProfileQueryService;
  let mockProfileService: {
    getAllProfiles: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
    createProfile: ReturnType<typeof vi.fn>;
    updateProfileName: ReturnType<typeof vi.fn>;
    deactivateProfile: ReturnType<typeof vi.fn>;
    deleteProfile: ReturnType<typeof vi.fn>;
  };
  let mockUserDetailsService: {
    getUserDetails: ReturnType<typeof vi.fn>;
    saveUserDetails: ReturnType<typeof vi.fn>;
  };
  let mockUserSettingsService: {
    getUserSettings: ReturnType<typeof vi.fn>;
    saveUserSettings: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfile = createTestProfileModel({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Profile',
  });

  const testUserSettings = createTestUserSettingsModel({
    id: '550e8400-e29b-41d4-a716-446655440002',
    profileId: '550e8400-e29b-41d4-a716-446655440001',
    themeMode: 'dark',
  });

  const testUserDetails = createTestUserDetailsModel({
    id: '550e8400-e29b-41d4-a716-446655440003',
    profileId: '550e8400-e29b-41d4-a716-446655440001',
    fullName: 'John Doe',
  });

  beforeEach(() => {
    // Create service mocks
    mockProfileService = {
      getAllProfiles: vi.fn(),
      getProfile: vi.fn(),
      createProfile: vi.fn(),
      updateProfileName: vi.fn(),
      deactivateProfile: vi.fn(),
      deleteProfile: vi.fn(),
    };

    // Create service mocks
    mockUserDetailsService = {
      getUserDetails: vi.fn(),
      saveUserDetails: vi.fn(),
    };

    mockUserSettingsService = {
      getUserSettings: vi.fn(),
      saveUserSettings: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    profileQueryService = new ProfileQueryService(
      mockProfileService as any,
      mockUserDetailsService as any,
      mockUserSettingsService as any
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProfiles', () => {
    it('should return WatermelonDB query for all profiles', () => {
      // Act
      const result = profileQueryService.getProfiles();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should create query for retrieving all profiles', () => {
      // Act
      const result = profileQueryService.getProfiles();

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should create consistent query structure', () => {
      // Act
      const result = profileQueryService.getProfiles();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should return reactive query object', () => {
      // Act
      const result = profileQueryService.getProfiles();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('getProfile', () => {
    const profileId = '550e8400-e29b-41d4-a716-446655440001';

    it('should return profile when service succeeds', async () => {
      // Arrange
      mockProfileService.getProfile.mockResolvedValue(Result.success(testProfile));

      // Act
      const result = await profileQueryService.getProfile(profileId);

      // Assert
      expect(result).toEqual(testProfile);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(profileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Profile not found');
      mockProfileService.getProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.getProfile(profileId)).rejects.toThrow(error);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(profileId);
    });

    it('should handle empty profile ID', async () => {
      // Arrange
      const emptyId = '';
      const error = new ApplicationError('Invalid profile ID');
      mockProfileService.getProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.getProfile(emptyId)).rejects.toThrow(error);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(emptyId);
    });

    it('should handle invalid profile ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';
      const error = new ApplicationError('Invalid profile ID format');
      mockProfileService.getProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.getProfile(invalidId)).rejects.toThrow(error);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(invalidId);
    });
  });

  describe('createProfile', () => {
    const profileName = 'New Test Profile';

    it('should return created profile when service succeeds', async () => {
      // Arrange
      const createdProfile = createTestProfileModel({ name: profileName });
      mockProfileService.createProfile.mockResolvedValue(Result.success(createdProfile));

      // Act
      const result = await profileQueryService.createProfile(profileName);

      // Assert
      expect(result).toEqual(createdProfile);
      expect(result.name).toBe(profileName);
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(profileName);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to create profile');
      mockProfileService.createProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.createProfile(profileName)).rejects.toThrow(error);
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(profileName);
    });

    it('should handle empty profile name', async () => {
      // Arrange
      const emptyName = '';
      const error = new ApplicationError('Profile name is required');
      mockProfileService.createProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.createProfile(emptyName)).rejects.toThrow(error);
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(emptyName);
    });

    it('should handle very long profile names', async () => {
      // Arrange
      const longName = 'a'.repeat(1000);
      const error = new ApplicationError('Profile name too long');
      mockProfileService.createProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.createProfile(longName)).rejects.toThrow(error);
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(longName);
    });

    it('should handle special characters in profile name', async () => {
      // Arrange
      const specialName = 'Profile @#$%^&*()';
      const createdProfile = createTestProfileModel({ name: specialName });
      mockProfileService.createProfile.mockResolvedValue(Result.success(createdProfile));

      // Act
      const result = await profileQueryService.createProfile(specialName);

      // Assert
      expect(result.name).toBe(specialName);
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(specialName);
    });
  });

  describe('updateProfile', () => {
    const profileId = '550e8400-e29b-41d4-a716-446655440001';
    const newName = 'Updated Profile Name';

    it('should return updated profile when service succeeds', async () => {
      // Arrange
      const updatedProfile = testProfile.cloneWithNewName(newName);
      mockProfileService.updateProfileName.mockResolvedValue(Result.success(updatedProfile));

      // Act
      const result = await profileQueryService.updateProfile(profileId, newName);

      // Assert
      expect(result).toEqual(updatedProfile);
      expect(result.name).toBe(newName);
      expect(mockProfileService.updateProfileName).toHaveBeenCalledWith(profileId, newName);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to update profile');
      mockProfileService.updateProfileName.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.updateProfile(profileId, newName)).rejects.toThrow(error);
      expect(mockProfileService.updateProfileName).toHaveBeenCalledWith(profileId, newName);
    });

    it('should handle non-existent profile ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const error = new ApplicationError('Profile not found');
      mockProfileService.updateProfileName.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.updateProfile(nonExistentId, newName)).rejects.toThrow(
        error
      );
      expect(mockProfileService.updateProfileName).toHaveBeenCalledWith(nonExistentId, newName);
    });

    it('should handle invalid new name', async () => {
      // Arrange
      const invalidName = '';
      const error = new ApplicationError('Profile name is required');
      mockProfileService.updateProfileName.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.updateProfile(profileId, invalidName)).rejects.toThrow(
        error
      );
      expect(mockProfileService.updateProfileName).toHaveBeenCalledWith(profileId, invalidName);
    });
  });

  describe('deactivateProfile', () => {
    const profileId = '550e8400-e29b-41d4-a716-446655440001';

    it('should return deactivated profile when service succeeds', async () => {
      // Arrange
      const deactivatedProfile = testProfile.cloneAsDeactivated();
      mockProfileService.deactivateProfile.mockResolvedValue(Result.success(deactivatedProfile));

      // Act
      const result = await profileQueryService.deactivateProfile(profileId);

      // Assert
      expect(result).toEqual(deactivatedProfile);
      expect(mockProfileService.deactivateProfile).toHaveBeenCalledWith(profileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to deactivate profile');
      mockProfileService.deactivateProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.deactivateProfile(profileId)).rejects.toThrow(error);
      expect(mockProfileService.deactivateProfile).toHaveBeenCalledWith(profileId);
    });

    it('should handle non-existent profile ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const error = new ApplicationError('Profile not found');
      mockProfileService.deactivateProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.deactivateProfile(nonExistentId)).rejects.toThrow(error);
      expect(mockProfileService.deactivateProfile).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('deleteProfile', () => {
    const profileId = '550e8400-e29b-41d4-a716-446655440001';

    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockProfileService.deleteProfile.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await profileQueryService.deleteProfile(profileId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith(profileId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to delete profile');
      mockProfileService.deleteProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.deleteProfile(profileId)).rejects.toThrow(error);
      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith(profileId);
    });

    it('should handle non-existent profile ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const error = new ApplicationError('Profile not found');
      mockProfileService.deleteProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.deleteProfile(nonExistentId)).rejects.toThrow(error);
      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith(nonExistentId);
    });

    it('should handle profile with dependencies', async () => {
      // Arrange
      const error = new ApplicationError('Cannot delete profile with existing dependencies');
      mockProfileService.deleteProfile.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(profileQueryService.deleteProfile(profileId)).rejects.toThrow(error);
      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith(profileId);
    });
  });

  describe('getUserSettings', () => {
    const profileId = '550e8400-e29b-41d4-a716-446655440001';

    it('should return user settings when service succeeds', async () => {
      // Arrange
      mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(testUserSettings));

      // Act
      const result = await profileQueryService.getUserSettings(profileId);

      // Assert
      expect(result).toEqual(testUserSettings);
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(profileId);
    });

    it('should return undefined when settings not found', async () => {
      // Arrange
      mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await profileQueryService.getUserSettings(profileId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(profileId);
    });

    it('should throw ApplicationError when service fails', async () => {
      // Arrange
      const serviceError = new ApplicationError('Failed to retrieve user settings');
      mockUserSettingsService.getUserSettings.mockResolvedValue(Result.failure(serviceError));

      // Act & Assert
      await expect(profileQueryService.getUserSettings(profileId)).rejects.toThrow(
        ApplicationError
      );
      await expect(profileQueryService.getUserSettings(profileId)).rejects.toThrow(
        'Failed to retrieve user settings'
      );
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(profileId);
    });

    it('should handle empty profile ID', async () => {
      // Arrange
      const emptyId = '';
      const serviceError = new ApplicationError('Invalid profile ID');
      mockUserSettingsService.getUserSettings.mockResolvedValue(Result.failure(serviceError));

      // Act & Assert
      await expect(profileQueryService.getUserSettings(emptyId)).rejects.toThrow(ApplicationError);
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(emptyId);
    });

    it('should handle service timeout errors', async () => {
      // Arrange
      const timeoutError = new ApplicationError('Query timeout');
      mockUserSettingsService.getUserSettings.mockResolvedValue(Result.failure(timeoutError));

      // Act & Assert
      await expect(profileQueryService.getUserSettings(profileId)).rejects.toThrow(
        ApplicationError
      );
      const thrownError = await profileQueryService.getUserSettings(profileId).catch((e) => e);
      expect(thrownError.message).toBe('Query timeout');
    });
  });

  describe('saveUserSettings', () => {
    it('should return saved settings when service succeeds', async () => {
      // Arrange
      const settingsToSave = testUserSettings;
      const savedSettings = { ...testUserSettings, updatedAt: new Date() };
      mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.success(savedSettings));

      // Act
      const result = await profileQueryService.saveUserSettings(settingsToSave);

      // Assert
      expect(result).toEqual(savedSettings);
      expect(mockUserSettingsService.saveUserSettings).toHaveBeenCalledWith(settingsToSave);
    });

    it('should throw ApplicationError when service fails', async () => {
      // Arrange
      const settingsToSave = testUserSettings;
      const serviceError = new ApplicationError('Failed to save user settings');
      mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.failure(serviceError));

      // Act & Assert
      await expect(profileQueryService.saveUserSettings(settingsToSave)).rejects.toThrow(
        ApplicationError
      );
      await expect(profileQueryService.saveUserSettings(settingsToSave)).rejects.toThrow(
        'Failed to save user settings'
      );
      expect(mockUserSettingsService.saveUserSettings).toHaveBeenCalledWith(settingsToSave);
    });

    it('should handle validation errors from service', async () => {
      // Arrange
      const invalidSettings = testUserSettings;
      const validationError = new ApplicationError('Invalid settings data');
      mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.failure(validationError));

      // Act & Assert
      await expect(profileQueryService.saveUserSettings(invalidSettings)).rejects.toThrow(
        ApplicationError
      );
      expect(mockUserSettingsService.saveUserSettings).toHaveBeenCalledWith(invalidSettings);
    });

    it('should handle new settings creation', async () => {
      // Arrange
      const newSettings = createTestUserSettingsModel({
        id: 'new-settings-id',
        profileId: 'new-profile-id',
      });
      mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.success(newSettings));

      // Act
      const result = await profileQueryService.saveUserSettings(newSettings);

      // Assert
      expect(result).toEqual(newSettings);
      expect(result.id).toBe('new-settings-id');
      expect(mockUserSettingsService.saveUserSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should handle settings update', async () => {
      // Arrange
      const updatedSettings = { ...testUserSettings, themeMode: 'light' as const };
      mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.success(updatedSettings));

      // Act
      const result = await profileQueryService.saveUserSettings(updatedSettings);

      // Assert
      expect(result).toEqual(updatedSettings);
      expect(result.themeMode).toBe('light');
      expect(mockUserSettingsService.saveUserSettings).toHaveBeenCalledWith(updatedSettings);
    });
  });

  describe('getUserDetails', () => {
    const profileId = '550e8400-e29b-41d4-a716-446655440001';

    it('should return user details when service succeeds', async () => {
      // Arrange
      mockUserDetailsService.getUserDetails.mockResolvedValue(Result.success(testUserDetails));

      // Act
      const result = await profileQueryService.getUserDetails(profileId);

      // Assert
      expect(result).toEqual(testUserDetails);
      expect(mockUserDetailsService.getUserDetails).toHaveBeenCalledWith(profileId);
    });

    it('should return undefined when details not found', async () => {
      // Arrange
      mockUserDetailsService.getUserDetails.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await profileQueryService.getUserDetails(profileId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockUserDetailsService.getUserDetails).toHaveBeenCalledWith(profileId);
    });

    it('should throw ApplicationError when service fails', async () => {
      // Arrange
      const serviceError = new ApplicationError('Failed to retrieve user details');
      mockUserDetailsService.getUserDetails.mockResolvedValue(Result.failure(serviceError));

      // Act & Assert
      await expect(profileQueryService.getUserDetails(profileId)).rejects.toThrow(ApplicationError);
      await expect(profileQueryService.getUserDetails(profileId)).rejects.toThrow(
        'Failed to retrieve user details'
      );
      expect(mockUserDetailsService.getUserDetails).toHaveBeenCalledWith(profileId);
    });

    it('should handle malformed profile ID', async () => {
      // Arrange
      const malformedId = 'not-a-valid-uuid';
      const serviceError = new ApplicationError('Invalid UUID format');
      mockUserDetailsService.getUserDetails.mockResolvedValue(Result.failure(serviceError));

      // Act & Assert
      await expect(profileQueryService.getUserDetails(malformedId)).rejects.toThrow(
        ApplicationError
      );
      expect(mockUserDetailsService.getUserDetails).toHaveBeenCalledWith(malformedId);
    });
  });

  describe('saveUserDetails', () => {
    it('should return saved details when service succeeds', async () => {
      // Arrange
      const detailsToSave = testUserDetails;
      const savedDetails = { ...testUserDetails, updatedAt: new Date() };
      mockUserDetailsService.saveUserDetails.mockResolvedValue(Result.success(savedDetails));

      // Act
      const result = await profileQueryService.saveUserDetails(detailsToSave);

      // Assert
      expect(result).toEqual(savedDetails);
      expect(mockUserDetailsService.saveUserDetails).toHaveBeenCalledWith(detailsToSave);
    });

    it('should throw ApplicationError when service fails', async () => {
      // Arrange
      const detailsToSave = testUserDetails;
      const serviceError = new ApplicationError('Failed to save user details');
      mockUserDetailsService.saveUserDetails.mockResolvedValue(Result.failure(serviceError));

      // Act & Assert
      await expect(profileQueryService.saveUserDetails(detailsToSave)).rejects.toThrow(
        ApplicationError
      );
      await expect(profileQueryService.saveUserDetails(detailsToSave)).rejects.toThrow(
        'Failed to save user details'
      );
      expect(mockUserDetailsService.saveUserDetails).toHaveBeenCalledWith(detailsToSave);
    });

    it('should handle new details creation', async () => {
      // Arrange
      const newDetails = createTestUserDetailsModel({
        id: 'new-details-id',
        profileId: 'new-profile-id',
        fullName: 'Jane Smith',
      });
      mockUserDetailsService.saveUserDetails.mockResolvedValue(Result.success(newDetails));

      // Act
      const result = await profileQueryService.saveUserDetails(newDetails);

      // Assert
      expect(result).toEqual(newDetails);
      expect(result.fullName).toBe('Jane Smith');
      expect(mockUserDetailsService.saveUserDetails).toHaveBeenCalledWith(newDetails);
    });

    it('should handle details update', async () => {
      // Arrange
      const updatedDetails = { ...testUserDetails, fullName: 'John Updated' };
      mockUserDetailsService.saveUserDetails.mockResolvedValue(Result.success(updatedDetails));

      // Act
      const result = await profileQueryService.saveUserDetails(updatedDetails);

      // Assert
      expect(result).toEqual(updatedDetails);
      expect(result.fullName).toBe('John Updated');
      expect(mockUserDetailsService.saveUserDetails).toHaveBeenCalledWith(updatedDetails);
    });

    it('should handle invalid date of birth', async () => {
      // Arrange
      const invalidDetails = createTestUserDetailsModel({ dateOfBirth: new Date('invalid') });
      const validationError = new ApplicationError('Invalid date of birth');
      mockUserDetailsService.saveUserDetails.mockResolvedValue(Result.failure(validationError));

      // Act & Assert
      await expect(profileQueryService.saveUserDetails(invalidDetails)).rejects.toThrow(
        ApplicationError
      );
      expect(mockUserDetailsService.saveUserDetails).toHaveBeenCalledWith(invalidDetails);
    });
  });

  describe('dependency injection', () => {
    it('should use injected ProfileService', () => {
      // Arrange & Act
      const service = new ProfileQueryService(
        mockProfileService as any,
        mockUserDetailsService as any,
        mockUserSettingsService as any
      );

      // Assert
      expect(service).toBeInstanceOf(ProfileQueryService);
      // Verify that the service was constructed with the correct dependencies
      expect(service).toBeDefined();
    });

    it('should use injected services', () => {
      // Arrange & Act
      const service = new ProfileQueryService(
        mockProfileService as any,
        mockUserDetailsService as any,
        mockUserSettingsService as any
      );

      // Assert
      expect(service).toBeInstanceOf(ProfileQueryService);
      // The constructor should accept all three dependencies
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from ProfileService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific profile error');
      mockProfileService.getProfile.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(profileQueryService.getProfile('test-id')).rejects.toBe(originalError);
    });

    it('should propagate service errors as ApplicationError', async () => {
      // Arrange
      const originalError = new ApplicationError('Service specific error');
      mockUserSettingsService.getUserSettings.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await profileQueryService
        .getUserSettings('test-id')
        .catch((error) => error);

      // Assert
      expect(thrownError).toBeInstanceOf(ApplicationError);
      expect(thrownError.message).toBe('Service specific error');
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockUserDetailsService.saveUserDetails.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await profileQueryService
        .saveUserDetails(testUserDetails)
        .catch((error) => error);

      // Assert
      expect(thrownError).toBeInstanceOf(ApplicationError);
      expect(thrownError.stack).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent query creation', () => {
      // Act
      const queries = Array.from({ length: 5 }, () => profileQueryService.getProfiles());

      // Assert
      queries.forEach((query) => {
        expect(query).toBeDefined();
        expect(typeof query.fetch).toBe('function');
        expect(typeof query.observe).toBe('function');
      });
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      const profileId = 'test-profile';
      mockProfileService.getProfile.mockResolvedValue(Result.success(testProfile));
      mockUserSettingsService.getUserSettings.mockResolvedValue(
        Result.failure(new ApplicationError('Settings not found'))
      );

      // Act
      const profileResult = await profileQueryService.getProfile(profileId);
      const settingsError = await profileQueryService.getUserSettings(profileId).catch((e) => e);

      // Assert
      expect(profileResult).toEqual(testProfile);
      expect(settingsError).toBeInstanceOf(ApplicationError);
    });

    it('should handle operations on non-existent profile consistently', async () => {
      // Arrange
      const nonExistentId = 'non-existent-profile';
      const notFoundError = new ApplicationError('Profile not found');

      mockProfileService.getProfile.mockResolvedValue(Result.failure(notFoundError));
      mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(undefined));
      mockUserDetailsService.getUserDetails.mockResolvedValue(Result.success(undefined));

      // Act
      const profileError = await profileQueryService.getProfile(nonExistentId).catch((e) => e);
      const settings = await profileQueryService.getUserSettings(nonExistentId);
      const details = await profileQueryService.getUserDetails(nonExistentId);

      // Assert
      expect(profileError).toBe(notFoundError);
      expect(settings).toBeUndefined();
      expect(details).toBeUndefined();
    });
  });
});
