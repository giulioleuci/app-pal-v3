import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { IUserSettingsRepository } from '@/features/profile/domain/IUserSettingsRepository';
import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating user settings operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to user settings management.
 */
@injectable()
export class UserSettingsService {
  constructor(
    @inject('IUserSettingsRepository')
    private readonly userSettingsRepository: IUserSettingsRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Retrieves user settings for a specific profile.
   * @param profileId The profile ID to get settings for
   * @returns A Result containing the UserSettingsModel or an error
   */
  async getUserSettings(
    profileId: string
  ): Promise<Result<UserSettingsModel | null, ApplicationError>> {
    try {
      this.logger.info('Retrieving user settings', { profileId });

      const settings = await this.userSettingsRepository.findByProfileId(profileId);

      this.logger.info('User settings retrieved successfully', {
        profileId,
        found: !!settings,
      });

      return Result.success(settings || null);
    } catch (_error) {
      this.logger.error('Failed to retrieve user settings', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve user settings', _error));
    }
  }

  /**
   * Saves user settings for a profile.
   * @param settings The UserSettingsModel to save
   * @returns A Result containing the saved UserSettingsModel or an error
   */
  async saveUserSettings(
    settings: UserSettingsModel
  ): Promise<Result<UserSettingsModel, ApplicationError>> {
    try {
      this.logger.info('Saving user settings', {
        profileId: settings.profileId,
        settingsId: settings.id,
      });

      const validation = settings.validate();
      if (!validation.success) {
        this.logger.error('User settings validation failed', undefined, {
          profileId: settings.profileId,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('User settings validation failed', validation.error.errors)
        );
      }

      const savedSettings = await this.userSettingsRepository.save(settings);

      this.logger.info('User settings saved successfully', {
        profileId: savedSettings.profileId,
        settingsId: savedSettings.id,
      });

      return Result.success(savedSettings);
    } catch (_error) {
      this.logger.error('Failed to save user settings', _error as Error, {
        profileId: settings.profileId,
        settingsId: settings.id,
      });
      return Result.failure(new ApplicationError('Failed to save user settings', _error));
    }
  }
}
