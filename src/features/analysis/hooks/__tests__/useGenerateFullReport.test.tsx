import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalysisQueryService } from '@/features/analysis/query-services/AnalysisQueryService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

import {
  type FullAnalysisReport,
  type GenerateFullReportInput,
  useGenerateFullReport,
} from '../useGenerateFullReport';

// Create hoisted mocks
const mockQueryService = vi.hoisted(() => ({
  getVolumeAnalysis: vi.fn(),
  getFrequencyAnalysis: vi.fn(),
  getWeightProgress: vi.fn(),
  getStrengthProgress: vi.fn(),
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
const testProfileId = 'profile-123';
const testStartDate = new Date('2024-01-01');
const testEndDate = new Date('2024-01-31');
const testExerciseIds = ['exercise-1', 'exercise-2'];

// Test data for individual service methods that match the actual service types
const testStrengthData = {
  exerciseId: 'exercise-1',
  exerciseName: 'Bench Press',
  data: [
    { date: new Date('2024-01-01'), oneRepMax: 100, estimatedMax: 105 },
    { date: new Date('2024-01-31'), oneRepMax: 115, estimatedMax: 120 },
  ],
};

const testWeightData = {
  data: [
    { date: new Date('2024-01-01'), weight: 75.0 },
    { date: new Date('2024-01-31'), weight: 74.0 },
  ],
};

const testVolumeData = {
  totalWorkouts: 20,
  totalSets: 400,
  totalReps: 8000,
  totalVolume: 50000,
  averageSessionDuration: 90,
  timeRange: {
    startDate: testStartDate,
    endDate: testEndDate,
  },
};

const testFrequencyData = {
  workoutsPerWeek: 5,
  workoutsPerMonth: 20,
  totalWorkouts: 20,
  consistencyScore: 0.9,
  timeRange: {
    startDate: testStartDate,
    endDate: testEndDate,
  },
};

const testInput: GenerateFullReportInput = {
  profileId: testProfileId,
  startDate: testStartDate,
  endDate: testEndDate,
  exerciseIds: testExerciseIds,
};

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGenerateFullReport', () => {
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

  describe('successful report generation', () => {
    it('should generate full report successfully', async () => {
      // Arrange - Mock all individual service methods
      mockQueryService.getVolumeAnalysis.mockResolvedValue(testVolumeData);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);

      result.current.mutate(testInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.profileId).toBe(testProfileId);
      expect(result.current.data?.dateRange.startDate).toEqual(testStartDate);
      expect(result.current.data?.dateRange.endDate).toEqual(testEndDate);
      expect(result.current.error).toBeNull();

      // Verify service method calls
      expect(mockQueryService.getVolumeAnalysis).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
      expect(mockQueryService.getFrequencyAnalysis).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
      expect(mockQueryService.getWeightProgress).toHaveBeenCalledWith(
        testProfileId,
        testStartDate,
        testEndDate
      );
      expect(mockQueryService.getStrengthProgress).toHaveBeenCalledWith(
        testProfileId,
        'exercise-1',
        testStartDate,
        testEndDate
      );
    });

    it('should generate report without specific exercise IDs', async () => {
      // Arrange
      const inputWithoutExercises = {
        profileId: testProfileId,
        startDate: testStartDate,
        endDate: testEndDate,
      };

      // Mock service methods
      mockQueryService.getVolumeAnalysis.mockResolvedValue(testVolumeData);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      // No strength progress calls since no exercise IDs provided

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(inputWithoutExercises);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.profileId).toBe(testProfileId);
      expect(result.current.data?.strengthProgress).toEqual({});
      expect(mockQueryService.getStrengthProgress).not.toHaveBeenCalled();
    });

    it('should handle report with no data', async () => {
      // Arrange - Mock empty data from services
      const emptyVolumeData = {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        totalVolume: 0,
        averageSessionDuration: 0,
        timeRange: {
          startDate: testStartDate,
          endDate: testEndDate,
        },
      };

      const emptyFrequencyData = {
        workoutsPerWeek: 0,
        workoutsPerMonth: 0,
        totalWorkouts: 0,
        consistencyScore: 0,
        timeRange: {
          startDate: testStartDate,
          endDate: testEndDate,
        },
      };

      const emptyWeightData = {
        data: [],
      };

      mockQueryService.getVolumeAnalysis.mockResolvedValue(emptyVolumeData);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(emptyFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(emptyWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.overallSummary.performanceScore).toBeGreaterThanOrEqual(0);
      expect(result.current.data?.volumeAnalysis.totalVolume).toBe(0);
      expect(result.current.data?.frequencyAnalysis.totalWorkouts).toBe(0);
    });

    it('should handle long processing time report', async () => {
      // Arrange - Mock slow service responses
      mockQueryService.getVolumeAnalysis.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(testVolumeData), 100))
      );
      mockQueryService.getFrequencyAnalysis.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(testFrequencyData), 100))
      );
      mockQueryService.getWeightProgress.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(testWeightData), 100))
      );
      mockQueryService.getStrengthProgress.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(testStrengthData), 100))
      );

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.processingTime).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      // Arrange
      const error = new ApplicationError('Failed to generate full report');
      mockQueryService.getVolumeAnalysis.mockRejectedValue(error);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should handle profile not found errors', async () => {
      // Arrange
      const nonExistentProfileInput = { ...testInput, profileId: 'non-existent-profile' };
      const error = new ApplicationError('Profile not found');
      mockQueryService.getVolumeAnalysis.mockRejectedValue(error);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(nonExistentProfileInput);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(error);
      expect(mockQueryService.getVolumeAnalysis).toHaveBeenCalledWith(
        'non-existent-profile',
        testStartDate,
        testEndDate
      );
    });

    it('should handle invalid exercise IDs', async () => {
      // Arrange
      const inputWithInvalidExercises = {
        ...testInput,
        exerciseIds: ['invalid-exercise-1', 'invalid-exercise-2'],
      };
      const error = new ApplicationError('Some exercises were not found');
      mockQueryService.getVolumeAnalysis.mockResolvedValue(testVolumeData);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(inputWithInvalidExercises);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(error);
    });

    it('should handle computation timeout errors', async () => {
      // Arrange
      const error = new ApplicationError('Report generation timed out');
      mockQueryService.getVolumeAnalysis.mockResolvedValue(testVolumeData);
      mockQueryService.getFrequencyAnalysis.mockRejectedValue(error);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(result.current.error).toBe(error);
    });
  });

  describe('mutation states', () => {
    it('should show pending state during report generation', async () => {
      // Arrange - Set up slow-resolving promises for each service call
      let resolveVolumePromise: (value: any) => void;
      let resolveFrequencyPromise: (value: any) => void;
      let resolveWeightPromise: (value: any) => void;
      let resolveStrengthPromise: (value: any) => void;

      const volumePromise = new Promise((resolve) => {
        resolveVolumePromise = resolve;
      });
      const frequencyPromise = new Promise((resolve) => {
        resolveFrequencyPromise = resolve;
      });
      const weightPromise = new Promise((resolve) => {
        resolveWeightPromise = resolve;
      });
      const strengthPromise = new Promise((resolve) => {
        resolveStrengthPromise = resolve;
      });

      mockQueryService.getVolumeAnalysis.mockReturnValue(volumePromise);
      mockQueryService.getFrequencyAnalysis.mockReturnValue(frequencyPromise);
      mockQueryService.getWeightProgress.mockReturnValue(weightPromise);
      mockQueryService.getStrengthProgress.mockReturnValue(strengthPromise);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      // Assert pending state immediately - use a small delay to catch the pending state
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(result.current.isPending).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();

      // Resolve all promises
      resolveVolumePromise!(testVolumeData);
      resolveFrequencyPromise!(testFrequencyData);
      resolveWeightPromise!(testWeightData);
      resolveStrengthPromise!(testStrengthData);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });

    it('should reset state on new mutation', async () => {
      // Arrange - Mock first set of calls
      mockQueryService.getVolumeAnalysis.mockResolvedValue(testVolumeData);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      // Act - First mutation
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.dateRange.startDate).toEqual(testStartDate);

      // Act - Second mutation with different input
      const newInput = {
        ...testInput,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-28'),
      };

      result.current.mutate(newInput);

      await waitFor(() => {
        expect(result.current.data?.dateRange.startDate).toEqual(newInput.startDate);
      });

      // Assert
      expect(mockQueryService.getVolumeAnalysis).toHaveBeenCalledTimes(2);
      expect(mockQueryService.getVolumeAnalysis).toHaveBeenLastCalledWith(
        testProfileId,
        newInput.startDate,
        newInput.endDate
      );
    });
  });

  describe('React Query integration', () => {
    it('should work with mutation options', async () => {
      // Arrange
      mockQueryService.getVolumeAnalysis.mockResolvedValue(testVolumeData);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      const onSuccess = vi.fn();
      const onError = vi.fn();

      // Act
      const { result } = renderHook(() => useGenerateFullReport({ onSuccess, onError }), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId: testProfileId,
          dateRange: expect.objectContaining({
            startDate: testStartDate,
            endDate: testEndDate,
          }),
        }),
        testInput,
        undefined
      );
      expect(onError).not.toHaveBeenCalled();
    });

    it('should trigger onError callback on failure', async () => {
      // Arrange
      const error = new ApplicationError('Report generation failed');
      mockQueryService.getVolumeAnalysis.mockRejectedValue(error);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      const onSuccess = vi.fn();
      const onError = vi.fn();

      // Act
      const { result } = renderHook(() => useGenerateFullReport({ onSuccess, onError }), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert
      expect(onError).toHaveBeenCalledWith(error, testInput, undefined);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain correct return type structure', async () => {
      // Arrange
      mockQueryService.getVolumeAnalysis.mockResolvedValue(testVolumeData);
      mockQueryService.getFrequencyAnalysis.mockResolvedValue(testFrequencyData);
      mockQueryService.getWeightProgress.mockResolvedValue(testWeightData);
      mockQueryService.getStrengthProgress.mockResolvedValue(testStrengthData);

      // Act
      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(testInput);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - Type structure checks
      const mutationResult = result.current;
      expect(typeof mutationResult.isPending).toBe('boolean');
      expect(typeof mutationResult.isError).toBe('boolean');
      expect(typeof mutationResult.isSuccess).toBe('boolean');

      // Data should be FullAnalysisReport
      if (mutationResult.data) {
        expect(mutationResult.data).toHaveProperty('profileId');
        expect(mutationResult.data).toHaveProperty('dateRange');
        expect(mutationResult.data).toHaveProperty('strengthProgress');
        expect(mutationResult.data).toHaveProperty('weightProgress');
        expect(mutationResult.data).toHaveProperty('volumeAnalysis');
        expect(mutationResult.data).toHaveProperty('frequencyAnalysis');
        expect(mutationResult.data).toHaveProperty('overallSummary');
        expect(mutationResult.data).toHaveProperty('generatedAt');
        expect(mutationResult.data).toHaveProperty('processingTime');

        expect(mutationResult.data.profileId).toBe(testProfileId);
        expect(mutationResult.data.generatedAt).toBeInstanceOf(Date);
        expect(typeof mutationResult.data.processingTime).toBe('number');
        expect(typeof mutationResult.data.overallSummary.performanceScore).toBe('number');
        expect(Array.isArray(mutationResult.data.overallSummary.keyInsights)).toBe(true);
        expect(Array.isArray(mutationResult.data.overallSummary.recommendations)).toBe(true);
      }
    });

    it('should handle input parameter validation', () => {
      // Arrange
      const invalidInput = {
        profileId: '', // Empty profileId
        startDate: testStartDate,
        endDate: testEndDate,
      };

      // Act & Assert
      expect(() => {
        renderHook(() => useGenerateFullReport(), {
          wrapper: createWrapper(),
        });
      }).not.toThrow(); // Should not throw at render time

      const { result } = renderHook(() => useGenerateFullReport(), {
        wrapper: createWrapper(),
      });

      // Should be able to call mutate with invalid input (error handling happens in service)
      expect(() => {
        result.current.mutate(invalidInput);
      }).not.toThrow();
    });
  });
});
