import { useTranslation } from 'react-i18next';

import { I18nKeys } from './i18n.generated';

/**
 * A custom hook that provides a type-safe `t` function for translations.
 * This should be used in all components to ensure compile-time safety for i18n keys.
 * The generated `I18nKeys` type supports the nested, namespaced structure.
 */
export const useAppTranslation = () => {
  const { t, i18n: i18nInstance } = useTranslation();

  return {
    t: (key: I18nKeys, options?: Record<string, unknown>) => t(key, options),
    i18n: i18nInstance,
  };
};
