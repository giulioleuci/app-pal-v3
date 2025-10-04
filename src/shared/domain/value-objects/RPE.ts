import { BusinessRuleError } from '@/shared/errors';

/**
 * A Value Object representing Rate of Perceived Exertion.
 */
export class RPE {
  constructor(public readonly value: number) {
    if (value < 1 || value > 10) {
      throw new BusinessRuleError('errors.domain.rpe.invalidRange');
    }
    Object.freeze(this);
  }
}
