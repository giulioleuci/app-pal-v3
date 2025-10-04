import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';
import { UserSettingsData } from '@/shared/types';

type SettingsUpdateData = Partial<
  Omit<UserSettingsData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>
>;

interface UpdateAppSettingsInput {
  profileId?: string;
  settings: SettingsUpdateData;
}

/**
 * React Mutation hook for updating user application settings.
 *
 * This hook provides a mutation interface for updating user settings with
 * automatic cache invalidation and optimistic updates support.
 *
 * Supports updating:
 * - Theme mode and colors
 * - Unit system and BMI formula
 * - Active training plan
 * - Timer preferences (auto-start settings)
 * - Lift mappings
 * - Dashboard layout and visibility
 *
 * @param options - React Query mutation options
 * @returns Mutation result with update functionality
 */
export function useUpdateAppSettings(
  options?: Partial<UseMutationOptions<UserSettingsModel, ApplicationError, UpdateAppSettingsInput>>
) {
  const userSettingsService = container.resolve(UserSettingsService);
  const queryClient = useQueryClient();
  const activeProfileId = useActiveProfileId();

  return useMutation({
    mutationFn: async ({ profileId, settings }: UpdateAppSettingsInput) => {
      const targetProfileId = profileId ?? activeProfileId;

      if (!targetProfileId) {
        throw new ApplicationError('Profile ID is required');
      }

      // First get current settings
      const currentResult = await userSettingsService.getUserSettings(targetProfileId);
      if (currentResult.isFailure) {
        throw currentResult.error;
      }

      const currentSettings = currentResult.value;
      if (!currentSettings) {
        throw new ApplicationError('No settings found for profile');
      }

      // Create updated settings model using domain methods
      let updatedSettings = currentSettings;

      // Apply updates using appropriate domain methods
      if (settings.themeMode !== undefined) {
        updatedSettings = updatedSettings.cloneWithThemeMode(settings.themeMode);
      }

      if (settings.primaryColor !== undefined || settings.secondaryColor !== undefined) {
        updatedSettings = updatedSettings.cloneWithColors(
          settings.primaryColor ?? updatedSettings.primaryColor,
          settings.secondaryColor ?? updatedSettings.secondaryColor
        );
      }

      if (settings.activeTrainingPlanId !== undefined) {
        updatedSettings = updatedSettings.cloneWithActiveTrainingPlan(
          settings.activeTrainingPlanId
        );
      }

      if (
        settings.autoStartRestTimer !== undefined ||
        settings.autoStartShortRestTimer !== undefined
      ) {
        updatedSettings = updatedSettings.cloneWithTimerSettings(
          settings.autoStartRestTimer ?? updatedSettings.autoStartRestTimer,
          settings.autoStartShortRestTimer ?? updatedSettings.autoStartShortRestTimer
        );
      }

      if (settings.liftMappings !== undefined) {
        updatedSettings = updatedSettings.cloneWithLiftMappings(settings.liftMappings);
      }

      if (settings.dashboardLayout !== undefined || settings.dashboardVisibility !== undefined) {
        updatedSettings = updatedSettings.cloneWithDashboardSettings(
          settings.dashboardLayout ?? updatedSettings.dashboardLayout,
          settings.dashboardVisibility ?? updatedSettings.dashboardVisibility
        );
      }

      // For other fields not covered by domain methods, create a new instance
      if (settings.unitSystem !== undefined || settings.bmiFormula !== undefined) {
        const plainData = updatedSettings.toPlainObject();
        updatedSettings = UserSettingsModel.hydrate({
          ...plainData,
          unitSystem: settings.unitSystem ?? plainData.unitSystem,
          bmiFormula: settings.bmiFormula ?? plainData.bmiFormula,
          updatedAt: new Date(),
        });
      }

      // Save the updated settings
      const saveResult = await userSettingsService.saveUserSettings(updatedSettings);
      if (saveResult.isFailure) {
        throw saveResult.error;
      }

      return saveResult.value;
    },
    onSuccess: (updatedSettings, { profileId }) => {
      const targetProfileId = profileId ?? activeProfileId;

      // Update the cache with the new settings
      queryClient.setQueryData(['user-settings', 'app', targetProfileId], updatedSettings);

      // Invalidate related queries that might depend on settings
      queryClient.invalidateQueries({
        queryKey: ['dashboard'],
        refetchType: 'none', // Don't refetch immediately, just mark as stale
      });

      queryClient.invalidateQueries({
        queryKey: ['profile'],
        refetchType: 'none',
      });
    },
    onError: (error, { profileId }) => {
      const targetProfileId = profileId ?? activeProfileId;

      // Invalidate the query to refetch fresh data on error
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'app', targetProfileId],
      });
    },
    ...options,
  });
}
