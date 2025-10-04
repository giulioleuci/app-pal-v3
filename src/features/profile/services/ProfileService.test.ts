import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { IProfileRepository } from '@/features/profile/domain/IProfileRepository';
import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { ProfileCreatedEvent } from '@/shared/domain/events/ProfileCreatedEvent';
import { ProfileDeletedEvent } from '@/shared/domain/events/ProfileDeletedEvent';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { createTestProfileModel } from '@/test-factories';

import { ProfileService } from './ProfileService';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const testProfile = createTestProfileModel({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Profile',
  });

  beforeEach(() => {
    // Clear all domain event handlers before each test
    DomainEvents.clearHandlers();

    // Create mocks
    mockProfileRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    profileService = new ProfileService(mockProfileRepository, mockLogger);

    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    });

    // Mock DomainEvents.dispatch
    vi.spyOn(DomainEvents, 'dispatch');
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  describe('createProfile', () => {
    it('should successfully create a new profile', async () => {
      // Arrange
      const profileName = 'New Profile';
      const expectedProfile = createTestProfileModel({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: profileName,
      });
      mockProfileRepository.save.mockResolvedValue(expectedProfile);

      // Act
      const result = await profileService.createProfile(profileName);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedProfile);
      expect(mockProfileRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new profile', { name: profileName });
      expect(mockLogger.info).toHaveBeenCalledWith('Profile created successfully', {
        profileId: expectedProfile.id,
        name: expectedProfile.name,
      });
      expect(DomainEvents.dispatch).toHaveBeenCalledWith(expect.any(ProfileCreatedEvent));
    });

    it('should return failure when profile validation fails', async () => {
      // Arrange
      const invalidName = ''; // Empty name should fail validation
      vi.spyOn(ProfileModel.prototype, 'validate').mockReturnValue({
        success: false,
        error: { errors: ['Name is required'] },
      });

      // Act
      const result = await profileService.createProfile(invalidName);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Profile validation failed');
      expect(mockProfileRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Profile validation failed',
        undefined,
        expect.objectContaining({
          name: invalidName,
          errors: ['Name is required'],
        })
      );
      expect(DomainEvents.dispatch).not.toHaveBeenCalled();
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileName = 'Valid Profile';
      const repositoryError = new Error('Database connection failed');
      mockProfileRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await profileService.createProfile(profileName);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to create profile');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create profile', repositoryError, {
        name: profileName,
      });
      expect(DomainEvents.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should successfully retrieve a profile by ID', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      mockProfileRepository.findById.mockResolvedValue(testProfile);

      // Act
      const result = await profileService.getProfile(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(testProfile);
      expect(mockProfileRepository.findById).toHaveBeenCalledWith(profileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving profile', { profileId });
      expect(mockLogger.info).toHaveBeenCalledWith('Profile retrieved successfully', { profileId });
    });

    it('should return NotFoundError when profile does not exist', async () => {
      // Arrange
      const profileId = 'non-existent-id';
      mockProfileRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await profileService.getProfile(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Profile not found');
      expect(mockLogger.warn).toHaveBeenCalledWith('Profile not found', { profileId });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');
      mockProfileRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await profileService.getProfile(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve profile');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to retrieve profile', repositoryError, {
        profileId,
      });
    });
  });

  describe('getAllProfiles', () => {
    it('should successfully retrieve all profiles', async () => {
      // Arrange
      const profiles = [testProfile, createTestProfileModel({ id: 'profile-2' })];
      mockProfileRepository.findAll.mockResolvedValue(profiles);

      // Act
      const result = await profileService.getAllProfiles();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(profiles);
      expect(mockProfileRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving all profiles');
      expect(mockLogger.info).toHaveBeenCalledWith('All profiles retrieved successfully', {
        count: profiles.length,
      });
    });

    it('should return empty array when no profiles exist', async () => {
      // Arrange
      mockProfileRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await profileService.getAllProfiles();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('All profiles retrieved successfully', {
        count: 0,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockProfileRepository.findAll.mockRejectedValue(repositoryError);

      // Act
      const result = await profileService.getAllProfiles();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve all profiles');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve all profiles',
        repositoryError
      );
    });
  });

  describe('updateProfileName', () => {
    it('should successfully update profile name', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const newName = 'Updated Profile Name';
      const updatedProfile = testProfile.cloneWithNewName(newName);

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockProfileRepository.save.mockResolvedValue(updatedProfile);

      // Act
      const result = await profileService.updateProfileName(profileId, newName);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(updatedProfile);
      expect(mockProfileRepository.findById).toHaveBeenCalledWith(profileId);
      expect(mockProfileRepository.save).toHaveBeenCalledWith(expect.any(ProfileModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Updating profile name', { profileId, newName });
      expect(mockLogger.info).toHaveBeenCalledWith('Profile name updated successfully', {
        profileId: updatedProfile.id,
        newName: updatedProfile.name,
      });
    });

    it('should return NotFoundError when profile does not exist', async () => {
      // Arrange
      const profileId = 'non-existent-id';
      const newName = 'Updated Name';
      mockProfileRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await profileService.updateProfileName(profileId, newName);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Profile not found');
      expect(mockProfileRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Profile not found for update', { profileId });
    });

    it('should return failure when updated profile validation fails', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const invalidName = '';

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      vi.spyOn(ProfileModel.prototype, 'validate').mockReturnValue({
        success: false,
        error: { errors: ['Name is required'] },
      });

      // Act
      const result = await profileService.updateProfileName(profileId, invalidName);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Profile validation failed');
      expect(mockProfileRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Updated profile validation failed',
        undefined,
        expect.objectContaining({
          profileId,
          newName: invalidName,
          errors: ['Name is required'],
        })
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const newName = 'Updated Name';
      const repositoryError = new Error('Database error');

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockProfileRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await profileService.updateProfileName(profileId, newName);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to update profile name');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update profile name',
        repositoryError,
        { profileId, newName }
      );
    });
  });

  describe('deactivateProfile', () => {
    it('should successfully deactivate a profile', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const deactivatedProfile = testProfile.cloneAsDeactivated();

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockProfileRepository.save.mockResolvedValue(deactivatedProfile);

      // Act
      const result = await profileService.deactivateProfile(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(deactivatedProfile);
      expect(mockProfileRepository.findById).toHaveBeenCalledWith(profileId);
      expect(mockProfileRepository.save).toHaveBeenCalledWith(expect.any(ProfileModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Deactivating profile', { profileId });
      expect(mockLogger.info).toHaveBeenCalledWith('Profile deactivated successfully', {
        profileId,
      });
    });

    it('should return NotFoundError when profile does not exist', async () => {
      // Arrange
      const profileId = 'non-existent-id';
      mockProfileRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await profileService.deactivateProfile(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Profile not found');
      expect(mockProfileRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Profile not found for deactivation', {
        profileId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockProfileRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await profileService.deactivateProfile(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to deactivate profile');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to deactivate profile',
        repositoryError,
        { profileId }
      );
    });
  });

  describe('deleteProfile', () => {
    it('should successfully delete a profile', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockProfileRepository.delete.mockResolvedValue();

      // Act
      const result = await profileService.deleteProfile(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockProfileRepository.findById).toHaveBeenCalledWith(profileId);
      expect(mockProfileRepository.delete).toHaveBeenCalledWith(profileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting profile permanently', { profileId });
      expect(mockLogger.info).toHaveBeenCalledWith('Profile deleted successfully', { profileId });
      expect(DomainEvents.dispatch).toHaveBeenCalledWith(expect.any(ProfileDeletedEvent));
    });

    it('should return NotFoundError when profile does not exist', async () => {
      // Arrange
      const profileId = 'non-existent-id';
      mockProfileRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await profileService.deleteProfile(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Profile not found');
      expect(mockProfileRepository.delete).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Profile not found for deletion', { profileId });
      expect(DomainEvents.dispatch).not.toHaveBeenCalled();
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const repositoryError = new Error('Database error');

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockProfileRepository.delete.mockRejectedValue(repositoryError);

      // Act
      const result = await profileService.deleteProfile(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to delete profile');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete profile', repositoryError, {
        profileId,
      });
      expect(DomainEvents.dispatch).not.toHaveBeenCalled();
    });
  });
});
