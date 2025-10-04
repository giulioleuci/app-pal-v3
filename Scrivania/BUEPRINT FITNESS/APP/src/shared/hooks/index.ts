// Core utility hooks
export { useActiveProfileId } from './useActiveProfileId';
export { useDebouncedValue } from './useDebouncedValue';
export { useObserveQuery } from './useObserveQuery';
export { useProgressCalculations } from './useProgressCalculations';

// Generic patterns and factories
export { createCrudHooks, type CrudHooks, type CrudService } from './useCrudHooks';

// Advanced optimization hooks (Phase 3)
export {
  type CacheInvalidationPattern,
  type CacheOptimizationOptions,
  createCacheInvalidationPattern,
  useAggregateCache,
} from './useAggregateCache';
export {
  type OptimizedQueryOptions,
  type OptimizedQueryResult,
  useOptimizedInfiniteQuery,
  useOptimizedQuery,
} from './useOptimizedQuery';
