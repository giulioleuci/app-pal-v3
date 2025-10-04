import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataSyncQueryService } from '@/features/data-sync/query-services/DataSyncQueryService';
import { ExportData, ExportStatus } from '@/features/data-sync/services/DataSyncService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

import { type ExportDataInput, useExportData } from '../useExportData';

// Create hoisted mocks
const mockQueryService = vi.hoisted(() => ({
  exportData: vi.fn(),
}));

// Mock the container to return our mock service
vi.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
  container: {
    resolve: vi.fn().mockReturnValue(mockQueryService),
  },
}));

// Test data
let queryClient: QueryClient;

const testExportData: ExportData = {
  version: '1.0.0',
  exportedAt: new Date('2024-01-15T10:30:00Z'),
  profileId: 'profile-123',
  profile: {
    id: 'profile-123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  },
  exercises: [
    {
      id: 'exercise-1',
      name: 'Bench Press',
      category: 'chest',
      equipment: 'barbell',
    },
  ],
  workoutLogs: [
    {
      id: 'workout-1',
      date: new Date('2024-01-10T18:00:00Z'),
      duration: 3600,
      totalVolume: 15000,
    },
  ],
  bodyMetrics: [
    {
      id: 'weight-1',
      type: 'weight',
      value: 75.5,
      date: new Date('2024-01-01T08:00:00Z'),
    },
  ],
  trainingPlans: [],
  maxLogs: [],
};

const testExportInput: ExportDataInput = {
  profileId: 'profile-123',
};

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useExportData', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('successful data export', () => {
    it('should export data successfully', async () => {
      // Arrange
      mockQueryService.exportData.mockResolvedValue(testExportData);

      // Act
      const { result } = renderHook(() => useExportData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);

      result.current.mutate(testExportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(testExportData);
      expect(result.current.error).toBeNull();
      expect(mockQueryService.exportData).toHaveBeenCalledWith('profile-123', undefined);
    });

    it('should export data with progress callback', async () => {
      // Arrange
      const onProgress = vi.fn();
      const inputWithProgress: ExportDataInput = {
        profileId: 'profile-123',
        onProgress,
      };
      mockQueryService.exportData.mockResolvedValue(testExportData);

      // Act
      const { result } = renderHook(() => useExportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(inputWithProgress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(testExportData);
      expect(mockQueryService.exportData).toHaveBeenCalledWith('profile-123', onProgress);
    });

    it('should handle empty profile data export', async () => {
      // Arrange
      const emptyExportData: ExportData = {
        ...testExportData,
        exercises: [],
        workoutLogs: [],
        bodyMetrics: [],
        trainingPlans: [],
        maxLogs: [],
      };
      mockQueryService.exportData.mockResolvedValue(emptyExportData);

      // Act
      const { result } = renderHook(() => useExportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testExportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(emptyExportData);
      expect(result.current.data?.exercises.length).toBe(0);
      expect(result.current.data?.workoutLogs.length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      // Arrange
      const error = new ApplicationError('Failed to export data');
      mockQueryService.exportData.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useExportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testExportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain correct return type structure', async () => {
      // Arrange
      mockQueryService.exportData.mockResolvedValue(testExportData);

      // Act
      const { result } = renderHook(() => useExportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testExportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Type structure checks
      const mutationResult = result.current;
      if (mutationResult.data) {
        expect(mutationResult.data).toHaveProperty('version');
        expect(mutationResult.data).toHaveProperty('exportedAt');
        expect(mutationResult.data).toHaveProperty('profileId');
        expect(mutationResult.data).toHaveProperty('profile');
        expect(mutationResult.data).toHaveProperty('exercises');
        expect(mutationResult.data).toHaveProperty('workoutLogs');
        expect(mutationResult.data).toHaveProperty('bodyMetrics');
        expect(mutationResult.data).toHaveProperty('trainingPlans');
        expect(mutationResult.data).toHaveProperty('maxLogs');

        expect(typeof mutationResult.data.version).toBe('string');
        expect(mutationResult.data.exportedAt).toBeInstanceOf(Date);
        expect(Array.isArray(mutationResult.data.exercises)).toBe(true);
        expect(Array.isArray(mutationResult.data.workoutLogs)).toBe(true);
      }
    });
  });
});
