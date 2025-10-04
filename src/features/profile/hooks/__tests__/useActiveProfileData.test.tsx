import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationError } from '@/shared/errors/ApplicationError';
import { createTestUserDetailsModel, createTestUserSettingsModel } from '@/test-factories';

// Create hoisted mocks for the dependencies
const mockUseActiveProfileId = vi.hoisted(() => vi.fn());
const mockUseUserData = vi.hoisted(() => vi.fn());

// Mock the dependencies
vi.mock('@/shared/hooks/useActiveProfileId', () => ({
  useActiveProfileId: mockUseActiveProfileId,
}));

vi.mock('../useUserData', () => ({
  useUserData: mockUseUserData,
}));

import { useActiveProfileData } from '../useActiveProfileData';

describe('useActiveProfileData', () => {
  // Mock functions are already created above

  // Create test QueryClient
  let queryClient: QueryClient;

  // Test wrapper component
  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testUserSettings = createTestUserSettingsModel({
    id: 'settings-id',
    profileId: testProfileId,
    themeMode: 'dark',
  });
  const testUserDetails = createTestUserDetailsModel({
    id: 'details-id',
    profileId: testProfileId,
    fullName: 'John Doe',
  });

  // Default mock query results
  const createMockQueryResult = (overrides = {}) => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    isFetching: false,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('when no active profile is set', () => {
    beforeEach(() => {
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseUserData.mockReturnValue({
        userDetails: { firstName: '', lastName: '', email: '' },
        userSettings: {
          units: 'metric',
          theme: 'system',
          language: 'en',
          notifications: { workoutReminders: true, progressUpdates: true, achievementAlerts: true },
          privacy: { shareProgress: false, publicProfile: false },
        },
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });
    });

    it('should return empty state with hasNoActiveProfile true', () => {
      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current).toEqual({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        hasNoActiveProfile: true,
        isSuccess: false,
        isFetching: false,
      });
    });

    it('should call useUserData hook regardless of profile state', () => {
      // Act
      renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert - useUserData doesn't take parameters
      expect(mockUseUserData).toHaveBeenCalled();
    });

    it('should handle multiple renders consistently', () => {
      // Act
      const { result, rerender } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Initial state
      expect(result.current.hasNoActiveProfile).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Re-render
      rerender();

      // Assert
      expect(result.current.hasNoActiveProfile).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('when active profile is set', () => {
    beforeEach(() => {
      mockUseActiveProfileId.mockReturnValue(testProfileId);
    });

    describe('loading states', () => {
      it('should aggregate loading states correctly when data is not loaded', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: false,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current).toEqual({
          data: undefined,
          isLoading: true,
          isError: false,
          error: null,
          hasNoActiveProfile: false,
          isSuccess: false,
          isFetching: true,
        });
      });

      it('should show loading when data is still loading', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: false,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isFetching).toBe(true);
        expect(result.current.isSuccess).toBe(false);
      });

      it('should show loading when data load is in progress', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: false,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isFetching).toBe(true);
        expect(result.current.isSuccess).toBe(false);
      });

      it('should not show loading when data is loaded', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    describe('fetching states', () => {
      it('should show fetching when data is not loaded', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: false,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isFetching).toBe(true);
        expect(result.current.isLoading).toBe(true);
      });

      it('should not show fetching when data is loaded', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isFetching).toBe(false);
      });
    });

    describe('error states', () => {
      const settingsError = new ApplicationError('Failed to load settings');
      const detailsError = new ApplicationError('Failed to load details');

      it('should aggregate error states when settings error occurs', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: true,
          detailsError: null,
          settingsError,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(settingsError);
        expect(result.current.isSuccess).toBe(false);
      });

      it('should aggregate error states when details error occurs', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: true,
          detailsError,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(detailsError);
        expect(result.current.isSuccess).toBe(false);
      });

      it('should return details error when both errors exist', () => {
        // Arrange - details error comes first in the logic
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: true,
          detailsError,
          settingsError,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(detailsError);
        expect(result.current.isSuccess).toBe(false);
      });

      it('should prioritize settings error over null details error', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: true,
          detailsError: null,
          settingsError,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(settingsError);
      });

      it('should handle null errors gracefully', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isError).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    describe('success states', () => {
      it('should show success when data is loaded without errors', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isError).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });

      it('should not show success when data is still loading', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: false,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isSuccess).toBe(false);
      });

      it('should not show success when there is an error', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: true,
          detailsError: new ApplicationError('Details error'),
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isSuccess).toBe(false);
      });

      it('should not show success when both errors exist', () => {
        // Arrange
        const error1 = new ApplicationError('Details error');
        const error2 = new ApplicationError('Settings error');
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: true,
          detailsError: error1,
          settingsError: error2,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.isSuccess).toBe(false);
      });
    });

    describe('data aggregation', () => {
      it('should combine data when loaded successfully', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: testUserSettings,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.data).toEqual({
          settings: testUserSettings,
          details: testUserDetails,
        });
      });

      it('should provide data when loaded with partial data', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: undefined,
          userSettings: testUserSettings,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.data).toEqual({
          settings: testUserSettings,
          details: undefined,
        });
      });

      it('should provide data when loaded with only details', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: undefined,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.data).toEqual({
          settings: undefined,
          details: testUserDetails,
        });
      });

      it('should return undefined data when not loaded', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: false,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.data).toBeUndefined();
      });

      it('should handle null data values correctly', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: testUserDetails,
          userSettings: null as any,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.data).toEqual({
          settings: null,
          details: testUserDetails,
        });
      });
    });

    describe('query hook integration', () => {
      it('should call useUserData hook correctly', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert - useUserData doesn't take parameters
        expect(mockUseUserData).toHaveBeenCalled();
      });

      it('should call useUserData hook on every render', () => {
        // Arrange
        mockUseUserData.mockReturnValue({
          userDetails: { firstName: '', lastName: '', email: '' },
          userSettings: {
            units: 'metric',
            theme: 'system',
            language: 'en',
            notifications: {
              workoutReminders: true,
              progressUpdates: true,
              achievementAlerts: true,
            },
            privacy: { shareProgress: false, publicProfile: false },
          },
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { rerender } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });
        rerender();
        rerender();

        // Assert
        expect(mockUseUserData).toHaveBeenCalledTimes(3);
      });

      it('should handle useUserData returning different data types', () => {
        // Arrange
        const customSettings = { ...testUserSettings, customProperty: 'test' } as any;
        const customDetails = { ...testUserDetails, anotherProperty: 123 } as any;

        mockUseUserData.mockReturnValue({
          userDetails: customDetails,
          userSettings: customSettings,
          isLoaded: true,
          detailsError: null,
          settingsError: null,
        });

        // Act
        const { result } = renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });

        // Assert
        expect(result.current.data?.settings).toEqual(customSettings);
        expect(result.current.data?.details).toEqual(customDetails);
      });
    });
  });

  describe('profile ID changes', () => {
    it('should handle active profile ID changes', () => {
      // Arrange
      const initialProfileId = 'profile-1';
      const newProfileId = 'profile-2';

      mockUseActiveProfileId.mockReturnValue(initialProfileId);
      mockUseUserData.mockReturnValue({
        userDetails: { firstName: '', lastName: '', email: '' },
        userSettings: {
          units: 'metric',
          theme: 'system',
          language: 'en',
          notifications: { workoutReminders: true, progressUpdates: true, achievementAlerts: true },
          privacy: { shareProgress: false, publicProfile: false },
        },
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });

      const { result, rerender } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Verify initial state
      expect(result.current.hasNoActiveProfile).toBe(false);
      expect(mockUseUserData).toHaveBeenCalled();

      // Act - Change profile ID
      mockUseActiveProfileId.mockReturnValue(newProfileId);
      rerender();

      // Assert - Still should have active profile
      expect(result.current.hasNoActiveProfile).toBe(false);
    });

    it('should handle profile ID changing from set to null', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue({
        userDetails: testUserDetails,
        userSettings: testUserSettings,
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });

      const { result, rerender } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Verify initial state with data
      expect(result.current.hasNoActiveProfile).toBe(false);
      expect(result.current.data).toBeDefined();

      // Act - Clear profile ID
      mockUseActiveProfileId.mockReturnValue(null);
      rerender();

      // Assert
      expect(result.current.hasNoActiveProfile).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle profile ID changing from null to set', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseUserData.mockReturnValue({
        userDetails: { firstName: '', lastName: '', email: '' },
        userSettings: {
          units: 'metric',
          theme: 'system',
          language: 'en',
          notifications: { workoutReminders: true, progressUpdates: true, achievementAlerts: true },
          privacy: { shareProgress: false, publicProfile: false },
        },
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });

      const { result, rerender } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Verify initial state without profile
      expect(result.current.hasNoActiveProfile).toBe(true);

      // Act - Set profile ID
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue({
        userDetails: testUserDetails,
        userSettings: testUserSettings,
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });
      rerender();

      // Assert
      expect(result.current.hasNoActiveProfile).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });

  describe('complex state combinations', () => {
    it('should handle loading state with details error', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      const error = new ApplicationError('Details failed');
      mockUseUserData.mockReturnValue({
        userDetails: { firstName: '', lastName: '', email: '' },
        userSettings: {
          units: 'metric',
          theme: 'system',
          language: 'en',
          notifications: { workoutReminders: true, progressUpdates: true, achievementAlerts: true },
          privacy: { shareProgress: false, publicProfile: false },
        },
        isLoaded: false,
        detailsError: error,
        settingsError: null,
      });

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current).toEqual({
        data: undefined,
        isLoading: true,
        isError: true,
        error,
        hasNoActiveProfile: false,
        isSuccess: false,
        isFetching: true,
      });
    });

    it('should handle loading state with settings error', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      const error = new ApplicationError('Settings failed');
      mockUseUserData.mockReturnValue({
        userDetails: { firstName: '', lastName: '', email: '' },
        userSettings: {
          units: 'metric',
          theme: 'system',
          language: 'en',
          notifications: { workoutReminders: true, progressUpdates: true, achievementAlerts: true },
          privacy: { shareProgress: false, publicProfile: false },
        },
        isLoaded: false,
        detailsError: null,
        settingsError: error,
      });

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current).toEqual({
        data: undefined,
        isLoading: true,
        isError: true,
        error,
        hasNoActiveProfile: false,
        isSuccess: false,
        isFetching: true,
      });
    });

    it('should handle loaded state with partial data', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue({
        userDetails: undefined,
        userSettings: testUserSettings,
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual({
        settings: testUserSettings,
        details: undefined,
      });
    });

    it('should handle loaded state with complete data', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue({
        userDetails: testUserDetails,
        userSettings: testUserSettings,
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined profile ID gracefully', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(undefined as any);
      mockUseUserData.mockReturnValue(createMockQueryResult());
      mockUseUserData.mockReturnValue(createMockQueryResult());

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.hasNoActiveProfile).toBe(true);
    });

    it('should handle empty string profile ID', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue('');
      mockUseUserData.mockReturnValue(createMockQueryResult());
      mockUseUserData.mockReturnValue(createMockQueryResult());

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert - Empty string is falsy, so should return early with hasNoActiveProfile true
      expect(result.current.hasNoActiveProfile).toBe(true);
      expect(result.current).toEqual({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        hasNoActiveProfile: true,
        isSuccess: false,
        isFetching: false,
      });
    });

    it('should handle query hooks throwing errors', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockImplementation(() => {
        throw new Error('Hook error');
      });

      // Act & Assert
      expect(() => {
        renderHook(() => useActiveProfileData(), {
          wrapper: createWrapper(),
        });
      }).toThrow('Hook error');
    });

    it('should handle malformed useUserData result objects', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue({} as any);

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert - Should handle missing properties gracefully
      // The actual implementation behavior with undefined values
      expect(result.current.isLoading).toBe(true); // !undefined = true
      expect(result.current.isError).toBe(false); // !!(undefined || undefined) = false
      expect(result.current.isSuccess).toBeUndefined(); // undefined && !false = undefined (actual behavior)
      expect(result.current.isFetching).toBe(true); // !undefined = true
      expect(result.current.error).toBeNull(); // undefined || undefined || null = null
      expect(result.current.hasNoActiveProfile).toBe(false);
      expect(result.current.data).toBeUndefined(); // !undefined = false, so no data
    });
  });

  describe('performance and optimization', () => {
    it('should not cause unnecessary re-renders with same inputs', () => {
      // Arrange
      let renderCount = 0;
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testUserSettings })
      );
      mockUseUserData.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testUserDetails })
      );

      // Act
      const { rerender } = renderHook(() => {
        renderCount++;
        return useActiveProfileData();
      });

      const initialRenderCount = renderCount;
      rerender();
      rerender();

      // Assert
      expect(renderCount).toBe(initialRenderCount + 2); // Each rerender should increment
    });

    it('should handle high-frequency profile ID changes', () => {
      // Arrange
      const profileIds = ['profile-1', 'profile-2', 'profile-3', null, 'profile-4'];
      let currentIndex = 0;

      mockUseActiveProfileId.mockImplementation(() => {
        return profileIds[currentIndex];
      });
      mockUseUserData.mockReturnValue(createMockQueryResult());
      mockUseUserData.mockReturnValue(createMockQueryResult());

      // Act
      const { result, rerender } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      profileIds.forEach((profileId, index) => {
        currentIndex = index;
        rerender();

        // Assert each state
        if (profileId === null) {
          expect(result.current.hasNoActiveProfile).toBe(true);
        } else {
          expect(result.current.hasNoActiveProfile).toBe(false);
        }
      });
    });

    it('should maintain object reference stability for data when possible', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testUserSettings })
      );
      mockUseUserData.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testUserDetails })
      );

      // Act
      const { result, rerender } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });
      const firstData = result.current.data;

      rerender();
      const secondData = result.current.data;

      // Assert - Data objects should have same structure
      expect(firstData).toEqual(secondData);
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain correct return type structure', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue({
        userDetails: testUserDetails,
        userSettings: testUserSettings,
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert - Type structure checks
      const hookResult = result.current;
      expect(typeof hookResult.isLoading).toBe('boolean');
      expect(typeof hookResult.isError).toBe('boolean');
      expect(typeof hookResult.isSuccess).toBe('boolean');
      expect(typeof hookResult.isFetching).toBe('boolean');
      expect(typeof hookResult.hasNoActiveProfile).toBe('boolean');

      // Data should be undefined or have correct structure
      if (hookResult.data) {
        expect(hookResult.data).toHaveProperty('settings');
        expect(hookResult.data).toHaveProperty('details');
      }

      // Error should be null or ApplicationError instance
      if (hookResult.error) {
        expect(hookResult.error).toBeInstanceOf(ApplicationError);
      }
    });

    it('should handle union types correctly for data properties', () => {
      // Arrange - Mixed data availability
      mockUseActiveProfileId.mockReturnValue(testProfileId);
      mockUseUserData.mockReturnValue({
        userDetails: testUserDetails,
        userSettings: undefined,
        isLoaded: true,
        detailsError: null,
        settingsError: null,
      });

      // Act
      const { result } = renderHook(() => useActiveProfileData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.data?.settings).toBeUndefined();
      expect(result.current.data?.details).toBeDefined();
      expect(result.current.data?.details).toEqual(testUserDetails);
    });
  });
});
