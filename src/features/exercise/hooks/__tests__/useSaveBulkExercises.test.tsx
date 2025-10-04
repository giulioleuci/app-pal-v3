import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationError } from '@/shared/errors/ApplicationError';
import { createTestExerciseModel } from '@/test-factories';

// Create hoisted mocks for the dependencies
const mockExerciseQueryService = {
  saveBulkExercises: vi.fn(),
};

const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn().mockImplementation((token) => mockExerciseQueryService),
}));

// Mock the dependencies
vi.mock('tsyringe', () => ({
  container: mockContainer,
  injectable: () => (target: any) => target,
  singleton: () => (target: any) => target,
}));

vi.mock('@/features/exercise/query-services/ExerciseQueryService', () => ({
  ExerciseQueryService: vi.fn(),
}));

import { useSaveBulkExercises } from '../useSaveBulkExercises';

describe('useSaveBulkExercises', () => {
  let queryClient: QueryClient;

  // Test data
  const testProfileId1 = '550e8400-e29b-41d4-a716-446655440001';
  const testProfileId2 = '550e8400-e29b-41d4-a716-446655440002';

  const testExercises = [
    createTestExerciseModel({
      id: 'exercise-1',
      profileId: testProfileId1,
      name: 'Exercise 1',
      category: 'strength',
    }),
    createTestExerciseModel({
      id: 'exercise-2',
      profileId: testProfileId1,
      name: 'Exercise 2',
      category: 'cardio',
    }),
    createTestExerciseModel({
      id: 'exercise-3',
      profileId: testProfileId2,
      name: 'Exercise 3',
      category: 'flexibility',
    }),
  ];

  const singleProfileExercises = [
    createTestExerciseModel({
      id: 'exercise-single-1',
      profileId: testProfileId1,
      name: 'Single Profile Exercise 1',
    }),
    createTestExerciseModel({
      id: 'exercise-single-2',
      profileId: testProfileId1,
      name: 'Single Profile Exercise 2',
    }),
  ];

  // Helper function to create a wrapper with QueryClient
  const createWrapper = () => {
    return ({ children }: { children: any }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    // Only clear the saveBulkExercises mock, not all mocks (which would break the container mock)
    mockExerciseQueryService.saveBulkExercises.mockClear();
  });

  describe('basic mutation functionality', () => {
    it('should save bulk exercises successfully', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      // Assert initial state
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();

      // Execute mutation
      await act(async () => {
        result.current.mutate(testExercises);
      });

      // Assert success state
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeUndefined(); // Bulk save returns void
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledWith(testExercises);
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledTimes(1);
    });

    it('should handle mutation errors properly', async () => {
      // Arrange
      const testError = new ApplicationError('Failed to save exercises');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(testError);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      // Execute mutation
      await act(async () => {
        result.current.mutate(testExercises);
      });

      // Assert error state
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(testError);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('should handle empty exercises array', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate([]);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledWith([]);
    });

    it('should handle single exercise in array', async () => {
      // Arrange
      const singleExercise = [testExercises[0]];
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(singleExercise);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledWith(singleExercise);
    });
  });

  describe('cache invalidation and updates', () => {
    beforeEach(() => {
      // Pre-populate cache with some exercises
      queryClient.setQueryData(['exercises', testProfileId1], [testExercises[0]]);
      queryClient.setQueryData(['exercises', testProfileId2], [testExercises[2]]);

      // Set individual exercise caches
      testExercises.forEach((exercise) => {
        queryClient.setQueryData(['exercises', exercise.profileId, exercise.id], exercise);
      });
    });

    it('should invalidate exercises list caches for all affected profiles on successful save', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Should invalidate for both profiles
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['exercises', testProfileId1],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['exercises', testProfileId2],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('should update individual exercise caches on successful save', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Should set individual exercise caches
      testExercises.forEach((exercise) => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          ['exercises', exercise.profileId, exercise.id],
          exercise
        );
      });

      // Verify the caches were actually updated
      testExercises.forEach((exercise) => {
        const cachedExercise = queryClient.getQueryData([
          'exercises',
          exercise.profileId,
          exercise.id,
        ]);
        expect(cachedExercise).toEqual(exercise);
      });
    });

    it('should handle exercises from single profile', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(singleProfileExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Should invalidate only one profile
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['exercises', testProfileId1],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);

      // Should update individual exercise caches
      singleProfileExercises.forEach((exercise) => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          ['exercises', exercise.profileId, exercise.id],
          exercise
        );
      });
    });

    it('should handle exercises with duplicate profile IDs correctly', async () => {
      // Arrange - Create exercises with same profile ID
      const duplicateProfileExercises = [
        createTestExerciseModel({ id: 'dup-1', profileId: testProfileId1 }),
        createTestExerciseModel({ id: 'dup-2', profileId: testProfileId1 }),
        createTestExerciseModel({ id: 'dup-3', profileId: testProfileId1 }),
      ];

      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(duplicateProfileExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Should invalidate only once per unique profile ID
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['exercises', testProfileId1],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    });

    it('should not update cache on error', async () => {
      // Arrange
      const testError = new ApplicationError('Bulk save failed');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(testError);

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert - Should not have updated cache
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
      expect(setQueryDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('mutation states', () => {
    it('should show pending state during mutation', async () => {
      // Arrange
      let resolveMutation: (value: any) => void;
      const mutationPromise = new Promise((resolve) => {
        resolveMutation = resolve;
      });
      mockExerciseQueryService.saveBulkExercises.mockReturnValue(mutationPromise);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(testExercises);
      });

      // Assert pending state
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();

      // Resolve mutation
      resolveMutation!(undefined);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should reset state when mutation is called again', async () => {
      // Arrange
      const secondBatch = [
        createTestExerciseModel({ id: 'batch2-1', profileId: testProfileId1 }),
        createTestExerciseModel({ id: 'batch2-2', profileId: testProfileId2 }),
      ];

      mockExerciseQueryService.saveBulkExercises
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Act - First mutation
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second mutation
      await act(async () => {
        result.current.mutate(secondBatch);
      });

      // Assert - State should reset and complete again
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom mutation options', () => {
    it('should call custom onSuccess callback', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);
      const onSuccessMock = vi.fn();

      // Act
      const { result } = renderHook(() => useSaveBulkExercises({ onSuccess: onSuccessMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(onSuccessMock).toHaveBeenCalledWith(undefined, testExercises, undefined);
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });

    it('should call custom onError callback', async () => {
      // Arrange
      const testError = new ApplicationError('Bulk save failed');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(testError);
      const onErrorMock = vi.fn();

      // Act
      const { result } = renderHook(() => useSaveBulkExercises({ onError: onErrorMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(onErrorMock).toHaveBeenCalledWith(testError, testExercises, undefined);
      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });

    it('should call custom onSettled callback for both success and error', async () => {
      // Arrange
      const onSettledMock = vi.fn();
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act - Success case
      const { result } = renderHook(() => useSaveBulkExercises({ onSettled: onSettledMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSettledMock).toHaveBeenCalledWith(undefined, null, testExercises, undefined);

      // Reset and test error case
      onSettledMock.mockClear();
      const testError = new ApplicationError('Bulk save failed');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(testError);

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onSettledMock).toHaveBeenCalledWith(undefined, testError, testExercises, undefined);
    });

    it('should call custom onMutate callback before mutation', async () => {
      // Arrange
      const onMutateMock = vi.fn().mockReturnValue({ optimisticData: 'test' });
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises({ onMutate: onMutateMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      // Assert
      expect(onMutateMock).toHaveBeenCalledWith(testExercises);
      expect(onMutateMock).toHaveBeenCalledBefore(mockExerciseQueryService.saveBulkExercises);
    });

    it('should handle custom onSuccess alongside default cache operations', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);
      const onSuccessMock = vi.fn();

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useSaveBulkExercises({ onSuccess: onSuccessMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Both custom callback and default cache operations should execute
      expect(onSuccessMock).toHaveBeenCalled();
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });
  });

  describe('mutateAsync functionality', () => {
    it('should support mutateAsync for promise-based usage', async () => {
      // Arrange
      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      let mutationResult;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(testExercises);
      });

      // Assert
      expect(mutationResult).toBeUndefined();

      await waitFor(() => {
        expect(result.current.data).toBeUndefined();
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle mutateAsync errors by throwing', async () => {
      // Arrange
      const testError = new ApplicationError('Bulk save failed');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(testError);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(testExercises);
        } catch (_error) {
          expect(_error).toBe(testError);
        }
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(testError);
      });
    });
  });

  describe('bulk operation scenarios and edge cases', () => {
    it('should handle large number of exercises', async () => {
      // Arrange - Create 100 exercises
      const largeExercisesBatch = Array.from({ length: 100 }, (_, index) =>
        createTestExerciseModel({
          id: `exercise-${index}`,
          profileId: index % 3 === 0 ? testProfileId1 : testProfileId2, // Mix profiles
          name: `Exercise ${index}`,
        })
      );

      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(largeExercisesBatch);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledWith(largeExercisesBatch);
    });

    it('should handle exercises with complex data structures', async () => {
      // Arrange - Exercises with detailed substitutions and muscle activation
      const complexExercises = [
        createTestExerciseModel({
          id: 'complex-1',
          profileId: testProfileId1,
          name: 'Complex Exercise 1',
          substitutions: [
            { exerciseId: 'sub-1', priority: 1, reason: 'Equipment not available' },
            { exerciseId: 'sub-2', priority: 2, reason: 'Injury prevention' },
          ],
          muscleActivation: {
            chest: 0.9,
            shoulders: 0.7,
            triceps: 0.8,
            core: 0.4,
          },
        }),
        createTestExerciseModel({
          id: 'complex-2',
          profileId: testProfileId2,
          name: 'Complex Exercise 2',
          substitutions: [{ exerciseId: 'sub-3', priority: 1, reason: 'Space constraints' }],
          muscleActivation: {
            legs: 1.0,
            glutes: 0.9,
            core: 0.6,
          },
        }),
      ];

      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(complexExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledWith(complexExercises);
    });

    it('should handle exercises with different categories and types', async () => {
      // Arrange - Mixed exercise types
      const mixedExercises = [
        createTestExerciseModel({
          id: 'strength-1',
          profileId: testProfileId1,
          category: 'strength',
          movementType: 'push',
          difficulty: 'advanced',
          equipment: ['barbell', 'bench'],
        }),
        createTestExerciseModel({
          id: 'cardio-1',
          profileId: testProfileId1,
          category: 'cardio',
          movementType: 'pull',
          difficulty: 'beginner',
          equipment: [],
        }),
        createTestExerciseModel({
          id: 'flexibility-1',
          profileId: testProfileId2,
          category: 'flexibility',
          movementType: 'static',
          difficulty: 'intermediate',
          equipment: ['yoga_mat'],
        }),
      ];

      mockExerciseQueryService.saveBulkExercises.mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mixedExercises);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledWith(mixedExercises);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle network timeout errors', async () => {
      // Arrange
      const timeoutError = new ApplicationError('Request timeout');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(timeoutError);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(timeoutError);
    });

    it('should handle service throwing non-ApplicationError', async () => {
      // Arrange
      const genericError = new Error('Generic error');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(genericError);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(genericError);
    });

    it('should handle database constraint errors', async () => {
      // Arrange
      const constraintError = new ApplicationError('Duplicate exercise names in bulk save');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(constraintError);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(constraintError);
    });

    it('should handle partial save failures', async () => {
      // Arrange
      const partialFailureError = new ApplicationError('Some exercises could not be saved');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(partialFailureError);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(partialFailureError);
    });

    it('should handle storage quota exceeded errors', async () => {
      // Arrange
      const quotaError = new ApplicationError('Storage quota exceeded');
      mockExerciseQueryService.saveBulkExercises.mockRejectedValue(quotaError);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(testExercises);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(quotaError);
    });
  });

  describe('multiple bulk operations', () => {
    it('should handle multiple sequential bulk saves', async () => {
      // Arrange
      const firstBatch = testExercises.slice(0, 2);
      const secondBatch = testExercises.slice(2, 3);

      mockExerciseQueryService.saveBulkExercises
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      // First bulk save
      await act(async () => {
        result.current.mutate(firstBatch);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second bulk save
      await act(async () => {
        result.current.mutate(secondBatch);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledTimes(2);
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenNthCalledWith(1, firstBatch);
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenNthCalledWith(2, secondBatch);
    });

    it('should handle concurrent bulk saves properly', async () => {
      // Arrange
      const firstBatch = [testExercises[0]];
      const secondBatch = [testExercises[1]];

      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockExerciseQueryService.saveBulkExercises
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      // Act
      const { result } = renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      // Start both operations
      act(() => {
        result.current.mutate(firstBatch);
      });

      act(() => {
        result.current.mutate(secondBatch);
      });

      // Resolve second operation first (out of order)
      resolveSecond!(undefined);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Resolve first operation
      resolveFirst!(undefined);

      // Assert - Should handle both operations
      expect(mockExerciseQueryService.saveBulkExercises).toHaveBeenCalledTimes(2);
    });
  });

  describe('dependency injection', () => {
    it('should resolve ExerciseQueryService from container', () => {
      // Act
      renderHook(() => useSaveBulkExercises(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(mockContainer.resolve).toHaveBeenCalledWith(
        expect.anything() // ExerciseQueryService constructor
      );
    });

    it('should handle container resolution failure', () => {
      // Arrange
      mockContainer.resolve.mockImplementation(() => {
        throw new Error('Container resolution failed');
      });

      // Act & Assert
      expect(() => {
        renderHook(() => useSaveBulkExercises(), {
          wrapper: createWrapper(),
        });
      }).toThrow('Container resolution failed');
    });
  });
});
