import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

export interface UserSettings {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'it';
  notifications: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    achievementAlerts: boolean;
  };
  privacy: {
    shareProgress: boolean;
    publicProfile: boolean;
  };
}

export interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  units: 'metric',
  theme: 'system',
  language: 'en',
  notifications: {
    workoutReminders: true,
    progressUpdates: true,
    achievementAlerts: true,
  },
  privacy: {
    shareProgress: false,
    publicProfile: false,
  },
};

/**
 * User details and settings management hook.
 *
 * Focused hook for user-related data management including:
 * - User details (name, email, phone, etc.)
 * - User settings (theme, language, notifications, privacy)
 * - Settings persistence and synchronization
 * - Quick settings updates
 * - Simple validation (complex validation handled by ProfileModel)
 *
 * @returns User data management interface
 */
export function useUserData() {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user data from localStorage (or would be from a service)
  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedDetails = localStorage.getItem('userDetails');
        const savedSettings = localStorage.getItem('userSettings');

        if (savedDetails) {
          setUserDetails(JSON.parse(savedDetails));
        }

        if (savedSettings) {
          setUserSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        }

        setIsLoaded(true);
      } catch (_error) {
        console.error('Failed to load user data:', _error);
        setIsLoaded(true);
      }
    };

    loadUserData();
  }, []);

  // Save user data to localStorage (would be to a service in real app)
  const saveUserData = useCallback(async (details?: UserDetails, settings?: UserSettings) => {
    try {
      if (details) {
        localStorage.setItem('userDetails', JSON.stringify(details));
        setUserDetails(details);
      }

      if (settings) {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        setUserSettings(settings);
      }

      return { success: true };
    } catch (_error) {
      throw new Error('Failed to save user data');
    }
  }, []);

  // Update user details mutation
  const updateUserDetails = useMutation({
    mutationFn: async (newDetails: Partial<UserDetails>) => {
      const updatedDetails = { ...userDetails, ...newDetails };
      await saveUserData(updatedDetails, undefined);
      return updatedDetails;
    },
    onSuccess: (updatedDetails) => {
      setUserDetails(updatedDetails);
    },
  });

  // Update user settings mutation
  const updateUserSettings = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const updatedSettings = {
        ...userSettings,
        ...newSettings,
        // Deep merge nested objects
        notifications: {
          ...userSettings.notifications,
          ...newSettings.notifications,
        },
        privacy: {
          ...userSettings.privacy,
          ...newSettings.privacy,
        },
      };
      await saveUserData(undefined, updatedSettings);
      return updatedSettings;
    },
    onSuccess: (updatedSettings) => {
      setUserSettings(updatedSettings);
    },
  });

  // Quick settings updaters
  const updateTheme = useCallback(
    (theme: UserSettings['theme']) => {
      updateUserSettings.mutate({ theme });
    },
    [updateUserSettings]
  );

  const updateLanguage = useCallback(
    (language: UserSettings['language']) => {
      updateUserSettings.mutate({ language });
    },
    [updateUserSettings]
  );

  const updateUnits = useCallback(
    (units: UserSettings['units']) => {
      updateUserSettings.mutate({ units });
    },
    [updateUserSettings]
  );

  const toggleNotification = useCallback(
    (key: keyof UserSettings['notifications']) => {
      updateUserSettings.mutate({
        notifications: {
          ...userSettings.notifications,
          [key]: !userSettings.notifications[key],
        },
      });
    },
    [userSettings.notifications, updateUserSettings]
  );

  const togglePrivacy = useCallback(
    (key: keyof UserSettings['privacy']) => {
      updateUserSettings.mutate({
        privacy: {
          ...userSettings.privacy,
          [key]: !userSettings.privacy[key],
        },
      });
    },
    [userSettings.privacy, updateUserSettings]
  );

  // Reset to defaults
  const resetSettings = useCallback(() => {
    updateUserSettings.mutate(DEFAULT_SETTINGS);
  }, [updateUserSettings]);

  // Export user data
  const exportUserData = useCallback(() => {
    return {
      details: userDetails,
      settings: userSettings,
      exportedAt: new Date().toISOString(),
    };
  }, [userDetails, userSettings]);

  // Import user data
  const importUserData = useCallback(
    async (data: { details?: UserDetails; settings?: UserSettings }) => {
      if (data.details) {
        await updateUserDetails.mutateAsync(data.details);
      }
      if (data.settings) {
        await updateUserSettings.mutateAsync(data.settings);
      }
    },
    [updateUserDetails, updateUserSettings]
  );

  return {
    // Data
    userDetails,
    userSettings,

    // Loading states
    isLoaded,
    isUpdatingDetails: updateUserDetails.isPending,
    isUpdatingSettings: updateUserSettings.isPending,

    // Error states
    detailsError: updateUserDetails.error,
    settingsError: updateUserSettings.error,

    // Operations
    updateDetails: updateUserDetails.mutateAsync,
    updateSettings: updateUserSettings.mutateAsync,

    // Quick settings operations
    updateTheme,
    updateLanguage,
    updateUnits,
    toggleNotification,
    togglePrivacy,
    resetSettings,

    // Data management
    exportUserData,
    importUserData,

    // Computed values
    isComplete: !!(userDetails.firstName && userDetails.lastName && userDetails.email),
    hasAvatar: !!userDetails.avatar,
    hasEmergencyContact: !!userDetails.emergencyContact,

    // Theme info
    isDarkMode:
      userSettings.theme === 'dark' ||
      (userSettings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
    isMetric: userSettings.units === 'metric',
  };
}

export type UseUserDataResult = ReturnType<typeof useUserData>;
