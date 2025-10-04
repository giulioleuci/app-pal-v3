import { BusinessRuleError } from '@/shared/errors';

/**
 * A Value Object representing a percentage.
 */
export class Percentage {
  constructor(public readonly value: number) {
    if (value < 0 || value > 100) {
      throw new BusinessRuleError('errors.domain.percentage.invalidRange');
    }
    Object.freeze(this);
  }
}
