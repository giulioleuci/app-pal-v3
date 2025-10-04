import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationError } from '@/shared/errors/ApplicationError';
import { createTestExerciseModel } from '@/test-factories';

import type { RemoveSubstitutionInput } from '../useRemoveSubstitution';

// Create hoisted mocks for the dependencies
const mockExerciseQueryService = {
  removeSubstitution: vi.fn(),
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

import { useRemoveSubstitution } from '../useRemoveSubstitution';

describe('useRemoveSubstitution', () => {
  let queryClient: QueryClient;

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testExerciseId = 'exercise-123';
  const testSubstituteExerciseId = 'substitute-456';
  const anotherSubstituteId = 'substitute-789';

  const testExerciseWithSubstitutions = createTestExerciseModel({
    id: testExerciseId,
    profileId: testProfileId,
    name: 'Original Exercise',
    category: 'strength',
    substitutions: [
      {
        exerciseId: testSubstituteExerciseId,
        priority: 1,
        reason: 'Equipment not available',
      },
      {
        exerciseId: anotherSubstituteId,
        priority: 2,
        reason: 'Alternative option',
      },
    ],
  });

  const testExerciseAfterRemoval = createTestExerciseModel({
    ...testExerciseWithSubstitutions,
    substitutions: [
      {
        exerciseId: anotherSubstituteId,
        priority: 2,
        reason: 'Alternative option',
      },
    ],
    updatedAt: new Date(),
  });

  const removeSubstitutionInput: RemoveSubstitutionInput = {
    profileId: testProfileId,
    exerciseId: testExerciseId,
    substituteExerciseId: testSubstituteExerciseId,
  };

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
    // Only clear the removeSubstitution mock, not all mocks (which would break the container mock)
    mockExerciseQueryService.removeSubstitution.mockClear();
  });

  describe('basic mutation functionality', () => {
    it('should remove a substitution successfully', async () => {
      // Arrange
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      // Assert initial state
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();

      // Execute mutation
      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      // Assert success state
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(testExerciseAfterRemoval);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockExerciseQueryService.removeSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteExerciseId
      );
      expect(mockExerciseQueryService.removeSubstitution).toHaveBeenCalledTimes(1);
    });

    it('should handle mutation errors properly', async () => {
      // Arrange
      const testError = new ApplicationError('Failed to remove substitution');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(testError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      // Execute mutation
      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
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

    it('should handle removing the last substitution', async () => {
      // Arrange - Exercise with only one substitution
      const exerciseWithOneSub = createTestExerciseModel({
        ...testExerciseWithSubstitutions,
        substitutions: [
          {
            exerciseId: testSubstituteExerciseId,
            priority: 1,
            reason: 'Equipment not available',
          },
        ],
      });

      const exerciseWithNoSubs = createTestExerciseModel({
        ...exerciseWithOneSub,
        substitutions: [],
      });

      mockExerciseQueryService.removeSubstitution.mockResolvedValue(exerciseWithNoSubs);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(exerciseWithNoSubs);
      expect(result.current.data.substitutions).toHaveLength(0);
    });

    it('should handle substitution not found error', async () => {
      // Arrange
      const notFoundError = new ApplicationError('Substitution not found');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(notFoundError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          ...removeSubstitutionInput,
          substituteExerciseId: 'nonexistent-substitute',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(notFoundError);
    });
  });

  describe('cache updates and optimistic updates', () => {
    beforeEach(() => {
      // Pre-populate cache with exercise containing substitutions
      queryClient.setQueryData(
        ['exercises', testProfileId, testExerciseId],
        testExerciseWithSubstitutions
      );
      queryClient.setQueryData(['exercises', testProfileId], [testExerciseWithSubstitutions]);
    });

    it('should update specific exercise cache on successful substitution removal', async () => {
      // Arrange
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['exercises', testProfileId, testExerciseId],
        testExerciseAfterRemoval
      );

      // Verify cache was actually updated
      const cachedExercise = queryClient.getQueryData(['exercises', testProfileId, testExerciseId]);
      expect(cachedExercise).toEqual(testExerciseAfterRemoval);
    });

    it('should update exercises list cache on successful substitution removal', async () => {
      // Arrange
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Should have called setQueryData for exercises list
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['exercises', testProfileId],
        [testExerciseAfterRemoval]
      );

      // Verify the exercises list cache was updated correctly
      const cachedExercises = queryClient.getQueryData(['exercises', testProfileId]);
      expect(cachedExercises).toEqual([testExerciseAfterRemoval]);
    });

    it('should handle exercises list cache update when no cached list exists', async () => {
      // Arrange - Remove exercises list from cache
      queryClient.removeQueries({ queryKey: ['exercises', testProfileId] });
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Cache should remain undefined (updater function returns undefined)
      const cachedExercises = queryClient.getQueryData(['exercises', testProfileId]);
      expect(cachedExercises).toBeUndefined();
    });

    it('should handle exercises list cache update when exercise not in list', async () => {
      // Arrange - Set exercises list without the exercise being updated
      const otherExercise = createTestExerciseModel({
        id: 'other-exercise',
        profileId: testProfileId,
      });
      queryClient.setQueryData(['exercises', testProfileId], [otherExercise]);

      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Original exercise should remain unchanged
      const cachedExercises = queryClient.getQueryData(['exercises', testProfileId]);
      expect(cachedExercises).toEqual([otherExercise]);
    });

    it('should not update cache on error', async () => {
      // Arrange
      const testError = new ApplicationError('Remove substitution failed');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(testError);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert - Should not have updated cache
      expect(setQueryDataSpy).not.toHaveBeenCalled();

      // Verify original data is still in cache
      const cachedExercise = queryClient.getQueryData(['exercises', testProfileId, testExerciseId]);
      expect(cachedExercise).toEqual(testExerciseWithSubstitutions);
    });
  });

  describe('mutation states', () => {
    it('should show pending state during mutation', async () => {
      // Arrange
      let resolveMutation: (value: any) => void;
      const mutationPromise = new Promise((resolve) => {
        resolveMutation = resolve;
      });
      mockExerciseQueryService.removeSubstitution.mockReturnValue(mutationPromise);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(removeSubstitutionInput);
      });

      // Assert pending state
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();

      // Resolve mutation
      resolveMutation!(testExerciseAfterRemoval);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toEqual(testExerciseAfterRemoval);
    });

    it('should reset state when mutation is called again', async () => {
      // Arrange
      const secondRemoval = {
        ...removeSubstitutionInput,
        substituteExerciseId: anotherSubstituteId,
      };

      mockExerciseQueryService.removeSubstitution
        .mockResolvedValueOnce(testExerciseAfterRemoval)
        .mockResolvedValueOnce(testExerciseAfterRemoval);

      // Act - First mutation
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second mutation
      await act(async () => {
        result.current.mutate(secondRemoval);
      });

      // Assert - State should reset and complete again
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockExerciseQueryService.removeSubstitution).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom mutation options', () => {
    it('should call custom onSuccess callback', async () => {
      // Arrange
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);
      const onSuccessMock = vi.fn();

      // Act
      const { result } = renderHook(() => useRemoveSubstitution({ onSuccess: onSuccessMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(onSuccessMock).toHaveBeenCalledWith(
        testExerciseAfterRemoval,
        removeSubstitutionInput,
        undefined
      );
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });

    it('should call custom onError callback', async () => {
      // Arrange
      const testError = new ApplicationError('Remove substitution failed');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(testError);
      const onErrorMock = vi.fn();

      // Act
      const { result } = renderHook(() => useRemoveSubstitution({ onError: onErrorMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(onErrorMock).toHaveBeenCalledWith(testError, removeSubstitutionInput, undefined);
      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });

    it('should call custom onSettled callback for both success and error', async () => {
      // Arrange
      const onSettledMock = vi.fn();
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      // Act - Success case
      const { result } = renderHook(() => useRemoveSubstitution({ onSettled: onSettledMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSettledMock).toHaveBeenCalledWith(
        testExerciseAfterRemoval,
        null,
        removeSubstitutionInput,
        undefined
      );

      // Reset and test error case
      onSettledMock.mockClear();
      const testError = new ApplicationError('Remove substitution failed');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(testError);

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onSettledMock).toHaveBeenCalledWith(
        undefined,
        testError,
        removeSubstitutionInput,
        undefined
      );
    });

    it('should call custom onMutate callback before mutation', async () => {
      // Arrange
      const onMutateMock = vi.fn().mockReturnValue({ optimisticData: 'test' });
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution({ onMutate: onMutateMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      // Assert
      expect(onMutateMock).toHaveBeenCalledWith(removeSubstitutionInput);
      expect(onMutateMock).toHaveBeenCalledBefore(mockExerciseQueryService.removeSubstitution);
    });

    it('should handle custom onSuccess alongside default cache operations', async () => {
      // Arrange
      queryClient.setQueryData(
        ['exercises', testProfileId, testExerciseId],
        testExerciseWithSubstitutions
      );
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);
      const onSuccessMock = vi.fn();

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useRemoveSubstitution({ onSuccess: onSuccessMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Both custom callback and default cache operations should execute
      expect(onSuccessMock).toHaveBeenCalled();
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['exercises', testProfileId, testExerciseId],
        testExerciseAfterRemoval
      );
    });
  });

  describe('mutateAsync functionality', () => {
    it('should support mutateAsync for promise-based usage', async () => {
      // Arrange
      mockExerciseQueryService.removeSubstitution.mockResolvedValue(testExerciseAfterRemoval);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      let mutationResult;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(removeSubstitutionInput);
      });

      // Assert
      expect(mutationResult).toEqual(testExerciseAfterRemoval);

      await waitFor(() => {
        expect(result.current.data).toEqual(testExerciseAfterRemoval);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle mutateAsync errors by throwing', async () => {
      // Arrange
      const testError = new ApplicationError('Remove substitution failed');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(testError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(removeSubstitutionInput);
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

  describe('substitution removal scenarios and edge cases', () => {
    it('should handle removing substitution from exercise with multiple substitutions', async () => {
      // Arrange - Exercise has 3 substitutions
      const exerciseWithThreeSubs = createTestExerciseModel({
        ...testExerciseWithSubstitutions,
        substitutions: [
          { exerciseId: 'sub-1', priority: 1, reason: 'First' },
          { exerciseId: testSubstituteExerciseId, priority: 2, reason: 'Second' },
          { exerciseId: 'sub-3', priority: 3, reason: 'Third' },
        ],
      });

      const exerciseAfterMiddleRemoval = createTestExerciseModel({
        ...exerciseWithThreeSubs,
        substitutions: [
          { exerciseId: 'sub-1', priority: 1, reason: 'First' },
          { exerciseId: 'sub-3', priority: 3, reason: 'Third' },
        ],
      });

      mockExerciseQueryService.removeSubstitution.mockResolvedValue(exerciseAfterMiddleRemoval);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Should remove only the specified substitution
      expect(result.current.data).toEqual(exerciseAfterMiddleRemoval);
      expect(result.current.data.substitutions).toHaveLength(2);
      expect(result.current.data.substitutions).not.toContainEqual(
        expect.objectContaining({ exerciseId: testSubstituteExerciseId })
      );
    });

    it('should handle removing all substitutions sequentially', async () => {
      // Arrange - Exercise starts with 2 substitutions
      const exerciseAfterFirstRemoval = createTestExerciseModel({
        ...testExerciseWithSubstitutions,
        substitutions: [
          { exerciseId: anotherSubstituteId, priority: 2, reason: 'Alternative option' },
        ],
      });

      const exerciseAfterSecondRemoval = createTestExerciseModel({
        ...exerciseAfterFirstRemoval,
        substitutions: [],
      });

      mockExerciseQueryService.removeSubstitution
        .mockResolvedValueOnce(exerciseAfterFirstRemoval)
        .mockResolvedValueOnce(exerciseAfterSecondRemoval);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      // Remove first substitution
      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data.substitutions).toHaveLength(1);

      // Remove second substitution
      await act(async () => {
        result.current.mutate({
          ...removeSubstitutionInput,
          substituteExerciseId: anotherSubstituteId,
        });
      });

      await waitFor(() => {
        expect(result.current.data.substitutions).toHaveLength(0);
      });

      // Assert
      expect(mockExerciseQueryService.removeSubstitution).toHaveBeenCalledTimes(2);
    });

    it('should handle removing substitution that prioritizes are maintained', async () => {
      // Arrange - Removing substitution doesn't affect other priorities
      const exerciseWithPrioritizedSubs = createTestExerciseModel({
        ...testExerciseWithSubstitutions,
        substitutions: [
          { exerciseId: testSubstituteExerciseId, priority: 1, reason: 'High priority' },
          { exerciseId: 'sub-low', priority: 5, reason: 'Low priority' },
          { exerciseId: 'sub-medium', priority: 3, reason: 'Medium priority' },
        ],
      });

      const exerciseAfterHighPriorityRemoval = createTestExerciseModel({
        ...exerciseWithPrioritizedSubs,
        substitutions: [
          { exerciseId: 'sub-low', priority: 5, reason: 'Low priority' },
          { exerciseId: 'sub-medium', priority: 3, reason: 'Medium priority' },
        ],
      });

      mockExerciseQueryService.removeSubstitution.mockResolvedValue(
        exerciseAfterHighPriorityRemoval
      );

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Other substitutions should maintain their priorities
      expect(result.current.data.substitutions).toHaveLength(2);
      expect(result.current.data.substitutions).toContainEqual(
        expect.objectContaining({ exerciseId: 'sub-low', priority: 5 })
      );
      expect(result.current.data.substitutions).toContainEqual(
        expect.objectContaining({ exerciseId: 'sub-medium', priority: 3 })
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle network timeout errors', async () => {
      // Arrange
      const timeoutError = new ApplicationError('Request timeout');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(timeoutError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
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
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(genericError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(genericError);
    });

    it('should handle invalid exercise ID error', async () => {
      // Arrange
      const invalidExerciseError = new ApplicationError('Exercise not found');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(invalidExerciseError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          ...removeSubstitutionInput,
          exerciseId: 'nonexistent-exercise',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(invalidExerciseError);
    });

    it('should handle exercise has no substitutions error', async () => {
      // Arrange
      const noSubstitutionsError = new ApplicationError('Exercise has no substitutions');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(noSubstitutionsError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(noSubstitutionsError);
    });

    it('should handle concurrent modification errors', async () => {
      // Arrange
      const conflictError = new ApplicationError('Exercise was modified by another user');
      mockExerciseQueryService.removeSubstitution.mockRejectedValue(conflictError);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(removeSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(conflictError);
    });
  });

  describe('multiple substitution removal operations', () => {
    it('should handle multiple sequential substitution removals', async () => {
      // Arrange
      const firstRemoval = removeSubstitutionInput;
      const secondRemoval = {
        ...removeSubstitutionInput,
        substituteExerciseId: anotherSubstituteId,
      };

      const firstResult = createTestExerciseModel({
        ...testExerciseWithSubstitutions,
        substitutions: [
          { exerciseId: anotherSubstituteId, priority: 2, reason: 'Alternative option' },
        ],
      });

      const secondResult = createTestExerciseModel({
        ...firstResult,
        substitutions: [],
      });

      mockExerciseQueryService.removeSubstitution
        .mockResolvedValueOnce(firstResult)
        .mockResolvedValueOnce(secondResult);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      // First removal
      await act(async () => {
        result.current.mutate(firstRemoval);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(firstResult);

      // Second removal
      await act(async () => {
        result.current.mutate(secondRemoval);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(secondResult);
      });

      // Assert
      expect(mockExerciseQueryService.removeSubstitution).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent removals properly', async () => {
      // Arrange
      const firstRemoval = removeSubstitutionInput;
      const secondRemoval = {
        ...removeSubstitutionInput,
        exerciseId: 'another-exercise',
      };

      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockExerciseQueryService.removeSubstitution
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      // Act
      const { result } = renderHook(() => useRemoveSubstitution(), {
        wrapper: createWrapper(),
      });

      // Start both removals
      act(() => {
        result.current.mutate(firstRemoval);
      });

      act(() => {
        result.current.mutate(secondRemoval);
      });

      // Resolve second removal first (out of order)
      resolveSecond!(testExerciseAfterRemoval);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Resolve first removal
      resolveFirst!(testExerciseAfterRemoval);

      // Assert - Should handle both removals
      expect(mockExerciseQueryService.removeSubstitution).toHaveBeenCalledTimes(2);
    });
  });

  describe('dependency injection', () => {
    it('should resolve ExerciseQueryService from container', () => {
      // Act
      renderHook(() => useRemoveSubstitution(), {
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
        renderHook(() => useRemoveSubstitution(), {
          wrapper: createWrapper(),
        });
      }).toThrow('Container resolution failed');
    });
  });
});
