// Profile Hook Exports - Separated Concerns
// === AGGREGATE HOOKS ===
export { useActiveProfileData, type UseActiveProfileDataResult } from './useActiveProfileData';
export { useProfileOperations, type UseProfileOperationsResult } from './useProfileOperations';
export { useUserData, type UseUserDataResult } from './useUserData';

// === APP SETTINGS HOOKS ===
export { useGetAppSettings } from './useGetAppSettings';
export { useUpdateAppSettings } from './useUpdateAppSettings';

// === TYPES ===
export type { CreateProfileInput, UpdateProfileInput } from './useProfileOperations';
export type { UserDetails, UserSettings } from './useUserData';
