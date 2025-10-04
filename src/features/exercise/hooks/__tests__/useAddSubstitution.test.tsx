import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationError } from '@/shared/errors/ApplicationError';
import { createTestExerciseModel } from '@/test-factories';

import type { AddSubstitutionInput } from '../useAddSubstitution';

// Create hoisted mocks for the dependencies
const mockExerciseQueryService = {
  addSubstitution: vi.fn(),
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

import { useAddSubstitution } from '../useAddSubstitution';

describe('useAddSubstitution', () => {
  let queryClient: QueryClient;

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testExerciseId = 'exercise-123';
  const testSubstituteExerciseId = 'substitute-456';

  const testOriginalExercise = createTestExerciseModel({
    id: testExerciseId,
    profileId: testProfileId,
    name: 'Original Exercise',
    category: 'strength',
    substitutions: [],
  });

  const testUpdatedExercise = createTestExerciseModel({
    ...testOriginalExercise,
    substitutions: [
      {
        exerciseId: testSubstituteExerciseId,
        priority: 1,
        reason: 'Equipment not available',
      },
    ],
    updatedAt: new Date(),
  });

  const addSubstitutionInput: AddSubstitutionInput = {
    profileId: testProfileId,
    exerciseId: testExerciseId,
    substituteExerciseId: testSubstituteExerciseId,
    priority: 1,
    reason: 'Equipment not available',
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
    // Only clear the addSubstitution mock, not all mocks (which would break the container mock)
    mockExerciseQueryService.addSubstitution.mockClear();
  });

  describe('basic mutation functionality', () => {
    it('should add a substitution successfully', async () => {
      // Arrange
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      // Assert initial state
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();

      // Execute mutation
      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      // Assert success state
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(testUpdatedExercise);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockExerciseQueryService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteExerciseId,
        1,
        'Equipment not available'
      );
      expect(mockExerciseQueryService.addSubstitution).toHaveBeenCalledTimes(1);
    });

    it('should handle mutation errors properly', async () => {
      // Arrange
      const testError = new ApplicationError('Failed to add substitution');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(testError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      // Execute mutation
      await act(async () => {
        result.current.mutate(addSubstitutionInput);
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

    it('should handle adding substitution without reason', async () => {
      // Arrange
      const inputWithoutReason = {
        ...addSubstitutionInput,
        reason: undefined,
      };

      const exerciseWithSubstitutionNoReason = createTestExerciseModel({
        ...testOriginalExercise,
        substitutions: [
          {
            exerciseId: testSubstituteExerciseId,
            priority: 1,
          },
        ],
      });

      mockExerciseQueryService.addSubstitution.mockResolvedValue(exerciseWithSubstitutionNoReason);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(inputWithoutReason);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(exerciseWithSubstitutionNoReason);
      expect(mockExerciseQueryService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteExerciseId,
        1,
        undefined
      );
    });

    it('should handle validation errors for invalid priority', async () => {
      // Arrange
      const validationError = new ApplicationError('Priority must be between 1 and 5');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(validationError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          ...addSubstitutionInput,
          priority: 0, // Invalid priority
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(validationError);
    });

    it('should handle substitution already exists error', async () => {
      // Arrange
      const duplicateError = new ApplicationError('Substitution already exists for this exercise');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(duplicateError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(duplicateError);
    });
  });

  describe('cache updates and optimistic updates', () => {
    beforeEach(() => {
      // Pre-populate cache with original exercise
      queryClient.setQueryData(['exercises', testProfileId, testExerciseId], testOriginalExercise);
      queryClient.setQueryData(['exercises', testProfileId], [testOriginalExercise]);
    });

    it('should update specific exercise cache on successful substitution addition', async () => {
      // Arrange
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['exercises', testProfileId, testExerciseId],
        testUpdatedExercise
      );

      // Verify cache was actually updated
      const cachedExercise = queryClient.getQueryData(['exercises', testProfileId, testExerciseId]);
      expect(cachedExercise).toEqual(testUpdatedExercise);
    });

    it('should update exercises list cache on successful substitution addition', async () => {
      // Arrange
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Should have called setQueryData for exercises list
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['exercises', testProfileId],
        [testUpdatedExercise]
      );

      // Verify the exercises list cache was updated correctly
      const cachedExercises = queryClient.getQueryData(['exercises', testProfileId]);
      expect(cachedExercises).toEqual([testUpdatedExercise]);
    });

    it('should handle exercises list cache update when no cached list exists', async () => {
      // Arrange - Remove exercises list from cache
      queryClient.removeQueries({ queryKey: ['exercises', testProfileId] });
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
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

      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
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
      const testError = new ApplicationError('Add substitution failed');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(testError);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert - Should not have updated cache
      expect(setQueryDataSpy).not.toHaveBeenCalled();

      // Verify original data is still in cache
      const cachedExercise = queryClient.getQueryData(['exercises', testProfileId, testExerciseId]);
      expect(cachedExercise).toEqual(testOriginalExercise);
    });
  });

  describe('mutation states', () => {
    it('should show pending state during mutation', async () => {
      // Arrange
      let resolveMutation: (value: any) => void;
      const mutationPromise = new Promise((resolve) => {
        resolveMutation = resolve;
      });
      mockExerciseQueryService.addSubstitution.mockReturnValue(mutationPromise);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(addSubstitutionInput);
      });

      // Assert pending state
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();

      // Resolve mutation
      resolveMutation!(testUpdatedExercise);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toEqual(testUpdatedExercise);
    });

    it('should reset state when mutation is called again', async () => {
      // Arrange
      const secondSubstitution = {
        ...addSubstitutionInput,
        substituteExerciseId: 'substitute-789',
        priority: 2,
      };

      mockExerciseQueryService.addSubstitution
        .mockResolvedValueOnce(testUpdatedExercise)
        .mockResolvedValueOnce(testUpdatedExercise);

      // Act - First mutation
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second mutation
      await act(async () => {
        result.current.mutate(secondSubstitution);
      });

      // Assert - State should reset and complete again
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockExerciseQueryService.addSubstitution).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom mutation options', () => {
    it('should call custom onSuccess callback', async () => {
      // Arrange
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);
      const onSuccessMock = vi.fn();

      // Act
      const { result } = renderHook(() => useAddSubstitution({ onSuccess: onSuccessMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(onSuccessMock).toHaveBeenCalledWith(
        testUpdatedExercise,
        addSubstitutionInput,
        undefined
      );
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });

    it('should call custom onError callback', async () => {
      // Arrange
      const testError = new ApplicationError('Add substitution failed');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(testError);
      const onErrorMock = vi.fn();

      // Act
      const { result } = renderHook(() => useAddSubstitution({ onError: onErrorMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(onErrorMock).toHaveBeenCalledWith(testError, addSubstitutionInput, undefined);
      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });

    it('should call custom onSettled callback for both success and error', async () => {
      // Arrange
      const onSettledMock = vi.fn();
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      // Act - Success case
      const { result } = renderHook(() => useAddSubstitution({ onSettled: onSettledMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSettledMock).toHaveBeenCalledWith(
        testUpdatedExercise,
        null,
        addSubstitutionInput,
        undefined
      );

      // Reset and test error case
      onSettledMock.mockClear();
      const testError = new ApplicationError('Add substitution failed');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(testError);

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onSettledMock).toHaveBeenCalledWith(
        undefined,
        testError,
        addSubstitutionInput,
        undefined
      );
    });

    it('should call custom onMutate callback before mutation', async () => {
      // Arrange
      const onMutateMock = vi.fn().mockReturnValue({ optimisticData: 'test' });
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      // Act
      const { result } = renderHook(() => useAddSubstitution({ onMutate: onMutateMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      // Assert
      expect(onMutateMock).toHaveBeenCalledWith(addSubstitutionInput);
      expect(onMutateMock).toHaveBeenCalledBefore(mockExerciseQueryService.addSubstitution);
    });

    it('should handle custom onSuccess alongside default cache operations', async () => {
      // Arrange
      queryClient.setQueryData(['exercises', testProfileId, testExerciseId], testOriginalExercise);
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);
      const onSuccessMock = vi.fn();

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Act
      const { result } = renderHook(() => useAddSubstitution({ onSuccess: onSuccessMock }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Both custom callback and default cache operations should execute
      expect(onSuccessMock).toHaveBeenCalled();
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['exercises', testProfileId, testExerciseId],
        testUpdatedExercise
      );
    });
  });

  describe('mutateAsync functionality', () => {
    it('should support mutateAsync for promise-based usage', async () => {
      // Arrange
      mockExerciseQueryService.addSubstitution.mockResolvedValue(testUpdatedExercise);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      let mutationResult;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(addSubstitutionInput);
      });

      // Assert
      expect(mutationResult).toEqual(testUpdatedExercise);

      await waitFor(() => {
        expect(result.current.data).toEqual(testUpdatedExercise);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle mutateAsync errors by throwing', async () => {
      // Arrange
      const testError = new ApplicationError('Add substitution failed');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(testError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(addSubstitutionInput);
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

  describe('substitution scenarios and edge cases', () => {
    it('should handle adding substitution with different priorities', async () => {
      // Arrange - Test all valid priority values
      const priorities = [1, 2, 3, 4, 5];

      for (const priority of priorities) {
        const input = { ...addSubstitutionInput, priority };
        const updatedExercise = createTestExerciseModel({
          ...testOriginalExercise,
          substitutions: [
            { exerciseId: testSubstituteExerciseId, priority, reason: 'Equipment not available' },
          ],
        });

        mockExerciseQueryService.addSubstitution.mockResolvedValueOnce(updatedExercise);

        // Act
        const { result } = renderHook(() => useAddSubstitution(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.mutate(input);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Assert
        expect(result.current.data).toEqual(updatedExercise);
        expect(mockExerciseQueryService.addSubstitution).toHaveBeenCalledWith(
          testProfileId,
          testExerciseId,
          testSubstituteExerciseId,
          priority,
          'Equipment not available'
        );
      }
    });

    it('should handle adding substitution to exercise that already has substitutions', async () => {
      // Arrange - Exercise already has one substitution
      const exerciseWithExistingSub = createTestExerciseModel({
        ...testOriginalExercise,
        substitutions: [
          { exerciseId: 'existing-sub', priority: 1, reason: 'Existing substitution' },
        ],
      });

      const exerciseWithTwoSubs = createTestExerciseModel({
        ...exerciseWithExistingSub,
        substitutions: [
          ...exerciseWithExistingSub.substitutions,
          { exerciseId: testSubstituteExerciseId, priority: 2, reason: 'Equipment not available' },
        ],
      });

      queryClient.setQueryData(
        ['exercises', testProfileId, testExerciseId],
        exerciseWithExistingSub
      );
      mockExerciseQueryService.addSubstitution.mockResolvedValue(exerciseWithTwoSubs);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ ...addSubstitutionInput, priority: 2 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(exerciseWithTwoSubs);
      expect(result.current.data.substitutions).toHaveLength(2);
    });

    it('should handle long reason text', async () => {
      // Arrange
      const longReason =
        'This is a very long reason for substitution that might be used to explain complex situations where the original exercise cannot be performed due to various factors including equipment availability, space constraints, or individual physical limitations.';

      const exerciseWithLongReason = createTestExerciseModel({
        ...testOriginalExercise,
        substitutions: [{ exerciseId: testSubstituteExerciseId, priority: 1, reason: longReason }],
      });

      mockExerciseQueryService.addSubstitution.mockResolvedValue(exerciseWithLongReason);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ ...addSubstitutionInput, reason: longReason });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toEqual(exerciseWithLongReason);
      expect(mockExerciseQueryService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteExerciseId,
        1,
        longReason
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle network timeout errors', async () => {
      // Arrange
      const timeoutError = new ApplicationError('Request timeout');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(timeoutError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
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
      mockExerciseQueryService.addSubstitution.mockRejectedValue(genericError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(addSubstitutionInput);
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
      mockExerciseQueryService.addSubstitution.mockRejectedValue(invalidExerciseError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          ...addSubstitutionInput,
          exerciseId: 'nonexistent-exercise',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(invalidExerciseError);
    });

    it('should handle invalid substitute exercise ID error', async () => {
      // Arrange
      const invalidSubstituteError = new ApplicationError('Substitute exercise not found');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(invalidSubstituteError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          ...addSubstitutionInput,
          substituteExerciseId: 'nonexistent-substitute',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(invalidSubstituteError);
    });

    it('should handle circular substitution error', async () => {
      // Arrange
      const circularError = new ApplicationError('Cannot add exercise as substitution for itself');
      mockExerciseQueryService.addSubstitution.mockRejectedValue(circularError);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          ...addSubstitutionInput,
          substituteExerciseId: testExerciseId, // Same as exerciseId
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(circularError);
    });
  });

  describe('multiple substitution operations', () => {
    it('should handle multiple sequential substitution additions', async () => {
      // Arrange
      const secondSubstitution = {
        ...addSubstitutionInput,
        substituteExerciseId: 'substitute-789',
        priority: 2,
        reason: 'Alternative option',
      };

      const firstUpdated = createTestExerciseModel({
        ...testOriginalExercise,
        substitutions: [
          { exerciseId: testSubstituteExerciseId, priority: 1, reason: 'Equipment not available' },
        ],
      });

      const secondUpdated = createTestExerciseModel({
        ...firstUpdated,
        substitutions: [
          ...firstUpdated.substitutions,
          { exerciseId: 'substitute-789', priority: 2, reason: 'Alternative option' },
        ],
      });

      mockExerciseQueryService.addSubstitution
        .mockResolvedValueOnce(firstUpdated)
        .mockResolvedValueOnce(secondUpdated);

      // Act
      const { result } = renderHook(() => useAddSubstitution(), {
        wrapper: createWrapper(),
      });

      // First substitution
      await act(async () => {
        result.current.mutate(addSubstitutionInput);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(firstUpdated);

      // Second substitution
      await act(async () => {
        result.current.mutate(secondSubstitution);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(secondUpdated);
      });

      // Assert
      expect(mockExerciseQueryService.addSubstitution).toHaveBeenCalledTimes(2);
    });
  });

  describe('dependency injection', () => {
    it('should resolve ExerciseQueryService from container', () => {
      // Act
      renderHook(() => useAddSubstitution(), {
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
        renderHook(() => useAddSubstitution(), {
          wrapper: createWrapper(),
        });
      }).toThrow('Container resolution failed');
    });
  });
});
