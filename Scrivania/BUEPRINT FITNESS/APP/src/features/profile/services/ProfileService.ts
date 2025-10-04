import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { IProfileRepository } from '@/features/profile/domain/IProfileRepository';
import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { ProfileCreatedEvent } from '@/shared/domain/events/ProfileCreatedEvent';
import { ProfileDeletedEvent } from '@/shared/domain/events/ProfileDeletedEvent';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating profile-related operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to user profile management.
 */
@injectable()
export class ProfileService {
  constructor(
    @inject('IProfileRepository') private readonly profileRepository: IProfileRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Creates a new user profile and dispatches a ProfileCreatedEvent.
   * @param name The profile name
   * @returns A Result containing the created ProfileModel or an error
   */
  async createProfile(name: string): Promise<Result<ProfileModel, ApplicationError>> {
    try {
      this.logger.info('Creating new profile', { name });

      const profileData = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const profile = ProfileModel.hydrate(profileData);
      const validation = profile.validate();

      if (!validation.success) {
        this.logger.error('Profile validation failed', validation.error, {
          name,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('errors.profile.validation.failed' as any)
        );
      }

      const savedProfile = await this.profileRepository.save(profile);

      // Dispatch domain event for sample data population
      DomainEvents.dispatch(new ProfileCreatedEvent(savedProfile));

      this.logger.info('Profile created successfully', {
        profileId: savedProfile.id,
        name: savedProfile.name,
      });

      return Result.success(savedProfile);
    } catch (_error) {
      this.logger.error('Failed to create profile', _error as Error, { name });
      return Result.failure(new ApplicationError('Failed to create profile', _error));
    }
  }

  /**
   * Retrieves a profile by its unique identifier.
   * @param profileId The profile ID to search for
   * @returns A Result containing the ProfileModel or an error
   */
  async getProfile(profileId: string): Promise<Result<ProfileModel, ApplicationError>> {
    try {
      this.logger.info('Retrieving profile', { profileId });

      const profile = await this.profileRepository.findById(profileId);
      if (!profile) {
        this.logger.warn('Profile not found', { profileId });
        return Result.failure(new NotFoundError('Profile not found'));
      }

      this.logger.info('Profile retrieved successfully', { profileId });
      return Result.success(profile);
    } catch (_error) {
      this.logger.error('Failed to retrieve profile', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve profile', _error));
    }
  }

  /**
   * Retrieves all profiles from the system.
   * @returns A Result containing an array of ProfileModels or an error
   */
  async getAllProfiles(): Promise<Result<ProfileModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving all profiles');

      const profiles = await this.profileRepository.findAll();

      this.logger.info('All profiles retrieved successfully', {
        count: profiles.length,
      });

      return Result.success(profiles);
    } catch (_error) {
      this.logger.error('Failed to retrieve all profiles', _error as Error);
      return Result.failure(new ApplicationError('Failed to retrieve all profiles', _error));
    }
  }

  /**
   * Updates a profile's name.
   * @param profileId The profile ID to update
   * @param newName The new name for the profile
   * @returns A Result containing the updated ProfileModel or an error
   */
  async updateProfileName(
    profileId: string,
    newName: string
  ): Promise<Result<ProfileModel, ApplicationError>> {
    try {
      this.logger.info('Updating profile name', { profileId, newName });

      const profile = await this.profileRepository.findById(profileId);
      if (!profile) {
        this.logger.warn('Profile not found for update', { profileId });
        return Result.failure(new NotFoundError('Profile not found'));
      }

      const updatedProfile = profile.cloneWithNewName(newName);
      const validation = updatedProfile.validate();

      if (!validation.success) {
        this.logger.error('Updated profile validation failed', validation.error, {
          profileId,
          newName,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('errors.profile.validation.failed' as any)
        );
      }

      const savedProfile = await this.profileRepository.save(updatedProfile);

      this.logger.info('Profile name updated successfully', {
        profileId: savedProfile.id,
        newName: savedProfile.name,
      });

      return Result.success(savedProfile);
    } catch (_error) {
      this.logger.error('Failed to update profile name', _error as Error, {
        profileId,
        newName,
      });
      return Result.failure(new ApplicationError('Failed to update profile name', _error));
    }
  }

  /**
   * Deactivates a profile (soft delete).
   * @param profileId The profile ID to deactivate
   * @returns A Result containing the deactivated ProfileModel or an error
   */
  async deactivateProfile(profileId: string): Promise<Result<ProfileModel, ApplicationError>> {
    try {
      this.logger.info('Deactivating profile', { profileId });

      const profile = await this.profileRepository.findById(profileId);
      if (!profile) {
        this.logger.warn('Profile not found for deactivation', { profileId });
        return Result.failure(new NotFoundError('Profile not found'));
      }

      const deactivatedProfile = profile.cloneAsDeactivated();
      const savedProfile = await this.profileRepository.save(deactivatedProfile);

      this.logger.info('Profile deactivated successfully', { profileId });
      return Result.success(savedProfile);
    } catch (_error) {
      this.logger.error('Failed to deactivate profile', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to deactivate profile', _error));
    }
  }

  /**
   * Permanently deletes a profile from the system.
   * @param profileId The profile ID to delete
   * @returns A Result indicating success or failure
   */
  async deleteProfile(profileId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting profile permanently', { profileId });

      const profile = await this.profileRepository.findById(profileId);
      if (!profile) {
        this.logger.warn('Profile not found for deletion', { profileId });
        return Result.failure(new NotFoundError('Profile not found'));
      }

      await this.profileRepository.delete(profileId);

      // Dispatch domain event for cleanup operations
      DomainEvents.dispatch(new ProfileDeletedEvent(profile));

      this.logger.info('Profile deleted successfully', { profileId });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete profile', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to delete profile', _error));
    }
  }
}
