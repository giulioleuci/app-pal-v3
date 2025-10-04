import { differenceInYears } from 'date-fns';

import { UserAge } from './UserAge';

/**
 * A Value Object representing a user's date of birth.
 */
export class UserDateOfBirth {
  constructor(public readonly value: Date) {
    Object.freeze(this);
  }

  public calculateAge(): UserAge {
    const age = differenceInYears(new Date(), this.value);
    return new UserAge(age);
  }
}
