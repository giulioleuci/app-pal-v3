import { BusinessRuleError } from '@/shared/errors';

/**
 * A Value Object representing a user's age in years.
 */
export class UserAge {
  constructor(public readonly value: number) {
    if (value < 0 || !Number.isInteger(value)) {
      throw new BusinessRuleError('errors.domain.age.invalid');
    }
    Object.freeze(this);
  }
}
