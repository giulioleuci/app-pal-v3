import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

/**
 * Cache invalidation patterns for aggregate hooks
 */
export interface CacheInvalidationPattern {
  /** Exact query keys to invalidate */
  exact?: unknown[][];
  /** Query key patterns to match (partial matching) */
  patterns?: unknown[][];
  /** Predicate function for custom matching */
  predicate?: (queryKey: unknown[]) => boolean;
}

/**
 * Cache optimization strategies
 */
export interface CacheOptimizationOptions {
  /** Enable intelligent prefetching */
  prefetch?: boolean;
  /** Cache warming strategies */
  warmCache?: {
    keys: unknown[][];
    priority: 'low' | 'medium' | 'high';
  };
  /** Background refresh intervals */
  backgroundRefresh?: {
    interval: number;
    staggerDelay?: number;
  };
}

/**
 * Simple cache management interface for backward compatibility
 */
export interface SimpleCacheInterface {
  warmCache: (keys: unknown[][]) => Promise<void>;
  invalidatePattern: (pattern: unknown[]) => void;
}

/**
 * Simplified cache management hook for aggregate hooks (backward compatible).
 *
 * Provides a simple interface for cache warming and pattern-based invalidation
 * while maintaining compatibility with existing aggregate implementations.
 *
 * @returns Simple cache management interface
 */
export function useAggregateCache(): SimpleCacheInterface {
  const queryClient = useQueryClient();

  const warmCache = useCallback(
    async (keys: unknown[][]) => {
      for (const key of keys) {
        const existingData = queryClient.getQueryData(key);
        if (!existingData) {
          // Attempt to prefetch if no data exists
          queryClient.prefetchQuery({
            queryKey: key,
            queryFn: () => Promise.resolve(null),
            staleTime: 5 * 60 * 1000,
          });
        }
      }
    },
    [queryClient]
  );

  const invalidatePattern = useCallback(
    (pattern: unknown[]) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return pattern.every(
            (part, index) => index < queryKey.length && queryKey[index] === part
          );
        },
      });
    },
    [queryClient]
  );

  return { warmCache, invalidatePattern };
}

/**
 * Advanced cache management hook for aggregate hooks.
 *
 * This hook provides sophisticated cache management capabilities specifically designed
 * for aggregate hooks that manage multiple related queries. It offers:
 * - Intelligent cache invalidation with pattern matching
 * - Coordinated cache updates across related queries
 * - Performance-optimized prefetching strategies
 * - Cache warming and background refresh capabilities
 *
 * @param featureName - Name of the feature for cache organization
 * @param options - Cache optimization options
 * @returns Cache management interface
 */
export function useAdvancedAggregateCache(
  featureName: string,
  options: CacheOptimizationOptions = {}
) {
  const queryClient = useQueryClient();

  // Generate feature-scoped cache keys
  const generateCacheKey = useCallback(
    (operation: string, ...params: unknown[]) => {
      return [featureName, operation, ...params];
    },
    [featureName]
  );

  // Intelligent cache invalidation
  const invalidateByPattern = useCallback(
    async (pattern: CacheInvalidationPattern) => {
      const promises: Promise<void>[] = [];

      // Invalidate exact matches
      if (pattern.exact) {
        promises.push(
          ...pattern.exact.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );
      }

      // Invalidate pattern matches
      if (pattern.patterns) {
        promises.push(
          ...pattern.patterns.map((keyPattern) =>
            queryClient.invalidateQueries({
              predicate: (query) => {
                const queryKey = query.queryKey;
                return keyPattern.every((part, index) =>
                  index >= queryKey.length ? false : queryKey[index] === part
                );
              },
            })
          )
        );
      }

      // Invalidate using custom predicate
      if (pattern.predicate) {
        promises.push(
          queryClient.invalidateQueries({
            predicate: (query) => pattern.predicate!(query.queryKey),
          })
        );
      }

      await Promise.all(promises);
    },
    [queryClient]
  );

  // Coordinated cache updates
  const updateMultipleQueries = useCallback(
    (
      updates: Array<{
        queryKey: unknown[];
        data: unknown;
        exact?: boolean;
      }>
    ) => {
      updates.forEach(({ queryKey, data, exact = true }) => {
        if (exact) {
          queryClient.setQueryData(queryKey, data);
        } else {
          // Update all queries that match the partial key
          queryClient.setQueriesData({ queryKey: queryKey.slice(0, -1) }, (oldData) => {
            // Custom merge logic would go here
            return { ...oldData, ...data };
          });
        }
      });
    },
    [queryClient]
  );

  // Smart prefetching based on usage patterns
  const prefetchRelated = useCallback(
    async (
      baseKey: unknown[],
      relatedQueries: Array<{
        key: unknown[];
        fetchFn: () => Promise<unknown>;
        priority?: 'low' | 'medium' | 'high';
      }>
    ) => {
      // Sort by priority
      const sortedQueries = relatedQueries.sort((a, b) => {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[b.priority || 'medium'] - priorities[a.priority || 'medium'];
      });

      // Stagger prefetch operations to avoid overwhelming the system
      for (let i = 0; i < sortedQueries.length; i++) {
        const { key, fetchFn, priority } = sortedQueries[i];

        // Higher priority queries get prefetched immediately
        const delay = priority === 'high' ? 0 : (i + 1) * 100;

        setTimeout(() => {
          queryClient.prefetchQuery({
            queryKey: key,
            queryFn: fetchFn,
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
        }, delay);
      }
    },
    [queryClient]
  );

  // Cache warming strategies
  const warmCache = useCallback(async () => {
    if (!options.warmCache) return;

    const { keys, priority } = options.warmCache;
    const staggerDelay = priority === 'high' ? 50 : priority === 'medium' ? 100 : 200;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      setTimeout(() => {
        // Only warm cache if data doesn't exist
        const existingData = queryClient.getQueryData(key);
        if (!existingData) {
          queryClient.prefetchQuery({
            queryKey: key,
            queryFn: () => Promise.resolve(null), // Placeholder - real implementation would fetch
            staleTime: 10 * 60 * 1000,
          });
        }
      }, i * staggerDelay);
    }
  }, [queryClient, options.warmCache]);

  // Background refresh for critical data
  const setupBackgroundRefresh = useCallback(() => {
    if (!options.backgroundRefresh) return () => {};

    const { interval, staggerDelay = 1000 } = options.backgroundRefresh;

    const refreshQueries = () => {
      const allQueries = queryClient.getQueryCache().getAll();
      const featureQueries = allQueries.filter(
        (query) => Array.isArray(query.queryKey) && query.queryKey[0] === featureName
      );

      featureQueries.forEach((query, index) => {
        setTimeout(() => {
          if (query.state.data && query.state.isStale) {
            queryClient.invalidateQueries({ queryKey: query.queryKey });
          }
        }, index * staggerDelay);
      });
    };

    const intervalId = setInterval(refreshQueries, interval);
    return () => clearInterval(intervalId);
  }, [queryClient, featureName, options.backgroundRefresh]);

  // Cache analytics and metrics
  const getCacheMetrics = useCallback(() => {
    const allQueries = queryClient.getQueryCache().getAll();
    const featureQueries = allQueries.filter(
      (query) => Array.isArray(query.queryKey) && query.queryKey[0] === featureName
    );

    const metrics = {
      totalQueries: featureQueries.length,
      staleQueries: featureQueries.filter((q) => q.state.isStale).length,
      errorQueries: featureQueries.filter((q) => q.state.isError).length,
      loadingQueries: featureQueries.filter((q) => q.state.isLoading).length,
      cachedQueries: featureQueries.filter((q) => q.state.data !== undefined).length,
      cacheHitRatio:
        featureQueries.length > 0
          ? featureQueries.filter((q) => q.state.data !== undefined).length / featureQueries.length
          : 0,
      oldestCacheTime: Math.min(...featureQueries.map((q) => q.state.dataUpdatedAt || Date.now())),
      newestCacheTime: Math.max(...featureQueries.map((q) => q.state.dataUpdatedAt || 0)),
    };

    return metrics;
  }, [queryClient, featureName]);

  // Cache optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const metrics = getCacheMetrics();
    const suggestions: string[] = [];

    if (metrics.cacheHitRatio < 0.7) {
      suggestions.push('Consider increasing stale time for better cache utilization');
    }

    if (metrics.staleQueries > metrics.totalQueries * 0.5) {
      suggestions.push('High number of stale queries - consider background refresh');
    }

    if (metrics.errorQueries > 0) {
      suggestions.push('Error queries detected - check error handling and retry logic');
    }

    const cacheAge = Date.now() - metrics.oldestCacheTime;
    if (cacheAge > 30 * 60 * 1000) {
      // 30 minutes
      suggestions.push('Old cache data detected - consider cache warming');
    }

    return suggestions;
  }, [getCacheMetrics]);

  // Memoized cache management utilities
  const cacheUtils = useMemo(
    () => ({
      generateKey: generateCacheKey,
      invalidatePattern: invalidateByPattern,
      updateMultiple: updateMultipleQueries,
      prefetchRelated,
      warmCache,
      setupBackgroundRefresh,
      getMetrics: getCacheMetrics,
      getOptimizationSuggestions,
    }),
    [
      generateCacheKey,
      invalidateByPattern,
      updateMultipleQueries,
      prefetchRelated,
      warmCache,
      setupBackgroundRefresh,
      getCacheMetrics,
      getOptimizationSuggestions,
    ]
  );

  return cacheUtils;
}

/**
 * Cache invalidation helper for common aggregate patterns
 */
export const createCacheInvalidationPattern = {
  /** Invalidate all queries for a profile */
  forProfile: (profileId: string): CacheInvalidationPattern => ({
    predicate: (queryKey) => Array.isArray(queryKey) && queryKey.includes(profileId),
  }),

  /** Invalidate queries by entity type */
  forEntityType: (entityType: string): CacheInvalidationPattern => ({
    patterns: [[entityType]],
  }),

  /** Invalidate related queries after mutation */
  afterMutation: (mutatedEntity: string, relatedEntities: string[]): CacheInvalidationPattern => ({
    patterns: [[mutatedEntity], ...relatedEntities.map((entity) => [entity])],
  }),

  /** Analytics-specific invalidation patterns */
  forAnalytics: {
    /** Invalidate all analytics for a profile */
    allForProfile: (profileId: string): CacheInvalidationPattern => ({
      predicate: (queryKey) =>
        Array.isArray(queryKey) &&
        (queryKey.includes('analysis') || queryKey.includes('analytics')) &&
        queryKey.includes(profileId),
    }),

    /** Invalidate date-range specific analytics */
    byDateRange: (profileId: string, fromDate: Date, toDate: Date): CacheInvalidationPattern => ({
      predicate: (queryKey) =>
        Array.isArray(queryKey) &&
        queryKey.includes('analysis') &&
        queryKey.includes(profileId) &&
        queryKey.some((key) => key && typeof key === 'object' && 'from' in key && 'to' in key),
    }),

    /** Invalidate volume-related analytics */
    volumeAnalytics: (profileId: string): CacheInvalidationPattern => ({
      patterns: [
        ['analysis', 'volume', profileId],
        ['analytics', 'volume', profileId],
        ['dashboard', 'volume-trends', profileId],
      ],
    }),

    /** Invalidate frequency analytics */
    frequencyAnalytics: (profileId: string): CacheInvalidationPattern => ({
      patterns: [
        ['analysis', 'frequency', profileId],
        ['analytics', 'frequency', profileId],
        ['dashboard', 'frequency-trends', profileId],
      ],
    }),
  },
};

/**
 * Performance metrics collection for cache optimization
 */
export interface CachePerformanceMetrics {
  // Query performance
  averageQueryTime: number;
  slowQueries: { queryKey: unknown[]; duration: number }[];
  fastQueries: { queryKey: unknown[]; duration: number }[];

  // Cache effectiveness
  cacheHitRate: number;
  cacheMissRate: number;
  staleCacheAccessRate: number;

  // Resource usage
  memoryFootprint: number;
  queryCount: number;
  activeQueryCount: number;

  // Optimization insights
  recommendations: string[];
  hotDataIdentifiers: unknown[][];
  coldDataIdentifiers: unknown[][];
}
