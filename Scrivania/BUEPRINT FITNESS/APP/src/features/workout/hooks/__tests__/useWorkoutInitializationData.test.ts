import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { createTestWorkoutLogModel } from '@/test-factories';

// Create hoisted mocks for the dependencies
const mockUseTrainingPlanManager = vi.hoisted(() => vi.fn());
const mockUseGetLastWorkoutSummary = vi.hoisted(() => vi.fn());

// Mock the dependencies
vi.mock('@/features/training-plan/hooks/useTrainingPlanManager', () => ({
  useTrainingPlanManager: mockUseTrainingPlanManager,
}));

vi.mock('../useGetLastWorkoutSummary', () => ({
  useGetLastWorkoutSummary: mockUseGetLastWorkoutSummary,
}));

import { useWorkoutInitializationData } from '../useWorkoutInitializationData';

describe('useWorkoutInitializationData', () => {
  // Test data
  const testPlanId = '550e8400-e29b-41d4-a716-446655440001';
  const testSessionId = '550e8400-e29b-41d4-a716-446655440002';
  const testProfileId = '550e8400-e29b-41d4-a716-446655440003';

  // Note: This creates a mock structure that the hook expects
  // The actual TrainingPlanModel doesn't have cycles, but the hook implementation expects it
  const testTrainingPlan = {
    id: testPlanId,
    cycles: [
      {
        id: 'cycle-1',
        name: 'Test Cycle',
        sessions: [
          {
            id: testSessionId,
            name: 'Test Session',
            groups: [
              {
                id: 'group-1',
                name: 'Test Group',
                appliedExercises: [
                  { id: 'exercise-1', name: 'Test Exercise 1' },
                  { id: 'exercise-2', name: 'Test Exercise 2' },
                ],
              },
            ],
          },
          {
            id: 'other-session-id',
            name: 'Other Session',
            groups: [],
          },
        ],
      },
    ],
  };

  const testLastWorkout = createTestWorkoutLogModel({
    id: 'last-workout-id',
    profileId: testProfileId,
    sessionId: testSessionId,
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

  // Helper function to setup training plan manager mock
  const setupTrainingPlanManager = (queryResult: any) => {
    const mockGetPlanDetails = vi.fn().mockReturnValue(queryResult);
    mockUseTrainingPlanManager.mockReturnValue({
      getPlanDetails: mockGetPlanDetails,
    });
    return mockGetPlanDetails;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loading states', () => {
    it('should aggregate loading states correctly when both queries are loading', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isLoading: true, isFetching: true }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isLoading: true, isFetching: true })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current).toEqual({
        currentSession: undefined,
        lastPerformance: undefined,
        isLoading: true,
        error: null,
        isReady: false,
      });
    });

    it('should show loading when only training plan query is loading', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isLoading: true, isFetching: true }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isLoading: false, isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isReady).toBe(false);
    });

    it('should show loading when only last workout query is loading', () => {
      // Arrange
      setupTrainingPlanManager(
        createMockQueryResult({ isLoading: false, isSuccess: true, data: testTrainingPlan })
      );
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isLoading: true, isFetching: true })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isReady).toBe(false);
    });

    it('should not show loading when both queries are complete', () => {
      // Arrange
      setupTrainingPlanManager(
        createMockQueryResult({
          isLoading: false,
          isSuccess: true,
          data: testTrainingPlan,
          isFetching: false,
        })
      );
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({
          isLoading: false,
          isSuccess: true,
          data: testLastWorkout,
          isFetching: false,
        })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isReady).toBe(true);
    });
  });

  describe('error states', () => {
    const planError = new ApplicationError('Failed to load training plan');
    const workoutError = new ApplicationError('Failed to load last workout');

    it('should prioritize plan error when both queries fail', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isError: true, error: planError }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isError: true, error: workoutError })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.error).toBe(planError);
      expect(result.current.isReady).toBe(false);
    });

    it('should show plan error when plan query fails and workout succeeds', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isError: true, error: planError }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.error).toBe(planError);
      expect(result.current.isReady).toBe(false);
    });

    it('should show workout error when plan succeeds and workout query fails', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isError: true, error: workoutError })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.error).toBe(workoutError);
      expect(result.current.isReady).toBe(false);
    });

    it('should handle null errors gracefully', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isError: true, error: null }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isError: true, error: null })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.error).toBeNull();
      expect(result.current.isReady).toBe(false);
    });

    it('should prioritize plan error over null workout error', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isError: true, error: planError }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isError: true, error: null })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.error).toBe(planError);
    });
  });

  describe('session extraction', () => {
    it('should extract current session from training plan when session exists', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toEqual({
        id: testSessionId,
        name: 'Test Session',
        groups: [
          {
            id: 'group-1',
            name: 'Test Group',
            appliedExercises: [
              { id: 'exercise-1', name: 'Test Exercise 1' },
              { id: 'exercise-2', name: 'Test Exercise 2' },
            ],
          },
        ],
        exercises: [
          { id: 'exercise-1', name: 'Test Exercise 1' },
          { id: 'exercise-2', name: 'Test Exercise 2' },
        ],
      });
      expect(result.current.isReady).toBe(true);
    });

    it('should return undefined when session does not exist in training plan', () => {
      // Arrange
      const nonExistentSessionId = 'non-existent-session-id';
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, nonExistentSessionId, testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toBeUndefined();
      expect(result.current.isReady).toBe(false); // Not ready without valid session
    });

    it('should return undefined when training plan has no cycles', () => {
      // Arrange
      const planWithNoCycles = {
        id: testPlanId,
        cycles: [],
      };
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: planWithNoCycles }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toBeUndefined();
      expect(result.current.isReady).toBe(false);
    });

    it('should return undefined when training plan is not loaded', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: false, data: undefined }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toBeUndefined();
      expect(result.current.isReady).toBe(false);
    });

    it('should handle session with empty groups', () => {
      // Arrange
      const planWithEmptyGroups = {
        id: testPlanId,
        cycles: [
          {
            id: 'cycle-1',
            name: 'Test Cycle',
            sessions: [
              {
                id: testSessionId,
                name: 'Empty Session',
                groups: [],
              },
            ],
          },
        ],
      };
      setupTrainingPlanManager(
        createMockQueryResult({ isSuccess: true, data: planWithEmptyGroups })
      );
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toEqual({
        id: testSessionId,
        name: 'Empty Session',
        groups: [],
        exercises: [],
      });
      expect(result.current.isReady).toBe(true);
    });

    it('should search across multiple cycles to find session', () => {
      // Arrange
      const planWithMultipleCycles = {
        id: testPlanId,
        cycles: [
          {
            id: 'cycle-1',
            name: 'First Cycle',
            sessions: [
              {
                id: 'other-session-id',
                name: 'Other Session',
                groups: [],
              },
            ],
          },
          {
            id: 'cycle-2',
            name: 'Second Cycle',
            sessions: [
              {
                id: testSessionId,
                name: 'Target Session',
                groups: [
                  {
                    id: 'group-1',
                    name: 'Target Group',
                    appliedExercises: [{ id: 'exercise-1', name: 'Target Exercise' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      setupTrainingPlanManager(
        createMockQueryResult({ isSuccess: true, data: planWithMultipleCycles })
      );
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toEqual({
        id: testSessionId,
        name: 'Target Session',
        groups: [
          {
            id: 'group-1',
            name: 'Target Group',
            appliedExercises: [{ id: 'exercise-1', name: 'Target Exercise' }],
          },
        ],
        exercises: [{ id: 'exercise-1', name: 'Target Exercise' }],
      });
      expect(result.current.isReady).toBe(true);
    });

    it('should handle session with nested exercise structures correctly', () => {
      // Arrange
      const planWithNestedExercises = {
        id: testPlanId,
        cycles: [
          {
            id: 'cycle-1',
            name: 'Test Cycle',
            sessions: [
              {
                id: testSessionId,
                name: 'Complex Session',
                groups: [
                  {
                    id: 'group-1',
                    name: 'Group 1',
                    appliedExercises: [
                      { id: 'exercise-1', name: 'Exercise 1' },
                      { id: 'exercise-2', name: 'Exercise 2' },
                    ],
                  },
                  {
                    id: 'group-2',
                    name: 'Group 2',
                    appliedExercises: [{ id: 'exercise-3', name: 'Exercise 3' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      setupTrainingPlanManager(
        createMockQueryResult({ isSuccess: true, data: planWithNestedExercises })
      );
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.currentSession?.exercises).toEqual([
        { id: 'exercise-1', name: 'Exercise 1' },
        { id: 'exercise-2', name: 'Exercise 2' },
        { id: 'exercise-3', name: 'Exercise 3' },
      ]);
    });

    it('should handle missing sessionId parameter', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, '', testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toBeUndefined();
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('last performance data', () => {
    it('should return last performance when available', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.lastPerformance).toEqual(testLastWorkout);
      expect(result.current.isReady).toBe(true);
    });

    it('should handle undefined last performance', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: undefined })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.lastPerformance).toBeUndefined();
      expect(result.current.isReady).toBe(true); // Still ready even without last performance
    });

    it('should handle null last performance', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: null })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.lastPerformance).toBeNull();
      expect(result.current.isReady).toBe(true);
    });
  });

  describe('readiness logic', () => {
    it('should be ready when both queries succeed and session is found', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.isReady).toBe(true);
    });

    it('should not be ready when loading', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isLoading: true }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.isReady).toBe(false);
    });

    it('should not be ready when there is an error', () => {
      // Arrange
      const error = new ApplicationError('Query failed');
      setupTrainingPlanManager(createMockQueryResult({ isError: true, error }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.isReady).toBe(false);
    });

    it('should not be ready when current session is not found', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act - Using non-existent session ID
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, 'non-existent-session', testProfileId)
      );

      // Assert
      expect(result.current.isReady).toBe(false);
    });

    it('should be ready even without last performance if session is found', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: undefined })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current.isReady).toBe(true);
      expect(result.current.lastPerformance).toBeUndefined();
    });
  });

  describe('hook dependencies and calls', () => {
    it('should call useTrainingPlanManager with correct parameters', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult());
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act
      renderHook(() => useWorkoutInitializationData(testPlanId, testSessionId, testProfileId));

      // Assert
      expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(testProfileId);
    });

    it('should call useGetLastWorkoutSummary with correct parameters', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult());
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act
      renderHook(() => useWorkoutInitializationData(testPlanId, testSessionId, testProfileId));

      // Assert
      expect(mockUseGetLastWorkoutSummary).toHaveBeenCalledWith(testProfileId, testSessionId);
    });

    it('should call both hooks on every render', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult());
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act
      const { rerender } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );
      rerender();
      rerender();

      // Assert
      expect(mockUseTrainingPlanManager).toHaveBeenCalledTimes(3);
      expect(mockUseGetLastWorkoutSummary).toHaveBeenCalledTimes(3);
    });

    it('should handle parameter changes', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult());
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act
      const { result, rerender } = renderHook(
        ({ planId, sessionId, profileId }) =>
          useWorkoutInitializationData(planId, sessionId, profileId),
        {
          initialProps: {
            planId: testPlanId,
            sessionId: testSessionId,
            profileId: testProfileId,
          },
        }
      );

      // Change parameters
      const newPlanId = 'new-plan-id';
      const newSessionId = 'new-session-id';
      const newProfileId = 'new-profile-id';

      rerender({
        planId: newPlanId,
        sessionId: newSessionId,
        profileId: newProfileId,
      });

      // Assert
      expect(mockUseTrainingPlanManager).toHaveBeenLastCalledWith(newProfileId);
      expect(mockUseGetLastWorkoutSummary).toHaveBeenLastCalledWith(newProfileId, newSessionId);
    });
  });

  describe('complex state combinations', () => {
    it('should handle plan loading and workout error', () => {
      // Arrange
      const workoutError = new ApplicationError('Workout failed');
      setupTrainingPlanManager(createMockQueryResult({ isLoading: true }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isError: true, error: workoutError })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current).toEqual({
        currentSession: undefined,
        lastPerformance: undefined,
        isLoading: true,
        error: workoutError,
        isReady: false,
      });
    });

    it('should handle plan error and workout loading', () => {
      // Arrange
      const planError = new ApplicationError('Plan failed');
      setupTrainingPlanManager(createMockQueryResult({ isError: true, error: planError }));
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult({ isLoading: true }));

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert
      expect(result.current).toEqual({
        currentSession: undefined,
        lastPerformance: undefined,
        isLoading: true,
        error: planError, // Plan error takes priority
        isReady: false,
      });
    });

    it('should handle plan success with session not found and workout success', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act - Using non-existent session ID
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, 'non-existent-session', testProfileId)
      );

      // Assert
      expect(result.current.currentSession).toBeUndefined();
      expect(result.current.lastPerformance).toEqual(testLastWorkout);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isReady).toBe(false); // Not ready without valid session
    });
  });

  describe('useMemo optimization', () => {
    it('should recompute currentSession when training plan data changes', () => {
      // Arrange
      const initialPlan = {
        id: testPlanId,
        cycles: [
          {
            id: 'cycle-1',
            name: 'Initial Cycle',
            sessions: [
              {
                id: testSessionId,
                name: 'Initial Session',
                groups: [],
              },
            ],
          },
        ],
      };

      const updatedPlan = {
        id: testPlanId,
        cycles: [
          {
            id: 'cycle-1',
            name: 'Updated Cycle',
            sessions: [
              {
                id: testSessionId,
                name: 'Updated Session',
                groups: [
                  {
                    id: 'new-group',
                    name: 'New Group',
                    appliedExercises: [{ id: 'new-exercise', name: 'New Exercise' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act - Initial render
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: initialPlan }));

      const { result, rerender } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      const initialSession = result.current.currentSession;
      expect(initialSession?.name).toBe('Initial Session');

      // Update training plan data
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: updatedPlan }));

      rerender();

      // Assert
      expect(result.current.currentSession?.name).toBe('Updated Session');
      expect(result.current.currentSession?.groups).toHaveLength(1);
    });

    it('should recompute currentSession when sessionId changes', () => {
      // Arrange
      const planWithMultipleSessions = {
        id: testPlanId,
        cycles: [
          {
            id: 'cycle-1',
            name: 'Test Cycle',
            sessions: [
              {
                id: 'session-1',
                name: 'First Session',
                groups: [],
              },
              {
                id: 'session-2',
                name: 'Second Session',
                groups: [],
              },
            ],
          },
        ],
      };

      setupTrainingPlanManager(
        createMockQueryResult({ isSuccess: true, data: planWithMultipleSessions })
      );
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act - Initial render with first session
      const { result, rerender } = renderHook(
        ({ sessionId }) => useWorkoutInitializationData(testPlanId, sessionId, testProfileId),
        {
          initialProps: { sessionId: 'session-1' },
        }
      );

      expect(result.current.currentSession?.name).toBe('First Session');

      // Change to second session
      rerender({ sessionId: 'session-2' });

      // Assert
      expect(result.current.currentSession?.name).toBe('Second Session');
    });
  });

  describe('edge cases', () => {
    it('should handle empty plan ID', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult());
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData('', testSessionId, testProfileId)
      );

      // Assert
      expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(testProfileId);
      expect(result.current.currentSession).toBeUndefined();
      expect(result.current.isReady).toBe(false);
    });

    it('should handle empty profile ID', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult());
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, '')
      );

      // Assert
      expect(mockUseGetLastWorkoutSummary).toHaveBeenCalledWith('', testSessionId);
      expect(result.current.lastPerformance).toBeUndefined();
    });

    it('should handle all empty parameters', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult());
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act
      const { result } = renderHook(() => useWorkoutInitializationData('', '', ''));

      // Assert
      expect(mockUseTrainingPlanManager).toHaveBeenCalledWith('');
      expect(mockUseGetLastWorkoutSummary).toHaveBeenCalledWith('', '');
      expect(result.current).toEqual({
        currentSession: undefined,
        lastPerformance: undefined,
        isLoading: false,
        error: null,
        isReady: false,
      });
    });

    it('should handle hook throwing errors', () => {
      // Arrange
      mockUseTrainingPlanManager.mockImplementation(() => {
        throw new Error('Hook error');
      });
      mockUseGetLastWorkoutSummary.mockReturnValue(createMockQueryResult());

      // Act & Assert
      expect(() => {
        renderHook(() => useWorkoutInitializationData(testPlanId, testSessionId, testProfileId));
      }).toThrow('Hook error');
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain correct return type structure', () => {
      // Arrange
      setupTrainingPlanManager(createMockQueryResult({ isSuccess: true, data: testTrainingPlan }));
      mockUseGetLastWorkoutSummary.mockReturnValue(
        createMockQueryResult({ isSuccess: true, data: testLastWorkout })
      );

      // Act
      const { result } = renderHook(() =>
        useWorkoutInitializationData(testPlanId, testSessionId, testProfileId)
      );

      // Assert - Type structure checks
      const hookResult = result.current;
      expect(typeof hookResult.isLoading).toBe('boolean');
      expect(typeof hookResult.isReady).toBe('boolean');

      // currentSession should be undefined or have correct structure
      if (hookResult.currentSession) {
        expect(hookResult.currentSession).toHaveProperty('id');
        expect(hookResult.currentSession).toHaveProperty('name');
        expect(hookResult.currentSession).toHaveProperty('groups');
        expect(hookResult.currentSession).toHaveProperty('exercises');
        expect(Array.isArray(hookResult.currentSession.groups)).toBe(true);
        expect(Array.isArray(hookResult.currentSession.exercises)).toBe(true);
      }

      // lastPerformance should be undefined or WorkoutLogModel instance
      if (hookResult.lastPerformance) {
        expect(hookResult.lastPerformance).toBeInstanceOf(WorkoutLogModel);
      }

      // error should be null or ApplicationError instance
      if (hookResult.error) {
        expect(hookResult.error).toBeInstanceOf(ApplicationError);
      }
    });
  });
});
