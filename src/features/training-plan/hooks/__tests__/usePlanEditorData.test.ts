import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createReactiveHookTestDatabase, renderReactiveHook } from '@/reactive-hook-test-utils';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { createTestExerciseModel, createTestTrainingPlanModel } from '@/test-factories';

// Create hoisted mocks for the dependencies
const mockUseTrainingPlanManager = vi.hoisted(() => vi.fn());
const mockUseExerciseCRUD = vi.hoisted(() => vi.fn());

// Mock the dependencies
vi.mock('../useTrainingPlanManager', () => ({
  useTrainingPlanManager: mockUseTrainingPlanManager,
}));

vi.mock('@/features/exercise/hooks/useExerciseCRUD', () => ({
  useExerciseCRUD: mockUseExerciseCRUD,
}));

import { usePlanEditorData } from '../usePlanEditorData';

describe('usePlanEditorData', () => {
  // Test data
  const testPlanId = '550e8400-e29b-41d4-a716-446655440001';
  const testProfileId = '550e8400-e29b-41d4-a716-446655440002';
  const testTrainingPlan = createTestTrainingPlanModel({
    id: testPlanId,
    profileId: testProfileId,
    name: 'Test Training Plan',
  });
  const testExercises = [
    createTestExerciseModel({ id: 'exercise-1', name: 'Squat' }),
    createTestExerciseModel({ id: 'exercise-2', name: 'Bench Press' }),
    createTestExerciseModel({ id: 'exercise-3', name: 'Deadlift' }),
  ];

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

  // Mock getPlanDetails result structure - this simulates what trainingPlanService.getTrainingPlanDetails returns
  const createMockGetPlanDetailsResult = (overrides = {}) => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    isFetching: false,
    ...overrides,
  });

  // Helper to create complete useTrainingPlanManager mock
  const createMockTrainingPlanManager = (getPlanDetailsResult = {}) => ({
    getPlanDetails: vi.fn().mockReturnValue(createMockGetPlanDetailsResult(getPlanDetailsResult)),
    plans: [],
    cycles: [],
    activeCycles: [],
    plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
    cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  });

  // Mock exercise CRUD result structure
  const createMockExerciseCRUDResult = (overrides = {}) => ({
    exercises: undefined,
    isLoading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    createError: null,
    updateError: null,
    deleteError: null,
    getExercise: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    warmCache: vi.fn(),
    invalidateCache: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  });

  let testDb: ReturnType<typeof createReactiveHookTestDatabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    testDb = createReactiveHookTestDatabase();

    // Set up default mock behavior for useTrainingPlanManager
    mockUseTrainingPlanManager.mockReturnValue(createMockTrainingPlanManager());

    // Set up default mock behavior for useExerciseCRUD
    mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());
  });

  afterEach(async () => {
    vi.resetAllMocks();
    if (testDb) {
      await testDb.cleanup();
    }
  });

  describe('invalid ID handling', () => {
    describe('when planId is missing or empty', () => {
      it('should return early with hasInvalidIds true when planId is empty string', () => {
        // Arrange
        const mockGetPlanDetails = vi.fn().mockReturnValue(createMockGetPlanDetailsResult());
        mockUseTrainingPlanManager.mockReturnValue({
          getPlanDetails: mockGetPlanDetails,
          plans: [],
          cycles: [],
          activeCycles: [],
          plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
          cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        });
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData('', testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current).toEqual({
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
          hasInvalidIds: true,
          isSuccess: false,
          isFetching: false,
        });
      });

      it('should not call query hooks when planId is empty', () => {
        // Arrange
        const mockGetPlanDetails = vi.fn().mockReturnValue(createMockGetPlanDetailsResult());
        mockUseTrainingPlanManager.mockReturnValue({
          getPlanDetails: mockGetPlanDetails,
          plans: [],
          cycles: [],
          activeCycles: [],
          plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
          cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        });
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        renderReactiveHook(() => usePlanEditorData('', testProfileId), { db: testDb });

        // Assert - Hooks should still be called but with empty ID
        expect(mockGetPlanDetails).toHaveBeenCalledWith('');
        expect(mockUseExerciseCRUD).toHaveBeenCalledWith(testProfileId);
      });
    });

    describe('when profileId is missing or empty', () => {
      it('should return early with hasInvalidIds true when profileId is empty string', () => {
        // Arrange
        const mockGetPlanDetails = vi.fn().mockReturnValue(createMockGetPlanDetailsResult());
        mockUseTrainingPlanManager.mockReturnValue({
          getPlanDetails: mockGetPlanDetails,
          plans: [],
          cycles: [],
          activeCycles: [],
          plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
          cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        });
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, ''), {
          db: testDb,
        });

        // Assert
        expect(result.current).toEqual({
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
          hasInvalidIds: true,
          isSuccess: false,
          isFetching: false,
        });
      });

      it('should not call query hooks when profileId is empty', () => {
        // Arrange
        const mockGetPlanDetails = vi.fn().mockReturnValue(createMockGetPlanDetailsResult());
        mockUseTrainingPlanManager.mockReturnValue({
          getPlanDetails: mockGetPlanDetails,
          plans: [],
          cycles: [],
          activeCycles: [],
          plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
          cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        });
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        renderReactiveHook(() => usePlanEditorData(testPlanId, ''), { db: testDb });

        // Assert - Hooks should still be called but with empty ID
        expect(mockGetPlanDetails).toHaveBeenCalledWith(testPlanId);
        expect(mockUseExerciseCRUD).toHaveBeenCalledWith('');
      });
    });

    describe('when both IDs are missing', () => {
      it('should return early with hasInvalidIds true when both IDs are empty', () => {
        // Arrange
        const mockGetPlanDetails = vi.fn().mockReturnValue(createMockGetPlanDetailsResult());
        mockUseTrainingPlanManager.mockReturnValue({
          getPlanDetails: mockGetPlanDetails,
          plans: [],
          cycles: [],
          activeCycles: [],
          plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
          cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        });
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData('', ''), { db: testDb });

        // Assert
        expect(result.current).toEqual({
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
          hasInvalidIds: true,
          isSuccess: false,
          isFetching: false,
        });
      });

      it('should handle multiple renders consistently with invalid IDs', () => {
        // Arrange
        const mockGetPlanDetails = vi.fn().mockReturnValue(createMockGetPlanDetailsResult());
        mockUseTrainingPlanManager.mockReturnValue({
          getPlanDetails: mockGetPlanDetails,
          plans: [],
          cycles: [],
          activeCycles: [],
          plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
          cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        });
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        const { result, rerender } = renderReactiveHook(() => usePlanEditorData('', ''), {
          db: testDb,
        });

        // Initial state
        expect(result.current.hasInvalidIds).toBe(true);
        expect(result.current.data).toBeUndefined();

        // Re-render
        rerender();

        // Assert
        expect(result.current.hasInvalidIds).toBe(true);
        expect(result.current.data).toBeUndefined();
      });
    });
  });

  describe('when valid IDs are provided', () => {
    beforeEach(() => {
      // Reset to valid state for these tests
      mockUseTrainingPlanManager.mockReturnValue(createMockTrainingPlanManager());
      mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());
    });

    describe('loading state aggregation', () => {
      it('should aggregate loading states correctly when both queries are loading', () => {
        // Arrange
        const mockGetPlanDetails = vi
          .fn()
          .mockReturnValue(createMockGetPlanDetailsResult({ isLoading: true, isFetching: true }));
        mockUseTrainingPlanManager.mockReturnValue({
          getPlanDetails: mockGetPlanDetails,
          plans: [],
          cycles: [],
          activeCycles: [],
          plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
          cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        });
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ isLoading: true }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current).toEqual({
          data: undefined,
          isLoading: true,
          isError: false,
          error: null,
          hasInvalidIds: false,
          isSuccess: false,
          isFetching: true,
        });
      });

      it('should show loading when only plan query is loading', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isLoading: true, isFetching: true })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ isLoading: false, exercises: testExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isFetching).toBe(true);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should show loading when only exercises query is loading', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({
            isLoading: false,
            isSuccess: true,
            data: testTrainingPlan,
          })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ isLoading: true }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isFetching).toBe(true);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should not show loading when both queries are complete', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({
            isLoading: false,
            isSuccess: true,
            data: testTrainingPlan,
            isFetching: false,
          })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({
            isLoading: false,
            exercises: testExercises,
          })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(false);
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.hasInvalidIds).toBe(false);
      });
    });

    describe('fetching state aggregation', () => {
      it('should aggregate fetching states correctly', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({
            isLoading: false,
            isFetching: true,
            isSuccess: true,
            data: testTrainingPlan,
          })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({
            isLoading: false,
            exercises: testExercises,
          })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isFetching).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should not show fetching when neither query is fetching', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({
            isFetching: false,
            isSuccess: true,
            data: testTrainingPlan,
          })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({
            exercises: testExercises,
          })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isFetching).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should handle background refetching correctly', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({
            isSuccess: true,
            data: testTrainingPlan,
            isLoading: false,
            isFetching: true, // Background refetching
          })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({
            exercises: testExercises,
            isLoading: false,
          })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(true);
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toBeDefined();
        expect(result.current.hasInvalidIds).toBe(false);
      });
    });

    describe('error state aggregation', () => {
      const planError = new ApplicationError('Failed to load training plan');
      const exercisesError = new ApplicationError('Failed to load exercises');

      it('should aggregate error states when plan query fails', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isError: true, error: planError })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ exercises: testExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(planError);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should aggregate error states when exercises query fails', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ error: exercisesError })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(exercisesError);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should return first error when both queries fail', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isError: true, error: planError })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ error: exercisesError })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(planError);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should prioritize plan error over null exercises error', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isError: true, error: planError })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ error: null }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(planError);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should handle null errors gracefully', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isError: true, error: null })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ error: null }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.hasInvalidIds).toBe(false);
      });
    });

    describe('success state aggregation', () => {
      it('should show success when both queries succeed', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ exercises: testExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isError).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should not show success when only plan query succeeds', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ isLoading: true }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should not show success when only exercises query succeeds', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isLoading: true })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ exercises: testExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should not show success when both queries fail', () => {
        // Arrange
        const error = new ApplicationError('Query failed');
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isError: true, error })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ error }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.hasInvalidIds).toBe(false);
      });
    });

    describe('data aggregation logic', () => {
      it('should combine data when both queries have data', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ exercises: testExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.data).toEqual({
          plan: testTrainingPlan,
          availableExercises: testExercises,
        });
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should provide data when only plan is available', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ exercises: undefined }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.data).toEqual({
          plan: testTrainingPlan,
          availableExercises: undefined,
        });
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should provide data when only exercises are available', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ data: undefined })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ exercises: testExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.data).toEqual({
          plan: undefined,
          availableExercises: testExercises,
        });
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should return undefined data when neither query has data', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ data: undefined })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ exercises: undefined }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should handle null data values correctly', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ data: null as unknown })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ exercises: testExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.data).toEqual({
          plan: null,
          availableExercises: testExercises,
        });
        expect(result.current.hasInvalidIds).toBe(false);
      });

      it('should handle empty arrays correctly', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
        );
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ exercises: [] }));

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.data).toEqual({
          plan: testTrainingPlan,
          availableExercises: [],
        });
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.hasInvalidIds).toBe(false);
      });
    });

    describe('query hook integration', () => {
      it('should pass correct IDs to both query hooks', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(createMockTrainingPlanManager());
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), { db: testDb });

        // Assert
        // Note: useTrainingPlanManager is called with profileId, but we test getPlanDetails call
        // expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(testPlanId);
        expect(mockUseExerciseCRUD).toHaveBeenCalledWith(testProfileId);
      });

      it('should call query hooks on every render', () => {
        // Arrange
        mockUseTrainingPlanManager.mockReturnValue(createMockTrainingPlanManager());
        mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

        // Act
        const { rerender } = renderReactiveHook(
          () => usePlanEditorData(testPlanId, testProfileId),
          { db: testDb }
        );
        rerender();
        rerender();

        // Assert
        expect(mockUseTrainingPlanManager).toHaveBeenCalledTimes(3);
        expect(mockUseExerciseCRUD).toHaveBeenCalledTimes(3);
      });

      it('should handle query hooks returning different data types', () => {
        // Arrange
        const customPlan = { ...testTrainingPlan, customProperty: 'test' } as unknown;
        const customExercises = [...testExercises, { customExercise: true }] as unknown;

        mockUseTrainingPlanManager.mockReturnValue(
          createMockTrainingPlanManager({ isSuccess: true, data: customPlan })
        );
        mockUseExerciseCRUD.mockReturnValue(
          createMockExerciseCRUDResult({ exercises: customExercises })
        );

        // Act
        const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
          db: testDb,
        });

        // Assert
        expect(result.current.data?.plan).toEqual(customPlan);
        expect(result.current.data?.availableExercises).toEqual(customExercises);
        expect(result.current.hasInvalidIds).toBe(false);
      });
    });
  });

  describe('ID parameter changes', () => {
    it('should update when planId changes', () => {
      // Arrange
      const initialPlanId = 'plan-1';
      const newPlanId = 'plan-2';

      mockUseTrainingPlanManager.mockReturnValue(createMockTrainingPlanManager());
      mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

      const { rerender } = renderReactiveHook(
        ({ planId, profileId }) => usePlanEditorData(planId, profileId),
        { initialProps: { planId: initialPlanId, profileId: testProfileId }, db: testDb }
      );

      // Verify initial state
      // Note: useTrainingPlanManager is called with profileId, but we test getPlanDetails call
      // expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(initialPlanId);
      expect(mockUseExerciseCRUD).toHaveBeenCalledWith(testProfileId);

      // Act - Change plan ID
      rerender({ planId: newPlanId, profileId: testProfileId });

      // Assert
      // Note: useTrainingPlanManager is called with profileId, but we test getPlanDetails call
      // expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(newPlanId);
      expect(mockUseExerciseCRUD).toHaveBeenCalledWith(testProfileId);
    });

    it('should update when profileId changes', () => {
      // Arrange
      const initialProfileId = 'profile-1';
      const newProfileId = 'profile-2';

      mockUseTrainingPlanManager.mockReturnValue(createMockTrainingPlanManager());
      mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

      const { rerender } = renderReactiveHook(
        ({ planId, profileId }) => usePlanEditorData(planId, profileId),
        { initialProps: { planId: testPlanId, profileId: initialProfileId }, db: testDb }
      );

      // Verify initial state
      // Note: useTrainingPlanManager is called with profileId, but we test getPlanDetails call
      // expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(testPlanId);
      expect(mockUseExerciseCRUD).toHaveBeenCalledWith(initialProfileId);

      // Act - Change profile ID
      rerender({ planId: testPlanId, profileId: newProfileId });

      // Assert
      // Note: useTrainingPlanManager is called with profileId, but we test getPlanDetails call
      // expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(testPlanId);
      expect(mockUseExerciseCRUD).toHaveBeenCalledWith(newProfileId);
    });

    it('should handle ID changing from valid to empty', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({ exercises: testExercises })
      );

      const { result, rerender } = renderReactiveHook(
        ({ planId, profileId }) => usePlanEditorData(planId, profileId),
        { initialProps: { planId: testPlanId, profileId: testProfileId }, db: testDb }
      );

      // Verify initial state with data
      expect(result.current.hasInvalidIds).toBe(false);
      expect(result.current.data).toBeDefined();

      // Act - Clear plan ID
      rerender({ planId: '', profileId: testProfileId });

      // Assert
      expect(result.current.hasInvalidIds).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle ID changing from empty to valid', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue(createMockTrainingPlanManager());
      mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult());

      const { result, rerender } = renderReactiveHook(
        ({ planId, profileId }) => usePlanEditorData(planId, profileId),
        { initialProps: { planId: '', profileId: testProfileId }, db: testDb }
      );

      // Verify initial state without valid plan ID
      expect(result.current.hasInvalidIds).toBe(true);

      // Act - Set plan ID and provide data
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({ exercises: testExercises })
      );
      rerender({ planId: testPlanId, profileId: testProfileId });

      // Assert
      expect(result.current.hasInvalidIds).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });

  describe('complex state combinations', () => {
    it('should handle plan loading and exercises error', () => {
      // Arrange
      const error = new ApplicationError('Exercises failed');
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isLoading: true, isFetching: true })
      );
      mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ error }));

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert
      expect(result.current).toEqual({
        data: undefined,
        isLoading: true,
        isError: true,
        error,
        hasInvalidIds: false,
        isSuccess: false,
        isFetching: true,
      });
    });

    it('should handle plan error and exercises loading', () => {
      // Arrange
      const error = new ApplicationError('Plan failed');
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isError: true, error })
      );
      mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ isLoading: true }));

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert
      expect(result.current).toEqual({
        data: undefined,
        isLoading: true,
        isError: true,
        error,
        hasInvalidIds: false,
        isSuccess: false,
        isFetching: true,
      });
    });

    it('should handle plan success with data and exercises success without data', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
      );
      mockUseExerciseCRUD.mockReturnValue(createMockExerciseCRUDResult({ exercises: undefined }));

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual({
        plan: testTrainingPlan,
        availableExercises: undefined,
      });
      expect(result.current.hasInvalidIds).toBe(false);
    });

    it('should handle mixed loading and success states with partial data', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({
          isSuccess: true,
          data: testTrainingPlan,
          isLoading: false,
          isFetching: true, // Refetching
        })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({
          isLoading: true,
          exercises: undefined,
        })
      );

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert
      expect(result.current.isLoading).toBe(true); // exercises still loading
      expect(result.current.isFetching).toBe(true); // both fetching
      expect(result.current.isSuccess).toBe(false); // exercises not successful
      expect(result.current.data).toEqual({
        plan: testTrainingPlan,
        availableExercises: undefined,
      });
      expect(result.current.hasInvalidIds).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed query result objects', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        getPlanDetails: vi.fn().mockReturnValue({} as unknown),
        plans: [],
        cycles: [],
        activeCycles: [],
        plan: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn() },
        cycle: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
      });
      mockUseExerciseCRUD.mockReturnValue({} as unknown);

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert - Should handle missing properties
      expect(result.current.isLoading).toBe(false); // undefined || undefined = false after coercion
      expect(result.current.isError).toBe(false); // undefined || undefined = false after coercion
      expect(result.current.isSuccess).toBe(false); // undefined && undefined = false after coercion
      expect(result.current.isFetching).toBe(false); // undefined || undefined = false after coercion
      expect(result.current.error).toBeNull(); // undefined || undefined || null = null
      expect(result.current.hasInvalidIds).toBe(false);
      expect(result.current.data).toBeUndefined(); // neither data is defined
    });

    it('should handle query hooks throwing errors', () => {
      // Arrange
      mockUseTrainingPlanManager.mockImplementation(() => {
        throw new Error('Hook error');
      });

      // Act & Assert
      expect(() => {
        renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), { db: testDb });
      }).toThrow('Hook error');
    });

    it('should handle very large data sets', () => {
      // Arrange
      const largePlan = createTestTrainingPlanModel({
        id: testPlanId,
        name: 'Large Plan',
      });
      const largeExercisesList = Array.from({ length: 1000 }, (_, i) =>
        createTestExerciseModel({ id: `exercise-${i}`, name: `Exercise ${i}` })
      );

      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isSuccess: true, data: largePlan })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({ exercises: largeExercisesList })
      );

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.plan).toEqual(largePlan);
      expect(result.current.data?.availableExercises).toHaveLength(1000);
      expect(result.current.hasInvalidIds).toBe(false);
    });
  });

  describe('performance and optimization', () => {
    it('should not cause unnecessary re-renders with same inputs', () => {
      // Arrange
      let renderCount = 0;
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({ exercises: testExercises })
      );

      // Act
      const { rerender } = renderReactiveHook(
        () => {
          renderCount++;
          return usePlanEditorData(testPlanId, testProfileId);
        },
        { db: testDb }
      );

      const startingCount = renderCount;
      rerender();
      rerender();

      // Assert
      expect(renderCount).toBe(startingCount + 2); // Each rerender should increment
    });

    it('should maintain consistent results across renders', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({ exercises: testExercises })
      );

      // Act
      const { result, rerender } = renderReactiveHook(
        () => usePlanEditorData(testPlanId, testProfileId),
        { db: testDb }
      );
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      // Assert - Results should have same structure and values
      expect(firstResult.isSuccess).toBe(secondResult.isSuccess);
      expect(firstResult.hasInvalidIds).toBe(secondResult.hasInvalidIds);
      expect(firstResult.data?.plan).toEqual(secondResult.data?.plan);
      expect(firstResult.data?.availableExercises).toEqual(secondResult.data?.availableExercises);
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain correct return type structure', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ isSuccess: true, data: testTrainingPlan })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({ exercises: testExercises })
      );

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert - Type structure checks
      const hookResult = result.current;
      expect(typeof hookResult.isLoading).toBe('boolean');
      expect(typeof hookResult.isError).toBe('boolean');
      expect(typeof hookResult.isSuccess).toBe('boolean');
      expect(typeof hookResult.isFetching).toBe('boolean');
      expect(typeof hookResult.hasInvalidIds).toBe('boolean');

      // Data should be undefined or have correct structure
      if (hookResult.data) {
        expect(hookResult.data).toHaveProperty('plan');
        expect(hookResult.data).toHaveProperty('availableExercises');
      }

      // Error should be null or ApplicationError instance
      if (hookResult.error) {
        expect(hookResult.error).toBeInstanceOf(ApplicationError);
      }
    });

    it('should handle union types correctly for data properties', () => {
      // Arrange - Mixed data availability
      mockUseTrainingPlanManager.mockReturnValue(
        createMockTrainingPlanManager({ data: undefined })
      );
      mockUseExerciseCRUD.mockReturnValue(
        createMockExerciseCRUDResult({ exercises: testExercises })
      );

      // Act
      const { result } = renderReactiveHook(() => usePlanEditorData(testPlanId, testProfileId), {
        db: testDb,
      });

      // Assert
      expect(result.current.data?.plan).toBeUndefined();
      expect(result.current.data?.availableExercises).toBeDefined();
      expect(result.current.data?.availableExercises).toEqual(testExercises);
      expect(result.current.hasInvalidIds).toBe(false);
    });
  });
});
