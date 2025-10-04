import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { container } from 'tsyringe';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { exercisesToDomain } from '@/shared/utils/transformations';

interface CacheEntry {
  data: ExerciseModel[];
  lastUpdated: Date;
  accessCount: number;
  lastAccessed: Date;
}

interface SearchCacheEntry {
  query: string;
  results: ExerciseModel[];
  lastUpdated: Date;
}

interface UseCachedExerciseDataResult {
  exercises: ExerciseModel[];
  getExercise: (id: string) => ExerciseModel | undefined;
  searchCache: (query: string) => ExerciseModel[];
  updateCache: () => Promise<void>;
  cacheAge: number; // in minutes
  cacheHitRate: number;
  clearCache: () => void;
  preloadExercise: (id: string) => Promise<ExerciseModel | null>;
}

/**
 * Hook for intelligent caching layer over existing exercise hooks.
 *
 * Provides performance optimization for frequently accessed exercise data by
 * implementing smart caching strategies. Reduces database queries in exercise
 * selection components and improves user experience with faster data access.
 *
 * @param profileId The profile ID to cache exercise data for
 * @param maxCacheAge Maximum cache age in minutes (default: 30)
 * @returns Object with cached data and cache management functions
 *
 * @example
 * ```typescript
 * const {
 *   exercises,
 *   getExercise,
 *   searchCache,
 *   cacheAge,
 *   cacheHitRate
 * } = useCachedExerciseData(profileId, 15);
 *
 * // Get exercise by ID (cached)
 * const exercise = getExercise(exerciseId);
 *
 * // Search exercises (cached)
 * const searchResults = searchCache('bench press');
 *
 * return (
 *   <Box>
 *     <Typography variant="caption">
 *       Cache Age: {cacheAge}m | Hit Rate: {cacheHitRate}%
 *     </Typography>
 *     <ExerciseSelector exercises={exercises} />
 *   </Box>
 * );
 * ```
 */
export function useCachedExerciseData(
  profileId: string,
  maxCacheAge: number = 30
): UseCachedExerciseDataResult {
  const exerciseQueryService = container.resolve(ExerciseQueryService);

  // Cache state
  const [cache, setCache] = useState<CacheEntry | null>(null);
  const [searchCache, setSearchCache] = useState<Map<string, SearchCacheEntry>>(new Map());

  // Performance metrics (using refs for tracking, separate state for triggering updates)
  const cacheHitsRef = useRef(0);
  const cacheRequestsRef = useRef(0);
  const [metricsVersion, setMetricsVersion] = useState(0);
  const exerciseMapRef = useRef<Map<string, ExerciseModel>>(new Map());

  // Get exercises from the database (reactive)
  const exercisesQuery = profileId ? exerciseQueryService.getAllExercises(profileId) : null;
  const { data: freshExercises, isObserving } = useObserveQuery(exercisesQuery, {
    transform: exercisesToDomain,
    enabled: !!profileId,
  });

  // Update cache when fresh data arrives
  useEffect(() => {
    if (freshExercises && freshExercises.length > 0) {
      const now = new Date();

      setCache({
        data: freshExercises,
        lastUpdated: now,
        accessCount: cache?.accessCount || 0,
        lastAccessed: now,
      });

      // Update exercise map for O(1) lookups
      const newMap = new Map<string, ExerciseModel>();
      freshExercises.forEach((exercise) => {
        newMap.set(exercise.id, exercise);
      });
      exerciseMapRef.current = newMap;

      // Clear search cache when base data changes
      setSearchCache(new Map());
    }
  }, [freshExercises]);

  // Calculate cache age in minutes
  const cacheAge = useMemo(() => {
    if (!cache) return 0;
    return Math.floor((Date.now() - cache.lastUpdated.getTime()) / (1000 * 60));
  }, [cache]);

  // Calculate cache hit rate
  const cacheHitRate = useMemo(() => {
    // Depend on metricsVersion to force recalculation when metrics change
    if (cacheRequestsRef.current === 0) return 0;
    return Math.round((cacheHitsRef.current / cacheRequestsRef.current) * 100);
  }, [metricsVersion]);

  // Check if cache is valid
  const isCacheValid = useMemo(() => {
    return cache && cacheAge < maxCacheAge;
  }, [cache, cacheAge, maxCacheAge]);

  // Get cached exercises or fall back to fresh data
  const exercises = useMemo(() => {
    if (isCacheValid && cache) {
      return cache.data;
    }
    return freshExercises || [];
  }, [isCacheValid, cache, freshExercises]);

  // Track cache access metrics
  const trackCacheAccess = useCallback((isHit: boolean) => {
    cacheRequestsRef.current += 1;
    if (isHit) {
      cacheHitsRef.current += 1;
      // Update cache access count without triggering re-renders
      setCache((prev) =>
        prev
          ? {
              ...prev,
              accessCount: prev.accessCount + 1,
              lastAccessed: new Date(),
            }
          : null
      );
    }
    // Trigger metrics recalculation
    setMetricsVersion((prev) => prev + 1);
  }, []);

  /**
   * Gets a specific exercise by ID using cached data
   */
  const getExercise = useCallback(
    (id: string): ExerciseModel | undefined => {
      // Try cache first
      const cachedExercise = exerciseMapRef.current.get(id);
      if (cachedExercise) {
        trackCacheAccess(true);
        return cachedExercise;
      }

      trackCacheAccess(false);
      // Fallback to linear search in current exercises
      return exercises.find((exercise) => exercise.id === id);
    },
    [exercises, trackCacheAccess]
  );

  /**
   * Searches exercises using cached results
   */
  const searchCachedExercises = useCallback(
    (query: string): ExerciseModel[] => {
      if (!query.trim()) {
        return exercises;
      }

      const normalizedQuery = query.toLowerCase().trim();

      // Check search cache first
      const cachedSearch = searchCache.get(normalizedQuery);
      if (
        cachedSearch &&
        Date.now() - cachedSearch.lastUpdated.getTime() < maxCacheAge * 60 * 1000
      ) {
        trackCacheAccess(true);
        return cachedSearch.results;
      }

      // Cache miss for search
      trackCacheAccess(false);

      // Perform search and cache results
      const results = exercises.filter((exercise) => {
        return (
          exercise.name.toLowerCase().includes(normalizedQuery) ||
          (exercise.description && exercise.description.toLowerCase().includes(normalizedQuery)) ||
          (exercise.alternativeNames &&
            exercise.alternativeNames.some((name) =>
              name.toLowerCase().includes(normalizedQuery)
            )) ||
          (exercise.muscleGroups &&
            exercise.muscleGroups.some((group) => group.toLowerCase().includes(normalizedQuery)))
        );
      });

      // Cache the search results
      setSearchCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(normalizedQuery, {
          query: normalizedQuery,
          results,
          lastUpdated: new Date(),
        });

        // Limit search cache size (keep last 20 searches)
        if (newCache.size > 20) {
          const oldestKey = Array.from(newCache.keys())[0];
          newCache.delete(oldestKey);
        }

        return newCache;
      });

      return results;
    },
    [exercises, searchCache, maxCacheAge, trackCacheAccess]
  );

  /**
   * Forces a cache update by fetching fresh data
   */
  const updateCache = useCallback(async (): Promise<void> => {
    if (!profileId) return;

    try {
      // This would trigger a fresh fetch - in our case, the reactive query handles this
      // For manual updates, we could call the query service directly
      const freshData = await exerciseQueryService.getAllExercises(profileId).fetch();
      const transformedData = exercisesToDomain(freshData);

      const now = new Date();
      setCache({
        data: transformedData,
        lastUpdated: now,
        accessCount: 0,
        lastAccessed: now,
      });

      // Update exercise map
      const newMap = new Map<string, ExerciseModel>();
      transformedData.forEach((exercise) => {
        newMap.set(exercise.id, exercise);
      });
      exerciseMapRef.current = newMap;

      // Clear search cache
      setSearchCache(new Map());
    } catch (_error) {
      console.error('Error updating exercise cache:', _error);
    }
  }, [profileId, exerciseQueryService]);

  /**
   * Clears all cached data
   */
  const clearCache = useCallback(() => {
    setCache(null);
    setSearchCache(new Map());
    exerciseMapRef.current.clear();
    cacheHitsRef.current = 0;
    cacheRequestsRef.current = 0;
    setMetricsVersion((prev) => prev + 1);
  }, []);

  /**
   * Preloads a specific exercise into cache
   */
  const preloadExercise = useCallback(
    async (id: string): Promise<ExerciseModel | null> => {
      try {
        // Check if already cached
        const cached = exerciseMapRef.current.get(id);
        if (cached) {
          return cached;
        }

        // Fetch specific exercise
        const exerciseData = await exerciseQueryService.getExerciseById(id).fetch();
        const transformedExercise = exercisesToDomain(exerciseData);

        if (transformedExercise.length > 0) {
          const exercise = transformedExercise[0];

          // Add to cache map
          exerciseMapRef.current.set(id, exercise);

          // Add to main cache if it exists
          if (cache) {
            setCache((prev) =>
              prev
                ? {
                    ...prev,
                    data: [...prev.data.filter((ex) => ex.id !== id), exercise],
                    lastUpdated: new Date(),
                  }
                : null
            );
          }

          return exercise;
        }

        return null;
      } catch (_error) {
        console.error('Error preloading exercise:', _error);
        return null;
      }
    },
    [cache, exerciseQueryService]
  );

  return {
    exercises,
    getExercise,
    searchCache: searchCachedExercises,
    updateCache,
    cacheAge,
    cacheHitRate,
    clearCache,
    preloadExercise,
  };
}
