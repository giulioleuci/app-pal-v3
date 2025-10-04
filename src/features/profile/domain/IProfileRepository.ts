import { ProfileModel } from './ProfileModel';

/** Defines the contract for profile data persistence. */
export interface IProfileRepository {
  save(profile: ProfileModel): Promise<ProfileModel>;
  findById(id: string): Promise<ProfileModel | undefined>;
  findByIds(ids: string[]): Promise<ProfileModel[]>;
  findAll(): Promise<ProfileModel[]>;
  delete(id: string): Promise<void>;
}
