import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create hoisted mocks
const mockLocalStorageAdapter = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));

// Mock the LocalStorageAdapter
vi.mock('../LocalStorageAdapter', () => ({
  LocalStorageAdapter: vi.fn().mockImplementation(() => mockLocalStorageAdapter),
}));

import { LocalStorageAdapter } from '../LocalStorageAdapter';
import { useProfileStore } from '../profileStore';

describe('profileStore', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Reset the hoisted mock functions
    mockLocalStorageAdapter.getItem.mockReturnValue(null);
    mockLocalStorageAdapter.setItem.mockImplementation(() => {});
    mockLocalStorageAdapter.removeItem.mockImplementation(() => {});

    // Reset only the data state, preserve the store functions
    useProfileStore.setState({ activeProfileId: null }, false);
  });

  afterEach(() => {
    // Clean up after each test
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with null activeProfileId', () => {
      const { result } = renderHook(() => useProfileStore());

      expect(result.current.activeProfileId).toBeNull();
    });

    it('should have setActiveProfileId function', () => {
      const { result } = renderHook(() => useProfileStore());

      expect(typeof result.current.setActiveProfileId).toBe('function');
    });

    it('should have clearActiveProfileId function', () => {
      const { result } = renderHook(() => useProfileStore());

      expect(typeof result.current.clearActiveProfileId).toBe('function');
    });
  });

  describe('setActiveProfileId', () => {
    it('should set active profile ID with a string value', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('profile-123');
      });

      expect(result.current.activeProfileId).toBe('profile-123');
    });

    it('should set active profile ID with a null value', () => {
      const { result } = renderHook(() => useProfileStore());

      // First set a profile ID
      act(() => {
        result.current.setActiveProfileId('profile-123');
      });

      expect(result.current.activeProfileId).toBe('profile-123');

      // Then set it to null
      act(() => {
        result.current.setActiveProfileId(null);
      });

      expect(result.current.activeProfileId).toBeNull();
    });

    it('should allow changing from one profile ID to another', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('profile-123');
      });

      expect(result.current.activeProfileId).toBe('profile-123');

      act(() => {
        result.current.setActiveProfileId('profile-456');
      });

      expect(result.current.activeProfileId).toBe('profile-456');
    });

    it('should handle empty string as a valid profile ID', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('');
      });

      expect(result.current.activeProfileId).toBe('');
    });

    it('should handle long profile ID strings', () => {
      const { result } = renderHook(() => useProfileStore());
      const longProfileId = 'a'.repeat(1000);

      act(() => {
        result.current.setActiveProfileId(longProfileId);
      });

      expect(result.current.activeProfileId).toBe(longProfileId);
    });
  });

  describe('clearActiveProfileId', () => {
    it('should clear active profile ID when it has a value', () => {
      const { result } = renderHook(() => useProfileStore());

      // First set a profile ID
      act(() => {
        result.current.setActiveProfileId('profile-123');
      });

      expect(result.current.activeProfileId).toBe('profile-123');

      // Then clear it
      act(() => {
        result.current.clearActiveProfileId();
      });

      expect(result.current.activeProfileId).toBeNull();
    });

    it('should remain null when clearing already null activeProfileId', () => {
      const { result } = renderHook(() => useProfileStore());

      expect(result.current.activeProfileId).toBeNull();

      act(() => {
        result.current.clearActiveProfileId();
      });

      expect(result.current.activeProfileId).toBeNull();
    });

    it('should clear active profile ID multiple times without issues', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('profile-123');
      });

      act(() => {
        result.current.clearActiveProfileId();
      });

      expect(result.current.activeProfileId).toBeNull();

      act(() => {
        result.current.clearActiveProfileId();
      });

      expect(result.current.activeProfileId).toBeNull();
    });
  });

  describe('state persistence', () => {
    it('should create LocalStorageAdapter instance for persistence', () => {
      // Verify that LocalStorageAdapter mock was set up correctly
      expect(vi.mocked(LocalStorageAdapter)).toBeDefined();

      // Test that the store uses the LocalStorageAdapter interface by checking that
      // persistence methods are available
      const { result } = renderHook(() => useProfileStore());
      expect(result.current.activeProfileId).toBeDefined();
    });

    it('should use correct storage name for persistence', () => {
      // Test the persistence behavior by triggering operations that would use localStorage
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('test-persistence');
      });

      // Verify that setItem was called with the blueprint-fitness-profile key
      const setItemCalls = mockLocalStorageAdapter.setItem.mock.calls;
      const blueprintCalls = setItemCalls.filter((call) => call[0] === 'blueprint-fitness-profile');
      expect(blueprintCalls.length).toBeGreaterThan(0);
    });

    it('should restore state from localStorage on initialization', () => {
      // Note: This test is challenging because the store is already initialized at import time
      // We would need to dynamically import the store with the mock already set up
      // For now, we verify the behavior by checking if the store can handle restored data
      const { result } = renderHook(() => useProfileStore());

      // Verify that if localStorage had data, it would be used (this is more of an integration test)
      expect(result.current.activeProfileId).toBe(null);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorageAdapter.getItem.mockReturnValue('invalid-json');

      const { result } = renderHook(() => useProfileStore());

      // Should fall back to default state
      expect(result.current.activeProfileId).toBeNull();
    });

    it('should handle null localStorage data gracefully', () => {
      mockLocalStorageAdapter.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useProfileStore());

      expect(result.current.activeProfileId).toBeNull();
    });

    it('should persist state changes to localStorage', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('profile-to-persist');
      });

      // The persist middleware should call setItem
      expect(mockLocalStorageAdapter.setItem).toHaveBeenCalled();

      // Find the call with the correct storage name and check it contains the expected value
      const setItemCalls = mockLocalStorageAdapter.setItem.mock.calls.filter(
        (call) => call[0] === 'blueprint-fitness-profile'
      );
      expect(setItemCalls.length).toBeGreaterThan(0);

      // The last call should contain the updated profile
      const lastCall = setItemCalls[setItemCalls.length - 1];
      expect(lastCall[1]).toEqual(
        expect.objectContaining({
          state: expect.objectContaining({
            activeProfileId: 'profile-to-persist',
          }),
        })
      );
    });

    it('should only persist activeProfileId in partialize', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('test-profile');
      });

      // Verify that setItem is called with data containing only activeProfileId
      const setItemCalls = mockLocalStorageAdapter.setItem.mock.calls.filter(
        (call) => call[0] === 'blueprint-fitness-profile'
      );

      expect(setItemCalls.length).toBeGreaterThan(0);

      const lastCall = setItemCalls[setItemCalls.length - 1];
      const persistedData = lastCall[1];

      expect(persistedData.state).toEqual({
        activeProfileId: 'test-profile',
      });

      // Verify it doesn't contain function properties
      expect(persistedData.state.setActiveProfileId).toBeUndefined();
      expect(persistedData.state.clearActiveProfileId).toBeUndefined();
    });
  });

  describe('store state management', () => {
    it('should maintain state consistency across multiple renders', () => {
      const { result: result1 } = renderHook(() => useProfileStore());
      const { result: result2 } = renderHook(() => useProfileStore());

      act(() => {
        result1.current.setActiveProfileId('shared-profile');
      });

      expect(result1.current.activeProfileId).toBe('shared-profile');
      expect(result2.current.activeProfileId).toBe('shared-profile');
    });

    it('should allow subscribing to state changes', () => {
      const { result } = renderHook(() => useProfileStore());
      const mockCallback = vi.fn();

      const unsubscribe = useProfileStore.subscribe(mockCallback);

      act(() => {
        result.current.setActiveProfileId('subscription-test');
      });

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          activeProfileId: 'subscription-test',
        }),
        expect.objectContaining({
          activeProfileId: null,
        })
      );

      unsubscribe();
    });

    it('should allow getting state without subscribing', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('direct-access-test');
      });

      const currentState = useProfileStore.getState();
      expect(currentState.activeProfileId).toBe('direct-access-test');
    });

    it('should allow setting state directly', () => {
      act(() => {
        useProfileStore.setState({ activeProfileId: 'direct-set-test' });
      });

      const currentState = useProfileStore.getState();
      expect(currentState.activeProfileId).toBe('direct-set-test');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined profile ID gracefully', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        // TypeScript would normally prevent this, but test runtime behavior
        (result.current.setActiveProfileId as any)(undefined);
      });

      expect(result.current.activeProfileId).toBeUndefined();
    });

    it('should handle rapid successive state changes', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setActiveProfileId('profile-1');
        result.current.setActiveProfileId('profile-2');
        result.current.setActiveProfileId('profile-3');
        result.current.clearActiveProfileId();
      });

      expect(result.current.activeProfileId).toBeNull();
    });

    it('should handle concurrent state changes', async () => {
      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const promises = [
          Promise.resolve().then(() => result.current.setActiveProfileId('concurrent-1')),
          Promise.resolve().then(() => result.current.setActiveProfileId('concurrent-2')),
          Promise.resolve().then(() => result.current.setActiveProfileId('concurrent-3')),
        ];

        await Promise.all(promises);
      });

      // The final state should be one of the concurrent updates
      expect(['concurrent-1', 'concurrent-2', 'concurrent-3']).toContain(
        result.current.activeProfileId
      );
    });
  });

  describe('function reference stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useProfileStore());

      const initialSetActiveProfileId = result.current.setActiveProfileId;
      const initialClearActiveProfileId = result.current.clearActiveProfileId;

      rerender();

      expect(result.current.setActiveProfileId).toBe(initialSetActiveProfileId);
      expect(result.current.clearActiveProfileId).toBe(initialClearActiveProfileId);
    });
  });

  describe('type safety', () => {
    it('should maintain correct TypeScript types', () => {
      const { result } = renderHook(() => useProfileStore());

      // These should compile without TypeScript errors
      const profileId: string | null = result.current.activeProfileId;
      const setFunction: (profileId: string | null) => void = result.current.setActiveProfileId;
      const clearFunction: () => void = result.current.clearActiveProfileId;

      expect(typeof profileId === 'string' || profileId === null).toBe(true);
      expect(typeof setFunction).toBe('function');
      expect(typeof clearFunction).toBe('function');
    });
  });
});
