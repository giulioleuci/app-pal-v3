import { BusinessRuleError } from '@/shared/errors/BusinessRuleError';
import { I18nKeys } from '@/shared/locales/i18n.generated';

/** Thrown when weight or counts are invalid for a calculation. */
export class InvalidWeightOrCountsError extends BusinessRuleError {
  constructor(message: I18nKeys) {
    super(message);
    this.name = 'InvalidWeightOrCountsError';
  }
}
