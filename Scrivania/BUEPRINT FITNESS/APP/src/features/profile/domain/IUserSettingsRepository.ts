import { UserSettingsModel } from './UserSettingsModel';

/** Defines the contract for user settings data persistence. */
export interface IUserSettingsRepository {
  save(settings: UserSettingsModel): Promise<UserSettingsModel>;
  findByProfileId(profileId: string): Promise<UserSettingsModel | undefined>;
}
