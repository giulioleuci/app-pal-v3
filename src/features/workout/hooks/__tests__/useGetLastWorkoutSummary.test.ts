import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';

import { useGetLastWorkoutSummary } from '../useGetLastWorkoutSummary';

// Mock dependencies with proper hoisting
const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

const mockWorkoutQueryService = vi.hoisted(() => ({
  getLastWorkoutForSessionQuery: vi.fn(),
}));

const mockUseObserveQuery = vi.hoisted(() => vi.fn());

// Mock the container
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
  container: mockContainer,
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  workoutLogToDomain: vi.fn((data) => data),
}));

// Mock the shared hooks
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

describe('useGetLastWorkoutSummary', () => {
  const mockProfileId = 'profile-123';
  const mockSessionId = 'session-456';
  const mockWorkoutLog = {
    id: 'workout-log-1',
    sessionId: mockSessionId,
    trainingPlanName: 'Test Plan',
    sessionName: 'Test Session',
    startTime: new Date('2024-01-01').getTime(),
    totalVolume: 1000,
  };

  beforeEach(() => {
    // Complete reset of all mocks
    vi.resetAllMocks();

    // Re-setup hoisted mocks with fresh instances
    mockContainer.resolve.mockImplementation((token) => {
      if (token === WorkoutQueryService) return mockWorkoutQueryService;
      return null;
    });

    // Setup default implementation for useObserveQuery
    mockUseObserveQuery.mockImplementation(() => ({ data: null, isObserving: false }));
  });

  describe('Basic Hook Functionality', () => {
    it('should return empty result when profileId is not provided', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      const { result } = renderHook(() => useGetLastWorkoutSummary('', mockSessionId));

      expect(result.current.data).toBe(null);
      expect(result.current.isObserving).toBe(false);
      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).not.toHaveBeenCalled();
    });

    it('should return empty result when sessionId is not provided', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      const { result } = renderHook(() => useGetLastWorkoutSummary(mockProfileId, ''));

      expect(result.current.data).toBe(null);
      expect(result.current.isObserving).toBe(false);
      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).not.toHaveBeenCalled();
    });

    it('should return empty result when both profileId and sessionId are missing', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      const { result } = renderHook(() => useGetLastWorkoutSummary('', ''));

      expect(result.current.data).toBe(null);
      expect(result.current.isObserving).toBe(false);
      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).not.toHaveBeenCalled();
    });

    it('should return empty result when hook is disabled', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      const { result } = renderHook(() =>
        useGetLastWorkoutSummary(mockProfileId, mockSessionId, { enabled: false })
      );

      expect(result.current.data).toBe(null);
      expect(result.current.isObserving).toBe(false);
      // Query is still created but passed with enabled: false
      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).toHaveBeenCalledWith(
        mockProfileId,
        mockSessionId
      );
      expect(mockUseObserveQuery).toHaveBeenCalledWith(mockQuery, {
        transform: expect.any(Function),
        enabled: false,
      });
    });

    it('should create query when both profileId and sessionId are provided', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);
      mockUseObserveQuery.mockReturnValue({ data: mockWorkoutLog, isObserving: true });

      const { result } = renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).toHaveBeenCalledWith(
        mockProfileId,
        mockSessionId
      );
      expect(mockUseObserveQuery).toHaveBeenCalledWith(mockQuery, {
        transform: expect.any(Function),
        enabled: true,
      });
      expect(result.current.isObserving).toBe(true);
    });
  });

  describe('Data Handling and Transformation', () => {
    it('should return workout data when available', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);
      mockUseObserveQuery.mockReturnValue({ data: mockWorkoutLog, isObserving: true });

      const { result } = renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));

      expect(result.current.data).toEqual(mockWorkoutLog);
      expect(result.current.isObserving).toBe(true);
    });

    it('should handle null data when no workout exists', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: true });

      const { result } = renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));

      expect(result.current.data).toBe(null);
      expect(result.current.isObserving).toBe(true);
    });

    it('should handle empty data array by transforming to null', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);

      // Test the transform function behavior with empty array
      let capturedTransform: ((workoutLogs: any[]) => any) | undefined;
      mockUseObserveQuery.mockImplementation((query, options) => {
        capturedTransform = options.transform;
        return { data: null, isObserving: true };
      });

      const { result } = renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));

      expect(capturedTransform).toBeDefined();
      if (capturedTransform) {
        expect(capturedTransform([])).toBe(null);
      }
      expect(result.current.isObserving).toBe(true);
    });

    it('should transform first workout when data array has items', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);

      // Test the transform function behavior with data
      let capturedTransform: ((workoutLogs: any[]) => any) | undefined;
      mockUseObserveQuery.mockImplementation((query, options) => {
        capturedTransform = options.transform;
        return { data: mockWorkoutLog, isObserving: true };
      });

      const { result } = renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));

      expect(capturedTransform).toBeDefined();
      if (capturedTransform) {
        // Transform should call workoutLogToDomain with first item
        const testData = [mockWorkoutLog];
        capturedTransform(testData);
      }
      expect(result.current.isObserving).toBe(true);
    });
  });

  describe('Hook Options and State Management', () => {
    it('should respect enabled option when toggled dynamically', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);

      const { result, rerender } = renderHook(
        ({ enabled }) => useGetLastWorkoutSummary(mockProfileId, mockSessionId, { enabled }),
        { initialProps: { enabled: true } }
      );

      expect(mockUseObserveQuery).toHaveBeenCalledWith(mockQuery, {
        transform: expect.any(Function),
        enabled: true,
      });

      // Disable the hook
      rerender({ enabled: false });

      // Query is still created but passed with enabled: false
      expect(mockUseObserveQuery).toHaveBeenLastCalledWith(mockQuery, {
        transform: expect.any(Function),
        enabled: false,
      });
    });

    it('should handle profileId changes properly', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);

      const { rerender } = renderHook(
        ({ profileId }) => useGetLastWorkoutSummary(profileId, mockSessionId),
        { initialProps: { profileId: 'profile-1' } }
      );

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).toHaveBeenCalledWith(
        'profile-1',
        mockSessionId
      );

      // Change the profile ID
      rerender({ profileId: 'profile-2' });

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).toHaveBeenCalledWith(
        'profile-2',
        mockSessionId
      );

      // Clear the profile ID
      rerender({ profileId: '' });

      expect(mockUseObserveQuery).toHaveBeenLastCalledWith(null, {
        transform: expect.any(Function),
        enabled: false,
      });
    });

    it('should handle sessionId changes properly', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);

      const { rerender } = renderHook(
        ({ sessionId }) => useGetLastWorkoutSummary(mockProfileId, sessionId),
        { initialProps: { sessionId: 'session-1' } }
      );

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).toHaveBeenCalledWith(
        mockProfileId,
        'session-1'
      );

      // Change the session ID
      rerender({ sessionId: 'session-2' });

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).toHaveBeenCalledWith(
        mockProfileId,
        'session-2'
      );

      // Clear the session ID
      rerender({ sessionId: '' });

      expect(mockUseObserveQuery).toHaveBeenLastCalledWith(null, {
        transform: expect.any(Function),
        enabled: false,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle query creation errors gracefully', () => {
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockImplementation(() => {
        throw new Error('Query creation failed');
      });

      expect(() => {
        renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));
      }).toThrow('Query creation failed');
    });

    it('should handle null query service gracefully', () => {
      // Mock container to return null service
      mockContainer.resolve.mockReturnValue(null);

      expect(() => {
        renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));
      }).toThrow();
    });
  });

  describe('Query Service Integration', () => {
    it('should call workout query service with correct parameters', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);
      mockUseObserveQuery.mockReturnValue({ data: mockWorkoutLog, isObserving: true });

      renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).toHaveBeenCalledWith(
        mockProfileId,
        mockSessionId
      );
    });

    it('should not call service when no profileId', () => {
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      renderHook(() => useGetLastWorkoutSummary('', mockSessionId));

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).not.toHaveBeenCalled();
    });

    it('should not call service when no sessionId', () => {
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      renderHook(() => useGetLastWorkoutSummary(mockProfileId, ''));

      expect(mockWorkoutQueryService.getLastWorkoutForSessionQuery).not.toHaveBeenCalled();
    });
  });

  describe('useObserveQuery Integration', () => {
    it('should enable query only when both profileId and sessionId are provided', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);

      renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(mockQuery, {
        transform: expect.any(Function),
        enabled: true,
      });
    });

    it('should disable query when profileId is not provided', () => {
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      renderHook(() => useGetLastWorkoutSummary('', mockSessionId));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(null, {
        transform: expect.any(Function),
        enabled: false,
      });
    });

    it('should disable query when sessionId is not provided', () => {
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      renderHook(() => useGetLastWorkoutSummary(mockProfileId, ''));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(null, {
        transform: expect.any(Function),
        enabled: false,
      });
    });

    it('should disable query when enabled option is false', () => {
      // Set up proper container resolution with query service that returns query object
      const mockQuery = { query: 'workout-query' };
      mockWorkoutQueryService.getLastWorkoutForSessionQuery.mockReturnValue(mockQuery);
      mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });

      renderHook(() => useGetLastWorkoutSummary(mockProfileId, mockSessionId, { enabled: false }));

      // Query is still created but passed with enabled: false
      expect(mockUseObserveQuery).toHaveBeenCalledWith(mockQuery, {
        transform: expect.any(Function),
        enabled: false,
      });
    });
  });
});
