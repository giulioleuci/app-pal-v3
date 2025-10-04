import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataSyncQueryService } from '@/features/data-sync/query-services/DataSyncQueryService';
import { ExportData, ImportStatus } from '@/features/data-sync/services/DataSyncService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { ConflictError } from '@/shared/errors/ConflictError';
import { isConflictError } from '@/shared/errors/guards';

import { type ImportDataInput, useImportData } from '../useImportData';

// Create hoisted mocks
const mockQueryService = vi.hoisted(() => ({
  importData: vi.fn(),
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

// Mock the error guard function
vi.mock('@/shared/errors/guards', () => ({
  isConflictError: vi.fn(),
}));

// Test data
let queryClient: QueryClient;
let spyInvalidateQueries: ReturnType<typeof vi.spyOn>;

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

const testImportStatus: ImportStatus = {
  phase: 'completed',
  progress: 1.0,
  currentItem: 'Import complete',
  totalItems: 50,
  completedItems: 50,
  conflictsDetected: 0,
  itemsSkipped: 0,
  itemsImported: 50,
};

const testImportInput: ImportDataInput = {
  importData: testExportData,
};

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useImportData', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Spy on invalidateQueries to verify cache invalidation
    spyInvalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('successful data import', () => {
    it('should import data successfully', async () => {
      // Arrange
      mockQueryService.importData.mockResolvedValue(testImportStatus);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);

      result.current.mutate(testImportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(testImportStatus);
      expect(result.current.error).toBeNull();
      expect(mockQueryService.importData).toHaveBeenCalledWith(testExportData, undefined);
    });

    it('should import data with progress callback', async () => {
      // Arrange
      const onProgress = vi.fn();
      const inputWithProgress: ImportDataInput = {
        importData: testExportData,
        onProgress,
      };
      mockQueryService.importData.mockResolvedValue(testImportStatus);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(inputWithProgress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(testImportStatus);
      expect(mockQueryService.importData).toHaveBeenCalledWith(testExportData, onProgress);
    });

    it('should invalidate profiles cache on successful import', async () => {
      // Arrange
      mockQueryService.importData.mockResolvedValue(testImportStatus);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(spyInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['profiles'] });
    });

    it('should call custom onSuccess callback', async () => {
      // Arrange
      const onSuccess = vi.fn();
      mockQueryService.importData.mockResolvedValue(testImportStatus);

      // Act
      const { result } = renderHook(() => useImportData({ onSuccess }), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(onSuccess).toHaveBeenCalledWith(testImportStatus, testImportInput, undefined);
    });

    it('should handle import with conflicts detected', async () => {
      // Arrange
      const statusWithConflicts: ImportStatus = {
        ...testImportStatus,
        conflictsDetected: 5,
        itemsSkipped: 3,
        itemsImported: 47,
      };
      mockQueryService.importData.mockResolvedValue(statusWithConflicts);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(statusWithConflicts);
      expect(result.current.data?.conflictsDetected).toBe(5);
      expect(result.current.data?.itemsSkipped).toBe(3);
    });

    it('should handle large import datasets', async () => {
      // Arrange
      const largeImportData: ExportData = {
        ...testExportData,
        workoutLogs: Array.from({ length: 10000 }, (_, i) => ({
          id: `workout-${i}`,
          date: new Date('2024-01-01T18:00:00Z'),
          duration: 3600,
          totalVolume: 15000,
        })),
      };
      const largeImportInput: ImportDataInput = {
        importData: largeImportData,
      };
      const largeImportStatus: ImportStatus = {
        ...testImportStatus,
        totalItems: 10050,
        completedItems: 10050,
        itemsImported: 10050,
      };
      mockQueryService.importData.mockResolvedValue(largeImportStatus);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(largeImportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(largeImportStatus);
      expect(result.current.data?.totalItems).toBe(10050);
    });
  });

  describe('error handling', () => {
    it('should handle general service errors', async () => {
      // Arrange
      const error = new ApplicationError('Failed to import data');
      mockQueryService.importData.mockRejectedValue(error);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should handle ConflictError using type guard and log warning', async () => {
      // Arrange
      const conflictError = new ConflictError('import.conflicts.detected' as any);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockQueryService.importData.mockRejectedValue(conflictError);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(true);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(conflictError);
      expect(isConflictError).toHaveBeenCalledWith(conflictError);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Import conflict detected:',
        'import.conflicts.detected'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should call custom onError callback for ConflictError', async () => {
      // Arrange
      const conflictError = new ConflictError('import.conflicts.detected' as any);
      const onError = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockQueryService.importData.mockRejectedValue(conflictError);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(true);

      // Act
      const { result } = renderHook(() => useImportData({ onError }), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(conflictError, testImportInput, undefined);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Import conflict detected:',
        'import.conflicts.detected'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should call custom onError callback for regular ApplicationError', async () => {
      // Arrange
      const error = new ApplicationError('Import failed due to invalid data');
      const onError = vi.fn();
      mockQueryService.importData.mockRejectedValue(error);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Act
      const { result } = renderHook(() => useImportData({ onError }), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error, testImportInput, undefined);
      expect(isConflictError).toHaveBeenCalledWith(error);
    });

    it('should handle invalid import data format', async () => {
      // Arrange
      const invalidImportInput: ImportDataInput = {
        importData: { invalid: 'format' } as any,
      };
      const error = new ApplicationError('Invalid import data format');
      mockQueryService.importData.mockRejectedValue(error);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(invalidImportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle version mismatch errors', async () => {
      // Arrange
      const outdatedImportInput: ImportDataInput = {
        importData: { ...testExportData, version: '0.5.0' },
      };
      const error = new ApplicationError('Unsupported data version');
      mockQueryService.importData.mockRejectedValue(error);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(outdatedImportInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should not invalidate cache on error', async () => {
      // Arrange
      const error = new ApplicationError('Import failed');
      mockQueryService.importData.mockRejectedValue(error);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(spyInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe('mutation states', () => {
    it('should show pending state during import', async () => {
      // Arrange (Pattern 3: Background Refetch with controlled timing)
      let resolvePromise: (value: ImportStatus) => void;
      const promise = new Promise<ImportStatus>((resolve) => {
        resolvePromise = resolve;
      });
      mockQueryService.importData.mockReturnValue(promise);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      // Start the mutation
      const mutationPromise = result.current.mutateAsync(testImportInput);

      // Wait for pending state to be true
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Assert pending state
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();

      // Resolve the promise
      resolvePromise!(testImportStatus);
      await mutationPromise;

      // Wait for success state
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(testImportStatus);
    });

    it('should reset state on new mutation', async () => {
      // Arrange
      mockQueryService.importData.mockResolvedValue(testImportStatus);

      // Act - First mutation
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(testImportStatus);

      // Act - Second mutation with different input
      const newImportData = {
        ...testExportData,
        profileId: 'different-profile',
      };
      const newImportInput: ImportDataInput = {
        importData: newImportData,
      };
      const newImportStatus = {
        ...testImportStatus,
        itemsImported: 25,
      };
      mockQueryService.importData.mockResolvedValue(newImportStatus);

      result.current.mutate(newImportInput);

      await waitFor(() => {
        expect(result.current.data).toEqual(newImportStatus);
      });

      // Assert
      expect(mockQueryService.importData).toHaveBeenCalledTimes(2);
      expect(mockQueryService.importData).toHaveBeenLastCalledWith(newImportData, undefined);
    });
  });

  describe('React Query integration', () => {
    it('should work with all mutation options', async () => {
      // Arrange
      mockQueryService.importData.mockResolvedValue(testImportStatus);
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();
      const onMutate = vi.fn();

      // Act
      const { result } = renderHook(
        () => useImportData({ onSuccess, onError, onSettled, onMutate }),
        {
          wrapper: createWrapper(),
        }
      );

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(onMutate).toHaveBeenCalledWith(testImportInput);
      expect(onSuccess).toHaveBeenCalledWith(testImportStatus, testImportInput, undefined);
      expect(onSettled).toHaveBeenCalledWith(testImportStatus, null, testImportInput, undefined);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onSettled on error', async () => {
      // Arrange
      const error = new ApplicationError('Import failed');
      const onSettled = vi.fn();
      mockQueryService.importData.mockRejectedValue(error);
      (isConflictError as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Act
      const { result } = renderHook(() => useImportData({ onSettled }), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(onSettled).toHaveBeenCalledWith(undefined, error, testImportInput, undefined);
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain correct return type structure', async () => {
      // Arrange
      mockQueryService.importData.mockResolvedValue(testImportStatus);

      // Act
      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testImportInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Type structure checks
      const mutationResult = result.current;
      expect(typeof mutationResult.isPending).toBe('boolean');
      expect(typeof mutationResult.isError).toBe('boolean');
      expect(typeof mutationResult.isSuccess).toBe('boolean');

      // Data should be ImportStatus
      if (mutationResult.data) {
        expect(mutationResult.data).toHaveProperty('phase');
        expect(mutationResult.data).toHaveProperty('progress');
        expect(mutationResult.data).toHaveProperty('currentItem');
        expect(mutationResult.data).toHaveProperty('totalItems');
        expect(mutationResult.data).toHaveProperty('completedItems');
        expect(mutationResult.data).toHaveProperty('conflictsDetected');
        expect(mutationResult.data).toHaveProperty('itemsSkipped');
        expect(mutationResult.data).toHaveProperty('itemsImported');

        expect(typeof mutationResult.data.progress).toBe('number');
        expect(typeof mutationResult.data.totalItems).toBe('number');
        expect(typeof mutationResult.data.conflictsDetected).toBe('number');
        expect(typeof mutationResult.data.itemsImported).toBe('number');
      }
    });

    it('should handle input parameter validation', () => {
      // Arrange
      const invalidInput = {
        importData: null as any,
      };

      // Act & Assert
      expect(() => {
        renderHook(() => useImportData(), {
          wrapper: createWrapper(),
        });
      }).not.toThrow(); // Should not throw at render time

      const { result } = renderHook(() => useImportData(), {
        wrapper: createWrapper(),
      });

      // Should be able to call mutate with invalid input (error handling happens in service)
      expect(() => {
        result.current.mutate(invalidInput);
      }).not.toThrow();
    });
  });
});
