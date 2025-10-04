import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { ProfileQueryService } from '@/features/profile/query-services/ProfileQueryService';
import { ProfileService } from '@/features/profile/services/ProfileService';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import type { ProfileData } from '@/shared/types';
import { profilesToDomain } from '@/shared/utils/transformations';

export interface CreateProfileInput {
  name: string;
  email?: string;
  dateOfBirth?: Date;
  height?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessGoal?: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'maintenance';
}

export interface UpdateProfileInput {
  id: string;
  name?: string;
  email?: string;
  dateOfBirth?: Date;
  height?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessGoal?: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'maintenance';
}

/**
 * Profile CRUD and switching operations hook.
 *
 * Focused hook for profile management operations including:
 * - Creating new profiles
 * - Updating existing profiles
 * - Deleting profiles
 * - Switching between profiles
 * - Getting all profiles
 *
 * @returns Profile operations interface
 */
export function useProfileOperations() {
  const profileQueryService = useMemo(() => container.resolve(ProfileQueryService), []);
  const profileService = useMemo(() => container.resolve(ProfileService), []);
  const queryClient = useQueryClient();
  const activeProfileId = useActiveProfileId();

  // Get all profiles - memoize the query to prevent recreating on every render
  const profilesQuery = useMemo(() => profileQueryService.getProfiles(), [profileQueryService]);
  const { data: profiles = [], isObserving: isLoading } = useObserveQuery<ProfileModel>(
    profilesQuery,
    { transform: profilesToDomain }
  );

  // Create profile mutation
  const createProfile = useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      const result = await profileService.createProfile(input.name);
      if (result.isFailure) {
        throw result.error;
      }
      return result.value.toPlainObject();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!input.name) {
        throw new Error('Profile name is required for update');
      }
      const result = await profileService.updateProfileName(input.id, input.name);
      if (result.isFailure) {
        throw result.error;
      }
      return result.value.toPlainObject();
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', updatedProfile.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  // Delete profile mutation
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const result = await profileService.deleteProfile(profileId);
      if (result.isFailure) {
        throw result.error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ['profile', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  // Switch active profile
  const switchProfile = useCallback(
    async (profileId: string) => {
      // This would typically interact with a profile store or context
      // For now, this is a placeholder that would need proper implementation
      queryClient.invalidateQueries({ queryKey: ['active-profile'] });
      return profileId;
    },
    [queryClient]
  );

  // Get profile by ID
  const getProfile = useCallback(
    (profileId: string) => {
      return profiles.find((profile) => profile.id === profileId) || null;
    },
    [profiles]
  );

  // Utility functions
  const hasMultipleProfiles = profiles.length > 1;
  const canDeleteProfile = hasMultipleProfiles && activeProfileId;

  return {
    // Data
    profiles,
    activeProfileId,

    // Loading states
    isLoading,
    isCreating: createProfile.isPending,
    isUpdating: updateProfile.isPending,
    isDeleting: deleteProfile.isPending,

    // Error states
    createError: createProfile.error,
    updateError: updateProfile.error,
    deleteError: deleteProfile.error,

    // Operations
    create: createProfile.mutateAsync,
    update: updateProfile.mutateAsync,
    delete: deleteProfile.mutateAsync,
    switch: switchProfile,
    getById: getProfile,

    // Utility functions
    hasMultipleProfiles,
    canDeleteProfile,

    // Refetch
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  };
}

export type UseProfileOperationsResult = ReturnType<typeof useProfileOperations>;
