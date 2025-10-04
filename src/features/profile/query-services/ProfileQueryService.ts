import type { Query } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { Profile } from '@/app/db/model/Profile';
import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { UserDetailsModel } from '@/features/profile/domain/UserDetailsModel';
import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { ProfileService } from '@/features/profile/services/ProfileService';
import { UserDetailsService } from '@/features/profile/services/UserDetailsService';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Query service that acts as an adapter between the Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by application services,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all profile-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class ProfileQueryService {
  constructor(
    @inject(ProfileService) private readonly profileService: ProfileService,
    @inject(UserDetailsService) private readonly userDetailsService: UserDetailsService,
    @inject(UserSettingsService) private readonly userSettingsService: UserSettingsService
  ) {}

  /**
   * Retrieves all profiles from the system.
   * @throws {ApplicationError} When the operation fails
   * @returns Query for Profile models for reactive observation
   */
  getProfiles(): Query<Profile> {
    const collection = database.get<Profile>('profiles');
    return collection.query();
  }

  /**
   * Retrieves a reactive query for a specific profile by ID.
   * This method provides reactive observation capabilities for individual profiles,
   * automatically updating when the profile data changes.
   * @param profileId The profile ID to observe
   * @returns Query for Profile model for reactive observation
   */
  getProfileQuery(profileId: string): Query<Profile> {
    const collection = database.get<Profile>('profiles');
    return collection.query(Q.where('id', profileId));
  }

  /**
   * Retrieves a specific profile by ID.
   * @param profileId The profile ID to retrieve
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the ProfileModel
   */
  async getProfile(profileId: string): Promise<ProfileModel> {
    const result = await this.profileService.getProfile(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Creates a new profile with the given name.
   * @param name The profile name
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created ProfileModel
   */
  async createProfile(name: string): Promise<ProfileModel> {
    const result = await this.profileService.createProfile(name);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Updates a profile's name.
   * @param profileId The profile ID to update
   * @param newName The new profile name
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated ProfileModel
   */
  async updateProfile(profileId: string, newName: string): Promise<ProfileModel> {
    const result = await this.profileService.updateProfileName(profileId, newName);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Deactivates a profile (soft delete).
   * @param profileId The profile ID to deactivate
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the deactivated ProfileModel
   */
  async deactivateProfile(profileId: string): Promise<ProfileModel> {
    const result = await this.profileService.deactivateProfile(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Permanently deletes a profile from the system.
   * @param profileId The profile ID to delete
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteProfile(profileId: string): Promise<void> {
    const result = await this.profileService.deleteProfile(profileId);
    if (result.isFailure) {
      throw result.error;
    }
  }

  /**
   * Retrieves user settings for a specific profile.
   * @param profileId The profile ID to get settings for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to UserSettingsModel or undefined if not found
   */
  async getUserSettings(profileId: string): Promise<UserSettingsModel | undefined> {
    const result = await this.userSettingsService.getUserSettings(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value || undefined;
  }

  /**
   * Saves user settings for a profile.
   * @param settings The UserSettingsModel to save
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the saved UserSettingsModel
   */
  async saveUserSettings(settings: UserSettingsModel): Promise<UserSettingsModel> {
    const result = await this.userSettingsService.saveUserSettings(settings);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves user details for a specific profile.
   * @param profileId The profile ID to get details for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to UserDetailsModel or undefined if not found
   */
  async getUserDetails(profileId: string): Promise<UserDetailsModel | undefined> {
    const result = await this.userDetailsService.getUserDetails(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value || undefined;
  }

  /**
   * Saves user details for a profile.
   * @param details The UserDetailsModel to save
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the saved UserDetailsModel
   */
  async saveUserDetails(details: UserDetailsModel): Promise<UserDetailsModel> {
    const result = await this.userDetailsService.saveUserDetails(details);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }
}
