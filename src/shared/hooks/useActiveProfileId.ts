import { useProfileStore } from '@/app/store/profileStore';

/**
 * Hook that provides access to the active profile ID from the profile store.
 *
 * This hook abstracts the Zustand store implementation details, providing
 * a clean interface for components that need to access the currently active
 * profile ID. It returns only the activeProfileId value, making it easier
 * to use and more focused than accessing the full store.
 *
 * @returns The currently active profile ID, or null if no profile is active
 */
export function useActiveProfileId(): string | null {
  return useProfileStore((state) => state.activeProfileId);
}
