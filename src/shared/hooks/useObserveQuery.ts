import { Model, Query } from '@nozbe/watermelondb';
import { useCallback, useRef, useSyncExternalStore } from 'react';

// Stable empty array reference to avoid infinite loops
const EMPTY_ARRAY: any[] = [];

/**
 * Configuration options for the useObserveQuery hook
 */
interface UseObserveQueryOptions<T> {
  /**
   * Transform function to convert WatermelonDB models to domain format
   * This maintains separation between persistence layer (WatermelonDB models)
   * and domain layer (domain models)
   */
  transform?: (models: Model[]) => T[];

  /**
   * Enable/disable the query observation
   * When false, the hook will return an empty array and won't subscribe to changes
   */
  enabled?: boolean;
}

/**
 * Result object returned by the useObserveQuery hook
 */
interface UseObserveQueryResult<T> {
  /** The current query results */
  data: T[];
  /** Whether the query is currently enabled and active */
  isObserving: boolean;
}

/**
 * A generic React hook that bridges WatermelonDB's reactive `observe()` API with React's `useSyncExternalStore`.
 *
 * This hook provides a reactive foundation for integrating WatermelonDB queries with React components,
 * automatically updating the component when the underlying data changes.
 *
 * @template T The type of objects in the result array (typically domain models)
 * @param query - WatermelonDB query to observe. If null/undefined, returns empty array
 * @param options - Configuration options including transform function and enabled flag
 *
 * @returns Object containing the current query results and observation status
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { data: profiles, isObserving } = useObserveQuery(
 *   database.get('profiles').query(),
 *   {
 *     transform: (models) => models.map(toDomainFormat),
 *     enabled: true
 *   }
 * );
 *
 * // With filtering
 * const { data: activeProfiles } = useObserveQuery(
 *   database.get('profiles').query(Q.where('is_active', true)),
 *   {
 *     transform: (models) => models.map(profileToDomain)
 *   }
 * );
 *
 * // Conditional observation
 * const { data: exercises } = useObserveQuery(
 *   profileId ? database.get('exercises').query(Q.where('profile_id', profileId)) : null,
 *   {
 *     enabled: !!profileId,
 *     transform: exerciseTransform
 *   }
 * );
 * ```
 */
export function useObserveQuery<T = Model>(
  query: Query<Model> | null | undefined,
  options: UseObserveQueryOptions<T> = {}
): UseObserveQueryResult<T> {
  const { transform, enabled = true } = options;

  // Store current data in a ref to avoid infinite loops
  const currentDataRef = useRef<T[]>([]);

  /**
   * Get the current snapshot of the query results
   */
  const getSnapshot = useCallback((): T[] => {
    if (!query || !enabled) {
      return EMPTY_ARRAY as T[];
    }
    return currentDataRef.current;
  }, [query, enabled]);

  /**
   * Get the server snapshot (same as client snapshot for local database)
   */
  const getServerSnapshot = getSnapshot;

  /**
   * Subscribe to query changes using WatermelonDB's observe() method
   */
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!query || !enabled) {
        // Return a no-op unsubscribe function
        return () => {};
      }

      let isMounted = true;

      // Subscribe to query changes using WatermelonDB's observe() method
      const subscription = query.observe().subscribe({
        next: (models: Model[]) => {
          if (!isMounted) return;

          try {
            // Transform models if transform function provided
            const transformedData = transform ? transform(models) : (models as unknown as T[]);

            // Update the ref with new data
            currentDataRef.current = transformedData;

            // Notify React of the change
            onStoreChange();
          } catch (_error) {
            console.error('useObserveQuery: Error in subscription handler:', _error);
          }
        },
        error: (error: Error) => {
          console.error('useObserveQuery: Subscription error:', error);
        },
      });

      // Return unsubscribe function
      return () => {
        isMounted = false;
        subscription.unsubscribe();
        // Reset current data ref on cleanup
        currentDataRef.current = [];
      };
    },
    [query, enabled, transform]
  );

  // Use React's useSyncExternalStore to manage the subscription
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    data,
    isObserving: !!(query && enabled),
  };
}
