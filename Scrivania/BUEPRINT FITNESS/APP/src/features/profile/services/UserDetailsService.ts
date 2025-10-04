import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { IUserDetailsRepository } from '@/features/profile/domain/IUserDetailsRepository';
import { UserDetailsModel } from '@/features/profile/domain/UserDetailsModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating user details operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to user details management.
 */
@injectable()
export class UserDetailsService {
  constructor(
    @inject('IUserDetailsRepository')
    private readonly userDetailsRepository: IUserDetailsRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Retrieves user details for a specific profile.
   * @param profileId The profile ID to get details for
   * @returns A Result containing the UserDetailsModel or an error
   */
  async getUserDetails(
    profileId: string
  ): Promise<Result<UserDetailsModel | null, ApplicationError>> {
    try {
      this.logger.info('Retrieving user details', { profileId });

      const details = await this.userDetailsRepository.findByProfileId(profileId);

      this.logger.info('User details retrieved successfully', {
        profileId,
        found: !!details,
      });

      return Result.success(details || null);
    } catch (_error) {
      this.logger.error('Failed to retrieve user details', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve user details', _error));
    }
  }

  /**
   * Saves user details for a profile.
   * @param details The UserDetailsModel to save
   * @returns A Result containing the saved UserDetailsModel or an error
   */
  async saveUserDetails(
    details: UserDetailsModel
  ): Promise<Result<UserDetailsModel, ApplicationError>> {
    try {
      this.logger.info('Saving user details', {
        profileId: details.profileId,
        detailsId: details.id,
      });

      const validation = details.validate();
      if (!validation.success) {
        this.logger.error('User details validation failed', undefined, {
          profileId: details.profileId,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('User details validation failed', validation.error.errors)
        );
      }

      const savedDetails = await this.userDetailsRepository.save(details);

      this.logger.info('User details saved successfully', {
        profileId: savedDetails.profileId,
        detailsId: savedDetails.id,
      });

      return Result.success(savedDetails);
    } catch (_error) {
      this.logger.error('Failed to save user details', _error as Error, {
        profileId: details.profileId,
        detailsId: details.id,
      });
      return Result.failure(new ApplicationError('Failed to save user details', _error));
    }
  }
}
