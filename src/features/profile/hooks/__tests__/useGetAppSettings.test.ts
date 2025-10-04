import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { generateId } from '@/lib';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';
import { createTestUserSettingsModel } from '@/test-factories';

import { useGetAppSettings } from '../useGetAppSettings';

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

describe('useGetAppSettings - React Query Integration', () => {
  let queryClient: QueryClient;
  let mockUserSettingsService: jest.Mocked<UserSettingsService>;
  let mockSettings: UserSettingsModel;
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
      },
    });

    mockSettings = createTestUserSettingsModel({
      profileId: testProfileId,
      themeMode: 'dark',
      unitSystem: 'metric',
      autoStartRestTimer: true,
    });

    mockUserSettingsService = {
      getUserSettings: vi.fn(),
      saveUserSettings: vi.fn(),
    } as any;

    // Mock the container resolve
    (container.resolve as any).mockReturnValue(mockUserSettingsService);
  });

  it('should fetch user settings successfully', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(mockSettings));

    const { result } = renderHook(() => useGetAppSettings(testProfileId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSettings);
    expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(testProfileId);
  });

  it('should handle null settings (no settings found)', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(null));

    const { result } = renderHook(() => useGetAppSettings(testProfileId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
    expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(testProfileId);
  });

  it('should handle service errors', async () => {
    const serviceError = new ApplicationError('Failed to fetch settings');
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.failure(serviceError));

    const { result } = renderHook(() => useGetAppSettings(testProfileId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(serviceError);
  });

  it('should handle service rejection errors', async () => {
    const rejectionError = new Error('Service unavailable');
    mockUserSettingsService.getUserSettings.mockRejectedValue(rejectionError);

    const { result } = renderHook(() => useGetAppSettings(testProfileId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(rejectionError);
  });

  it('should use active profile ID when no profile ID provided', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(mockSettings));

    const { result } = renderHook(
      () => useGetAppSettings(), // No profile ID provided
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith('active-profile-id');
  });

  it('should handle cache properly', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(mockSettings));

    const { result } = renderHook(() => useGetAppSettings(testProfileId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that the query is cached
    const cachedData = queryClient.getQueryData(['user-settings', 'app', testProfileId]);
    expect(cachedData).toEqual(mockSettings);
  });
});
