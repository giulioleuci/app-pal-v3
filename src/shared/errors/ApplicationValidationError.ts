import { ApplicationError } from '@/shared/errors/ApplicationError';
import { I18nKeys } from '@/shared/locales/i18n.generated';

/** Thrown when data validation fails at the application service level. */
export class ApplicationValidationError extends ApplicationError {
  constructor(public readonly message: I18nKeys) {
    super(message);
    this.name = 'ApplicationValidationError';
  }
}
