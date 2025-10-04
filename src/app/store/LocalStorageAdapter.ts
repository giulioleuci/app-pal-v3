import type { StateStorage } from 'zustand/middleware';

/**
 * Custom storage adapter for Zustand's persist middleware that wraps localStorage
 * with proper error handling and JSON serialization.
 *
 * This abstraction allows for easier testing and potential future migration to
 * different storage backends (e.g., AsyncStorage, IndexedDB, etc.).
 */
export class LocalStorageAdapter implements StateStorage {
  /**
   * Retrieves and parses a value from localStorage
   */
  getItem(name: string): string | null {
    try {
      const item = localStorage.getItem(name);
      return item;
    } catch (_error) {
      console.warn(`Failed to get item "${name}" from localStorage:`, _error);
      return null;
    }
  }

  /**
   * Serializes and stores a value in localStorage
   */
  setItem(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
    } catch (_error) {
      console.warn(`Failed to set item "${name}" in localStorage:`, _error);
    }
  }

  /**
   * Removes an item from localStorage
   */
  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch (_error) {
      console.warn(`Failed to remove item "${name}" from localStorage:`, _error);
    }
  }
}
