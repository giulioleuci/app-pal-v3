import { I18nKeys } from '@/shared/locales/i18n.generated';

/** Base class for all custom application errors. */
export class ApplicationError extends Error {
  constructor(public readonly message: I18nKeys) {
    super(message);
    this.name = 'ApplicationError';
  }
}
