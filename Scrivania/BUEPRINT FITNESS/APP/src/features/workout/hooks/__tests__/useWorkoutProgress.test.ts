import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks for proper initialization order
const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

const mockWorkoutQueryService = vi.hoisted(() => ({
  getWorkoutLog: vi.fn(),
}));

const mockUseObserveQuery = vi.hoisted(() => vi.fn());
const mockWorkoutLogsToDomain = vi.hoisted(() => vi.fn());

// Mock the container
vi.mock('tsyringe', () => ({
  container: mockContainer,
}));

import { useWorkoutProgress } from '../useWorkoutProgress';

// Mock the query service
vi.mock('@/features/workout/query-services/WorkoutQueryService', () => ({
  WorkoutQueryService: vi.fn(),
}));

// Mock the shared hooks
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  workoutLogsToDomain: mockWorkoutLogsToDomain,
}));

describe('useWorkoutProgress', () => {
  const mockWorkoutId = 'workout-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockContainer.resolve.mockReturnValue(mockWorkoutQueryService);
    mockWorkoutQueryService.getWorkoutLog.mockReturnValue('mock-query');
    mockWorkoutLogsToDomain.mockImplementation((data) => data);
  });

  describe('when workoutId is provided', () => {
    it('should return default progress data when no workout is found', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current).toEqual({
        completedExercises: 0,
        totalExercises: 0,
        completedSets: 0,
        totalSets: 0,
        progressPercentage: 0,
      });
    });

    it('should return default progress data when workout array is empty', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current).toEqual({
        completedExercises: 0,
        totalExercises: 0,
        completedSets: 0,
        totalSets: 0,
        progressPercentage: 0,
      });
    });

    it('should calculate progress correctly with completed exercises', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([
          {
            sets: [{ completed: true }, { completed: true }, { completed: true }],
          },
          {
            sets: [{ completed: true }, { completed: false }],
          },
          {
            sets: [{ completed: true }, { completed: true }],
          },
        ]),
        getAllSets: vi
          .fn()
          .mockReturnValue([
            { completed: true },
            { completed: true },
            { completed: true },
            { completed: true },
            { completed: false },
            { completed: true },
            { completed: true },
          ]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current).toEqual({
        completedExercises: 2, // First and third exercises have all sets completed
        totalExercises: 3,
        completedSets: 6,
        totalSets: 7,
        progressPercentage: 86, // Math.round((6/7) * 100)
      });
    });

    it('should handle workout with no sets', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([{ sets: [] }, { sets: [] }]),
        getAllSets: vi.fn().mockReturnValue([]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current).toEqual({
        completedExercises: 0,
        totalExercises: 2,
        completedSets: 0,
        totalSets: 0,
        progressPercentage: 0,
      });
    });

    it('should handle workout with all sets completed', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([
          {
            sets: [{ completed: true }, { completed: true }],
          },
          {
            sets: [{ completed: true }],
          },
        ]),
        getAllSets: vi
          .fn()
          .mockReturnValue([{ completed: true }, { completed: true }, { completed: true }]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current).toEqual({
        completedExercises: 2,
        totalExercises: 2,
        completedSets: 3,
        totalSets: 3,
        progressPercentage: 100,
      });
    });

    it('should handle workout with no completed sets', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([
          {
            sets: [{ completed: false }, { completed: false }],
          },
          {
            sets: [{ completed: false }],
          },
        ]),
        getAllSets: vi
          .fn()
          .mockReturnValue([{ completed: false }, { completed: false }, { completed: false }]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current).toEqual({
        completedExercises: 0,
        totalExercises: 2,
        completedSets: 0,
        totalSets: 3,
        progressPercentage: 0,
      });
    });

    it('should handle single exercise with partial completion', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([
          {
            sets: [
              { completed: true },
              { completed: true },
              { completed: false },
              { completed: false },
            ],
          },
        ]),
        getAllSets: vi
          .fn()
          .mockReturnValue([
            { completed: true },
            { completed: true },
            { completed: false },
            { completed: false },
          ]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current).toEqual({
        completedExercises: 0, // Not all sets completed
        totalExercises: 1,
        completedSets: 2,
        totalSets: 4,
        progressPercentage: 50, // Math.round((2/4) * 100)
      });
    });
  });

  describe('when workoutId is empty or null', () => {
    it('should return default progress when workoutId is empty string', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => useWorkoutProgress(''));

      expect(result.current).toEqual({
        completedExercises: 0,
        totalExercises: 0,
        completedSets: 0,
        totalSets: 0,
        progressPercentage: 0,
      });

      expect(mockWorkoutQueryService.getWorkoutLog).not.toHaveBeenCalled();
    });

    it('should handle null workoutId gracefully', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => useWorkoutProgress(null as any));

      expect(result.current).toEqual({
        completedExercises: 0,
        totalExercises: 0,
        completedSets: 0,
        totalSets: 0,
        progressPercentage: 0,
      });

      expect(mockWorkoutQueryService.getWorkoutLog).not.toHaveBeenCalled();
    });
  });

  describe('useObserveQuery integration', () => {
    it('should call useObserveQuery with correct parameters', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(mockUseObserveQuery).toHaveBeenCalledWith('mock-query', {
        transform: mockWorkoutLogsToDomain,
        enabled: true,
      });
    });

    it('should disable query when workoutId is not provided', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useWorkoutProgress(''));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(null, {
        transform: mockWorkoutLogsToDomain,
        enabled: false,
      });
    });

    it('should call workout query service with correct workoutId', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(mockWorkoutQueryService.getWorkoutLog).toHaveBeenCalledWith(mockWorkoutId);
    });
  });

  describe('container dependency injection', () => {
    it('should resolve WorkoutQueryService from container', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(mockContainer.resolve).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('progress percentage calculation', () => {
    it('should round progress percentage correctly', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([{ sets: [{ completed: true }] }]),
        getAllSets: vi
          .fn()
          .mockReturnValue([{ completed: true }, { completed: false }, { completed: false }]), // 1/3 = 33.333...%
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current.progressPercentage).toBe(33); // Should be rounded
    });

    it('should handle edge case with very small progress', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([{ sets: [{ completed: false }] }]),
        getAllSets: vi
          .fn()
          .mockReturnValue(
            Array.from({ length: 100 }, () => ({ completed: false })).concat([{ completed: true }])
          ), // 1/101 ≈ 0.99%
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current.progressPercentage).toBe(1); // Should round to 1%
    });
  });

  describe('exercise completion logic', () => {
    it('should only count exercises as complete when ALL sets are done', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([
          {
            sets: [
              { completed: true },
              { completed: true },
              { completed: false }, // This makes exercise incomplete
            ],
          },
          {
            sets: [{ completed: true }, { completed: true }], // This exercise is complete
          },
        ]),
        getAllSets: vi
          .fn()
          .mockReturnValue([
            { completed: true },
            { completed: true },
            { completed: false },
            { completed: true },
            { completed: true },
          ]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current.completedExercises).toBe(1); // Only second exercise
      expect(result.current.totalExercises).toBe(2);
    });

    it('should handle exercise with single set', () => {
      const mockWorkout = {
        getAllExercises: vi.fn().mockReturnValue([
          {
            sets: [{ completed: true }],
          },
          {
            sets: [{ completed: false }],
          },
        ]),
        getAllSets: vi.fn().mockReturnValue([{ completed: true }, { completed: false }]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockWorkout] });

      const { result } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current.completedExercises).toBe(1);
      expect(result.current.totalExercises).toBe(2);
    });
  });

  describe('memoization behavior', () => {
    it('should recalculate when workout data changes', () => {
      const initialWorkout = {
        getAllExercises: vi.fn().mockReturnValue([{ sets: [{ completed: false }] }]),
        getAllSets: vi.fn().mockReturnValue([{ completed: false }]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [initialWorkout] });

      const { result, rerender } = renderHook(() => useWorkoutProgress(mockWorkoutId));

      expect(result.current.completedSets).toBe(0);

      // Change the workout data
      const updatedWorkout = {
        getAllExercises: vi.fn().mockReturnValue([{ sets: [{ completed: true }] }]),
        getAllSets: vi.fn().mockReturnValue([{ completed: true }]),
      };

      mockUseObserveQuery.mockReturnValue({ data: [updatedWorkout] });

      rerender();

      expect(result.current.completedSets).toBe(1);
      expect(result.current.completedExercises).toBe(1);
    });
  });
});
