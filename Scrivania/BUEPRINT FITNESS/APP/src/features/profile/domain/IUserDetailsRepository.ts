import { UserDetailsModel } from './UserDetailsModel';

/** Defines the contract for user details data persistence. */
export interface IUserDetailsRepository {
  save(details: UserDetailsModel): Promise<UserDetailsModel>;
  findByProfileId(profileId: string): Promise<UserDetailsModel | undefined>;
}
