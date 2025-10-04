import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { generateId } from '@/lib';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';
import { createTestUserSettingsModel } from '@/test-factories';

import { useUpdateAppSettings } from '../useUpdateAppSettings';

// Mock dependencies
vi.mock('@/shared/hooks/useActiveProfileId', () => ({
  useActiveProfileId: vi.fn().mockReturnValue('active-profile-id'),
}));

// Mock tsyringe
vi.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
  singleton: () => (target: any) => target,
  Lifecycle: {
    Singleton: 'Singleton',
    Transient: 'Transient',
    ContainerScoped: 'ContainerScoped',
  },
  container: {
    resolve: vi.fn(),
    registerInstance: vi.fn(),
    register: vi.fn(),
    registerSingleton: vi.fn(),
  },
}));

describe('useUpdateAppSettings - React Query Integration', () => {
  let queryClient: QueryClient;
  let mockUserSettingsService: jest.Mocked<UserSettingsService>;
  let mockCurrentSettings: UserSettingsModel;
  let mockUpdatedSettings: UserSettingsModel;
  let testProfileId: string;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    testProfileId = generateId();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    mockCurrentSettings = createTestUserSettingsModel({
      profileId: testProfileId,
      themeMode: 'light',
      unitSystem: 'metric',
      autoStartRestTimer: false,
      primaryColor: '#2196F3',
      secondaryColor: '#FFC107',
    });

    mockUpdatedSettings = createTestUserSettingsModel({
      profileId: testProfileId,
      themeMode: 'dark',
      unitSystem: 'metric',
      autoStartRestTimer: true,
      primaryColor: '#2196F3',
      secondaryColor: '#FFC107',
    });

    mockUserSettingsService = {
      getUserSettings: vi.fn(),
      saveUserSettings: vi.fn(),
    } as any;

    // Mock the container resolve
    (container.resolve as any).mockReturnValue(mockUserSettingsService);
  });

  it('should update theme mode successfully', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(mockCurrentSettings));
    mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.success(mockUpdatedSettings));

    const { result } = renderHook(() => useUpdateAppSettings(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        profileId: testProfileId,
        settings: { themeMode: 'dark' },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(testProfileId);
    expect(mockUserSettingsService.saveUserSettings).toHaveBeenCalled();
  });

  it('should update colors successfully', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(mockCurrentSettings));
    mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.success(mockUpdatedSettings));

    const { result } = renderHook(() => useUpdateAppSettings(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        profileId: testProfileId,
        settings: {
          primaryColor: '#FF5722',
          secondaryColor: '#4CAF50',
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUserSettingsService.saveUserSettings).toHaveBeenCalled();
  });

  it('should use active profile ID when no profile ID provided', async () => {
    const activeProfileSettings = createTestUserSettingsModel({
      profileId: 'active-profile-id',
      themeMode: 'light',
    });

    mockUserSettingsService.getUserSettings.mockResolvedValue(
      Result.success(activeProfileSettings)
    );
    mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.success(mockUpdatedSettings));

    const { result } = renderHook(() => useUpdateAppSettings(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        // No profileId specified
        settings: { themeMode: 'dark' },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith('active-profile-id');
  });

  it('should handle error when current settings not found', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(null));

    const { result } = renderHook(() => useUpdateAppSettings(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          profileId: testProfileId,
          settings: { themeMode: 'dark' },
        })
      ).rejects.toThrow('No settings found for profile');
    });
  });

  it('should handle service fetch error', async () => {
    const serviceError = new ApplicationError('Failed to fetch current settings');
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.failure(serviceError));

    const { result } = renderHook(() => useUpdateAppSettings(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          profileId: testProfileId,
          settings: { themeMode: 'dark' },
        })
      ).rejects.toEqual(serviceError);
    });
  });

  it('should update cache on successful mutation', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(mockCurrentSettings));
    mockUserSettingsService.saveUserSettings.mockResolvedValue(Result.success(mockUpdatedSettings));

    const { result } = renderHook(() => useUpdateAppSettings(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        profileId: testProfileId,
        settings: { themeMode: 'dark' },
      });
    });

    // Check that cache was updated
    const cachedData = queryClient.getQueryData(['user-settings', 'app', testProfileId]);
    expect(cachedData).toEqual(mockUpdatedSettings);
  });
});
