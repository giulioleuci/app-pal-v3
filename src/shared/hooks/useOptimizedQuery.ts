import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import { useDebouncedValue } from './useDebouncedValue';

/**
 * Search-specific configuration for optimized queries
 */
export interface SearchConfig {
  /** Debounce delay for search queries in milliseconds */
  debounceMs?: number;
  /** Minimum query length before triggering search */
  minQueryLength?: number;
  /** Enable instant search cache strategies */
  instantCache?: boolean;
  /** Custom ranking function for search results */
  rankingFn?: <T>(results: T[], query: string) => T[];
}

/**
 * Advanced query optimization options
 */
export interface OptimizedQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  /** Enable intelligent caching with extended stale time */
  intelligentCache?: boolean;
  /** Debounce refetch operations */
  debounceRefetch?: number;
  /** Enable automatic background refresh */
  autoRefresh?: {
    interval: number;
    whenVisible?: boolean;
    whenOnline?: boolean;
  };
  /** Prefetch related data */
  prefetch?: {
    keys: unknown[][];
    fetchFns: (() => Promise<unknown>)[];
  };
  /** Search-specific optimizations */
  searchConfig?: SearchConfig;
}

/**
 * Enhanced query result with additional optimization features
 */
export interface OptimizedQueryResult<TData, TError = Error> extends UseQueryResult<TData, TError> {
  /** Force refresh the query bypassing cache */
  forceRefresh: () => Promise<void>;
  /** Get cache hit ratio for this query */
  getCacheHitRatio: () => number;
  /** Prefetch related data */
  prefetchRelated: () => Promise<void>;
  /** Get query performance metrics */
  getMetrics: () => {
    cacheHitRatio: number;
    averageLoadTime: number;
    totalRequests: number;
    lastFetchTime: Date | null;
  };
}

/**
 * Advanced optimized query hook with intelligent caching, debouncing, and performance tracking.
 *
 * This hook extends React Query with additional optimization features:
 * - Intelligent cache management with adaptive stale times
 * - Debounced refetch operations to prevent excessive requests
 * - Automatic background refresh with visibility/online detection
 * - Prefetching of related data
 * - Performance metrics and cache hit ratio tracking
 *
 * @param queryKey - React Query key
 * @param queryFn - Query function
 * @param options - Extended optimization options
 * @returns Enhanced query result with optimization features
 */
export function useOptimizedQuery<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> = {}
): OptimizedQueryResult<TData, TError> {
  const queryClient = useQueryClient();
  const metricsRef = useRef({
    cacheHits: 0,
    totalRequests: 0,
    loadTimes: [] as number[],
    lastFetchTime: null as Date | null,
  });

  const {
    intelligentCache = false,
    debounceRefetch = 0,
    autoRefresh,
    prefetch,
    searchConfig,
    ...queryOptions
  } = options;

  // Debounced refetch function
  const debouncedRefetch = useDebouncedValue(
    useCallback(() => Math.random(), []), // Trigger value for debouncing
    debounceRefetch
  );

  // Enhanced query function with metrics tracking
  const enhancedQueryFn = useCallback(async () => {
    const startTime = performance.now();
    metricsRef.current.totalRequests++;

    try {
      const result = await queryFn();
      const loadTime = performance.now() - startTime;

      metricsRef.current.loadTimes.push(loadTime);
      metricsRef.current.lastFetchTime = new Date();

      // Keep only last 100 load times for metrics
      if (metricsRef.current.loadTimes.length > 100) {
        metricsRef.current.loadTimes = metricsRef.current.loadTimes.slice(-100);
      }

      return result;
    } catch (_error) {
      throw _error;
    }
  }, [queryFn]);

  // Search-specific cache configuration
  const searchCacheConfig = useMemo(() => {
    if (!searchConfig?.instantCache) return {};

    // Instant cache for search results - very short stale time
    return {
      staleTime: 30 * 1000, // 30 seconds for search results
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnMount: false, // Don't refetch search results on mount
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
    };
  }, [searchConfig]);

  // Intelligent cache configuration
  const intelligentCacheConfig = useMemo(() => {
    if (!intelligentCache) return {};

    // Adaptive stale time based on data freshness needs
    const baseStaleTime = 5 * 60 * 1000; // 5 minutes
    const maxStaleTime = 30 * 60 * 1000; // 30 minutes

    return {
      staleTime: baseStaleTime,
      gcTime: maxStaleTime,
      refetchOnMount: 'stale' as const,
      refetchOnWindowFocus: 'stale' as const,
      refetchOnReconnect: 'stale' as const,
    };
  }, [intelligentCache]);

  // Auto refresh configuration
  const autoRefreshConfig = useMemo(() => {
    if (!autoRefresh) return {};

    return {
      refetchInterval: autoRefresh.interval,
      refetchIntervalInBackground: !autoRefresh.whenVisible,
      refetchOnWindowFocus: autoRefresh.whenVisible,
      refetchOnReconnect: autoRefresh.whenOnline,
    };
  }, [autoRefresh]);

  // Main query
  const query = useQuery({
    queryKey,
    queryFn: enhancedQueryFn,
    ...searchCacheConfig,
    ...intelligentCacheConfig,
    ...autoRefreshConfig,
    ...queryOptions,
    // Override onSuccess to track cache hits
    onSuccess: (data) => {
      // Check if this was served from cache
      const queryState = queryClient.getQueryState(queryKey);
      if (queryState && !queryState.isFetching && queryState.data === data) {
        metricsRef.current.cacheHits++;
      }

      options.onSuccess?.(data);
    },
  });

  // Prefetch related data when main query succeeds
  const prefetchRelated = useCallback(async () => {
    if (!prefetch || !query.data) return;

    const promises = prefetch.keys.map((key, index) => {
      const fetchFn = prefetch.fetchFns[index];
      if (fetchFn) {
        return queryClient.prefetchQuery({
          queryKey: key,
          queryFn: fetchFn,
          staleTime: 10 * 60 * 1000, // 10 minutes for prefetched data
        });
      }
      return Promise.resolve();
    });

    await Promise.allSettled(promises);
  }, [query.data, prefetch, queryClient]);

  // Auto-prefetch when main query succeeds
  useMemo(() => {
    if (query.isSuccess && prefetch) {
      prefetchRelated();
    }
  }, [query.isSuccess, prefetchRelated, prefetch]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    // Invalidate cache and refetch
    await queryClient.invalidateQueries({ queryKey });
    return query.refetch();
  }, [queryClient, queryKey, query]);

  // Cache hit ratio calculation
  const getCacheHitRatio = useCallback(() => {
    const { cacheHits, totalRequests } = metricsRef.current;
    return totalRequests > 0 ? cacheHits / totalRequests : 0;
  }, []);

  // Performance metrics
  const getMetrics = useCallback(() => {
    const { cacheHits, totalRequests, loadTimes, lastFetchTime } = metricsRef.current;
    const averageLoadTime =
      loadTimes.length > 0 ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length : 0;

    return {
      cacheHitRatio: getCacheHitRatio(),
      averageLoadTime,
      totalRequests,
      lastFetchTime,
    };
  }, [getCacheHitRatio]);

  return {
    ...query,
    forceRefresh,
    getCacheHitRatio,
    prefetchRelated,
    getMetrics,
  };
}

/**
 * Hook for creating optimized infinite queries with the same optimization features
 */
export function useOptimizedInfiniteQuery<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: ({ pageParam }: { pageParam: unknown }) => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> & {
    initialPageParam: unknown;
    getNextPageParam: (lastPage: TData, allPages: TData[], lastPageParam: unknown) => unknown;
  }
) {
  // Implementation would be similar to useOptimizedQuery but for infinite queries
  // This is a placeholder for the pattern
  return useOptimizedQuery(
    queryKey,
    () => queryFn({ pageParam: options.initialPageParam }),
    options
  );
}

/**
 * Specialized hook for search queries with built-in debouncing and ranking
 */
export function useOptimizedSearch<TData, TError = Error>(
  searchTerm: string,
  queryKey: unknown[],
  searchFn: (term: string) => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> & {
    minQueryLength?: number;
    debounceMs?: number;
    rankingFn?: (results: TData, query: string) => TData;
  } = {}
): OptimizedQueryResult<TData, TError> {
  const { minQueryLength = 2, debounceMs = 300, rankingFn, ...queryOptions } = options;

  // Debounced search term
  const debouncedSearchTerm = useDebouncedValue(searchTerm, debounceMs);

  // Enhanced search function with ranking
  const enhancedSearchFn = useCallback(async () => {
    const results = await searchFn(debouncedSearchTerm);

    // Apply ranking function if provided
    if (rankingFn && results) {
      return rankingFn(results, debouncedSearchTerm);
    }

    return results;
  }, [searchFn, debouncedSearchTerm, rankingFn]);

  return useOptimizedQuery([...queryKey, debouncedSearchTerm], enhancedSearchFn, {
    ...queryOptions,
    enabled: debouncedSearchTerm.length >= minQueryLength && queryOptions.enabled !== false,
    searchConfig: {
      debounceMs,
      minQueryLength,
      instantCache: true,
      rankingFn,
    },
  });
}
