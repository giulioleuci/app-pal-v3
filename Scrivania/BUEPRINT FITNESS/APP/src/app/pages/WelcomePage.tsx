import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { useProfileStore } from '@/app/store/profileStore';
import { WelcomeWizard } from '@/features/profile/components/WelcomeWizard';
import { useProfileOperations } from '@/features/profile/hooks/useProfileOperations';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

/**
 * Welcome page for new users to create their first profile.
 * This is the entry point for the onboarding flow.
 */
export const WelcomePage = () => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { setActiveProfileId } = useProfileStore();

  // Set page title
  usePageTitle('welcome', t('pages.welcome.title'));

  // Profile operations
  const { profiles, activeProfileId, isCreating, createError, create } = useProfileOperations();

  // Handle profile creation
  const handleCreateProfile = async (name: string) => {
    try {
      const newProfile = await create({ name });

      // Set the new profile as active
      setActiveProfileId(newProfile.id);

      // Show success message
      showSuccess(t('profile.create.success', { profileName: name }));

      // Navigate to dashboard or main app
      navigate('/dashboard');
    } catch (_error) {
      // Error handling - the _error is already available in createError
      // but we can also show a user-friendly message
      const errorMessage = createError?.message || t('profile.create.error');
      showError(errorMessage);
    }
  };

  // Redirect if user already has profiles
  useEffect(() => {
    if (profiles.length > 0 && activeProfileId) {
      // User already has a profile, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [profiles.length, activeProfileId, navigate]);

  // Don't render if redirecting
  if (profiles.length > 0 && activeProfileId) {
    return null;
  }

  return <WelcomeWizard onComplete={handleCreateProfile} isCreating={isCreating} />;
};
