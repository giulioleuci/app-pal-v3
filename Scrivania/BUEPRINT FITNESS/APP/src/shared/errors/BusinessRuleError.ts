import { ApplicationError } from '@/shared/errors/ApplicationError';
import { I18nKeys } from '@/shared/locales/i18n.generated';

/** Thrown when a business rule is violated. */
export class BusinessRuleError extends ApplicationError {
  constructor(public readonly message: I18nKeys) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}
