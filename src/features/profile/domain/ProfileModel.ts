import { isWithinInterval, subDays } from 'date-fns';
import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { type ProfileData, profileSchema } from '@/shared/types';

/**
 * A domain model representing a user profile.
 * Contains basic profile information and provides methods for profile management.
 */
export class ProfileModel extends BaseModel<ProfileData> {
  [immerable] = true;
  public readonly name: string;
  public readonly isActive: boolean;

  protected constructor(props: ProfileData & { isActive?: boolean }) {
    super(props);
    this.name = props.name;
    this.isActive = props.isActive ?? true;
  }

  /**
   * Creates a new ProfileModel instance from plain data.
   * @param props The profile data to hydrate from
   * @returns A new ProfileModel instance
   */
  public static hydrate(props: ProfileData & { isActive?: boolean }): ProfileModel {
    return new ProfileModel(props);
  }

  /**
   * Creates a new profile instance with an updated name.
   * @param newName The new name for the profile
   * @returns A new ProfileModel instance with the updated name
   */
  cloneWithNewName(newName: string): ProfileModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).name = newName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Gets the display name for this profile.
   * @returns The profile's display name
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * Creates a new profile instance marked as deactivated.
   * @returns A new ProfileModel instance marked as inactive
   */
  cloneAsDeactivated(): ProfileModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).isActive = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new profile instance marked as reactivated.
   * @returns A new ProfileModel instance marked as active
   */
  cloneAsReactivated(): ProfileModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).isActive = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Checks if this profile was created within the specified number of days.
   * @param days The number of days to check (default: 1)
   * @returns True if the profile is considered "new"
   */
  isNew(days = 1): boolean {
    return isWithinInterval(this.createdAt, {
      start: subDays(new Date(), days),
      end: new Date(),
    });
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this ProfileModel
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain ProfileData object
   */
  toPlainObject(): ProfileData {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return profileSchema.safeParse(this.toPlainObject());
  }
}
