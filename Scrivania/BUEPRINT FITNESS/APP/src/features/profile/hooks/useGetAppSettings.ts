import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

/**
 * React Query hook for fetching user application settings.
 *
 * This hook provides reactive access to user settings including theme preferences,
 * unit systems, training plan configuration, timer settings, and dashboard layout.
 *
 * @param profileId - Optional profile ID. If not provided, uses active profile
 * @param options - React Query options for customizing behavior
 * @returns Query result with user settings data
 */
export function useGetAppSettings(
  profileId?: string | null,
  options?: Partial<UseQueryOptions<UserSettingsModel | null, ApplicationError>>
) {
  const userSettingsService = container.resolve(UserSettingsService);
  const activeProfileId = useActiveProfileId();
  const targetProfileId = profileId ?? activeProfileId;

  return useQuery({
    queryKey: ['user-settings', 'app', targetProfileId],
    queryFn: async () => {
      if (!targetProfileId) {
        throw new ApplicationError('Profile ID is required');
      }

      const result = await userSettingsService.getUserSettings(targetProfileId);

      if (result.isFailure) {
        throw result.error;
      }

      return result.value;
    },
    enabled: !!targetProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    ...options,
  });
}
