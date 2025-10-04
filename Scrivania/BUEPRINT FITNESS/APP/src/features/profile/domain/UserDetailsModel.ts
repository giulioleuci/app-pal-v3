import { differenceInDays, format, isAfter, isToday, subYears } from 'date-fns';
import { produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { UserAge, UserDateOfBirth } from '@/shared/domain/value-objects';
import { type UserDetailsData, userDetailsSchema } from '@/shared/types';

/**
 * A domain model representing detailed user information.
 * Contains personal details like name, biological sex, and date of birth.
 */
export class UserDetailsModel extends BaseModel<UserDetailsData> {
  public readonly profileId: string;
  public readonly fullName?: string;
  public readonly biologicalSex?: 'male' | 'female';
  public readonly dateOfBirth?: UserDateOfBirth;

  protected constructor(props: UserDetailsData) {
    super(props);
    this.profileId = props.profileId;
    this.fullName = props.fullName;
    this.biologicalSex = props.biologicalSex;
    this.dateOfBirth = props.dateOfBirth ? new UserDateOfBirth(props.dateOfBirth) : undefined;
  }

  /**
   * Creates a new UserDetailsModel instance from plain data.
   * @param props The user details data to hydrate from
   * @returns A new UserDetailsModel instance
   */
  public static hydrate(props: UserDetailsData): UserDetailsModel {
    return new UserDetailsModel(props);
  }

  /**
   * Calculates and returns the user's age based on their date of birth.
   * @returns The user's age as a UserAge value object, or null if no date of birth is set
   */
  getAge(): UserAge | null {
    return this.dateOfBirth ? this.dateOfBirth.calculateAge() : null;
  }

  /**
   * Gets the user's full name.
   * @returns The full name or null if not set
   */
  getName(): string | null {
    return this.fullName !== undefined ? this.fullName : null;
  }

  /**
   * Gets the user's initials from their full name.
   * @returns The initials in uppercase, or null if no full name is set
   */
  getInitials(): string | null {
    if (!this.fullName) return null;
    return this.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  /**
   * Checks if today is the user's birthday.
   * @returns True if today matches the user's date of birth
   */
  isBirthdayToday(): boolean {
    return !!this.dateOfBirth && isToday(this.dateOfBirth.value);
  }

  /**
   * Gets the user's age in days.
   * @returns The number of days since birth, or null if no date of birth is set
   */
  getAgeInDays(): number | null {
    if (!this.dateOfBirth) return null;
    return differenceInDays(new Date(), this.dateOfBirth.value);
  }

  /**
   * Private helper method to create updated instances with common logic.
   * @param updates Partial updates to apply
   * @returns A new UserDetailsModel instance with the updates
   */
  private createUpdatedInstance(updates: Partial<UserDetailsData>): UserDetailsModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return UserDetailsModel.hydrate(newData);
  }

  /**
   * Creates a new details instance with an updated full name.
   * @param newName The new full name
   * @returns A new UserDetailsModel instance with the updated name
   */
  cloneWithNewFullName(newName: string): UserDetailsModel {
    return this.createUpdatedInstance({ fullName: newName });
  }

  /**
   * Creates a new details instance with an updated date of birth.
   * @param newDob The new date of birth
   * @returns A new UserDetailsModel instance with the updated date of birth
   */
  cloneWithNewDateOfBirth(newDob: Date): UserDetailsModel {
    return this.createUpdatedInstance({ dateOfBirth: newDob });
  }

  /**
   * Creates a new details instance with an updated biological sex.
   * @param newSex The new biological sex
   * @returns A new UserDetailsModel instance with the updated biological sex
   */
  cloneWithNewBiologicalSex(newSex: 'male' | 'female'): UserDetailsModel {
    return this.createUpdatedInstance({ biologicalSex: newSex });
  }

  /**
   * Creates a new details instance with merged partial details.
   * @param details Partial details to merge
   * @returns A new UserDetailsModel instance with the merged details
   */
  cloneWithMergedDetails(details: Partial<UserDetailsData>): UserDetailsModel {
    return this.createUpdatedInstance(details);
  }

  /**
   * Creates a new details instance with all optional fields cleared.
   * @returns A new UserDetailsModel instance with cleared optional fields
   */
  cloneWithClearedOptionalFields(): UserDetailsModel {
    return this.createUpdatedInstance({
      fullName: undefined,
      dateOfBirth: undefined,
      biologicalSex: undefined,
    });
  }

  /**
   * Checks if the user profile has all required information for completion.
   * @returns True if both full name and date of birth are provided
   */
  isProfileComplete(): boolean {
    return !!this.fullName && !!this.dateOfBirth;
  }

  /**
   * Checks if the user is considered an adult (18 years or older).
   * @returns True if the user is 18 years or older, false if under 18 or no date of birth
   */
  isAdult(): boolean {
    if (!this.dateOfBirth) return false;
    const adultAgeDate = subYears(new Date(), 18);
    return !isAfter(this.dateOfBirth.value, adultAgeDate);
  }

  /**
   * Checks if the user has a date of birth set.
   * @returns True if date of birth is present
   */
  hasDateOfBirth(): boolean {
    return !!this.dateOfBirth;
  }

  /**
   * Gets the formatted date of birth string.
   * @param formatString The format string to use (e.g., 'yyyy-MM-dd')
   * @returns The formatted date string, or null if no date of birth is set
   */
  getFormattedDateOfBirth(formatString: string): string | null {
    if (!this.dateOfBirth) return null;
    return format(this.dateOfBirth.value, formatString);
  }

  /**
   * Compares this user's details with another for equality.
   * @param other The other UserDetailsModel to compare with
   * @returns True if all detail fields match
   */
  hasSameDetails(other: UserDetailsModel): boolean {
    return (
      this.fullName === other.fullName &&
      this.biologicalSex === other.biologicalSex &&
      this.dateOfBirth?.value.getTime() === other.dateOfBirth?.value.getTime()
    );
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this UserDetailsModel
   */
  clone(): this {
    return UserDetailsModel.hydrate(this.toPlainObject()) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain UserDetailsData object
   */
  toPlainObject(): UserDetailsData {
    return {
      id: this.id,
      profileId: this.profileId,
      fullName: this.fullName,
      biologicalSex: this.biologicalSex,
      dateOfBirth: this.dateOfBirth?.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return userDetailsSchema.safeParse(this.toPlainObject());
  }
}
