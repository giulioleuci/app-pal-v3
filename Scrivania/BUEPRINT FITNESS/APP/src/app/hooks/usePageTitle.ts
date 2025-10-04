/**
 * Custom hook for managing page titles with i18n support.
 * Sets the document title based on route keys and provides consistent title formatting.
 */

import { useEffect } from 'react';

import { useAppTranslation } from '../../shared/locales/useAppTranslation';
import { ROUTES } from '../routes';

/**
 * Hook to set the page title based on a route key.
 * Updates the document.title with the translated title and app name.
 *
 * @param routeKey - The key from ROUTES object to identify the page
 * @param customTitle - Optional custom title to override the route-based title
 *
 * @example
 * ```typescript
 * // In a page component
 * usePageTitle('dashboard');
 *
 * // With custom title for dynamic pages
 * usePageTitle('profileEdit', `Edit ${profileName}`);
 * ```
 */
export const usePageTitle = (routeKey: keyof typeof ROUTES, customTitle?: string): void => {
  const { t } = useAppTranslation();

  useEffect(() => {
    let title: string;

    if (customTitle) {
      // Use custom title when provided (e.g., for dynamic content)
      title = customTitle;
    } else {
      // Get the translated title from the route configuration
      const route = ROUTES[routeKey];
      title = t(route.titleKey as any);
    }

    // Set the document title with app name suffix
    const appName = t('common.appName' as any);
    document.title = `${title} | ${appName}`;

    // Clean up function to reset title when component unmounts
    return () => {
      document.title = appName;
    };
  }, [routeKey, customTitle, t]);
};

/**
 * Hook variant for setting a completely custom page title.
 * Useful for error pages or dynamic content where route-based titles don't apply.
 *
 * @param title - The custom title to set
 *
 * @example
 * ```typescript
 * useCustomPageTitle('Page Not Found');
 * ```
 */
export const useCustomPageTitle = (title: string): void => {
  const { t } = useAppTranslation();

  useEffect(() => {
    const appName = t('common.appName' as any);
    document.title = `${title} | ${appName}`;

    return () => {
      document.title = appName;
    };
  }, [title, t]);
};

/**
 * Hook to get the current page title without setting it.
 * Useful for components that need to display the current page title.
 *
 * @param routeKey - The key from ROUTES object to identify the page
 * @returns The translated page title
 *
 * @example
 * ```typescript
 * const pageTitle = useGetPageTitle('dashboard');
 * ```
 */
export const useGetPageTitle = (routeKey: keyof typeof ROUTES): string => {
  const { t } = useAppTranslation();
  const route = ROUTES[routeKey];
  return t(route.titleKey as any);
};

/**
 * Hook to get the formatted full title (with app name).
 * Useful for sharing or meta tags.
 *
 * @param routeKey - The key from ROUTES object to identify the page
 * @param customTitle - Optional custom title to override the route-based title
 * @returns The full formatted title with app name
 *
 * @example
 * ```typescript
 * const fullTitle = useGetFullPageTitle('dashboard');
 * // Returns: "Dashboard | Blueprint Fitness"
 * ```
 */
export const useGetFullPageTitle = (
  routeKey: keyof typeof ROUTES,
  customTitle?: string
): string => {
  const { t } = useAppTranslation();

  let title: string;
  if (customTitle) {
    title = customTitle;
  } else {
    const route = ROUTES[routeKey];
    title = t(route.titleKey as any);
  }

  const appName = t('common.appName' as any);
  return `${title} | ${appName}`;
};
