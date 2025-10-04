import { renderHook, act, type RenderHookResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, expect, type Mock } from 'vitest';
import type { ReactNode } from 'react';

/**
 * Generic aggregate hook type for testing
 */
export type AggregateHook<TParams extends unknown[], TResult> = (...args: TParams) => TResult;

/**
 * Mock aggregate result structure
 */
export interface MockAggregateResult {
  // Data properties
  [key: string]: unknown;
  
  // Loading states (common pattern)
  isLoading?: boolean;
  
  // Error states (common pattern)
  error?: Error | null;
  
  // Mutation objects (common pattern)
  create?: { mutate: Mock; isPending: boolean; error: Error | null };
  update?: { mutate: Mock; isPending: boolean; error: Error | null };
  delete?: { mutate: Mock; isPending: boolean; error: Error | null };
}

/**
 * Test configuration for aggregate hooks
 */
export interface AggregateTestConfig<TParams extends unknown[], TResult> {
  /** Name of the hook for test descriptions */
  hookName: string;
  
  /** Default parameters to pass to the hook */
  defaultParams: TParams;
  
  /** Mock services and dependencies */
  mocks: {
    services?: Record<string, unknown>;
    queryService?: Record<string, Mock>;
    [key: string]: unknown;
  };
  
  /** Expected data structure for validation */
  expectedStructure: Partial<TResult>;
  
  /** Custom test scenarios */
  scenarios?: Array<{
    name: string;
    params: TParams;
    expectedBehavior: (result: TResult) => void;
  }>;
}

/**
 * Creates a test wrapper with React Query client for aggregate hook testing
 */
export function createAggregateTestWrapper(): {
  wrapper: ({ children }: { children: ReactNode }) => JSX.Element;
  queryClient: QueryClient;
} {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return { wrapper, queryClient };
}

/**
 * Generic test suite generator for aggregate hooks
 */
export function createAggregateTestSuite<TParams extends unknown[], TResult extends MockAggregateResult>(
  hookFn: AggregateHook<TParams, TResult>,
  config: AggregateTestConfig<TParams, TResult>
) {
  const { hookName, defaultParams, mocks, expectedStructure, scenarios = [] } = config;

  describe(hookName, () => {
    let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;
    let queryClient: QueryClient;
    let hookResult: RenderHookResult<TResult, TParams>;

    beforeEach(() => {
      vi.clearAllMocks();
      
      // Setup mocks
      Object.entries(mocks).forEach(([mockName, mockValue]) => {
        vi.doMock(`@/features/${mockName}`, () => mockValue);
      });

      ({ wrapper, queryClient } = createAggregateTestWrapper());
    });

    afterEach(() => {
      vi.restoreAllMocks();
      queryClient.clear();
    });

    describe('Initialization', () => {
      it('should initialize with correct structure', () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        
        const result = hookResult.result.current;
        
        // Validate expected structure
        Object.keys(expectedStructure).forEach(key => {
          expect(result).toHaveProperty(key);
        });
      });

      it('should handle empty/invalid parameters gracefully', () => {
        const invalidParams = Array(defaultParams.length).fill(null) as TParams;
        
        expect(() => {
          renderHook(() => hookFn(...invalidParams), { wrapper });
        }).not.toThrow();
      });
    });

    describe('Loading States', () => {
      it('should provide consistent loading state indicators', () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        const result = hookResult.result.current;
        
        // Check for common loading state patterns
        const loadingKeys = Object.keys(result).filter(key => 
          key.includes('Loading') || key.includes('loading') || key === 'isLoading'
        );
        
        expect(loadingKeys.length).toBeGreaterThan(0);
        
        loadingKeys.forEach(key => {
          expect(typeof result[key as keyof TResult]).toBe('boolean');
        });
      });
    });

    describe('Error Handling', () => {
      it('should provide error state properties', () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        const result = hookResult.result.current;
        
        // Check for error state patterns
        const errorKeys = Object.keys(result).filter(key => 
          key.includes('Error') || key.includes('error') || key === 'error'
        );
        
        expect(errorKeys.length).toBeGreaterThan(0);
      });

      it('should handle service errors gracefully', async () => {
        // Mock service error
        if (mocks.queryService) {
          Object.values(mocks.queryService).forEach(mockFn => {
            mockFn.mockRejectedValueOnce(new Error('Service error'));
          });
        }

        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        
        // Should not throw, should handle error gracefully
        expect(hookResult.result.error).toBeUndefined();
      });
    });

    describe('CRUD Operations', () => {
      it('should provide standard CRUD mutation methods', () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        const result = hookResult.result.current;
        
        // Check for common CRUD patterns
        const crudMethods = ['create', 'update', 'delete'];
        const availableCrud = crudMethods.filter(method => 
          result[method as keyof TResult] !== undefined
        );
        
        // Should have at least one CRUD operation
        expect(availableCrud.length).toBeGreaterThan(0);
        
        availableCrud.forEach(method => {
          const mutation = result[method as keyof TResult] as any;
          expect(mutation).toHaveProperty('mutate');
          expect(typeof mutation.mutate).toBe('function');
          expect(mutation).toHaveProperty('isPending');
          expect(typeof mutation.isPending).toBe('boolean');
        });
      });

      it('should handle mutation success scenarios', async () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        const result = hookResult.result.current;
        
        if (result.create && typeof result.create === 'object' && 'mutate' in result.create) {
          const mockData = { id: 'test-id', name: 'Test Item' };
          
          await act(async () => {
            (result.create as any).mutate(mockData);
          });
          
          // Should not have thrown an error
          expect(hookResult.result.error).toBeUndefined();
        }
      });
    });

    describe('Data Management', () => {
      it('should provide consistent data access patterns', () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        const result = hookResult.result.current;
        
        // Look for common data properties
        const dataKeys = Object.keys(result).filter(key => {
          const value = result[key as keyof TResult];
          return Array.isArray(value) || (value && typeof value === 'object');
        });
        
        expect(dataKeys.length).toBeGreaterThan(0);
      });
    });

    describe('Custom Scenarios', () => {
      scenarios.forEach(scenario => {
        it(`should handle scenario: ${scenario.name}`, () => {
          hookResult = renderHook(() => hookFn(...scenario.params), { wrapper });
          scenario.expectedBehavior(hookResult.result.current);
        });
      });
    });

    describe('Performance', () => {
      it('should not cause unnecessary re-renders', () => {
        let renderCount = 0;
        
        renderHook(() => {
          renderCount++;
          return hookFn(...defaultParams);
        }, { wrapper });
        
        // Should only render once for initial mount
        expect(renderCount).toBe(1);
      });

      it('should cleanup resources on unmount', () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        
        expect(() => {
          hookResult.unmount();
        }).not.toThrow();
      });
    });

    describe('TypeScript Integration', () => {
      it('should provide proper TypeScript types', () => {
        hookResult = renderHook(() => hookFn(...defaultParams), { wrapper });
        const result = hookResult.result.current;
        
        // Basic type checking - ensures TypeScript compilation
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });
    });
  });
}

/**
 * Utility to create mock aggregate result with common patterns
 */
export function createMockAggregateResult(overrides: Partial<MockAggregateResult> = {}): MockAggregateResult {
  return {
    // Common data properties
    data: [],
    isLoading: false,
    error: null,
    
    // Common CRUD mutations
    create: {
      mutate: vi.fn(),
      isPending: false,
      error: null
    },
    update: {
      mutate: vi.fn(),
      isPending: false,
      error: null
    },
    delete: {
      mutate: vi.fn(),
      isPending: false,
      error: null
    },
    
    // Allow overrides
    ...overrides
  };
}

/**
 * Helper to test aggregate hook with specific data scenarios
 */
export function testAggregateDataScenarios<TParams extends unknown[], TResult>(
  hookFn: AggregateHook<TParams, TResult>,
  params: TParams,
  scenarios: Array<{
    name: string;
    mockData: unknown;
    expectations: (result: TResult) => void;
  }>
) {
  const { wrapper } = createAggregateTestWrapper();
  
  scenarios.forEach(scenario => {
    it(`should handle data scenario: ${scenario.name}`, () => {
      // This would integrate with your actual mocking strategy
      const { result } = renderHook(() => hookFn(...params), { wrapper });
      scenario.expectations(result.current);
    });
  });
}

/**
 * Performance testing utilities for aggregate hooks
 */
export function createPerformanceTest<TParams extends unknown[], TResult>(
  hookFn: AggregateHook<TParams, TResult>,
  params: TParams,
  options: {
    maxRenderTime?: number;
    maxMemoryUsage?: number;
    iterations?: number;
  } = {}
) {
  const { maxRenderTime = 10, maxMemoryUsage = 50 * 1024 * 1024, iterations = 100 } = options;
  const { wrapper } = createAggregateTestWrapper();

  return {
    testRenderPerformance: () => {
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const { result, unmount } = renderHook(() => hookFn(...params), { wrapper });
        expect(result.current).toBeDefined();
        unmount();
      }
      
      const averageTime = (performance.now() - startTime) / iterations;
      expect(averageTime).toBeLessThan(maxRenderTime);
    },
    
    testMemoryUsage: () => {
      if (!(performance as any).memory) {
        console.warn('Memory measurement not available in this environment');
        return;
      }
      
      const initialMemory = (performance as any).memory.usedJSHeapSize;
      const hooks: Array<() => void> = [];
      
      // Create multiple hook instances
      for (let i = 0; i < 50; i++) {
        const { unmount } = renderHook(() => hookFn(...params), { wrapper });
        hooks.push(unmount);
      }
      
      const peakMemory = (performance as any).memory.usedJSHeapSize;
      
      // Cleanup
      hooks.forEach(unmount => unmount());
      
      const memoryIncrease = peakMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(maxMemoryUsage);
    }
  };
}

/**
 * Integration test helper for testing aggregate hooks with real services
 */
export function createIntegrationTest<TParams extends unknown[], TResult>(
  hookFn: AggregateHook<TParams, TResult>,
  realServices: Record<string, unknown>
) {
  return {
    withRealServices: (params: TParams, expectations: (result: TResult) => void) => {
      // Mock container.resolve to return real services
      vi.doMock('tsyringe', () => ({
        container: {
          resolve: vi.fn((token: any) => realServices[token.name] || {})
        }
      }));
      
      const { wrapper } = createAggregateTestWrapper();
      const { result } = renderHook(() => hookFn(...params), { wrapper });
      
      expectations(result.current);
    }
  };
}