import { ApplicationError } from '@/shared/errors/ApplicationError';
import { I18nKeys } from '@/shared/locales/i18n.generated';

/** Thrown when a requested entity is not found. */
export class NotFoundError extends ApplicationError {
  constructor(public readonly message: I18nKeys) {
    super(message);
    this.name = 'NotFoundError';
  }
}
