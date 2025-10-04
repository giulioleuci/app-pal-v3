import { ApplicationError } from '@/shared/errors/ApplicationError';
import { I18nKeys } from '@/shared/locales/i18n.generated';

/** Thrown when an operation violates a unique constraint (e.g., creating a duplicate). */
export class ConflictError extends ApplicationError {
  constructor(public readonly message: I18nKeys) {
    super(message);
    this.name = 'ConflictError';
  }
}
