import { useEffect, useState } from 'react';

/* global setTimeout, clearTimeout */

/**
 * A generic hook that debounces a value, delaying updates until after the specified delay.
 *
 * This hook is useful for optimizing performance in scenarios where you want to delay
 * expensive operations (like API calls or complex computations) until the user has
 * stopped changing a value for a certain period of time.
 *
 * @template T The type of the value being debounced
 * @param value The value to debounce
 * @param delay The delay in milliseconds before updating the debounced value
 * @returns The debounced value that updates only after the delay period
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
 *
 * // Only triggers search when user stops typing for 300ms
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
