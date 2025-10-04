import { CustomThemeModel } from './CustomThemeModel';

/** Defines the contract for custom theme data persistence. */
export interface ICustomThemeRepository {
  save(theme: CustomThemeModel): Promise<CustomThemeModel>;
  findById(id: string): Promise<CustomThemeModel | undefined>;
  findByProfileId(profileId: string): Promise<CustomThemeModel[]>;
  delete(id: string): Promise<void>;
}
