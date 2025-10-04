import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';

import { useGetTrainingPlan } from '../useGetTrainingPlan';

// Mock the useObserveQuery hook to prevent infinite loops during testing
const mockUseObserveQuery = vi.hoisted(() => vi.fn());
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

// Simplified mock service to prevent memory leaks
const mockTrainingPlanQueryService = vi.hoisted(() => {
  const createMockQuery = (mockData: any[] = []) => ({
    observe: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockImplementation((observers) => {
        const subscription = {
          unsubscribe: vi.fn(),
        };

        // Don't call next() automatically - let the test control when data changes occur
        // This prevents the infinite update loop
        return subscription;
      }),
    }),
    fetch: vi.fn().mockResolvedValue(mockData),
  });

  return {
    getTrainingPlanQuery: vi.fn().mockImplementation(() => createMockQuery([])),
    _createMockQuery: createMockQuery,
  };
});

// Mock tsyringe container to resolve the service
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
  container: {
    resolve: vi.fn().mockReturnValue(mockTrainingPlanQueryService),
    registerInstance: vi.fn(),
    register: vi.fn(),
    registerSingleton: vi.fn(),
  },
}));

// Mock the TrainingPlanQueryService
vi.mock('@/features/training-plan/query-services/TrainingPlanQueryService');

describe('useGetTrainingPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for useObserveQuery
    mockUseObserveQuery.mockImplementation((query, options) => ({
      data: [],
      isObserving: !!(query && options?.enabled !== false),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should return empty result when planId is not provided', () => {
      const { result } = renderHook(() => useGetTrainingPlan(''));

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingPlanQuery).not.toHaveBeenCalled();
    });

    it('should return empty result when hook is disabled', () => {
      const planId = 'test-plan-id';

      const { result } = renderHook(() => useGetTrainingPlan(planId, { enabled: false }));

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingPlanQuery).not.toHaveBeenCalled();
    });

    it('should create query when planId is provided', () => {
      const planId = 'test-plan-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlanQuery.mockReturnValue(mockQuery);

      const { result } = renderHook(() => useGetTrainingPlan(planId));

      expect(mockTrainingPlanQueryService.getTrainingPlanQuery).toHaveBeenCalledWith(planId);
      expect(result.current.isObserving).toBe(true);
    });
  });

  describe('Reactive Data Updates', () => {
    it('should call useObserveQuery with correct parameters', () => {
      const planId = 'test-plan-id';
      const mockQuery = { id: 'mock-query' };

      mockTrainingPlanQueryService.getTrainingPlanQuery.mockReturnValue(mockQuery);

      renderHook(() => useGetTrainingPlan(planId));

      expect(mockTrainingPlanQueryService.getTrainingPlanQuery).toHaveBeenCalledWith(planId);
      expect(mockUseObserveQuery).toHaveBeenCalledWith(
        mockQuery,
        expect.objectContaining({
          enabled: true,
          transform: expect.any(Function),
        })
      );
    });

    it('should handle non-existent training plan', () => {
      const nonExistentPlanId = 'non-existent-plan-id';
      const mockQuery = { id: 'mock-query' };

      mockTrainingPlanQueryService.getTrainingPlanQuery.mockReturnValue(mockQuery);

      const { result } = renderHook(() => useGetTrainingPlan(nonExistentPlanId));

      expect(result.current.isObserving).toBe(true);
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Hook Options and State Management', () => {
    it('should respect enabled option', () => {
      const planId = 'test-plan-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlanQuery.mockReturnValue(mockQuery);

      const { result } = renderHook(() => useGetTrainingPlan(planId, { enabled: true }));
      expect(result.current.isObserving).toBe(true);

      const { result: disabledResult } = renderHook(() =>
        useGetTrainingPlan(planId, { enabled: false })
      );
      expect(disabledResult.current.isObserving).toBe(false);
      expect(disabledResult.current.data).toEqual([]);
    });

    it('should handle planId changes properly', () => {
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn((observers) => {
            // Don't immediately call observers to prevent infinite loops
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlanQuery.mockReturnValue(mockQuery);

      const { result: result1 } = renderHook(() => useGetTrainingPlan('plan-1'));
      expect(mockTrainingPlanQueryService.getTrainingPlanQuery).toHaveBeenCalledWith('plan-1');
      expect(result1.current.isObserving).toBe(true);

      const { result: result2 } = renderHook(() => useGetTrainingPlan('plan-2'));
      expect(result2.current.isObserving).toBe(true);

      const { result: result3 } = renderHook(() => useGetTrainingPlan(''));
      expect(result3.current.isObserving).toBe(false);
      expect(result3.current.data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle query creation errors gracefully', () => {
      const planId = 'test-plan-id';

      mockTrainingPlanQueryService.getTrainingPlanQuery.mockImplementation(() => {
        throw new Error('Query creation failed');
      });

      expect(() => {
        renderHook(() => useGetTrainingPlan(planId));
      }).toThrow('Query creation failed');
    });

    it('should pass null query to useObserveQuery when disabled', () => {
      const planId = 'test-plan-id';

      renderHook(() => useGetTrainingPlan(planId, { enabled: false }));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('Query Management', () => {
    it('should create different queries for different planIds', () => {
      const mockQuery1 = { id: 'query-1' };
      const mockQuery2 = { id: 'query-2' };

      mockTrainingPlanQueryService.getTrainingPlanQuery
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      // Test with different planIds
      renderHook(() => useGetTrainingPlan('plan-1'));
      renderHook(() => useGetTrainingPlan('plan-2'));

      // Verify that query service was called for each planId
      expect(mockTrainingPlanQueryService.getTrainingPlanQuery).toHaveBeenCalledWith('plan-1');
      expect(mockTrainingPlanQueryService.getTrainingPlanQuery).toHaveBeenCalledWith('plan-2');

      // Verify useObserveQuery was called with different queries
      expect(mockUseObserveQuery).toHaveBeenCalledWith(mockQuery1, expect.any(Object));
      expect(mockUseObserveQuery).toHaveBeenCalledWith(mockQuery2, expect.any(Object));
    });

    it('should transform training plan data correctly', () => {
      const planId = 'test-plan-id';
      const mockQuery = { id: 'mock-query' };

      mockTrainingPlanQueryService.getTrainingPlanQuery.mockReturnValue(mockQuery);

      renderHook(() => useGetTrainingPlan(planId));

      // Get the transform function that was passed to useObserveQuery
      const callArgs = mockUseObserveQuery.mock.calls[0];
      const options = callArgs[1];
      const transform = options.transform;

      // Test transform function behavior
      expect(transform).toBeInstanceOf(Function);

      // Test empty array case
      expect(transform([])).toEqual([]);

      // Test with mock training plan that matches WatermelonDB model structure
      const mockTrainingPlan = {
        id: 'plan-1',
        _raw: {
          profile_id: 'test-profile',
          name: 'Test Plan',
          description: 'Test description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
      const result = transform([mockTrainingPlan]);
      expect(result).toHaveLength(1);
    });
  });
});
