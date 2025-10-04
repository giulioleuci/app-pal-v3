import { produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { type CustomThemeData, customThemeSchema } from '@/shared/types';

/**
 * A domain model representing a custom theme configuration.
 * Contains theme name, mode, and color scheme preferences.
 */
export class CustomThemeModel extends BaseModel<CustomThemeData> {
  public readonly profileId: string;
  public readonly name: string;
  public readonly mode: 'light' | 'dark';
  public readonly primaryColor: string;
  public readonly secondaryColor: string;

  protected constructor(props: CustomThemeData) {
    super(props);
    this.profileId = props.profileId;
    this.name = props.name;
    this.mode = props.mode;
    this.primaryColor = props.primaryColor;
    this.secondaryColor = props.secondaryColor;
  }

  /**
   * Creates a new CustomThemeModel instance from plain data.
   * @param props The custom theme data to hydrate from
   * @returns A new CustomThemeModel instance
   */
  public static hydrate(props: CustomThemeData): CustomThemeModel {
    return new CustomThemeModel(props);
  }

  /**
   * Creates a new theme instance with an updated name.
   * @param newName The new name for the theme
   * @returns A new CustomThemeModel instance with the updated name
   */
  cloneWithNewName(newName: string): CustomThemeModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).name = newName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new theme instance with an updated mode.
   * @param newMode The new theme mode ('light' or 'dark')
   * @returns A new CustomThemeModel instance with the updated mode
   */
  cloneWithNewMode(newMode: 'light' | 'dark'): CustomThemeModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).mode = newMode;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new theme instance with updated colors.
   * @param primaryColor The new primary color (hex format)
   * @param secondaryColor The new secondary color (hex format)
   * @returns A new CustomThemeModel instance with updated colors
   */
  cloneWithNewColors(primaryColor: string, secondaryColor: string): CustomThemeModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).primaryColor = primaryColor;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).secondaryColor = secondaryColor;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new theme instance with updated primary color only.
   * @param primaryColor The new primary color (hex format)
   * @returns A new CustomThemeModel instance with updated primary color
   */
  cloneWithNewPrimaryColor(primaryColor: string): CustomThemeModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).primaryColor = primaryColor;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new theme instance with updated secondary color only.
   * @param secondaryColor The new secondary color (hex format)
   * @returns A new CustomThemeModel instance with updated secondary color
   */
  cloneWithNewSecondaryColor(secondaryColor: string): CustomThemeModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).secondaryColor = secondaryColor;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Checks if this theme uses dark mode.
   * @returns True if the theme mode is 'dark'
   */
  isDarkMode(): boolean {
    return this.mode === 'dark';
  }

  /**
   * Checks if this theme uses light mode.
   * @returns True if the theme mode is 'light'
   */
  isLightMode(): boolean {
    return this.mode === 'light';
  }

  /**
   * Gets a readable display string for the theme.
   * @returns A formatted string showing theme name and mode
   */
  getDisplayName(): string {
    return `${this.name} (${this.mode})`;
  }

  /**
   * Checks if two themes have identical color schemes.
   * @param other The other CustomThemeModel to compare with
   * @returns True if both themes have the same primary and secondary colors
   */
  hasSameColors(other: CustomThemeModel): boolean {
    return this.primaryColor === other.primaryColor && this.secondaryColor === other.secondaryColor;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this CustomThemeModel
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain CustomThemeData object
   */
  toPlainObject(): CustomThemeData {
    const { id, profileId, name, mode, primaryColor, secondaryColor, createdAt, updatedAt } = this;
    return { id, profileId, name, mode, primaryColor, secondaryColor, createdAt, updatedAt };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return customThemeSchema.safeParse(this.toPlainObject());
  }
}
