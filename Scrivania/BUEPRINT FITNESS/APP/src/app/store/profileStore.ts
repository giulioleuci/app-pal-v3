import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { LocalStorageAdapter } from './LocalStorageAdapter';

/**
 * Profile store state interface
 */
interface ProfileStoreState {
  /** The currently active profile ID, null if no profile is selected */
  activeProfileId: string | null;

  /** Sets the active profile ID */
  setActiveProfileId: (profileId: string | null) => void;

  /** Clears the active profile ID */
  clearActiveProfileId: () => void;
}

/**
 * Zustand store for managing the active profile ID with localStorage persistence.
 *
 * This store maintains the currently selected profile across browser sessions.
 * The persistence is abstracted through a custom LocalStorageAdapter to allow
 * for easier testing and potential future migration to different storage backends.
 */
export const useProfileStore = create<ProfileStoreState>()(
  persist(
    (set) => ({
      activeProfileId: null,

      setActiveProfileId: (profileId: string | null) => set({ activeProfileId: profileId }),

      clearActiveProfileId: () => set({ activeProfileId: null }),
    }),
    {
      name: 'blueprint-fitness-profile',
      storage: new LocalStorageAdapter(),
      partialize: (state) => ({
        activeProfileId: state.activeProfileId,
      }),
    }
  )
);
