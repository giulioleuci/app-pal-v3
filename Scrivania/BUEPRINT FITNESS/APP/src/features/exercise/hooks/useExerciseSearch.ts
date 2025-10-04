import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { container } from 'tsyringe';

import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { useOptimizedQuery } from '@/shared/hooks/useOptimizedQuery';
import type { ExerciseData } from '@/shared/types';
import { exercisesToDomain } from '@/shared/utils/transformations';

export interface ExerciseFilters {
  muscleGroups?: string[];
  equipment?: string[];
  difficulty?: string[];
  category?: string;
  isFavorite?: boolean;
}

/**
 * Exercise search, filtering, and discovery functionality.
 *
 * Provides debounced search, instant filtering, and exercise discovery
 * features with optimized performance for large datasets.
 *
 * @param profileId - The profile ID to scope searches
 * @returns Search and filtering capabilities
 */
export function useExerciseSearch(
  initialQuery: string = '',
  initialFilters: ExerciseFilters = {},
  profileId: string
) {
  const queryService = container.resolve(ExerciseQueryService);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<ExerciseFilters>(initialFilters);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounced search query for API calls
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (query && query.length > 2 && !recentSearches.includes(query)) {
          setRecentSearches((prev) => [query, ...prev.slice(0, 9)]);
        }
      }, 300),
    [recentSearches]
  );

  // Search results with debouncing
  const {
    data: searchResults = [],
    isLoading: isSearching,
    error: searchError,
  } = useOptimizedQuery({
    queryKey: ['exercises', profileId, 'search', searchQuery, filters],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const searchResultsQuery = queryService.searchExercises(profileId, searchQuery);
      const { data } = useObserveQuery(searchResultsQuery, {
        transform: exercisesToDomain,
      });

      return data || [];
    },
    enabled: !!profileId && searchQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: useCallback(
      (data: ExerciseData[]) => {
        let filtered = data;

        // Apply filters
        if (filters.muscleGroups?.length) {
          filtered = filtered.filter((ex) =>
            filters.muscleGroups!.some((mg) => ex.primaryMuscleGroups?.includes(mg))
          );
        }

        if (filters.equipment?.length) {
          filtered = filtered.filter((ex) => filters.equipment!.includes(ex.equipment));
        }

        if (filters.difficulty?.length) {
          filtered = filtered.filter((ex) => filters.difficulty!.includes(ex.difficulty));
        }

        if (filters.category) {
          filtered = filtered.filter((ex) => ex.category === filters.category);
        }

        // Limit results for performance
        return filtered.slice(0, 50);
      },
      [filters]
    ),
  });

  // Instant search for quick filtering of cached data
  const instantSearch = useCallback((query: string, data: ExerciseData[] = []) => {
    if (!query || query.length < 1) return data;

    const lowercaseQuery = query.toLowerCase();
    return data.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(lowercaseQuery) ||
        exercise.description?.toLowerCase().includes(lowercaseQuery) ||
        exercise.primaryMuscleGroups?.some((mg) => mg.toLowerCase().includes(lowercaseQuery))
    );
  }, []);

  // Find similar exercises based on muscle groups and equipment
  const findSimilarExercises = useQuery({
    queryKey: ['exercises', profileId, 'similar'],
    queryFn: async () => {
      // This would ideally use a more sophisticated similarity algorithm
      const allExercisesQuery = queryService.getAllExercises(profileId);
      const { data } = useObserveQuery(allExercisesQuery, {
        transform: exercisesToDomain,
      });
      return data || [];
    },
    enabled: !!profileId,
    select: useCallback((exercises: ExerciseData[]) => {
      return (targetExercise: ExerciseData) => {
        return exercises
          .filter((ex) => ex.id !== targetExercise.id)
          .filter((ex) => {
            // Same primary muscle groups
            const sharedMuscles = ex.primaryMuscleGroups?.filter((mg) =>
              targetExercise.primaryMuscleGroups?.includes(mg)
            );
            // Same equipment or similar difficulty
            const sameEquipment = ex.equipment === targetExercise.equipment;
            const similarDifficulty = ex.difficulty === targetExercise.difficulty;

            return (
              (sharedMuscles && sharedMuscles.length > 0) || sameEquipment || similarDifficulty
            );
          })
          .slice(0, 10);
      };
    }, []),
  });

  // Advanced filtering function
  const applyFilters = useCallback((data: ExerciseData[], filterCriteria: ExerciseFilters) => {
    let result = [...data];

    if (filterCriteria.muscleGroups?.length) {
      result = result.filter((ex) =>
        filterCriteria.muscleGroups!.some(
          (mg) => ex.primaryMuscleGroups?.includes(mg) || ex.secondaryMuscleGroups?.includes(mg)
        )
      );
    }

    if (filterCriteria.equipment?.length) {
      result = result.filter((ex) => filterCriteria.equipment!.includes(ex.equipment));
    }

    if (filterCriteria.difficulty?.length) {
      result = result.filter((ex) => filterCriteria.difficulty!.includes(ex.difficulty));
    }

    if (filterCriteria.category) {
      result = result.filter((ex) => ex.category === filterCriteria.category);
    }

    return result;
  }, []);

  // Search function with query update
  const search = useCallback(
    (query: string, filterCriteria?: ExerciseFilters) => {
      setSearchQuery(query);
      if (filterCriteria) {
        setFilters(filterCriteria);
      }
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({});
  }, []);

  return {
    // Test-expected interface
    exercises: searchResults,
    totalCount: searchResults.length,
    isLoading: isSearching,

    // Current search state
    searchQuery,
    filters,
    recentSearches,

    // Search results (original)
    searchResults,

    // Loading states (original)
    isSearching,

    // Error states
    searchError,

    // Search operations
    search,
    clearSearch,
    setFilters,

    // Utility functions
    instantSearch,
    applyFilters,
    findSimilar: findSimilarExercises.data || (() => []),

    // Quick access
    hasActiveSearch: searchQuery.length >= 2,
    isEmpty: searchResults.length === 0 && searchQuery.length >= 2,
  };
}

export type UseExerciseSearchResult = ReturnType<typeof useExerciseSearch>;
