import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DashboardMetrics,
  ProgressTrends,
  RecentActivity,
} from '@/features/dashboard/services/DashboardService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

import { useDashboardData } from '../useDashboardData';

// Mock the useActiveProfileId hook
const mockUseActiveProfileId = vi.hoisted(() => vi.fn());

// Mock individual dashboard hooks
const mockUseGetDashboardMetrics = vi.hoisted(() => vi.fn());
const mockUseGetRecentActivity = vi.hoisted(() => vi.fn());
const mockUseGetProgressTrends = vi.hoisted(() => vi.fn());

vi.mock('@/shared/hooks/useActiveProfileId', () => ({
  useActiveProfileId: mockUseActiveProfileId,
}));

vi.mock('../useGetDashboardMetrics', () => ({
  useGetDashboardMetrics: mockUseGetDashboardMetrics,
}));

vi.mock('../useGetRecentActivity', () => ({
  useGetRecentActivity: mockUseGetRecentActivity,
}));

vi.mock('../useGetProgressTrends', () => ({
  useGetProgressTrends: mockUseGetProgressTrends,
}));

// Test data
let queryClient: QueryClient;
const testProfileId = 'profile-123';

const testDashboardMetrics: DashboardMetrics = {
  totalWorkouts: 42,
  totalWorkoutTime: 3150, // in minutes
  averageWorkoutDuration: 75,
  workoutsThisWeek: 4,
  workoutsThisMonth: 16,
  currentStreak: 7,
  longestStreak: 14,
  totalPersonalRecords: 8,
  recentPersonalRecords: 2,
};

const testRecentActivity: RecentActivity = {
  recentWorkouts: [
    {
      id: 'workout-1',
      name: 'Push Day',
      startTime: new Date('2024-01-20T18:00:00Z'),
      duration: 75,
      exerciseCount: 6,
      setCount: 24,
    },
  ],
  recentPersonalRecords: [
    {
      id: 'pr-1',
      exerciseName: 'Bench Press',
      oneRepMax: 115,
      previousMax: 110,
      improvement: 5,
      date: new Date('2024-01-20T18:30:00Z'),
    },
  ],
};

const testProgressTrends: ProgressTrends = {
  workoutFrequency: [
    { date: new Date('2024-01-01'), count: 4 },
    { date: new Date('2024-01-08'), count: 5 },
    { date: new Date('2024-01-15'), count: 4 },
  ],
  strengthProgress: [
    {
      exerciseName: 'Bench Press',
      data: [
        { date: new Date('2023-11-01'), oneRepMax: 95 },
        { date: new Date('2023-12-01'), oneRepMax: 105 },
        { date: new Date('2024-01-01'), oneRepMax: 115 },
      ],
    },
  ],
  bodyWeightTrend: [
    { date: new Date('2023-11-01'), weight: 76.0 },
    { date: new Date('2023-12-01'), weight: 75.5 },
    { date: new Date('2024-01-01'), weight: 75.0 },
  ],
};

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDashboardData', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Setup default mock returns
    mockUseActiveProfileId.mockReturnValue(testProfileId);
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('successful data aggregation', () => {
    it('should aggregate all dashboard data successfully', async () => {
      // Arrange
      mockUseGetDashboardMetrics.mockReturnValue({
        data: testDashboardMetrics,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: testRecentActivity,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.data).toEqual({
        metrics: testDashboardMetrics,
        recentActivity: testRecentActivity,
        progressTrends: testProgressTrends,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.hasNoActiveProfile).toBe(false);
    });

    it('should handle partial data availability', async () => {
      // Arrange - Only metrics has data
      mockUseGetDashboardMetrics.mockReturnValue({
        data: testDashboardMetrics,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.data).toEqual({
        metrics: testDashboardMetrics,
        recentActivity: undefined,
        progressTrends: undefined,
      });
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('loading state aggregation', () => {
    it('should show loading when any query is loading', async () => {
      // Arrange
      mockUseGetDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
        isFetching: true,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: testRecentActivity,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
    });

    it('should show fetching when any query is fetching', async () => {
      // Arrange
      mockUseGetDashboardMetrics.mockReturnValue({
        data: testDashboardMetrics,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: true,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: testRecentActivity,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error state aggregation', () => {
    it('should show error when any query has error', async () => {
      // Arrange
      const metricsError = new ApplicationError('Metrics failed');
      mockUseGetDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isFetching: false,
        error: metricsError,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: testRecentActivity,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(metricsError);
      expect(result.current.isSuccess).toBe(false);
    });

    it('should return first error when multiple queries fail', async () => {
      // Arrange
      const metricsError = new ApplicationError('Metrics failed');
      const activityError = new ApplicationError('Activity failed');
      mockUseGetDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isFetching: false,
        error: metricsError,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isFetching: false,
        error: activityError,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(metricsError); // First error
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('success state aggregation', () => {
    it('should show success only when all queries succeed', async () => {
      // Arrange
      mockUseGetDashboardMetrics.mockReturnValue({
        data: testDashboardMetrics,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: testRecentActivity,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not show success when any query is still loading', async () => {
      // Arrange
      mockUseGetDashboardMetrics.mockReturnValue({
        data: testDashboardMetrics,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
        isFetching: true,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('no active profile handling', () => {
    it('should return empty state when no active profile', async () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.hasNoActiveProfile).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('hook dependency management', () => {
    it('should pass enabled=false to queries when no active profile', async () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);

      // Act
      renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(mockUseGetDashboardMetrics).toHaveBeenCalledWith(null, { enabled: false });
      expect(mockUseGetRecentActivity).toHaveBeenCalledWith(null, { enabled: false });
      expect(mockUseGetProgressTrends).toHaveBeenCalledWith(null, { enabled: false });
    });

    it('should pass enabled=true to queries when active profile exists', async () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(testProfileId);

      // Act
      renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(mockUseGetDashboardMetrics).toHaveBeenCalledWith(testProfileId, { enabled: true });
      expect(mockUseGetRecentActivity).toHaveBeenCalledWith(testProfileId, { enabled: true });
      expect(mockUseGetProgressTrends).toHaveBeenCalledWith(testProfileId, { enabled: true });
    });
  });

  describe('data combination logic', () => {
    it('should return undefined data when all queries have no data', async () => {
      // Arrange
      mockUseGetDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(true);
    });

    it('should return data when at least one query has data', async () => {
      // Arrange - Only activity has data
      mockUseGetDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: testRecentActivity,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.data).toEqual({
        metrics: undefined,
        recentActivity: testRecentActivity,
        progressTrends: undefined,
      });
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain correct return type structure', async () => {
      // Arrange
      mockUseGetDashboardMetrics.mockReturnValue({
        data: testDashboardMetrics,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetRecentActivity.mockReturnValue({
        data: testRecentActivity,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });
      mockUseGetProgressTrends.mockReturnValue({
        data: testProgressTrends,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      // Act
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Assert - Type structure checks
      const hookResult = result.current;
      expect(typeof hookResult.isLoading).toBe('boolean');
      expect(typeof hookResult.isError).toBe('boolean');
      expect(typeof hookResult.isSuccess).toBe('boolean');
      expect(typeof hookResult.isFetching).toBe('boolean');
      expect(typeof hookResult.hasNoActiveProfile).toBe('boolean');

      // data structure validation
      if (hookResult.data) {
        expect(hookResult.data).toHaveProperty('metrics');
        expect(hookResult.data).toHaveProperty('recentActivity');
        expect(hookResult.data).toHaveProperty('progressTrends');
      }
    });
  });
});
