/**
 * Route guard component that ensures a user profile exists before accessing protected routes.
 *
 * This component checks if an active profile has been set in the profile store.
 * If no active profile exists, it redirects to the onboarding/welcome page.
 * This prevents users from accessing the main application features
 * before completing the initial profile setup.
 */

import { Navigate, Outlet } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/routes';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

/**
 * ProfileRequiredRoute component.
 *
 * Renders child routes (via Outlet) only if an active profile exists.
 * Otherwise, redirects to the onboarding page.
 *
 * @returns The outlet for nested routes or a redirect to onboarding
 *
 * @example
 * ```tsx
 * <Route element={<ProfileRequiredRoute />}>
 *   <Route path="/dashboard" element={<DashboardPage />} />
 * </Route>
 * ```
 */
export function ProfileRequiredRoute() {
  const activeProfileId = useActiveProfileId();

  // If no active profile, redirect to onboarding
  if (!activeProfileId) {
    return <Navigate to={ROUTE_PATHS.onboarding} replace />;
  }

  // Active profile exists, render child routes
  return <Outlet />;
}
