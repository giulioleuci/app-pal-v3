import { BusinessRuleError } from '@/shared/errors';

/**
 * A Value Object for notes, enforcing a character limit.
 */
export class Notes {
  constructor(public readonly value: string) {
    if (value.length > 500) {
      throw new BusinessRuleError('errors.domain.notes.maxLength');
    }
    Object.freeze(this);
  }
}
