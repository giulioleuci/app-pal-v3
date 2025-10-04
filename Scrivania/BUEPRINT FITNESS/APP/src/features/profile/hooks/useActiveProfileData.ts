import { UserDetailsModel } from '@/features/profile/domain/UserDetailsModel';
import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

import { useUserData } from './useUserData';

/**
 * Combined state interface for the active profile data.
 */
export interface ActiveProfileData {
  settings: UserSettingsModel | undefined;
  details: UserDetailsModel | undefined;
}

/**
 * Combined result interface for the active profile data hook.
 */
export interface UseActiveProfileDataResult {
  /** Combined data object containing settings and details */
  data: ActiveProfileData | undefined;
  /** True if any of the underlying queries are currently loading */
  isLoading: boolean;
  /** True if any of the underlying queries are in an error state */
  isError: boolean;
  /** The first error encountered from the underlying queries */
  error: ApplicationError | null;
  /** True if there is no active profile selected */
  hasNoActiveProfile: boolean;
  /** True if all queries have completed successfully and data is available */
  isSuccess: boolean;
  /** True if any of the underlying queries are currently fetching */
  isFetching: boolean;
}

/**
 * Aggregate React Query hook that provides all commonly needed data for the active profile.
 *
 * This hook combines the results of multiple profile-related queries into a single,
 * unified interface. It provides intelligent state aggregation, combining loading states,
 * errors, and success states from the underlying queries.
 *
 * The hook automatically fetches user settings and details for the currently active
 * profile ID from the profile store. If no profile is active, all queries are disabled
 * and the hook returns appropriate empty states.
 *
 * @returns Combined result with unified loading states, errors, and data
 */
export function useActiveProfileData(): UseActiveProfileDataResult {
  const activeProfileId = useActiveProfileId();

  const { userDetails, userSettings, isLoaded, detailsError, settingsError } = useUserData();

  // If no active profile, return early with empty state
  if (!activeProfileId) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      hasNoActiveProfile: true,
      isSuccess: false,
      isFetching: false,
    };
  }

  // Aggregate loading states - true if data is not loaded
  const isLoading = !isLoaded;

  // Aggregate fetching states - using loading for consistency
  const isFetching = !isLoaded;

  // Aggregate error states - true if any error exists
  const isError = !!(detailsError || settingsError);

  // Get the first error encountered
  const error = detailsError || settingsError || null;

  // Aggregate success states - true if loaded successfully
  const isSuccess = isLoaded && !isError;

  // Combine the data from user data hook
  const data: ActiveProfileData | undefined = isLoaded
    ? {
        settings: userSettings as any, // Type conversion for compatibility
        details: userDetails as any, // Type conversion for compatibility
      }
    : undefined;

  return {
    data,
    isLoading,
    isError,
    error,
    hasNoActiveProfile: false,
    isSuccess,
    isFetching,
  };
}
